import { useState, useEffect, useCallback } from 'react';
import { ProductRepository } from '../repositories/ProductRepository';
import { SyncManager, SyncStatus } from '../sync/SyncManager';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';

export const useDashboard = (shopId: string) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
  const [lowStockCount, setLowStockCount] = useState(0);

  const triggerSync = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const saleRepo = new SaleRepository(db);
      const supplierRepo = new SupplierRepository(db);
      const syncManager = new SyncManager(productRepo, saleRepo, supplierRepo);

      setSyncStatus(SyncStatus.Syncing);
      await syncManager.triggerSync();
      setSyncStatus(SyncStatus.Success);

      // Refresh stock count after sync
      const count = await productRepo.getLowStockCount(shopId);
      setLowStockCount(count);
    } catch (e) {
      console.error('Manual sync failed:', e);
      setSyncStatus(SyncStatus.Error);
    } finally {
      // Return to idle after a delay to show success/error
      setTimeout(() => setSyncStatus(SyncStatus.Idle), 3000);
    }
  }, [shopId]);

  const loadLowStockCount = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const count = await productRepo.getLowStockCount(shopId);
      setLowStockCount(count);
    } catch (e) {
      console.error('Failed to load low stock count:', e);
    }
  }, [shopId]);

  useEffect(() => {
    loadLowStockCount();
  }, [loadLowStockCount]);

  return {
    syncStatus,
    lowStockCount,
    triggerSync,
    refreshDashboard: loadLowStockCount
  };
};
