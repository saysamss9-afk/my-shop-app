import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Sale, SaleItem } from '../db/types';

export class SaleRepository {
  constructor(private db: SQLiteDatabase) {}

  async insertSale(sale: Sale, items: SaleItem[]) {
    await this.db.transaction(async (tx: any) => {
      const saleQuery = `
        INSERT INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `;
      const saleParams = [
        sale.id, sale.shopId, sale.employeeId, sale.customerId, sale.timestamp,
        sale.totalAmount, sale.paymentMethod, sale.paymentStatus, sale.dueDate
      ];
      await tx.executeSql(saleQuery, saleParams);

      for (const item of items) {
        const itemQuery = `
          INSERT INTO SaleItem(id, saleId, productId, quantity, priceAtSale, isBulk)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const itemParams = [item.id, item.saleId, item.productId, item.quantity, item.priceAtSale, item.isBulk];
        await tx.executeSql(itemQuery, itemParams);

        // Update stock based on whether it's bulk or unit
        const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
        const stockQuery = `UPDATE Product SET ${column} = ${column} - ? WHERE id = ?`;
        await tx.executeSql(stockQuery, [item.quantity, item.productId]);
      }
    });
  }

  async getSalesByShop(shopId: string): Promise<Sale[]> {
    const query = 'SELECT * FROM Sale WHERE shopId = ? AND isReverted = 0 ORDER BY timestamp DESC';
    const results = await this.db.executeSql(query, [shopId]);
    const sales: Sale[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      sales.push(results[0].rows.item(i));
    }
    return sales;
  }

  async getItemsForSale(saleId: string): Promise<SaleItem[]> {
    const query = 'SELECT * FROM SaleItem WHERE saleId = ?';
    const results = await this.db.executeSql(query, [saleId]);
    const items: SaleItem[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      items.push(results[0].rows.item(i));
    }
    return items;
  }

  async getUnsyncedSales(): Promise<Sale[]> {
    const query = 'SELECT * FROM Sale WHERE syncStatus = 0';
    const results = await this.db.executeSql(query);
    const sales: Sale[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      sales.push(results[0].rows.item(i));
    }
    return sales;
  }

  async markSaleSynced(id: string) {
    const query = 'UPDATE Sale SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async revertSale(saleId: string) {
    await this.db.transaction(async (tx: any) => {
      const revertQuery = 'UPDATE Sale SET isReverted = 1, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(revertQuery, [saleId]);

      // Restore stock
      const itemsQuery = 'SELECT * FROM SaleItem WHERE saleId = ?';
      const [itemsResults] = await tx.executeSql(itemsQuery, [saleId]);
      for (let i = 0; i < itemsResults.rows.length; i++) {
        const item = itemsResults.rows.item(i);
        const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
        const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ? WHERE id = ?`;
        await tx.executeSql(restoreStockQuery, [item.quantity, item.productId]);
      }
    });
  }
}
