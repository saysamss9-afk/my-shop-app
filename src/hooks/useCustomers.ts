import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import type { Customer, Product } from '../db/types';
import { useSync } from '../sync/SyncContext';
import { generateUUID } from '../utils/uuid';

export const useCustomers = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');

  const loadData = useCallback(async () => {
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

      const prodRepo = new ProductRepository(db);
      const prods = await prodRepo.getProductsByShop(shopId);
      setProducts(prods);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData, dataChangeTick]);

  const addCustomer = useCallback(async (name: string, phone: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);

      const safeShopId = typeof shopId === 'object' ? (shopId as any).shopId : shopId;
      if (!safeShopId || safeShopId === 'undefined' || safeShopId === '[object Object]') {
        console.error("useCustomers: Invalid shopId", shopId);
        return;
      }

      const newCustomer: Customer = {
        id: generateUUID(),
        shopId: safeShopId,
        name: name || 'Unknown Customer',
        phone: phone || null,
        email: null,
        currentBalance: 0,
        syncStatus: 0,
      };
      await repo.insertCustomer(newCustomer);
      setCustomers(prev => [newCustomer, ...prev]);
      triggerSync(safeShopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync]);

  const recordPayment = useCallback(async (customerId: string, amount: number, paymentMethod: string, note?: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      const payment = {
        id: generateUUID(),
        customerId,
        shopId,
        amount,
        paymentMethod,
        timestamp: Date.now(),
        note: note || null,
      };
      await repo.recordPayment(payment);
      await loadData();
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadData, triggerSync]);

  const returnProduct = useCallback(async (
    customerId: string,
    productId: string,
    quantity: number,
    isBulk: boolean,
    price: number
  ) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      const returnOrder = {
        id: generateUUID(),
        customerId,
        shopId,
        productId,
        quantity,
        value: price * quantity,
        timestamp: Date.now(),
        isBulk
      };
      await repo.recordReturn(returnOrder);
      await loadData();
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadData, triggerSync]);

  const triggerManualSync = () => {
    triggerSync(shopId, true);
  };

  const getCustomerHistory = useCallback(async (customerId: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      return await repo.getCustomerHistory(customerId);
    } catch (e: any) {
      console.error('Failed to fetch customer history:', e.message);
      return [];
    }
  }, []);

  const getItemsTakenOnCredit = useCallback(async (customerId: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CustomerRepository(db);
      return await repo.getItemsTakenOnCredit(customerId);
    } catch (e: any) {
      console.error('Failed to fetch items on credit:', e.message);
      return [];
    }
  }, []);

  return {
    customers,
    products,
    isLoading,
    syncStatus,
    error,
    currency,
    addCustomer,
    recordPayment,
    returnProduct,
    triggerManualSync,
    getCustomerHistory,
    getItemsTakenOnCredit,
    refreshCustomers: loadData,
  };
};
