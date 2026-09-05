// Web implementation of the database using localStorage to persist data across refreshes
export const getDBConnection = async () => {
  console.warn('SQLite not supported on web. Using localStorage-based mock database.');

  const getTableData = (table: string) => {
    const data = localStorage.getItem(`db_${table}`);
    return data ? JSON.parse(data) : [];
  };

  const saveTableData = (table: string, data: any[]) => {
    localStorage.setItem(`db_${table}`, JSON.stringify(data));
  };

  return {
    executeSql: async (query: string, params: any[] = []) => {
      console.log('Web SQL execute:', query, params);
      const lowerQuery = query.toLowerCase();

      // Handle SELECT
      if (lowerQuery.startsWith('select')) {
        const tableNameMatch = query.match(/FROM\s+(\w+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          let data = getTableData(tableName);

          // Filtering
          if (lowerQuery.includes('where shopid = ?') && params.length > 0) {
            data = data.filter((item: any) => item.shopId === params[0]);
          }
          if (lowerQuery.includes('where syncstatus = 0')) {
            data = data.filter((item: any) => item.syncStatus === 0);
          }
          if (lowerQuery.includes('where customerid = ?') && params.length > 0) {
            data = data.filter((item: any) => item.customerId === params[0]);
          }
          if (lowerQuery.includes('where id = ?') && params.length > 0) {
            const idParam = params[0];
            data = data.filter((item: any) => item.id === idParam);
          }
          if (lowerQuery.includes('where supplierid = ?') && params.length > 0) {
             data = data.filter((item: any) => item.supplierId === params[0]);
          }
          if (lowerQuery.includes('where purchaseorderid = ?') && params.length > 0) {
             data = data.filter((item: any) => item.purchaseOrderId === params[0]);
          }

          return [{
            rows: {
              length: data.length,
              item: (index: number) => data[index],
            }
          }];
        }
      }

      // Handle INSERT or REPLACE
      if (lowerQuery.startsWith('insert') || lowerQuery.startsWith('replace')) {
        const tableNameMatch = query.match(/(?:INTO|REPLACE INTO)\s+(\w+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          let data = getTableData(tableName);

          // We use a simple object for the record.
          // Since we don't have the full schema mapping here, we assume params[0] is always 'id'
          const id = params[0];
          const record: any = { id, syncStatus: 0 };

          // Rough mapping based on table name for critical fields
          if (tableName === 'Product') {
              record.shopId = params[1]; record.name = params[3]; record.price = params[10]; record.costPrice = params[11];
              record.stockQuantity = params[12]; record.bulkStockQuantity = params[9]; record.status = params[16];
          } else if (tableName === 'Customer' || tableName === 'Supplier') {
              record.shopId = params[1]; record.name = params[2]; record.currentBalance = params[5] || 0;
          }

          const index = data.findIndex((i: any) => i.id === id);
          if (index >= 0) data[index] = { ...data[index], ...record };
          else data.push(record);

          saveTableData(tableName, data);
        }
      }

      // Handle UPDATE
      if (lowerQuery.startsWith('update')) {
          const tableNameMatch = query.match(/UPDATE\s+(\w+)/i);
          if (tableNameMatch) {
              const tableName = tableNameMatch[1];
              let data = getTableData(tableName);
              const id = params[params.length - 1]; // Usually ID is last in WHERE
              const item = data.find((i: any) => i.id === id);

              if (item) {
                  if (lowerQuery.includes('set syncstatus = 1')) item.syncStatus = 1;
                  if (lowerQuery.includes('currentbalance = currentbalance + ?')) item.currentBalance += params[0];
                  if (lowerQuery.includes('currentbalance = currentbalance - ?')) item.currentBalance -= params[0];
                  if (lowerQuery.includes('stockquantity = stockquantity + ?')) item.stockQuantity += params[0];
                  if (lowerQuery.includes('stockquantity = stockquantity - ?')) item.stockQuantity -= params[0];
                  if (lowerQuery.includes('bulkstockquantity = bulkstockquantity + ?')) item.bulkStockQuantity += params[0];
                  if (lowerQuery.includes('bulkstockquantity = bulkstockquantity - ?')) item.bulkStockQuantity -= params[0];
              }
              saveTableData(tableName, data);
          }
      }

      return [{ rows: { length: 0, item: () => null } }];
    },
    transaction: (cb: any) => cb({
      executeSql: async (q: string, p: any) => {
        const db = await getDBConnection();
        return db.executeSql(q, p);
      }
    }),
  } as any;
};

export const createTables = async (db: any) => {
  console.log('Web/Electron Tables Mock Ready');
};
