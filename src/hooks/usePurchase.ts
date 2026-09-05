import { useState, useCallback, useEffect } from 'react';
import { getDBConnection } from '../db/database';
import { PurchaseRepository } from '../repositories/PurchaseRepository';
import { SupplierRepository } from '../repositories/SupplierRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { Supplier, Product, PurchaseOrder, PurchaseOrderItem } from '../db/types';
import { generateUUID } from '../utils/uuid';
import { useSync } from '../sync/SyncContext';

export interface PurchaseItem {
  id?: string; // Existing product ID or undefined if new
  name: string;
  quantity: number;
  costPrice: number;
  isBulk: boolean;
  isNew: boolean;
}

export const usePurchase = (shopId: string) => {
  const { triggerSync } = useSync();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseCart, setPurchaseCart] = useState<PurchaseItem[]>([]);
  const [purchases, setPurchases] = useState<(PurchaseOrder & { supplierName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const sRepo = new SupplierRepository(db);
      const pRepo = new ProductRepository(db);
      const purRepo = new PurchaseRepository(db);

      const sData = await sRepo.getSuppliersByShop(shopId);
      const pData = await pRepo.getProductsByShop(shopId);
      const purData = await purRepo.getPurchasesByShop(shopId);

      setSuppliers(sData);
      setProducts(pData);

      // Map supplier names to purchases
      const purchasesWithNames = purData.map(pur => ({
        ...pur,
        supplierName: sData.find(s => s.id === pur.supplierId)?.name || 'Unknown Supplier'
      }));
      setPurchases(purchasesWithNames);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToCart = (item: PurchaseItem) => {
    setPurchaseCart(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setPurchaseCart(prev => prev.filter((_, i) => i !== index));
  };

  const submitPurchase = async (
    supplierId: string,
    invoiceNumber: string,
    amountPaid: number,
    date: number = Date.now()
  ) => {
    if (!supplierId || purchaseCart.length === 0) {
      setError('Please select a supplier and add items.');
      return;
    }

    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const repo = new PurchaseRepository(db);

      const totalCost = purchaseCart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
      const balance = totalCost - amountPaid;

      const order: PurchaseOrder = {
        id: generateUUID(),
        shopId,
        supplierId,
        invoiceNumber,
        timestamp: date,
        totalCost,
        amountPaid,
        balance,
        paymentStatus: balance <= 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'DEBT'),
        syncStatus: 0
      };

      const items = purchaseCart.map(item => ({
        productId: item.id || '',
        productName: item.name,
        quantity: item.quantity,
        costPrice: item.costPrice,
        isBulk: item.isBulk ? 1 : 0,
        isNew: item.isNew
      }));

      await repo.createPurchase(order, items);
      setPurchaseCart([]);
      await loadData(); // Refresh history
      triggerSync(shopId);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getPurchaseItems = async (purchaseId: string) => {
    try {
      const db = await getDBConnection();
      const repo = new PurchaseRepository(db);
      return await repo.getPurchaseItems(purchaseId);
    } catch (e) {
      console.error('Failed to load purchase items', e);
      return [];
    }
  };

  const returnPurchaseItem = async (
    purchaseId: string,
    supplierId: string,
    productId: string,
    quantity: number,
    value: number,
    reason: string,
    isBulk: boolean
  ) => {
    setIsLoading(true);
    try {
      const db = await getDBConnection();
      const repo = new PurchaseRepository(db);

      const purchaseReturn = {
        id: generateUUID(),
        purchaseOrderId: purchaseId,
        shopId,
        supplierId,
        productId,
        quantity,
        value,
        reason,
        timestamp: Date.now(),
        syncStatus: 0
      };

      await repo.recordReturn(purchaseReturn, isBulk);
      await loadData();
      triggerSync(shopId);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    suppliers,
    products,
    purchaseCart,
    purchases,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    submitPurchase,
    getPurchaseItems,
    returnPurchaseItem,
    refresh: loadData
  };
};
