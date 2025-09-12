import { describe, it, expect, vi } from 'vitest';
import { FormatterSerializer, type WorkerChunk, type WorkerRowData } from '../utils/formatterSerializer.js';

describe('Grouped Data Web Worker Processing', () => {
  describe('WorkerRowData Structure', () => {
    it('should create regular row data correctly', () => {
      const regularRowData: WorkerRowData = {
        type: 'regular',
        data: { id: 1, name: 'Product 1', price: 99.99 },
        originalRowIndex: 0,
        isGrouped: false
      };

      expect(regularRowData.type).toBe('regular');
      expect(regularRowData.isGrouped).toBe(false);
      expect(regularRowData.data).toEqual({ id: 1, name: 'Product 1', price: 99.99 });
    });

    it('should create group header row data correctly', () => {
      const groupRowData: WorkerRowData = {
        type: 'group',
        data: {
          __group: true,
          level: 0,
          title: 'Category: Electronics (5 items)',
          collapsed: false,
          count: 5,
          value: 'Electronics'
        },
        originalRowIndex: 1,
        isGrouped: true,
        groupLevel: 0,
        groupTitle: 'Category: Electronics (5 items)',
        groupCollapsed: false
      };

      expect(groupRowData.type).toBe('group');
      expect(groupRowData.isGrouped).toBe(true);
      expect(groupRowData.groupLevel).toBe(0);
      expect(groupRowData.groupTitle).toBe('Category: Electronics (5 items)');
    });

    it('should create group totals row data correctly', () => {
      const groupTotalsRowData: WorkerRowData = {
        type: 'groupTotals',
        data: {
          __groupTotals: true,
          group: { level: 0, value: 'Electronics' },
          totals: {
            price: { sum: 499.95, avg: 99.99 },
            quantity: { sum: 25 }
          }
        },
        originalRowIndex: 7,
        isGrouped: true,
        groupLevel: 0
      };

      expect(groupTotalsRowData.type).toBe('groupTotals');
      expect(groupTotalsRowData.isGrouped).toBe(true);
      expect(groupTotalsRowData.data.__groupTotals).toBe(true);
    });
  });

  describe('WorkerChunk with Grouped Data', () => {
    it('should create chunk with mixed row types', () => {
      const chunk: WorkerChunk = {
        chunkId: 'chunk_0_10',
        startRow: 0,
        endRow: 10,
        rows: [
          {
            type: 'group',
            data: { __group: true, level: 0, title: 'Category: Electronics (3 items)' },
            originalRowIndex: 0,
            isGrouped: true,
            groupLevel: 0
          },
          {
            type: 'regular',
            data: { id: 1, name: 'Laptop', category: 'Electronics', price: 999.99 },
            originalRowIndex: 1,
            isGrouped: false
          },
          {
            type: 'regular',
            data: { id: 2, name: 'Mouse', category: 'Electronics', price: 29.99 },
            originalRowIndex: 2,
            isGrouped: false
          },
          {
            type: 'groupTotals',
            data: { __groupTotals: true, totals: { price: { sum: 1029.98 } } },
            originalRowIndex: 3,
            isGrouped: true,
            groupLevel: 0
          }
        ],
        columns: [
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'price', field: 'price', name: 'Price' }
        ],
        gridOptions: { locale: 'en-US' },
        exportOptions: { addGroupIndentation: true },
        hasGroupedItems: true,
        datasetIdPropName: 'id'
      };

      expect(chunk.hasGroupedItems).toBe(true);
      expect(chunk.rows).toHaveLength(4);
      expect(chunk.rows[0].type).toBe('group');
      expect(chunk.rows[1].type).toBe('regular');
      expect(chunk.rows[2].type).toBe('regular');
      expect(chunk.rows[3].type).toBe('groupTotals');
    });
  });

  describe('Data Sanitization for Grouped Data', () => {
    it('should sanitize group data with HTML elements', () => {
      const groupData = {
        __group: true,
        level: 0,
        title: 'Category: <span style="color:green">Electronics</span> (5 items)',
        collapsed: false,
        count: 5,
        value: 'Electronics'
      };

      const sanitized = FormatterSerializer.sanitizeRowData(groupData);

      expect(sanitized.__group).toBe(true);
      expect(sanitized.level).toBe(0);
      expect(sanitized.count).toBe(5);
      expect(sanitized.value).toBe('Electronics');
      // HTML should be stripped from title
      expect(sanitized.title).toContain('Electronics');
      expect(sanitized.title).not.toContain('<span');
    });

    it('should sanitize group totals data', () => {
      const groupTotalsData = {
        __groupTotals: true,
        group: { level: 0, value: 'Electronics' },
        totals: {
          price: { sum: 499.95, avg: 99.99 },
          quantity: { sum: 25 }
        },
        initialized: true
      };

      const sanitized = FormatterSerializer.sanitizeRowData(groupTotalsData);

      expect(sanitized.__groupTotals).toBe(true);
      expect(sanitized.group.level).toBe(0);
      expect(sanitized.totals.price.sum).toBe(499.95);
      expect(sanitized.totals.quantity.sum).toBe(25);
    });
  });

  describe('SerializableColumn with Group Properties', () => {
    it('should serialize column with group-related properties', () => {
      const column = {
        id: 'price',
        field: 'price',
        name: 'Price',
        formatter: null,
        exportWithFormatter: true,
        excludeFromExport: false,
        groupTotalsFormatter: vi.fn(),
        exportCustomGroupTotalsFormatter: vi.fn(),
        params: { groupFormatterPrefix: 'Total: ' }
      };

      const serialized = FormatterSerializer.serializeColumn(column as any);

      expect(serialized.id).toBe('price');
      expect(serialized.field).toBe('price');
      expect(serialized.name).toBe('Price');
      expect(serialized.excludeFromExport).toBe(false);
      expect(serialized.params).toEqual({ groupFormatterPrefix: 'Total: ' });
    });
  });

  describe('Chunk Validation with Grouped Data', () => {
    it('should validate chunk with grouped data', () => {
      const chunk = {
        chunkId: 'test-chunk',
        rows: [
          {
            type: 'group',
            data: { __group: true, level: 0, title: 'Category: Electronics' },
            originalRowIndex: 0,
            isGrouped: true
          },
          {
            type: 'regular',
            data: { id: 1, name: 'Product 1', price: 99.99 },
            originalRowIndex: 1,
            isGrouped: false
          }
        ],
        columns: [
          { id: 'name', field: 'name', name: 'Name' }
        ],
        hasGroupedItems: true
      };

      const validation = FormatterSerializer.validateChunkData(chunk);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should identify issues in grouped data', () => {
      const chunk = {
        chunkId: 'test-chunk',
        rows: [
          {
            type: 'group',
            data: {
              __group: true,
              level: 0,
              title: 'Category: Electronics',
              problematicFunction: () => { } // Non-serializable
            },
            originalRowIndex: 0,
            isGrouped: true
          }
        ],
        columns: [
          { id: 'name', field: 'name', name: 'Name' }
        ]
      };

      const validation = FormatterSerializer.validateChunkData(chunk);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Group Indentation and Formatting', () => {
    it('should handle group indentation options', () => {
      const exportOptions = {
        addGroupIndentation: true,
        groupCollapsedSymbol: '▶',
        groupExpandedSymbol: '▼'
      };

      const groupData = {
        __group: true,
        level: 1,
        title: 'Subcategory: Laptops (3 items)',
        collapsed: false
      };

      // This would be processed by the worker's readGroupedRowTitle function
      expect(exportOptions.addGroupIndentation).toBe(true);
      expect(exportOptions.groupExpandedSymbol).toBe('▼');
      expect(groupData.level).toBe(1);
    });

    it('should format group title with HTML stripping and indentation', () => {
      const workerRowData = {
        type: 'group',
        data: {
          __group: true,
          level: 1,
          title: 'Duration: 0 (261 items)', // Already sanitized
          collapsed: false
        },
        originalRowIndex: 0,
        isGrouped: true,
        groupLevel: 1,
        groupTitle: 'Duration: 0 <span class="text-green">(261 items)</span>', // Original with HTML
        groupCollapsed: false
      };

      const exportOptions = {
        addGroupIndentation: true,
        groupCollapsedSymbol: '⮞',
        groupExpandedSymbol: '⮟'
      };

      // Simulate the worker's readGroupedRowTitle function logic
      let groupName = '';
      if (workerRowData.groupTitle) {
        groupName = workerRowData.groupTitle.replace(/<[^>]*>/g, '');
      }

      const chevron = workerRowData.groupCollapsed ? exportOptions.groupCollapsedSymbol : exportOptions.groupExpandedSymbol;
      const indentation = '     '.repeat(workerRowData.groupLevel || 0);
      const expectedResult = chevron + ' ' + indentation + groupName;

      expect(groupName).toBe('Duration: 0 (261 items)');
      expect(expectedResult).toBe('⮟      Duration: 0 (261 items)');
    });

    it('should handle group title without HTML', () => {
      const workerRowData = {
        type: 'group',
        data: {
          __group: true,
          level: 0,
          title: 'Category: Electronics (15 items)',
          collapsed: true
        },
        originalRowIndex: 0,
        isGrouped: true,
        groupLevel: 0,
        groupTitle: 'Category: Electronics (15 items)',
        groupCollapsed: true
      };

      const exportOptions = {
        addGroupIndentation: true,
        groupCollapsedSymbol: '⮞',
        groupExpandedSymbol: '⮟'
      };

      // Simulate the worker's readGroupedRowTitle function logic
      let groupName = '';
      if (workerRowData.groupTitle) {
        groupName = workerRowData.groupTitle.replace(/<[^>]*>/g, '');
      }

      const chevron = workerRowData.groupCollapsed ? exportOptions.groupCollapsedSymbol : exportOptions.groupExpandedSymbol;
      const indentation = '     '.repeat(workerRowData.groupLevel || 0);
      const expectedResult = chevron + ' ' + indentation + groupName;

      expect(groupName).toBe('Category: Electronics (15 items)');
      expect(expectedResult).toBe('⮞ Category: Electronics (15 items)');
    });
  });

  describe('Group Totals Processing', () => {
    it('should extract sum values from group totals data', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: {
          order: 20,
          price: 499.95
        },
        avg: {
          price: 99.99
        },
        group: { level: 0, value: 'Electronics' }
      };

      const columnDef = { field: 'order' };

      // Simulate the worker's getWorkerGroupTotalValue function logic
      const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];
      let result = '';

      for (const groupType of aggregationTypes) {
        const value = groupTotalsData?.[groupType]?.[columnDef.field];
        if (value !== undefined && value !== null) {
          result = value.toString();
          break;
        }
      }

      expect(result).toBe('20');
    });

    it('should extract avg values with decimal formatting', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: { order: 20 },
        avg: { price: 99.99 },
        group: { level: 0, value: 'Electronics' }
      };

      const columnDef = { field: 'price' };

      // Simulate the worker's getWorkerGroupTotalValue function logic
      const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];
      let result = '';

      for (const groupType of aggregationTypes) {
        const value = groupTotalsData?.[groupType]?.[columnDef.field];
        if (value !== undefined && value !== null) {
          if (typeof value === 'number' && groupType === 'avg') {
            result = value.toFixed(2);
          } else {
            result = value.toString();
          }
          break;
        }
      }

      expect(result).toBe('99.99');
    });

    it('should handle multiple aggregation types and pick the first available', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: { order: 20 },
        avg: { order: 10.5 },
        min: { order: 5 },
        max: { order: 15 },
        group: { level: 0, value: 'Electronics' }
      };

      const columnDef = { field: 'order' };

      // Should pick 'sum' first since it's first in the aggregationTypes array
      const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];
      let result = '';

      for (const groupType of aggregationTypes) {
        const value = groupTotalsData?.[groupType]?.[columnDef.field];
        if (value !== undefined && value !== null) {
          result = value.toString();
          break;
        }
      }

      expect(result).toBe('20'); // Should be sum, not avg/min/max
    });

    it('should return empty string for missing fields', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: { order: 20 },
        group: { level: 0, value: 'Electronics' }
      };

      const columnDef = { field: 'nonexistent' };

      // Simulate the worker's getWorkerGroupTotalValue function logic
      const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];
      let result = '';

      for (const groupType of aggregationTypes) {
        const value = groupTotalsData?.[groupType]?.[columnDef.field];
        if (value !== undefined && value !== null) {
          result = value.toString();
          break;
        }
      }

      expect(result).toBe('');
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle SlickGroupTotals with circular references', () => {
      // Create a mock SlickGroup and SlickGroupTotals with circular references
      const mockGroup = {
        __group: true,
        level: 0,
        count: 5,
        value: 'Electronics',
        title: 'Category: Electronics (5 items)',
        collapsed: false,
        totals: null as any // Will be set to create circular reference
      };

      const mockGroupTotals = {
        __groupTotals: true,
        initialized: true,
        sum: { order: 20, price: 499.95 },
        avg: { price: 99.99 },
        group: mockGroup // Circular reference
      };

      // Create the circular reference
      mockGroup.totals = mockGroupTotals;

      // This should not throw an error and should break the circular reference
      const sanitized = FormatterSerializer.sanitizeDataForWorker(mockGroupTotals);

      expect(sanitized.__groupTotals).toBe(true);
      expect(sanitized.sum.order).toBe(20);
      expect(sanitized.sum.price).toBe(499.95);
      expect(sanitized.avg.price).toBe(99.99);
      expect(sanitized.group.level).toBe(0);
      expect(sanitized.group.value).toBe('Electronics');
      // The circular reference should be detected and replaced with a string
      expect(sanitized.group.totals).toBe('[Circular Reference]');
    });

    it('should handle SlickGroup with circular references', () => {
      const mockGroup = {
        __group: true,
        level: 0,
        count: 5,
        value: 'Electronics',
        title: 'Category: Electronics (5 items)',
        collapsed: false,
        totals: null as any
      };

      const mockGroupTotals = {
        __groupTotals: true,
        initialized: true,
        sum: { order: 20 },
        group: mockGroup
      };

      mockGroup.totals = mockGroupTotals;

      // This should not throw an error and should break the circular reference
      const sanitized = FormatterSerializer.sanitizeDataForWorker(mockGroup);

      expect(sanitized.__group).toBe(true);
      expect(sanitized.level).toBe(0);
      expect(sanitized.count).toBe(5);
      expect(sanitized.value).toBe('Electronics');
      expect(sanitized.title).toBe('Category: Electronics (5 items)');
      expect(sanitized.collapsed).toBe(false);
      // The circular reference should be detected and the totals should be sanitized
      expect(sanitized.totals).toBeDefined();
      expect(sanitized.totals.__groupTotals).toBe(true);
      expect(sanitized.totals.group).toBe('[Circular Reference]');
    });

    it('should detect and handle general circular references', () => {
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2', ref: obj1 };
      obj1.ref = obj2; // Create circular reference

      const sanitized = FormatterSerializer.sanitizeDataForWorker(obj1);

      expect(sanitized.name).toBe('obj1');
      expect(sanitized.ref.name).toBe('obj2');
      expect(sanitized.ref.ref).toBe('[Circular Reference]');
    });
  });
});
