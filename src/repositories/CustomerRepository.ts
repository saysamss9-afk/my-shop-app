import SQLite from 'react-native-sqlite-storage';
import { Customer } from '../db/types';

export class CustomerRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async insertCustomer(customer: Customer) {
    const query = `
      INSERT OR REPLACE INTO Customer(id, shopId, name, phone, email, currentBalance, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
    const params = [
      customer.id, customer.shopId, customer.name, customer.phone,
      customer.email, customer.currentBalance
    ];
    await this.db.executeSql(query, params);
  }

  async updateCustomerBalance(customerId: string, change: number) {
    const query = 'UPDATE Customer SET currentBalance = currentBalance + ?, syncStatus = 0 WHERE id = ?';
    await this.db.executeSql(query, [change, customerId]);
  }

  async markCustomerSynced(id: string) {
    const query = 'UPDATE Customer SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }
}
