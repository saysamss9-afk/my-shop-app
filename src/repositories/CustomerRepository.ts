import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { Customer, DebtPayment } from '../db/types';
import { generateUUID } from '../utils/uuid';

export class CustomerRepository {
  constructor(public db: SQLiteDatabase) {}

  async getCustomerById(id: string): Promise<Customer | null> {
    const query = 'SELECT * FROM Customer WHERE id = ?';
    const results = await this.db.executeSql(query, [id]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  }

  async insertCustomer(customer: Customer) {
    if (!customer.shopId || customer.shopId === 'undefined') {
        throw new Error(`Invalid Shop ID: Customer ${customer.id} must be linked to a shop.`);
    }

    const query = `
      INSERT OR REPLACE INTO Customer(id, shopId, name, phone, email, currentBalance, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      customer.id, customer.shopId, customer.name, customer.phone,
      customer.email || null, customer.currentBalance, customer.syncStatus ?? 0
    ];
    await this.db.executeSql(query, params);
  }

  async recordPayment(payment: Omit<DebtPayment, 'syncStatus'>) {
    const paymentQuery = `
      INSERT INTO DebtPayment(id, customerId, shopId, amount, paymentMethod, timestamp, note, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      payment.id, payment.customerId, payment.shopId, payment.amount,
      payment.paymentMethod, payment.timestamp, payment.note
    ];
    await this.db.executeSql(paymentQuery, params);

    const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(updateBalanceQuery, [payment.amount, payment.customerId]);

    // Apply debt payment to customer's open credit sales (oldest first) to update sale balance and status
    try {
      const openSalesQuery = `
        SELECT id, totalAmount, amountPaid, balance
        FROM Sale
        WHERE customerId = ? AND COALESCE(isReverted, 0) = 0 AND (balance > 0 OR paymentStatus IN ('DEBT', 'PARTIAL'))
        ORDER BY timestamp ASC
      `;
      const [salesRes] = await this.db.executeSql(openSalesQuery, [payment.customerId]);
      const rows = salesRes?.rows;
      if (rows) {
        let remainingPayment = Number(payment.amount || 0);
        const len = rows.length ?? 0;
        for (let i = 0; i < len && remainingPayment > 0; i++) {
          const s = typeof rows.item === 'function' ? rows.item(i) : rows[i];
          if (!s) continue;
          const saleId = s.id;
          const tot = Number(s.totalAmount || 0);
          const currentPaid = Number(s.amountPaid || 0);
          const currentBal = s.balance !== undefined && s.balance !== null ? Number(s.balance) : Math.max(0, tot - currentPaid);

          if (currentBal <= 0) continue;

          const payForThisSale = Math.min(remainingPayment, currentBal);
          const newPaid = currentPaid + payForThisSale;
          const newBal = Math.max(0, currentBal - payForThisSale);
          const newStatus = newBal <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'DEBT');

          await this.db.executeSql(
            'UPDATE Sale SET amountPaid = ?, balance = ?, paymentStatus = ?, syncStatus = 0 WHERE id = ?',
            [newPaid, newBal, newStatus, saleId]
          );

          remainingPayment -= payForThisSale;
        }
      }
    } catch (e) {
      console.error('Error updating open sale balances during debt payment:', e);
    }
  }

  async getPaymentsByCustomer(customerId: string): Promise<DebtPayment[]> {
    const query = 'SELECT * FROM DebtPayment WHERE customerId = ? ORDER BY timestamp DESC';
    const results = await this.db.executeSql(query, [customerId]);
    const payments: DebtPayment[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      payments.push(results[0].rows.item(i));
    }
    return payments;
  }

  async updateCustomerBalance(customerId: string, change: number) {
    const query = 'UPDATE Customer SET currentBalance = currentBalance + ?, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(query, [change, customerId]);
  }

  async markCustomerSynced(id: string) {
    const query = 'UPDATE Customer SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async getUnsyncedPayments(shopId?: string): Promise<DebtPayment[]> {
    const safeShopId = shopId ? shopId.toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM DebtPayment WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)'
      : 'SELECT * FROM DebtPayment WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, safeShopId, safeShopId] : [];
    const results = await this.db.executeSql(query, params);
    const payments: DebtPayment[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
        if (item) payments.push(item);
      }
    }
    return payments;
  }

  async markPaymentSynced(id: string) {
    const query = 'UPDATE DebtPayment SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async recordReturn(returnOrder: {
    id: string;
    customerId: string;
    shopId: string;
    productId: string;
    quantity: number;
    value: number;
    timestamp: number;
    isBulk: boolean;
  }) {
    const adjQuery = `
      INSERT INTO InventoryAdjustment(id, productId, shopId, quantity, reason, timestamp, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
    await this.db.executeSql(adjQuery, [
      returnOrder.id,
      returnOrder.productId,
      returnOrder.shopId,
      returnOrder.quantity,
      'CUSTOMER_RETURN',
      returnOrder.timestamp
    ]);

    const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(updateBalanceQuery, [returnOrder.value, returnOrder.customerId]);

    const column = returnOrder.isBulk ? 'bulkStockQuantity' : 'stockQuantity';
    const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
    await this.db.executeSql(restoreStockQuery, [returnOrder.quantity, returnOrder.productId]);

    const auditQuery = `
      INSERT INTO AuditLog(id, shopId, employeeId, action, targetId, details, timestamp, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;
    await this.db.executeSql(auditQuery, [
      generateUUID(),
      returnOrder.shopId,
      'SYSTEM',
      'ITEM_RETURNED',
      returnOrder.customerId,
      `Returned ${returnOrder.quantity} of ${returnOrder.productId}. Value: ${returnOrder.value}`,
      returnOrder.timestamp
    ]);
  }

  async getUnsyncedCustomers(shopId?: string): Promise<Customer[]> {
    const safeShopId = shopId ? shopId.toString().trim() : undefined;
    const query = safeShopId
      ? 'SELECT * FROM Customer WHERE syncStatus = 0 AND (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)'
      : 'SELECT * FROM Customer WHERE syncStatus = 0';
    const params = safeShopId ? [safeShopId, safeShopId, safeShopId] : [];
    const results = await this.db.executeSql(query, params);
    const customers: Customer[] = [];
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
        if (item) customers.push(item);
      }
    }
    return customers;
  }

  async getCustomerHistory(customerId: string): Promise<any[]> {
    const query = `
      SELECT
        s.id as saleId,
        s.timestamp,
        si.productId,
        COALESCE(p.name, 'Item ' || si.productId) as productName,
        si.quantity,
        si.priceAtSale,
        si.isBulk,
        COALESCE(p.unit, 'pcs') as unit,
        COALESCE(p.bulkUnit, 'Carton') as bulkUnit
      FROM Sale s
      JOIN SaleItem si ON s.id = si.saleId
      LEFT JOIN Product p ON si.productId = p.id
      WHERE s.customerId = ? AND s.isReverted = 0
      ORDER BY s.timestamp DESC
    `;
    const results = await this.db.executeSql(query, [customerId]);
    const history: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
        history.push(results[0].rows.item(i));
    }
    return history;
  }

  async getItemsTakenOnCredit(customerId: string): Promise<any[]> {
    const query = `
      SELECT
        COALESCE(p.id, si.productId) as id,
        COALESCE(p.name, 'Item ' || si.productId) as name,
        SUM(si.quantity) as totalTaken,
        si.isBulk,
        si.priceAtSale,
        COALESCE(p.unit, 'pcs') as unit,
        COALESCE(p.bulkUnit, 'Carton') as bulkUnit
      FROM Sale s
      JOIN SaleItem si ON s.id = si.saleId
      LEFT JOIN Product p ON si.productId = p.id
      WHERE s.customerId = ? AND (s.paymentStatus = 'DEBT' OR s.paymentStatus = 'PARTIAL' OR s.balance > 0) AND s.isReverted = 0
      GROUP BY si.productId, si.isBulk, si.priceAtSale
    `;
    const results = await this.db.executeSql(query, [customerId]);
    const items: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
        items.push(results[0].rows.item(i));
    }
    return items;
  }
}
