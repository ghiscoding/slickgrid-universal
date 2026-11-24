import type { FormulaEditorParams } from './formulaEditor.interface.js';
import type { FormulaExcelCustomFunctionExport, FormulaExcelDefinedNameExport } from './formulaExcelExport.interface.js';

export type FormulaCallback = (...args: any[]) => unknown;

export interface FormulaCustomFunctionParams {
  values: unknown[];
}

export interface FormulaCustomFunctionDefinition {
  func: FormulaCallback | ((params: FormulaCustomFunctionParams) => unknown);
}

export type FormulaCustomFunctionInput = FormulaCallback | FormulaCustomFunctionDefinition;

export interface FormulaServiceOption {
  /** Defaults to true, auto-attach FormulaCellEditor on columns having allowFormula=true. */
  autoAssignEditor?: boolean;

  /** Optional default editor params merged with per-column editor params. */
  editorParams?: FormulaEditorParams;

  /** Defaults to true, prepend Excel-like column letters in header while editing formulas. */
  enableExcelHeaderPrefix?: boolean;

  /** Optional function callbacks available during formula evaluation (e.g. MYFUNC(A1, B1)). */
  customFunctions?: Record<string, FormulaCustomFunctionInput>;

  /** Optional Excel workbook-level names to register at export time. */
  excelDefinedNames?: FormulaExcelDefinedNameExport[];

  /** Optional Excel workbook-level custom function definitions for export. */
  excelCustomFunctions?: FormulaExcelCustomFunctionExport[];

  /** Defaults to true, sync initial formulas from dataset rows into internal formula store. Ignored when `formulaDataSource` is provided. */
  autoSyncFormulasFromDataset?: boolean;

  /** Optional external formula storage, loaded at init and notified when a formula is set or removed. */
  formulaDataSource?: FormulaDataSource;
}

/** External formula storage; formulas are exchanged in the stable `REF(COLUMN(),ROW())` form. */
export interface FormulaDataSource {
  getFormula: (rowId: number | string, columnId: number | string) => string | undefined;
  setFormula: (rowId: number | string, columnId: number | string, formula: string | undefined) => void;
}

export interface FormulaReferenceAbsoluteFlags {
  column: boolean;
  row: boolean;
}

/** Serializable formula and its reference locks, independent of the current grid layout. */
export interface FormulaCellSnapshot {
  version: 1;
  formula: string;
  referenceFlags: FormulaReferenceAbsoluteFlags[];
}

export interface FormulaStoreSnapshot {
  version: 1;
  cells: Array<FormulaCellSnapshot & { rowId: number | string; columnId: number | string }>;
}

export interface FormulaDependency {
  key: string;
  memoKey: string;
  formula: string;
}

export interface FormulaEvaluationContext {
  visited: Set<string>;
  memo: Map<string, unknown>;
  preserveLiteral?: boolean;
}
