import { CloneAggregator } from '../cloneAggregator';

describe('CloneAggregator', () => {
  let aggregator: CloneAggregator;
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

  it('should return empty string when the field provided does not exist', () => {
    // arrange
    const fieldName = 'invalid';
    const groupTotals = {};
    aggregator = new CloneAggregator(fieldName);
    aggregator.init();

    // act
    dataset.forEach((row) => aggregator.accumulate(row));
    aggregator.storeResult(groupTotals);

    // assert
    expect(groupTotals['clone'][fieldName]).toBe('');
  });

  it('should return last text analyzed by the aggregator when the chosen field is the product group', () => {
    const fieldName = 'productGroup';
    const lastGroupName = 'Sub-Cat2';
    const groupTotals = { clone: {} };
    aggregator = new CloneAggregator(fieldName);
    aggregator.init();

    dataset.forEach((row) => aggregator.accumulate(row));
    aggregator.storeResult(groupTotals);

    expect(aggregator.field).toBe(fieldName);
    expect(aggregator.type).toBe('clone');
    expect(groupTotals.clone[fieldName]).toBe(lastGroupName);
  });
});
