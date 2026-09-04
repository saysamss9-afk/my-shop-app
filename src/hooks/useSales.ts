import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import { Sale } from '../db/types';
import { useSync } from '../sync/SyncContext';

export const useSales = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      const allSales = await saleRepo.getSalesByShop(shopId);
      setSales(allSales);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadSales();
  }, [loadSales, dataChangeTick]);

  const revertSale = useCallback(async (saleId: string) => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);
      await saleRepo.revertSale(saleId);
      triggerSync(shopId); // Trigger background sync
      await loadSales();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadSales, shopId, triggerSync]);

  const triggerManualSync = () => {
    triggerSync(shopId);
  };

  return {
    sales,
    isLoading,
    syncStatus,
    error,
    currency,
    revertSale,
    triggerManualSync,
    refreshSales: loadSales,
  };
};
