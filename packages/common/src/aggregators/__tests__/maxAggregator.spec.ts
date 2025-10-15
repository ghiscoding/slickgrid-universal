import { beforeEach, describe, expect, it } from 'vitest';
import type { GroupTotals } from '../../interfaces/grouping.interface.js';
import { MaxAggregator } from '../maxAggregator.js';

describe('maxAggregator', () => {
  let aggregator: MaxAggregator;
  let dataset: any[] = [];

  describe('Regular Group Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Task 0', duration: '58', percentComplete: 55 },
        { id: 1, title: 'Task 1', duration: '14', percentComplete: 87 },
        { id: 2, title: 'Task 2', duration: '', percentComplete: 60 },
        { id: 3, title: 'Task 3', duration: '897', percentComplete: -2 },
        { id: 4, title: 'Task 4', duration: null, percentComplete: 15 },
      ];
    });

    it('should return null when the field provided does not exist', () => {
      // arrange
      const fieldName = 'invalid';
      const groupTotals: GroupTotals = {};
      aggregator = new MaxAggregator(fieldName);
      aggregator.init();

      // act
      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      // assert
      expect(groupTotals['max'][fieldName]).toBe(null);
      expect(aggregator.isInitialized).toBeTruthy();
    });

    it('should return the maximum value when the chosen field from the dataset contains only numbers', () => {
      const fieldName = 'percentComplete';
      const groupTotals: GroupTotals = { max: {} };
      aggregator = new MaxAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('max');
      expect(groupTotals.max[fieldName]).toBe(87);
    });

    it('should return the maximum valid number when dataset contains numbers provided as string and other and invalid char', () => {
      const fieldName = 'duration';
      const groupTotals: GroupTotals = { max: {} };
      aggregator = new MaxAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(groupTotals.max[fieldName]).toBe(897);
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

    it('should return the tree data maximum value when the chosen field from the dataset contains only numbers', () => {
      const fieldName = 'percentComplete';
      const groupTotals: GroupTotals = { max: {} };
      aggregator = new MaxAggregator(fieldName);
      aggregator.init({}, true);

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('max');
      expect(groupTotals.max[fieldName]).toBe(87);
    });

    it('should return null when accumulating on a tree parent and no maximum appears yet in the datacontext parent item', () => {
      const fieldName = 'percentComplete';
      const groupTotals: any = {};
      aggregator = new MaxAggregator(fieldName);
      aggregator.init({}, true);

      dataset.forEach((row) => aggregator.accumulate(row, true));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('max');
      expect(groupTotals.max[fieldName]).toBe(null);
    });

    it('should return 99 which is the maximum value found in the Tree on a datacontext parent item', () => {
      const fieldName = 'percentComplete';
      const groupTotals: GroupTotals = { max: { percentComplete: 99 } };
      aggregator = new MaxAggregator(fieldName);
      aggregator.init({ __treeTotals: { max: { percentComplete: 22 } } }, true);
      dataset[1].__treeTotals = { max: { percentComplete: 88 } };
      dataset[2].__treeTotals = { max: { percentComplete: 77 } };

      dataset.forEach((row) => aggregator.accumulate(row, true));
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('max');
      expect(groupTotals.max[fieldName]).toBe(99);
    });
  });
});
