export const FORMULA_ERROR = {
  DIV0: '#DIV/0!',
  ERROR: '#ERROR!',
  NA: '#N/A',
  NAME: '#NAME?',
  NULL: '#NULL!',
  NUM: '#NUM!',
  REF: '#REF!',
  VALUE: '#VALUE!',
} as const;

export type FormulaErrorCode = (typeof FORMULA_ERROR)[keyof typeof FORMULA_ERROR];

const FORMULA_ERROR_VALUES = new Set<string>(Object.values(FORMULA_ERROR));

export function isFormulaErrorCode(value: unknown): value is FormulaErrorCode {
  return typeof value === 'string' && FORMULA_ERROR_VALUES.has(value);
}
