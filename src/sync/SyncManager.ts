import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { ProductRepository } from '../repositories/ProductRepository';
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

  constructor(
    private productRepo: ProductRepository,
    private saleRepo: SaleRepository,
    private supplierRepo: SupplierRepository,
    private customerRepo: CustomerRepository
  ) {}

  public initialize() {
    this.setupNetworkListener();
  }

  public cleanup() {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
    }
  }

  private setupNetworkListener() {
    if (this.isNetworkListenerActive) return;

    this.isNetworkListenerActive = true;
    this.unsubscribeNetwork = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Network is back online, triggering sync...');
        this.triggerSync();
      }
    });
  }

  async triggerSync() {
    if (this.status === SyncStatus.Syncing) return;

    this.status = SyncStatus.Syncing;
    try {
      await Promise.all([
        this.syncSales(),
        this.syncProducts(),
        this.syncSuppliers(),
        this.syncCustomers(),
        this.syncPayments()
      ]);
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
