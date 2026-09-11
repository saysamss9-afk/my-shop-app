import firebase from '../firebase-config';
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
  private onDataChangedCallback: (() => void) | null = null;
  private realtimeUnsubscribers: (() => void)[] = [];

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
    window.removeEventListener('online', this.handleOnline);
    this.stopRealtimeSync();
  }

  private handleOnline = () => {
    console.log('Browser is back online, triggering sync...');
    this.triggerSync();
  };

  private setupNetworkListener() {
    if (this.isNetworkListenerActive) return;

    this.isNetworkListenerActive = true;
    window.addEventListener('online', this.handleOnline);

    if (typeof navigator !== 'undefined' && (navigator as any).onLine) {
      this.triggerSync();
    }
  }

  public startRealtimeSync(shopId: string) {
    if (!shopId) return;
    if (this.realtimeUnsubscribers.length > 0) return;

    console.log('Starting web real-time sync for shop:', shopId);

    try {
        const productUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('products')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    const local = await this.productRepo.getProductById(data.id);
                    if (local && (local.syncStatus === 0 || local.status === 'DELETED')) continue;

                    if (data.status === 'DELETED') {
                        await this.productRepo.deleteProduct(data.id);
                        changed = true;
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
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Product sync error:', err.message));

        const categoryUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('categories')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    await this.categoryRepo.db.executeSql(
                        'INSERT OR REPLACE INTO Category(id, shopId, name, syncStatus) VALUES (?, ?, ?, 1)',
                        [data.id, data.shopId, data.name]
                    );
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Category sync error:', err.message));

        const supplierUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('suppliers')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
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
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Supplier sync error:', err.message));

        const customerUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('customers')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
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
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Customer sync error:', err.message));

        const saleUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('sales')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    await this.saleRepo.upsertRemoteSale(data, data.items || []);
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Sale sync error:', err.message));

        const expenseUnsub = firebase.firestore()
          .collection('shops')
          .doc(shopId)
          .collection('expenses')
          .onSnapshot(async (snapshot) => {
            if (!snapshot) return;
            let changed = false;
            for (const change of snapshot.docChanges()) {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    await this.productRepo.db.executeSql(
                        'INSERT OR REPLACE INTO Expense(id, shopId, category, amount, description, timestamp, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
                        [data.id, data.shopId, data.category, data.amount, data.description || null, data.timestamp, 1]
                    );
                    changed = true;
                }
            }
            if (changed) this.onDataChangedCallback?.();
          }, (err) => console.warn('Expense sync error:', err.message));

        this.realtimeUnsubscribers.push(
            productUnsub, categoryUnsub, supplierUnsub,
            customerUnsub, saleUnsub, expenseUnsub
        );
    } catch (e) {
        console.error('Failed to start real-time sync listeners:', e);
    }
  }

  public stopRealtimeSync() {
    if (this.realtimeUnsubscribers.length === 0) return;
    console.log('Stopping web real-time sync...');
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];
  }

  async triggerSync(shopIdInput?: string | any, deepSync = false) {
    if (this.status === SyncStatus.Syncing) return;

    const shopId = typeof shopIdInput === 'object' ? shopIdInput.shopId : shopIdInput;

    if (!shopId || shopId === 'undefined' || shopId === '[object Object]') {
        console.log('SyncManager: No active shopId, skipping sync-up. Input was:', shopIdInput);
        return;
    }

    this.status = SyncStatus.Syncing;
    this.onDataChangedCallback?.();

    try {
      // 1. First PUSH local changes (Sync Up)
      // This is ALWAYS done to ensure local work is saved to the cloud
      await this.safeSync('Sales', () => this.syncSales(shopId));
      await this.safeSync('Products', () => this.syncProducts(shopId));
      await this.safeSync('Categories', () => this.syncCategories(shopId));
      await this.safeSync('Suppliers', () => this.syncSuppliers(shopId));
      await this.safeSync('Customers', () => this.syncCustomers(shopId));
      await this.safeSync('Payments', () => this.syncPayments(shopId));
      await this.safeSync('SupplierPayments', () => this.syncSupplierPayments(shopId));

      // 2. Then PULL changes from remote (Sync Down)
      // Only do full collection pulls if deepSync is requested (e.g., initial load or manual deep sync)
      // Otherwise, real-time listeners handle incremental updates efficiently.
      if (deepSync) {
          console.log('[SYNC] Performing deep sync (full collection pull)...');
          await this.safeSync('PullProducts', () => this.pullProducts(shopId));
          await this.safeSync('PullCategories', () => this.pullCategories(shopId));
          await this.safeSync('PullSuppliers', () => this.pullSuppliers(shopId));
          await this.safeSync('PullCustomers', () => this.pullCustomers(shopId));
          // Note: Add pullSales or pullExpenses if needed for deep reconciliation
      }

      this.status = SyncStatus.Success;
      this.lastSynced = Date.now();
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

  private async pullProducts(shopId: string) {
      try {
          const snapshot = await firebase.firestore()
              .collection('shops')
              .doc(shopId)
              .collection('products')
              .get();

              for (const doc of snapshot.docs) {
                const data = doc.data();

                // If we have a local unsynced product, prefer local changes
                const local = await this.productRepo.getProductById(data.id);
                if (local && (local.syncStatus === 0 || local.status === 'DELETED')) continue;

                // If the remote product is marked as DELETED, we should actually remove it locally
                if (data.status === 'DELETED') {
                    await this.productRepo.deleteProduct(data.id);
                    continue;
                }

                // Merge remote values with local defaults to avoid overwriting
                // local numeric values with zeros when the remote document
                // doesn't include those fields or has buggy zero values.
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
          console.error('Web Pull Products Error:', e);
      }
  }

  private async pullCategories(shopId: string) {
      try {
          const snapshot = await firebase.firestore()
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
          console.error('Web Pull Categories Error:', e);
      }
  }

  private async pullSuppliers(shopId: string) {
      try {
          const snapshot = await firebase.firestore()
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
          console.error('Web Pull Suppliers Error:', e);
      }
  }

  private async pullCustomers(shopId: string) {
      try {
          const snapshot = await firebase.firestore()
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
          console.error('Web Pull Customers Error:', e);
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
    const unsynced = await this.saleRepo.getUnsyncedSales(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
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
        console.warn('Sync Sanitizer: Skipping sale with invalid shopId', sale.id);
        continue;
      }
      const saleRef = firebase.firestore().collection('shops').doc(targetShopId).collection('sales').doc(sale.id);

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
    const unsynced = await this.productRepo.getUnsyncedProducts(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const product of unsynced) {
      let targetShopId = product.shopId;

      if ((!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') && shopId && shopId !== 'undefined') {
        console.warn(`SyncManager: Repairing orphaned product ${product.id} with current shopId ${shopId}`);
        targetShopId = shopId;
        await this.productRepo.db.executeSql('UPDATE Product SET shopId = ? WHERE id = ?', [shopId, product.id]);
      }

      if (!targetShopId || targetShopId === 'undefined' || targetShopId === '[object Object]') {
        console.warn('Sync Sanitizer: Skipping product with invalid shopId', product.id);
        continue;
      }

      console.log(`[SYNC] Pushing product: ${product.name}, stock: ${product.stockQuantity}, price: ${product.price}`);

      const productRef = firebase.firestore().collection('shops').doc(targetShopId).collection('products').doc(product.id);

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
    const unsynced = await this.categoryRepo.getUnsyncedCategories(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const cat of unsynced) {
      const ref = firebase.firestore().collection('shops').doc(cat.shopId).collection('categories').doc(cat.id);
      const data = {
        id: cat.id,
        shopId: cat.shopId,
        name: cat.name || "Unnamed Category"
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
    const unsynced = await this.supplierRepo.getUnsyncedSuppliers(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const supplier of unsynced) {
      let targetShopId = supplier.shopId;

      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          console.warn(`SyncManager: Repairing orphaned supplier ${supplier.id} with current shopId ${shopId}`);
          targetShopId = shopId;
          await this.supplierRepo.db.executeSql('UPDATE Supplier SET shopId = ? WHERE id = ?', [shopId, supplier.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
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
        currentBalance: supplier.currentBalance ?? 0
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
    const unsynced = await this.customerRepo.getUnsyncedCustomers(shopId);
    if (unsynced.length === 0) return;

    let batch = firebase.firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const customer of unsynced) {
      let targetShopId = customer.shopId;

      if ((!targetShopId || targetShopId === 'undefined') && shopId && shopId !== 'undefined') {
          console.warn(`SyncManager: Repairing orphaned customer ${customer.id} with current shopId ${shopId}`);
          targetShopId = shopId;
          await this.customerRepo.db.executeSql('UPDATE Customer SET shopId = ? WHERE id = ?', [shopId, customer.id]);
      }

      if (!targetShopId || targetShopId === 'undefined') {
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
        currentBalance: customer.currentBalance ?? 0
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
        note: payment.note || null
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
                note: p.note || null
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

  getStatus() {
    return this.status;
  }

  getLastSynced() {
    return this.lastSynced;
  }
}
