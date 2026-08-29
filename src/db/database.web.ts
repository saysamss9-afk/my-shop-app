// Web implementation of the database using a simple mock or localStorage
export const getDBConnection = async () => {
  console.warn('SQLite not supported on web. Using mock database.');
  return {
    executeSql: async (query: string) => {
      console.log('Mock execute:', query);
      return [{
        rows: {
          length: 0,
          item: (index: number) => null,
        }
      }];
    },
    transaction: (cb: any) => cb({
      executeSql: async (q: string, p: any) => {
        console.log('Mock trans execute:', q);
        return [{ rows: { length: 0, item: () => null } }];
      }
    }),
  } as any;
};

export const createTables = async (db: any) => {
  console.log('Mock creating tables...');
};
