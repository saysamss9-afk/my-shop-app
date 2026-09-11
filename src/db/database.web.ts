import alasql from 'alasql';

let dbInstance: any = null;

// Initialize AlaSQL with localStorage persistence for Web/Electron
const initDB = async () => {
    try {
        alasql('CREATE localStorage DATABASE IF NOT EXISTS AppDB');
        alasql('ATTACH localStorage DATABASE AppDB');
        alasql('USE AppDB');

        // DO NOT set autocommit true here, it can cause race conditions during migrations
        alasql.options.autocommit = false;
        alasql.options.casesensitive = false;
        alasql.options.performance = false; // Disable performance tracing to prevent 'startTime' errors

        console.log('AlaSQL initialized with localStorage persistence');
    } catch (e) {
        console.error('AlaSQL init error:', e);
    }
};

const dbInitPromise = initDB();

export const getDBConnection = async () => {
  if (dbInstance) return dbInstance;

  await dbInitPromise;

  const normalizeUpsertQuery = (query: string, params: any[] = []) => {
    const match = query.match(/^\s*INSERT\s+OR\s+REPLACE\s+INTO\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*VALUES\s*\((.*)\)\s*;?\s*$/is);
    if (!match) return query;

    const [, tableName, columnsText] = match;
    const columns = columnsText.split(',').map((column) => column.trim()).filter(Boolean);
    const idIndex = columns.findIndex((column) => column.toLowerCase() === 'id');

    if (idIndex >= 0 && params[idIndex] !== undefined) {
      try {
        alasql(`DELETE FROM ${tableName} WHERE id = ?`, [params[idIndex]]);
      } catch (error) {
        // Ignore delete failures here and fall back to the plain INSERT attempt.
      }
    }

    return query.replace(/INSERT\s+OR\s+REPLACE/gi, 'INSERT');
  };

  const ALL_CANONICAL_KEYS = [
    'id', 'shopId', 'categoryId', 'name', 'description', 'barcode', 'bulkBarcode',
    'bulkQuantity', 'bulkPrice', 'bulkStockQuantity', 'bulkUnit', 'price', 'costPrice',
    'stockQuantity', 'minStockLevel', 'unit', 'supplierId', 'status', 'syncStatus',
    'contactPerson', 'email', 'phone', 'address', 'contactInfo', 'currentBalance',
    'employeeId', 'customerId', 'timestamp', 'totalAmount', 'paymentMethod', 'paymentStatus',
    'dueDate', 'isReverted', 'amount', 'reference', 'note', 'productId', 'quantity',
    'reason', 'invoiceNumber', 'totalCost', 'amountPaid', 'balance', 'purchaseOrderId',
    'productName', 'priceAtSale', 'isBulk', 'action', 'targetId', 'details', 'category',
    'returnValue', 'lastSynced', 'ownerId', 'companyName', 'country', 'currency',
    'type', 'employeeCount', 'region', 'location', 'returnValue', 'value',
    'productCount', 'totalSuppliers', 'owedSuppliers', 'totalPayable', 'paidThisMonth', 'purchasesThisMonth',
    'totalRevenue', 'totalProfit', 'saleCount', 'totalQuantity', 'availableStock'
  ];

  const KEY_MAP = new Map<string, string>();
  ALL_CANONICAL_KEYS.forEach(key => KEY_MAP.set(key.toLowerCase(), key));

  const normalizeRow = (row: any) => {
    if (!row || typeof row !== 'object') return row;
    const normalized: any = {};
    const rowKeys = Object.keys(row);

    for (const key of rowKeys) {
      const canonical = KEY_MAP.get(key.toLowerCase());
      if (canonical) {
        normalized[canonical] = row[key];
      } else {
        normalized[key] = row[key];
      }
    }
    return normalized;
  };

  const execute = (query: string, params: any[] = []) => {
    return new Promise((resolve, reject) => {
      try {
        // 1. AlaSQL Fixes:
        // - Normalize SQLite upsert syntax for web/AlaSQL compatibility
        // - Replace "COUNT(*)" with "COUNT(1)"
        // - Wrap "count" and "total" in brackets ONLY when they are standalone aliases
        let sql = normalizeUpsertQuery(query, params)
            .replace(/COUNT\(\*\)/gi, 'COUNT(1)')
            .replace(/\bas\s+count\b/gi, 'as [count]')
            .replace(/\bas\s+total\b/gi, 'as [total]');

        const result = alasql(sql, params);
        const rawRows = Array.isArray(result) ? result : [];
        const rows = rawRows.map(normalizeRow);

        const formattedResult = [{
          rows: {
            length: rows.length,
            item: (index: number) => rows[index],
            _array: rows
          }
        }];
        resolve(formattedResult);
      } catch (err: any) {
        console.error('AlaSQL Execute Error:', err.message, 'Query:', query, 'Params:', params);
        reject(err);
      }
    });
  };

  dbInstance = {
    executeSql: async (query: string, params: any[] = []) => {
        return execute(query, params);
    },
    transaction: (cb: (tx: any) => void) => {
      const tx = {
        executeSql: async (q: string, p: any[] = []) => {
            return execute(q, p);
        }
      };
      return new Promise((resolve, reject) => {
          try {
              const res = cb(tx);
              resolve(res);
          } catch (e) {
              reject(e);
          }
      });
    },
  };

  await createTables(dbInstance);

  // Re-enable autocommit after migrations are done for performance/convenience
  alasql.options.autocommit = true;

  return dbInstance;
};

export const createTables = async (db: any) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS Shop (
        id STRING PRIMARY KEY,
        name STRING,
        companyName STRING,
        address STRING,
        ownerId STRING,
        country STRING,
        currency STRING,
        lastSynced INT
    );`,
    `CREATE TABLE IF NOT EXISTS Category (
        id STRING PRIMARY KEY,
        shopId STRING,
        name STRING,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS SupplierPayment (
        id STRING PRIMARY KEY,
        supplierId STRING,
        shopId STRING,
        amount REAL,
        paymentMethod STRING,
        reference STRING,
        timestamp INT,
        note STRING,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS Employee (
        id STRING PRIMARY KEY,
        shopId STRING,
        name STRING,
        role STRING,
        email STRING
    );`,
    `CREATE TABLE IF NOT EXISTS Customer (
        id STRING PRIMARY KEY,
        shopId STRING,
        name STRING,
        phone STRING,
        email STRING,
        currentBalance REAL,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS Sale (
        id STRING PRIMARY KEY,
        shopId STRING,
        employeeId STRING,
        customerId STRING,
        timestamp INT,
        totalAmount REAL,
        paymentMethod STRING,
        paymentStatus STRING,
        dueDate INT,
        syncStatus INT,
        isReverted INT
    );`,
    `CREATE TABLE IF NOT EXISTS DebtPayment (
        id STRING PRIMARY KEY,
        customerId STRING,
        shopId STRING,
        amount REAL,
        paymentMethod STRING,
        timestamp INT,
        note STRING,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS InventoryAdjustment (
        id STRING PRIMARY KEY,
        productId STRING,
        shopId STRING,
        quantity REAL,
        reason STRING,
        timestamp INT,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS PurchaseOrder (
        id STRING PRIMARY KEY,
        shopId STRING,
        supplierId STRING,
        invoiceNumber STRING,
        timestamp INT,
        totalCost REAL,
        amountPaid REAL,
        balance REAL,
        paymentStatus STRING,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS PurchaseOrderItem (
        id STRING PRIMARY KEY,
        purchaseOrderId STRING,
        productId STRING,
        productName STRING,
        quantity REAL,
        costPrice REAL,
        isBulk INT
    );`,
    `CREATE TABLE IF NOT EXISTS SaleItem (
        id STRING PRIMARY KEY,
        saleId STRING,
        productId STRING,
        quantity REAL,
        priceAtSale REAL,
        isBulk INT
    );`,
    `CREATE TABLE IF NOT EXISTS AuditLog (
        id STRING PRIMARY KEY,
        shopId STRING,
        employeeId STRING,
        action STRING,
        targetId STRING,
        details STRING,
        timestamp INT,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS Expense (
        id STRING PRIMARY KEY,
        shopId STRING,
        category STRING,
        amount REAL,
        description STRING,
        timestamp INT,
        syncStatus INT
    );`,
    `CREATE TABLE IF NOT EXISTS PurchaseReturn (
        id STRING PRIMARY KEY,
        purchaseOrderId STRING,
        shopId STRING,
        supplierId STRING,
        productId STRING,
        quantity REAL,
        returnValue REAL,
        reason STRING,
        timestamp INT,
        syncStatus INT
    );`,
  ];

  for (const query of queries) {
    try {
        await db.executeSql(query);
    } catch (e) {
        // Silently skip
    }
  }

  // REBUILD MIGRATION:
  // If the Product or Supplier tables are in the wrong physical order,
  // data will be zeroed out during INSERT/UPDATE because positional parameters (?)
  // will hit the wrong slots.
  const rebuildTableIfMisaligned = async (table: string, canonicalColumns: string[], createQuery: string) => {
    try {
        const dbName = alasql.useid || 'AppDB';
        const database = alasql.databases[dbName];
        if (!database) {
            console.warn(`[SCHEMA] Database ${dbName} not found.`);
            return;
        }

        const tableObj = database.tables?.[table];
        if (!tableObj || !tableObj.columns) {
            console.log(`[SCHEMA] Table ${table} metadata not found. Initializing...`);
            await db.executeSql(createQuery);
            return;
        }

        const currentColumns = tableObj.columns.map((c: any) => c.columnid.toLowerCase());
        const canonicalLower = canonicalColumns.map(c => c.toLowerCase());

        const isMisaligned = currentColumns.length !== canonicalLower.length ||
                           currentColumns.some((col, idx) => col !== canonicalLower[idx]);

        if (isMisaligned) {
            console.log(`[SCHEMA] Table ${table} is misaligned. Rebuilding...`);

            const data = alasql(`SELECT * FROM ${table}`);

            try {
                // Use the database wrapper for the drop to ensure consistency
                await db.executeSql(`DROP TABLE ${table}`);

                // Extra cleanup of AlaSQL's internal state
                const dbName = alasql.useid || 'AppDB';
                if (alasql.databases[dbName]?.tables?.[table]) {
                    delete alasql.databases[dbName].tables[table];
                }
            } catch (err) {
                console.warn(`[SCHEMA] Drop failed for ${table}, attempting rename purge:`, err);
                try {
                    const trash = table + '_old_' + Date.now();
                    alasql(`ALTER TABLE ${table} RENAME TO ${trash}`);
                } catch (e) {}
            }

            await db.executeSql(createQuery);

            if (data && data.length > 0) {
                console.log(`[SCHEMA] Migrating ${data.length} rows for ${table}`);
                for (const row of data) {
                    const values = canonicalColumns.map(col => {
                        const actualKey = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
                        let val = actualKey ? row[actualKey] : null;
                        if (val !== null && val !== undefined) return val;

                        if (col === 'bulkUnit') return 'Carton';
                        if (col === 'minStockLevel') return 5;
                        if (col === 'syncStatus') return 0;
                        if (col === 'status') return 'ACTIVE';
                        if (col === 'bulkQuantity') return 1;
                        if (col === 'bulkPrice') return 0;
                        if (col === 'bulkStockQuantity') return 0;
                        if (col === 'costPrice') return 0;
                        if (col === 'unit') return 'pcs';
                        return null;
                    });
                    const placeholders = canonicalColumns.map(() => '?').join(', ');
                    await db.executeSql(`INSERT INTO ${table} (${canonicalColumns.join(', ')}) VALUES (${placeholders})`, values);
                }
            }
            console.log(`[SCHEMA] Rebuild of ${table} complete.`);
        } else {
            console.log(`[SCHEMA] Table ${table} schema is healthy.`);
        }
    } catch (e: any) {
        console.error(`[SCHEMA] Rebuild failed for ${table}:`, e.message);
    }
  };

  const PRODUCT_COLUMNS = [
    'id', 'shopId', 'categoryId', 'name', 'description', 'barcode', 'bulkBarcode',
    'bulkQuantity', 'bulkPrice', 'bulkStockQuantity', 'bulkUnit', 'price', 'costPrice',
    'stockQuantity', 'minStockLevel', 'unit', 'supplierId', 'status', 'syncStatus'
  ];
  const PRODUCT_CREATE = `CREATE TABLE IF NOT EXISTS Product (
    id STRING PRIMARY KEY, shopId STRING, categoryId STRING, name STRING, description STRING,
    barcode STRING, bulkBarcode STRING, bulkQuantity REAL, bulkPrice REAL, bulkStockQuantity REAL,
    bulkUnit STRING, price REAL, costPrice REAL, stockQuantity REAL, minStockLevel REAL,
    unit STRING, supplierId STRING, status STRING, syncStatus INT
  )`;

  const SUPPLIER_COLUMNS = [
    'id', 'shopId', 'name', 'contactPerson', 'email', 'phone', 'address', 'contactInfo', 'currentBalance', 'syncStatus'
  ];
  const SUPPLIER_CREATE = `CREATE TABLE IF NOT EXISTS Supplier (
    id STRING PRIMARY KEY, shopId STRING, name STRING, contactPerson STRING, email STRING,
    phone STRING, address STRING, contactInfo STRING, currentBalance REAL, syncStatus INT
  )`;

  await rebuildTableIfMisaligned('Product', PRODUCT_COLUMNS, PRODUCT_CREATE);
  await rebuildTableIfMisaligned('Supplier', SUPPLIER_COLUMNS, SUPPLIER_CREATE);
};
