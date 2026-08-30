import { SQLiteDatabase } from 'react-native-sqlite-storage';

export interface FinancialSummary {
  totalRevenue: number;
  totalProfit: number;
}

export interface TopProduct {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CashierPerformance {
  employeeName: string;
  saleCount: number;
  totalRevenue: number;
}

export class AnalyticsRepository {
  constructor(private db: SQLiteDatabase) {}

  async getFinancialSummary(shopId: string, start: number, end: number): Promise<FinancialSummary> {
    const query = `
      SELECT
        SUM(totalAmount) as totalRevenue,
        SUM(totalAmount - (
          SELECT SUM(si.quantity * p.costPrice)
          FROM SaleItem si
          JOIN Product p ON si.productId = p.id
          WHERE si.saleId = Sale.id
        )) as totalProfit
      FROM Sale
      WHERE shopId = ? AND timestamp BETWEEN ? AND ? AND isReverted = 0
    `;
    const results = await this.db.executeSql(query, [shopId, start, end]);
    const item = results[0].rows.item(0);
    return {
      totalRevenue: item.totalRevenue || 0,
      totalProfit: item.totalProfit || 0
    };
  }

  async getTotalExpenses(shopId: string, start: number, end: number): Promise<number> {
    const query = 'SELECT SUM(amount) as total FROM Expense WHERE shopId = ? AND timestamp BETWEEN ? AND ?';
    const results = await this.db.executeSql(query, [shopId, start, end]);
    return results[0].rows.item(0).total || 0;
  }

  async getTopProducts(shopId: string, start: number, end: number, limit: number = 5): Promise<TopProduct[]> {
    const query = `
      SELECT p.name, SUM(si.quantity) as totalQuantity, SUM(si.quantity * si.priceAtSale) as totalRevenue
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      JOIN Product p ON si.productId = p.id
      WHERE s.shopId = ? AND s.timestamp BETWEEN ? AND ? AND s.isReverted = 0
      GROUP BY p.id
      ORDER BY totalQuantity DESC
      LIMIT ?
    `;
    const results = await this.db.executeSql(query, [shopId, start, end, limit]);
    const products: TopProduct[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      products.push(results[0].rows.item(i));
    }
    return products;
  }

  async getCashierPerformance(shopId: string, start: number, end: number): Promise<CashierPerformance[]> {
    const query = `
      SELECT e.name as employeeName, COUNT(s.id) as saleCount, SUM(s.totalAmount) as totalRevenue
      FROM Sale s
      JOIN Employee e ON s.employeeId = e.id
      WHERE s.shopId = ? AND s.timestamp BETWEEN ? AND ? AND s.isReverted = 0
      GROUP BY e.id
    `;
    const results = await this.db.executeSql(query, [shopId, start, end]);
    const performances: CashierPerformance[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      performances.push(results[0].rows.item(i));
    }
    return performances;
  }
}
