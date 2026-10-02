import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Sale, SaleItem } from '../db/types';
import { parseTimestamp } from '../utils/dateUtils';

const getRow = (rows: any, index: number) => (typeof rows?.item === 'function' ? rows.item(index) : rows?.[index]);

const sanitizeShopId = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'object') {
    const extracted = id.shopId || id.id || id.uid || '';
    return typeof extracted === 'string' ? extracted.trim() : String(extracted).trim();
  }
  const str = String(id).trim();
  if (str === 'undefined' || str === '[object Object]' || str === 'null') return '';
  return str;
};

export class SaleRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertSale(sale: Sale, items: SaleItem[]) {
    const safeShopId = sanitizeShopId(sale.shopId);
    if (!safeShopId) {
      throw new Error('Invalid Shop ID: Sale must be linked to a shop.');
    }
    const timestamp = parseTimestamp(sale.timestamp, Date.now());
    const totalAmount = Number(sale.totalAmount || 0);
    const amountPaid = sale.amountPaid !== undefined && sale.amountPaid !== null ? Number(sale.amountPaid) : (sale.paymentStatus === 'DEBT' ? 0 : totalAmount);
    const balance = sale.balance !== undefined && sale.balance !== null ? Number(sale.balance) : Math.max(0, totalAmount - amountPaid);
    const paymentStatus = sale.paymentStatus || (balance <= 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'DEBT'));

    const saleQuery = `
      INSERT INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, amountPaid, balance, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `;
    const saleParams = [
      sale.id, safeShopId, sale.employeeId, sale.customerId, timestamp,
      totalAmount, amountPaid, balance, sale.paymentMethod, paymentStatus, sale.dueDate
    ];
    await this.db.executeSql(saleQuery, saleParams);

    // If there is an unpaid balance on credit and a customer is attached, update customer debt balance
    if (sale.customerId && balance > 0) {
      const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance + ?, syncStatus = 0 WHERE id = ?';
      await this.db.executeSql(updateBalanceQuery, [balance, sale.customerId]);
    }

    for (const item of items) {
      const itemQuery = `
        INSERT INTO SaleItem(id, saleId, productId, quantity, priceAtSale, isBulk)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const itemParams = [item.id, item.saleId, item.productId, item.quantity, item.priceAtSale, item.isBulk];
      await this.db.executeSql(itemQuery, itemParams);

      const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
      const stockQuery = `SELECT ${column} AS availableStock FROM Product WHERE id = ?`;
      const [stockResult] = await this.db.executeSql(stockQuery, [item.productId]);
      const availableStock = Number(stockResult?.rows?.item?.(0)?.availableStock ?? 0);

      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for sale item: requested ${item.quantity}, available ${availableStock}.`);
      }

      const decrementStockQuery = `UPDATE Product SET ${column} = ${column} - ?, syncStatus = 0 WHERE id = ?`;
      await this.db.executeSql(decrementStockQuery, [item.quantity, item.productId]);
    }
  }

  async getSalesByShop(shopId: string): Promise<any[]> {
    const safeShopId = sanitizeShopId(shopId);
    let query = `
      SELECT
        s.*,
        COALESCE(e.name, 'Staff') as staffName,
        COALESCE(e.role, 'OWNER') as staffRole,
        c.name as customerName
      FROM Sale s
      LEFT JOIN Employee e ON s.employeeId = e.id
      LEFT JOIN Shop sh ON s.shopId = sh.id
      LEFT JOIN Customer c ON s.customerId = c.id
    `;
    let params: any[] = [];
    if (safeShopId) {
      query += ` WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ? OR s.shopId IS NULL OR s.shopId = '')`;
      params = [safeShopId, safeShopId];
    }
    query += ` ORDER BY CAST(s.timestamp AS INTEGER) DESC`;

    const results = await this.db.executeSql(query, params);
    const sales: any[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = getRow(rows, i);
        if (item) {
          const ts = parseTimestamp(item.timestamp, Date.now());
          sales.push({ ...item, timestamp: ts });
        }
      }
    }

    // Fallback: if specific shopId filter returned 0 sales, try querying ALL sales in database
    if (sales.length === 0 && safeShopId) {
      const fallbackQuery = `
        SELECT
          s.*,
          COALESCE(e.name, 'Staff') as staffName,
          COALESCE(e.role, 'OWNER') as staffRole,
          c.name as customerName
        FROM Sale s
        LEFT JOIN Employee e ON s.employeeId = e.id
        LEFT JOIN Shop sh ON s.shopId = sh.id
        LEFT JOIN Customer c ON s.customerId = c.id
        ORDER BY CAST(s.timestamp AS INTEGER) DESC
      `;
      const fallbackResults = await this.db.executeSql(fallbackQuery, []);
      const fallbackRows = fallbackResults[0]?.rows;
      if (fallbackRows) {
        const len = fallbackRows.length ?? 0;
        for (let i = 0; i < len; i++) {
          const item = getRow(fallbackRows, i);
          if (item) {
            const ts = parseTimestamp(item.timestamp, Date.now());
            sales.push({ ...item, timestamp: ts });
          }
        }
      }
    }

    return sales;
  }

  async getSalesByShopAndRange(shopId: string, start: number, end: number): Promise<any[]> {
    const safeShopId = sanitizeShopId(shopId);
    const startMs = start < 1e11 ? start * 1000 : Math.floor(start);
    const endMs = end < 1e11 ? end * 1000 : Math.floor(end);
    const startSec = Math.floor(startMs / 1000);
    const endSec = Math.floor(endMs / 1000);

    const query = `
      SELECT
        s.*,
        COALESCE(e.name, 'Staff') as staffName,
        COALESCE(e.role, 'OWNER') as staffRole,
        c.name as customerName
      FROM Sale s
      LEFT JOIN Employee e ON s.employeeId = e.id
      LEFT JOIN Shop sh ON s.shopId = sh.id
      LEFT JOIN Customer c ON s.customerId = c.id
      WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ?)
        AND (
          CAST(s.timestamp AS INTEGER) BETWEEN ? AND ?
          OR CAST(s.timestamp AS INTEGER) BETWEEN ? AND ?
        )
      ORDER BY CAST(s.timestamp AS INTEGER) DESC
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, startMs, endMs, startSec, endSec]);
    const sales: any[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = getRow(rows, i);
        if (item) {
          const ts = parseTimestamp(item.timestamp, Date.now());
          sales.push({ ...item, timestamp: ts });
        }
      }
    }
    return sales;
  }

  async getDetailedItemsForSale(saleId: string): Promise<any[]> {
    const query = `
      SELECT si.*, COALESCE(p.name, 'Item ' || si.productId) as productName, p.unit, p.bulkUnit
      FROM SaleItem si
      LEFT JOIN Product p ON si.productId = p.id
      WHERE si.saleId = ?
    `;
    const results = await this.db.executeSql(query, [saleId]);
    const items: any[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = getRow(rows, i);
        if (item) {
          items.push({
            ...item,
            productName: item.productName || item.productname || 'Item ' + (item.productId || ''),
            quantity: Number(item.quantity || 0),
            priceAtSale: Number(item.priceAtSale || item.priceatsale || 0),
            isBulk: Number(item.isBulk || item.isbulk || 0),
          });
        }
      }
    }
    return items;
  }

  async getUnsyncedSales(shopId?: string): Promise<Sale[]> {
    const safeShopId = shopId ? shopId.toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM Sale WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)'
      : 'SELECT * FROM Sale WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, safeShopId, safeShopId] : [];
    const results = await this.db.executeSql(query, params);
    const sales: Sale[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = getRow(rows, i);
        if (item) sales.push(item);
      }
    }
    return sales;
  }

  async markSaleSynced(id: string) {
    const query = 'UPDATE Sale SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async upsertRemoteSale(sale: any, items: any[]) {
    const safeShopId = (sale.shopId || '').toString().trim();
    const timestamp = parseTimestamp(sale.timestamp, parseTimestamp(sale.lastUpdated, Date.now()));
    const totalAmount = Number(sale.totalAmount || 0);
    const amountPaid = sale.amountPaid !== undefined && sale.amountPaid !== null ? Number(sale.amountPaid) : (sale.paymentStatus === 'DEBT' ? 0 : totalAmount);
    const balance = sale.balance !== undefined && sale.balance !== null ? Number(sale.balance) : Math.max(0, totalAmount - amountPaid);
    const paymentStatus = sale.paymentStatus || (balance <= 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'DEBT'));

    // 1. Insert or Replace the Sale record
    const saleQuery = `
      INSERT OR REPLACE INTO Sale(id, shopId, employeeId, customerId, timestamp, totalAmount, amountPaid, balance, paymentMethod, paymentStatus, dueDate, syncStatus, isReverted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `;
    const saleParams = [
      sale.id, safeShopId, sale.employeeId || null, sale.customerId || null, timestamp,
      totalAmount, amountPaid, balance, sale.paymentMethod || 'CASH', paymentStatus,
      sale.dueDate || null, sale.isReverted ? 1 : 0
    ];
    await this.db.executeSql(saleQuery, saleParams);

    // 2. Delete existing items for this sale (if any) to handle updates cleanly
    await this.db.executeSql('DELETE FROM SaleItem WHERE saleId = ?', [sale.id]);

    // 3. Insert SaleItems
    for (const item of items) {
      const itemQuery = `
        INSERT INTO SaleItem(id, saleId, productId, quantity, priceAtSale, isBulk)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const itemId = `${sale.id}_${item.productId}_${item.isBulk ? 'bulk' : 'unit'}`;
      const itemParams = [itemId, sale.id, item.productId, item.quantity, item.priceAtSale, item.isBulk ? 1 : 0];
      await this.db.executeSql(itemQuery, itemParams);
    }
  }

  async revertSale(saleId: string) {
    // Get sale info first to know if we need to update customer balance
    const saleInfoQuery = 'SELECT customerId, totalAmount, amountPaid, balance, paymentStatus FROM Sale WHERE id = ?';
    const [saleInfoResult] = await this.db.executeSql(saleInfoQuery, [saleId]);
    const sale = saleInfoResult?.rows?.length ? getRow(saleInfoResult.rows, 0) : null;

    const revertQuery = 'UPDATE Sale SET isReverted = 1, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(revertQuery, [saleId]);

    // If it had an unpaid debt balance, reduce customer debt balance accordingly
    if (sale && sale.customerId) {
      const debtValue = sale.balance !== undefined && sale.balance !== null ? Number(sale.balance) : (sale.paymentStatus === 'DEBT' ? Number(sale.totalAmount) : 0);
      if (debtValue > 0) {
        const updateBalanceQuery = 'UPDATE Customer SET currentBalance = MAX(0, currentBalance - ?), syncStatus = 0 WHERE id = ?';
        await this.db.executeSql(updateBalanceQuery, [debtValue, sale.customerId]);
      }
    }

    // Restore stock
    const itemsQuery = 'SELECT * FROM SaleItem WHERE saleId = ?';
    const [itemsResults] = await this.db.executeSql(itemsQuery, [saleId]);
    const rows = itemsResults?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = getRow(rows, i);
        const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
        const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
        await this.db.executeSql(restoreStockQuery, [item.quantity, item.productId]);
      }
    }
  }

  async refundSingleSaleItem(saleItemId: string, refundQuantity: number) {
    // 1. Fetch sale item info
    const itemQuery = 'SELECT saleId, productId, quantity, priceAtSale, isBulk FROM SaleItem WHERE id = ?';
    const [itemResult] = await this.db.executeSql(itemQuery, [saleItemId]);
    if (itemResult.rows.length === 0) {
      throw new Error('Sale item not found.');
    }
    const item = itemResult.rows.item(0);

    if (refundQuantity <= 0 || refundQuantity > item.quantity) {
      throw new Error(`Invalid refund quantity. Max available: ${item.quantity}`);
    }

    // 2. Fetch parent sale info
    const saleQuery = 'SELECT id, totalAmount, amountPaid, balance, customerId, paymentStatus FROM Sale WHERE id = ?';
    const [saleResult] = await this.db.executeSql(saleQuery, [item.saleId]);
    const sale = saleResult?.rows?.length ? getRow(saleResult.rows, 0) : null;

    const refundValue = item.priceAtSale * refundQuantity;

    // 3. Update or delete the item row
    if (refundQuantity === item.quantity) {
      await this.db.executeSql('DELETE FROM SaleItem WHERE id = ?', [saleItemId]);
    } else {
      await this.db.executeSql('UPDATE SaleItem SET quantity = quantity - ?, syncStatus = 0 WHERE id = ?', [refundQuantity, saleItemId]);
    }

    // 4. Update the parent sale total amount & balance
    const oldTotal = Number(sale?.totalAmount || 0);
    const oldAmountPaid = Number(sale?.amountPaid || 0);
    const oldBalance = sale?.balance !== undefined && sale?.balance !== null ? Number(sale.balance) : Math.max(0, oldTotal - oldAmountPaid);

    const newTotal = Math.max(0, oldTotal - refundValue);
    const newBalance = Math.max(0, oldBalance - refundValue);
    const newPaymentStatus = newBalance <= 0 ? 'PAID' : (oldAmountPaid > 0 ? 'PARTIAL' : 'DEBT');

    await this.db.executeSql(
      'UPDATE Sale SET totalAmount = ?, balance = ?, paymentStatus = ?, syncStatus = 0 WHERE id = ?',
      [newTotal, newBalance, newPaymentStatus, item.saleId]
    );

    // 5. Adjust customer debt if applicable
    if (sale && sale.customerId && refundValue > 0) {
      const reduceDebt = Math.min(refundValue, oldBalance);
      if (reduceDebt > 0) {
        await this.db.executeSql('UPDATE Customer SET currentBalance = MAX(0, currentBalance - ?), syncStatus = 0 WHERE id = ?', [reduceDebt, sale.customerId]);
      }
    }

    // 6. Return stock back to inventory
    const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
    const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
    await this.db.executeSql(restoreStockQuery, [refundQuantity, item.productId]);

    // 7. If no more items left in sale, mark parent sale as reverted
    const [remainingItems] = await this.db.executeSql('SELECT COUNT(*) as count FROM SaleItem WHERE saleId = ?', [item.saleId]);
    if (remainingItems.rows.item(0).count === 0) {
      await this.db.executeSql('UPDATE Sale SET isReverted = 1 WHERE id = ?', [item.saleId]);
    }
  }
}
