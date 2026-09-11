import { SQLiteDatabase } from 'react-native-sqlite-storage';
import type { PurchaseOrder, PurchaseOrderItem, Product, SupplierPayment, PurchaseReturn } from '../db/types';
import { generateUUID } from '../utils/uuid';

export class PurchaseRepository {
  constructor(public db: SQLiteDatabase) {}

  async createPurchase(
    order: PurchaseOrder,
    items: (Omit<PurchaseOrderItem, 'id' | 'purchaseOrderId'> & { barcode?: string, isNew?: boolean })[]
  ) {
    await this.db.transaction(async (tx: any) => {
      // 1. Insert Purchase Order
      const orderQuery = `
        INSERT INTO PurchaseOrder(id, shopId, supplierId, invoiceNumber, timestamp, totalCost, amountPaid, balance, paymentStatus, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      await tx.executeSql(orderQuery, [
        order.id, order.shopId, order.supplierId, order.invoiceNumber,
        order.timestamp, order.totalCost, order.amountPaid, order.balance, order.paymentStatus
      ]);

      // 2. Process Items
      for (const item of items) {
        let productId = item.productId;

        // If it's a "New" product (added by name during purchase)
        if (item.isNew || !productId) {
          productId = generateUUID();
          const newProductQuery = `
            INSERT INTO Product(
                id, shopId, name, categoryId, description, barcode, bulkBarcode,
                bulkQuantity, bulkPrice, bulkStockQuantity, bulkUnit, price, costPrice,
                stockQuantity, minStockLevel, unit, supplierId, status, syncStatus
            )
            VALUES (?, ?, ?, NULL, NULL, NULL, NULL, 1, 0, 0, 'Carton', 0, ?, 0, 0, 'pcs', ?, 'DRAFT', 0)
          `;
          await tx.executeSql(newProductQuery, [
            productId, order.shopId, item.productName, item.costPrice, order.supplierId
          ]);
        }

        // Insert Order Item
        const itemQuery = `
          INSERT INTO PurchaseOrderItem(id, purchaseOrderId, productId, productName, quantity, costPrice, isBulk)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await tx.executeSql(itemQuery, [
          generateUUID(), order.id, productId, item.productName, item.quantity, item.costPrice, item.isBulk
        ]);

        // Increase Inventory Stock
        const column = item.isBulk === 1 ? 'bulkStockQuantity' : 'stockQuantity';
        const updateStockQuery = `UPDATE Product SET ${column} = ${column} + ?, syncStatus = 0 WHERE id = ?`;
        await tx.executeSql(updateStockQuery, [item.quantity, productId]);

        // Link product to this supplier if it doesn't have one assigned
        await tx.executeSql(
            'UPDATE Product SET supplierId = ?, syncStatus = 0 WHERE id = ? AND (supplierId IS NULL OR supplierId = "")',
            [order.supplierId, productId]
        );
      }

      // 3. Update Supplier Balance (Increase by the unpaid balance)
      if (order.balance > 0) {
        const updateSupplierQuery = 'UPDATE Supplier SET currentBalance = currentBalance + ?, syncStatus = 0 WHERE id = ?';
        await tx.executeSql(updateSupplierQuery, [order.balance, order.supplierId]);
      }

      // 4. Record Supplier Payment if any amount was paid upfront
      if (order.amountPaid > 0) {
        const paymentId = generateUUID();
        const paymentQuery = `
            INSERT INTO SupplierPayment(id, supplierId, shopId, amount, paymentMethod, reference, timestamp, note, syncStatus)
            VALUES (?, ?, ?, ?, 'CASH', ?, ?, 'Upfront payment for Invoice ' || ?, 0)
        `;
        await tx.executeSql(paymentQuery, [
            paymentId, order.supplierId, order.shopId, order.amountPaid,
            order.invoiceNumber || 'N/A', order.timestamp, order.invoiceNumber || order.id
        ]);
      }

      // 5. Audit Log
      const auditQuery = `
        INSERT INTO AuditLog(id, shopId, employeeId, action, targetId, details, timestamp, syncStatus)
        VALUES (?, ?, 'SYSTEM', 'PURCHASE_CREATED', ?, ?, ?, 0)
      `;
      await tx.executeSql(auditQuery, [
        generateUUID(), order.shopId, order.id, `Invoice: ${order.invoiceNumber}, Total: ${order.totalCost}`, order.timestamp
      ]);
    });
  }

  async getPurchasesByShop(shopId: string): Promise<PurchaseOrder[]> {
    const query = 'SELECT * FROM PurchaseOrder WHERE shopId = ? ORDER BY timestamp DESC';
    const results = await this.db.executeSql(query, [shopId]);
    const purchases: PurchaseOrder[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      purchases.push(results[0].rows.item(i));
    }
    return purchases;
  }

  async getPurchaseItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const query = 'SELECT * FROM PurchaseOrderItem WHERE purchaseOrderId = ?';
    const results = await this.db.executeSql(query, [purchaseOrderId]);
    const items: PurchaseOrderItem[] = [];
    for (let i = 0; i < results[0].rows.length; i++) {
      items.push(results[0].rows.item(i));
    }
    return items;
  }

  async recordReturn(purchaseReturn: PurchaseReturn, isBulk: boolean) {
    await this.db.transaction(async (tx: any) => {
      // 1. Insert Purchase Return record
      const returnQuery = `
        INSERT INTO PurchaseReturn(id, purchaseOrderId, shopId, supplierId, productId, quantity, returnValue, reason, timestamp, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      await tx.executeSql(returnQuery, [
        purchaseReturn.id, purchaseReturn.purchaseOrderId, purchaseReturn.shopId, purchaseReturn.supplierId,
        purchaseReturn.productId, purchaseReturn.quantity, purchaseReturn.value, purchaseReturn.reason, purchaseReturn.timestamp
      ]);

      // 2. Reduce Inventory Stock
      const column = isBulk ? 'bulkStockQuantity' : 'stockQuantity';
      const updateStockQuery = `UPDATE Product SET ${column} = ${column} - ?, syncStatus = 0 WHERE id = ?`;
      await tx.executeSql(updateStockQuery, [purchaseReturn.quantity, purchaseReturn.productId]);

      // 3. Update Purchase Order (Reduce value and balance)
      const updateOrderQuery = `
        UPDATE PurchaseOrder
        SET totalCost = totalCost - ?, balance = balance - ?, syncStatus = 0
        WHERE id = ?
      `;
      await tx.executeSql(updateOrderQuery, [purchaseReturn.value, purchaseReturn.value, purchaseReturn.purchaseOrderId]);

      // 4. Update Supplier Balance (Reduce payable)
      const updateSupplierQuery = 'UPDATE Supplier SET currentBalance = currentBalance - ?, syncStatus = 0 WHERE id = ?';
      await tx.executeSql(updateSupplierQuery, [purchaseReturn.value, purchaseReturn.supplierId]);

      // 5. Audit Log
      const auditQuery = `
        INSERT INTO AuditLog(id, shopId, employeeId, action, targetId, details, timestamp, syncStatus)
        VALUES (?, ?, 'SYSTEM', 'PURCHASE_RETURNED', ?, ?, ?, 0)
      `;
      await tx.executeSql(auditQuery, [
        generateUUID(), purchaseReturn.shopId, purchaseReturn.id,
        `Return for PO: ${purchaseReturn.purchaseOrderId}, Qty: ${purchaseReturn.quantity}, Value: ${purchaseReturn.value}`,
        purchaseReturn.timestamp
      ]);
    });
  }
}
