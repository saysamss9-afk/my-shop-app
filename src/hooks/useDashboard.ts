import { useState, useEffect, useCallback } from 'react';
import { ProductRepository } from '../repositories/ProductRepository';
import { SyncStatus } from '../sync/SyncManager';
import { getDBConnection } from '../db/database';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { useSync } from '../sync/SyncContext';

export const useDashboard = (shopId: string) => {
  const { syncManager, triggerSync: triggerGlobalSync } = useSync();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [lastSynced, setLastSynced] = useState<number>(0);
  const [currency, setCurrency] = useState('$');
  const [shopName, setShopName] = useState('');

  // Sync status effect
  useEffect(() => {
    if (syncManager) {
      setSyncStatus(syncManager.getStatus());
      setLastSynced(syncManager.getLastSynced());
    }
  }, [syncManager]);

  const loadStats = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const analyticsRepo = new AnalyticsRepository(db);

      const shopResults = await db.executeSql('SELECT name, currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        const shop = shopResults[0].rows.item(0);
        setCurrency(shop.currency || '$');
        setShopName(shop.name || '');
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
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, [shopId]);

  const triggerSync = useCallback(async () => {
    setSyncStatus(SyncStatus.Syncing);
    await triggerGlobalSync();
    await loadStats();
    setLastSynced(Date.now());
    setTimeout(() => setSyncStatus(SyncStatus.Idle), 3000);
  }, [triggerGlobalSync, loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    syncStatus,
    lowStockCount,
    revenue,
    currency,
    shopName,
    lastSynced,
    triggerSync,
    refreshDashboard: loadStats
  };
};
