import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { Supplier, SupplierPayment } from '../db/types';
import { useSync } from '../sync/SyncContext';
import { generateUUID } from '../utils/uuid';

export interface SupplierStats {
  totalSuppliers: number;
  owedSuppliers: number;
  totalPayable: number;
  paidThisMonth: number;
  purchasesThisMonth: number;
}

export const useSuppliers = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [suppliers, setSuppliers] = useState<(Supplier & { productCount: number })[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    owedSuppliers: 0,
    totalPayable: 0,
    paidThisMonth: 0,
    purchasesThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('₵');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '₵');
      }

      const supplierData = await repo.getSuppliersWithStats(shopId);
      setSuppliers(supplierData);

      const dashboardStats = await repo.getDashboardStats(shopId);
      setStats(dashboardStats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData, dataChangeTick]);

  const addSupplier = useCallback(async (name: string, contactInfo: string) => {
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      const newSupplier: Supplier = {
        id: generateUUID(),
        shopId,
        name,
        contactInfo,
        currentBalance: 0,
        syncStatus: 0,
      };
      await repo.insertSupplier(newSupplier);
      await loadData();
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync, loadData]);

  const recordPayment = useCallback(async (supplierId: string, amount: number, paymentMethod: string, reference?: string, note?: string) => {
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      const payment: Omit<SupplierPayment, 'syncStatus'> = {
        id: generateUUID(),
        supplierId,
        shopId,
        amount,
        paymentMethod,
        reference: reference || null,
        timestamp: Date.now(),
        note: note || null,
      };
      await repo.recordPayment(payment);
      await loadData();
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadData, triggerSync]);

  const triggerManualSync = () => {
    triggerSync(shopId);
  };

  return {
    suppliers,
    stats,
    isLoading,
    syncStatus,
    error,
    currency,
    addSupplier,
    recordPayment,
    triggerManualSync,
    refreshSuppliers: loadData,
  };
};
