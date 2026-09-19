import { useState, useEffect, useCallback, useRef } from 'react';
import { getDBConnection } from '../db/database';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import type { FinancialSummary, TopProduct, CashierPerformance, OwnerFinancialSnapshot } from '../repositories/AnalyticsRepository';
import { useSync } from '../sync/SyncContext';

export const useAnalytics = (shopId: string) => {
  const { dataChangeTick } = useSync();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [snapshot, setSnapshot] = useState<OwnerFinancialSnapshot | null>(null);
  const [expenses, setExpenses] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cashierPerformance, setCashierPerformance] = useState<CashierPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  // Use a Ref for the last used range to break infinite re-render loops
  const lastRangeRef = useRef<{start: number, end: number} | null>(null);

  const loadAnalytics = useCallback(async (start: number, end: number) => {
    setIsLoading(true);
    setError(null);
    lastRangeRef.current = { start, end };

    try {
      // Robust shopId extraction
      let safeShopId: string = '';
      if (typeof shopId === 'string') {
          safeShopId = shopId;
      } else if (shopId && typeof shopId === 'object') {
          safeShopId = (shopId as any).shopId || (shopId as any).id || (shopId as any).uid || '';
      }

      safeShopId = safeShopId.toString().trim();

      if (!safeShopId || safeShopId === 'undefined' || safeShopId === 'null' || safeShopId === '[object Object]') {
          console.error("useAnalytics: No valid shopId string could be determined", shopId);
          setIsLoading(false);
          return;
      }

      const db = await getDBConnection();
      const analyticsRepo = new AnalyticsRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE TRIM(id) = ?', [safeShopId]);
      if (shopResults[0]?.rows?.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      const [s, tp, cp, snap] = await Promise.all([
        analyticsRepo.getFinancialSummary(safeShopId, start, end),
        analyticsRepo.getTopProducts(safeShopId, start, end),
        analyticsRepo.getCashierPerformance(safeShopId, start, end),
        analyticsRepo.getOwnerFinancialSnapshot(safeShopId)
      ]);

      setSummary(s);
      setExpenses(s.totalExpenses);
      setTopProducts(tp);
      setCashierPerformance(cp);
      setSnapshot(snap);
    } catch (e: any) {
      console.error("useAnalytics: Error loading analytics", e);
      setError(e.message || "An error occurred while calculating financial totals.");
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const refresh = useCallback(() => {
    console.log("useAnalytics: Manual refresh triggered");
    if (lastRangeRef.current) {
        loadAnalytics(lastRangeRef.current.start, lastRangeRef.current.end);
    } else {
        const d = new Date();
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        loadAnalytics(startOfMonth, endOfMonth);
    }
  }, [loadAnalytics]);

  // Handle dataChangeTick (real-time updates)
  useEffect(() => {
    if (dataChangeTick > 0) {
        refresh();
    }
  }, [dataChangeTick, refresh]);

  return {
    summary,
    snapshot,
    expenses,
    topProducts,
    cashierPerformance,
    currency,
    isLoading,
    error,
    loadAnalytics,
    refresh
  };
};
