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
  /** Precomputed lookups for the duration of an export. Row indexes are zero-based. */
  referenceLookups?: {
    columnIds: string[];
    columnIndexes: ReadonlyMap<string, number>;
    rowIds: string[];
    rowIndexes: ReadonlyMap<string, number>;
  };
  /** Worksheet positions for data rows in a grouped export. */
  groupedRowPositions?: ReadonlyMap<string, number>;
  /** Number of structural columns preceding exported data columns. */
  groupedColumnOffset?: number;
  /** Allocate an ordered helper range; width defaults to one and preserves the original rectangle shape. */
  registerFormulaRange?: (references: string[], width?: number) => string;
  /** Allocate a similarly shaped range of 0/1 values indicating whether each referenced cell is nonempty. */
  registerFormulaPresenceRange?: (references: string[], width?: number) => string;
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
  /** Opt in to grouped worksheet position mapping. */
  supportsGroupedFormulaExport?: boolean;
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
