import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { generateUUID } from '../utils/uuid';
import type { Expense } from '../db/types';
import { useSync } from '../sync/SyncContext';
import { parseTimestamp } from '../utils/dateUtils';

export const useExpenses = (shopId: string) => {
  const { triggerSync, dataChangeTick } = useSync();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState('$');

  const loadExpenses = useCallback(async (isSilent = false) => {
    if (!isSilent && expenses.length === 0) setIsLoading(true);
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      const db = await getDBConnection();

      // Load currency
      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE (TRIM(LOWER(id)) = TRIM(LOWER(?)) OR id = ? OR TRIM(id) = ?)', [safeShopId, safeShopId, safeShopId]);
      if (shopResults[0]?.rows?.length > 0) {
        const sRows = shopResults[0].rows;
        const row = typeof (sRows as any).item === 'function' ? sRows.item(0) : (sRows as any)[0];
        setCurrency(row?.currency || '$');
      }

      // Load expenses ordered by timestamp descending with fallback query
      let results;
      try {
        results = await db.executeSql(
          'SELECT * FROM Expense WHERE (TRIM(LOWER(shopId)) = TRIM(LOWER(?)) OR shopId = ? OR TRIM(shopId) = ?) ORDER BY timestamp DESC',
          [safeShopId, safeShopId, safeShopId]
        );
      } catch (err) {
        results = await db.executeSql(
          'SELECT * FROM Expense WHERE shopId = ? OR TRIM(shopId) = ? ORDER BY timestamp DESC',
          [safeShopId, safeShopId]
        );
      }

      const loadedExpenses: Expense[] = [];
      const rows = results[0]?.rows;
      if (rows) {
        const len = rows.length ?? 0;
        for (let i = 0; i < len; i++) {
          const item = typeof (rows as any).item === 'function' ? rows.item(i) : (rows as any)[i];
          if (item) {
            const ts = parseTimestamp(item.timestamp, Date.now());
            loadedExpenses.push({ ...item, timestamp: ts, amount: Number(item.amount || 0) });
          }
        }
      }
      setExpenses(loadedExpenses);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, expenses.length]);

  const addExpense = async (category: string, amount: number, description: string) => {
    try {
      const db = await getDBConnection();
      const id = generateUUID();
      const timestamp = Date.now();
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();

      await db.executeSql(
        `INSERT INTO Expense (id, shopId, category, amount, description, timestamp, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [id, safeShopId, category, amount, description || null, timestamp]
      );

      await loadExpenses();
      triggerSync(safeShopId);
      return true;
    } catch (e) {
      console.error('Failed to add expense:', e);
      throw e;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
      const db = await getDBConnection();
      await db.executeSql('DELETE FROM Expense WHERE id = ?', [id]);
      await loadExpenses();
      triggerSync(safeShopId);
      return true;
    } catch (e) {
      console.error('Failed to delete expense:', e);
      throw e;
    }
  };

  useEffect(() => {
    loadExpenses(expenses.length > 0);
  }, [dataChangeTick]);

  const triggerManualSync = () => {
    const safeShopId = (typeof shopId === 'object' ? (shopId as any).shopId || (shopId as any).id || (shopId as any).uid : shopId)?.toString().trim();
    triggerSync(safeShopId, true, 'EXPENSES');
  };

  return {
    expenses,
    isLoading,
    currency,
    addExpense,
    deleteExpense,
    triggerManualSync,
    refreshExpenses: loadExpenses
  };
};
