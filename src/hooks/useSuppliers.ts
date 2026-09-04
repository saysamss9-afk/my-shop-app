import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { Supplier } from '../db/types';
import { useSync } from '../sync/SyncContext';

export const useSuppliers = (shopId: string) => {
  const { triggerSync } = useSync();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      const data = await repo.getSuppliersByShop(shopId);
      setSuppliers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const addSupplier = useCallback(async (name: string, contactInfo: string) => {
    try {
      const db = await getDBConnection();
      const repo = new SupplierRepository(db);
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        shopId,
        name,
        contactInfo,
        syncStatus: 0,
      };
      await repo.insertSupplier(newSupplier);
      setSuppliers(prev => [newSupplier, ...prev]);
      triggerSync();
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId]);

  return {
    suppliers,
    isLoading,
    error,
    addSupplier,
    refreshSuppliers: loadSuppliers,
  };
};
