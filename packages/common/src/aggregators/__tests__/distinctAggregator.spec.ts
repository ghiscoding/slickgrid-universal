import { DistinctAggregator } from '../distinctAggregator';

describe('disctinctAggregator', () => {
  let aggregator: DistinctAggregator;
  let dataset = [];

  beforeEach(() => {
    dataset = [
      { id: 0, title: 'Task 0', duration: '58', percentComplete: 55 },
      { id: 1, title: 'Task 1', duration: '14', percentComplete: 87 },
      { id: 2, title: 'Task 2', duration: '', percentComplete: 60 },
      { id: 3, title: 'Task 3', duration: '58', percentComplete: 87 },
      { id: 4, title: 'Task 4', duration: null, percentComplete: 55 },
      { id: 4, title: 'Task 5', duration: 32, percentComplete: 52 },
      { id: 4, title: 'Task 6', duration: 58, percentComplete: 52 },
    ] as any;
  });

  it('should return empty array when the field provided does not exist', () => {
    // arrange
    const fieldName = 'invalid';
    const groupTotals = {};
    aggregator = new DistinctAggregator(fieldName);
    aggregator.init();

    // act
    dataset.forEach((row) => aggregator.accumulate(row));
    aggregator.storeResult(groupTotals);

    // assert
    expect(groupTotals['distinct'][fieldName]).toEqual([]);
  });

  it('should return the distinct number values when provided field property values are all numbers', () => {
    const fieldName = 'percentComplete';
    const groupTotals = { distinct: {} };
    aggregator = new DistinctAggregator(fieldName);
    aggregator.init();

    dataset.forEach((row) => aggregator.accumulate(row));
    aggregator.storeResult(groupTotals);

    expect(aggregator.field).toBe(fieldName);
    expect(aggregator.type).toBe('distinct');
    expect(groupTotals.distinct[fieldName]).toEqual([55, 87, 60, 52]);
  });

  it('should return the distinct mixed values when provided field property values are all mixed types', () => {
    const fieldName = 'duration';
    const groupTotals = { distinct: {} };
    aggregator = new DistinctAggregator(fieldName);
    aggregator.init();

    dataset.forEach((row) => aggregator.accumulate(row));
    aggregator.storeResult(groupTotals);

    expect(groupTotals.distinct[fieldName]).toEqual(['58', '14', '', null, 32, 58]);
  });
});
