import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Customer, DebtPayment } from '../db/types';
import { generateUUID } from '../utils/uuid';

export class CustomerRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertCustomer(customer: Customer) {
    const query = `
      INSERT OR REPLACE INTO Customer(id, shopId, name, phone, email, currentBalance, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      customer.id, customer.shopId, customer.name, customer.phone,
      customer.email || null, customer.currentBalance
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

  async getUnsyncedPayments(): Promise<DebtPayment[]> {
    const query = 'SELECT * FROM DebtPayment WHERE syncStatus = 0';
    const results = await this.db.executeSql(query);
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
      const restoreStockQuery = `UPDATE Product SET ${column} = ${column} + ? WHERE id = ?`;
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

  async getUnsyncedCustomers(): Promise<Customer[]> {
    const query = 'SELECT * FROM Customer WHERE syncStatus = 0';
    const results = await this.db.executeSql(query);
    const customers: Customer[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      customers.push(results[0].rows.item(i));
    }
    return customers;
  }
}
