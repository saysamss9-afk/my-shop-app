import { useState, useCallback } from 'react';
import { getDBConnection } from '../db/database';
import { ProductRepository } from '../repositories/ProductRepository';
import { SaleRepository } from '../repositories/SaleRepository';
import { Product, Sale, SaleItem } from '../db/types';

export interface CartItem {
  product: Product;
  quantity: number;
  isBulk: boolean;
}

export const useCheckout = (shopId: string, employeeId: string) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const total = cart.reduce((sum, item) => {
    const price = item.isBulk ? item.product.bulkPrice : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const processSale = useCallback(async (paymentMethod: string = 'CASH', customerId: string | null = null) => {
    if (cart.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const db = await getDBConnection();
      const saleRepo = new SaleRepository(db);

      const saleId = Date.now().toString();
      const sale: Sale = {
        id: saleId,
        shopId,
        employeeId,
        customerId,
        timestamp: Date.now(),
        totalAmount: total,
        paymentMethod,
        paymentStatus: 'PAID', // Simplified
        dueDate: null,
        syncStatus: 0,
        isReverted: 0,
      };

      const items: SaleItem[] = cart.map(item => ({
        id: `${saleId}_${item.product.id}_${item.isBulk ? 'bulk' : 'unit'}`,
        saleId,
        productId: item.product.id,
        quantity: item.quantity,
        priceAtSale: item.isBulk ? item.product.bulkPrice : item.product.price,
        isBulk: item.isBulk ? 1 : 0,
      }));

      await saleRepo.insertSale(sale, items);
      clearCart();
      return saleId;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [cart, shopId, employeeId, total, clearCart]);

  const searchProductByBarcode = useCallback(async (barcode: string) => {
    try {
      const db = await getDBConnection();
      const productRepo = new ProductRepository(db);
      const products = await productRepo.getProductsByShop(shopId);
      const product = products.find(p => p.barcode === barcode || p.bulkBarcode === barcode);
      if (product) {
        const isBulk = barcode === product.bulkBarcode;
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
    isLoading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    processSale,
    searchProductByBarcode,
  };
};
