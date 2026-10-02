import { parseTimestamp, groupSalesByDate } from './dateUtils';

describe('dateUtils', () => {
  it('normalizes Firestore-style timestamps', () => {
    expect(parseTimestamp({ seconds: 1700000000, nanoseconds: 0 }, 0)).toBe(1700000000000);
    expect(parseTimestamp('1700000000', 0)).toBe(1700000000000);
    expect(parseTimestamp(null, 0)).toBe(0);
  });

  it('ignores invalid sale timestamps while grouping valid sales by day', () => {
    const sales = [
      { id: 'a', timestamp: { seconds: 1700000000, nanoseconds: 0 }, totalAmount: 25 },
      { id: 'b', timestamp: 'not-a-date', totalAmount: 10 },
      { id: 'c', timestamp: 1700000000000, totalAmount: 40 },
    ];

    const grouped = groupSalesByDate(sales);

    expect(grouped.length).toBe(1);
    expect(grouped[0].data.length).toBe(2);
    expect(grouped[0].data.map((sale: any) => sale.id)).toEqual(expect.arrayContaining(['a', 'c']));
  });
});
