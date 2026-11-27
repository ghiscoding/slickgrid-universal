import type { Column, SlickDataView, SlickGrid, SlickRange } from '@slickgrid-universal/common';

/** Internal callbacks used by FormulaService to keep storage and display concerns in the service. */
export interface FormulaDragFillContext {
  grid: SlickGrid;
  dataView: SlickDataView;
  getDatasetIdPropertyName: () => string;
  getFormula: (rowId: number | string, columnId: number | string) => string | undefined;
  setFormula: (rowId: number | string, columnId: number | string, formula?: string | null) => void;
  toStoredFormula: (formula: string) => string;
  toDisplayFormulaForCell: (formula: string, rowId: number | string, columnId: number | string) => string;
  applyFormulaChanges?: (apply: () => void) => void;
}

export type FormulaFillDirection = 'horizontal' | 'vertical';

export interface FormulaFillTarget {
  direction: FormulaFillDirection;
  range: SlickRange;
}

export interface FormulaFillChange {
  row: number;
  cell: number;
  rowId: number | string;
  column: Column;
  item: any;
  field: string;
  previousValue: unknown;
  previousFormula?: string;
  nextValue: unknown;
  nextFormula?: string | null;
}
