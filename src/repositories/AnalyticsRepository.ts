import { SQLiteDatabase } from 'react-native-sqlite-storage';

export interface FinancialSummary {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
}

export interface OwnerFinancialSnapshot {
  totalStockCostValue: number;
  totalStockSellingValue: number;
  unitStockCostValue: number;
  unitStockSellingValue: number;
  bulkStockCostValue: number;
  bulkStockSellingValue: number;
  totalSupplierDebt: number;
  totalCustomerDebt: number;
  itemCount: number;
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

export interface DailyItemSale {
  productId: string;
  productName: string;
  isBulk: number;
  totalQuantitySold: number;
  totalRevenue: number;
  currentStock: number;
  unit: string;
  isOnCredit: number;
}

export class AnalyticsRepository {
  constructor(private db: SQLiteDatabase) {}

  async getFinancialSummary(shopId: string, start: number, end: number): Promise<FinancialSummary> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();

    // Use TOTAL() instead of SUM() as it returns 0.0 instead of NULL
    // Use COALESCE on costPrice to avoid multiplication by NULL
    const revenueQuery = `
      SELECT
        TOTAL(totalAmount) as totalRevenue,
        TOTAL(totalAmount - (
          SELECT TOTAL(si.quantity * COALESCE(p.costPrice, 0))
          FROM SaleItem si
          JOIN Product p ON si.productId = p.id
          WHERE si.saleId = Sale.id
        )) as totalProfit
      FROM Sale
      WHERE shopId = ? AND timestamp BETWEEN ? AND ? AND isReverted = 0 AND paymentStatus != 'DEBT'
    `;
    const expenseQuery = `SELECT TOTAL(amount) as totalExpenses FROM Expense WHERE shopId = ? AND timestamp BETWEEN ? AND ?`;

    const [revResults, expResults] = await Promise.all([
      this.db.executeSql(revenueQuery, [safeShopId, start, end]),
      this.db.executeSql(expenseQuery, [safeShopId, start, end])
    ]);

    const revItem = revResults[0]?.rows?.length ? revResults[0].rows.item(0) : null;
    const expItem = expResults[0]?.rows?.length ? expResults[0].rows.item(0) : null;

    return {
      totalRevenue: Number(revItem?.totalRevenue || 0),
      totalProfit: Number(revItem?.totalProfit || 0),
      totalExpenses: Number(expItem?.totalExpenses || 0),
    };
  }

  async getOwnerFinancialSnapshot(shopId: string): Promise<OwnerFinancialSnapshot> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();

    // TOTAL() returns 0.0 instead of NULL
    // status != 'DELETED' ensures we see everything currently in the shop's ledger
    const stockQuery = `
      SELECT
        COUNT(*) as itemCount,
        TOTAL(COALESCE(costPrice, 0) * (COALESCE(stockQuantity, 0) + (COALESCE(bulkStockQuantity, 0) * COALESCE(bulkQuantity, 1)))) as totalCostValue,
        TOTAL(COALESCE(price, 0) * COALESCE(stockQuantity, 0) + COALESCE(bulkPrice, 0) * COALESCE(bulkStockQuantity, 0)) as totalSellingValue,
        TOTAL(COALESCE(costPrice, 0) * COALESCE(stockQuantity, 0)) as unitCostValue,
        TOTAL(COALESCE(price, 0) * COALESCE(stockQuantity, 0)) as unitSellingValue,
        TOTAL(COALESCE(costPrice, 0) * (COALESCE(bulkStockQuantity, 0) * COALESCE(bulkQuantity, 1))) as bulkCostValue,
        TOTAL(COALESCE(bulkPrice, 0) * COALESCE(bulkStockQuantity, 0)) as bulkSellingValue
      FROM Product
      WHERE shopId = ? AND status != 'DELETED'
    `;

    const supplierDebtQuery = `SELECT TOTAL(currentBalance) as total FROM Supplier WHERE shopId = ? AND currentBalance > 0`;
    const customerDebtQuery = `SELECT TOTAL(currentBalance) as total FROM Customer WHERE shopId = ? AND currentBalance > 0`;

    const [stockRes, supplierRes, customerRes] = await Promise.all([
      this.db.executeSql(stockQuery, [safeShopId]),
      this.db.executeSql(supplierDebtQuery, [safeShopId]),
      this.db.executeSql(customerDebtQuery, [safeShopId])
    ]);

    const stock = stockRes[0]?.rows?.item(0);
    const supplier = supplierRes[0]?.rows?.item(0);
    const customer = customerRes[0]?.rows?.item(0);

    return {
      totalStockCostValue: Number(stock?.totalCostValue || 0),
      totalStockSellingValue: Number(stock?.totalSellingValue || 0),
      unitStockCostValue: Number(stock?.unitCostValue || 0),
      unitStockSellingValue: Number(stock?.unitSellingValue || 0),
      bulkStockCostValue: Number(stock?.bulkCostValue || 0),
      bulkStockSellingValue: Number(stock?.bulkSellingValue || 0),
      totalSupplierDebt: Number(supplier?.total || 0),
      totalCustomerDebt: Number(customer?.total || 0),
      itemCount: Number(stock?.itemCount || 0)
    };
  }

  async getTotalExpenses(shopId: string, start: number, end: number): Promise<number> {
    const query = 'SELECT SUM(amount) as total FROM Expense WHERE shopId = ? AND timestamp BETWEEN ? AND ?';
    const results = await this.db.executeSql(query, [shopId, start, end]);
    const item = results[0]?.rows?.length ? results[0].rows.item(0) : null;
    return Number(item?.total || 0);
  }

  async getTopProducts(shopId: string, start: number, end: number, limit: number = 5): Promise<TopProduct[]> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    const query = `
      SELECT p.name, TOTAL(si.quantity) as totalQuantity, TOTAL(si.quantity * si.priceAtSale) as totalRevenue
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      JOIN Product p ON si.productId = p.id
      WHERE (s.shopId = ? OR TRIM(s.shopId) = ?) AND s.timestamp BETWEEN ? AND ? AND s.isReverted = 0 AND s.paymentStatus != 'DEBT'
      GROUP BY p.id
      ORDER BY totalQuantity DESC
      LIMIT ?
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, start, end, limit]);
    const products: TopProduct[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      products.push(results[0].rows.item(i));
    }
    return products;
  }

  async getCashierPerformance(shopId: string, start: number, end: number): Promise<CashierPerformance[]> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    const query = `
      SELECT e.name as employeeName, COUNT(s.id) as saleCount, TOTAL(s.totalAmount) as totalRevenue
      FROM Sale s
      JOIN Employee e ON s.employeeId = e.id
      WHERE (s.shopId = ? OR TRIM(s.shopId) = ?) AND s.timestamp BETWEEN ? AND ? AND s.isReverted = 0 AND s.paymentStatus != 'DEBT'
      GROUP BY e.id
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, start, end]);
    const performances: CashierPerformance[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      performances.push(results[0].rows.item(i));
    }
    return performances;
  }

  async getDailyItemSales(shopId: string, start: number, end: number): Promise<DailyItemSale[]> {
    const query = `
      SELECT
        p.id as productId,
        p.name as productName,
        CASE WHEN (si.isBulk = 1 OR si.isBulk = 'true' OR si.isBulk = TRUE) THEN 1 ELSE 0 END as isBulk,
        SUM(si.quantity) as totalQuantitySold,
        SUM(si.quantity * si.priceAtSale) as totalRevenue,
        MAX(CASE
          WHEN (si.isBulk = 1 OR si.isBulk = 'true' OR si.isBulk = TRUE)
          THEN p.bulkStockQuantity
          ELSE p.stockQuantity
        END) as currentStock,
        MAX(CASE
          WHEN (si.isBulk = 1 OR si.isBulk = 'true' OR si.isBulk = TRUE)
          THEN p.bulkUnit
          ELSE p.unit
        END) as unit,
        MAX(CASE WHEN s.paymentStatus = 'DEBT' THEN 1 ELSE 0 END) as isOnCredit
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      JOIN Product p ON si.productId = p.id
      WHERE s.shopId = ? AND s.timestamp BETWEEN ? AND ? AND s.isReverted = 0
      GROUP BY p.id, p.name, 3 -- Group by the calculated isBulk column

      UNION ALL

      SELECT
        'DEBT_PAYMENT' as productId,
        'Debt Payment Received (' || c.name || ')' as productName,
        0 as isBulk,
        1 as totalQuantitySold,
        SUM(dp.amount) as totalRevenue,
        0 as currentStock,
        'pay' as unit,
        0 as isOnCredit
      FROM DebtPayment dp
      JOIN Customer c ON dp.customerId = c.id
      WHERE dp.shopId = ? AND dp.timestamp BETWEEN ? AND ?
      GROUP BY dp.customerId

      ORDER BY totalRevenue DESC
    `;
    const results = await this.db.executeSql(query, [shopId, start, end, shopId, start, end]);
    const items: any[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      items.push(results[0].rows.item(i));
    }
    return items;
  }
}
