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

          // Simple WHERE shopId = ? filtering
          if (lowerQuery.includes('where shopid = ?') && params.length > 0) {
            data = data.filter((item: any) => item.shopId === params[0]);
          }
          // Simple WHERE syncStatus = 0 filtering
          if (lowerQuery.includes('where syncstatus = 0')) {
            data = data.filter((item: any) => item.syncStatus === 0);
          }
          // Simple WHERE customerId = ? filtering
          if (lowerQuery.includes('where customerid = ?') && params.length > 0) {
            data = data.filter((item: any) => item.customerId === params[0]);
          }
          // Simple WHERE id = ? filtering
          if (lowerQuery.includes('where id = ?') && params.length > 0) {
            data = data.filter((item: any) => item.id === params[0]);
          }

          return [{
            rows: {
              length: data.length,
              item: (index: number) => data[index],
            }
          }];
        }
      }

      // Handle INSERT
      if (lowerQuery.startsWith('insert')) {
        const tableNameMatch = query.match(/INTO\s+(\w+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          let data = getTableData(tableName);

          // This is a very rough mock, assumes the order of params matches the query
          // In practice, repositories specify params explicitly.
          // For now, let's just use the product/sale structure if we can infer it.
          // Better: Since we don't know the schema here, we'll need a more robust way.
          // But for a quick fix to avoid data loss on refresh:
          if (tableName === 'Product') {
            const product = {
                id: params[0], shopId: params[1], categoryId: params[2], name: params[3],
                description: params[4], barcode: params[5], bulkBarcode: params[6],
                bulkQuantity: params[7], bulkPrice: params[8], bulkStockQuantity: params[9],
                price: params[10], costPrice: params[11], stockQuantity: params[12],
                minStockLevel: params[13], unit: params[14], supplierId: params[15],
                syncStatus: 0
            };
            const index = data.findIndex((p: any) => p.id === product.id);
            if (index >= 0) data[index] = product;
            else data.push(product);
          } else if (tableName === 'Sale') {
            const sale = {
                id: params[0], shopId: params[1], employeeId: params[2], customerId: params[3],
                timestamp: params[4], totalAmount: params[5], paymentMethod: params[6],
                paymentStatus: params[7], dueDate: params[8], syncStatus: 0, isReverted: 0
            };
            const index = data.findIndex((s: any) => s.id === sale.id);
            if (index >= 0) data[index] = sale;
            else data.push(sale);
          } else if (tableName === 'DebtPayment') {
            const payment = {
                id: params[0], customerId: params[1], shopId: params[2], amount: params[3],
                paymentMethod: params[4], timestamp: params[5], note: params[6],
                syncStatus: 0
            };
            data.push(payment);
          } else {
            // Generic push for other tables if params match ID first
            data.push({ id: params[0], ...params });
          }

          saveTableData(tableName, data);
        }
      }

      // Handle UPDATE syncStatus
      if (lowerQuery.includes('update') && lowerQuery.includes('set syncstatus = 1')) {
         const tableNameMatch = query.match(/UPDATE\s+(\w+)/i);
         if (tableNameMatch && params.length > 0) {
             const tableName = tableNameMatch[1];
             let data = getTableData(tableName);
             const item = data.find((i: any) => i.id === params[0]);
             if (item) item.syncStatus = 1;
             saveTableData(tableName, data);
         }
      }

      // Handle UPDATE balance
      if (lowerQuery.includes('update customer') && lowerQuery.includes('currentbalance = currentbalance')) {
          let data = getTableData('Customer');
          const item = data.find((i: any) => i.id === params[params.length - 1]);
          if (item) {
              const amount = params[0];
              if (lowerQuery.includes('currentbalance + ?')) item.currentBalance += amount;
              else if (lowerQuery.includes('currentbalance - ?')) item.currentBalance -= amount;
              item.syncStatus = 0;
          }
          saveTableData('Customer', data);
      }

      return [{ rows: { length: 0, item: () => null } }];
    },
    transaction: (cb: any) => cb({
      executeSql: async (q: string, p: any) => {
        // Just delegate to main executeSql
        const db = await getDBConnection();
        return db.executeSql(q, p);
      }
    }),
  } as any;
};

export const createTables = async (db: any) => {
  console.log('Tables ready in localStorage mock');
};
