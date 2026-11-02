import { getHtmlStringOutput, titleCase } from '@slickgrid-universal/utils';
import type { Column, GridOption, ItemMetadata, KeyTitlePair, Locale } from '../interfaces/index.js';
import type { TranslaterService } from './translater.service.js';
import { getTranslationPrefix } from './utilities.js';

/** translate function used by the export services, it's `undefined` when translation is disabled */
export type ExportTranslateFn = ((translationKey: string) => string) | undefined;

/**
 * Get the translate function used by the export services, it's `undefined` when translation is disabled
 * @param {Object} gridOptions - grid options
 * @param {Object} [translater] - translater service
 * @param {Boolean} [requireCurrentLanguage] - also require the translater to have a current language
 */
export function getExportTranslateFn(
  gridOptions: GridOption,
  translater?: TranslaterService,
  requireCurrentLanguage = false
): ExportTranslateFn {
  return gridOptions.enableTranslate && translater?.translate && (!requireCurrentLanguage || translater.getCurrentLanguage?.())
    ? (key) => translater.translate(key)
    : undefined;
}

/** A column is exported unless it's excluded from the export or hidden with a width of 0 */
export function isColumnExported(columnDef: Column): boolean {
  return !columnDef.excludeFromExport && (columnDef.width === undefined || columnDef.width > 0);
}

/** Should the export include the grouped column header titles (from the pre-header row)? */
export function hasExportPreHeader(gridOptions: GridOption): boolean {
  return !!(
    gridOptions.createPreHeaderPanel &&
    gridOptions.showPreHeaderPanel &&
    (!gridOptions.enableDraggableGrouping || gridOptions.createTopHeaderPanel)
  );
}

/**
 * Get all header titles and their keys of the exported columns, translate the title when required
 * @param {Array<Object>} columns - column definitions
 * @param {Function} [translate] - translate function, when translation is enabled
 */
export function getExportColumnHeaders(columns: Column[], translate?: ExportTranslateFn): KeyTitlePair[] {
  return columns.filter(isColumnExported).map((columnDef) => ({
    key: String(columnDef.field || columnDef.id),
    title:
      (columnDef.nameKey && translate
        ? translate(columnDef.nameKey)
        : getHtmlStringOutput(columnDef.name || '', 'innerHTML') || titleCase(columnDef.field)) || '',
  }));
}

/**
 * Get all grouped header titles (pre-header) and their keys of the exported columns, translate the title when required
 * @param {Array<Object>} columns - column definitions
 * @param {Function} [translate] - translate function, when translation is enabled
 */
export function getExportColumnGroupedHeaderTitles(columns: Column[], translate?: ExportTranslateFn): KeyTitlePair[] {
  return columns.filter(isColumnExported).map((columnDef) => ({
    key: String(columnDef.field || columnDef.id),
    title: (columnDef.columnGroupKey && translate ? translate(columnDef.columnGroupKey) : columnDef.columnGroup) || '',
  }));
}

/**
 * Get the "Group by" column header title, it could be set in the export options or from translation,
 * or else use the locale text (English by default)
 */
export function getExportGroupByTitle(
  groupingColumnHeaderTitle: string | undefined,
  gridOptions: GridOption,
  translate?: ExportTranslateFn,
  locales?: Locale
): string {
  if (groupingColumnHeaderTitle) {
    return groupingColumnHeaderTitle;
  }
  return (translate ? translate(`${getTranslationPrefix(gridOptions)}GROUP_BY`) : locales?.TEXT_GROUP_BY) ?? '';
}

/** Get the text output of a group totals formatter result */
export function getGroupTotalsOutput(totalResult: string | HTMLElement): string {
  return totalResult instanceof HTMLElement ? totalResult.textContent || '' : totalResult;
}

/**
 * Create a function telling if a cell is hidden by the colspan of a previous cell of the same row
 * (a colspan could be a number or "*" to span the entire row), it must be called for every exported cell in column order.
 * @param {Object} [itemMetadata] - item metadata of the row
 */
export function createColspanHiddenCellChecker(itemMetadata?: ItemMetadata | null): (columnDef: Column, col: number) => boolean {
  const metadata = itemMetadata?.columns;
  if (!metadata) {
    return () => false;
  }

  let prevColspan: number | string = 1;
  let colspanStartCol = 0;
  return (columnDef, col) => {
    if (!((!isNaN(prevColspan as number) && +prevColspan > 1) || prevColspan === '*')) {
      prevColspan = (metadata[columnDef.id] || metadata[col])?.colspan ?? 1;
      colspanStartCol = col;
    }
    const isColspanColumn = prevColspan !== '*' && (columnDef.id in metadata || col in metadata);

    // a "*" colspan hides every following cell of the row, but not the cell where it starts
    if ((prevColspan === '*' && col > colspanStartCol) || (!isNaN(prevColspan as number) && +prevColspan > 1 && !isColspanColumn)) {
      if (!isNaN(prevColspan as number) && +prevColspan > 1) {
        (prevColspan as number)--;
      }
      return true;
    }
    return false;
  };
}
