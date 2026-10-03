import { useState, useCallback, useEffect } from 'react';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import type { Product, Sale, SaleItem } from '../db/types';
import { useSync } from '../sync/SyncContext';
import { generateUUID } from '../utils/uuid';
import { cleanBarcode } from '../utils/barcodeUtils';

export interface CartItem {
  product: Product;
  quantity: number;
  isBulk: boolean;
}

export const roundCurrency = (value: number): number => {
  return Math.round((Number(value) || 0) * 100) / 100;
};

export const calculateCartTotal = (items: CartItem[]): number => {
  return roundCurrency(
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.product.price) || 0;
      const bulkPrice = Number(item.product.bulkPrice) || 0;
      const price = item.isBulk ? bulkPrice : unitPrice;
      return sum + price * quantity;
    }, 0)
  );
};

export const validateCartStock = (items: CartItem[]) => {
  const stockIssues: string[] = [];

  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) continue;

    const availableStock = item.isBulk
      ? Number(item.product.bulkStockQuantity) || 0
      : Number(item.product.stockQuantity) || 0;

    if (quantity > availableStock) {
      stockIssues.push(
        `${item.product.name}: insufficient ${item.isBulk ? 'carton' : 'unit'} stock. Requested ${quantity}, available ${availableStock}.`
      );
    }
  }

  return {
    isValid: stockIssues.length === 0,
    message: stockIssues.length > 0 ? stockIssues.join(' ') : 'Stock validation passed.'
  };
};

export const useCheckout = (shopId: string, employeeId: string) => {
  const { triggerSync } = useSync();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('$');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const fetchCurrency = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const results = await db.executeSql('SELECT currency FROM Shop WHERE id = ?', [shopId]);
      if (results[0].rows.length > 0) {
        setCurrency(results[0].rows.item(0).currency || '$');
      }
    } catch (e) {
      console.error('Failed to fetch shop currency:', e);
    }
  }, [shopId]);

  useEffect(() => {
    fetchCurrency();
  }, [fetchCurrency]);

  const addToCart = useCallback((product: Product, quantity: number = 1, isBulk: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.isBulk === isBulk);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.isBulk === isBulk
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, isBulk }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, isBulk: boolean) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.isBulk === isBulk)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, isBulk: boolean) => {
    if (quantity <= 0) {
      removeFromCart(productId, isBulk);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.isBulk === isBulk ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const total = calculateCartTotal(cart);

  const processSale = useCallback(async (
    paymentMethod: string = 'CASH',
    customerId: string | null = null,
    amountPaidParam?: number
  ) => {
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }

    const stockValidation = validateCartStock(cart);
    if (!stockValidation.isValid) {
      setError(stockValidation.message);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);

      const saleId = generateUUID();
      const saleTotal = calculateCartTotal(cart);
      const targetCustomerId = customerId || selectedCustomerId;

      let amountPaid = amountPaidParam !== undefined && amountPaidParam !== null ? Math.max(0, Number(amountPaidParam)) : saleTotal;
      if (paymentMethod === 'DEBT') {
        amountPaid = 0;
      }
      const balance = Math.max(0, roundCurrency(saleTotal - amountPaid));

      let paymentStatus = 'PAID';
      if (balance > 0) {
        paymentStatus = amountPaid > 0 ? 'PARTIAL' : 'DEBT';
      }

      if (balance > 0 && !targetCustomerId) {
        throw new Error(`A customer must be assigned to record the remaining debt balance of ${currency}${balance.toFixed(2)}.`);
      }

      const sale: Sale = {
        id: saleId,
        shopId,
        employeeId,
        customerId: targetCustomerId,
        timestamp: Date.now(),
        totalAmount: saleTotal,
        amountPaid,
        balance,
        paymentMethod,
        paymentStatus,
        dueDate: null,
        syncStatus: 0,
        isReverted: 0,
      };

      const items: SaleItem[] = cart.map(item => ({
        id: generateUUID(),
        saleId,
        productId: item.product.id,
        quantity: item.quantity,
        priceAtSale: item.isBulk ? item.product.bulkPrice : item.product.price,
        isBulk: item.isBulk ? 1 : 0,
      }));

      await saleRepo.insertSale(sale, items);
      clearCart();
      setSelectedCustomerId(null);
      triggerSync(shopId);
      return saleId;
    } catch (e: any) {
      setError(e.message || 'Unable to process sale.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [cart, shopId, employeeId, clearCart, selectedCustomerId, currency, triggerSync]);

  const searchProductByBarcode = useCallback(async (barcode: string) => {
    try {
      const cleanTarget = cleanBarcode(barcode);
      if (!cleanTarget) return false;

      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const products = await productRepo.getProductsByShop(shopId);
      const product = products.find(p => cleanBarcode(p.barcode) === cleanTarget || cleanBarcode(p.bulkBarcode) === cleanTarget);
      if (product) {
        const isBulk = cleanBarcode(product.bulkBarcode) === cleanTarget;
        // In this new separate inventory model, if it's bulkBarcode, we add 1 carton (quantity=1, isBulk=true)
        // If it's unit barcode, we add 1 unit (quantity=1, isBulk=false)
        addToCart(product, 1, isBulk);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Search failed', e);
      return false;
    }
  }, [shopId, addToCart]);

  return {
    cart,
    total,
    currency,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    processSale,
    searchProductByBarcode,
    selectedCustomerId,
    setSelectedCustomerId,
  };
};
