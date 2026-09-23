import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SupplierRepository } from '../repositories/SupplierRepository';
import type { Supplier, SupplierPayment } from '../db/types';
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
  const [currency, setCurrency] = useState('');

  const [hasLoaded, setHasLoaded] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent && !hasLoaded) setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '');
      }

      const supplierData = await repo.getSuppliersWithStats(shopId);
      setSuppliers(supplierData);

      const dashboardStats = await repo.getDashboardStats(shopId);
      setStats(dashboardStats);
      setHasLoaded(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, hasLoaded]);

  useEffect(() => {
    loadData(hasLoaded);
  }, [dataChangeTick]); // loadData(true) if already loaded once

  const addSupplier = useCallback(async (supplierData: Partial<Supplier>) => {
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);

      const safeShopId = typeof shopId === 'object' ? (shopId as any).shopId : shopId;
      if (!safeShopId || safeShopId === 'undefined' || safeShopId === '[object Object]') {
        console.error("useSuppliers: Invalid shopId", shopId);
        return;
      }

      const newSupplier: Supplier = {
        id: generateUUID(),
        shopId: safeShopId,
        name: supplierData.name || '',
        contactPerson: supplierData.contactPerson || null,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        address: supplierData.address || null,
        contactInfo: supplierData.contactInfo || null,
        currentBalance: 0,
        syncStatus: 0,
      };
      await repo.insertSupplier(newSupplier);
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync, loadData]);

  const recordPayment = useCallback(async (supplierId: string, amount: number, paymentMethod: string, reference?: string, note?: string) => {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      const payment: Omit<SupplierPayment, 'syncStatus'> = {
        id: generateUUID(),
        supplierId,
        shopId: safeShopId,
        amount,
        paymentMethod,
        reference: reference || null,
        timestamp: Date.now(),
        note: note || null,
      };
      await repo.recordPayment(payment);
      await loadData();
      triggerSync(safeShopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadData, triggerSync]);

  const triggerManualSync = () => {
    triggerSync(shopId, true);
  };

  const getSupplierProducts = useCallback(async (supplierId: string) => {
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      return await repo.getSupplierProducts(supplierId);
    } catch (e: any) {
      console.error('Failed to fetch supplier products:', e.message);
      return [];
    }
  }, []);

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
    getSupplierProducts,
    refreshSuppliers: loadData,
  };
};
