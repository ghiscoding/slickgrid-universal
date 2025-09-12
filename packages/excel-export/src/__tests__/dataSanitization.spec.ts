import { describe, it, expect, beforeEach } from 'vitest';
import { FormatterSerializer } from '../utils/formatterSerializer.js';

describe('Data Sanitization for Web Workers', () => {
  describe('sanitizeDataForWorker', () => {
    it('should handle primitive types correctly', () => {
      expect(FormatterSerializer.sanitizeDataForWorker('string')).toBe('string');
      expect(FormatterSerializer.sanitizeDataForWorker(123)).toBe(123);
      expect(FormatterSerializer.sanitizeDataForWorker(true)).toBe(true);
      expect(FormatterSerializer.sanitizeDataForWorker(null)).toBe(null);
      expect(FormatterSerializer.sanitizeDataForWorker(undefined)).toBe(undefined);
    });

    it('should convert Date objects to ISO strings', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const sanitized = FormatterSerializer.sanitizeDataForWorker(date);
      expect(sanitized).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should convert HTML elements to text content', () => {
      // Create a mock HTML element
      const mockElement = {
        textContent: 'Hello World',
        innerText: 'Hello World',
        toString: () => '<div>Hello World</div>',
        tagName: 'DIV'
      };

      // Mock instanceof check
      Object.setPrototypeOf(mockElement, HTMLElement.prototype);

      const sanitized = FormatterSerializer.sanitizeDataForWorker(mockElement);
      expect(sanitized).toBe('Hello World');
    });

    it('should handle arrays recursively', () => {
      const testArray = [
        'string',
        123,
        { name: 'test', value: 456 },
        new Date('2023-01-01T00:00:00.000Z')
      ];

      const sanitized = FormatterSerializer.sanitizeDataForWorker(testArray);
      expect(sanitized).toEqual([
        'string',
        123,
        { name: 'test', value: 456 },
        '2023-01-01T00:00:00.000Z'
      ]);
    });

    it('should handle plain objects recursively', () => {
      const testObject = {
        name: 'test',
        value: 123,
        date: new Date('2023-01-01T00:00:00.000Z'),
        nested: {
          prop: 'value'
        }
      };

      const sanitized = FormatterSerializer.sanitizeDataForWorker(testObject);
      expect(sanitized).toEqual({
        name: 'test',
        value: 123,
        date: '2023-01-01T00:00:00.000Z',
        nested: {
          prop: 'value'
        }
      });
    });

    it('should convert functions to string representation', () => {
      const testFunction = function testFunc() { return 'test'; };
      const sanitized = FormatterSerializer.sanitizeDataForWorker(testFunction);
      expect(typeof sanitized).toBe('string');
      expect(sanitized).toContain('testFunc');
    });

    it('should handle complex nested structures', () => {
      const complexData = {
        id: 1,
        name: 'Product',
        date: new Date('2023-01-01T00:00:00.000Z'),
        tags: ['tag1', 'tag2'],
        metadata: {
          category: 'electronics',
          specs: {
            weight: 1.5,
            dimensions: [10, 20, 5]
          }
        }
      };

      const sanitized = FormatterSerializer.sanitizeDataForWorker(complexData);
      expect(sanitized).toEqual({
        id: 1,
        name: 'Product',
        date: '2023-01-01T00:00:00.000Z',
        tags: ['tag1', 'tag2'],
        metadata: {
          category: 'electronics',
          specs: {
            weight: 1.5,
            dimensions: [10, 20, 5]
          }
        }
      });
    });
  });

  describe('isSerializable', () => {
    it('should return true for serializable data', () => {
      expect(FormatterSerializer.isSerializable('string')).toBe(true);
      expect(FormatterSerializer.isSerializable(123)).toBe(true);
      expect(FormatterSerializer.isSerializable(true)).toBe(true);
      expect(FormatterSerializer.isSerializable(null)).toBe(true);
      expect(FormatterSerializer.isSerializable(undefined)).toBe(true);
      expect(FormatterSerializer.isSerializable([])).toBe(true);
      expect(FormatterSerializer.isSerializable({})).toBe(true);
      expect(FormatterSerializer.isSerializable(new Date())).toBe(true);
    });

    it('should return false for non-serializable data', () => {
      const func = () => { };
      expect(FormatterSerializer.isSerializable(func)).toBe(false);

      // Note: In a real browser environment, HTMLElement would not be serializable
      // but in the test environment, we can't easily test this without mocking
    });
  });

  describe('findNonSerializableProperties', () => {
    it('should identify function properties', () => {
      const obj = {
        name: 'test',
        func: () => { },
        nested: {
          anotherFunc: function test() { }
        }
      };

      const issues = FormatterSerializer.findNonSerializableProperties(obj);
      expect(issues).toContain('func: function');
      expect(issues).toContain('nested.anotherFunc: function');
    });

    it('should identify complex object properties', () => {
      // Create an object that will fail JSON serialization
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Circular reference

      const obj = {
        name: 'test',
        circular: circularObj
      };

      const issues = FormatterSerializer.findNonSerializableProperties(obj);
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('validateChunkData', () => {
    it('should validate serializable chunk data', () => {
      const chunk = {
        chunkId: 'test-chunk',
        rows: [
          { id: 1, name: 'Product 1', price: 99.99 },
          { id: 2, name: 'Product 2', price: 149.99 }
        ],
        columns: [
          { id: 'id', field: 'id', name: 'ID' },
          { id: 'name', field: 'name', name: 'Name' },
          { id: 'price', field: 'price', name: 'Price' }
        ],
        gridOptions: { locale: 'en-US' }
      };

      const validation = FormatterSerializer.validateChunkData(chunk);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should identify non-serializable data in chunks with detailed errors', () => {
      const chunk = {
        chunkId: 'test-chunk',
        rows: [
          { id: 1, name: 'Product 1', func: () => { } } // Non-serializable function
        ],
        columns: [
          { id: 'id', field: 'id', name: 'ID' }
        ]
      };

      const validation = FormatterSerializer.validateChunkData(chunk);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('function'))).toBe(true);
    });

    it('should provide detailed error information for complex objects', () => {
      const mockElement = {
        textContent: 'Hello',
        tagName: 'DIV'
      };
      Object.setPrototypeOf(mockElement, HTMLElement.prototype);

      const chunk = {
        chunkId: 'test-chunk',
        rows: [
          {
            id: 1,
            name: 'Product 1',
            element: mockElement,
            callback: () => { }
          }
        ],
        exportOptions: {
          filename: 'test.xlsx',
          customHandler: function () { }
        }
      };

      const validation = FormatterSerializer.validateChunkData(chunk);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Should identify specific problematic properties
      const errorString = validation.errors.join(' ');
      expect(errorString).toContain('function');
    });
  });

  describe('sanitizeRowData', () => {
    it('should sanitize row data for worker processing', () => {
      const rowData = {
        id: 1,
        name: 'Product',
        date: new Date('2023-01-01T00:00:00.000Z'),
        active: true,
        metadata: {
          category: 'electronics'
        }
      };

      const sanitized = FormatterSerializer.sanitizeRowData(rowData);
      expect(sanitized).toEqual({
        id: 1,
        name: 'Product',
        date: '2023-01-01T00:00:00.000Z',
        active: true,
        metadata: {
          category: 'electronics'
        }
      });
    });

    it('should handle row data with HTML elements', () => {
      // Mock HTML element in row data
      const mockElement = {
        textContent: 'Display Text',
        toString: () => '<span>Display Text</span>',
        tagName: 'SPAN'
      };
      Object.setPrototypeOf(mockElement, HTMLElement.prototype);

      const rowData = {
        id: 1,
        name: 'Product',
        displayElement: mockElement
      };

      const sanitized = FormatterSerializer.sanitizeRowData(rowData);
      expect(sanitized.displayElement).toBe('Display Text');
    });
  });

  describe('serializeColumn', () => {
    it('should sanitize column data including HTML elements in name', () => {
      // Mock HTML element for column name
      const mockNameElement = {
        textContent: 'Product Name',
        toString: () => '<span>Product Name</span>',
        tagName: 'SPAN'
      };
      Object.setPrototypeOf(mockNameElement, HTMLElement.prototype);

      const column = {
        id: 'name',
        field: 'name',
        name: mockNameElement,
        params: {
          customParam: 'value',
          dateFormat: 'YYYY-MM-DD'
        }
      };

      const serialized = FormatterSerializer.serializeColumn(column as any);
      expect(serialized.name).toBe('Product Name');
      expect(serialized.params).toEqual({
        customParam: 'value',
        dateFormat: 'YYYY-MM-DD'
      });
    });
  });
});
