import React, { createContext, useContext, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { SyncManager, SyncStatus } from './SyncManager';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { PurchaseRepository } from '../repositories/PurchaseRepository';
import { SystemRepository } from '../repositories/SystemRepository';

interface SyncContextType {
  syncManager: SyncManager | null;
  syncStatus: SyncStatus;
  dataChangeTick: number;
  triggerSync: (shopId?: string, deepSync?: boolean) => Promise<void>;
  startRealtimeSync: (shopId: string) => void;
  stopRealtimeSync: () => void;
}

const SyncContext = createContext<SyncContextType>({
  syncManager: null,
  syncStatus: SyncStatus.Idle,
  dataChangeTick: 0,
  triggerSync: async () => {},
  startRealtimeSync: () => {},
  stopRealtimeSync: () => {},
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = useState<SyncManager | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Idle);
  const [dataChangeTick, setDataChangeTick] = useState(0);

  const managerRef = useRef<SyncManager | null>(null);

  useEffect(() => {
    let syncManager: SyncManager;

    const init = async () => {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const categoryRepo = new CategoryRepository(db);
      const saleRepo = new SaleRepository(db);
      const supplierRepo = new SupplierRepository(db);
      const customerRepo = new CustomerRepository(db);
      const purchaseRepo = new PurchaseRepository(db);
      const systemRepo = new SystemRepository(db);

      syncManager = new SyncManager(
        productRepo,
        categoryRepo,
        saleRepo,
        supplierRepo,
        customerRepo,
        purchaseRepo,
        systemRepo
      );
      syncManager.setOnDataChanged(() => {
        setDataChangeTick(prev => prev + 1);
        setSyncStatus(syncManager.getStatus());
      });
      syncManager.initialize();
      managerRef.current = syncManager;
      setManager(syncManager);
    };

    init();

    return () => {
      if (syncManager) {
        syncManager.cleanup();
      }
    };
  }, []);

  const triggerSync = useCallback(async (shopId?: string, deepSync = false) => {
    if (managerRef.current) {
      setSyncStatus(SyncStatus.Syncing);
      await managerRef.current.triggerSync(shopId);
      setSyncStatus(managerRef.current.getStatus());
      setDataChangeTick(prev => prev + 1);
    }
  }, []);

  const startRealtimeSync = useCallback((shopId: string) => {
    if (managerRef.current) {
      managerRef.current.startRealtimeSync(shopId);
    }
  }, []);

  const stopRealtimeSync = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopRealtimeSync();
    }
  }, []);

  const contextValue = useMemo(() => ({
    syncManager: manager,
    syncStatus,
    dataChangeTick,
    triggerSync,
    startRealtimeSync,
    stopRealtimeSync
  }), [manager, syncStatus, dataChangeTick, triggerSync, startRealtimeSync, stopRealtimeSync]);

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
