import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { Customer } from '../db/types';
import { useSync } from '../sync/SyncContext';

export const useCustomers = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();

      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      const results = await db.executeSql('SELECT * FROM Customer WHERE shopId = ?', [shopId]);
      const data: Customer[] = [];
      for (let i = 0; i < results[0].rows.length; i++) {
        data.push(results[0].rows.item(i));
      }
      setCustomers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers, dataChangeTick]);

  const addCustomer = useCallback(async (name: string, phone: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      const newCustomer: Customer = {
        id: Date.now().toString(),
        shopId,
        name,
        phone,
        email: null,
        currentBalance: 0,
        syncStatus: 0,
      };
      await repo.insertCustomer(newCustomer);
      setCustomers(prev => [newCustomer, ...prev]);
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync]);

  const recordPayment = useCallback(async (customerId: string, amount: number, paymentMethod: string, note?: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      const payment = {
        id: Date.now().toString(),
        customerId,
        shopId,
        amount,
        paymentMethod,
        timestamp: Date.now(),
        note: note || null,
      };
      await repo.recordPayment(payment);
      await loadCustomers();
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadCustomers, triggerSync]);

  const triggerManualSync = () => {
    triggerSync(shopId);
  };

  return {
    customers,
    isLoading,
    syncStatus,
    error,
    currency,
    addCustomer,
    recordPayment,
    triggerManualSync,
    refreshCustomers: loadCustomers,
  };
};
