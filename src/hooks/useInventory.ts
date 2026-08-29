import { useState, useEffect, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { Product, Category } from '../db/types';

export const useInventory = (shopId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const categoryRepo = new CategoryRepository(db);

      const allProducts = await productRepo.getProductsByShop(shopId);
      const allCategories = await categoryRepo.getCategoriesByShop(shopId);

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
  }, [loadData]);

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
      await productRepo.insertProduct(newProduct);
      await loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }, [shopId, loadData]);

  const toggleLowStockFilter = () => {
    setShowLowStockOnly(!showLowStockOnly);
  };

  const generateBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const filteredProducts = showLowStockOnly
    ? products.filter(p => p.stockQuantity <= p.minStockLevel)
    : products;

  return {
    products: filteredProducts,
    categories,
    isLoading,
    error,
    showLowStockOnly,
    addProduct,
    toggleLowStockFilter,
    generateBarcode,
    refreshInventory: loadData,
  };
};
