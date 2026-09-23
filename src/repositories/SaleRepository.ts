import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Sale, SaleItem } from '../db/types';

export class SaleRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertSale(sale: Sale, items: SaleItem[]) {
    await this.db.transaction(async (tx: any) => {
      const safeShopId = sale.shopId?.toString().trim();
      const saleQuery = `
        INSERT INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `;
      const saleParams = [
        sale.id, safeShopId, sale.employeeId, sale.customerId, sale.timestamp,
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

        const decrementStockQuery = `UPDATE Product SET ${column} = ${column} - ?, syncStatus = 0 WHERE id = ?`;
        await tx.executeSql(decrementStockQuery, [item.quantity, item.productId]);
      }
    });
  }

  async getSalesByShop(shopId: string): Promise<any[]> {
    const query = `
      SELECT
        s.*,
        COALESCE(e.name, sh.ownerName, 'Staff') as staffName,
        COALESCE(e.role, 'OWNER') as staffRole,
        c.name as customerName
      FROM Sale s
      LEFT JOIN Employee e ON s.employeeId = e.id
      LEFT JOIN Shop sh ON s.shopId = sh.id
      LEFT JOIN Customer c ON s.customerId = c.id
      WHERE s.shopId = ?
      ORDER BY s.timestamp DESC
    `;
    const results = await this.db.executeSql(query, [shopId]);
    const sales: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      sales.push(results[0].rows.item(i));
    }
    return sales;
  }

  async getSalesByShopAndRange(shopId: string, start: number, end: number): Promise<any[]> {
    const query = `
      SELECT
        s.*,
        COALESCE(e.name, sh.ownerName, 'Staff') as staffName,
        COALESCE(e.role, 'OWNER') as staffRole,
        c.name as customerName
      FROM Sale s
      LEFT JOIN Employee e ON s.employeeId = e.id
      LEFT JOIN Shop sh ON s.shopId = sh.id
      LEFT JOIN Customer c ON s.customerId = c.id
      WHERE s.shopId = ? AND s.timestamp BETWEEN ? AND ?
      ORDER BY s.timestamp DESC
    `;
    const results = await this.db.executeSql(query, [shopId, start, end]);
    const sales: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      sales.push(results[0].rows.item(i));
    }
    return sales;
  }

  async getDetailedItemsForSale(saleId: string): Promise<any[]> {
    const query = `
      SELECT si.*, p.name as productName, p.unit, p.bulkUnit
      FROM SaleItem si
      LEFT JOIN Product p ON si.productId = p.id
      WHERE si.saleId = ?
    `;
    const results = await this.db.executeSql(query, [saleId]);
    const items: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      items.push(results[0].rows.item(i));
    }
    return items;
  }

  async getUnsyncedSales(shopId?: string): Promise<Sale[]> {
    const query = shopId
      ? 'SELECT * FROM Sale WHERE syncStatus = 0 AND shopId = ?'
      : 'SELECT * FROM Sale WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
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
      const safeShopId = (sale.shopId || '').toString().trim();

      // Ensure timestamp is a valid numeric millisecond value
      let timestamp = Number(sale.timestamp);
      if (isNaN(timestamp) || !timestamp || timestamp <= 0) {
        if (sale.timestamp?.toMillis) {
          timestamp = sale.timestamp.toMillis();
        } else if (sale.timestamp?.seconds) {
          timestamp = sale.timestamp.seconds * 1000;
        } else if (sale.lastUpdated) {
          timestamp = Number(sale.lastUpdated);
        } else {
          timestamp = Date.now();
        }
      }

      // 1. Insert or Replace the Sale record
      const saleQuery = `
        INSERT OR REPLACE INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `;
      const saleParams = [
        sale.id, safeShopId, sale.employeeId || null, sale.customerId || null, timestamp,
        Number(sale.totalAmount || 0), sale.paymentMethod || 'CASH', sale.paymentStatus || 'PAID',
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
        const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
        await tx.executeSql(restoreStockQuery, [item.quantity, item.productId]);
      }
    });
  }

  async refundSingleSaleItem(saleItemId: string, refundQuantity: number) {
    await this.db.transaction(async (tx: any) => {
      // 1. Fetch sale item info
      const itemQuery = 'SELECT saleId, productId, quantity, priceAtSale, isBulk FROM SaleItem WHERE id = ?';
      const [itemResult] = await tx.executeSql(itemQuery, [saleItemId]);
      if (itemResult.rows.length === 0) {
        throw new Error('Sale item not found.');
      }
      const item = itemResult.rows.item(0);

      if (refundQuantity <= 0 || refundQuantity > item.quantity) {
        throw new Error(`Invalid refund quantity. Max available: ${item.quantity}`);
      }

      // 2. Fetch parent sale info
      const saleQuery = 'SELECT id, totalAmount, customerId, paymentStatus FROM Sale WHERE id = ?';
      const [saleResult] = await tx.executeSql(saleQuery, [item.saleId]);
      const sale = saleResult.rows.item(0);

      const refundValue = item.priceAtSale * refundQuantity;

      // 3. Update or delete the item row
      if (refundQuantity === item.quantity) {
        await tx.executeSql('DELETE FROM SaleItem WHERE id = ?', [saleItemId]);
      } else {
        await tx.executeSql('UPDATE SaleItem SET quantity = quantity - ?, syncStatus = 0 WHERE id = ?', [refundQuantity, saleItemId]);
      }

      // 4. Update the parent sale total amount
      await tx.executeSql('UPDATE Sale SET totalAmount = totalAmount - ?, syncStatus = 0 WHERE id = ?', [refundValue, item.saleId]);

      // 5. Adjust customer debt if applicable
      if (sale.customerId && sale.paymentStatus === 'DEBT') {
        await tx.executeSql('UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?', [refundValue, sale.customerId]);
      }

      // 6. Return stock back to inventory
      const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
      const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
      await tx.executeSql(restoreStockQuery, [refundQuantity, item.productId]);

      // 7. If no more items left in sale, mark parent sale as reverted
      const [remainingItems] = await tx.executeSql('SELECT COUNT(*) as count FROM SaleItem WHERE saleId = ?', [item.saleId]);
      if (remainingItems.rows.item(0).count === 0) {
        await tx.executeSql('UPDATE Sale SET isReverted = 1 WHERE id = ?', [item.saleId]);
      }
    });
  }
}
