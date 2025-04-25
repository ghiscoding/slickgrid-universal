import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  autoAddEditorFormatterToColumnsWithEditor,
  exportWithFormatterWhenDefined,
  getAssociatedDateFormatter,
  getBaseDateFormatter,
  getValueFromParamsOrFormatterOptions,
} from '../formatterUtilities.js';
import { FieldType } from '../../enums/index.js';
import { Editors } from '../../editors/index.js';
import type { Column, Formatter, GridOption } from '../../interfaces/index.js';
import { complexObjectFormatter } from '../complexObjectFormatter.js';
import { multipleFormatter } from '../multipleFormatter.js';
import { type SlickGrid } from '../../core/index.js';

describe('formatterUtilities', () => {
  const gridStub = {
    getOptions: vi.fn(),
  } as unknown as SlickGrid;

  describe('autoAddEditorFormatterToColumnsWithEditor', () => {
    let columnDefinitions: Column[];
    const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef) => {
      const isEditableItem = !!columnDef.editor;
      value = value === null || value === undefined ? '' : value;
      return isEditableItem ? `<div class="editing-field">${value}</div>` : value;
    };
    const myBoldFormatter: Formatter = (_row, _cell, value) => (value ? `<b>${value}</b>` : '');
    const myItalicFormatter: Formatter = (_row, _cell, value) => (value ? `<i>${value}</i>` : '');

    beforeEach(() => {
      columnDefinitions = [
        { id: 'firstName', field: 'firstName', editor: { model: Editors.text } },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: { formatters: [myItalicFormatter, myBoldFormatter] },
        },
        { id: 'age', field: 'age', type: 'number', formatter: multipleFormatter },
        { id: 'address', field: 'address.street', editor: { model: Editors.longText }, formatter: complexObjectFormatter },
        { id: 'zip', field: 'address.zip', type: 'number', formatter: complexObjectFormatter },
      ];
    });

    it('should have custom editor formatter with correct structure', () => {
      autoAddEditorFormatterToColumnsWithEditor(columnDefinitions, customEditableInputFormatter);

      expect(columnDefinitions).toEqual([
        { id: 'firstName', field: 'firstName', editor: { model: Editors.text }, formatter: customEditableInputFormatter },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: { formatters: [myItalicFormatter, myBoldFormatter, customEditableInputFormatter] },
        },
        { id: 'age', field: 'age', type: 'number', formatter: multipleFormatter },
        {
          id: 'address',
          field: 'address.street',
          editor: { model: Editors.longText },
          formatter: multipleFormatter,
          params: { formatters: [complexObjectFormatter, customEditableInputFormatter] },
        },
        { id: 'zip', field: 'address.zip', type: 'number', formatter: complexObjectFormatter },
      ]);
    });

    it('should have custom editor formatter with correct structure even if we call it twice', () => {
      autoAddEditorFormatterToColumnsWithEditor(columnDefinitions, customEditableInputFormatter);
      autoAddEditorFormatterToColumnsWithEditor(columnDefinitions, customEditableInputFormatter);

      expect(columnDefinitions).toEqual([
        { id: 'firstName', field: 'firstName', editor: { model: Editors.text }, formatter: customEditableInputFormatter },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: { formatters: [myItalicFormatter, myBoldFormatter, customEditableInputFormatter] },
        },
        { id: 'age', field: 'age', type: 'number', formatter: multipleFormatter },
        {
          id: 'address',
          field: 'address.street',
          editor: { model: Editors.longText },
          formatter: multipleFormatter,
          params: { formatters: [complexObjectFormatter, customEditableInputFormatter] },
        },
        { id: 'zip', field: 'address.zip', type: 'number', formatter: complexObjectFormatter },
      ]);
    });
  });

  describe('getValueFromParamsOrGridOptions method', () => {
    it('should return options found in the Grid Option when not found in Column Definition "params" property', () => {
      const gridOptions = { formatterOptions: { minDecimal: 2 } } as GridOption;

      const output = getValueFromParamsOrFormatterOptions('minDecimal', {} as Column, gridOptions, -1);

      expect(output).toBe(2);
    });

    it('should return options found in the Column Definition "params" even if exist in the Grid Option as well', () => {
      const gridOptions = { formatterOptions: { minDecimal: 2 } } as GridOption;

      const output = getValueFromParamsOrFormatterOptions('minDecimal', { params: { minDecimal: 3 } } as Column, gridOptions, -1);

      expect(output).toBe(3);
    });

    it('should return default value when not found in "params" (columnDef) neither the "formatterOptions" (gridOption)', () => {
      const defaultValue = 5;
      const output = getValueFromParamsOrFormatterOptions('minDecimal', { field: 'column1' } as Column, {} as unknown as GridOption, defaultValue);
      expect(output).toBe(defaultValue);
    });
  });

  describe('getAssociatedDateFormatter method', () => {
    it('should return a Formatter function', () => {
      const formatterFn = getAssociatedDateFormatter(FieldType.dateIso, '-');
      const isFunction = typeof formatterFn === 'function';
      expect(isFunction).toBe(true);
    });

    it('should return a formatted Date when calling the Formatter function', () => {
      const formatterFn = getAssociatedDateFormatter(FieldType.dateIso, '-');
      const gridSpy = vi.spyOn(gridStub, 'getOptions');

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', { type: FieldType.dateIso } as Column, {}, gridStub);

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe('2002-01-01');
    });

    it('should return a formatted Date with a different separator when changing setting the "dateSeparator" in "formatterOptions"', () => {
      const formatterFn = getAssociatedDateFormatter(FieldType.dateIso, '-');
      const gridOptions = { formatterOptions: { dateSeparator: '.' } } as GridOption;
      const gridSpy = (gridStub.getOptions as Mock).mockReturnValue(gridOptions);

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', { type: FieldType.dateIso } as Column, {}, gridStub);

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe('2002.01.01');
    });
  });

  describe('getBaseDateFormatter method', () => {
    it('should return a Formatter function', () => {
      const formatterFn = getBaseDateFormatter();
      const isFunction = typeof formatterFn === 'function';
      expect(isFunction).toBe(true);
    });

    it('should throw when missing "params.outputFormat" when calling the Formatter function', () => {
      const formatterFn = getBaseDateFormatter();

      expect(() => formatterFn(1, 1, '2002-01-01T00:01:01', { type: FieldType.dateIso } as Column, {}, gridStub)).toThrow(
        '[Slickgrid-Universal] Using the base "Formatter.date" requires "params.outputFormat" defined'
      );
    });

    it('should return a formatted Date when calling the Formatter function with a defined "params.outputFormat"', () => {
      const formatterFn = getBaseDateFormatter();
      const mockColumn = { type: FieldType.date, params: { dateFormat: 'MMM DD, YYYY' } } as Column;

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', mockColumn, {}, gridStub);

      expect(output).toBe('Jan 01, 2002');
    });
  });

  describe('Export Utilities', () => {
    let mockItem;
    let mockColumn: Column;
    const myBoldHtmlFormatter: Formatter = (_row, _cell, value) => (value !== null ? { text: value ? `<b>${value}</b>` : '' } : (null as any));
    const myUppercaseFormatter: Formatter = (_row, _cell, value) => {
      const fragment = new DocumentFragment();
      if (value) {
        fragment.textContent = value.toUpperCase();
      }
      return value ? { html: fragment } : (null as any);
    };

    beforeEach(() => {
      mockItem = { firstName: 'John', lastName: 'Doe', age: 45, address: { zip: 12345 }, empty: {} };
      mockColumn = { id: 'firstName', name: 'First Name', field: 'firstName', formatter: myUppercaseFormatter };
    });

    describe('exportWithFormatterWhenDefined method', () => {
      it('should NOT enable exportWithFormatter and expect the firstName to returned', () => {
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, mockItem, gridStub as SlickGrid, { exportWithFormatter: false });
        expect(output).toBe('John');
      });

      it('should provide a column definition field defined with a dot (.) notation and expect a complex object result', () => {
        const output = exportWithFormatterWhenDefined(1, 1, { ...mockColumn, field: 'address.zip' }, mockItem, gridStub as SlickGrid, {});
        expect(output).toEqual({ zip: 12345 });
      });

      it('should provide a column definition field defined with a dot (.) notation and expect an empty string when the complex result is an empty object', () => {
        const output = exportWithFormatterWhenDefined(1, 1, { ...mockColumn, field: 'empty' }, mockItem, gridStub as SlickGrid, {});
        expect(output).toEqual('');
      });

      it('should provide a exportCustomFormatter in the column definition and expect the output to be formatted', () => {
        const output = exportWithFormatterWhenDefined(1, 1, { ...mockColumn, exportCustomFormatter: myBoldHtmlFormatter }, mockItem, gridStub as SlickGrid, {
          exportWithFormatter: true,
        });
        expect(output).toBe('<b>John</b>');
      });

      it('should provide a exportCustomFormatter in the column definition and expect empty string when associated item property is null', () => {
        const output = exportWithFormatterWhenDefined(
          1,
          1,
          { ...mockColumn, exportCustomFormatter: myBoldHtmlFormatter },
          { ...mockItem, firstName: null },
          gridStub as SlickGrid,
          { exportWithFormatter: true }
        );
        expect(output).toBe('');
      });

      it('should provide a exportCustomFormatter in the column definition and expect empty string when associated item property is undefined', () => {
        const output = exportWithFormatterWhenDefined(
          1,
          1,
          { ...mockColumn, exportCustomFormatter: myBoldHtmlFormatter },
          { ...mockItem, firstName: undefined },
          gridStub as SlickGrid,
          { exportWithFormatter: true }
        );
        expect(output).toBe('');
      });

      it('should enable exportWithFormatter as an exportOption and expect the firstName to be formatted', () => {
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, mockItem, gridStub as SlickGrid, { exportWithFormatter: true });
        expect(output).toBe('JOHN');
      });

      it('should enable exportWithFormatter as a grid option and expect the firstName to be formatted', () => {
        mockColumn.exportWithFormatter = true;
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, mockItem, gridStub as SlickGrid, { exportWithFormatter: true });
        expect(output).toBe('JOHN');
      });

      it('should enable exportWithFormatter as a grid option and expect empty string when associated item property is null', () => {
        mockColumn.exportWithFormatter = true;
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, { ...mockItem, firstName: null }, gridStub as SlickGrid, { exportWithFormatter: true });
        expect(output).toBe('');
      });

      it('should enable exportWithFormatter as a grid option and expect empty string when associated item property is undefined', () => {
        mockColumn.exportWithFormatter = true;
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, { ...mockItem, firstName: undefined }, gridStub as SlickGrid, {
          exportWithFormatter: true,
        });
        expect(output).toBe('');
      });

      it('should expect empty string when associated item property is undefined and has no formatter defined', () => {
        const output = exportWithFormatterWhenDefined(1, 1, mockColumn, { ...mockItem, firstName: undefined }, gridStub as SlickGrid, {});
        expect(output).toBe('');
      });
    });
  });
});
