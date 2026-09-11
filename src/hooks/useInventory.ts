import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import type { Product, Category } from '../db/types';
import { useSync } from '../sync/SyncContext';
import { generateUUID } from '../utils/uuid';

import type { SyncStatus } from '../sync/SyncManager';

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
      console.log('useInventory: addProduct called with shopId:', shopId, 'type:', typeof shopId);

      const safeShopId = typeof shopId === 'object' ? (shopId as any).shopId : shopId;

      if (!safeShopId || safeShopId === 'undefined' || safeShopId === '[object Object]') {
        Alert.alert("Sync Error", "Inventory cannot be updated because no active shop is selected. Please try logging in again.");
        return;
      }

      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);

      // Barcode collision detection and automatic merging
      if (productData.barcode) {
        const existingProduct = await productRepo.getProductByBarcode(productData.barcode, safeShopId);
        if (existingProduct) {
          const updatedProduct: Product = {
            ...existingProduct,
            stockQuantity: existingProduct.stockQuantity + (productData.stockQuantity ?? 0),
            bulkStockQuantity: existingProduct.bulkStockQuantity + (productData.bulkStockQuantity ?? 0),
            // Optionally update prices if supplied as non-zero
            price: productData.price || existingProduct.price,
            costPrice: productData.costPrice || existingProduct.costPrice,
            syncStatus: 0 // Mark as pending sync
          };
          await productRepo.updateProduct(updatedProduct);
          setProducts(prev => prev.map(p => p.id === existingProduct.id ? updatedProduct : p));
          triggerSync(safeShopId);
          return;
        }
      }

      const newProduct: Product = {
        ...productData,
        id: generateUUID(),
        shopId: safeShopId,
        // Ensure sensible defaults for numeric and optional fields
        price: productData.price ?? 0,
        costPrice: productData.costPrice ?? 0,
        stockQuantity: productData.stockQuantity ?? 0,
        minStockLevel: productData.minStockLevel ?? 0,
        bulkQuantity: productData.bulkQuantity ?? 1,
        bulkPrice: productData.bulkPrice ?? 0,
        bulkStockQuantity: productData.bulkStockQuantity ?? 0,
        unit: productData.unit ?? 'pcs',
        bulkUnit: productData.bulkUnit ?? 'Carton',
        barcode: productData.barcode ?? null,
        bulkBarcode: productData.bulkBarcode ?? null,
        supplierId: productData.supplierId ?? null,
        categoryId: productData.categoryId ?? null,
        description: productData.description ?? null,
        status: 'ACTIVE',
        syncStatus: 0,
      };

      // 1. Write to local database (Offline-first)
      await productRepo.insertProduct(newProduct);

      // 2. Update local state immediately for instant UI feedback
      setProducts(prev => [newProduct, ...prev]);

      // 3. Trigger background sync
      triggerSync(safeShopId);

      // 4. Silently refresh categories or other metadata if needed,
      // but don't call loadData() with isLoading=true
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync]);

  const updateProduct = useCallback(async (product: Product) => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      await productRepo.updateProduct(product);
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      triggerSync(shopId);
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, triggerSync]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      await productRepo.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      triggerSync(shopId);
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
    // Perform a deep sync to fully reconcile local device data with remote
    triggerSync(shopId, true);
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
    updateProduct,
    toggleLowStockFilter,
    generateBarcode,
    triggerManualSync,
    refreshInventory: loadData,
    deleteProduct,
  };
};
