import React, { createContext, useContext, useEffect } from 'react';
import { SyncManager, SyncStatus } from './SyncManager';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';

interface SyncContextType {
  syncManager: SyncManager | null;
  syncStatus: SyncStatus;
  dataChangeTick: number;
  triggerSync: (shopId?: string) => Promise<void>;
  startRealtimeSync: (shopId: string) => void;
  stopRealtimeSync: () => void;
}

const SyncContext = createContext<SyncContextType>({
  syncManager: null,
  syncStatus: SyncStatus.Idle,
  dataChangeTick: 0,
  triggerSync: async (shopId?: string) => {},
  startRealtimeSync: (shopId: string) => {},
  stopRealtimeSync: () => {},
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = React.useState<SyncManager | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>(SyncStatus.Idle);
  const [dataChangeTick, setDataChangeTick] = React.useState(0);

  useEffect(() => {
    let syncManager: SyncManager;

    const init = async () => {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const categoryRepo = new CategoryRepository(db);
      const saleRepo = new SaleRepository(db);
      const supplierRepo = new SupplierRepository(db);
      const customerRepo = new CustomerRepository(db);

      syncManager = new SyncManager(productRepo, categoryRepo, saleRepo, supplierRepo, customerRepo);
      syncManager.setOnDataChanged(() => {
        setDataChangeTick(prev => prev + 1);
        setSyncStatus(syncManager.getStatus());
      });
      syncManager.initialize();
      setManager(syncManager);
    };

    init();

    return () => {
      if (syncManager) {
        syncManager.cleanup();
      }
    };
  }, []);

  const triggerSync = async (shopId?: string) => {
    if (manager) {
      setSyncStatus(SyncStatus.Syncing);
      await manager.triggerSync(shopId);
      setSyncStatus(manager.getStatus());
      setDataChangeTick(prev => prev + 1);
    }
  };

  const startRealtimeSync = (shopId: string) => {
    if (manager) manager.startRealtimeSync(shopId);
  };

  const stopRealtimeSync = () => {
    if (manager) manager.stopRealtimeSync();
  };

  return (
    <SyncContext.Provider value={{
      syncManager: manager,
      syncStatus,
      dataChangeTick,
      triggerSync,
      startRealtimeSync,
      stopRealtimeSync
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
