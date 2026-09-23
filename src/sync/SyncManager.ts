import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { PurchaseRepository } from '../repositories/PurchaseRepository';
import { SystemRepository } from '../repositories/SystemRepository';
import { generateUUID } from '../utils/uuid';
import { parseTimestamp } from '../utils/dateUtils';

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
  private unsubscribeNetwork: (() => void) | null = null;
  private realtimeUnsubscribers: (() => void)[] = [];
  private onDataChangedCallback: (() => void) | null = null;
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
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
    }
    this.stopRealtimeSync();
  }

  public startRealtimeSync(shopId: string) {
    // Pure offline-first: Real-time listeners disabled. Syncing only triggered manually.
    console.log('Real-time sync disabled for offline-first design.');
  }

  public stopRealtimeSync() {
    if (this.realtimeUnsubscribers.length === 0) return;
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];
  }

  private setupNetworkListener() {
    // Automatic background network sync disabled to prevent automated writes/pulls.
    console.log('Auto-network sync listener disabled for offline-first design.');
  }

  async triggerSync(shopIdInput?: string, force = false) {
    if (this.status === SyncStatus.Syncing) return;

    // Prevent redundant syncs within the cooldown period unless explicitly forced
    const now = Date.now();
    if (!force && this.lastSynced > 0 && (now - this.lastSynced) < this.SYNC_COOLDOWN_MS) {
        console.log('SyncManager: Skipping Firestore hit, last sync was less than 60s ago.');
        // We still trigger a local UI refresh via the callback to ensure data consistency
        this.onDataChangedCallback?.();
        return;
    }

    // Support object input if passed by accident
    const shopId = typeof shopIdInput === 'object' ? (shopIdInput as any).shopId : shopIdInput;

    if (!shopId || shopId === 'undefined' || shopId === '[object Object]') {
        console.log('SyncManager (Native): No active shopId, skipping sync-up. Input was:', shopIdInput);
        return;
    }

    this.status = SyncStatus.Syncing;
    try {
      // 0. Pull Shop Details first to establish metadata and fix permissions (self-healing)
      // This ensures subsequent pushes/pulls have correct permissions if ownerId was missing.
      await this.safeSync('PullShopDetails', () => this.pullShopDetails(shopId));

      // 1. First Push Local Changes (Sync Up)
      await this.safeSync('Sales', () => this.syncSales(shopId));
      await this.safeSync('Products', () => this.syncProducts(shopId));
      await this.safeSync('Categories', () => this.syncCategories(shopId));
      await this.safeSync('Suppliers', () => this.syncSuppliers(shopId));
      await this.safeSync('Customers', () => this.syncCustomers(shopId));
      await this.safeSync('Payments', () => this.syncPayments(shopId));
      await this.safeSync('SupplierPayments', () => this.syncSupplierPayments(shopId));
      await this.safeSync('ExpensesPush', () => this.syncExpenses(shopId));
      await this.safeSync('Purchases', () => this.syncPurchases(shopId));
      await this.safeSync('PurchaseReturns', () => this.syncPurchaseReturns(shopId));
      await this.safeSync('AuditLogs', () => this.syncAuditLogs(shopId));
      await this.safeSync('Adjustments', () => this.syncAdjustments(shopId));

      // Fetch persistent lastSynced timestamp for Delta Pull
      let lastSyncedTime = 0;
      try {
        const shopResult = await this.productRepo.db.executeSql('SELECT lastSynced FROM Shop WHERE id = ?', [shopId]);
        if (shopResult && shopResult[0] && shopResult[0].rows && shopResult[0].rows.length > 0) {
          lastSyncedTime = shopResult[0].rows.item(0).lastSynced || 0;
        }
      } catch (err) {
        console.error('Error fetching lastSynced from Shop:', err);
      }

      // 2. Then Pull Remote Changes (Delta Sync Down)
      // Use a small overlap buffer to ensure no items are missed due to clock skew between devices.
      const effectiveLastSynced = Math.max(0, lastSyncedTime - this.SYNC_BUFFER_MS);

      // Fetch local user role to determine pull permissions
      let userRole = 'SALES';
      try {
          const auth = require('@react-native-firebase/auth').default();
          const currentUser = auth.currentUser;
          if (currentUser) {
              const empResult = await this.productRepo.db.executeSql('SELECT role FROM Employee WHERE id = ?', [currentUser.uid]);
              if (empResult[0]?.rows?.length > 0) {
                  userRole = empResult[0].rows.item(0).role;
              }
          }
      } catch (e) {}

      const isManager = userRole === 'OWNER' || userRole === 'MANAGER';

      if (isManager) {
        await this.safeSync('PullEmployees', () => this.pullEmployees(shopId, effectiveLastSynced));
      }
      await this.safeSync('PullProducts', () => this.pullProducts(shopId, effectiveLastSynced));
      await this.safeSync('PullCategories', () => this.pullCategories(shopId, effectiveLastSynced));
      await this.safeSync('PullSuppliers', () => this.pullSuppliers(shopId, effectiveLastSynced));
      await this.safeSync('PullSupplierPayments', () => this.pullSupplierPayments(shopId, effectiveLastSynced));
      await this.safeSync('PullPurchases', () => this.pullPurchases(shopId, effectiveLastSynced));
      await this.safeSync('PullPurchaseReturns', () => this.pullPurchaseReturns(shopId, effectiveLastSynced));
      await this.safeSync('PullCustomers', () => this.pullCustomers(shopId, effectiveLastSynced));
      await this.safeSync('PullPayments', () => this.pullPayments(shopId, effectiveLastSynced));
      await this.safeSync('PullSales', () => this.pullSales(shopId, effectiveLastSynced, force));
      await this.safeSync('PullAdjustments', () => this.pullAdjustments(shopId, effectiveLastSynced));
      if (isManager) {
        await this.safeSync('PullExpenses', () => this.pullExpenses(shopId, effectiveLastSynced));
      }

      const syncCompletionTime = Date.now();
      try {
        await this.productRepo.db.executeSql('UPDATE Shop SET lastSynced = ? WHERE id = ?', [syncCompletionTime, shopId]);
      } catch (err) {
        console.error('Error updating lastSynced in Shop:', err);
      }

      this.status = SyncStatus.Success;
      this.lastSynced = syncCompletionTime;
    } catch (error) {
      console.error('Sync failed:', error);
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

  private async safeSync(name: string, syncFn: () => Promise<void>) {
    try {
        await syncFn();
    } catch (e: any) {
        console.error(`Native Sync failed for [${name}]:`, e.message);
    }
  }

  private async pullProducts(shopId: string, lastSyncedTime: number) {
    try {
      let queryRef: any = firestore().collection('shops').doc(shopId).collection('products');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
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
                  shopId: data.shopId,
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
      console.error('Pull Products Error:', e);
    }
  }

  private async pullCategories(shopId: string, lastSyncedTime: number) {
    try {
      let queryRef: any = firestore().collection('shops').doc(shopId).collection('categories');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        await this.categoryRepo.db.executeSql(
          'INSERT OR REPLACE INTO Category(id, shopId, name, syncStatus) VALUES (?, ?, ?, 1)',
          [data.id, data.shopId, data.name]
        );
      }
    } catch (e) {
      console.error('Pull Categories Error:', e);
    }
  }

  private async pullSuppliers(shopId: string, lastSyncedTime: number) {
    try {
      let queryRef: any = firestore().collection('shops').doc(shopId).collection('suppliers');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const local = await this.supplierRepo.getSupplierById(data.id);
        if (local && local.syncStatus === 0) continue;

        await this.supplierRepo.insertSupplier({
          id: data.id,
          shopId: data.shopId || shopId,
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
      console.error('Pull Suppliers Error:', e);
    }
  }

  private async pullSupplierPayments(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('supplier_payments');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

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
      console.error('Pull Supplier Payments Error:', e);
    }
  }

  private async pullPurchases(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('purchases');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
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

        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

        await this.purchaseRepo.db.executeSql(
          'INSERT OR REPLACE INTO PurchaseOrder(id, shopId, supplierId, invoiceNumber, timestamp, totalCost, amountPaid, balance, paymentStatus, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.shopId || safeShopId,
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
      console.error('Pull Purchases Error:', e);
    }
  }

  private async pullPurchaseReturns(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('purchase_returns');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
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

        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

        await this.purchaseRepo.db.executeSql(
          'INSERT OR REPLACE INTO PurchaseReturn(id, purchaseOrderId, shopId, supplierId, productId, quantity, returnValue, reason, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.purchaseOrderId || null,
            data.shopId || safeShopId,
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
      console.error('Pull Purchase Returns Error:', e);
    }
  }

  private async pullCustomers(shopId: string, lastSyncedTime: number) {
    try {
      let queryRef: any = firestore().collection('shops').doc(shopId).collection('customers');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const local = await this.customerRepo.getCustomerById(data.id);
        if (local && local.syncStatus === 0) continue;

        await this.customerRepo.insertCustomer({
          id: data.id,
          shopId: data.shopId || shopId,
          name: data.name ?? (local ? local.name : 'Unknown Customer'),
          phone: data.phone ?? (local ? local.phone : null),
          email: data.email ?? (local ? local.email : null),
          currentBalance: Number(data.currentBalance ?? (local ? local.currentBalance : 0)),
          syncStatus: 1
        });
      }
    } catch (e) {
      console.error('Pull Customers Error:', e);
    }
  }

  private async pullPayments(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('payments');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
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

        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

        await this.customerRepo.db.executeSql(
          'INSERT OR REPLACE INTO DebtPayment(id, customerId, shopId, amount, paymentMethod, timestamp, note, syncStatus) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.customerId || null,
            data.shopId || safeShopId,
            Number(data.amount || 0),
            data.paymentMethod || 'CASH',
            timestamp,
            data.note || null
          ]
        );
      }
    } catch (e) {
      console.error('Pull Debt Payments Error:', e);
    }
  }

  private async pullAdjustments(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('inventory_adjustments');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
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

        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

        await this.systemRepo.db.executeSql(
          'INSERT OR REPLACE INTO InventoryAdjustment(id, productId, shopId, quantity, reason, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [
            data.id,
            data.productId || null,
            data.shopId || safeShopId,
            Number(data.quantity || 0),
            data.reason || 'Manual Adjustment',
            timestamp
          ]
        );
      }
    } catch (e) {
      console.error('Pull Adjustments Error:', e);
    }
  }

  private async pullEmployees(shopId: string, lastSyncedTime: number) {
    try {
      // Scoped down to the branch directly. We fetch all employees of the branch to avoid
      // requiring any Firestore composite index configurations on root-level collections.
      const queryRef = firestore().collection('employees').where('shopId', '==', shopId);
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        await this.productRepo.db.executeSql(
          'INSERT OR REPLACE INTO Employee(id, shopId, name, role, email) VALUES (?, ?, ?, ?, ?)',
          [data.uid || doc.id, data.shopId, data.name || 'Unknown Staff', data.role || 'SALES', data.email || '']
        );
      }
    } catch (e) {
      console.error('Pull Employees Error:', e);
    }
  }

  private async pullSales(shopId: string, lastSyncedTime: number, isForceSync = false) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      if (!safeShopId) return;

      let effectiveLastSynced = isForceSync ? 0 : lastSyncedTime;
      if (effectiveLastSynced > 0) {
        const countRes = await this.saleRepo.db.executeSql(
          'SELECT COUNT(*) as count FROM Sale WHERE TRIM(LOWER(shopId)) = TRIM(LOWER(?)) AND isReverted = 0',
          [safeShopId]
        );
        const row = countRes[0]?.rows?.length > 0 ? (typeof countRes[0].rows.item === 'function' ? countRes[0].rows.item(0) : countRes[0].rows[0]) : {};
        const count = Number(row?.count ?? row?.['COUNT(*)'] ?? row?.['count(*)'] ?? 0);
        if (count === 0) {
          console.log(`SyncManager (Native): Local Sale count is 0 for ${safeShopId}, doing full pull...`);
          effectiveLastSynced = 0;
        }
      }

      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('sales');
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
      console.error('Pull Sales Error:', e?.message || e);
    }
  }

  private async pullExpenses(shopId: string, lastSyncedTime: number) {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      let queryRef: any = firestore().collection('shops').doc(safeShopId).collection('expenses');
      if (lastSyncedTime > 0) {
        queryRef = queryRef.where('lastUpdated', '>', lastSyncedTime);
      }
      const snapshot = await queryRef.get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        let timestamp = Number(data.timestamp);
        if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
          if (data.timestamp?.toMillis) {
            timestamp = data.timestamp.toMillis();
          } else if (data.timestamp?.seconds) {
            timestamp = data.timestamp.seconds * 1000;
          } else {
            timestamp = Date.now();
          }
        }

        await this.productRepo.db.executeSql(
          'INSERT OR REPLACE INTO Expense(id, shopId, category, amount, description, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [data.id, safeShopId, data.category || 'Other Spendings', Number(data.amount || 0), data.description || null, timestamp]
        );
      }
    } catch (e) {
      console.error('Pull Expenses Error:', e);
    }
  }

  private async pullShopDetails(shopId: string) {
    try {
      const doc = await firestore().collection('registered_shops').doc(shopId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data) {
          const plan = (data.plan || 'STARTER').toUpperCase();

          // Self-healing: if ownerId is missing in Firestore, try to repair it if current user is OWNER
          const auth = require('@react-native-firebase/auth').default();
          const currentUser = auth.currentUser;
          if (!data.ownerId && currentUser) {
             const empResult = await this.productRepo.db.executeSql('SELECT role FROM Employee WHERE id = ?', [currentUser.uid]);
             if (empResult[0]?.rows?.length > 0 && empResult[0].rows.item(0).role === 'OWNER') {
                console.log('SyncManager: Repairing missing ownerId in Firestore...');
                await firestore().collection('registered_shops').doc(shopId).update({ ownerId: currentUser.uid });
             }
          }

          const shopResult = await this.productRepo.db.executeSql('SELECT id FROM Shop WHERE id = ?', [shopId]);
          const exists = shopResult[0]?.rows?.length > 0;

          if (exists) {
            await this.productRepo.db.executeSql(
              'UPDATE Shop SET name = ?, currency = ?, [plan] = ?, country = ?, ownerId = ?, parentShopId = ?, shopCode = ? WHERE id = ?',
              [
                data.name || '',
                data.currency || '$',
                plan,
                data.country || '',
                data.ownerId || '',
                data.parentShopId || null,
                data.shopCode || null,
                shopId
              ]
            );
          } else {
            await this.productRepo.db.executeSql(
              'INSERT INTO Shop (id, name, currency, [plan], country, ownerId, parentShopId, shopCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [
                shopId,
                data.name || '',
                data.currency || '$',
                plan,
                data.country || '',
                data.ownerId || '',
                data.parentShopId || null,
                data.shopCode || null
              ]
            );
          }
          console.log(`SyncManager (Native): Shop metadata updated. Plan: ${plan}`);
        }
      }
    } catch (e) {
      console.error('Pull Shop Details Error:', e);
    }
  }

  private async syncSales(shopId?: string) {
    const unsynced = await this.saleRepo.getUnsyncedSales(shopId);
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const sale of unsynced) {
      let targetShopId = sale.shopId;

      // Self-healing: repair orphaned sales
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          console.warn(`SyncManager: Repairing orphaned sale ${sale.id} with current shopId ${shopId}`);
          targetShopId = shopId;
          await this.saleRepo.db.executeSql('UPDATE Sale SET shopId = ? WHERE id = ?', [shopId, sale.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
        console.warn('Sync Sanitizer (Native): Skipping sale with invalid shopId', sale.id);
        continue;
      }
      const saleRef = firestore().collection('shops').doc(targetShopId).collection('sales').doc(sale.id);

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
        batch = firestore().batch();
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
    const unsynced = await this.productRepo.getUnsyncedProducts(shopId);
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const product of unsynced) {
      let targetShopId = product.shopId;

      // Self-healing: if product has invalid shopId, try to use the one passed to triggerSync
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
        console.warn(`SyncManager: Repairing orphaned product ${product.id} with current shopId ${shopId}`);
        targetShopId = shopId;
        // Also update local DB
        await this.productRepo.db.executeSql('UPDATE Product SET shopId = ? WHERE id = ?', [shopId, product.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
        console.warn('Sync Sanitizer (Native): Skipping product with invalid shopId', product.id);
        // DO NOT mark as synced if it didn't actually sync!
        continue;
      }

      const productRef = firestore().collection('shops').doc(targetShopId).collection('products').doc(product.id);

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
        batch = firestore().batch();
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
    const unsynced = await this.categoryRepo.getUnsyncedCategories(shopId);
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const cat of unsynced) {
      let targetShopId = cat.shopId;
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          targetShopId = shopId;
          await this.categoryRepo.db.executeSql('UPDATE Category SET shopId = ? WHERE id = ?', [shopId, cat.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') continue;

      const ref = firestore().collection('shops').doc(targetShopId).collection('categories').doc(cat.id);
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
        batch = firestore().batch();
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
    const unsynced = await this.supplierRepo.getUnsyncedSuppliers(shopId);
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const supplier of unsynced) {
      let targetShopId = supplier.shopId;

      // Self-healing: repair orphaned suppliers
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          console.warn(`SyncManager: Repairing orphaned supplier ${supplier.id} with current shopId ${shopId}`);
          targetShopId = shopId;
          await this.supplierRepo.db.executeSql('UPDATE Supplier SET shopId = ? WHERE id = ?', [shopId, supplier.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
        console.warn('Sync Sanitizer (Native): Skipping supplier with invalid shopId', supplier.id);
        continue;
      }
      const supplierRef = firestore().collection('shops').doc(targetShopId).collection('suppliers').doc(supplier.id);

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
        batch = firestore().batch();
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
    const unsynced = await this.customerRepo.getUnsyncedCustomers(shopId);
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const customer of unsynced) {
      let targetShopId = customer.shopId;

      // Self-healing: repair orphaned customers
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          console.warn(`SyncManager: Repairing orphaned customer ${customer.id} with current shopId ${shopId}`);
          targetShopId = shopId;
          await this.customerRepo.db.executeSql('UPDATE Customer SET shopId = ? WHERE id = ?', [shopId, customer.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
        console.warn('Sync Sanitizer (Native): Skipping customer with invalid shopId', customer.id);
        continue;
      }
      const customerRef = firestore().collection('shops').doc(targetShopId).collection('customers').doc(customer.id);

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
        batch = firestore().batch();
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

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const payment of unsynced) {
      let targetShopId = payment.shopId;

      // Self-healing: repair orphaned payments
      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          targetShopId = shopId;
          await this.customerRepo.db.executeSql('UPDATE DebtPayment SET shopId = ? WHERE id = ?', [shopId, payment.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
        console.warn('Sync Sanitizer (Native): Skipping payment with invalid shopId', payment.id);
        continue;
      }
      const paymentRef = firestore().collection('shops').doc(targetShopId).collection('payments').doc(payment.id);

      const paymentData = {
        id: payment.id,
        customerId: payment.customerId || "",
        shopId: targetShopId,
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
        batch = firestore().batch();
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

        let batch = firestore().batch();
        for (const p of results) {
            if (!p.shopId || p.shopId === 'undefined') {
                console.warn('Sync Sanitizer (Native): Skipping supplier payment with invalid shopId', p.id);
                await this.supplierRepo.markSupplierPaymentSynced(p.id);
                continue;
            }
            const ref = firestore().collection('shops').doc(p.shopId).collection('supplier_payments').doc(p.id);
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
        console.error('Native Supplier Payment Sync Error:', e);
    }
  }

  private async syncExpenses(shopId: string) {
    try {
      const results = await this.productRepo.db.executeSql(
        'SELECT * FROM Expense WHERE syncStatus = 0 AND shopId = ?',
        [shopId]
      );
      const expenses: any[] = [];
      for (let i = 0; i < results[0].rows.length; i++) {
        expenses.push(results[0].rows.item(i));
      }

      if (expenses.length === 0) return;

      let batch = firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const exp of expenses) {
        const ref = firestore().collection('shops').doc(shopId).collection('expenses').doc(exp.id);
        batch.set(ref, {
          id: exp.id,
          shopId: shopId,
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
          batch = firestore().batch();
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
      console.error('Native Expense Push Sync Error:', e);
    }
  }

  private async syncPurchases(shopId: string) {
    try {
      const unsynced = await this.purchaseRepo.getUnsyncedPurchases(shopId);
      if (unsynced.length === 0) return;

      let batch = firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const purchase of unsynced) {
        const items = await this.purchaseRepo.getPurchaseItems(purchase.id);
        const ref = firestore().collection('shops').doc(shopId).collection('purchases').doc(purchase.id);
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
          batch = firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.purchaseRepo.markPurchaseSynced(id);
      }
    } catch (e) {
      console.error('Native Purchase Sync Error:', e);
    }
  }

  private async syncPurchaseReturns(shopId: string) {
    try {
      const unsynced = await this.purchaseRepo.getUnsyncedReturns(shopId);
      if (unsynced.length === 0) return;

      let batch = firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const ret of unsynced) {
        const ref = firestore().collection('shops').doc(shopId).collection('purchase_returns').doc(ret.id);
        batch.set(ref, {
          ...ret,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(ret.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.purchaseRepo.markReturnSynced(id);
          batch = firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.purchaseRepo.markReturnSynced(id);
      }
    } catch (e) {
      console.error('Native Purchase Return Sync Error:', e);
    }
  }

  private async syncAuditLogs(shopId: string) {
    try {
      const unsynced = await this.systemRepo.getUnsyncedAuditLogs(shopId);
      if (unsynced.length === 0) return;

      let batch = firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const log of unsynced) {
        const ref = firestore().collection('shops').doc(shopId).collection('audit_logs').doc(log.id);
        batch.set(ref, {
          ...log,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(log.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.systemRepo.markAuditLogSynced(id);
          batch = firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.systemRepo.markAuditLogSynced(id);
      }
    } catch (e) {
      console.error('Native Audit Log Sync Error:', e);
    }
  }

  private async syncAdjustments(shopId: string) {
    try {
      const unsynced = await this.systemRepo.getUnsyncedAdjustments(shopId);
      if (unsynced.length === 0) return;

      let batch = firestore().batch();
      let count = 0;
      const syncedIds: string[] = [];

      for (const adj of unsynced) {
        const ref = firestore().collection('shops').doc(shopId).collection('inventory_adjustments').doc(adj.id);
        batch.set(ref, {
          ...adj,
          lastUpdated: Date.now()
        }, { merge: true });

        count++;
        syncedIds.push(adj.id);

        if (count === this.BATCH_LIMIT) {
          await batch.commit();
          for (const id of syncedIds) await this.systemRepo.markAdjustmentSynced(id);
          batch = firestore().batch();
          count = 0;
          syncedIds.length = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        for (const id of syncedIds) await this.systemRepo.markAdjustmentSynced(id);
      }
    } catch (e) {
      console.error('Native Inventory Adjustment Sync Error:', e);
    }
  }

  getLastSynced() {
    return this.lastSynced;
  }
}
