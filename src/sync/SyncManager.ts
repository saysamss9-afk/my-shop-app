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
            await this.productRepo.insertProduct({
                id: data.id,
                shopId: data.shopId,
                categoryId: data.categoryId || null,
                name: data.name,
                description: data.description || null,
                barcode: data.barcode || null,
                bulkBarcode: data.bulkBarcode || null,
                bulkQuantity: data.bulkQuantity || 1,
                bulkPrice: data.bulkPrice || 0,
                bulkStockQuantity: data.bulkStockQuantity || 0,
                price: data.price || 0,
                costPrice: data.costPrice || 0,
                stockQuantity: data.stockQuantity || 0,
                minStockLevel: data.minStockLevel || 0,
                unit: data.unit || 'pcs',
                supplierId: data.supplierId || null,
                syncStatus: 1
            });
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
            await this.supplierRepo.db.executeSql(
              'INSERT OR REPLACE INTO Supplier(id, shopId, name, contactInfo, syncStatus) VALUES (?, ?, ?, ?, 1)',
              [data.id, data.shopId, data.name, data.contactInfo || null]
            );
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
            await this.customerRepo.db.executeSql(
              'INSERT OR REPLACE INTO Customer(id, shopId, name, phone, email, currentBalance, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
              [data.id, data.shopId, data.name, data.phone || null, data.email || null, data.currentBalance || 0]
            );
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

    this.status = SyncStatus.Syncing;
    try {
      const syncTasks = [
        this.syncSales(),
        this.syncProducts(),
        this.syncSuppliers(),
        this.syncCustomers(),
        this.syncPayments()
      ];

      // If shopId is provided, also pull changes from remote
      if (shopId) {
        syncTasks.push(
          this.pullProducts(shopId),
          this.pullCategories(shopId),
          this.pullSuppliers(shopId),
          this.pullCustomers(shopId),
          this.pullSales(shopId),
          this.pullExpenses(shopId)
        );
      }

      await Promise.all(syncTasks);
      this.status = SyncStatus.Success;
      this.lastSynced = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
      this.status = SyncStatus.Error;
    } finally {
      // Return to idle status
      setTimeout(() => {
        if (this.status !== SyncStatus.Syncing) {
          this.status = SyncStatus.Idle;
        }
      }, 3000);
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
        await this.productRepo.insertProduct({
          id: data.id,
          shopId: data.shopId,
          categoryId: data.categoryId || null,
          name: data.name,
          description: data.description || null,
          barcode: data.barcode || null,
          bulkBarcode: data.bulkBarcode || null,
          bulkQuantity: data.bulkQuantity || 1,
          bulkPrice: data.bulkPrice || 0,
          bulkStockQuantity: data.bulkStockQuantity || 0,
          price: data.price || 0,
          costPrice: data.costPrice || 0,
          stockQuantity: data.stockQuantity || 0,
          minStockLevel: data.minStockLevel || 0,
          unit: data.unit || 'pcs',
          supplierId: data.supplierId || null,
          syncStatus: 1 // Already synced
        });
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
        await this.supplierRepo.db.executeSql(
          'INSERT OR REPLACE INTO Supplier(id, shopId, name, contactInfo, syncStatus) VALUES (?, ?, ?, ?, 1)',
          [data.id, data.shopId, data.name, data.contactInfo || null]
        );
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
        await this.customerRepo.db.executeSql(
          'INSERT OR REPLACE INTO Customer(id, shopId, name, phone, email, currentBalance, syncStatus) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [data.id, data.shopId, data.name, data.phone || null, data.email || null, data.currentBalance || 0]
        );
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

  private async syncSales() {
    const unsynced = await this.saleRepo.getUnsyncedSales();
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const sale of unsynced) {
      const saleRef = firestore().collection('shops').doc(sale.shopId).collection('sales').doc(sale.id);

      if (sale.isReverted === 1) {
        batch.delete(saleRef);
      } else {
        const items = await this.saleRepo.getItemsForSale(sale.id);
        const saleData = {
          id: sale.id,
          shopId: sale.shopId,
          employeeId: sale.employeeId,
          timestamp: sale.timestamp,
          totalAmount: sale.totalAmount,
          isReverted: sale.isReverted === 1,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.priceAtSale
          }))
        };
        batch.set(saleRef, saleData);
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

  private async syncProducts() {
    const unsynced = await this.productRepo.getUnsyncedProducts();
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const product of unsynced) {
      const productRef = firestore().collection('shops').doc(product.shopId).collection('products').doc(product.id);

      const productData = {
        id: product.id,
        shopId: product.shopId,
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        bulkBarcode: product.bulkBarcode,
        bulkQuantity: product.bulkQuantity,
        price: product.price,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        unit: product.unit,
        supplierId: product.supplierId
      };

      batch.set(productRef, productData);
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

  private async syncSuppliers() {
    const unsynced = await this.supplierRepo.getUnsyncedSuppliers();
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const supplier of unsynced) {
      const supplierRef = firestore().collection('shops').doc(supplier.shopId).collection('suppliers').doc(supplier.id);

      const supplierData = {
        id: supplier.id,
        shopId: supplier.shopId,
        name: supplier.name,
        contactInfo: supplier.contactInfo
      };

      batch.set(supplierRef, supplierData);
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

  private async syncCustomers() {
    const unsynced = await this.customerRepo.getUnsyncedCustomers();
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const customer of unsynced) {
      const customerRef = firestore().collection('shops').doc(customer.shopId).collection('customers').doc(customer.id);

      const customerData = {
        id: customer.id,
        shopId: customer.shopId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        currentBalance: customer.currentBalance
      };

      batch.set(customerRef, customerData);
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

  private async syncPayments() {
    const unsynced = await this.customerRepo.getUnsyncedPayments();
    if (unsynced.length === 0) return;

    let batch = firestore().batch();
    let count = 0;
    const syncedIds: string[] = [];

    for (const payment of unsynced) {
      const paymentRef = firestore().collection('shops').doc(payment.shopId).collection('payments').doc(payment.id);

      const paymentData = {
        id: payment.id,
        customerId: payment.customerId,
        shopId: payment.shopId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        timestamp: payment.timestamp,
        note: payment.note
      };

      batch.set(paymentRef, paymentData);
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

  getStatus() {
    return this.status;
  }

  getLastSynced() {
    return this.lastSynced;
  }
}
