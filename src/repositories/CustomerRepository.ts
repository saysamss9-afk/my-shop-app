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
    await this.db.transaction(async (tx: any) => {
      const paymentQuery = `
        INSERT INTO DebtPayment(id, customerId, shopId, amount, paymentMethod, timestamp, note, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `;
      const params = [
        payment.id, payment.customerId, payment.shopId, payment.amount,
        payment.paymentMethod, payment.timestamp, payment.note
      ];
      await tx.executeSql(paymentQuery, params);

      const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(updateBalanceQuery, [payment.amount, payment.customerId]);
    });
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
    const query = shopId
      ? 'SELECT * FROM DebtPayment WHERE syncStatus = 0 AND shopId = ?'
      : 'SELECT * FROM DebtPayment WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
    const payments: DebtPayment[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      payments.push(results[0].rows.item(i));
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
    await this.db.transaction(async (tx: any) => {
      // 1. Record the adjustment
      const adjQuery = `
        INSERT INTO InventoryAdjustment(id, productId, shopId, quantity, reason, timestamp, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `;
      await tx.executeSql(adjQuery, [
        returnOrder.id,
        returnOrder.productId,
        returnOrder.shopId,
        returnOrder.quantity,
        'CUSTOMER_RETURN',
        returnOrder.timestamp
      ]);

      // 2. Reduce customer debt
      const updateBalanceQuery = 'UPDATE Customer SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(updateBalanceQuery, [returnOrder.value, returnOrder.customerId]);

      // 3. Restore stock in Product table
      const column = returnOrder.isBulk ? 'bulkStockQuantity' : 'stockQuantity';
      const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
      await tx.executeSql(restoreStockQuery, [returnOrder.quantity, returnOrder.productId]);

      // 4. Record in AuditLog
      const auditQuery = `
        INSERT INTO AuditLog(id, shopId, employeeId, action, targetId, details, timestamp, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `;
      await tx.executeSql(auditQuery, [
        generateUUID(),
        returnOrder.shopId,
        'SYSTEM', // Ideally passed from UI
        'ITEM_RETURNED',
        returnOrder.customerId,
        `Returned ${returnOrder.quantity} of ${returnOrder.productId}. Value: ${returnOrder.value}`,
        returnOrder.timestamp
      ]);
    });
  }

  async getUnsyncedCustomers(shopId?: string): Promise<Customer[]> {
    const query = shopId
      ? 'SELECT * FROM Customer WHERE syncStatus = 0 AND shopId = ?'
      : 'SELECT * FROM Customer WHERE syncStatus = 0';
    const params = shopId ? [shopId] : [];
    const results = await this.db.executeSql(query, params);
    const customers: Customer[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      customers.push(results[0].rows.item(i));
    }
    return customers;
  }

  async getCustomerHistory(customerId: string): Promise<any[]> {
    const query = `
      SELECT
        s.id as saleId,
        s.timestamp,
        si.productId,
        p.name as productName,
        si.quantity,
        si.priceAtSale,
        si.isBulk,
        p.unit,
        p.bulkUnit
      FROM Sale s
      JOIN SaleItem si ON s.id = si.saleId
      JOIN Product p ON si.productId = p.id
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
        p.id,
        p.name,
        SUM(si.quantity) as totalTaken,
        si.isBulk,
        si.priceAtSale,
        p.unit,
        p.bulkUnit
      FROM Sale s
      JOIN SaleItem si ON s.id = si.saleId
      JOIN Product p ON si.productId = p.id
      WHERE s.customerId = ? AND s.paymentStatus = 'DEBT' AND s.isReverted = 0
      GROUP BY p.id, si.isBulk
    `;
    const results = await this.db.executeSql(query, [customerId]);
    const items: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
        items.push(results[0].rows.item(i));
    }
    return items;
  }
}
