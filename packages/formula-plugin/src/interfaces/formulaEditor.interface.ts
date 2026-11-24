export interface FormulaEditorParams {
  formulaFunctionList?: string[];
  /** Validate calculation errors before committing; disabled by default. */
  validateFormulas?: boolean;
  /** Service-provided calculator used by validateFormulas. */
  validateFormula?: (formula: string, item?: any) => string | undefined;
  /** Supply function names dynamically; an explicit formulaFunctionList takes precedence. */
  getFormulaFunctionList?: () => string[];
  onFormulaInputChange?: (formula: string) => void;
  /** Convert the persisted formula to the user-facing A1 form when the editor opens. */
  toDisplayFormula?: (formula: string, item?: any) => string;
  /** Convert the user-facing A1 form to the persisted formula form on commit. */
  toStoredFormula?: (formula: string, item?: any) => string;
  /** Notify the formula service after a formula has been committed. */
  onFormulaCommit?: (formula: string, item?: any) => void;
}
