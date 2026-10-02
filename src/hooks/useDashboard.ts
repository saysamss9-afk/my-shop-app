import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductRepository } from '../repositories/ProductRepository';
import { SyncStatus } from '../sync/SyncManager';
import { getDBConnection } from '../db/database';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { useSync } from '../sync/SyncContext';

export const useDashboard = (shopId: string) => {
  const { syncManager, triggerSync: triggerGlobalSync, dataChangeTick } = useSync();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [lastSynced, setLastSynced] = useState<number>(0);
  const [currency, setCurrency] = useState('$');
  const [shopName, setShopName] = useState('');
  const [shopCode, setShopCode] = useState<string | null>(null);
  const [shopPlan, setShopPlan] = useState<'STARTER' | 'BUSINESS' | 'PREMIUM'>('STARTER');
  const [parentShopId, setParentShopId] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);

  const shopIdRef = useRef(shopId);
  useEffect(() => {
    shopIdRef.current = shopId;
  }, [shopId]);

  // Sync status effect
  useEffect(() => {
    if (syncManager) {
      setSyncStatus(syncManager.getStatus());
      setLastSynced(syncManager.getLastSynced());
    }
  }, [syncManager, dataChangeTick]);

  const loadStats = useCallback(async () => {
    try {
      const activeShopId = shopIdRef.current || shopId;
      if (!activeShopId) return;

      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const analyticsRepo = new AnalyticsRepository(db);

      const shopResults = await db.executeSql('SELECT name, currency, [plan], parentShopId, shopCode, planExpiresAt FROM Shop WHERE id = ?', [activeShopId]);
      const shopRow = shopResults[0]?.rows?.length ? shopResults[0].rows.item(0) : null;
      if (shopRow) {
        setCurrency(shopRow.currency || '$');
        setShopName(shopRow.name || '');
        setShopCode(shopRow.shopCode || null);
        const normalizedPlan = (shopRow.plan || 'STARTER').toUpperCase();
        setShopPlan(normalizedPlan as any);
        setParentShopId(shopRow.parentShopId || null);

        let expiry = shopRow.planExpiresAt || null;
        if (!expiry) {
          const trialExpiry = new Date();
          trialExpiry.setMonth(trialExpiry.getMonth() + 1);
          expiry = trialExpiry.toISOString().split('T')[0];
          db.executeSql('UPDATE Shop SET planExpiresAt = ? WHERE id = ?', [expiry, activeShopId]).catch(() => {});
        }
        setPlanExpiresAt(expiry);
      }

      // Get low stock count
      const count = await productRepo.getLowStockCount(activeShopId);
      setLowStockCount(count);

      // Get revenue for today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const summary = await analyticsRepo.getFinancialSummary(
        activeShopId,
        startOfDay.getTime(),
        endOfDay.getTime()
      );
      setRevenue(Number(summary?.totalRevenue || 0));
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  }, [shopId]);

  const triggerSync = useCallback(async (force = false) => {
    setSyncStatus(SyncStatus.Syncing);
    const activeShopId = shopIdRef.current || shopId;
    await triggerGlobalSync(activeShopId, force, 'ALL');
    await loadStats();
    setLastSynced(Date.now());
    setTimeout(() => setSyncStatus(SyncStatus.Idle), 3000);
  }, [triggerGlobalSync, loadStats, shopId]);

  useEffect(() => {
    loadStats();
  }, [loadStats, dataChangeTick]);

  return {
    syncStatus,
    lowStockCount,
    revenue,
    currency,
    shopName,
    shopCode,
    shopPlan,
    parentShopId,
    planExpiresAt,
    lastSynced,
    triggerSync,
    refreshDashboard: loadStats
  };
};
