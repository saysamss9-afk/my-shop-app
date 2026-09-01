import { openDatabase, enablePromise, SQLiteDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

const databaseName = 'AppDatabase.db';

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
  return openDatabase({ name: databaseName, location: 'default' });
};

export const createTables = async (db: SQLiteDatabase) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS Shop (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        companyName TEXT,
        address TEXT,
        ownerId TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS Category (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        name TEXT NOT NULL,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Product (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        categoryId TEXT,
        name TEXT NOT NULL,
        description TEXT,
        barcode TEXT,
        bulkBarcode TEXT,
        bulkQuantity REAL NOT NULL DEFAULT 1.0,
        bulkPrice REAL NOT NULL DEFAULT 0.0,
        bulkStockQuantity REAL NOT NULL DEFAULT 0.0,
        price REAL NOT NULL,
        costPrice REAL NOT NULL DEFAULT 0.0,
        stockQuantity REAL NOT NULL,
        minStockLevel REAL NOT NULL DEFAULT 0.0,
        unit TEXT NOT NULL,
        supplierId TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id),
        FOREIGN KEY (categoryId) REFERENCES Category(id),
        FOREIGN KEY (supplierId) REFERENCES Supplier(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Supplier (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        name TEXT NOT NULL,
        contactInfo TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Employee (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Customer (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        currentBalance REAL NOT NULL DEFAULT 0.0,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Sale (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        employeeId TEXT NOT NULL,
        customerId TEXT,
        timestamp INTEGER NOT NULL,
        totalAmount REAL NOT NULL,
        paymentMethod TEXT NOT NULL DEFAULT 'CASH',
        paymentStatus TEXT NOT NULL DEFAULT 'PAID',
        dueDate INTEGER,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        isReverted INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id),
        FOREIGN KEY (employeeId) REFERENCES Employee(id),
        FOREIGN KEY (customerId) REFERENCES Customer(id)
    );`,
    `CREATE TABLE IF NOT EXISTS DebtPayment (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        shopId TEXT NOT NULL,
        amount REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        note TEXT,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (customerId) REFERENCES Customer(id),
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS InventoryAdjustment (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        shopId TEXT NOT NULL,
        quantity REAL NOT NULL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (productId) REFERENCES Product(id),
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
    `CREATE TABLE IF NOT EXISTS PurchaseOrder (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        supplierId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        totalCost REAL NOT NULL,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id),
        FOREIGN KEY (supplierId) REFERENCES Supplier(id)
    );`,
    `CREATE TABLE IF NOT EXISTS SaleItem (
        id TEXT PRIMARY KEY,
        saleId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity REAL NOT NULL,
        priceAtSale REAL NOT NULL,
        isBulk INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (saleId) REFERENCES Sale(id),
        FOREIGN KEY (productId) REFERENCES Product(id)
    );`,
    `CREATE TABLE IF NOT EXISTS AuditLog (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        employeeId TEXT NOT NULL,
        action TEXT NOT NULL,
        targetId TEXT,
        details TEXT,
        timestamp INTEGER NOT NULL,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id),
        FOREIGN KEY (employeeId) REFERENCES Employee(id)
    );`,
    `CREATE TABLE IF NOT EXISTS Expense (
        id TEXT PRIMARY KEY,
        shopId TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        timestamp INTEGER NOT NULL,
        syncStatus INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shopId) REFERENCES Shop(id)
    );`,
  ];

  for (const query of queries) {
    await db.executeSql(query);
  }
};
