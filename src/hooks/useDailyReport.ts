import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import type { DailyItemSale } from '../repositories/AnalyticsRepository';

export const useDailyReport = (shopId: string) => {
  const [reportData, setReportData] = useState<DailyItemSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  const loadReport = useCallback(async (selectedDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const safeShopId = typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id : shopId;
      const db = await getDBConnection();
      const analyticsRepo = new AnalyticsRepository(db);

      // Fetch shop currency
      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [safeShopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      // Parse selectedDate (YYYY-MM-DD) to start and end of day in local system time
      const parts = selectedDate.split('-').map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = (parts[1] || 1) - 1;
      const day = parts[2] || 1;

      const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

      const data = await analyticsRepo.getDailyItemSales(safeShopId, startOfDay, endOfDay);
      setReportData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  return {
    reportData,
    currency,
    isLoading,
    error,
    loadReport,
  };
};
