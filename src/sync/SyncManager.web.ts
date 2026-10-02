import firebase from '../firebase-config';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { PurchaseRepository } from '../repositories/PurchaseRepository';
import { SystemRepository } from '../repositories/SystemRepository';
import { generateUUID } from '../utils/uuid';
import { parseTimestamp } from '../utils/dateUtils';

const sanitizeShopId = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'object') {
    const extracted = id.shopId || id.id || id.uid || '';
    return typeof extracted === 'string' ? extracted.trim() : String(extracted).trim();
  }
  const str = String(id).trim();
  if (str === 'undefined' || str === '[object Object]' || str === 'null') return '';
  return str;
};

export type SyncTarget = 'ALL' | 'PRODUCTS' | 'SALES' | 'SUPPLIERS' | 'CUSTOMERS' | 'EXPENSES' | 'PURCHASES' | 'STAFF';

export enum SyncStatus {
  Idle,
  Syncing,
  Error,
  Success
}

export class SyncManager {
  private status: SyncStatus = SyncStatus.Idle;
  private lastSynced: number = 0;
  private readonly BATCH_LIMIT = 500;
  private isNetworkListenerActive: boolean = false;
  private onDataChangedCallback: (() => void) | null = null;
  private realtimeUnsubscribers: (() => void)[] = [];
  private readonly SYNC_BUFFER_MS = 300000; // 5 minute overlap to handle clock skew during delta sync
  private readonly SYNC_COOLDOWN_MS = 60000; // 1 minute cooldown to prevent redundant firestore hits

  constructor(
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private saleRepo: SaleRepository,
    private supplierRepo: SupplierRepository,
    private customerRepo: CustomerRepository,
    private purchaseRepo: PurchaseRepository,
    private systemRepo: SystemRepository
  ) {}

  public getStatus(): SyncStatus {
    return this.status;
  }

  public setOnDataChanged(callback: () => void) {
    this.onDataChangedCallback = callback;
  }

  public initialize() {
    this.setupNetworkListener();
  }

  public cleanup() {
    window.removeEventListener('online', this.handleOnline);
    this.stopRealtimeSync();
  }

  private handleOnline = () => {
    // Background auto sync disabled
  };

  private setupNetworkListener() {
    // Background network listener disabled for pure manual delta synchronization
  }

  public startRealtimeSync(shopId: string) {
    // Pure offline-first: Real-time listeners disabled. Syncing only triggered manually.
    console.log('Web real-time sync disabled for offline-first design.');
  }

  public stopRealtimeSync() {
    if (this.realtimeUnsubscribers.length === 0) return;
    console.log('Stopping web real-time sync...');
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];
  }

  async triggerSync(shopIdInput?: string | any, force = false, target: SyncTarget = 'ALL') {
    if (this.status === SyncStatus.Syncing) return;

    // Prevent redundant syncs within the cooldown period unless explicitly forced
    const now = Date.now();
    if (!force && this.lastSynced > 0 && (now - this.lastSynced) < this.SYNC_COOLDOWN_MS) {
        console.log('SyncManager (Web): Skipping Firestore hit, last sync was less than 60s ago.');
        this.onDataChangedCallback?.();
        return;
    }

    const shopId = sanitizeShopId(shopIdInput);
    if (!shopId) {
        console.log('SyncManager: No active shopId, skipping sync-up. Input was:', shopIdInput);
        return;
    }

    const shouldSync = (moduleName: SyncTarget) => {
      if (!target || target === 'ALL') return true;
      return target === moduleName;
    };

    this.status = SyncStatus.Syncing;
    this.onDataChangedCallback?.();

    try {
      // 0. Pull Shop Details first to establish metadata and fix permissions (self-healing)
      await this.safeSync('PullShopDetails', () => this.pullShopDetails(shopId));

      // 1. Target PUSH local changes (Sync Up)
      if (shouldSync('SALES')) await this.safeSync('Sales', () => this.syncSales(shopId));
      if (shouldSync('PRODUCTS')) {
        await this.safeSync('Products', () => this.syncProducts(shopId));
        await this.safeSync('Categories', () => this.syncCategories(shopId));
      }
      if (shouldSync('SUPPLIERS')) {
        await this.safeSync('Suppliers', () => this.syncSuppliers(shopId));
        await this.safeSync('SupplierPayments', () => this.syncSupplierPayments(shopId));
      }
      if (shouldSync('CUSTOMERS')) {
        await this.safeSync('Customers', () => this.syncCustomers(shopId));
        await this.safeSync('Payments', () => this.syncPayments(shopId));
      }
      if (shouldSync('EXPENSES')) await this.safeSync('ExpensesPush', () => this.syncExpenses(shopId));
      if (shouldSync('PURCHASES')) {
        await this.safeSync('Purchases', () => this.syncPurchases(shopId));
        await this.safeSync('PurchaseReturns', () => this.syncPurchaseReturns(shopId));
      }
      if (shouldSync('ALL')) {
        await this.safeSync('AuditLogs', () => this.syncAuditLogs(shopId));
        await this.safeSync('Adjustments', () => this.syncAdjustments(shopId));
      }

      // Fetch persistent lastSynced timestamp for Delta Pull
      let lastSyncedTime = 0;
      try {
        const shopResult = await this.productRepo.db.executeSql('SELECT lastSynced FROM Shop WHERE TRIM(LOWER(id)) = TRIM(LOWER(?)) OR id = ?', [shopId, shopId]);
        if (shopResult && shopResult[0] && shopResult[0].rows && shopResult[0].rows.length > 0) {
          const sRows = shopResult[0].rows;
          const row = typeof (sRows as any).item === 'function' ? sRows.item(0) : (sRows as any)[0];
          lastSyncedTime = row?.lastSynced || 0;
        }
      } catch (err) {
        console.error('Error fetching lastSynced from Shop:', err);
      }

      // 2. Then Target PULL changes from remote (Delta Sync Down)
      const effectiveLastSynced = Math.max(0, lastSyncedTime - this.SYNC_BUFFER_MS);

      // Fetch local user role to determine pull permissions
      let userRole = 'SALES';
      try {
          const auth = firebase.auth();
          const currentUser = auth.currentUser;
          if (currentUser) {
              const shopRes = await this.productRepo.db.executeSql(
                'SELECT ownerId FROM Shop WHERE TRIM(LOWER(id)) = TRIM(LOWER(?)) OR id = ?',
                [shopId, shopId]
              );
              const shRows = shopRes[0]?.rows;
              const shopRow = shRows?.length ? (typeof (shRows as any).item === 'function' ? shRows.item(0) : (shRows as any)[0]) : null;
              if (shopRow && (shopRow.ownerId === currentUser.uid || shopRow.ownerid === currentUser.uid)) {
                userRole = 'OWNER';
              } else {
                const empResult = await this.productRepo.db.executeSql('SELECT role FROM Employee WHERE id = ?', [currentUser.uid]);
                if (empResult[0]?.rows?.length > 0) {
                  const eRows = empResult[0].rows;
                  const item = typeof (eRows as any).item === 'function' ? eRows.item(0) : (eRows as any)[0];
                  userRole = item?.role || 'SALES';
                } else {
                  try {
                    const empDoc = await firebase.firestore().collection('employees').doc(currentUser.uid).get();
                    if (empDoc.exists) {
                      const empData = empDoc.data();
                      userRole = empData?.role || 'SALES';
                      await this.productRepo.db.executeSql(
                        'INSERT OR REPLACE INTO Employee(id, shopId, name, role, email) VALUES (?, ?, ?, ?, ?)',
                        [currentUser.uid, shopId, empData?.name || 'Staff', userRole, empData?.email || '']
                      );
                    }
                  } catch (err) {
                    console.warn('Fallback web employee role fetch error:', err);
                  }
                }
              }
          }
      } catch (e) {}

      const isManager = userRole === 'OWNER' || userRole === 'MANAGER';

      if (isManager && (shouldSync('STAFF') || shouldSync('ALL'))) {
        await this.safeSync('PullEmployees', () => this.pullEmployees(shopId, effectiveLastSynced));
      }
      if (shouldSync('PRODUCTS')) {
        await this.safeSync('PullProducts', () => this.pullProducts(shopId, effectiveLastSynced, force));
        await this.safeSync('PullCategories', () => this.pullCategories(shopId, effectiveLastSynced, force));
      }
      if (shouldSync('SUPPLIERS')) {
        await this.safeSync('PullSuppliers', () => this.pullSuppliers(shopId, effectiveLastSynced, force));
        await this.safeSync('PullSupplierPayments', () => this.pullSupplierPayments(shopId, effectiveLastSynced, force));
      }
      if (shouldSync('PURCHASES')) {
        await this.safeSync('PullPurchases', () => this.pullPurchases(shopId, effectiveLastSynced, force));
        await this.safeSync('PullPurchaseReturns', () => this.pullPurchaseReturns(shopId, effectiveLastSynced, force));
      }
      if (shouldSync('CUSTOMERS')) {
        await this.safeSync('PullCustomers', () => this.pullCustomers(shopId, effectiveLastSynced, force));
        await this.safeSync('PullPayments', () => this.pullPayments(shopId, effectiveLastSynced, force));
      }
      if (shouldSync('SALES')) {
        await this.safeSync('PullSales', () => this.pullSales(shopId, effectiveLastSynced, force));
      }
      if (shouldSync('ALL')) {
        await this.safeSync('PullAdjustments', () => this.pullAdjustments(shopId, effectiveLastSynced, force));
      }
      if (isManager && (shouldSync('EXPENSES') || shouldSync('ALL'))) {
        await this.safeSync('PullExpenses', () => this.pullExpenses(shopId, effectiveLastSynced, force));
      }

      const syncCompletionTime = Date.now();
      try {
        await this.productRepo.db.executeSql('UPDATE Shop SET lastSynced = ? WHERE TRIM(LOWER(id)) = TRIM(LOWER(?)) OR id = ?', [syncCompletionTime, shopId, shopId]);
      } catch (err) {
        console.error('Error updating lastSynced in Shop:', err);
      }

      this.status = SyncStatus.Success;
      this.lastSynced = syncCompletionTime;
    } catch (error) {
      console.error('Overall sync process failed:', error);
      this.status = SyncStatus.Error;
    } finally {
      this.onDataChangedCallback?.();
      setTimeout(() => {
        if (this.status !== SyncStatus.Syncing) {
          this.status = SyncStatus.Idle;
          this.onDataChangedCallback?.();
        }
      }, 3000);
    }
  }

  private async getEffectiveLastSynced(tableName: string, shopId: string, lastSyncedTime: number, isForceSync: boolean = false): Promise<number> {
    if (isForceSync) return 0;
    if (lastSyncedTime <= 0) return 0;
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return 0;
      const countRes = await this.productRepo.db.executeSql(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?`,
        [safeShopId, safeShopId, safeShopId]
      );
      const cRows = countRes[0]?.rows;
      const row = cRows?.length > 0 ? (typeof (cRows as any).item === 'function' ? cRows.item(0) : (cRows as any)[0]) : {};
      const count = Number(row?.count ?? row?.['COUNT(*)'] ?? row?.['count(*)'] ?? 0);
      if (count === 0) {
        console.log(`SyncManager (Web): Local ${tableName} count is 0 for ${safeShopId}, doing full pull...`);
        return 0;
      }
    } catch (e) {
      return 0;
    }
    return lastSyncedTime;
  }

  private async pullProducts(shopId: string, lastSyncedTime: number, isForceSync = false) {
      try {
          const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
          if (!safeShopId) return;
          const effectiveLastSynced = await this.getEffectiveLastSynced('Product', safeShopId, lastSyncedTime, isForceSync);

          let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('products');
          if (effectiveLastSynced > 0) {
            queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
          }
          const snapshot = await queryRef.get();

          for (const doc of snapshot.docs) {
            const data = doc.data();
            const local = await this.productRepo.getProductById(data.id);
            if (local && (local.syncStatus === 0 || local.status === 'DELETED')) continue;

            if (data.status === 'DELETED') {
                await this.productRepo.deleteProduct(data.id);
                continue;
            }

            const productToInsert = {
              id: data.id,
              shopId: safeShopId,
              categoryId: data.categoryId ?? (local ? local.categoryId : null),
              name: data.name ?? (local ? local.name : 'Unknown Product'),
              description: data.description ?? (local ? local.description : null),
              barcode: data.barcode ?? (local ? local.barcode : null),
              bulkBarcode: data.bulkBarcode ?? (local ? local.bulkBarcode : null),
              bulkQuantity: data.bulkQuantity ?? (local ? local.bulkQuantity : 1),
              bulkPrice: data.bulkPrice ?? (local ? local.bulkPrice : 0),
              bulkStockQuantity: data.bulkStockQuantity ?? (local ? local.bulkStockQuantity : 0),
              bulkUnit: data.bulkUnit ?? (local ? local.bulkUnit : 'Carton'),
              price: data.price ?? (local ? local.price : 0),
              costPrice: data.costPrice ?? (local ? local.costPrice : 0),
              stockQuantity: data.stockQuantity ?? (local ? local.stockQuantity : 0),
              minStockLevel: data.minStockLevel ?? (local ? local.minStockLevel : 0),
              unit: data.unit ?? (local ? local.unit : 'pcs'),
              supplierId: data.supplierId ?? (local ? local.supplierId : null),
              status: data.status ?? (local ? local.status : 'ACTIVE'),
              syncStatus: 1
            };

            if (local) {
                if (data.stockQuantity === 0 && local.stockQuantity > 0) productToInsert.stockQuantity = local.stockQuantity;
                if (data.price === 0 && local.price > 0) productToInsert.price = local.price;
                if (data.costPrice === 0 && local.costPrice > 0) productToInsert.costPrice = local.costPrice;
                if (data.bulkStockQuantity === 0 && local.bulkStockQuantity > 0) productToInsert.bulkStockQuantity = local.bulkStockQuantity;
            }

            await this.productRepo.insertProduct(productToInsert);
          }
      } catch (e) {
          console.error('Web Pull Products Error:', e);
      }
  }

  private async pullEmployees(shopId: string, lastSyncedTime: number) {
      try {
          const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
          if (!safeShopId) return;

          const queryRef = firebase.firestore().collection('employees').where('shopId', '==', safeShopId);
          const snapshot = await queryRef.get();

          for (const doc of snapshot.docs) {
              const data = doc.data();
              await this.categoryRepo.db.executeSql(
                  'INSERT OR REPLACE INTO Employee(id, shopId, name, role, email) VALUES (?, ?, ?, ?, ?)',
                  [data.uid || doc.id, safeShopId, data.name || 'Unknown Staff', data.role || 'SALES', data.email || '']
              );
          }
      } catch (e) {
          console.error('Web Pull Employees Error:', e);
      }
  }

  private async pullCategories(shopId: string, lastSyncedTime: number, isForceSync = false) {
      try {
          const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
          if (!safeShopId) return;
          const effectiveLastSynced = await this.getEffectiveLastSynced('Category', safeShopId, lastSyncedTime, isForceSync);

          let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('categories');
          if (effectiveLastSynced > 0) {
            queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
          }
          const snapshot = await queryRef.get();

          for (const doc of snapshot.docs) {
              const data = doc.data();
              await this.categoryRepo.db.executeSql(
                  'INSERT OR REPLACE INTO Category(id, shopId, name, syncStatus) VALUES (?, ?, ?, 1)',
                  [data.id, safeShopId, data.name]
              );
          }
      } catch (e) {
          console.error('Web Pull Categories Error:', e);
      }
  }

  private async pullSuppliers(shopId: string, lastSyncedTime: number, isForceSync = false) {
      try {
          const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
          if (!safeShopId) return;
          const effectiveLastSynced = await this.getEffectiveLastSynced('Supplier', safeShopId, lastSyncedTime, isForceSync);

          let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('suppliers');
          if (effectiveLastSynced > 0) {
            queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
          }
          const snapshot = await queryRef.get();

          for (const doc of snapshot.docs) {
              const data = doc.data();
              const local = await this.supplierRepo.getSupplierById(data.id);
              if (local && local.syncStatus === 0) continue;

              await this.supplierRepo.insertSupplier({
                  id: data.id,
                  shopId: safeShopId,
                  name: data.name ?? (local ? local.name : 'Unknown Supplier'),
                  contactPerson: data.contactPerson ?? (local ? local.contactPerson : null),
                  email: data.email ?? (local ? local.email : null),
                  phone: data.phone ?? (local ? local.phone : null),
                  address: data.address ?? (local ? local.address : null),
                  contactInfo: data.contactInfo ?? (local ? local.contactInfo : (data.phone ?? null)),
                  currentBalance: Number(data.currentBalance ?? (local ? local.currentBalance : 0)),
                  syncStatus: 1
              });
          }
      } catch (e) {
          console.error('Web Pull Suppliers Error:', e);
      }
  }

  private async pullSupplierPayments(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;
      const effectiveLastSynced = await this.getEffectiveLastSynced('SupplierPayment', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('supplier_payments');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        const localRes = await this.productRepo.db.executeSql(
          'SELECT syncStatus FROM SupplierPayment WHERE id = ?',
          [data.id]
        );
        if (localRes[0]?.rows?.length > 0 && localRes[0].rows.item(0).syncStatus === 0) {
          continue;
        }

        await this.productRepo.db.executeSql(
          'INSERT OR REPLACE INTO SupplierPayment(id, supplierId, shopId, amount, paymentMethod, reference, timestamp, note, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [data.id, data.supplierId, safeShopId, Number(data.amount || 0), data.paymentMethod || 'CASH', data.reference || null, timestamp, data.note || null]
        );
      }
    } catch (e) {
      console.error('Web Pull Supplier Payments Error:', e);
    }
  }

  private async pullPurchases(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;
      const effectiveLastSynced = await this.getEffectiveLastSynced('PurchaseOrder', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('purchases');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const localResult = await this.purchaseRepo.db.executeSql(
          'SELECT syncStatus FROM PurchaseOrder WHERE id = ?',
          [data.id]
        );
        if (localResult[0]?.rows?.length > 0 && localResult[0].rows.item(0).syncStatus === 0) {
          continue;
        }

        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        await this.purchaseRepo.db.executeSql(
          'INSERT OR REPLACE INTO PurchaseOrder(id, shopId, supplierId, invoiceNumber, timestamp, totalCost, amountPaid, balance, paymentStatus, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            safeShopId,
            data.supplierId || null,
            data.invoiceNumber || null,
            timestamp,
            Number(data.totalCost || 0),
            Number(data.amountPaid || 0),
            Number(data.balance || 0),
            data.paymentStatus || 'PAID'
          ]
        );

        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            await this.purchaseRepo.db.executeSql(
              'INSERT OR REPLACE INTO PurchaseOrderItem(id, purchaseOrderId, productId, productName, quantity, costPrice, isBulk) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                item.id || generateUUID(),
                data.id,
                item.productId || null,
                item.productName || 'Unknown Item',
                Number(item.quantity || 0),
                Number(item.costPrice || 0),
                item.isBulk ? 1 : 0
              ]
            );
          }
        }
      }
    } catch (e) {
      console.error('Web Pull Purchases Error:', e);
    }
  }

  private async pullPurchaseReturns(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;
      const effectiveLastSynced = await this.getEffectiveLastSynced('PurchaseReturn', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('purchase_returns');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const localResult = await this.purchaseRepo.db.executeSql(
          'SELECT syncStatus FROM PurchaseReturn WHERE id = ?',
          [data.id]
        );
        if (localResult[0]?.rows?.length > 0 && localResult[0].rows.item(0).syncStatus === 0) {
          continue;
        }

        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        await this.purchaseRepo.db.executeSql(
          'INSERT OR REPLACE INTO PurchaseReturn(id, purchaseOrderId, shopId, supplierId, productId, quantity, returnValue, reason, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.purchaseOrderId || null,
            safeShopId,
            data.supplierId || null,
            data.productId || null,
            Number(data.quantity || 0),
            Number(data.returnValue || 0),
            data.reason || null,
            timestamp
          ]
        );
      }
    } catch (e) {
      console.error('Web Pull Purchase Returns Error:', e);
    }
  }

  private async pullCustomers(shopId: string, lastSyncedTime: number, isForceSync = false) {
      try {
          const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
          if (!safeShopId) return;
          const effectiveLastSynced = await this.getEffectiveLastSynced('Customer', safeShopId, lastSyncedTime, isForceSync);

          let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('customers');
          if (effectiveLastSynced > 0) {
            queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
          }
          const snapshot = await queryRef.get();

          for (const doc of snapshot.docs) {
              const data = doc.data();
              const local = await this.customerRepo.getCustomerById(data.id);
              if (local && local.syncStatus === 0) continue;

              await this.customerRepo.insertCustomer({
                  id: data.id,
                  shopId: safeShopId,
                  name: data.name ?? (local ? local.name : 'Unknown Customer'),
                  phone: data.phone ?? (local ? local.phone : null),
                  email: data.email ?? (local ? local.email : null),
                  currentBalance: Number(data.currentBalance ?? (local ? local.currentBalance : 0)),
                  syncStatus: 1
              });
          }
      } catch (e) {
          console.error('Web Pull Customers Error:', e);
      }
  }

  private async pullPayments(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;
      const effectiveLastSynced = await this.getEffectiveLastSynced('DebtPayment', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('payments');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const localRes = await this.customerRepo.db.executeSql(
          'SELECT syncStatus FROM DebtPayment WHERE id = ?',
          [data.id]
        );
        if (localRes[0]?.rows?.length > 0 && localRes[0].rows.item(0).syncStatus === 0) {
          continue;
        }

        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        await this.customerRepo.db.executeSql(
          'INSERT OR REPLACE INTO DebtPayment(id, customerId, shopId, amount, paymentMethod, timestamp, note, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.customerId || null,
            safeShopId,
            Number(data.amount || 0),
            data.paymentMethod || 'CASH',
            timestamp,
            data.note || null
          ]
        );
      }
    } catch (e) {
      console.error('Web Pull Debt Payments Error:', e);
    }
  }

  private async pullAdjustments(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;
      const effectiveLastSynced = await this.getEffectiveLastSynced('InventoryAdjustment', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('inventory_adjustments');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const localRes = await this.systemRepo.db.executeSql(
          'SELECT syncStatus FROM InventoryAdjustment WHERE id = ?',
          [data.id]
        );
        if (localRes[0]?.rows?.length > 0 && localRes[0].rows.item(0).syncStatus === 0) {
          continue;
        }

        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        await this.systemRepo.db.executeSql(
          'INSERT OR REPLACE INTO InventoryAdjustment(id, productId, shopId, quantity, reason, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.productId || null,
            safeShopId,
            Number(data.quantity || 0),
            data.reason || 'Manual Adjustment',
            timestamp
          ]
        );
      }
    } catch (e) {
      console.error('Web Pull Adjustments Error:', e);
    }
  }

  private async pullSales(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;

      const effectiveLastSynced = await this.getEffectiveLastSynced('Sale', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('sales');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));
        await this.saleRepo.upsertRemoteSale({ ...data, shopId: safeShopId, timestamp }, data.items || []);
      }
    } catch (e: any) {
      console.error('Web Pull Sales Error:', e?.message || e);
    }
  }

  private async pullExpenses(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;

      const effectiveLastSynced = await this.getEffectiveLastSynced('Expense', safeShopId, lastSyncedTime, isForceSync);

      let queryRef: any = firebase.firestore().collection('shops').doc(safeShopId).collection('expenses');
      if (effectiveLastSynced > 0) {
        queryRef = queryRef.where('lastUpdated', '>', effectiveLastSynced);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const timestamp = parseTimestamp(data.timestamp, parseTimestamp(data.lastUpdated, Date.now()));

        await this.productRepo.db.executeSql(
          'INSERT OR REPLACE INTO Expense(id, shopId, category, amount, description, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [data.id || doc.id, safeShopId, data.category || 'Other Spendings', Number(data.amount || 0), data.description || null, timestamp]
        );
      }
    } catch (e) {
      console.error('Web Pull Expenses Error:', e);
    }
  }

  private async pullShopDetails(shopId: string) {
    try {
      const doc = await firebase.firestore().collection('registered_shops').doc(shopId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          const plan = (data.plan || 'STARTER').toUpperCase();
          let planExpiresAt = data.planExpiresAt || null;

          if (!planExpiresAt) {
            let baseDate = new Date();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              baseDate = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
              baseDate = new Date(data.createdAt.seconds * 1000);
            } else if (data.createdAt && typeof data.createdAt === 'string') {
              baseDate = new Date(data.createdAt);
            }
            const trialExpiry = new Date(baseDate);
            trialExpiry.setMonth(trialExpiry.getMonth() + 1);

            const now = new Date();
            if (trialExpiry < now) {
              trialExpiry.setTime(now.getTime());
              trialExpiry.setMonth(trialExpiry.getMonth() + 1);
            }
            planExpiresAt = trialExpiry.toISOString().split('T')[0];

            firebase.firestore().collection('registered_shops').doc(shopId).update({ planExpiresAt }).catch(err => {
              console.warn('SyncManager (Web): Failed to backfill planExpiresAt in Firestore:', err);
            });
          }

          // Self-healing: if ownerId is missing in Firestore, try to repair it if current user is OWNER
          const currentUser = firebase.auth().currentUser;
          if (!data.ownerId && currentUser) {
             const empResult = await this.productRepo.db.executeSql('SELECT role FROM Employee WHERE id = ?', [currentUser.uid]);
             if (empResult[0]?.rows?.length > 0 && empResult[0].rows.item(0).role === 'OWNER') {
                console.log('SyncManager: Repairing missing ownerId in Firestore...');
                await firebase.firestore().collection('registered_shops').doc(shopId).update({ ownerId: currentUser.uid });
             }
          }

          const shopResult = await this.productRepo.db.executeSql('SELECT id FROM Shop WHERE id = ?', [shopId]);
          const exists = shopResult[0]?.rows?.length > 0;

          if (exists) {
            await this.productRepo.db.executeSql(
              'UPDATE Shop SET name = ?, currency = ?, [plan] = ?, country = ?, ownerId = ?, parentShopId = ?, shopCode = ?, planExpiresAt = ? WHERE id = ?',
              [
                data.name || '',
                data.currency || '$',
                plan,
                data.country || '',
                data.ownerId || '',
                data.parentShopId || null,
                data.shopCode || null,
                planExpiresAt,
                shopId
              ]
            );
          } else {
            await this.productRepo.db.executeSql(
              'INSERT INTO Shop (id, name, currency, [plan], country, ownerId, parentShopId, shopCode, planExpiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                shopId,
                data.name || '',
                data.currency || '$',
                plan,
                data.country || '',
                data.ownerId || '',
                data.parentShopId || null,
                data.shopCode || null,
                planExpiresAt
              ]
            );
          }
          console.log(`SyncManager (Web): Shop metadata updated. Plan: ${plan}`);
        }
      }
    } catch (e) {
      console.error('Web Pull Shop Details Error:', e);
    }
  }

  private async safeSync(name: string, syncFn: () => Promise<void>) {
    try {
        await syncFn();
    } catch (e: any) {
        console.error(`Sync failed for [${name}]:`, e.message);
        // We don't re-throw here so other collections can still sync
    }
  }

  private async syncSales(shopId?: string) {
    const sanitizedShopId = sanitizeShopId(shopId);
    const unsynced = await this.saleRepo.getUnsyncedSales(sanitizedShopId || shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const sale of unsynced) {
      let targetShopId = sanitizeShopId(sale.shopId);

      // Self-healing: repair orphaned sales
      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && sanitizedShopId) {
          console.warn(`SyncManager: Repairing orphaned sale ${sale.id} with current shopId ${sanitizedShopId}`);
          targetShopId = sanitizedShopId;
          await this.saleRepo.db.executeSql('UPDATE Sale SET shopId = ? WHERE id = ?', [sanitizedShopId, sale.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') {
        console.warn('Sync Sanitizer: Skipping sale with invalid shopId', sale.id);
        continue;
      }
      const saleRef = firebase.firestore().collection('shops').doc(targetShopId).collection('sales').doc(sale.id);

      if (sale.isReverted === 1) {
        // Soft delete on Firestore to ensure other devices see the revert in delta pull
        batch.set(saleRef, { id: sale.id, shopId: targetShopId, isReverted: true, lastUpdated: Date.now() }, { merge: true });
      } else {
        const items = await this.saleRepo.getDetailedItemsForSale(sale.id);
        const saleData = {
          id: sale.id,
          shopId: targetShopId,
          employeeId: sale.employeeId || "",
          customerId: sale.customerId || null,
          paymentMethod: sale.paymentMethod || "CASH",
          paymentStatus: sale.paymentStatus || "PAID",
          dueDate: sale.dueDate || null,
          timestamp: sale.timestamp || Date.now(),
          totalAmount: sale.totalAmount ?? 0,
          isReverted: sale.isReverted === 1,
          lastUpdated: Date.now(),
          items: items.map(item => ({
            productId: item.productId || "",
            quantity: item.quantity ?? 0,
            priceAtSale: item.priceAtSale ?? 0,
            isBulk: item.isBulk === 1
          }))
        };
        batch.set(saleRef, saleData, { merge: true });
      }

      count++;
      syncedIds.push(sale.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.saleRepo.markSaleSynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.saleRepo.markSaleSynced(id);
    }
  }

  private async syncProducts(shopId?: string) {
    const sanitizedShopId = sanitizeShopId(shopId);
    const unsynced = await this.productRepo.getUnsyncedProducts(sanitizedShopId || shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const product of unsynced) {
      let targetShopId = sanitizeShopId(product.shopId);

      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && sanitizedShopId) {
        console.warn(`SyncManager: Repairing orphaned product ${product.id} with current shopId ${sanitizedShopId}`);
        targetShopId = sanitizedShopId;
        await this.productRepo.db.executeSql('UPDATE Product SET shopId = ? WHERE id = ?', [sanitizedShopId, product.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') {
        console.warn('Sync Sanitizer: Skipping product with invalid shopId', product.id);
        continue;
      }

      console.log(`[SYNC] Pushing product: ${product.name}, stock: ${product.stockQuantity}, price: ${product.price}`);

      const productRef = firebase.firestore().collection('shops').doc(targetShopId).collection('products').doc(product.id);

      if (product.status === 'DELETED') {
        // Soft delete on Firestore to ensure other devices see the deletion in delta pull
        batch.set(productRef, { id: product.id, shopId: targetShopId, status: 'DELETED', lastUpdated: Date.now() }, { merge: true });
      } else {
        const productData = {
          id: product.id,
          shopId: targetShopId,
          categoryId: product.categoryId || null,
          name: product.name || "Unknown Product",
          description: product.description || null,
          barcode: product.barcode || null,
          bulkBarcode: product.bulkBarcode || null,
          bulkQuantity: product.bulkQuantity ?? 1,
          bulkUnit: product.bulkUnit || 'Carton',
          price: product.price ?? 0,
          bulkPrice: product.bulkPrice ?? 0,
          costPrice: product.costPrice ?? 0,
          stockQuantity: product.stockQuantity ?? 0,
          bulkStockQuantity: product.bulkStockQuantity ?? 0,
          minStockLevel: product.minStockLevel ?? 0,
          unit: product.unit || "pcs",
          supplierId: product.supplierId || null,
          status: product.status || 'ACTIVE',
          lastUpdated: Date.now()
        };
        batch.set(productRef, productData, { merge: true });
      }

      count++;
      syncedIds.push(product.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.productRepo.markProductSynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.productRepo.markProductSynced(id);
    }
  }

  private async syncCategories(shopId?: string) {
    const sanitizedShopId = sanitizeShopId(shopId);
    const unsynced = await this.categoryRepo.getUnsyncedCategories(sanitizedShopId || shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const cat of unsynced) {
      let targetShopId = sanitizeShopId(cat.shopId);
      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && sanitizedShopId) {
          targetShopId = sanitizedShopId;
          await this.categoryRepo.db.executeSql('UPDATE Category SET shopId = ? WHERE id = ?', [sanitizedShopId, cat.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') continue;

      const ref = firebase.firestore().collection('shops').doc(targetShopId).collection('categories').doc(cat.id);
      const data = {
        id: cat.id,
        shopId: targetShopId,
        name: cat.name || "Unnamed Category",
        lastUpdated: Date.now()
      };
      batch.set(ref, data, { merge: true });
      count++;
      syncedIds.push(cat.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.categoryRepo.markCategorySynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.categoryRepo.markCategorySynced(id);
    }
  }

  private async syncSuppliers(shopId?: string) {
    const sanitizedShopId = sanitizeShopId(shopId);
    const unsynced = await this.supplierRepo.getUnsyncedSuppliers(sanitizedShopId || shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const supplier of unsynced) {
      let targetShopId = sanitizeShopId(supplier.shopId);

      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && sanitizedShopId) {
          console.warn(`SyncManager: Repairing orphaned supplier ${supplier.id} with current shopId ${sanitizedShopId}`);
          targetShopId = sanitizedShopId;
          await this.supplierRepo.db.executeSql('UPDATE Supplier SET shopId = ? WHERE id = ?', [sanitizedShopId, supplier.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') {
        console.warn('Sync Sanitizer: Skipping supplier with invalid shopId', supplier.id);
        continue;
      }
      const supplierRef = firebase.firestore().collection('shops').doc(targetShopId).collection('suppliers').doc(supplier.id);

      const supplierData = {
        id: supplier.id,
        shopId: targetShopId,
        name: supplier.name || "Unknown Supplier",
        contactPerson: supplier.contactPerson || null,
        email: supplier.email || null,
        phone: supplier.phone || null,
        address: supplier.address || null,
        contactInfo: supplier.contactInfo || null,
        currentBalance: supplier.currentBalance ?? 0,
        lastUpdated: Date.now()
      };

      batch.set(supplierRef, supplierData, { merge: true });
      count++;
      syncedIds.push(supplier.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.supplierRepo.markSupplierSynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.supplierRepo.markSupplierSynced(id);
    }
  }

  private async syncCustomers(shopId?: string) {
    const sanitizedShopId = sanitizeShopId(shopId);
    const unsynced = await this.customerRepo.getUnsyncedCustomers(sanitizedShopId || shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const customer of unsynced) {
      let targetShopId = sanitizeShopId(customer.shopId);

      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && sanitizedShopId) {
          console.warn(`SyncManager: Repairing orphaned customer ${customer.id} with current shopId ${sanitizedShopId}`);
          targetShopId = sanitizedShopId;
          await this.customerRepo.db.executeSql('UPDATE Customer SET shopId = ? WHERE id = ?', [sanitizedShopId, customer.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') {
        console.warn('Sync Sanitizer: Skipping customer with invalid shopId', customer.id);
        continue;
      }
      const customerRef = firebase.firestore().collection('shops').doc(targetShopId).collection('customers').doc(customer.id);

      const customerData = {
        id: customer.id,
        shopId: targetShopId,
        name: customer.name || "Unknown Customer",
        phone: customer.phone || null,
        email: customer.email || null,
        currentBalance: customer.currentBalance ?? 0,
        lastUpdated: Date.now()
      };

      batch.set(customerRef, customerData, { merge: true });
      count++;
      syncedIds.push(customer.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.customerRepo.markCustomerSynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.customerRepo.markCustomerSynced(id);
    }
  }

  private async syncPayments(shopId?: string) {
    const unsynced = await this.customerRepo.getUnsyncedPayments(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const payment of unsynced) {
      if (!payment.shopId || payment.shopId === 'undefined') {
        console.warn('Sync Sanitizer: Skipping payment with invalid shopId', payment.id);
        await this.customerRepo.markPaymentSynced(payment.id);
        continue;
      }
      const paymentRef = firebase.firestore().collection('shops').doc(payment.shopId).collection('payments').doc(payment.id);

      const paymentData = {
        id: payment.id,
        customerId: payment.customerId || "",
        shopId: payment.shopId || "",
        amount: payment.amount ?? 0,
        paymentMethod: payment.paymentMethod || "CASH",
        timestamp: payment.timestamp || Date.now(),
        note: payment.note || null,
        lastUpdated: Date.now()
      };

      batch.set(paymentRef, paymentData, { merge: true });
      count++;
      syncedIds.push(payment.id);

      if (count === this.BATCH_LIMIT) {
        await batch.commit();
        for (const id of syncedIds) await this.customerRepo.markPaymentSynced(id);
        batch = firebase.firestore().batch();
        count = 0;
        syncedIds.length = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      for (const id of syncedIds) await this.customerRepo.markPaymentSynced(id);
    }
  }

  private async syncSupplierPayments(shopId?: string) {
    try {
        const results = await this.supplierRepo.getUnsyncedSupplierPayments(shopId);
        if (results.length === 0) return;

        let batch = firebase.firestore().batch();
        for (const p of results) {
            if (!p.shopId || p.shopId === 'undefined') {
                console.warn('Sync Sanitizer: Skipping supplier payment with invalid shopId', p.id);
                await this.supplierRepo.markSupplierPaymentSynced(p.id);
                continue;
            }
            const ref = firebase.firestore().collection('shops').doc(p.shopId).collection('supplier_payments').doc(p.id);
            const data = {
                id: p.id,
                supplierId: p.supplierId || "",
                shopId: p.shopId || "",
                amount: p.amount ?? 0,
                paymentMethod: p.paymentMethod || "CASH",
                reference: p.reference || null,
                timestamp: p.timestamp || Date.now(),
                note: p.note || null,
                lastUpdated: Date.now()
            };
            batch.set(ref, data, { merge: true });
        }
        await batch.commit();
        for (const p of results) {
            await this.supplierRepo.markSupplierPaymentSynced(p.id);
        }
    } catch (e) {
        console.error('Web Supplier Payment Sync Error:', e);
    }
  }

  private async syncExpenses(shopId: string) {
    try {
      const safeShopId = sanitizeShopId(shopId);
      if (!safeShopId || safeShopId === '[object Object]') return;
      const results = await this.productRepo.db.executeSql(
        'SELECT * FROM Expense WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)',
        [safeShopId, safeShopId, safeShopId]
      );
      const expenses: any[] = [];
      const rows = results[0]?.rows;
      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          expenses.push(rows.item ? rows.item(i) : (rows as any)[i]);
        }
      }

      if (expenses.length === 0) return;

      let batch = firebase.firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const exp of expenses) {
        let targetShopId = sanitizeShopId(exp.shopId) || safeShopId;
        if (!targetShopId || targetShopId === '[object Object]') targetShopId = safeShopId;
        const ref = firebase.firestore().collection('shops').doc(targetShopId).collection('expenses').doc(exp.id);
        batch.set(ref, {
          id: exp.id,
          shopId: targetShopId,
          category: exp.category,
          amount: exp.amount,
          description: exp.description || null,
          timestamp: exp.timestamp,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(exp.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) {
            await this.productRepo.db.executeSql('UPDATE Expense SET syncStatus = 1 WHERE id = ?', [id]);
          }
          batch = firebase.firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) {
          await this.productRepo.db.executeSql('UPDATE Expense SET syncStatus = 1 WHERE id = ?', [id]);
        }
      }
    } catch (e) {
      console.error('Web Expense Push Sync Error:', e);
    }
  }

  private async syncPurchases(shopId: string) {
    try {
      const unsynced = await this.purchaseRepo.getUnsyncedPurchases(shopId);
      if (unsynced.length === 0) return;

      let batch = firebase.firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const purchase of unsynced) {
        const items = await this.purchaseRepo.getPurchaseItems(purchase.id);
        const ref = firebase.firestore().collection('shops').doc(shopId).collection('purchases').doc(purchase.id);
        batch.set(ref, {
          ...purchase,
          items: items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            costPrice: item.costPrice,
            isBulk: item.isBulk
          })),
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(purchase.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.purchaseRepo.markPurchaseSynced(id);
          batch = firebase.firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.purchaseRepo.markPurchaseSynced(id);
      }
    } catch (e) {
      console.error('Web Purchase Sync Error:', e);
    }
  }

  private async syncPurchaseReturns(shopId: string) {
    try {
      const unsynced = await this.purchaseRepo.getUnsyncedReturns(shopId);
      if (unsynced.length === 0) return;

      let batch = firebase.firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const ret of unsynced) {
        const ref = firebase.firestore().collection('shops').doc(shopId).collection('purchase_returns').doc(ret.id);
        batch.set(ref, {
          ...ret,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(ret.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.purchaseRepo.markReturnSynced(id);
          batch = firebase.firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.purchaseRepo.markReturnSynced(id);
      }
    } catch (e) {
      console.error('Web Purchase Return Sync Error:', e);
    }
  }

  private async syncAuditLogs(shopId: string) {
    try {
      const unsynced = await this.systemRepo.getUnsyncedAuditLogs(shopId);
      if (unsynced.length === 0) return;

      let batch = firebase.firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const log of unsynced) {
        const ref = firebase.firestore().collection('shops').doc(shopId).collection('audit_logs').doc(log.id);
        batch.set(ref, {
          ...log,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(log.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.systemRepo.markAuditLogSynced(id);
          batch = firebase.firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.systemRepo.markAuditLogSynced(id);
      }
    } catch (e) {
      console.error('Web Audit Log Sync Error:', e);
    }
  }

  private async syncAdjustments(shopId: string) {
    try {
      const unsynced = await this.systemRepo.getUnsyncedAdjustments(shopId);
      if (unsynced.length === 0) return;

      let batch = firebase.firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const adj of unsynced) {
        const ref = firebase.firestore().collection('shops').doc(shopId).collection('inventory_adjustments').doc(adj.id);
        batch.set(ref, {
          ...adj,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(adj.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.systemRepo.markAdjustmentSynced(id);
          batch = firebase.firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.systemRepo.markAdjustmentSynced(id);
      }
    } catch (e) {
      console.error('Web Inventory Adjustment Sync Error:', e);
    }
  }

  getLastSynced() {
    return this.lastSynced;
  }
}
