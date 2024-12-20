import { beforeEach, describe, expect, it } from 'vitest';

import { CountAggregator } from '../countAggregator.js';

describe('CountAggregator', () => {
  let aggregator: CountAggregator;
  let dataset: any[] = [];

  describe('Regular Group Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Product 0', price: 58.5, productGroup: 'Sub-Cat1' },
        { id: 1, title: 'Product 1', price: 14, productGroup: 'Sub-Cat1' },
        { id: 2, title: 'Product 2', price: 2, productGroup: 'Sub-Cat2' },
        { id: 3, title: 'Product 3', price: 87, productGroup: 'Sub-Cat1' },
        { id: 4, title: 'Product 4', price: null, productGroup: 'Sub-Cat2' },
      ];
    });

    it('should return a length of 1 when the dataset found 1 item', () => {
      // arrange
      const fieldName = 'title';
      const groupTotals = {
        group: {
          rows: dataset.filter((item) => item['title'] === 'Product 1'),
        },
      };
      aggregator = new CountAggregator(fieldName);
      aggregator.init();

      // act
      aggregator.storeResult(groupTotals);

      // assert
      expect(aggregator.isInitialized).toBeTruthy();
      expect(groupTotals['count'][fieldName]).toBe(1);
    });

    it('should return a count of the full dataset length when the group has all the same data', () => {
      const fieldName = 'productGroup';
      const groupTotals = {
        count: {},
        group: {
          rows: dataset,
        },
      };
      aggregator = new CountAggregator(fieldName);
      aggregator.init();

      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('count');
      expect(groupTotals.count[fieldName]).toBe(5);
    });
  });

  describe('Tree Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Task 0', duration: '58', percentComplete: 55, __treeLevel: 0 },
        { id: 1, title: 'Task 1', duration: '14', percentComplete: 87, __treeLevel: 1 },
        { id: 2, title: 'Task 2', duration: '', percentComplete: 60, __treeLevel: 2 },
        { id: 3, title: 'Task 3', duration: '897', percentComplete: -2, __treeLevel: 0 },
        { id: 4, title: 'Task 4', duration: null, percentComplete: 15, __treeLevel: 0 },
      ];
    });

    it('should return the tree data count value when accumulating an child item', () => {
      const fieldName = 'percentComplete';
      aggregator = new CountAggregator(fieldName);
      aggregator.init({}, true);

      // accumulate child to current groupTotals
      const groupTotals = { count: { percentComplete: 4 } };
      aggregator.accumulate(dataset[4]);
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('count');
      expect(groupTotals.count[fieldName]).toBe(5);
    });

    it('should return the current count on the parent item that was accumulated so far', () => {
      const fieldName = 'percentComplete';
      aggregator = new CountAggregator(fieldName);
      aggregator.init({}, true);

      // will not accumulate since it's a parent item
      const groupTotals = { count: { percentComplete: 4 } };
      aggregator.accumulate(dataset[4], true);
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('count');
      expect(groupTotals.count[fieldName]).toBe(4);
    });
  });
});
