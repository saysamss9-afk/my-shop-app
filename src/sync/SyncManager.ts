import firestore from '@react-native-firebase/firestore';
import { ProductRepository } from '../repositories/ProductRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';

export enum SyncStatus {
  Idle,
  Syncing,
  Error,
  Success
}

export class SyncManager {
  private status: SyncStatus = SyncStatus.Idle;
  private lastSynced: number = 0;

  constructor(
    private productRepo: ProductRepository,
    private saleRepo: SaleRepository,
    private supplierRepo: SupplierRepository
  ) {}

  async triggerSync() {
    if (this.status === SyncStatus.Syncing) return;

    this.status = SyncStatus.Syncing;
    try {
      await Promise.all([
        this.syncSales(),
        this.syncProducts(),
        this.syncSuppliers()
      ]);
      this.status = SyncStatus.Success;
      this.lastSynced = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
      this.status = SyncStatus.Error;
    } finally {
      this.status = SyncStatus.Idle;
    }
  }

  private async syncSales() {
    const unsynced = await this.saleRepo.getUnsyncedSales();
    for (const sale of unsynced) {
      try {
        if (sale.isReverted === 1) {
          await firestore()
            .collection('shops')
            .doc(sale.shopId)
            .collection('sales')
            .doc(sale.id)
            .delete();
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

          await firestore()
            .collection('shops')
            .doc(sale.shopId)
            .collection('sales')
            .doc(sale.id)
            .set(saleData);
        }
        await this.saleRepo.markSaleSynced(sale.id);
      } catch (e) {
        console.error(`Failed to sync sale ${sale.id}`, e);
      }
    }
  }

  private async syncProducts() {
    const unsynced = await this.productRepo.getUnsyncedProducts();
    for (const product of unsynced) {
      try {
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

        await firestore()
          .collection('shops')
          .doc(product.shopId)
          .collection('products')
          .doc(product.id)
          .set(productData);

        await this.productRepo.markProductSynced(product.id);
      } catch (e) {
        console.error(`Failed to sync product ${product.id}`, e);
      }
    }
  }

  private async syncSuppliers() {
    const unsynced = await this.supplierRepo.getUnsyncedSuppliers();
    for (const supplier of unsynced) {
      try {
        const supplierData = {
          id: supplier.id,
          shopId: supplier.shopId,
          name: supplier.name,
          contactInfo: supplier.contactInfo
        };

        await firestore()
          .collection('shops')
          .doc(supplier.shopId)
          .collection('suppliers')
          .doc(supplier.id)
          .set(supplierData);

        await this.supplierRepo.markSupplierSynced(supplier.id);
      } catch (e) {
        console.error(`Failed to sync supplier ${supplier.id}`, e);
      }
    }
  }
}
