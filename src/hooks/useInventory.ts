import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { Product, Category } from '../db/types';
import { useSync } from '../sync/SyncContext';

import { SyncStatus } from '../sync/SyncManager';

export const useInventory = (shopId: string) => {
  const { triggerSync, dataChangeTick, syncStatus } = useSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [shopName, setShopName] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const categoryRepo = new CategoryRepository(db);

      const allProducts = await productRepo.getProductsByShop(shopId);
      const allCategories = await categoryRepo.getCategoriesByShop(shopId);

      const shopResults = await db.executeSql('SELECT name, currency FROM Shop WHERE id = ?', [shopId]);
      if (shopResults[0].rows.length > 0) {
        const shop = shopResults[0].rows.item(0);
        setCurrency(shop.currency || '$');
        setShopName(shop.name || '');
      }

      setProducts(allProducts);
      setCategories(allCategories);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData, dataChangeTick]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'shopId' | 'syncStatus'>) => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        shopId,
        syncStatus: 0,
      };

      // 1. Write to local database (Offline-first)
      await productRepo.insertProduct(newProduct);

      // 2. Update local state immediately for instant UI feedback
      setProducts(prev => [newProduct, ...prev]);

      // 3. Trigger background sync
      triggerSync(shopId);

      // 4. Silently refresh categories or other metadata if needed,
      // but don't call loadData() with isLoading=true
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync]);

  const toggleLowStockFilter = () => {
    setShowLowStockOnly(!showLowStockOnly);
  };

  const generateBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const filteredProducts = showLowStockOnly
    ? products.filter(p => p.stockQuantity <= p.minStockLevel)
    : products;

  const triggerManualSync = () => {
    triggerSync(shopId);
  };

  return {
    products: filteredProducts,
    categories,
    currency,
    shopName,
    isLoading,
    syncStatus,
    error,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
    triggerManualSync,
    refreshInventory: loadData,
  };
};
