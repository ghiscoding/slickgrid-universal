export interface FormulaGridCell {
  row: number;
  cell: number;
}

export interface FormulaReferenceColorInfo {
  ref: string;
  colorIdx: number;
  colorClass: string;
  cells: FormulaGridCell[];
}

export type FormulaReferenceCssHash = Record<number, Record<number | string, string>>;

export interface FormulaReferenceToken {
  ref: string;
  start: number;
  end: number;
}
