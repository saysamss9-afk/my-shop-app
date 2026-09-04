import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { SyncManager } from './SyncManager';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';

interface SyncContextType {
  syncManager: SyncManager | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  syncManager: null,
  triggerSync: async () => {},
});

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = React.useState<SyncManager | null>(null);

  useEffect(() => {
    let syncManager: SyncManager;

    const init = async () => {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const saleRepo = new SaleRepository(db);
      const supplierRepo = new SupplierRepository(db);
      const customerRepo = new CustomerRepository(db);

      syncManager = new SyncManager(productRepo, saleRepo, supplierRepo, customerRepo);
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

  const triggerSync = async () => {
    if (manager) {
      await manager.triggerSync();
    }
  };

  return (
    <SyncContext.Provider value={{ syncManager: manager, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
