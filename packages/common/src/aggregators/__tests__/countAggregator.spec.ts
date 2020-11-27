import { CountAggregator } from '../countAggregator';

describe('CountAggregator', () => {
  let aggregator: CountAggregator;
  let dataset = [];

  beforeEach(() => {
    dataset = [
      { id: 0, title: 'Product 0', price: 58.5, productGroup: 'Sub-Cat1' },
      { id: 1, title: 'Product 1', price: 14, productGroup: 'Sub-Cat1' },
      { id: 2, title: 'Product 2', price: 2, productGroup: 'Sub-Cat2' },
      { id: 3, title: 'Product 3', price: 87, productGroup: 'Sub-Cat1' },
      { id: 4, title: 'Product 4', price: null, productGroup: 'Sub-Cat2' },
    ] as any;
  });

  it('should return a length of 1 when the dataset found 1 item', () => {
    // arrange
    const fieldName = 'title';
    const groupTotals = {
      group: {
        rows: dataset.filter((item) => item['title'] === 'Product 1')
      }
    };
    aggregator = new CountAggregator(fieldName);
    aggregator.init();

    // act
    aggregator.storeResult(groupTotals);

    // assert
    expect(groupTotals['count'][fieldName]).toBe(1);
  });

  it('should return a count of the full dataset length when the group has all the same data', () => {
    const fieldName = 'productGroup';
    const groupTotals = {
      count: {},
      group: {
        rows: dataset
      }
    };
    aggregator = new CountAggregator(fieldName);
    aggregator.init();

    aggregator.storeResult(groupTotals);

    expect(aggregator.field).toBe(fieldName);
    expect(aggregator.type).toBe('count');
    expect(groupTotals.count[fieldName]).toBe(5);
  });
});
