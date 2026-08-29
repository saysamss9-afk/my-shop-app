import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { AnalyticsRepository, FinancialSummary, TopProduct, CashierPerformance } from '../repositories/AnalyticsRepository';

export const useAnalytics = (shopId: string) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cashierPerformance, setCashierPerformance] = useState<CashierPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (start: number, end: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const analyticsRepo = new AnalyticsRepository(db);

      const [s, e, tp, cp] = await Promise.all([
        analyticsRepo.getFinancialSummary(shopId, start, end),
        analyticsRepo.getTotalExpenses(shopId, start, end),
        analyticsRepo.getTopProducts(shopId, start, end),
        analyticsRepo.getCashierPerformance(shopId, start, end)
      ]);

      setSummary(s);
      setExpenses(e);
      setTopProducts(tp);
      setCashierPerformance(cp);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    loadAnalytics(startOfDay, now);
  }, [loadAnalytics]);

  return {
    summary,
    expenses,
    topProducts,
    cashierPerformance,
    isLoading,
    error,
    loadAnalytics,
  };
};
