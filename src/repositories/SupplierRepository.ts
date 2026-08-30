import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Supplier } from '../db/types';

export class SupplierRepository {
  constructor(private db: SQLiteDatabase) {}

  async insertSupplier(supplier: Supplier) {
    const query = `
      INSERT OR REPLACE INTO Supplier(id, shopId, name, contactInfo, syncStatus)
      VALUES (?, ?, ?, ?, 0)
    `;
    const params = [supplier.id, supplier.shopId, supplier.name, supplier.contactInfo];
    await this.db.executeSql(query, params);
  }

  async getSuppliersByShop(shopId: string): Promise<Supplier[]> {
    const query = 'SELECT * FROM Supplier WHERE shopId = ?';
    const results = await this.db.executeSql(query, [shopId]);
    const suppliers: Supplier[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      suppliers.push(results[0].rows.item(i));
    }
    return suppliers;
  }

  async getUnsyncedSuppliers(): Promise<Supplier[]> {
    const query = 'SELECT * FROM Supplier WHERE syncStatus = 0';
    const results = await this.db.executeSql(query);
    const suppliers: Supplier[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      suppliers.push(results[0].rows.item(i));
    }
    return suppliers;
  }

  async markSupplierSynced(id: string) {
    const query = 'UPDATE Supplier SET syncStatus = 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }
}
