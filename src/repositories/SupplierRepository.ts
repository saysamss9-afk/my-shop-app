import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Supplier, SupplierPayment } from '../db/types';

export class SupplierRepository {
  constructor(public db: SQLiteDatabase) {}

  async insertSupplier(supplier: Supplier) {
    const query = `
      INSERT OR REPLACE INTO Supplier(id, shopId, name, contactInfo, currentBalance, syncStatus)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    const params = [
      supplier.id, supplier.shopId, supplier.name,
      supplier.contactInfo, supplier.currentBalance || 0
    ];
    await this.db.executeSql(query, params);
  }

  async getSuppliersWithStats(shopId: string): Promise<(Supplier & { productCount: number })[]> {
    const query = `
      SELECT s.*, (SELECT COUNT(*) FROM Product p WHERE p.supplierId = s.id) as productCount
      FROM Supplier s
      WHERE s.shopId = ?
    `;
    const results = await this.db.executeSql(query, [shopId]);
    const suppliers: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      suppliers.push(results[0].rows.item(i));
    }
    return suppliers;
  }

  async recordPayment(payment: Omit<SupplierPayment, 'syncStatus'>) {
    await this.db.transaction(async (tx: any) => {
      const paymentQuery = `
        INSERT INTO SupplierPayment(id, supplierId, shopId, amount, paymentMethod, reference, timestamp, note, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      const params = [
        payment.id, payment.supplierId, payment.shopId, payment.amount,
        payment.paymentMethod, payment.reference, payment.timestamp, payment.note
      ];
      await tx.executeSql(paymentQuery, params);

      const updateBalanceQuery = 'UPDATE Supplier SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(updateBalanceQuery, [payment.amount, payment.supplierId]);
    });
  }

  async getDashboardStats(shopId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startTimestamp = startOfMonth.getTime();

    const statsQuery = `
      SELECT
        COUNT(*) as totalSuppliers,
        SUM(CASE WHEN currentBalance > 0 THEN 1 ELSE 0 END) as owedSuppliers,
        SUM(currentBalance) as totalPayable,
        (SELECT SUM(amount) FROM SupplierPayment WHERE shopId = ? AND timestamp >= ?) as paidThisMonth,
        (SELECT SUM(totalCost) FROM PurchaseOrder WHERE shopId = ? AND timestamp >= ?) as purchasesThisMonth
      FROM Supplier
      WHERE shopId = ?
    `;

    const results = await this.db.executeSql(statsQuery, [shopId, startTimestamp, shopId, startTimestamp, shopId]);
    const row = results[0].rows.item(0);

    return {
      totalSuppliers: row.totalSuppliers || 0,
      owedSuppliers: row.owedSuppliers || 0,
      totalPayable: row.totalPayable || 0,
      paidThisMonth: row.paidThisMonth || 0,
      purchasesThisMonth: row.purchasesThisMonth || 0
    };
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
