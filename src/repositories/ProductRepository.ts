import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Product } from '../db/types';

export class ProductRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertProduct(product: Product) {
    const safeShopId = product.shopId?.toString().trim();
    if (!safeShopId || safeShopId === 'undefined') {
        throw new Error(`Invalid Shop ID: Product ${product.id} must be linked to a shop.`);
    }

    const query = `
      INSERT OR REPLACE INTO Product(id, shopId, categoryId, name, description, barcode, bulkBarcode, bulkQuantity, bulkPrice, bulkStockQuantity, bulkUnit, price, costPrice, stockQuantity, minStockLevel, unit, supplierId, status, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      product.id, safeShopId, product.categoryId, product.name, product.description,
      product.barcode, product.bulkBarcode, product.bulkQuantity, product.bulkPrice,
      product.bulkStockQuantity, product.bulkUnit || 'Carton', product.price, product.costPrice, product.stockQuantity,
      product.minStockLevel, product.unit, product.supplierId, product.status || 'ACTIVE',
      product.syncStatus ?? 0
    ];
    await this.db.executeSql(query, params);
  }

  async getProductByBarcode(barcode: string, shopId: string): Promise<Product | null> {
    if (!barcode) return null;
    const safeShopId = (shopId || '').toString().trim();
    const query = 'SELECT * FROM Product WHERE (barcode = ? OR bulkBarcode = ?) AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ?) AND status != "DELETED" LIMIT 1';
    const results = await this.db.executeSql(query, [barcode, barcode, safeShopId, shopId]);
    const rows = results[0]?.rows;
    if (rows && rows.length > 0) {
      return rows.item ? rows.item(0) : rows[0];
    }
    return null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const query = 'SELECT * FROM Product WHERE id = ?';
    const results = await this.db.executeSql(query, [id]);
    const rows = results[0]?.rows;
    if (rows && rows.length > 0) {
      return rows.item ? rows.item(0) : rows[0];
    }
    return null;
  }

  async getProductsByShop(shopId: string): Promise<Product[]> {
    const safeShopId = (shopId || '').toString().trim();
    const query = 'SELECT * FROM Product WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ?) AND status != "DELETED" ORDER BY name ASC';
    const results = await this.db.executeSql(query, [safeShopId, shopId]);
    const products: Product[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        products.push(rows.item ? rows.item(i) : rows[i]);
      }
    }
    return products;
  }

  async getUnsyncedProducts(shopId?: string): Promise<Product[]> {
    const safeShopId = shopId ? (shopId || '').toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM Product WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ?)'
      : 'SELECT * FROM Product WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, shopId] : [];
    const results = await this.db.executeSql(query, params);
    const products: Product[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        products.push(rows.item ? rows.item(i) : rows[i]);
      }
    }
    return products;
  }

  async markProductSynced(id: string) {
    const query = 'UPDATE Product SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async deleteProduct(id: string) {
    const query = "UPDATE Product SET status = 'DELETED', syncStatus = 0 WHERE id = ?";
    await this.db.executeSql(query, [id]);
  }

  async updateStock(productId: string, change: number, isBulk: boolean = false) {
    const column = isBulk ? 'bulkStockQuantity' : 'stockQuantity';
    const query = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
    await this.db.executeSql(query, [change, productId]);
  }

  async updateProduct(product: Product) {
    const safeShopId = product.shopId?.toString().trim();
    if (!safeShopId || safeShopId === 'undefined') {
        throw new Error(`Invalid Shop ID: Product ${product.id} must be linked to a shop.`);
    }

    const query = `
      UPDATE Product SET
        categoryId = ?, name = ?, description = ?, barcode = ?, bulkBarcode = ?,
        bulkQuantity = ?, bulkPrice = ?, bulkUnit = ?, price = ?, costPrice = ?,
        stockQuantity = ?, bulkStockQuantity = ?,
        minStockLevel = ?, unit = ?, status = ?, syncStatus = 0
      WHERE id = ? AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ?)
    `;
    const params = [
      product.categoryId, product.name, product.description, product.barcode, product.bulkBarcode,
      product.bulkQuantity, product.bulkPrice, product.bulkUnit || 'Carton', product.price, product.costPrice,
      product.stockQuantity, product.bulkStockQuantity,
      product.minStockLevel, product.unit, product.status, product.id, safeShopId, product.shopId
    ];
    await this.db.executeSql(query, params);
  }

  async getLowStockCount(shopId: string): Promise<number> {
    const safeShopId = (shopId || '').toString().trim();
    const query = 'SELECT COUNT(*) as total FROM Product WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ?) AND status != "DELETED" AND stockQuantity <= minStockLevel';
    const results = await this.db.executeSql(query, [safeShopId, shopId]);
    const row = results?.[0]?.rows?.item ? results[0].rows.item(0) : (results?.[0]?.rows?.[0] ?? null);
    return Number(row?.total ?? row?.TOTAL ?? 0);
  }
}
