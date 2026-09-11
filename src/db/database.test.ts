import React from 'react';
import renderer from 'react-test-renderer';

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
    expect(db.executeSql.mock.calls.some(([sql]) => sql.includes('CREATE TABLE IF NOT EXISTS Product'))).toBe(true);
  });

  it('uses a non-reserved name for the purchase return amount column', async () => {
    const sqlite = require('react-native-sqlite-storage');
    const { getDBConnection } = require('./database');

    await getDBConnection();

    const createTableCall = sqlite.openDatabase.mock.results[0].value.executeSql.mock.calls
      .find(([sql]) => sql.includes('CREATE TABLE IF NOT EXISTS PurchaseReturn'));

    expect(createTableCall).toBeDefined();
    expect(createTableCall[0]).toContain('returnValue REAL');
    expect(createTableCall[0]).not.toContain('value REAL');
  });

  it('renders supplier rows even when currentBalance is missing', () => {
    const SupplierListItem = require('../screens/inventory/components/SupplierListItem').default;

    expect(() => {
      renderer.create(
        <SupplierListItem
          item={{
            id: 's1',
            shopId: 'shop1',
            name: 'Acme',
            contactInfo: '555',
            currentBalance: undefined,
            syncStatus: 0,
            productCount: undefined,
          }}
          currency="₵"
        />
      );
    }).not.toThrow();
  });

  it('renders customer rows even when currentBalance is missing', () => {
    const CustomerListItem = require('../screens/sales/components/CustomerListItem').default;

    expect(() => {
      renderer.create(
        <CustomerListItem
          item={{
            id: 'c1',
            shopId: 'shop1',
            name: 'Jane Doe',
            phone: '0551234567',
            email: null,
            currentBalance: undefined,
            syncStatus: 0,
          }}
          currency="₵"
          onPay={jest.fn()}
          onReturn={jest.fn()}
        />
      );
    }).not.toThrow();
  });

  it('exposes updateProduct from the inventory hook', () => {
    const { useInventory } = require('../hooks/useInventory');
    let hookResult: any;

    const TestComponent = () => {
      hookResult = useInventory('shop-1');
      return null;
    };

    renderer.create(<TestComponent />);

    expect(hookResult.updateProduct).toEqual(expect.any(Function));
  });
});
