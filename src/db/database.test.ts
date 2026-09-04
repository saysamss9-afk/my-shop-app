jest.mock('react-native-sqlite-storage', () => {
  const executeSql = jest.fn().mockResolvedValue([{}]);
  return {
    enablePromise: jest.fn(),
    openDatabase: jest.fn(() => ({ executeSql })),
  };
});

describe('database bootstrap', () => {
  it('creates the local schema before returning the database connection', async () => {
    const sqlite = require('react-native-sqlite-storage');
    const { getDBConnection } = require('./database');

    const db = await getDBConnection();

    expect(sqlite.openDatabase).toHaveBeenCalledTimes(1);
    expect(db.executeSql).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS Product'),
      undefined
    );
  });
});
