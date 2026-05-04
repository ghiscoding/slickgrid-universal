import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlickGrid } from '../../core/slickGrid.js';
import type { Column, GridOption } from '../../interfaces/index.js';

// Mock the stylesheet to avoid "Cannot find stylesheet" error
// Object.defineProperty(document, 'styleSheets', {
//   value: [
//     {
//       cssRules: [],
//       rules: [],
//       ownerNode: null,
//       owningElement: null,
//     },
//   ],
//   writable: true,
// });

describe('Formatted Data Cache', () => {
  let container: HTMLElement;
  let grid: SlickGrid;
  let gridOptions: GridOption;

  const mockData = [
    { id: 1, name: 'John', age: 25, salary: 50000 },
    { id: 2, name: 'Jane', age: 30, salary: 60000 },
    { id: 3, name: 'Bob', age: 35, salary: 70000 },
  ];

  const mockColumns: Column[] = [
    { id: 'name', name: 'Name', field: 'name', formatter: (row, cell, value) => `<strong>${value}</strong>` },
    { id: 'age', name: 'Age', field: 'age', formatter: (row, cell, value) => `${value} years old` },
    { id: 'salary', name: 'Salary', field: 'salary' }, // No formatter
  ];

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    container.style.width = '500px';
    container.style.height = '500px';
    document.body.appendChild(container);

    gridOptions = {
      enableFormattedDataCache: true,
      formattedDataCacheBatchSize: 10, // Small batch for testing
    };
    grid = new SlickGrid('#myGrid', mockData, mockColumns, gridOptions);
    grid.init();
  });

  afterEach(() => {
    grid?.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Cache Initialization', () => {
    it('should initialize cache properties when enabled', () => {
      expect(grid.getCacheStatus()).toEqual({
        isPopulating: false,
        lastProcessedRow: -1,
        totalFormattedCells: 0,
      });
    });

    it('should not initialize cache when disabled', () => {
      const disabledGrid = new SlickGrid('#myGrid', mockData, mockColumns, { enableFormattedDataCache: false });
      disabledGrid.init();
      expect(disabledGrid.getCacheStatus()).toEqual({
        isPopulating: false,
        lastProcessedRow: -1,
        totalFormattedCells: 0,
      });
      disabledGrid.destroy();
    });
  });

  describe('Cache Population', () => {
    it('should populate cache asynchronously', async () => {
      // Wait for cache population to complete
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      const status = grid.getCacheStatus();
      expect(status.isPopulating).toBe(false);
      expect(status.totalFormattedCells).toBeGreaterThan(0);
      expect(status.lastProcessedRow).toBe(mockData.length - 1);
    });

    it('should cache formatted values correctly', async () => {
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      // Check that formatted values are cached
      expect(grid.getFormattedCellValue(0, 'name', 'fallback')).toBe('<strong>John</strong>');
      expect(grid.getFormattedCellValue(0, 'age', 'fallback')).toBe('25 years old');
      expect(grid.getFormattedCellValue(0, 'salary', 'fallback')).toBeUndefined(); // No formatter, should return fallback
    });

    it('should fire progress events during population', async () => {
      const progressEvents: any[] = [];
      grid.onFormattedDataCacheProgress.subscribe((args) => {
        progressEvents.push(args);
      });

      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      grid.onFormattedDataCacheProgress.unsubscribe();
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1].percentComplete).toBe(100);
    });
  });

  describe('Cache Access', () => {
    it('should return cached value when available', async () => {
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      expect(grid.getFormattedCellValue(0, 'name', 'fallback')).toBe('<strong>John</strong>');
    });

    it('should return fallback when cache miss', () => {
      expect(grid.getFormattedCellValue(0, 'name', 'fallback')).toBe('fallback');
    });

    it('should return fallback when cache disabled', () => {
      const disabledGrid = new SlickGrid('#myGrid', mockData, mockColumns, { enableFormattedDataCache: false });
      disabledGrid.init();
      expect(disabledGrid.getFormattedCellValue(0, 'name', 'fallback')).toBe('fallback');
      disabledGrid.destroy();
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear cache when columns change', async () => {
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      // Cache should be populated
      expect(grid.getCacheStatus().totalFormattedCells).toBeGreaterThan(0);

      // Change columns
      grid.setColumns([...mockColumns]);

      // Cache should be cleared
      expect(grid.getCacheStatus().totalFormattedCells).toBe(0);
    });

    it('should re-cache row when cell value changes', async () => {
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      // Modify data to trigger cell change
      mockData[0].name = 'Johnny';

      // Simulate cell change (this would normally be triggered by the grid)
      // For testing, we'll manually call the invalidation
      (grid as any).invalidateFormattedDataCacheForRow(0);

      // Check that the row was re-cached with new value
      expect(grid.getFormattedCellValue(0, 'name', 'fallback')).toBe('<strong>Johnny</strong>');
    });
  });

  describe('Data Changes', () => {
    it('should restart cache population when data changes', async () => {
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      // Change data
      const newData = [...mockData, { id: 4, name: 'Alice', age: 28, salary: 55000 }];
      grid.setData(newData);

      // Wait for new population to complete
      await new Promise((resolve) => {
        grid.onFormattedDataCacheCompleted.subscribe(() => {
          grid.onFormattedDataCacheCompleted.unsubscribe();
          resolve(void 0);
        });
      });

      const status = grid.getCacheStatus();
      expect(status.lastProcessedRow).toBe(newData.length - 1);
      expect(grid.getFormattedCellValue(3, 'name', 'fallback')).toBe('<strong>Alice</strong>');
    });
  });
});
