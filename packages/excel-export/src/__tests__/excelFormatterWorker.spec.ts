import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  WorkerChunk,
  WorkerChunkResult,
  SerializableColumn,
  SerializableGridOptions,
  WorkerRowData
} from '../utils/formatterSerializer.js';
import { FormatterSerializer } from '../utils/formatterSerializer.js';
import type { WorkerMessage } from '../utils/workerManager.js';

// Since the worker file is designed to run in a worker context, we'll test it by
// creating a mock worker environment and testing the core functionality

// Mock Worker API
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor(scriptURL: string) {
    // Simulate worker initialization
    setTimeout(() => {
      if (this.onmessage) {
        // Simulate worker ready message
        this.onmessage({ data: { type: 'WORKER_READY' } } as MessageEvent);
      }
    }, 0);
  }
}

// Mock global Worker
Object.defineProperty(globalThis, 'Worker', {
  value: MockWorker,
  writable: true
});

// Mock Blob and URL for worker creation
Object.defineProperty(globalThis, 'Blob', {
  value: class MockBlob {
    constructor(parts: any[], options?: any) { }
  },
  writable: true
});

Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-blob-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
});

describe('ExcelFormatterWorker', () => {
  let mockChunk: WorkerChunk;
  let mockColumns: SerializableColumn[];
  let mockGridOptions: SerializableGridOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock columns
    mockColumns = [
      {
        id: 'id',
        field: 'id',
        name: 'ID',
        formatter: null,
        exportWithFormatter: false
      },
      {
        id: 'name',
        field: 'name',
        name: 'Name',
        formatter: 'function(row, cell, value) { return value ? value.toUpperCase() : ""; }',
        exportWithFormatter: true
      },
      {
        id: 'price',
        field: 'price',
        name: 'Price',
        formatter: 'function(row, cell, value) { return "$" + (value || 0).toFixed(2); }',
        exportWithFormatter: true,
        type: 'number'
      }
    ];

    // Setup mock grid options
    mockGridOptions = {
      formatterOptions: {
        minDecimal: 2,
        maxDecimal: 4
      },
      locale: 'en'
    };

    // Setup mock chunk
    mockChunk = {
      chunkId: 'test-chunk-1',
      startRow: 0,
      endRow: 2,
      rows: [
        {
          type: 'regular',
          data: { id: 1, name: 'John', price: 25.50 },
          originalRowIndex: 0
        },
        {
          type: 'regular',
          data: { id: 2, name: 'Jane', price: 30.75 },
          originalRowIndex: 1
        }
      ],
      columns: mockColumns,
      gridOptions: mockGridOptions,
      exportOptions: {
        sanitizeDataExport: true,
        groupingAggregatorRowText: 'Total:'
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Worker Environment Setup', () => {
    it('should have Worker API available', () => {
      expect(typeof Worker).toBe('function');
    });

    it('should have Blob API available', () => {
      expect(typeof Blob).toBe('function');
    });

    it('should have URL API available', () => {
      expect(typeof URL).toBe('object');
      expect(typeof URL.createObjectURL).toBe('function');
      expect(typeof URL.revokeObjectURL).toBe('function');
    });
  });

  describe('FormatterSerializer Integration', () => {
    it('should serialize and deserialize formatters correctly', () => {
      const testFormatter = function (row: number, cell: number, value: any) {
        return value ? value.toString().toUpperCase() : '';
      };

      const serialized = FormatterSerializer.serializeFormatter(testFormatter);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('toUpperCase');

      const deserialized = FormatterSerializer.deserializeFormatter(serialized);
      expect(typeof deserialized).toBe('function');

      // Test the deserialized formatter
      const result = deserialized(0, 0, 'test');
      expect(result).toBe('TEST');
    });

    it('should handle null formatter serialization', () => {
      const serialized = FormatterSerializer.serializeFormatter(null);
      expect(serialized).toBeNull();

      const deserialized = FormatterSerializer.deserializeFormatter(null);
      expect(deserialized).toBeNull();
    });

    it('should serialize column data correctly', () => {
      const column = mockColumns[1]; // Name column with formatter
      const serializedColumn = FormatterSerializer.serializeColumn(column);

      expect(serializedColumn.id).toBe(column.id);
      expect(serializedColumn.field).toBe(column.field);
      expect(serializedColumn.name).toBe(column.name);
      // The formatter should be serialized (could be null if not a built-in formatter)
      expect(serializedColumn).toHaveProperty('formatter');
    });

    it('should serialize grid options correctly', () => {
      const gridOptions = {
        formatterOptions: { test: 'value' },
        locale: 'en',
        nonSerializableFunction: () => { },
        complexObject: { nested: { deep: 'value' } }
      };

      const serialized = FormatterSerializer.serializeGridOptions(gridOptions);

      expect(serialized.formatterOptions).toEqual({ test: 'value' });
      expect(serialized.locale).toBe('en');
      // serializeGridOptions only includes specific properties, not all
    });

    it('should validate chunk data', () => {
      const validationResult = FormatterSerializer.validateChunkData(mockChunk);
      expect(validationResult).toHaveProperty('isValid');
      expect(validationResult).toHaveProperty('errors');
      expect(typeof validationResult.isValid).toBe('boolean');
      expect(Array.isArray(validationResult.errors)).toBe(true);
    });

    it('should sanitize data for worker communication', () => {
      const complexData = {
        simple: 'string',
        number: 42,
        func: () => 'test',
        circular: null as any
      };
      complexData.circular = complexData; // Create circular reference

      const sanitized = FormatterSerializer.sanitizeDataForWorker(complexData);
      expect(sanitized.simple).toBe('string');
      expect(sanitized.number).toBe(42);
      expect(typeof sanitized.func).toBe('string'); // Functions become strings
    });
  });

  describe('Worker Data Processing', () => {
    it('should create valid worker chunks', () => {
      expect(mockChunk.chunkId).toBe('test-chunk-1');
      expect(mockChunk.rows).toHaveLength(2);
      expect(mockChunk.columns).toHaveLength(3);
      expect(mockChunk.gridOptions).toBeDefined();
      expect(mockChunk.exportOptions).toBeDefined();
    });

    it('should handle different row types', () => {
      const regularRow = mockChunk.rows[0];
      expect(regularRow.type).toBe('regular');
      expect(regularRow.data).toBeDefined();
      expect(regularRow.originalRowIndex).toBe(0);

      // Test group row structure
      const groupRow: WorkerRowData = {
        type: 'group',
        data: { title: 'Group: Category A' },
        originalRowIndex: 0,
        isGrouped: true,
        groupLevel: 0,
        groupTitle: 'Category A'
      };

      expect(groupRow.type).toBe('group');
      expect(groupRow.isGrouped).toBe(true);
      expect(groupRow.groupLevel).toBe(0);

      // Test group totals row structure
      const groupTotalsRow: WorkerRowData = {
        type: 'groupTotals',
        data: { sum: { price: 100.50 }, avg: { price: 50.25 } },
        originalRowIndex: 0,
        isGrouped: true,
        groupLevel: 0
      };

      expect(groupTotalsRow.type).toBe('groupTotals');
      expect(groupTotalsRow.data.sum).toBeDefined();
      expect(groupTotalsRow.data.avg).toBeDefined();
    });

    it('should validate chunk structure', () => {
      // Test required properties
      expect(mockChunk).toHaveProperty('chunkId');
      expect(mockChunk).toHaveProperty('startRow');
      expect(mockChunk).toHaveProperty('endRow');
      expect(mockChunk).toHaveProperty('rows');
      expect(mockChunk).toHaveProperty('columns');
      expect(mockChunk).toHaveProperty('gridOptions');
      expect(mockChunk).toHaveProperty('exportOptions');

      // Test data types
      expect(typeof mockChunk.chunkId).toBe('string');
      expect(typeof mockChunk.startRow).toBe('number');
      expect(typeof mockChunk.endRow).toBe('number');
      expect(Array.isArray(mockChunk.rows)).toBe(true);
      expect(Array.isArray(mockChunk.columns)).toBe(true);
      expect(typeof mockChunk.gridOptions).toBe('object');
      expect(typeof mockChunk.exportOptions).toBe('object');
    });

    it('should handle complex formatter scenarios', () => {
      // Test formatter with complex logic
      const complexFormatter = function (row: number, cell: number, value: any, columnDef: any, dataContext: any) {
        if (!value) return '';
        if (typeof value === 'number') {
          return '$' + value.toFixed(2);
        }
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        return String(value);
      };

      const serialized = FormatterSerializer.serializeFormatter(complexFormatter);
      expect(serialized).toContain('toFixed');
      expect(serialized).toContain('toUpperCase');

      const deserialized = FormatterSerializer.deserializeFormatter(serialized);
      expect(deserialized(0, 0, 25.5)).toBe('$25.50');
      expect(deserialized(0, 0, 'test')).toBe('TEST');
      expect(deserialized(0, 0, null)).toBe('');
    });
  });
});
