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
});
