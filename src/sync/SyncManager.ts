import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';

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

  constructor(
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private saleRepo: SaleRepository,
    private supplierRepo: SupplierRepository,
    private customerRepo: CustomerRepository
  ) {}

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
    if (this.realtimeUnsubscribers.length > 0) return;

    console.log('Starting real-time sync for shop:', shopId);

    const productUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('products')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
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

            await this.productRepo.insertProduct(productToInsert);
          }
        }
        this.onDataChangedCallback?.();
      });

    const categoryUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('categories')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            await this.categoryRepo.db.executeSql(
                'INSERT OR REPLACE INTO Category(id, shopId, name, syncStatus) VALUES (?, ?, ?, 1)',
                [data.id, data.shopId, data.name]
            );
          }
        }
        this.onDataChangedCallback?.();
      });

    const supplierUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('suppliers')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const local = await this.supplierRepo.getSupplierById(data.id);
            if (local && local.syncStatus === 0) continue;

            await this.supplierRepo.insertSupplier({
              id: data.id,
              shopId: data.shopId,
              name: data.name ?? (local ? local.name : 'Unknown Supplier'),
              contactPerson: data.contactPerson ?? (local ? local.contactPerson : null),
              email: data.email ?? (local ? local.email : null),
              phone: data.phone ?? (local ? local.phone : null),
              address: data.address ?? (local ? local.address : null),
              contactInfo: data.contactInfo ?? (local ? local.contactInfo : (data.phone ?? null)),
              currentBalance: data.currentBalance ?? (local ? local.currentBalance : 0),
              syncStatus: 1
            });
          }
        }
        this.onDataChangedCallback?.();
      });

    const customerUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('customers')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const local = await this.customerRepo.getCustomerById(data.id);
            if (local && local.syncStatus === 0) continue;

            await this.customerRepo.insertCustomer({
              id: data.id,
              shopId: data.shopId,
              name: data.name ?? (local ? local.name : 'Unknown Customer'),
              phone: data.phone ?? (local ? local.phone : null),
              email: data.email ?? (local ? local.email : null),
              currentBalance: data.currentBalance ?? (local ? local.currentBalance : 0),
              syncStatus: 1
            });
          }
        }
        this.onDataChangedCallback?.();
      });

    const saleUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('sales')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            await this.saleRepo.upsertRemoteSale(data, data.items || []);
          }
        }
        this.onDataChangedCallback?.();
      });

    const expenseUnsub = firestore()
      .collection('shops')
      .doc(shopId)
      .collection('expenses')
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            await this.productRepo.db.executeSql(
              'INSERT OR REPLACE INTO Expense(id, shopId, category, amount, description, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
              [data.id, data.shopId, data.category, data.amount, data.description || null, data.timestamp, 1]
            );
          }
        }
        this.onDataChangedCallback?.();
      });

    this.realtimeUnsubscribers.push(productUnsub, categoryUnsub, supplierUnsub, customerUnsub, saleUnsub, expenseUnsub);
  }

  public stopRealtimeSync() {
    if (this.realtimeUnsubscribers.length === 0) return;
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];
  }

  private setupNetworkListener() {
    if (this.isNetworkListenerActive) return;

    this.isNetworkListenerActive = true;
    this.unsubscribeNetwork = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Network is back online, triggering sync...');
        // Note: Automatic network sync might not have shopId context here
        // It will primarily sync UP local changes
        this.triggerSync();
      }
    });
  }

  async triggerSync(shopId?: string) {
    if (this.status === SyncStatus.Syncing) return;
    if (!shopId) {
        console.log('SyncManager (Native): No active shopId, skipping sync-up.');
        return;
    }

    this.status = SyncStatus.Syncing;
    try {
      // 1. First Push Local Changes (Sync Up)
      // These should be sequential to avoid transaction conflicts and ensure data integrity
      await this.safeSync('Sales', () => this.syncSales(shopId));
      await this.safeSync('Products', () => this.syncProducts(shopId));
      await this.safeSync('Categories', () => this.syncCategories(shopId));
      await this.safeSync('Suppliers', () => this.syncSuppliers(shopId));
      await this.safeSync('Customers', () => this.syncCustomers(shopId));
      await this.safeSync('Payments', () => this.syncPayments(shopId));
      await this.safeSync('SupplierPayments', () => this.syncSupplierPayments(shopId));

      // 2. Then Pull Remote Changes (Sync Down)
      // Now that we've pushed our changes, Firestore should have the latest state
      await this.safeSync('PullProducts', () => this.pullProducts(shopId));
      await this.safeSync('PullCategories', () => this.pullCategories(shopId));
      await this.safeSync('PullSuppliers', () => this.pullSuppliers(shopId));
      await this.safeSync('PullCustomers', () => this.pullCustomers(shopId));
      await this.safeSync('PullSales', () => this.pullSales(shopId));
      await this.safeSync('PullExpenses', () => this.pullExpenses(shopId));

      this.status = SyncStatus.Success;
      this.lastSynced = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
      this.status = SyncStatus.Error;
    } finally {
      this.onDataChangedCallback?.();
      // Return to idle status
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

  private async pullProducts(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('products')
        .get();

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

                // CRITICAL FIX: If local stock/price is > 0 but remote is 0,
                // and we just created/updated this locally, don't let the remote
                // wipe it out if the remote might be stale or corrupted.
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

  private async pullCategories(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('categories')
        .get();

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

  private async pullSuppliers(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('suppliers')
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const local = await this.supplierRepo.getSupplierById(data.id);
        if (local && local.syncStatus === 0) continue;

        await this.supplierRepo.insertSupplier({
          id: data.id,
          shopId: data.shopId,
          name: data.name ?? (local ? local.name : 'Unknown Supplier'),
          contactPerson: data.contactPerson ?? (local ? local.contactPerson : null),
          email: data.email ?? (local ? local.email : null),
          phone: data.phone ?? (local ? local.phone : null),
          address: data.address ?? (local ? local.address : null),
          contactInfo: data.contactInfo ?? (local ? local.contactInfo : (data.phone ?? null)),
          currentBalance: data.currentBalance ?? (local ? local.currentBalance : 0),
          syncStatus: 1
        });
      }
    } catch (e) {
      console.error('Pull Suppliers Error:', e);
    }
  }

  private async pullCustomers(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('customers')
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const local = await this.customerRepo.getCustomerById(data.id);
        if (local && local.syncStatus === 0) continue;

        await this.customerRepo.insertCustomer({
          id: data.id,
          shopId: data.shopId,
          name: data.name ?? (local ? local.name : 'Unknown Customer'),
          phone: data.phone ?? (local ? local.phone : null),
          email: data.email ?? (local ? local.email : null),
          currentBalance: data.currentBalance ?? (local ? local.currentBalance : 0),
          syncStatus: 1
        });
      }
    } catch (e) {
      console.error('Pull Customers Error:', e);
    }
  }

  private async pullSales(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('sales')
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        await this.saleRepo.upsertRemoteSale(data, data.items || []);
      }
    } catch (e) {
      console.error('Pull Sales Error:', e);
    }
  }

  private async pullExpenses(shopId: string) {
    try {
      const snapshot = await firestore()
        .collection('shops')
        .doc(shopId)
        .collection('expenses')
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        await this.productRepo.db.executeSql(
          'INSERT OR REPLACE INTO Expense(id, shopId, category, amount, description, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [data.id, data.shopId, data.category, data.amount, data.description || null, data.timestamp]
        );
      }
    } catch (e) {
      console.error('Pull Expenses Error:', e);
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
        batch.delete(saleRef);
      } else {
        const items = await this.saleRepo.getItemsForSale(sale.id);
        const saleData = {
          id: sale.id,
          shopId: targetShopId,
          employeeId: sale.employeeId || "",
          timestamp: sale.timestamp || Date.now(),
          totalAmount: sale.totalAmount ?? 0,
          isReverted: sale.isReverted === 1,
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
          batch.delete(productRef);
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
            status: product.status || 'ACTIVE'
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
        name: cat.name || "Unnamed Category"
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
        currentBalance: supplier.currentBalance ?? 0
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
        currentBalance: customer.currentBalance ?? 0
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
        note: payment.note || null
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
                note: p.note || null
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

  getStatus() {
    return this.status;
  }

  getLastSynced() {
    return this.lastSynced;
  }
}
