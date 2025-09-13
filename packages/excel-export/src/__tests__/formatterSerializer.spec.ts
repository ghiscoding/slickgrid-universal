import { describe, it, expect } from 'vitest';
import type { Column } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';
import { FormatterSerializer, type SerializableColumn } from '../utils/formatterSerializer.js';

describe('FormatterSerializer - Unit Tests', () => {
  describe('Built-in Formatter Serialization', () => {
    it('should serialize currency formatter correctly', () => {
      const serialized = FormatterSerializer.serializeFormatter(Formatters.currency);
      expect(serialized).toBe('BUILTIN:currency');
    });

    it('should serialize decimal formatter correctly', () => {
      const serialized = FormatterSerializer.serializeFormatter(Formatters.decimal);
      expect(serialized).toBe('BUILTIN:decimal');
    });

    it('should serialize date formatter correctly', () => {
      const serialized = FormatterSerializer.serializeFormatter(Formatters.date);
      expect(serialized).toBe('BUILTIN:date');
    });

    it('should serialize translateBoolean formatter correctly', () => {
      const serialized = FormatterSerializer.serializeFormatter(Formatters.translateBoolean);
      expect(serialized).toBe('BUILTIN:translateBoolean');
    });

    it('should return null for undefined formatter', () => {
      const serialized = FormatterSerializer.serializeFormatter(undefined);
      expect(serialized).toBeNull();
    });
  });

  describe('Built-in Formatter Deserialization', () => {
    it('should deserialize currency formatter correctly', () => {
      const deserialized = FormatterSerializer.deserializeFormatter('BUILTIN:currency');
      expect(typeof deserialized).toBe('function');
      expect(deserialized).toBe(Formatters.currency);
    });

    it('should deserialize decimal formatter correctly', () => {
      const deserialized = FormatterSerializer.deserializeFormatter('BUILTIN:decimal');
      expect(typeof deserialized).toBe('function');
      expect(deserialized).toBe(Formatters.decimal);
    });

    it('should return null for invalid built-in formatter', () => {
      const deserialized = FormatterSerializer.deserializeFormatter('BUILTIN:nonexistent');
      expect(deserialized).toBeNull();
    });

    it('should return null for null input', () => {
      const deserialized = FormatterSerializer.deserializeFormatter(null);
      expect(deserialized).toBeNull();
    });
  });

  describe('Custom Formatter Serialization', () => {
    it('should serialize custom formatter function', () => {
      const customFormatter = (row: number, cell: number, value: any) => `Custom: ${value}`;
      const serialized = FormatterSerializer.serializeFormatter(customFormatter);

      expect(serialized).toContain('CUSTOM:');
      expect(serialized).toContain('Custom: ${value}');
    });

    it('should deserialize custom formatter function', () => {
      const originalFormatter = (row: number, cell: number, value: any) => `Test: ${value}`;
      const serialized = FormatterSerializer.serializeFormatter(originalFormatter);
      const deserialized = FormatterSerializer.deserializeFormatter(serialized!);

      expect(typeof deserialized).toBe('function');
      // Test the deserialized function works
      const result = deserialized!(0, 0, 'hello', {} as any, {} as any, {} as any);
      expect(result).toBe('Test: hello');
    });

    it('should handle complex custom formatter with closures', () => {
      const prefix = 'PREFIX';
      const customFormatter = (row: number, cell: number, value: any) => `${prefix}: ${value}`;
      const serialized = FormatterSerializer.serializeFormatter(customFormatter);

      expect(serialized).toContain('CUSTOM:');
      // Note: Closures won't work in serialized form, this tests the limitation
    });
  });

  describe('Column Serialization', () => {
    it('should serialize column with built-in formatter', () => {
      const column: Column = {
        id: 'price',
        field: 'price',
        name: 'Price',
        formatter: Formatters.currency,
        exportWithFormatter: true,
        params: { decimalPlaces: 2 }
      };

      const serialized = FormatterSerializer.serializeColumn(column);

      expect(serialized.id).toBe('price');
      expect(serialized.field).toBe('price');
      expect(serialized.name).toBe('Price');
      expect(serialized.formatter).toBe('BUILTIN:currency');
      expect(serialized.exportWithFormatter).toBe(true);
      expect(serialized.params).toEqual({ decimalPlaces: 2 });
    });

    it('should serialize column with export custom formatter', () => {
      const column: Column = {
        id: 'status',
        field: 'status',
        formatter: Formatters.translateBoolean,
        exportCustomFormatter: Formatters.checkmarkMaterial,
        exportWithFormatter: true
      };

      const serialized = FormatterSerializer.serializeColumn(column);

      expect(serialized.formatter).toBe('BUILTIN:translateBoolean');
      expect(serialized.exportCustomFormatter).toBe('BUILTIN:checkmarkMaterial');
    });

    it('should serialize column without formatter', () => {
      const column: Column = {
        id: 'name',
        field: 'name',
        name: 'Name'
      };

      const serialized = FormatterSerializer.serializeColumn(column);

      expect(serialized.id).toBe('name');
      expect(serialized.field).toBe('name');
      expect(serialized.formatter).toBeNull();
      expect(serialized.exportCustomFormatter).toBeNull();
    });
  });

  describe('Column Deserialization', () => {
    it('should deserialize column with formatters', () => {
      const serializableColumn: SerializableColumn = {
        id: 'price',
        field: 'price',
        name: 'Price',
        formatter: 'BUILTIN:currency',
        exportCustomFormatter: 'BUILTIN:decimal',
        exportWithFormatter: true
      };

      const deserialized = FormatterSerializer.deserializeColumn(serializableColumn);

      expect(deserialized.id).toBe('price');
      expect(deserialized.field).toBe('price');
      expect(deserialized.formatter).toBe(Formatters.currency);
      expect(deserialized.exportCustomFormatter).toBe(Formatters.decimal);
    });
  });

  describe('Grid Options Serialization', () => {
    it('should serialize grid options', () => {
      const gridOptions = {
        formatterOptions: { dateFormat: 'YYYY-MM-DD' },
        locale: 'en-US',
        enableTranslate: true
      };

      const serialized = FormatterSerializer.serializeGridOptions(gridOptions as any);

      expect(serialized.formatterOptions).toEqual({ dateFormat: 'YYYY-MM-DD' });
      expect(serialized.locale).toBe('en-US');
    });
  });

  describe('Utility Methods', () => {
    it('should identify built-in formatters correctly', () => {
      expect(FormatterSerializer.isBuiltInFormatter(Formatters.currency)).toBe(true);
      expect(FormatterSerializer.isBuiltInFormatter(Formatters.decimal)).toBe(true);

      const customFormatter = () => 'custom';
      expect(FormatterSerializer.isBuiltInFormatter(customFormatter)).toBe(false);
    });

    it('should get built-in formatter names correctly', () => {
      expect(FormatterSerializer.getBuiltInFormatterName(Formatters.currency)).toBe('currency');
      expect(FormatterSerializer.getBuiltInFormatterName(Formatters.decimal)).toBe('decimal');
    });

    it('should get built-in formatters by name correctly', () => {
      expect(FormatterSerializer.getBuiltInFormatterByName('currency')).toBe(Formatters.currency);
      expect(FormatterSerializer.getBuiltInFormatterByName('decimal')).toBe(Formatters.decimal);
      expect(FormatterSerializer.getBuiltInFormatterByName('nonexistent')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', () => {
      // Test with a function that can't be serialized properly
      const problematicFormatter = function () { throw new Error('Cannot serialize'); };
      Object.defineProperty(problematicFormatter, 'toString', {
        value: () => { throw new Error('toString failed'); }
      });

      const serialized = FormatterSerializer.serializeFormatter(problematicFormatter as any);
      expect(serialized).toBeNull();
    });

    it('should handle deserialization errors gracefully', () => {
      const invalidSerialized = 'CUSTOM:invalid javascript code {{{';
      const deserialized = FormatterSerializer.deserializeFormatter(invalidSerialized);
      expect(deserialized).toBeNull();
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize data for worker communication', () => {
      const testData = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        function: () => 'test',
        date: new Date('2023-01-01'),
        array: [1, 2, 3],
        object: { nested: 'value' }
      };

      const sanitized = FormatterSerializer.sanitizeDataForWorker(testData);

      expect(sanitized.string).toBe('test');
      expect(sanitized.number).toBe(42);
      expect(sanitized.boolean).toBe(true);
      expect(sanitized.null).toBeNull();
      expect(sanitized.undefined).toBeUndefined();
      expect(typeof sanitized.function).toBe('string');
      // Date gets serialized to ISO string during sanitization
      expect(typeof sanitized.date).toBe('string');
      expect(Array.isArray(sanitized.array)).toBe(true);
      expect(typeof sanitized.object).toBe('object');
    });

    it('should handle circular references', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;

      const sanitized = FormatterSerializer.sanitizeDataForWorker(circularData);

      expect(sanitized.name).toBe('test');
      expect(sanitized.self).toBe('[Circular Reference]');
    });

    it('should sanitize group totals data', () => {
      const groupTotalsData = {
        __groupTotals: true,
        initialized: true,
        sum: { price: 100 },
        avg: { price: 50 },
        count: 2,
        min: { price: 25 },
        max: { price: 75 }
      };

      const sanitized = FormatterSerializer.sanitizeGroupTotalsData(groupTotalsData, new WeakSet());

      expect(sanitized.__groupTotals).toBe(true);
      expect(sanitized.initialized).toBe(true);
      expect(sanitized.sum).toEqual({ price: 100 });
      expect(sanitized.avg).toEqual({ price: 50 });
      expect(sanitized.count).toBe(2);
      expect(sanitized.min).toEqual({ price: 25 });
      expect(sanitized.max).toEqual({ price: 75 });
    });

    it('should sanitize group data', () => {
      const groupData = {
        __group: true,
        level: 0,
        count: 5,
        value: 'Category A',
        title: 'Group: Category A',
        collapsed: false,
        groupingKey: 'category',
        selectTotals: {},
        totals: { sum: { price: 250 } }
      };

      const sanitized = FormatterSerializer.sanitizeGroupData(groupData, new WeakSet());

      expect(sanitized.__group).toBe(true);
      expect(sanitized.level).toBe(0);
      expect(sanitized.count).toBe(5);
      expect(sanitized.value).toBe('Category A');
      expect(sanitized.title).toBe('Group: Category A');
      expect(sanitized.collapsed).toBe(false);
      expect(sanitized.groupingKey).toBe('category');
      // selectTotals and totals are not included to avoid circular references
      expect(sanitized.selectTotals).toBeUndefined();
      expect(sanitized.totals).toBeUndefined();
    });

    it('should sanitize row data', () => {
      const rowData = {
        id: 1,
        name: 'Test',
        callback: () => 'test',
        nested: { deep: { value: 'test' } }
      };

      const sanitized = FormatterSerializer.sanitizeRowData(rowData);

      expect(sanitized.id).toBe(1);
      expect(sanitized.name).toBe('Test');
      expect(typeof sanitized.callback).toBe('string');
      expect(sanitized.nested.deep.value).toBe('test');
    });
  });

  describe('Serialization Validation', () => {
    it('should check if data is serializable', () => {
      expect(FormatterSerializer.isSerializable('string')).toBe(true);
      expect(FormatterSerializer.isSerializable(42)).toBe(true);
      expect(FormatterSerializer.isSerializable(true)).toBe(true);
      expect(FormatterSerializer.isSerializable(null)).toBe(true);
      expect(FormatterSerializer.isSerializable(undefined)).toBe(true);
      expect(FormatterSerializer.isSerializable([])).toBe(true);
      expect(FormatterSerializer.isSerializable({})).toBe(true);
      expect(FormatterSerializer.isSerializable(new Date())).toBe(true);
    });

    it('should identify non-serializable data', () => {
      const func = () => 'test';
      expect(FormatterSerializer.isSerializable(func)).toBe(false);
    });

    it('should find non-serializable properties', () => {
      const obj = {
        valid: 'string',
        invalid: () => 'function',
        nested: {
          valid: 42,
          invalid: function () { return 'test'; }
        }
      };

      const issues = FormatterSerializer.findNonSerializableProperties(obj);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('invalid'))).toBe(true);
    });

    it('should handle null/undefined in property validation', () => {
      const issues1 = FormatterSerializer.findNonSerializableProperties(null);
      expect(issues1).toEqual([]);

      const issues2 = FormatterSerializer.findNonSerializableProperties(undefined);
      expect(issues2).toEqual([]);
    });

    it('should validate chunk data', () => {
      const validChunk = {
        chunkId: 'test',
        rows: [{ id: 1, name: 'test' }],
        columns: [{ id: 'id', field: 'id' }]
      };

      const validation = FormatterSerializer.validateChunkData(validChunk);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should validate chunk with non-serializable data', () => {
      const invalidChunk = {
        chunkId: 'test',
        rows: [{ id: 1, callback: () => 'test' }],
        columns: [{ id: 'id', field: 'id' }]
      };

      const validation = FormatterSerializer.validateChunkData(invalidChunk);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Group Totals Formatter Serialization', () => {
    it('should serialize group totals formatter', () => {
      const groupTotalsFormatter = (totals: any, columnDef: any) => `Total: ${totals.sum[columnDef.field]}`;
      const serialized = FormatterSerializer.serializeGroupTotalsFormatter(groupTotalsFormatter);

      expect(serialized).toContain('CUSTOM:');
      expect(serialized).toContain('totals.sum');
    });

    it('should return null for undefined group totals formatter', () => {
      const serialized = FormatterSerializer.serializeGroupTotalsFormatter(undefined);
      expect(serialized).toBeNull();
    });

    it('should handle group totals formatter serialization errors', () => {
      const problematicFormatter = function () { return 'test'; };
      Object.defineProperty(problematicFormatter, 'toString', {
        value: () => { throw new Error('toString failed'); }
      });

      const serialized = FormatterSerializer.serializeGroupTotalsFormatter(problematicFormatter);
      expect(serialized).toBeNull();
    });
  });

  describe('Complex Column Serialization', () => {
    it('should serialize column with all properties', () => {
      const column: Column = {
        id: 'complex',
        field: 'complex',
        name: 'Complex Column',
        formatter: Formatters.currency,
        exportCustomFormatter: Formatters.decimal,
        exportCustomGroupTotalsFormatter: Formatters.sumTotals,
        groupTotalsFormatter: Formatters.avgTotals,
        exportWithFormatter: true,
        excludeFromExport: false,
        sanitizeDataExport: true,
        params: { decimalPlaces: 2, prefix: '$' },
        type: 'number',
        width: 100,
        queryField: 'complex_field',
        queryFieldFilter: 'complex_filter',
        queryFieldSorter: 'complex_sorter',
        excelExportOptions: {
          autoDetectCellFormat: true,
          style: { font: { bold: true } },
          valueParserCallback: 'parseValue'
        },
        groupTotalsExcelExportOptions: {
          groupType: 'sum',
          style: { font: { italic: true } },
          valueParserCallback: 'parseGroupValue'
        }
      };

      const serialized = FormatterSerializer.serializeColumn(column);

      expect(serialized.id).toBe('complex');
      expect(serialized.field).toBe('complex');
      expect(serialized.name).toBe('Complex Column');
      expect(serialized.formatter).toBe('BUILTIN:currency');
      expect(serialized.exportCustomFormatter).toBe('BUILTIN:decimal');
      expect(serialized.exportWithFormatter).toBe(true);
      expect(serialized.excludeFromExport).toBe(false);
      expect(serialized.sanitizeDataExport).toBe(true);
      expect(serialized.params).toEqual({ decimalPlaces: 2, prefix: '$' });
      expect(serialized.type).toBe('number');
      expect(serialized.width).toBe(100);
      expect(serialized.queryField).toBe('complex_field');
      expect(serialized.queryFieldFilter).toBe('complex_filter');
      expect(serialized.queryFieldSorter).toBe('complex_sorter');
      expect(serialized.excelExportOptions).toBeDefined();
      expect(serialized.groupTotalsExcelExportOptions).toBeDefined();
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle objects with custom constructor names', () => {
      class CustomClass {
        value = 'test';
      }

      const customObj = new CustomClass();
      const result = FormatterSerializer.sanitizeDataForWorker(customObj);

      expect(result).toEqual({ value: 'test' });
    });

    it('should handle objects with meaningful toString', () => {
      const objWithToString = {
        value: 42,
        toString: () => 'Meaningful String Representation'
      };

      const result = FormatterSerializer.sanitizeDataForWorker(objWithToString);

      // The function will be serialized as a string, so we expect an object
      expect(result).toEqual(expect.objectContaining({ value: 42 }));
    });

    it('should handle group totals data with group property', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: { price: 100 },
        avg: { price: 50 },
        group: {
          level: 1,
          value: 'Category A',
          count: 5,
          collapsed: false
        }
      };

      const result = FormatterSerializer.sanitizeDataForWorker(groupTotalsData);

      expect(result).toEqual(expect.objectContaining({
        sum: { price: 100 },
        avg: { price: 50 },
        group: {
          level: 1,
          value: 'Category A',
          count: 5,
          collapsed: false
        }
      }));
    });

    it('should handle JSON.stringify success case', () => {
      const validData = { name: 'test', value: 42 };

      const result = FormatterSerializer.isSerializable(validData);

      expect(result).toBe(true);
    });

    it('should find non-serializable properties in nested objects', () => {
      const dataWithFunction = {
        name: 'test',
        nested: {
          callback: () => 'function'
        }
      };

      const issues = FormatterSerializer.findNonSerializableProperties(dataWithFunction);

      expect(issues.length).toBeGreaterThan(0);
      // The function gets converted to string, so we check for the presence of issues
      expect(issues.some(issue => issue.includes('nested'))).toBe(true);
    });

    it('should handle primitive non-serializable values', () => {
      const symbol = Symbol('test');

      const issues = FormatterSerializer.findNonSerializableProperties(symbol, 'root');

      expect(issues).toContain('root: symbol value is not serializable');
    });
  });



  describe('Group Totals Data Handling', () => {
    it('should handle group totals data with group property', () => {
      const groupTotalsData = {
        __groupTotals: true,
        sum: { price: 100 },
        avg: { price: 50 },
        group: {
          level: 1,
          value: 'Category A',
          count: 5,
          collapsed: false
        }
      };

      const result = FormatterSerializer.sanitizeDataForWorker(groupTotalsData);

      expect(result).toEqual(expect.objectContaining({
        sum: { price: 100 },
        avg: { price: 50 },
        group: {
          level: 1,
          value: 'Category A',
          count: 5,
          collapsed: false
        }
      }));
    });
  });

  describe('Serialization Validation Edge Cases', () => {
    it('should handle JSON.stringify success case', () => {
      const validData = { name: 'test', value: 42 };

      const result = FormatterSerializer.isSerializable(validData);

      expect(result).toBe(true);
    });

    it('should find non-serializable properties in nested objects', () => {
      const dataWithFunction = {
        name: 'test',
        nested: {
          callback: () => 'function'
        }
      };

      const issues = FormatterSerializer.findNonSerializableProperties(dataWithFunction);

      expect(issues.length).toBeGreaterThan(0);
      // The function gets converted to string, so we check for the presence of issues
      expect(issues.some(issue => issue.includes('nested'))).toBe(true);
    });

    it('should handle primitive non-serializable values', () => {
      const symbol = Symbol('test');

      const issues = FormatterSerializer.findNonSerializableProperties(symbol, 'root');

      expect(issues).toContain('root: symbol value is not serializable');
    });
  });

  describe('Edge Case Coverage Tests', () => {
    it('should handle SlickGroup objects', () => {
      const groupData = {
        __group: true,
        level: 1,
        value: 'Test Group',
        count: 10,
        collapsed: false,
        groupingKey: 'category'
      };

      const result = FormatterSerializer.sanitizeDataForWorker(groupData);

      expect(result).toEqual(expect.objectContaining({
        level: 1,
        value: 'Test Group',
        count: 10,
        collapsed: false,
        groupingKey: 'category'
      }));
    });

    it('should handle objects with constructor names', () => {
      const customObj = {
        constructor: { name: 'CustomObject' },
        value: 'test',
        toString: () => 'custom string'
      };

      const result = FormatterSerializer.sanitizeDataForWorker(customObj);

      expect(result).toBe('custom string');
    });

    it('should handle objects with [object Object] toString', () => {
      const objWithDefaultToString = {
        value: 42,
        toString: () => '[object Object]'
      };

      const result = FormatterSerializer.sanitizeDataForWorker(objWithDefaultToString);

      expect(result).toEqual(expect.objectContaining({ value: 42 }));
    });

    it('should handle objects with failing toString', () => {
      const objWithFailingToString = {
        value: 42,
        toString: () => {
          throw new Error('toString failed');
        }
      };

      const result = FormatterSerializer.sanitizeDataForWorker(objWithFailingToString);

      expect(result).toEqual(expect.objectContaining({ value: 42 }));
    });

    it('should handle serialization errors gracefully', () => {
      const result = FormatterSerializer.serializeFormatter(undefined);
      expect(result).toBeNull();
    });

    it('should handle deserialization errors gracefully', () => {
      const result = FormatterSerializer.deserializeFormatter('invalid javascript');
      expect(result).toBeNull();
    });
  });
});
