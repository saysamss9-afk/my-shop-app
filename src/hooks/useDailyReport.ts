import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { AnalyticsRepository, DailyItemSale } from '../repositories/AnalyticsRepository';

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

      // Parse selectedDate (YYYY-MM-DD) to start and end of day timestamps
      const date = new Date(selectedDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).getTime();

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
