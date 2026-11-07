import { describe, expect, it, vi } from 'vitest';
import type { Column, GridOption, Locale } from '../../interfaces/index.js';
import {
  createColspanHiddenCellChecker,
  getExportColumnGroupedHeaderTitles,
  getExportColumnHeaders,
  getExportGroupByTitle,
  getExportTranslateFn,
  getGroupTotalsOutput,
  hasExportPreHeader,
  isColumnExported,
} from '../exportUtilities.js';
import type { TranslaterService } from '../translater.service.js';

const translate = (key: string) => `TR_${key}`;

describe('exportUtilities', () => {
  describe('isColumnExported()', () => {
    it('should return true for a column without width or with a positive width', () => {
      expect(isColumnExported({ id: 'a', field: 'a' })).toBe(true);
      expect(isColumnExported({ id: 'a', field: 'a', width: 50 })).toBe(true);
    });

    it('should return false for a column excluded from the export or with a width of 0', () => {
      expect(isColumnExported({ id: 'a', field: 'a', excludeFromExport: true })).toBe(false);
      expect(isColumnExported({ id: 'a', field: 'a', width: 0 })).toBe(false);
    });
  });

  describe('hasExportPreHeader()', () => {
    it('should return true when the pre-header panel is created & shown without draggable grouping', () => {
      expect(hasExportPreHeader({ createPreHeaderPanel: true, showPreHeaderPanel: true })).toBe(true);
    });

    it('should require a top-header panel when using draggable grouping', () => {
      const gridOptions: GridOption = { createPreHeaderPanel: true, showPreHeaderPanel: true, enableDraggableGrouping: true };
      expect(hasExportPreHeader(gridOptions)).toBe(false);
      expect(hasExportPreHeader({ ...gridOptions, createTopHeaderPanel: true })).toBe(true);
    });

    it('should return false when the pre-header panel is not shown', () => {
      expect(hasExportPreHeader({ createPreHeaderPanel: true, showPreHeaderPanel: false })).toBe(false);
    });
  });

  describe('getExportTranslateFn()', () => {
    const translater = { translate: vi.fn(translate), getCurrentLanguage: vi.fn(() => 'en') } as unknown as TranslaterService;

    it('should return a translate function when translation is enabled', () => {
      const translateFn = getExportTranslateFn({ enableTranslate: true }, translater);
      expect(translateFn!('KEY')).toBe('TR_KEY');
    });

    it('should return undefined when translation is disabled or there is no translater', () => {
      expect(getExportTranslateFn({ enableTranslate: false }, translater)).toBeUndefined();
      expect(getExportTranslateFn({ enableTranslate: true })).toBeUndefined();
    });

    it('should require a current language only when requested', () => {
      const noLanguageTranslater = { translate, getCurrentLanguage: () => '' } as unknown as TranslaterService;
      expect(getExportTranslateFn({ enableTranslate: true }, noLanguageTranslater)).toBeDefined();
      expect(getExportTranslateFn({ enableTranslate: true }, noLanguageTranslater, true)).toBeUndefined();
      expect(getExportTranslateFn({ enableTranslate: true }, translater, true)).toBeDefined();
      expect(getExportTranslateFn({ enableTranslate: true }, { translate } as TranslaterService, true)).toBeUndefined();
    });
  });

  describe('getExportColumnHeaders()', () => {
    const columns: Column[] = [
      { id: 'firstName', field: 'firstName', name: '<b>First Name</b>' },
      { id: 'lastName', field: 'lastName', nameKey: 'LAST_NAME' },
      { id: 'hidden', field: 'hidden', name: 'Hidden', width: 0 },
      { id: 'excluded', field: 'excluded', name: 'Excluded', excludeFromExport: true },
      { id: 'user_age', field: '' as any },
    ];

    it('should return the headers of the exported columns, using the column name or a title case field', () => {
      expect(getExportColumnHeaders(columns)).toEqual([
        { key: 'firstName', title: '<b>First Name</b>' },
        { key: 'lastName', title: 'LastName' },
        { key: 'user_age', title: '' },
      ]);
    });

    it('should translate the header title when a translate function is provided and the column has a "nameKey"', () => {
      expect(getExportColumnHeaders(columns, translate)[1]).toEqual({ key: 'lastName', title: 'TR_LAST_NAME' });
    });
  });

  describe('getExportColumnGroupedHeaderTitles()', () => {
    const columns: Column[] = [
      { id: 'a', field: 'a', columnGroup: 'Group A' },
      { id: 'b', field: 'b', columnGroupKey: 'GROUP_B' },
      { id: 'c', field: 'c', columnGroup: 'Hidden', width: 0 },
      { id: 'd', field: '' as any },
    ];

    it('should return the grouped header titles of the exported columns', () => {
      expect(getExportColumnGroupedHeaderTitles(columns)).toEqual([
        { key: 'a', title: 'Group A' },
        { key: 'b', title: '' },
        { key: 'd', title: '' },
      ]);
    });

    it('should translate the title when a translate function is provided and the column has a "columnGroupKey"', () => {
      expect(getExportColumnGroupedHeaderTitles(columns, translate)[1]).toEqual({ key: 'b', title: 'TR_GROUP_B' });
    });
  });

  describe('getExportGroupByTitle()', () => {
    const locales = { TEXT_GROUP_BY: 'Group By' } as Locale;

    it('should return the title provided in the export options', () => {
      expect(getExportGroupByTitle('Custom', {}, translate, locales)).toBe('Custom');
    });

    it('should translate the title when a translate function is provided', () => {
      expect(getExportGroupByTitle(undefined, {}, translate, locales)).toBe('TR_GROUP_BY');
      expect(getExportGroupByTitle(undefined, { translationNamespace: 'NS', translationNamespaceSeparator: ':' } as GridOption, translate, locales)).toBe(
        'TR_NS:GROUP_BY'
      );
    });

    it('should use the locale text when not translating', () => {
      expect(getExportGroupByTitle('', {}, undefined, locales)).toBe('Group By');
      expect(getExportGroupByTitle(undefined, {})).toBe('');
    });
  });

  describe('getGroupTotalsOutput()', () => {
    it('should return the text content of an HTML element or the string as is', () => {
      const elm = document.createElement('span');
      elm.textContent = 'Total: 12';
      expect(getGroupTotalsOutput(elm)).toBe('Total: 12');
      expect(getGroupTotalsOutput(document.createElement('span'))).toBe('');
      expect(getGroupTotalsOutput('<b>12</b>')).toBe('<b>12</b>');
    });
  });

  describe('createColspanHiddenCellChecker()', () => {
    const columns: Column[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, field: id }));
    const getHiddenCells = (itemMetadata: any) => {
      const isColspanHiddenCell = createColspanHiddenCellChecker(itemMetadata);
      return columns.map((columnDef, col) => isColspanHiddenCell(columnDef, col));
    };

    it('should never hide cells without column metadata', () => {
      expect(getHiddenCells(null)).toEqual([false, false, false, false]);
      expect(getHiddenCells({ cssClasses: 'red' })).toEqual([false, false, false, false]);
    });

    it('should hide the cells spanned by a numeric colspan defined by column id or index', () => {
      expect(getHiddenCells({ columns: { b: { colspan: 2 } } })).toEqual([false, false, true, false]);
      expect(getHiddenCells({ columns: { 0: { colspan: 3 } } })).toEqual([false, true, true, false]);
    });

    it('should hide every following cell when the colspan is "*"', () => {
      expect(getHiddenCells({ columns: { 0: { colspan: '*' } } })).toEqual([false, true, true, true]);
    });

    it('should keep the cell where a "*" colspan starts when it is not on the 1st column', () => {
      expect(getHiddenCells({ columns: { b: { colspan: '*' } } })).toEqual([false, false, true, true]);
    });

    it('should read a spanned cell that has its own metadata without ending the current colspan', () => {
      expect(getHiddenCells({ columns: { a: { colspan: 3 }, b: { colspan: 1 } } })).toEqual([false, false, true, true]);
    });
  });
});
