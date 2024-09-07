import { beforeEach, describe, expect, it } from 'vitest';

import { MinAggregator } from '../minAggregator';

describe('minAggregator', () => {
  let aggregator: MinAggregator;
  let dataset: any[] = [];

  describe('Regular Group Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Task 0', duration: '58', percentComplete: 55 },
        { id: 1, title: 'Task 1', duration: '14', percentComplete: 87 },
        { id: 2, title: 'Task 2', duration: '', percentComplete: 60 },
        { id: 3, title: 'Task 3', duration: '91', percentComplete: -2 },
        { id: 4, title: 'Task 4', duration: null, percentComplete: 15 },
      ];
    });

    it('should return null when the field provided does not exist', () => {
      // arrange
      const fieldName = 'invalid';
      const groupTotals = {};
      aggregator = new MinAggregator(fieldName);
      aggregator.init();

      // act
      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      // assert
      expect(groupTotals['min'][fieldName]).toBe(null);
      expect(aggregator.isInitialized).toBeTruthy();
    });

    it('should return the minimum value when the chosen field from the dataset contains only numbers', () => {
      const fieldName = 'percentComplete';
      const groupTotals = { min: {} };
      aggregator = new MinAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('min');
      expect(groupTotals.min[fieldName]).toBe(-2);
    });

    it('should return the minimum valid number when dataset contains numbers provided as string and other and invalid char', () => {
      const fieldName = 'duration';
      const groupTotals = { min: {} };
      aggregator = new MinAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(groupTotals.min[fieldName]).toBe(14);
    });
  });

  describe('Tree Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Task 0', duration: '58', percentComplete: 55, __treeLevel: 0 },
        { id: 1, title: 'Task 1', duration: '14', percentComplete: 87, __treeLevel: 1 },
        { id: 2, title: 'Task 2', duration: '', percentComplete: 60, __treeLevel: 2 },
        { id: 3, title: 'Task 3', duration: '91', percentComplete: -2, __treeLevel: 0 },
        { id: 4, title: 'Task 4', duration: null, percentComplete: 15, __treeLevel: 0 },
      ];
    });

    it('should return the tree data maximum value when the chosen field from the dataset contains only numbers', () => {
      const fieldName = 'percentComplete';
      const groupTotals = { min: {} };
      aggregator = new MinAggregator(fieldName);
      aggregator.init({}, true);

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('min');
      expect(groupTotals.min[fieldName]).toBe(-2);
    });

    it('should return null when accumulating on a tree parent and no minimum appears yet in the datacontext parent item', () => {
      const fieldName = 'percentComplete';
      const groupTotals: any = {};
      aggregator = new MinAggregator(fieldName);
      aggregator.init({}, true);

      dataset.forEach((row) => aggregator.accumulate(row, true));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('min');
      expect(groupTotals.min[fieldName]).toBe(null);
    });

    it('should return 88 which is the minimum value found in the Tree on a datacontext parent item', () => {
      const fieldName = 'percentComplete';
      const groupTotals = { min: { percentComplete: 55 } };
      aggregator = new MinAggregator(fieldName);
      aggregator.init({ __treeTotals: { min: { percentComplete: 22 } } }, true);
      dataset[1].__treeTotals = { min: { percentComplete: 99 } };
      dataset[2].__treeTotals = { min: { percentComplete: 88 } };

      dataset.forEach((row) => aggregator.accumulate(row, true));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('min');
      expect(groupTotals.min[fieldName]).toBe(55);
    });
  });
});
