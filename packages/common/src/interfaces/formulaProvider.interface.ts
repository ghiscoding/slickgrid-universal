import type { GridOption } from './gridOption.interface.js';

export interface FormulaExcelExportContext {
  columnId: number | string;
  columnIds: Array<number | string>;
  dataRowIdx: number;
  datasetIdPropertyName: string;
  excelRowOffset: number;
  gridOptions: GridOption;
  rowId: number | string;
  rowIds: Array<number | string>;
}

export interface FormulaExcelDefinedNameExport {
  name: string;
  refersTo: string;
  scope?: number | string;
}

export interface FormulaExcelCustomFunctionExport {
  name: string;
  args: string[];
  body: string;
  options?: {
    autoPrefixXlfn?: boolean;
    comment?: string;
    scope?: number | string;
  };
}

/** Optional interface that a formula external resource can implement. */
export interface FormulaProvider {
  /** Return whether a formula exists for the given row/column cell. */
  hasFormula?: (rowId: number | string, columnId: number | string) => boolean;

  /** Return the formula for a given row/column cell. */
  getFormula?: (rowId: number | string, columnId: number | string) => string | undefined;

  /**
   * Return an Excel-ready formula for a given row/column cell.
   * Formula should be returned without the leading `=`.
   */
  getExcelFormula?: (context: FormulaExcelExportContext) => string | undefined;

  /** Return workbook-level defined names to register before writing worksheet formulas. */
  getExcelDefinedNames?: () => FormulaExcelDefinedNameExport[];

  /** Return workbook-level custom functions to register before writing worksheet formulas. */
  getExcelCustomFunctions?: () => FormulaExcelCustomFunctionExport[];
}
