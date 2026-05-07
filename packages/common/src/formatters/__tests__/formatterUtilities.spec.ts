import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { type SlickGrid } from '../../core/index.js';
import { Editors } from '../../editors/index.js';
import type { Column, Formatter, GridOption } from '../../interfaces/index.js';
import { complexObjectFormatter } from '../complexObjectFormatter.js';
import {
  autoAddEditorFormatterToColumnsWithEditor,
  copyCellToClipboard,
  exportWithFormatterWhenDefined,
  getAssociatedDateFormatter,
  getBaseDateFormatter,
  getValueFromParamsOrFormatterOptions,
} from '../formatterUtilities.js';
import { multipleFormatter } from '../multipleFormatter.js';

describe('formatterUtilities', () => {
  const gridStub = {
    getOptions: vi.fn(),
  } as unknown as SlickGrid;

  describe('autoAddEditorFormatterToColumnsWithEditor', () => {
    let columns: Column[];
    const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef) => {
      const isEditableItem = !!columnDef.editor;
      value = value === null || value === undefined ? '' : value;
      return isEditableItem ? `<div class="editing-field">${value}</div>` : value;
    };
    const myBoldFormatter: Formatter = (_row, _cell, value) => (value ? `<b>${value}</b>` : '');
    const myItalicFormatter: Formatter = (_row, _cell, value) => (value ? `<i>${value}</i>` : '');

    beforeEach(() => {
      columns = [
        {
          id: 'firstName',
          field: 'firstName',
          editor: { model: Editors.text },
        },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: { formatters: [myItalicFormatter, myBoldFormatter] },
        },
        {
          id: 'age',
          field: 'age',
          type: 'number',
          formatter: multipleFormatter,
        },
        {
          id: 'address',
          field: 'address.street',
          editor: { model: Editors.longText },
          formatter: complexObjectFormatter,
        },
        {
          id: 'zip',
          field: 'address.zip',
          type: 'number',
          formatter: complexObjectFormatter,
        },
      ];
    });

    it('should have custom editor formatter with correct structure', () => {
      autoAddEditorFormatterToColumnsWithEditor(columns, customEditableInputFormatter);

      expect(columns).toEqual([
        {
          id: 'firstName',
          field: 'firstName',
          editor: { model: Editors.text },
          formatter: customEditableInputFormatter,
        },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: {
            formatters: [myItalicFormatter, myBoldFormatter, customEditableInputFormatter],
          },
        },
        {
          id: 'age',
          field: 'age',
          type: 'number',
          formatter: multipleFormatter,
        },
        {
          id: 'address',
          field: 'address.street',
          editor: { model: Editors.longText },
          formatter: multipleFormatter,
          params: {
            formatters: [complexObjectFormatter, customEditableInputFormatter],
          },
        },
        {
          id: 'zip',
          field: 'address.zip',
          type: 'number',
          formatter: complexObjectFormatter,
        },
      ]);
    });

    it('should have custom editor formatter with correct structure even if we call it twice', () => {
      autoAddEditorFormatterToColumnsWithEditor(columns, customEditableInputFormatter);
      autoAddEditorFormatterToColumnsWithEditor(columns, customEditableInputFormatter);

      expect(columns).toEqual([
        {
          id: 'firstName',
          field: 'firstName',
          editor: { model: Editors.text },
          formatter: customEditableInputFormatter,
        },
        {
          id: 'lastName',
          field: 'lastName',
          editor: { model: Editors.text },
          formatter: multipleFormatter,
          params: {
            formatters: [myItalicFormatter, myBoldFormatter, customEditableInputFormatter],
          },
        },
        {
          id: 'age',
          field: 'age',
          type: 'number',
          formatter: multipleFormatter,
        },
        {
          id: 'address',
          field: 'address.street',
          editor: { model: Editors.longText },
          formatter: multipleFormatter,
          params: {
            formatters: [complexObjectFormatter, customEditableInputFormatter],
          },
        },
        {
          id: 'zip',
          field: 'address.zip',
          type: 'number',
          formatter: complexObjectFormatter,
        },
      ]);
    });
  });

  describe('copyCellToClipboard', () => {
    let clipboardWriteMock: any;
    let gridMock: any;

    beforeEach(() => {
      clipboardWriteMock = vi.fn();
      gridMock = {
        getOptions: vi.fn(() => ({
          excelExportOptions: {},
          textExportOptions: {
            exportWithFormatter: true, // Enable the use of formatter
          },
        })),
      };

      // Mock clipboard API
      global.navigator = {
        clipboard: {
          writeText: clipboardWriteMock,
        } as any,
      } as any;

      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should copy plain text to the clipboard', async () => {
      // Define the actual behavior as expected
      const textToCopy = 'Expected Text';

      const columnDef = {
        exportWithFormatter: true,
        formatter: () => textToCopy,
      } as unknown as Column;

      // Ensure the original function is functional
      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: columnDef,
        dataContext: {}, // Provide necessary dataContext as needed
      });

      expect(clipboardWriteMock).toHaveBeenCalledWith(textToCopy);
      expect(result).toBe(textToCopy);
    });

    it('should copy formatted text to clipboard when formatter is defined', async () => {
      // Assume this is the output of your real formatter
      const formattedText = 'Formatted Text';

      const columnDef = {
        exportWithFormatter: true,
        formatter: () => formattedText, // A mock function simulating formatter
      } as unknown as Column;

      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: columnDef,
        dataContext: {},
      });

      expect(clipboardWriteMock).toHaveBeenCalledWith(formattedText);
      expect(result).toBe(formattedText);
    });

    it('should handle removal of unwanted symbols', async () => {
      const textWithSymbols = '⮟  Task 21'; // Simulated input with unwanted symbols

      const columnDef = {
        exportWithFormatter: true,
        formatter: () => textWithSymbols, // A mock function simulating formatter
      } as unknown as Column;

      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: columnDef,
        dataContext: {},
      });

      expect(clipboardWriteMock).toHaveBeenCalledWith('Task 21');
      expect(result).toBe('Task 21');
    });

    it('should handle removal of unwanted symbols', async () => {
      const textWithSymbols = '·  Task 21'; // Simulated input with unwanted symbols

      const columnDef = {
        exportWithFormatter: true,
        formatter: () => textWithSymbols, // A mock function simulating formatter
      } as unknown as Column;

      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: columnDef,
        dataContext: {},
      });

      expect(clipboardWriteMock).toHaveBeenCalledWith('Task 21');
      expect(result).toBe('Task 21');
    });

    it('should handle removal of unwanted symbols but keep pipe symbols', async () => {
      const textWithSymbols = '⮞· |  Task 21'; // Simulated input with unwanted symbols

      const columnDef = {
        exportWithFormatter: true,
        formatter: () => textWithSymbols, // A mock function simulating formatter
      } as unknown as Column;

      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: columnDef,
        dataContext: {},
      });

      expect(clipboardWriteMock).toHaveBeenCalledWith('|  Task 21');
      expect(result).toBe('|  Task 21');
    });

    it('should handle clipboard write errors gracefully', async () => {
      clipboardWriteMock.mockRejectedValueOnce(new Error('Clipboard error'));

      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await copyCellToClipboard({
        grid: gridMock,
        cell: 0,
        row: 0,
        column: {} as unknown as Column,
        dataContext: {},
      });

      expect(consoleErrorMock).toHaveBeenCalledWith(expect.stringContaining('Unable to read/write to clipboard'));
      expect(result).toBe(''); // Assuming it returns an empty string on error

      consoleErrorMock.mockRestore();
    });
  });

  describe('getValueFromParamsOrGridOptions function', () => {
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

  describe('getAssociatedDateFormatter function', () => {
    it('should return a Formatter function', () => {
      const formatterFn = getAssociatedDateFormatter('dateIso', '-');
      const isFunction = typeof formatterFn === 'function';
      expect(isFunction).toBe(true);
    });

    it('should return a formatted Date when calling the Formatter function', () => {
      const formatterFn = getAssociatedDateFormatter('dateIso', '-');
      const gridSpy = vi.spyOn(gridStub, 'getOptions');

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', { type: 'dateIso' } as Column, {}, gridStub);

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe('2002-01-01');
    });

    it('should return same unformatted blank Date when calling the Formatter function with a blank date', () => {
      const formatterFn = getAssociatedDateFormatter('dateIso', '-');
      const gridSpy = vi.spyOn(gridStub, 'getOptions');

      const output = formatterFn(1, 1, '0001-01-01T00:00:00', { type: 'dateIso' } as Column, {}, gridStub);

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe('0001-01-01T00:00:00');
    });

    it('should return a formatted Date with a different separator when changing setting the "dateSeparator" in "formatterOptions"', () => {
      const formatterFn = getAssociatedDateFormatter('dateIso', '-');
      const gridOptions = {
        formatterOptions: { dateSeparator: '.' },
      } as GridOption;
      const gridSpy = (gridStub.getOptions as Mock).mockReturnValue(gridOptions);

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', { type: 'dateIso' } as Column, {}, gridStub);

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe('2002.01.01');
    });
  });

  describe('getBaseDateFormatter function', () => {
    it('should return a Formatter function', () => {
      const formatterFn = getBaseDateFormatter();
      const isFunction = typeof formatterFn === 'function';
      expect(isFunction).toBe(true);
    });

    it('should throw when missing "params.outputFormat" when calling the Formatter function', () => {
      const formatterFn = getBaseDateFormatter();

      expect(() => formatterFn(1, 1, '2002-01-01T00:01:01', { type: 'dateIso' } as Column, {}, gridStub)).toThrow(
        '[Slickgrid-Universal] Using the base "Formatter.date" requires "params.outputFormat" defined'
      );
    });

    it('should return a formatted Date when calling the Formatter function with a defined "params.outputFormat"', () => {
      const formatterFn = getBaseDateFormatter();
      const mockColumn = {
        type: 'date',
        params: { dateFormat: 'MMM DD, YYYY' },
      } as Column;

      const output = formatterFn(1, 1, '2002-01-01T00:01:01', mockColumn, {}, gridStub);

      expect(output).toBe('Jan 01, 2002');
    });
  });

  describe('Export Utilities', () => {
    let mockItem: any;
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
      mockItem = {
        firstName: 'John',
        lastName: 'Doe',
        age: 45,
        address: { zip: 12345 },
        empty: {},
      };
      mockColumn = {
        id: 'firstName',
        name: 'First Name',
        field: 'firstName',
        formatter: myUppercaseFormatter,
      };
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

      describe('sanitization behavior', () => {
        const htmlContent = '<b>Bold Text</b> & <script>alert("xss")</script>';
        const htmlStrippedContent = 'Bold Text & alert("xss")'; // stripTags removes tags but leaves content (not fully sanitized)
        const htmlFormatter: Formatter = (_row, _cell, value) => `<b>${value}</b>`;

        it('should NOT sanitize when sanitizeDataExport is false and skipSanitization is false (default)', () => {
          const output = exportWithFormatterWhenDefined(
            1,
            1,
            { ...mockColumn, formatter: htmlFormatter },
            { ...mockItem, firstName: 'Bold Text' },
            gridStub as SlickGrid,
            { exportWithFormatter: true, sanitizeDataExport: false }
          );
          expect(output).toBe('<b>Bold Text</b>');
        });

        it('should sanitize when sanitizeDataExport is true and skipSanitization is false (default)', () => {
          const output = exportWithFormatterWhenDefined(
            1,
            1,
            { ...mockColumn, formatter: htmlFormatter },
            { ...mockItem, firstName: 'Bold Text' },
            gridStub as SlickGrid,
            { exportWithFormatter: true, sanitizeDataExport: true }
          );
          expect(output).toBe('Bold Text');
        });

        it('should NOT sanitize when skipSanitization is true, even if sanitizeDataExport is true', () => {
          const htmlFormatterWithScript: Formatter = () => htmlContent;
          const output = exportWithFormatterWhenDefined(
            1,
            1,
            { ...mockColumn, formatter: htmlFormatterWithScript },
            mockItem,
            gridStub as SlickGrid,
            { exportWithFormatter: true, sanitizeDataExport: true },
            true // skipSanitization = true
          );
          // Should return raw HTML without stripping tags when skipSanitization is true
          expect(output).toBe(htmlContent);
        });

        it('should sanitize HTML tags when sanitizeDataExport is enabled with skipSanitization false', () => {
          const output = exportWithFormatterWhenDefined(
            1,
            1,
            { ...mockColumn, formatter: () => htmlContent },
            mockItem,
            gridStub as SlickGrid,
            { exportWithFormatter: true, sanitizeDataExport: true },
            false // skipSanitization = false (explicit)
          );
          expect(output).toBe(htmlStrippedContent);
        });

        it('should handle complex HTML with multiple tags when sanitizing', () => {
          const complexHtml = '<div><span>Test</span> & <br><img src="x" onerror="alert(1)"/></div>';
          const output = exportWithFormatterWhenDefined(1, 1, { ...mockColumn, formatter: () => complexHtml }, mockItem, gridStub as SlickGrid, {
            exportWithFormatter: true,
            sanitizeDataExport: true,
          });
          // stripTags removes all HTML tags but leaves the text content
          expect(output).toBe('Test & ');
        });

        it('should return plain text unchanged when sanitizeDataExport is enabled but content has no HTML', () => {
          const plainText = 'Just plain text';
          const output = exportWithFormatterWhenDefined(1, 1, { ...mockColumn, formatter: () => plainText }, mockItem, gridStub as SlickGrid, {
            exportWithFormatter: true,
            sanitizeDataExport: true,
          });
          expect(output).toBe(plainText);
        });

        it('should not apply sanitization when no exportWithFormatter is enabled', () => {
          const output = exportWithFormatterWhenDefined(1, 1, mockColumn, { ...mockItem, firstName: 'John' }, gridStub as SlickGrid, {
            sanitizeDataExport: true,
          });
          // No formatter is applied so raw value is returned
          expect(output).toBe('John');
        });

        it('should prioritize column-level exportWithFormatter over grid option', () => {
          const output = exportWithFormatterWhenDefined(
            1,
            1,
            { ...mockColumn, exportWithFormatter: true, formatter: htmlFormatter },
            { ...mockItem, firstName: 'Bold Text' },
            gridStub as SlickGrid,
            { exportWithFormatter: false, sanitizeDataExport: true } // grid option says false
          );
          // Column definition should take precedence
          expect(output).toBe('Bold Text');
        });
      });
    });
  });
});
