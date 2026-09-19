export interface Shop {
  id: string;
  name: string;
  type: string;
  employeeCount: number;
  region: string;
  location: string;
  ownerId: string;
  plan: 'STARTER' | 'BUSINESS' | 'PREMIUM';
  parentShopId: string | null;
  parentshopid?: string | null; // Inconsistent naming support
  country?: string;
  currency?: string;
  shopCode?: string;
  branchCount?: number;
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
  bulkPrice: number;
  bulkStockQuantity: number;
  bulkUnit: string | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  supplierId: string | null;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'DELETED';
  syncStatus: number;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactInfo: string | null; // Keep for backward compatibility
  currentBalance: number;
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
  invoiceNumber: string | null;
  timestamp: number;
  totalCost: number;
  amountPaid: number;
  balance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DEBT';
  syncStatus: number;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string; // Storing name snapshot
  quantity: number;
  costPrice: number;
  isBulk: number;
}

export interface PurchaseReturn {
  id: string;
  purchaseOrderId: string;
  shopId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  value: number;
  reason: string;
  timestamp: number;
  syncStatus: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  shopId: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  timestamp: number;
  note: string | null;
  syncStatus: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
  isBulk: number;
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
