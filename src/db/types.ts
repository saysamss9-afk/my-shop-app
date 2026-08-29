export interface Shop {
  id: string;
  name: string;
  type: string;
  employeeCount: number;
  region: string;
  location: string;
  ownerId: string;
}

export interface Category {
  id: string;
  shopId: string;
  name: string;
  syncStatus: number;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  bulkBarcode: string | null;
  bulkQuantity: number;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  supplierId: string | null;
  syncStatus: number;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  contactInfo: string | null;
  syncStatus: number;
}

export interface Employee {
  id: string;
  shopId: string;
  name: string;
  role: string;
  email: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string | null;
  email: string | null;
  currentBalance: number;
  syncStatus: number;
}

export interface Sale {
  id: string;
  shopId: string;
  employeeId: string;
  customerId: string | null;
  timestamp: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  dueDate: number | null;
  syncStatus: number;
  isReverted: number;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  shopId: string;
  amount: number;
  paymentMethod: string;
  timestamp: number;
  note: string | null;
  syncStatus: number;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  shopId: string;
  quantity: number;
  reason: string;
  timestamp: number;
  syncStatus: number;
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  supplierId: string;
  timestamp: number;
  totalCost: number;
  syncStatus: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
}

export interface AuditLog {
  id: string;
  shopId: string;
  employeeId: string;
  action: string;
  targetId: string | null;
  details: string | null;
  timestamp: number;
  syncStatus: number;
}

export interface Expense {
  id: string;
  shopId: string;
  category: string;
  amount: number;
  description: string | null;
  timestamp: number;
  syncStatus: number;
}
