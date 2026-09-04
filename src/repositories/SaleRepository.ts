import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Sale, SaleItem } from '../db/types';

export class SaleRepository {
  constructor(public db: SQLiteDatabase) {}

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

      // If it's a debt sale, update customer balance
      if (sale.customerId && sale.paymentStatus === 'DEBT') {
        const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance + ?, syncStatus = 0 WHERE id = ?';
        await tx.executeSql(updateBalanceQuery, [sale.totalAmount, sale.customerId]);
      }

      for (const item of items) {
        const itemQuery = `
          INSERT INTO SaleItem(id, saleId, productId, quantity, priceAtSale, isBulk)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const itemParams = [item.id, item.saleId, item.productId, item.quantity, item.priceAtSale, item.isBulk];
        await tx.executeSql(itemQuery, itemParams);

        const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
        const stockQuery = `SELECT ${column} AS availableStock FROM Product WHERE id = ?`;
        const [stockResult] = await tx.executeSql(stockQuery, [item.productId]);
        const availableStock = Number(stockResult?.rows?.item?.(0)?.availableStock ?? 0);

        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for sale item: requested ${item.quantity}, available ${availableStock}.`);
        }

        const decrementStockQuery = `UPDATE Product SET ${column} = ${column} - ? WHERE id = ?`;
        await tx.executeSql(decrementStockQuery, [item.quantity, item.productId]);
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

  async upsertRemoteSale(sale: any, items: any[]) {
    await this.db.transaction(async (tx: any) => {
      // 1. Insert or Replace the Sale record
      const saleQuery = `
        INSERT OR REPLACE INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `;
      const saleParams = [
        sale.id, sale.shopId, sale.employeeId, sale.customerId || null, sale.timestamp,
        sale.totalAmount, sale.paymentMethod || 'CASH', sale.paymentStatus || 'PAID',
        sale.dueDate || null, sale.isReverted ? 1 : 0
      ];
      await tx.executeSql(saleQuery, saleParams);

      // 2. Delete existing items for this sale (if any) to handle updates cleanly
      await tx.executeSql('DELETE FROM SaleItem WHERE saleId = ?', [sale.id]);

      // 3. Insert SaleItems
      for (const item of items) {
        const itemQuery = `
          INSERT INTO SaleItem(id, saleId, productId, quantity, priceAtSale, isBulk)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const itemId = `${sale.id}_${item.productId}_${item.isBulk ? 'bulk' : 'unit'}`;
        const itemParams = [itemId, sale.id, item.productId, item.quantity, item.priceAtSale, item.isBulk ? 1 : 0];
        await tx.executeSql(itemQuery, itemParams);
      }
    });
  }

  async revertSale(saleId: string) {
    await this.db.transaction(async (tx: any) => {
      // Get sale info first to know if we need to update customer balance
      const saleInfoQuery = 'SELECT customerId, totalAmount, paymentStatus FROM Sale WHERE id = ?';
      const [saleInfoResult] = await tx.executeSql(saleInfoQuery, [saleId]);
      const sale = saleInfoResult.rows.item(0);

      const revertQuery = 'UPDATE Sale SET isReverted = 1, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(revertQuery, [saleId]);

      // If it was a debt sale, reduce customer balance
      if (sale && sale.customerId && sale.paymentStatus === 'DEBT') {
        const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
        await tx.executeSql(updateBalanceQuery, [sale.totalAmount, sale.customerId]);
      }

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
