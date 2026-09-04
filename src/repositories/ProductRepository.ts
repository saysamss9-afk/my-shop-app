import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Product } from '../db/types';

export class ProductRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertProduct(product: Product) {
    const query = `
      INSERT OR REPLACE INTO Product(id, shopId, categoryId, name, description, barcode, bulkBarcode, bulkQuantity, bulkPrice, bulkStockQuantity, price, costPrice, stockQuantity, minStockLevel, unit, supplierId, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      product.id, product.shopId, product.categoryId, product.name, product.description,
      product.barcode, product.bulkBarcode, product.bulkQuantity, product.bulkPrice,
      product.bulkStockQuantity, product.price, product.costPrice, product.stockQuantity,
      product.minStockLevel, product.unit, product.supplierId
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

  async updateStock(productId: string, change: number, isBulk: boolean = false) {
    const column = isBulk ? 'bulkStockQuantity' : 'stockQuantity';
    const query = `UPDATE Product SET ${column} = ${column} + ? WHERE id = ?`;
    await this.db.executeSql(query, [change, productId]);
  }

  async getLowStockCount(shopId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM Product WHERE shopId = ? AND stockQuantity <= minStockLevel';
    const results = await this.db.executeSql(query, [shopId]);
    const row = results?.[0]?.rows?.item?.(0) ?? null;
    return Number(row?.count ?? 0);
  }
}
