import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { CategoryRepository } from '../repositories/CategoryRepository';
import type { Category } from '../db/types';
import { generateUUID } from '../utils/uuid';
import { useSync } from '../sync/SyncContext';

export const useCategories = (shopId: string) => {
  const { dataChangeTick } = useSync();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const repo = new CategoryRepository(db);
      const data = await repo.getCategoriesByShop(shopId);
      setCategories(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, dataChangeTick]);

  const addCategory = async (name: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CategoryRepository(db);
      const newCategory: Category = {
        id: generateUUID(),
        shopId,
        name,
        syncStatus: 0,
      };
      await repo.insertCategory(newCategory);
      await loadCategories();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CategoryRepository(db);
      await repo.updateCategory(id, name);
      await loadCategories();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const db = await getDBConnection();
      const repo = new CategoryRepository(db);
      await repo.deleteCategory(id);
      await loadCategories();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  };

  return {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: loadCategories,
  };
};
