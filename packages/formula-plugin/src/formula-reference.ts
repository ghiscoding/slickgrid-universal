export const FORMULA_TOKEN_COLOR_COUNT = 10;

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

/** Shared reference/color state used by FormulaCellEditor and FormulaService. */
export class FormulaReferenceColorCache {
  protected _formula = '';
  protected _references: Map<string, FormulaReferenceColorInfo> = new Map<string, FormulaReferenceColorInfo>();
  protected _isDirty = false;

  update(formula: string): boolean {
    if (formula === this._formula) {
      return false;
    }

    this._formula = formula;
    this._references.clear();
    for (const info of buildFormulaReferenceColorInfos(formula)) {
      this._references.set(info.ref, info);
    }
    this._isDirty = true;
    return true;
  }

  clear(): void {
    this._formula = '';
    this._references.clear();
    this._isDirty = false;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  get size(): number {
    return this._references.size;
  }

  get(ref: string): FormulaReferenceColorInfo | undefined {
    return this._references.get(normalizeFormulaReferenceToken(ref));
  }

  values(): IterableIterator<FormulaReferenceColorInfo> {
    return this._references.values();
  }

  markClean(): void {
    this._isDirty = false;
  }
}

// Match complete or incomplete ranges (D1:D4, D1:D, D1:) before single cells.
const FORMULA_REFERENCE_TOKEN_PATTERN = String.raw`\$?[A-Z]{1,3}\$?\d+\s*:\s*(?:\$?[A-Z]{1,3}\$?\d*)?|\$?[A-Z]{1,3}\$?\d+`;

export function createFormulaReferenceTokenRegex(): RegExp {
  return new RegExp(FORMULA_REFERENCE_TOKEN_PATTERN, 'gi');
}

export function normalizeFormulaReferenceToken(token: string): string {
  return token.replace(/\$/g, '').replace(/\s+/g, '').toUpperCase();
}

export function getExcelColumnNameByIndex(columnIndex: number): string {
  let dividend = columnIndex;
  let columnName = '';

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
}

export function getExcelColumnIndexByName(columnName: string): number {
  let columnIndex = 0;
  for (let i = 0; i < columnName.length; i++) {
    columnIndex = columnIndex * 26 + (columnName.charCodeAt(i) - 64);
  }
  return columnIndex - 1;
}

export function parseExcelReferenceCell(token: string): FormulaGridCell | undefined {
  const match = normalizeFormulaReferenceToken(token).match(/^([A-Z]{1,3})(\d+)$/);
  if (!match) {
    return undefined;
  }

  const row = Number.parseInt(match[2], 10) - 1;
  const cell = getExcelColumnIndexByName(match[1]);
  if (!Number.isFinite(row) || row < 0) {
    return undefined;
  }

  return { row, cell };
}

export function expandFormulaReferenceToGridCells(reference: string): FormulaGridCell[] {
  const normalizedRef = normalizeFormulaReferenceToken(reference);
  const [startToken, endToken] = normalizedRef.includes(':')
    ? normalizedRef.split(':', 2)
    : [normalizedRef, normalizedRef];
  const startCell = parseExcelReferenceCell(startToken);
  const endCell = parseExcelReferenceCell(endToken || startToken);

  if (!startCell) {
    return [];
  }
  if (!endCell) {
    return [startCell];
  }

  const cells: FormulaGridCell[] = [];
  const minRow = Math.min(startCell.row, endCell.row);
  const maxRow = Math.max(startCell.row, endCell.row);
  const minCell = Math.min(startCell.cell, endCell.cell);
  const maxCell = Math.max(startCell.cell, endCell.cell);

  for (let row = minRow; row <= maxRow; row++) {
    for (let cell = minCell; cell <= maxCell; cell++) {
      cells.push({ row, cell });
    }
  }
  return cells;
}

/** Build the shared left-to-right reference/color mapping used by both the editor and service. */
export function buildFormulaReferenceColorInfos(formula: string): FormulaReferenceColorInfo[] {
  const references: FormulaReferenceColorInfo[] = [];
  const seen = new Set<string>();
  const referenceRegex = createFormulaReferenceTokenRegex();
  let match: RegExpExecArray | null;

  while ((match = referenceRegex.exec(formula)) !== null) {
    const ref = normalizeFormulaReferenceToken(match[0]);
    if (seen.has(ref)) {
      continue;
    }

    seen.add(ref);
    const colorIdx = references.length % FORMULA_TOKEN_COLOR_COUNT;
    references.push({
      ref,
      colorIdx,
      colorClass: `formula-cell-color-${colorIdx + 1}`,
      cells: expandFormulaReferenceToGridCells(ref),
    });
  }

  return references;
}
