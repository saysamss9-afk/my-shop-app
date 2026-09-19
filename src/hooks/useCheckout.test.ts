import { calculateCartTotal, validateCartStock } from './useCheckout';

describe('checkout pricing and stock validation', () => {
  const product = {
    id: 'p1',
    shopId: 'shop-1',
    categoryId: null,
    name: 'Rice',
    description: null,
    barcode: '111',
    bulkBarcode: '222',
    bulkQuantity: 12,
    bulkPrice: 100,
    bulkStockQuantity: 5,
    price: 12,
    costPrice: 8,
    stockQuantity: 30,
    minStockLevel: 5,
    unit: 'kg',
    bulkUnit: 'Carton',
    status: 'ACTIVE',
    supplierId: null,
    syncStatus: 0,
  };

  it('calculates the correct total for mixed unit and carton sales', () => {
    const total = calculateCartTotal([
      { product: product as any, quantity: 2, isBulk: false },
      { product: product as any, quantity: 1, isBulk: true },
    ]);

    expect(total).toBe(124);
  });

  it('rejects quantities above available stock', () => {
    const result = validateCartStock([
      { product: product as any, quantity: 31, isBulk: false },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('Insufficient stock');
  });
});
