import { useState, useEffect, useCallback } from 'react';
import { ProductRepository } from '../repositories/ProductRepository';
import { SyncManager, SyncStatus } from '../sync/SyncManager';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';

export const useDashboard = (shopId: string) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [lastSynced, setLastSynced] = useState<number>(0);
  const [currency, setCurrency] = useState('$');

  const loadStats = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const analyticsRepo = new AnalyticsRepository(db);

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      // Get low stock count
      const count = await productRepo.getLowStockCount(shopId);
      setLowStockCount(count);

      // Get revenue for today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const summary = await analyticsRepo.getFinancialSummary(
        shopId,
        startOfDay.getTime(),
        endOfDay.getTime()
      );
      setRevenue(summary.totalRevenue);

      // Get last synced time from Shop metadata (if we had it, for now we track locally in hook)
      // For now we rely on the sync manager's internal state if triggered in this session
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, [shopId]);

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
      setLastSynced(Date.now());

      // Refresh stats after sync
      await loadStats();
    } catch (e) {
      console.error('Manual sync failed:', e);
      setSyncStatus(SyncStatus.Error);
    } finally {
      setTimeout(() => setSyncStatus(SyncStatus.Idle), 3000);
    }
  }, [shopId, loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    syncStatus,
    lowStockCount,
    revenue,
    currency,
    lastSynced,
    triggerSync,
    refreshDashboard: loadStats
  };
};
