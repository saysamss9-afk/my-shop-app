import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import { Sale } from '../db/types';

export const useSales = (shopId: string) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);
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
  }, [loadSales]);

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
  }, [loadSales]);

  return {
    sales,
    isLoading,
    error,
    revertSale,
    refreshSales: loadSales,
  };
};
