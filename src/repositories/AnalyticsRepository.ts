import type { SQLiteDatabase } from 'react-native-sqlite-storage';
import { parseTimestamp } from '../utils/dateUtils';

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

  private getRangeBounds(start: number, end: number) {
    const startMs = start < 1e11 ? start * 1000 : Math.floor(start);
    const endMs = end < 1e11 ? end * 1000 : Math.floor(end);
    return { startMs, endMs };
  }

  async getFinancialSummary(shopId: string, start: number, end: number): Promise<FinancialSummary> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    if (!safeShopId) {
      return { totalRevenue: 0, totalProfit: 0, totalExpenses: 0 };
    }
    const { startMs, endMs } = this.getRangeBounds(start, end);

    // 1. Fetch sales for the shop
    const salesQuery = `
      SELECT
        s.id,
        s.totalAmount,
        s.timestamp,
        (
          SELECT TOTAL(si.quantity * COALESCE(p.costPrice, 0))
          FROM SaleItem si
          JOIN Product p ON si.productId = p.id
          WHERE si.saleId = s.id
        ) as totalCost
      FROM Sale s
      WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ? OR TRIM(s.shopId) = ?)
        AND COALESCE(s.isReverted, 0) = 0
    `;

    // 2. Fetch expenses for the shop
    const expenseQuery = `
      SELECT amount, timestamp FROM Expense
      WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)
    `;

    const [salesResults, expResults] = await Promise.all([
      this.db.executeSql(salesQuery, [safeShopId, safeShopId, safeShopId]),
      this.db.executeSql(expenseQuery, [safeShopId, safeShopId, safeShopId])
    ]);

    let totalRevenue = 0;
    let totalProfit = 0;
    const salesRows = salesResults[0]?.rows;
    if (salesRows) {
      const len = salesRows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const sale = salesRows.item ? salesRows.item(i) : salesRows[i];
        if (!sale) continue;
        const ts = parseTimestamp(sale.timestamp);
        if (ts >= startMs && ts <= endMs) {
          const rev = Number(sale.totalAmount || 0);
          const cost = Number(sale.totalCost || 0);
          totalRevenue += rev;
          totalProfit += (rev - cost);
        }
      }
    }

    let totalExpenses = 0;
    const expRows = expResults[0]?.rows;
    if (expRows) {
      const len = expRows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const exp = expRows.item ? expRows.item(i) : expRows[i];
        if (!exp) continue;
        const ts = parseTimestamp(exp.timestamp);
        if (ts >= startMs && ts <= endMs) {
          totalExpenses += Number(exp.amount || 0);
        }
      }
    }

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
    };
  }

  async getOwnerFinancialSnapshot(shopId: string): Promise<OwnerFinancialSnapshot> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    if (!safeShopId) {
      return {
        totalStockCostValue: 0,
        totalStockSellingValue: 0,
        unitStockCostValue: 0,
        unitStockSellingValue: 0,
        bulkStockCostValue: 0,
        bulkStockSellingValue: 0,
        totalSupplierDebt: 0,
        totalCustomerDebt: 0,
        itemCount: 0
      };
    }

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
      WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?)
        AND COALESCE(status, 'ACTIVE') != 'DELETED'
    `;

    const supplierDebtQuery = `SELECT TOTAL(currentBalance) as total FROM Supplier WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?) AND currentBalance > 0`;
    const customerDebtQuery = `SELECT TOTAL(currentBalance) as total FROM Customer WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?) AND currentBalance > 0`;

    const [stockRes, supplierRes, customerRes] = await Promise.all([
      this.db.executeSql(stockQuery, [safeShopId, safeShopId, safeShopId]),
      this.db.executeSql(supplierDebtQuery, [safeShopId, safeShopId, safeShopId]),
      this.db.executeSql(customerDebtQuery, [safeShopId, safeShopId, safeShopId])
    ]);

    const stock = stockRes[0]?.rows?.length ? (stockRes[0].rows.item ? stockRes[0].rows.item(0) : stockRes[0].rows[0]) : null;
    const supplier = supplierRes[0]?.rows?.length ? (supplierRes[0].rows.item ? supplierRes[0].rows.item(0) : supplierRes[0].rows[0]) : null;
    const customer = customerRes[0]?.rows?.length ? (customerRes[0].rows.item ? customerRes[0].rows.item(0) : customerRes[0].rows[0]) : null;

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
    const summary = await this.getFinancialSummary(shopId, start, end);
    return summary.totalExpenses;
  }

  async getTopProducts(shopId: string, start: number, end: number, limit: number = 5): Promise<TopProduct[]> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    if (!safeShopId) return [];
    const { startMs, endMs } = this.getRangeBounds(start, end);

    const query = `
      SELECT p.name, si.quantity, si.priceAtSale, s.timestamp
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      JOIN Product p ON si.productId = p.id
      WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ? OR TRIM(s.shopId) = ?)
        AND COALESCE(s.isReverted, 0) = 0
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, safeShopId]);
    const productMap = new Map<string, { name: string; totalQuantity: number; totalRevenue: number }>();
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = rows.item ? rows.item(i) : rows[i];
        if (!item) continue;
        const ts = parseTimestamp(item.timestamp);
        if (ts >= startMs && ts <= endMs) {
          const name = item.name;
          const qty = Number(item.quantity || 0);
          const rev = qty * Number(item.priceAtSale || 0);
          const existing = productMap.get(name) || { name, totalQuantity: 0, totalRevenue: 0 };
          existing.totalQuantity += qty;
          existing.totalRevenue += rev;
          productMap.set(name, existing);
        }
      }
    }
    const products = Array.from(productMap.values());
    products.sort((a, b) => b.totalQuantity - a.totalQuantity);
    return products.slice(0, limit);
  }

  async getCashierPerformance(shopId: string, start: number, end: number): Promise<CashierPerformance[]> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    if (!safeShopId) return [];
    const { startMs, endMs } = this.getRangeBounds(start, end);

    const query = `
      SELECT s.id, COALESCE(e.name, 'Owner / Staff') as employeeName, s.totalAmount, s.timestamp
      FROM Sale s
      LEFT JOIN Employee e ON s.employeeId = e.id
      WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ? OR TRIM(s.shopId) = ?)
        AND COALESCE(s.isReverted, 0) = 0
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, safeShopId]);
    const perfMap = new Map<string, { employeeName: string; saleCount: number; totalRevenue: number }>();
    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const item = rows.item ? rows.item(i) : rows[i];
        if (!item) continue;
        const ts = parseTimestamp(item.timestamp);
        if (ts >= startMs && ts <= endMs) {
          const emp = item.employeeName || 'Owner / Staff';
          const amt = Number(item.totalAmount || 0);
          const existing = perfMap.get(emp) || { employeeName: emp, saleCount: 0, totalRevenue: 0 };
          existing.saleCount += 1;
          existing.totalRevenue += amt;
          perfMap.set(emp, existing);
        }
      }
    }
    return Array.from(perfMap.values());
  }

  async getDailyItemSales(shopId: string, start: number, end: number): Promise<DailyItemSale[]> {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    if (!safeShopId) return [];
    const { startMs, endMs } = this.getRangeBounds(start, end);

    const query = `
      SELECT
        p.id as productId,
        p.name as productName,
        CASE WHEN (si.isBulk = 1 OR si.isBulk = 'true' OR si.isBulk = TRUE) THEN 1 ELSE 0 END as isBulk,
        si.quantity,
        si.priceAtSale,
        p.stockQuantity,
        p.bulkStockQuantity,
        p.unit,
        p.bulkUnit,
        s.paymentStatus,
        s.timestamp
      FROM SaleItem si
      JOIN Sale s ON si.saleId = s.id
      JOIN Product p ON si.productId = p.id
      WHERE (TRIM(LOWER(s.shopId)) = TRIM(LOWER(?)) OR s.shopId = ? OR TRIM(s.shopId) = ?)
        AND COALESCE(s.isReverted, 0) = 0
    `;
    const results = await this.db.executeSql(query, [safeShopId, safeShopId, safeShopId]);
    const itemMap = new Map<string, DailyItemSale>();

    const rows = results[0]?.rows;
    if (rows) {
      const len = rows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const row = rows.item ? rows.item(i) : rows[i];
        if (!row) continue;
        const ts = parseTimestamp(row.timestamp);
        if (ts >= startMs && ts <= endMs) {
          const key = `${row.productId}_${row.isBulk ? 'bulk' : 'unit'}`;
          const qty = Number(row.quantity || 0);
          const rev = qty * Number(row.priceAtSale || 0);
          const isBulk = Number(row.isBulk || 0) === 1;
          const currentStock = isBulk ? Number(row.bulkStockQuantity || 0) : Number(row.stockQuantity || 0);
          const unit = isBulk ? (row.bulkUnit || 'carton') : (row.unit || 'pcs');
          const isOnCredit = row.paymentStatus === 'DEBT' ? 1 : 0;

          const existing = itemMap.get(key);
          if (existing) {
            existing.totalQuantitySold += qty;
            existing.totalRevenue += rev;
            if (isOnCredit) existing.isOnCredit = 1;
          } else {
            itemMap.set(key, {
              productId: row.productId,
              productName: row.productName,
              isBulk: isBulk ? 1 : 0,
              totalQuantitySold: qty,
              totalRevenue: rev,
              currentStock,
              unit,
              isOnCredit
            });
          }
        }
      }
    }

    const debtQuery = `
      SELECT dp.customerId, c.name as customerName, dp.amount, dp.timestamp
      FROM DebtPayment dp
      JOIN Customer c ON dp.customerId = c.id
      WHERE (TRIM(LOWER(dp.shopId)) = TRIM(LOWER(?)) OR dp.shopId = ? OR TRIM(dp.shopId) = ?)
    `;
    const debtResults = await this.db.executeSql(debtQuery, [safeShopId, safeShopId, safeShopId]);
    const debtRows = debtResults[0]?.rows;
    if (debtRows) {
      const len = debtRows.length ?? 0;
      for (let i = 0; i < len; i++) {
        const row = debtRows.item ? debtRows.item(i) : debtRows[i];
        if (!row) continue;
        const ts = parseTimestamp(row.timestamp);
        if (ts >= startMs && ts <= endMs) {
          const key = `DEBT_PAYMENT_${row.customerId}`;
          const amt = Number(row.amount || 0);
          const existing = itemMap.get(key);
          if (existing) {
            existing.totalRevenue += amt;
          } else {
            itemMap.set(key, {
              productId: 'DEBT_PAYMENT',
              productName: `Debt Payment Received (${row.customerName})`,
              isBulk: 0,
              totalQuantitySold: 1,
              totalRevenue: amt,
              currentStock: 0,
              unit: 'pay',
              isOnCredit: 0
            });
          }
        }
      }
    }

    const list = Array.from(itemMap.values());
    list.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return list;
  }
}
