import type { ExcelColumnMetadata, Workbook, Worksheet } from '@excel-builder-vanilla/types';
import type { Column } from './column.interface.js';

export interface ExcelExportStartContext {
  workbook: Workbook;
  /** Worksheet holding the grid data, it is added to the workbook after all rows are read. */
  sheet: Worksheet;
  /** Exported columns, in worksheet order. */
  columns: Column[];
  /** 1-based worksheet row of the first DataView row. */
  dataStartRow: number;
  /** When grouped, every DataView row (including group rows) occupies a worksheet row and data columns are shifted right by one. */
  hasGroupedItems: boolean;
}

export interface ExcelExportEndContext {
  workbook: Workbook;
  sheet: Worksheet;
}

/** Optional hooks that an external resource can implement to customize Excel export cells (e.g. FormulaService). */
export interface ExcelExportCellProvider {
  /** Called once per export, after header rows are created and before data rows are read. */
  onExcelExportStart?: (context: ExcelExportStartContext) => void;

  /** Return a cell value to use instead of the default parsed value, or `undefined` to keep the default. */
  getExcelExportCellValue?: (item: any, columnDef: Column, dataRowIdx: number) => ExcelColumnMetadata | undefined;

  /** Called once per export, after the data worksheet is added to the workbook. */
  onExcelExportEnd?: (context: ExcelExportEndContext) => void;
}
