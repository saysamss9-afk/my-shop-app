import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import type { Sale } from '../db/types';
import { useSync } from '../sync/SyncContext';

export const useSales = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  const loadSales = useCallback(async (start?: number, end?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const safeShopId = (shopId || '').toString().trim();
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE TRIM(id) = TRIM(?)', [safeShopId]);
      if (shopResults[0]?.rows?.length > 0) {
        const item = shopResults[0].rows.item ? shopResults[0].rows.item(0) : shopResults[0].rows[0];
        setCurrency(item?.currency || '$');
      }

      const allSales = start !== undefined && end !== undefined
        ? await saleRepo.getSalesByShopAndRange(safeShopId, start, end)
        : await saleRepo.getSalesByShop(safeShopId);
      setSales(allSales);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    // Default to current month if no range provided?
    // Actually, the component should handle the range.
    loadSales();
  }, [loadSales, dataChangeTick]);

  const revertSale = useCallback(async (saleId: string) => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);
      await saleRepo.revertSale(saleId);
      await loadSales();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadSales, shopId, triggerSync]);

  const refundSaleItem = useCallback(async (saleItemId: string, qty: number) => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);
      await saleRepo.refundSingleSaleItem(saleItemId, qty);
      await loadSales();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSales]);

  const triggerManualSync = () => {
    triggerSync(shopId);
  };

  const getSaleDetails = useCallback(async (saleId: string) => {
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);
      return await saleRepo.getDetailedItemsForSale(saleId);
    } catch (e) {
      console.error("Failed to fetch sale details", e);
      return [];
    }
  }, []);

  const getShopInfo = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const results = await db.executeSql('SELECT name, address FROM Shop WHERE id = ?', [shopId]);
      if (results[0].rows.length > 0) {
        return results[0].rows.item(0);
      }
    } catch (e) {
      console.error('Failed to fetch shop info:', e);
    }
    return { name: 'My Shop', address: '' };
  }, [shopId]);

  return {
    sales,
    isLoading,
    syncStatus,
    error,
    currency,
    revertSale,
    triggerManualSync,
    getSaleDetails,
    getShopInfo,
    refreshSales: loadSales,
    refundSaleItem,
  };
};
