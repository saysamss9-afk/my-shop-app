import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { generateUUID } from '../utils/uuid';
import type { Expense } from '../db/types';

export const useExpenses = (shopId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState('$');

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();

      // Load currency
      const shopResults = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0]?.rows?.length > 0) {
        setCurrency(shopResults[0].rows.item(0).currency || '$');
      }

      // Load expenses ordered by timestamp descending
      const results = await db.executeSql(
        'SELECT * FROM Expense WHERE shopId = ? ORDER BY timestamp DESC',
        [shopId]
      );

      const loadedExpenses: Expense[] = [];
      for (let i = 0; i < results[0].rows.length; i++) {
        loadedExpenses.push(results[0].rows.item(i));
      }
      setExpenses(loadedExpenses);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  const addExpense = async (category: string, amount: number, description: string) => {
    try {
      const db = await getDBConnection();
      const id = generateUUID();
      const timestamp = Date.now();
      const safeShopId = shopId?.toString().trim();

      await db.executeSql(
        `INSERT INTO Expense (id, shopId, category, amount, description, timestamp, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [id, safeShopId, category, amount, description || null, timestamp]
      );

      await loadExpenses();
      return true;
    } catch (e) {
      console.error('Failed to add expense:', e);
      throw e;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const db = await getDBConnection();
      await db.executeSql('DELETE FROM Expense WHERE id = ?', [id]);
      await loadExpenses();
      return true;
    } catch (e) {
      console.error('Failed to delete expense:', e);
      throw e;
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  return {
    expenses,
    isLoading,
    currency,
    addExpense,
    deleteExpense,
    refreshExpenses: loadExpenses
  };
};
