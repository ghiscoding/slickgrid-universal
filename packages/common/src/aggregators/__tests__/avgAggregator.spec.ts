import { AvgAggregator } from '../avgAggregator';
import type { GroupTotals } from '../../interfaces';

describe('avgAggregator', () => {
  let aggregator: AvgAggregator;
  let dataset: any[] = [];

  describe('Regular Group Aggregator', () => {
    beforeEach(() => {
      dataset = [
        { id: 0, title: 'Task 0', duration: '58', percentComplete: 55 },
        { id: 1, title: 'Task 1', duration: '14', percentComplete: 87 },
        { id: 2, title: 'Task 2', duration: '', percentComplete: 60 },
        { id: 3, title: 'Task 3', duration: '87', percentComplete: -2 },
        { id: 4, title: 'Task 4', duration: null, percentComplete: 15 },
      ];
    });

    it('should return undefined when the field provided does not exist', () => {
      // arrange
      const fieldName = 'invalid';
      const groupTotals = {} as GroupTotals;
      aggregator = new AvgAggregator(fieldName);
      aggregator.init();

      // act
      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      // assert
      expect(aggregator.isInitialized).toBeTruthy();
      expect(groupTotals['avg'][fieldName]).toBe(undefined);
    });

    it('should calculate an average when the chosen field from the dataset contains only numbers', () => {
      const fieldName = 'percentComplete';
      const groupTotals = { avg: {} } as GroupTotals;
      aggregator = new AvgAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      const avg = (55 + 87 + 60 + (-2) + 15) / 5;
      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('avg');
      expect(groupTotals.avg[fieldName]).toBe(avg);
    });

    it('should calculate an average with only the valid numbers when dataset contains numbers provided as string and other and invalid char', () => {
      const fieldName = 'duration';
      const groupTotals = { avg: {} } as GroupTotals;
      aggregator = new AvgAggregator(fieldName);
      aggregator.init();

      dataset.forEach((row) => aggregator.accumulate(row));
      aggregator.storeResult(groupTotals);

      const avg = (58 + 14 + 87) / 3;
      expect(groupTotals.avg[fieldName]).toBe(avg);
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

    it('should return the tree data sum value when accumulating an child item', () => {
      const fieldName = 'percentComplete';
      aggregator = new AvgAggregator(fieldName);
      aggregator.init({}, true);

      // accumulate child to current groupTotals
      const groupTotals = { avg: { percentComplete: 55 }, sum: { percentComplete: 200 }, count: { percentComplete: 4 } } as GroupTotals;
      aggregator.accumulate(dataset[4]);
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('avg');
      expect(groupTotals.count[fieldName]).toBe(5);
      expect(groupTotals.sum[fieldName]).toBe(215); // 200 + last item 15 => 215
      expect(groupTotals.avg[fieldName]).toBe(43); // 215 / 5 => 43
    });

    it('should return the current sum on the parent item that was accumulated so far', () => {
      const fieldName = 'percentComplete';
      aggregator = new AvgAggregator(fieldName);
      aggregator.init({}, true);

      // will not accumulate since it's a parent item
      const groupTotals = { avg: { percentComplete: 55 }, sum: { percentComplete: 200 }, count: { percentComplete: 4 } } as GroupTotals;
      aggregator.accumulate(dataset[4], true);
      aggregator.storeResult(groupTotals);

      expect(aggregator.field).toBe(fieldName);
      expect(aggregator.type).toBe('avg');
      expect(groupTotals.count[fieldName]).toBe(4);
      expect(groupTotals.sum[fieldName]).toBe(200);
      expect(groupTotals.avg[fieldName]).toBe(50); // 200 / 4 => 50
    });
  });
});
