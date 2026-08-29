import SQLite from 'react-native-sqlite-storage';
import { Product } from '../db/types';

export class ProductRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async insertProduct(product: Product) {
    const query = `
      INSERT OR REPLACE INTO Product(id, shopId, categoryId, name, description, barcode, bulkBarcode, bulkQuantity, price, costPrice, stockQuantity, minStockLevel, unit, supplierId, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      product.id, product.shopId, product.categoryId, product.name, product.description,
      product.barcode, product.bulkBarcode, product.bulkQuantity, product.price,
      product.costPrice, product.stockQuantity, product.minStockLevel, product.unit,
      product.supplierId
    ];
    await this.db.executeSql(query, params);
  }

  async getProductsByShop(shopId: string): Promise<Product[]> {
    const query = 'SELECT * FROM Product WHERE shopId = ?';
    const results = await this.db.executeSql(query, [shopId]);
    const products: Product[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      products.push(results[0].rows.item(i));
    }
    return products;
  }

  async getUnsyncedProducts(): Promise<Product[]> {
    const query = 'SELECT * FROM Product WHERE syncStatus = 0';
    const results = await this.db.executeSql(query);
    const products: Product[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      products.push(results[0].rows.item(i));
    }
    return products;
  }

  async markProductSynced(id: string) {
    const query = 'UPDATE Product SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async updateStock(productId: string, change: number) {
    const query = 'UPDATE Product SET stockQuantity = stockQuantity + ? WHERE id = ?';
    await this.db.executeSql(query, [change, productId]);
  }

  async getLowStockCount(shopId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM Product WHERE shopId = ? AND stockQuantity <= minStockLevel';
    const results = await this.db.executeSql(query, [shopId]);
    return results[0].rows.item(0).count;
  }
}
