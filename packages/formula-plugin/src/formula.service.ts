import type {
  Column,
  ColumnEditor,
  ContainerService,
  ExternalResource,
  Formatter,
  FormulaExcelCustomFunctionExport,
  FormulaExcelDefinedNameExport,
  FormulaExcelExportContext,
  FormulaProvider,
  OnDragReplaceCellsEventArgs,
  SlickDataView,
  SlickGrid,
} from '@slickgrid-universal/common';
import { createDomElement, Formatters, SlickEventHandler } from '@slickgrid-universal/common';
import { FORMULA_ERROR, isFormulaErrorCode, type FormulaErrorCode } from './formula-errors.js';
import { createFormulaFunctionRegistry, type FormulaCallback } from './formula-functions.js';
import {
  buildFormulaReferenceCssHash,
  FORMULA_MAX_REFERENCE_CELLS,
  FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY,
  FormulaReferenceColorCache,
  getExcelColumnIndexByName,
  getExcelColumnNameByIndex,
  parseExcelReferenceCell,
} from './formula-reference.js';
import { FormulaCellEditor, type FormulaEditorParams } from './formula.cellEditor.js';
import { handleFormulaDragFill } from './formula.drag-fill.js';

export type { FormulaCallback } from './formula-functions.js';

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

  /** Defaults to true, sync initial formulas from dataset rows into internal formula store. */
  autoSyncFormulasFromDataset?: boolean;
}

interface FormulaEvaluationContext {
  visited: Set<string>;
  memo: Map<string, unknown>;
}

interface FormulaReferenceAbsoluteFlags {
  column: boolean;
  row: boolean;
}

/**
 * Optional formula service storing formulas by row/column and exposing export helpers.
 * This MVP focuses on formula storage and Excel conversion support.
 */
export class FormulaService implements ExternalResource, FormulaProvider {
  readonly pluginName = 'FormulaService';

  protected _grid!: SlickGrid;
  protected _dataView!: SlickDataView;
  protected _customFunctions: Map<string, FormulaCallback> = new Map<string, FormulaCallback>();
  protected _formulaStore: Map<string, string> = new Map<string, string>();
  protected _formulaCoordinatesByKey: Map<string, { rowId: number | string; columnId: number | string }> = new Map();
  protected _formulaReferenceAbsoluteFlagsByKey: Map<string, FormulaReferenceAbsoluteFlags[]> = new Map();
  protected _formulaRefColorCache: FormulaReferenceColorCache = new FormulaReferenceColorCache();
  protected _originalColumnNamesById: Map<number | string, string | HTMLElement | DocumentFragment | undefined> = new Map();
  protected _isExcelHeaderPrefixEnabled = false;
  protected _hasWarnedSelectionPrerequisite = false;
  protected _hasAutoAssignedFormulaEditor = false;
  protected _originalColumnDefsById: Map<number | string, Pick<Column, 'formatter' | 'params' | 'editorClass' | 'editor'>> = new Map();
  protected _evaluationMemo: Map<string, unknown> = new Map<string, unknown>();
  protected _isEvaluationMemoFlushScheduled = false;
  protected _eventHandler: SlickEventHandler = new SlickEventHandler();

  protected static readonly FORMULA_EVAL_FORMATTER_FLAG = '__formulaEvalFormatter';

  constructor(protected _options: FormulaServiceOption = {}) {}

  getOptions(): FormulaServiceOption {
    return this._options;
  }

  setOptions(newOptions: FormulaServiceOption): void {
    this._options = { ...this._options, ...newOptions };
  }

  init(grid: SlickGrid, _containerService?: ContainerService): void {
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>() || {};

    // Respect explicit grid opt-out; when disabled, the service stays inert.
    if (grid?.getOptions?.().enableFormulas === false) {
      return;
    }

    if (this._grid.onDragReplaceCells) {
      this._eventHandler.subscribe(this._grid.onDragReplaceCells, this.handleDragReplaceCells.bind(this));
    }

    if (this._options.customFunctions) {
      this.registerCustomFunctions(this._options.customFunctions);
    }

    if (this._options.autoSyncFormulasFromDataset !== false) {
      this.syncFormulasFromDataset();
    }
    this.canonicalizeStoredFormulas();

    this.autoAssignFormulaEditorToColumns();
    this.validateSelectionModelPrerequisites();
  }

  dispose(): void {
    this._eventHandler.unsubscribeAll();
    this.clearFormulaReferenceHighlights();
    this.disableExcelHeaderPrefix();
    this.restoreAutoAssignedFormulaEditorColumns();
    this._formulaStore.clear();
    this._formulaCoordinatesByKey.clear();
    this._formulaReferenceAbsoluteFlagsByKey.clear();
    this._formulaRefColorCache.clear();
    this.resetEvaluationMemo();
    this._customFunctions.clear();
    this._originalColumnNamesById.clear();
  }

  clearFormulaReferenceHighlights(): void {
    if (!this._grid?.removeCellCssStyles) {
      return;
    }

    this._grid.removeCellCssStyles(FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY);
  }

  protected validateSelectionModelPrerequisites(): void {
    if (this._hasWarnedSelectionPrerequisite || !this._grid?.getColumns || !this._grid?.getOptions) {
      return;
    }

    const columns = this._grid.getColumns() as Column[];
    const hasFormulaColumns = columns.some((column) => column.allowFormula === true || column.editor?.model === FormulaCellEditor);
    if (!hasFormulaColumns) {
      return;
    }

    const gridOptions = this._grid.getOptions();
    const hasSelectionEnabled = gridOptions.enableSelection === true;
    const selectionType = gridOptions.selectionOptions?.selectionType;
    const supportsCellRangeSelection = hasSelectionEnabled && selectionType !== 'row';

    if (!supportsCellRangeSelection) {
      this._hasWarnedSelectionPrerequisite = true;
      console.warn(
        '[Slickgrid-Universal][FormulaService] Formula range visuals and drag-resize rely on an active cell-capable SelectionModel. Enable `enableSelection: true` and `selectionOptions.selectionType: "mixed"` (or `"cell"`) for full Excel-like range UX.'
      );
    }
  }

  enableExcelHeaderPrefix(): void {
    if (
      this._options.enableExcelHeaderPrefix === false ||
      this._isExcelHeaderPrefixEnabled ||
      !this._grid?.getColumns ||
      !this._grid?.setColumns
    ) {
      return;
    }

    const columns = this._grid.getColumns() as Column[];
    const nextColumns = columns.map((column, index) => {
      if (!this._originalColumnNamesById.has(column.id)) {
        this._originalColumnNamesById.set(column.id, column.name);
      }

      const originalName = this._originalColumnNamesById.get(column.id);
      const nameText = typeof originalName === 'string' ? originalName : String(column.id);
      const excelLabel = getExcelColumnNameByIndex(index + 1);

      return {
        ...column,
        name: `<span class="excel-col-prefix">${excelLabel}</span> ${nameText}`,
      };
    });

    this._grid.setColumns(nextColumns as Column[]);
    this._isExcelHeaderPrefixEnabled = true;
  }

  disableExcelHeaderPrefix(): void {
    if (!this._isExcelHeaderPrefixEnabled || !this._grid?.getColumns || !this._grid?.setColumns) {
      return;
    }

    const columns = this._grid.getColumns() as Column[];
    const restoredColumns = columns.map((column) => {
      const originalName = this._originalColumnNamesById.get(column.id);
      return {
        ...column,
        name: originalName ?? column.name,
      };
    });

    this._grid.setColumns(restoredColumns as Column[]);
    this._isExcelHeaderPrefixEnabled = false;
  }

  renderFormulaReferenceHighlights(formula?: string): void {
    this.clearFormulaReferenceHighlights();
    if (!this._grid?.getColumns || !this._grid?.setCellCssStyles || !formula || !formula.startsWith('=')) {
      return;
    }

    const normalizedFormula = formula.startsWith('=') ? formula.slice(1) : formula;
    const normalizedFormulaWithRefs = `=${this.replaceRefFunctionsWithA1Refs(
      normalizedFormula,
      ((this._grid?.getColumns?.() as Column[] | undefined) || []).map((col) => String(col.id)),
      this.getDataItems().map((item) => String(item?.[this.getDatasetIdPropertyName()] ?? '')),
      1
    )}`;
    this._formulaRefColorCache.update(normalizedFormulaWithRefs);
    const columns = this._grid.getColumns() as Column[];
    const hash = buildFormulaReferenceCssHash(this._formulaRefColorCache.values(), columns, this.getDatasetLength());

    if (Object.keys(hash).length > 0) {
      this._grid.setCellCssStyles(FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY, hash as any);
    }
    this._formulaRefColorCache.markClean();
  }

  extractExcelReferences(formula: string): Array<{ col: string; row: number }> {
    const displayFormula = this.toDisplayFormula(formula);
    this._formulaRefColorCache.update(displayFormula);
    return Array.from(this._formulaRefColorCache.values()).flatMap((reference) =>
      reference.cells.map((cell) => ({ col: getExcelColumnNameByIndex(cell.cell + 1), row: cell.row + 1 }))
    );
  }

  clearFormulas(): void {
    this._formulaStore.clear();
    this._formulaCoordinatesByKey.clear();
    this._formulaReferenceAbsoluteFlagsByKey.clear();
    this.resetEvaluationMemo();
  }

  /** Sync formula strings found in dataset rows to the internal formula store. */
  syncFormulasFromDataset(): void {
    const columns = (this._grid?.getColumns?.() || []) as Column[];
    if (!columns.length) {
      return;
    }

    const formulaColumns = columns.filter((col) => !!col.allowFormula);
    if (!formulaColumns.length) {
      return;
    }

    const items = this.getDataItems();
    const datasetIdPropertyName = this.getDatasetIdPropertyName();

    for (const item of items) {
      const rowId = item?.[datasetIdPropertyName] as number | string | undefined;
      if (rowId === undefined || rowId === null) {
        continue;
      }

      for (const column of formulaColumns) {
        const columnId = column.id;
        const fieldName = String(column.field ?? column.id);
        const rawValue = item?.[fieldName as keyof typeof item] ?? item?.[String(columnId) as keyof typeof item];

        if (typeof rawValue === 'string' && rawValue.trim().startsWith('=')) {
          this.setFormula(rowId, columnId, rawValue.trim());
        }
      }
    }
  }

  /**
   * Evaluate a formula for a specific cell.
   * - 3 args: (rowId, columnId, fallbackValue)
   * - 4 args: (rowId, columnId, currentCellValue, fallbackValue)
   */
  getEvaluatedCellValue<T = unknown>(
    rowId: number | string,
    columnId: number | string,
    currentCellValueOrFallbackValue?: unknown,
    fallbackValue?: T
  ): unknown {
    const hasCurrentCellValue = arguments.length >= 4;
    const liveValue = hasCurrentCellValue ? currentCellValueOrFallbackValue : this.getCellRawValue(rowId, columnId);
    const safeFallbackValue = (hasCurrentCellValue ? fallbackValue : (currentCellValueOrFallbackValue as T | undefined)) as T | undefined;
    const rowStoredValue = this.getCellRawValue(rowId, columnId);
    const storedFormula = this.getFormula(rowId, columnId);

    const normalizedStoredFormula =
      typeof storedFormula === 'string' && storedFormula.trim().startsWith('=') ? storedFormula.trim() : undefined;
    const normalizedLiveFormula = typeof liveValue === 'string' && liveValue.trim().startsWith('=') ? liveValue.trim() : undefined;
    const normalizedRowFormula =
      typeof rowStoredValue === 'string' && rowStoredValue.trim().startsWith('=') ? rowStoredValue.trim() : undefined;

    // Once a formula has a stable representation, it is authoritative even if the
    // dataset still contains a legacy A1 value. This prevents a reorder from making
    // the live cell value override the ID-based formula in the store.
    const storedFormulaIsStable = !!normalizedStoredFormula && /\bREF\(\s*COLUMN\(/i.test(normalizedStoredFormula);
    const formula = storedFormulaIsStable
      ? normalizedStoredFormula
      : normalizedLiveFormula && normalizedLiveFormula !== normalizedStoredFormula
        ? normalizedLiveFormula
        : (normalizedStoredFormula ?? normalizedLiveFormula ?? normalizedRowFormula);

    if (!formula || !formula.trim().startsWith('=')) {
      return safeFallbackValue;
    }

    const storeKey = this.buildStoreKey(rowId, columnId);
    const evalMemo = this.getOrCreateEvaluationMemo();
    const memoKey = this.buildEvaluationMemoKey(rowId, columnId, formula);

    if (evalMemo.has(memoKey)) {
      return evalMemo.get(memoKey);
    }

    const evaluated = this.evaluateFormulaExpression(formula, {
      visited: new Set<string>([storeKey]),
      memo: evalMemo,
    });

    if (isFormulaErrorCode(evaluated)) {
      evalMemo.set(memoKey, evaluated);
      return evaluated;
    }

    if (evaluated === undefined || (typeof evaluated === 'number' && Number.isNaN(evaluated))) {
      const errorValue = FORMULA_ERROR.VALUE;
      evalMemo.set(memoKey, errorValue);
      return errorValue;
    }

    if (typeof evaluated === 'number' && !Number.isFinite(evaluated)) {
      const errorValue = FORMULA_ERROR.DIV0;
      evalMemo.set(memoKey, errorValue);
      return errorValue;
    }

    evalMemo.set(memoKey, evaluated);
    return evaluated;
  }

  getFormula(rowId: number | string, columnId: number | string): string | undefined {
    return this._formulaStore.get(this.buildStoreKey(rowId, columnId));
  }

  hasFormula(rowId: number | string, columnId: number | string): boolean {
    return this._formulaStore.has(this.buildStoreKey(rowId, columnId));
  }

  removeFormula(rowId: number | string, columnId: number | string): boolean {
    const key = this.buildStoreKey(rowId, columnId);
    const wasDeleted = this._formulaStore.delete(key);
    if (wasDeleted) {
      this._formulaCoordinatesByKey.delete(key);
      this.resetEvaluationMemo();
    }
    return wasDeleted;
  }

  setFormula(rowId: number | string, columnId: number | string, formula?: string | null): void {
    const key = this.buildStoreKey(rowId, columnId);
    if (formula == null || formula === '') {
      this._formulaStore.delete(key);
      this._formulaCoordinatesByKey.delete(key);
      this._formulaReferenceAbsoluteFlagsByKey.delete(key);
      this.resetEvaluationMemo();
      return;
    }

    if (this.containsDirectExcelReference(formula)) {
      this.captureFormulaReferenceAbsoluteFlags(key, formula);
    }
    this._formulaCoordinatesByKey.set(key, { rowId, columnId });
    this._formulaStore.set(key, this.toStoredFormula(formula));
    this.resetEvaluationMemo();
  }

  /**
   * Fill formulas through the same drag-handle event used by the spreadsheet examples.
   * The source formula is converted to the editor's A1 form, shifted relative to the
   * source cell, and then stored again in stable column/row-reference form.
   */
  protected handleDragReplaceCells(_event: unknown, args: OnDragReplaceCellsEventArgs): void {
    handleFormulaDragFill(args, {
      grid: this._grid,
      dataView: this._dataView,
      getDatasetIdPropertyName: this.getDatasetIdPropertyName.bind(this),
      getFormula: this.getFormula.bind(this),
      setFormula: this.setFormula.bind(this),
      toStoredFormula: this.toStoredFormula.bind(this),
      toDisplayFormulaForCell: this.toDisplayFormulaForCell.bind(this),
    });
  }

  protected containsDirectExcelReference(formula: string): boolean {
    const referenceRegex = /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?:\s*:\s*\$?[A-Z]{1,3}\$?\d+)?(?![A-Za-z0-9_])/gi;
    let found = false;
    this.transformFormulaOutsideQuotedStrings(formula, (segment) => {
      found ||= referenceRegex.test(segment);
      referenceRegex.lastIndex = 0;
      return segment;
    });
    return found;
  }

  protected captureFormulaReferenceAbsoluteFlags(key: string, formula: string): void {
    const referenceRegex = /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?:\s*:\s*\$?[A-Z]{1,3}\$?\d+)?(?![A-Za-z0-9_])/gi;
    const flags: FormulaReferenceAbsoluteFlags[] = [];
    this.transformFormulaOutsideQuotedStrings(formula, (segment) => {
      segment.replace(referenceRegex, (reference) => {
        reference.split(':').forEach((endpoint) => {
          const match = endpoint.trim().match(/^(\$?)[A-Z]{1,3}(\$?)(\d+)$/i);
          if (match) {
            flags.push({ column: match[1] === '$', row: match[2] === '$' });
          }
        });
        return reference;
      });
      return segment;
    });
    this._formulaReferenceAbsoluteFlagsByKey.set(key, flags);
  }

  protected toDisplayFormulaForCell(formula: string, rowId: number | string, columnId: number | string): string {
    const displayFormula = this.toDisplayFormula(formula);
    return this.applyFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, columnId), displayFormula);
  }

  protected applyFormulaReferenceAbsoluteFlags(key: string, formula: string): string {
    const flags = this._formulaReferenceAbsoluteFlagsByKey.get(key);
    if (!flags?.length) {
      return formula;
    }

    const referenceRegex = /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?:\s*:\s*\$?[A-Z]{1,3}\$?\d+)?(?![A-Za-z0-9_])/gi;
    let flagIndex = 0;
    return this.transformFormulaOutsideQuotedStrings(formula, (segment) =>
      segment.replace(referenceRegex, (reference) =>
        reference
          .split(':')
          .map((endpoint) => {
            const flag = flags[flagIndex++];
            if (!flag) {
              return endpoint;
            }
            const parsed = endpoint.trim().match(/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/i);
            /* v8 ignore if - the surrounding reference regex guarantees a valid endpoint */
            if (!parsed) {
              return endpoint;
            }
            return `${flag.column ? '$' : ''}${parsed[2].toUpperCase()}${flag.row ? '$' : ''}${parsed[4]}`;
          })
          .join(':')
      )
    );
  }

  /** Canonicalize formulas supplied before the grid was initialized. */
  protected canonicalizeStoredFormulas(): void {
    for (const [key, formula] of this._formulaStore.entries()) {
      const coordinates = this._formulaCoordinatesByKey.get(key);
      if (!coordinates) {
        continue;
      }

      const canonicalFormula = this.toStoredFormula(formula);
      if (canonicalFormula !== formula) {
        this._formulaStore.set(key, canonicalFormula);
      }
    }
  }

  registerCustomFunction(functionName: string, functionInput: FormulaCustomFunctionInput): void {
    const normalizedCallback = this.normalizeCustomFunctionInput(functionInput);
    if (!normalizedCallback) {
      return;
    }
    this._customFunctions.set(functionName.toUpperCase(), normalizedCallback);
  }

  registerCustomFunctions(customFunctions: Record<string, FormulaCustomFunctionInput>): void {
    for (const [functionName, functionInput] of Object.entries(customFunctions || {})) {
      this.registerCustomFunction(functionName, functionInput);
    }
  }

  unregisterCustomFunction(functionName: string): boolean {
    return this._customFunctions.delete(functionName.toUpperCase());
  }

  getCustomFunction(functionName: string): FormulaCallback | undefined {
    return this._customFunctions.get(functionName.toUpperCase());
  }

  getExcelDefinedNames(): FormulaExcelDefinedNameExport[] {
    const definedNames = this._options.excelDefinedNames;
    if (!Array.isArray(definedNames)) {
      return [];
    }

    return definedNames.filter((item) => !!item?.name && !!item?.refersTo).map((item) => ({ ...item }));
  }

  getExcelCustomFunctions(): FormulaExcelCustomFunctionExport[] {
    const customFunctions = this._options.excelCustomFunctions;
    if (!Array.isArray(customFunctions)) {
      return [];
    }

    return customFunctions
      .filter((item) => !!item?.name && Array.isArray(item.args) && !!item?.body)
      .map((item) => ({
        ...item,
        args: [...item.args],
      }));
  }

  /**
   * Translate AG-style long references into Excel A1 references.
   * Example: REF(COLUMN("price"),ROW("id_1")) -> C2
   */
  getExcelFormula(context: FormulaExcelExportContext): string | undefined {
    const originalFormula = this.getFormula(context.rowId, context.columnId);
    if (!originalFormula) {
      return undefined;
    }

    const normalizedFormula = originalFormula.startsWith('=') ? originalFormula.slice(1) : originalFormula;
    const allGridColumnIds = (this._grid?.getColumns?.() as Column[] | undefined)?.map((col) => String(col.id)) ?? [];
    const exportedColumnIds = context.columnIds.map((colId) => String(colId));
    const normalizedColumnIds = exportedColumnIds;
    const normalizedRowIds = context.rowIds.map((rowId) => String(rowId));
    // Canonicalize legacy A1 formulas first, then resolve every stable reference against
    // the actual exported column/row order. This keeps export independent from grid reordering.
    const stableFormula = this.convertA1ReferencesToStableRefs(normalizedFormula, allGridColumnIds, normalizedRowIds);
    const shiftedLegacyFormula = this.shiftDirectExcelReferences(
      stableFormula,
      allGridColumnIds,
      normalizedColumnIds,
      Math.max(0, context.excelRowOffset - 1)
    );

    const withNumericRowRefs = this.replaceRefFunctionsWithA1Refs(
      shiftedLegacyFormula,
      normalizedColumnIds,
      normalizedRowIds,
      context.excelRowOffset
    );

    return this.normalizeFormulaSyntax(
      this.applyFormulaReferenceAbsoluteFlags(this.buildStoreKey(context.rowId, context.columnId), withNumericRowRefs)
    );
  }

  /** Shift only direct A1 references left after stable references have been canonicalized. */
  protected shiftDirectExcelReferences(formula: string, gridColumnIds: string[], exportedColumnIds: string[], rowDelta: number): string {
    if (!formula || (rowDelta === 0 && gridColumnIds.length === 0)) {
      return formula;
    }

    const a1ReferenceRegex =
      /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])|(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])/gi;
    const remapEndpoint = (token: string): string => {
      const parsed = parseExcelReferenceCell(token);
      /* v8 ignore if - the A1 token regex guarantees that parsing succeeds */
      if (!parsed) {
        return token;
      }

      const sourceColumnId = gridColumnIds[parsed.cell];
      const exportedColumnIndex = sourceColumnId === undefined ? -1 : exportedColumnIds.indexOf(sourceColumnId);
      const sourceColumnName = token.replace(/\$/g, '').replace(/\d+$/, '').toUpperCase();
      const columnName = exportedColumnIndex >= 0 ? getExcelColumnNameByIndex(exportedColumnIndex + 1) : sourceColumnName;
      const rowMatch = token.match(/(\d+)$/);
      const rowNumber = rowMatch ? Number(rowMatch[1]) + rowDelta : parsed.row + 1 + rowDelta;
      const hasLeadingDollar = token.startsWith('$');
      const columnDollar = token.match(/^\$/) ? '$' : '';
      const rowDollar = /\$\d+$/.test(token) ? '$' : '';
      return `${hasLeadingDollar || columnDollar ? '$' : ''}${columnName}${rowDollar}${rowNumber}`;
    };

    return this.transformFormulaOutsideQuotedStrings(formula, (segment) =>
      segment.replace(a1ReferenceRegex, (reference) => {
        const [startToken, endToken] = reference.split(':', 2);
        const shiftedStart = remapEndpoint(startToken);
        return endToken ? `${shiftedStart}:${remapEndpoint(endToken)}` : shiftedStart;
      })
    );
  }

  protected buildStoreKey(rowId: number | string, columnId: number | string): string {
    return `${String(rowId)}::${String(columnId)}`;
  }

  protected buildEvaluationMemoKey(rowId: number | string, columnId: number | string, formula: string): string {
    return `${this.buildStoreKey(rowId, columnId)}::${formula.trim()}`;
  }

  protected getOrCreateEvaluationMemo(): Map<string, unknown> {
    if (!this._isEvaluationMemoFlushScheduled) {
      this._isEvaluationMemoFlushScheduled = true;
      Promise.resolve().then(() => {
        this._evaluationMemo.clear();
        this._isEvaluationMemoFlushScheduled = false;
      });
    }

    return this._evaluationMemo;
  }

  protected resetEvaluationMemo(): void {
    this._evaluationMemo.clear();
    this._isEvaluationMemoFlushScheduled = false;
  }

  protected getDatasetLength(): number {
    const dataViewAny = this._dataView as any;
    if (dataViewAny?.getLength && typeof dataViewAny.getLength === 'function') {
      return dataViewAny.getLength();
    }
    const items = dataViewAny?.getItems && typeof dataViewAny.getItems === 'function' ? dataViewAny.getItems() : [];
    return Array.isArray(items) ? items.length : 0;
  }

  protected getDataItems(): any[] {
    const dataViewAny = this._dataView as any;
    const items = dataViewAny?.getItems && typeof dataViewAny.getItems === 'function' ? dataViewAny.getItems() : [];
    return Array.isArray(items) ? items : [];
  }

  protected getDatasetIdPropertyName(): string {
    return this._grid?.getOptions?.().datasetIdPropertyName ?? 'id';
  }

  protected evaluateFormulaExpression(formula: string, context: FormulaEvaluationContext): unknown {
    const normalized = formula.trim().startsWith('=') ? formula.trim().slice(1) : formula.trim();
    if (!normalized) {
      return FORMULA_ERROR.NULL;
    }

    const normalizedSyntax = this.normalizeFormulaSyntax(
      this.replaceRefFunctionsWithA1Refs(
        normalized,
        ((this._grid?.getColumns?.() as Column[] | undefined) || []).map((col) => String(col.id)),
        this.getDataItems().map((item) => String(item?.[this.getDatasetIdPropertyName()] ?? '')),
        1
      )
    );

    let firstErrorCode: FormulaErrorCode | undefined;

    const expressionWithRanges = normalizedSyntax.replace(
      /\$?([A-Z]{1,3})\$?(\d+)\s*:\s*\$?([A-Z]{1,3})\$?(\d+)/gi,
      (_match, startCol: string, startRow: string, endCol: string, endRow: string) => {
        const rangeValues = this.resolveExcelRangeValues(startCol, Number(startRow), endCol, Number(endRow), context);
        const errorInRange = rangeValues.find((value) => isFormulaErrorCode(value));
        if (isFormulaErrorCode(errorInRange) && !firstErrorCode) {
          firstErrorCode = errorInRange;
        }
        return this.toExpressionArrayLiteral(rangeValues);
      }
    );

    const expressionWithValues = expressionWithRanges.replace(/\$?([A-Z]{1,3})\$?(\d+)/gi, (_match, colName: string, rowNumber: string) => {
      const resolved = this.resolveExcelReferenceValue(colName, Number(rowNumber), context);
      if (isFormulaErrorCode(resolved) && !firstErrorCode) {
        firstErrorCode = resolved;
      }
      return this.toExpressionLiteral(resolved);
    });

    if (firstErrorCode) {
      return firstErrorCode;
    }

    const jsExpression = expressionWithValues
      .replace(/<>/g, '!=')
      .replace(/\bTRUE\b/gi, 'true')
      .replace(/\bFALSE\b/gi, 'false')
      .replace(/(^|[^<>=!])=([^=])/g, '$1==$2');

    if (/[;{}\\`]/.test(jsExpression)) {
      return FORMULA_ERROR.ERROR;
    }

    const formulaFunctions = this.getFormulaFunctionRegistry();
    const expressionWithoutStrings = jsExpression.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '');
    const identifiers = expressionWithoutStrings.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
    const allowedIdentifiers = new Set<string>(['TRUE', 'FALSE', 'NULL', ...Array.from(formulaFunctions.keys())]);
    if (identifiers.some((id) => !allowedIdentifiers.has(id.toUpperCase()))) {
      return FORMULA_ERROR.NAME;
    }

    try {
      // The recursive-descent parser below implements the full supported grammar (operators, ranges,
      // whitelisted functions); it is used exclusively so no formula text is ever passed to a dynamic
      // code evaluator (e.g. `Function`/`eval`), which would otherwise be an unnecessary injection surface.
      return this.evaluateExpressionWithParser(jsExpression, formulaFunctions);
    } catch (error) {
      if (error instanceof ReferenceError) {
        return FORMULA_ERROR.NAME;
      }
      if (error instanceof TypeError) {
        return FORMULA_ERROR.VALUE;
      }
      if (error instanceof SyntaxError) {
        return FORMULA_ERROR.ERROR;
      }
      return FORMULA_ERROR.ERROR;
    }
  }

  protected evaluateExpressionWithParser(expression: string, formulaFunctions: Map<string, FormulaCallback>): unknown {
    type TokenType = 'number' | 'string' | 'identifier' | 'operator' | 'paren' | 'bracket' | 'comma' | 'eof';
    interface Token {
      type: TokenType;
      value: string;
    }

    const tokens: Token[] = [];
    const src = expression;
    let i = 0;

    const pushToken = (type: TokenType, value: string) => tokens.push({ type, value });

    while (i < src.length) {
      const ch = src[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++;
        let value = '';
        while (i < src.length) {
          const c = src[i];
          if (c === '\\' && i + 1 < src.length) {
            value += src[i + 1];
            i += 2;
            continue;
          }
          if (c === quote) {
            i++;
            break;
          }
          value += c;
          i++;
        }
        pushToken('string', value);
        continue;
      }

      if (/\d|\./.test(ch)) {
        let numberValue = ch;
        i++;
        while (i < src.length && /[\d.]/.test(src[i])) {
          numberValue += src[i];
          i++;
        }
        if (!/^\d*\.?\d+$/.test(numberValue)) {
          return FORMULA_ERROR.NUM;
        }
        pushToken('number', numberValue);
        continue;
      }

      if (/[A-Za-z_]/.test(ch)) {
        let ident = ch;
        i++;
        while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) {
          ident += src[i];
          i++;
        }
        pushToken('identifier', ident);
        continue;
      }

      const twoCharOp = src.slice(i, i + 2);
      if (['==', '!=', '<=', '>='].includes(twoCharOp)) {
        pushToken('operator', twoCharOp);
        i += 2;
        continue;
      }

      if (['+', '-', '*', '/', '<', '>', '^', '&', '%'].includes(ch)) {
        pushToken('operator', ch);
        i++;
        continue;
      }

      if (ch === '(' || ch === ')') {
        pushToken('paren', ch);
        i++;
        continue;
      }

      if (ch === '[' || ch === ']') {
        pushToken('bracket', ch);
        i++;
        continue;
      }

      if (ch === ',') {
        pushToken('comma', ch);
        i++;
        continue;
      }

      return FORMULA_ERROR.ERROR;
    }

    pushToken('eof', '');

    let cursor = 0;
    const peek = () => tokens[cursor];
    const consume = () => tokens[cursor++];
    const matchOperator = (...ops: string[]) => peek().type === 'operator' && ops.includes(peek().value);
    const matchParen = (p: '(' | ')') => peek().type === 'paren' && peek().value === p;
    const matchBracket = (b: '[' | ']') => peek().type === 'bracket' && peek().value === b;

    const parseExpression = (): unknown => parseComparison();

    const parseComparison = (): unknown => {
      let left = parseConcatenation();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('==', '!=', '<', '>', '<=', '>=')) {
        const op = consume().value;
        const right = parseConcatenation();
        if (isFormulaErrorCode(right)) {
          return right;
        }
        switch (op) {
          case '==':
            left = (left as any) == (right as any);
            break;
          case '!=':
            left = (left as any) != (right as any);
            break;
          case '<':
            left = (left as any) < (right as any);
            break;
          case '>':
            left = (left as any) > (right as any);
            break;
          case '<=':
            left = (left as any) <= (right as any);
            break;
          case '>=':
            left = (left as any) >= (right as any);
            break;
        }
      }
      return left;
    };

    const parseConcatenation = (): unknown => {
      let left = parseAdditive();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('&')) {
        consume();
        const right = parseAdditive();
        if (isFormulaErrorCode(right)) {
          return right;
        }
        left = `${left ?? ''}${right ?? ''}`;
      }
      return left;
    };

    const parseAdditive = (): unknown => {
      let left = parseMultiplicative();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('+', '-')) {
        const op = consume().value;
        const right = parseMultiplicative();
        if (isFormulaErrorCode(right)) {
          return right;
        }
        left = op === '+' ? FormulaService.addFormulaValues(left, right) : FormulaService.subtractFormulaValues(left, right);
        if (typeof left === 'number' && Number.isNaN(left)) {
          return FORMULA_ERROR.VALUE;
        }
      }
      return left;
    };

    const parseMultiplicative = (): unknown => {
      let left = parseUnary();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('*', '/')) {
        const op = consume().value;
        const right = parseUnary();
        if (isFormulaErrorCode(right)) {
          return right;
        }
        if (op === '/' && Number(right) === 0) {
          return FORMULA_ERROR.DIV0;
        }
        left = op === '*' ? (left as any) * (right as any) : (left as any) / (right as any);
        if (typeof left === 'number' && Number.isNaN(left)) {
          return FORMULA_ERROR.VALUE;
        }
      }
      return left;
    };

    const parsePower = (): unknown => {
      let left = parsePostfix();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('^')) {
        consume();
        const right = parseUnary();
        if (isFormulaErrorCode(right)) {
          return right;
        }
        left = Math.pow(Number(left), Number(right));
        if (typeof left === 'number' && Number.isNaN(left)) {
          return FORMULA_ERROR.NUM;
        }
      }
      return left;
    };

    const parsePostfix = (): unknown => {
      let value = parsePrimary();
      if (isFormulaErrorCode(value)) {
        return value;
      }
      while (matchOperator('%')) {
        consume();
        value = Number(value) / 100;
        if (typeof value === 'number' && Number.isNaN(value)) {
          return FORMULA_ERROR.VALUE;
        }
      }
      return value;
    };

    const parseUnary = (): unknown => {
      if (matchOperator('+')) {
        consume();
        const unary = parseUnary();
        if (isFormulaErrorCode(unary)) {
          return unary;
        }
        const numeric = Number(unary);
        return Number.isNaN(numeric) ? FORMULA_ERROR.VALUE : numeric;
      }
      if (matchOperator('-')) {
        consume();
        const unary = parseUnary();
        if (isFormulaErrorCode(unary)) {
          return unary;
        }
        const numeric = Number(unary);
        return Number.isNaN(numeric) ? FORMULA_ERROR.VALUE : -numeric;
      }
      return parsePower();
    };

    const parsePrimary = (): unknown => {
      const tk = peek();

      if (tk.type === 'number') {
        consume();
        return Number(tk.value);
      }

      if (tk.type === 'string') {
        consume();
        return tk.value;
      }

      if (tk.type === 'identifier') {
        const ident = consume().value;
        const upperIdent = ident.toUpperCase();
        if (matchParen('(')) {
          consume();
          const args: unknown[] = [];
          if (!matchParen(')')) {
            while (true) {
              args.push(parseExpression());
              if (peek().type === 'comma') {
                consume();
                continue;
              }
              break;
            }
          }

          if (!matchParen(')')) {
            return FORMULA_ERROR.ERROR;
          }
          consume();

          const fn = formulaFunctions.get(upperIdent);
          if (typeof fn !== 'function') {
            return FORMULA_ERROR.NAME;
          }
          const fnResult = fn(...args);
          return isFormulaErrorCode(fnResult) ? fnResult : fnResult;
        }

        if (upperIdent === 'TRUE') {
          return true;
        }
        if (upperIdent === 'FALSE') {
          return false;
        }
        if (upperIdent === 'NULL') {
          return null;
        }
        return FORMULA_ERROR.NAME;
      }

      if (matchParen('(')) {
        consume();
        const value = parseExpression();
        if (isFormulaErrorCode(value)) {
          return value;
        }
        if (!matchParen(')')) {
          return FORMULA_ERROR.ERROR;
        }
        consume();
        return value;
      }

      if (matchBracket('[')) {
        consume();
        const values: unknown[] = [];

        if (!matchBracket(']')) {
          while (true) {
            const value = parseExpression();
            if (isFormulaErrorCode(value)) {
              return value;
            }
            values.push(value);

            if (peek().type === 'comma') {
              consume();
              continue;
            }
            break;
          }
        }

        if (!matchBracket(']')) {
          return FORMULA_ERROR.ERROR;
        }
        consume();
        return values;
      }

      return FORMULA_ERROR.ERROR;
    };

    const output = parseExpression();
    if (isFormulaErrorCode(output)) {
      return output;
    }
    if (peek().type !== 'eof') {
      return FORMULA_ERROR.ERROR;
    }
    return output;
  }

  protected buildFormulaValueFormatter(column: Column): Formatter {
    const formulaValueFormatter: Formatter = (row, _cell, value, columnDef, dataContext) => {
      const currentRowItem =
        dataContext ??
        ((this._dataView as any)?.getItem && typeof (this._dataView as any).getItem === 'function'
          ? (this._dataView as any).getItem(row)
          : this.getDataItems()[row]);

      const rowIdProp = this.getDatasetIdPropertyName();
      const rowId = currentRowItem?.[rowIdProp] as number | string | undefined;
      const columnId = (columnDef?.id ?? column.id) as number | string;
      const field = (columnDef?.field ?? column.field ?? columnDef?.id ?? column.id) as string;
      const rawCellValue = currentRowItem?.[field as keyof typeof currentRowItem] ?? value;
      const fallbackValue = typeof rawCellValue === 'string' && rawCellValue.trim().startsWith('=') ? undefined : rawCellValue;

      const evaluatedValue = rowId !== undefined ? this.getEvaluatedCellValue(rowId, columnId, rawCellValue, fallbackValue) : rawCellValue;

      return evaluatedValue;
    };

    (formulaValueFormatter as any)[FormulaService.FORMULA_EVAL_FORMATTER_FLAG] = true;
    return formulaValueFormatter;
  }

  protected withFormulaFormatterPipeline(column: Column, formulaValueFormatter: Formatter): Pick<Column, 'formatter' | 'params'> {
    const existingFormatter = this.unwrapAutoEditableFormatter(column.formatter as Formatter | undefined);
    const existingParams = (column.params || {}) as Record<string, any>;

    if (!existingFormatter) {
      return {
        formatter: formulaValueFormatter,
        params: existingParams,
      };
    }

    if (existingFormatter === Formatters.multiple) {
      const formatters = Array.isArray(existingParams.formatters) ? [...existingParams.formatters] : [];
      const hasFormulaFormatter = formatters.some(
        (formatter: Formatter) => !!(formatter as any)?.[FormulaService.FORMULA_EVAL_FORMATTER_FLAG]
      );
      if (!hasFormulaFormatter) {
        formatters.unshift(formulaValueFormatter);
      }

      return {
        formatter: existingFormatter,
        params: {
          ...existingParams,
          formatters,
        },
      };
    }

    return {
      formatter: Formatters.multiple,
      params: {
        ...existingParams,
        formatters: [formulaValueFormatter, existingFormatter],
      },
    };
  }

  protected unwrapAutoEditableFormatter(formatter?: Formatter): Formatter | undefined {
    let currentFormatter = formatter as any;

    // Defensively unwrap previously auto-wrapped formatters to avoid recursive wrapping.
    while (currentFormatter?.__formulaAutoEditableWrapped && typeof currentFormatter?.__formulaAutoEditableBaseFormatter === 'function') {
      currentFormatter = currentFormatter.__formulaAutoEditableBaseFormatter;
    }

    return currentFormatter as Formatter | undefined;
  }

  /** Normalize common Excel-like operators into parser-friendly syntax. */
  protected normalizeFormulaSyntax(expression: string): string {
    if (!expression) {
      return expression;
    }

    return expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–—]/g, '-');
  }

  /** Return the complete logical column list, including hidden columns. */
  protected getFormulaColumnIds(): string[] {
    return ((this._grid?.getColumns?.() || []) as Column[]).map((column) => String(column.id));
  }

  /** Return the current DataView row identity list in display/evaluation order. */
  protected getFormulaRowIds(): string[] {
    return this.getDataItems()
      .map((item) => item?.[this.getDatasetIdPropertyName()])
      .filter((rowId) => rowId !== undefined && rowId !== null)
      .map((rowId) => String(rowId));
  }

  /**
   * Convert user-facing A1 references to stable AG-style references.
   * Quoted formula strings are intentionally ignored so values such as "A1" remain literals.
   */
  protected convertA1ReferencesToStableRefs(
    formula: string,
    columnIds: string[] = this.getFormulaColumnIds(),
    rowIds: string[] = this.getFormulaRowIds()
  ): string {
    if (!formula || columnIds.length === 0 || rowIds.length === 0) {
      return formula;
    }

    const a1ReferenceRegex =
      /(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])|(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])/gi;
    return this.transformFormulaOutsideQuotedStrings(formula, (segment) =>
      segment.replace(a1ReferenceRegex, (reference) => {
        const [startToken, endToken] = reference.split(':', 2);
        const startCell = parseExcelReferenceCell(startToken);
        const endCell = endToken ? parseExcelReferenceCell(endToken) : undefined;
        if (!startCell || (endToken && !endCell)) {
          return reference;
        }

        const startColumnId = columnIds[startCell.cell];
        const startRowId = rowIds[startCell.row];
        if (startColumnId === undefined || startRowId === undefined) {
          return reference;
        }

        const startRef = `REF(COLUMN(${JSON.stringify(startColumnId)}),ROW(${JSON.stringify(startRowId)}))`;
        if (!endCell) {
          return startRef;
        }

        const endColumnId = columnIds[endCell.cell];
        const endRowId = rowIds[endCell.row];
        if (endColumnId === undefined || endRowId === undefined) {
          return reference;
        }

        return `${startRef}:REF(COLUMN(${JSON.stringify(endColumnId)}),ROW(${JSON.stringify(endRowId)}))`;
      })
    );
  }

  /** Convert the persisted stable syntax to the A1 syntax shown in the editor. */
  protected toDisplayFormula(formula: string): string {
    return this.replaceRefFunctionsWithA1Refs(formula, this.getFormulaColumnIds(), this.getFormulaRowIds(), 1);
  }

  /** Convert editor A1 syntax to the stable syntax used by runtime storage and export. */
  protected toStoredFormula(formula: string): string {
    return this.convertA1ReferencesToStableRefs(formula);
  }

  /** Transform only formula text outside quoted string literals. */
  protected transformFormulaOutsideQuotedStrings(formula: string, transform: (segment: string) => string): string {
    const quotedTextRegex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
    let result = '';
    let previousEnd = 0;
    let match: RegExpExecArray | null;

    while ((match = quotedTextRegex.exec(formula)) !== null) {
      result += transform(formula.slice(previousEnd, match.index));
      result += match[0];
      previousEnd = match.index + match[0].length;
    }

    return result + transform(formula.slice(previousEnd));
  }

  /** Replace REF(COLUMN("x"),ROW(...)) expressions by concrete A1 references. */
  protected replaceRefFunctionsWithA1Refs(expression: string, columnIds: string[], rowIds: string[], excelRowOffset = 1): string {
    if (!expression) {
      return expression;
    }

    const withNamedRowRefs = expression.replace(
      /REF\(\s*COLUMN\("([^"]+)"\)\s*,\s*ROW\("([^"]+)"\)\s*\)/gi,
      (_match, columnId: string, rowId: string) => {
        const columnIdx = columnIds.indexOf(String(columnId));
        const rowIdx = rowIds.indexOf(String(rowId));
        if (columnIdx < 0 || rowIdx < 0) {
          return '';
        }

        const excelColName = getExcelColumnNameByIndex(columnIdx + 1);
        const excelRowNumber = rowIdx + excelRowOffset;
        return `${excelColName}${excelRowNumber}`;
      }
    );

    return withNamedRowRefs.replace(
      /REF\(\s*COLUMN\("([^"]+)"\)\s*,\s*ROW\((\d+)\)\s*\)/gi,
      (_match, columnId: string, rowNumber: string) => {
        const columnIdx = columnIds.indexOf(String(columnId));
        const rowIdx = Number(rowNumber);
        if (columnIdx < 0 || Number.isNaN(rowIdx)) {
          return '';
        }

        const excelColName = getExcelColumnNameByIndex(columnIdx + 1);
        const excelRowNumber = rowIdx + excelRowOffset - 1;
        return `${excelColName}${excelRowNumber}`;
      }
    );
  }

  protected normalizeCustomFunctionInput(functionInput: FormulaCustomFunctionInput): FormulaCallback | undefined {
    if (typeof functionInput === 'function') {
      return functionInput;
    }

    const definition = functionInput as FormulaCustomFunctionDefinition | undefined;
    if (!definition || typeof definition.func !== 'function') {
      return undefined;
    }

    return (...args: unknown[]) => {
      const flatValues: unknown[] = [];
      const flatten = (value: unknown): void => {
        if (Array.isArray(value)) {
          for (const nestedValue of value) {
            flatten(nestedValue);
          }
          return;
        }
        flatValues.push(value);
      };

      for (const arg of args) {
        flatten(arg);
      }

      return definition.func({ values: flatValues });
    };
  }

  protected resolveExcelRangeValues(
    startColName: string,
    startRowNumber: number,
    endColName: string,
    endRowNumber: number,
    context: FormulaEvaluationContext
  ): unknown[] {
    const startColIdx = getExcelColumnIndexByName(startColName.toUpperCase());
    const endColIdx = getExcelColumnIndexByName(endColName.toUpperCase());
    if (startColIdx < 0 || endColIdx < 0) {
      return [];
    }

    const minColIdx = Math.min(startColIdx, endColIdx);
    const maxColIdx = Math.max(startColIdx, endColIdx);
    const minRowNumber = Math.max(1, Math.min(startRowNumber, endRowNumber));
    const maxRowNumber = Math.max(startRowNumber, endRowNumber);
    const rowCount = maxRowNumber - minRowNumber + 1;
    const cellCount = maxColIdx - minColIdx + 1;
    if (!Number.isSafeInteger(rowCount) || !Number.isSafeInteger(cellCount) || rowCount * cellCount > FORMULA_MAX_REFERENCE_CELLS) {
      return [FORMULA_ERROR.REF];
    }
    const rangeValues: unknown[] = [];

    for (let rowNumber = minRowNumber; rowNumber <= maxRowNumber; rowNumber++) {
      for (let colIdx = minColIdx; colIdx <= maxColIdx; colIdx++) {
        const colName = getExcelColumnNameByIndex(colIdx + 1);
        rangeValues.push(this.resolveExcelReferenceValue(colName, rowNumber, context));
      }
    }

    return rangeValues;
  }

  protected getFormulaFunctionRegistry(): Map<string, FormulaCallback> {
    return createFormulaFunctionRegistry(this._customFunctions);
  }

  protected toExpressionArrayLiteral(values: unknown[]): string {
    return `[${values.map((value) => this.toExpressionLiteral(value)).join(',')}]`;
  }

  protected static addFormulaValues(left: unknown, right: unknown): unknown {
    if (left instanceof Date && typeof right === 'number') {
      return FormulaService.addDays(left, right);
    }
    if (right instanceof Date && typeof left === 'number') {
      return FormulaService.addDays(right, left);
    }
    return (left as any) + (right as any);
  }

  protected static subtractFormulaValues(left: unknown, right: unknown): unknown {
    if (left instanceof Date && typeof right === 'number') {
      return FormulaService.addDays(left, -right);
    }
    if (left instanceof Date && right instanceof Date) {
      return (left.getTime() - right.getTime()) / (1000 * 60 * 60 * 24);
    }
    return (left as any) - (right as any);
  }

  protected static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  protected resolveExcelReferenceValue(colName: string, rowNumber: number, context: FormulaEvaluationContext): unknown {
    const colIdx = getExcelColumnIndexByName(colName.toUpperCase());
    if (colIdx < 0 || Number.isNaN(rowNumber) || rowNumber < 1) {
      return FORMULA_ERROR.REF;
    }

    const columns = (this._grid?.getColumns?.() || []) as Column[];
    const column = columns[colIdx];
    const item = this.getDataItems()[rowNumber - 1];
    if (!column || !item) {
      return FORMULA_ERROR.REF;
    }

    const rowIdProp = this.getDatasetIdPropertyName();
    const rowId = item[rowIdProp] as number | string;
    const columnId = column.id as number | string;
    const field = (column.field ?? column.id) as string;
    const rawValue = item[field as keyof typeof item];

    if (typeof rawValue === 'string' && rawValue.trim().startsWith('=')) {
      const key = this.buildStoreKey(rowId, columnId);
      if (context.visited.has(key)) {
        return FORMULA_ERROR.REF;
      }

      const nestedFormula = this.getFormula(rowId, columnId) ?? rawValue;
      const nestedMemoKey = this.buildEvaluationMemoKey(rowId, columnId, nestedFormula);
      if (context.memo.has(nestedMemoKey)) {
        return context.memo.get(nestedMemoKey);
      }

      context.visited.add(key);
      const nested = this.evaluateFormulaExpression(nestedFormula, context);
      context.visited.delete(key);
      context.memo.set(nestedMemoKey, nested);
      return nested;
    }

    return rawValue;
  }

  protected getCellRawValue(rowId: number | string, columnId: number | string): unknown {
    const rowIdProp = this.getDatasetIdPropertyName();
    const item = this.getDataItems().find((it) => String(it?.[rowIdProp]) === String(rowId));
    if (!item) {
      return undefined;
    }

    const column = ((this._grid?.getColumns?.() || []) as Column[]).find((col) => String(col.id) === String(columnId));
    if (!column) {
      return undefined;
    }

    const field = (column.field ?? column.id) as string;
    return item[field as keyof typeof item];
  }

  protected toExpressionLiteral(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '0';
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : '0';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed;
      }
      return JSON.stringify(trimmed);
    }

    return JSON.stringify(String(value));
  }

  protected autoAssignFormulaEditorToColumns(): void {
    if (this._options.autoAssignEditor === false || !this._grid?.getColumns || !this._grid?.setColumns) {
      return;
    }

    const autoEditableFormatter = this._grid.getOptions?.().autoAddCustomEditorFormatter as Formatter | undefined;
    const columns = (this._grid.getColumns?.() || []) as Column[];
    const formulaFunctionNames = Array.from(this.getFormulaFunctionRegistry().keys()).sort((a, b) => a.localeCompare(b));
    let hasChanges = false;

    const updatedColumns = columns.map((column) => {
      if (!column?.allowFormula) {
        return column;
      }

      const columnEditor = (column.editor || {}) as ColumnEditor;
      const hasEditorModel = !!columnEditor.model;

      if (hasEditorModel && columnEditor.model !== FormulaCellEditor) {
        return column;
      }

      const mergedParams = {
        ...(this._options.editorParams || {}),
        ...(columnEditor.params || {}),
      } as FormulaEditorParams;

      if (!Array.isArray(mergedParams.formulaFunctionList) || mergedParams.formulaFunctionList.length === 0) {
        mergedParams.formulaFunctionList = formulaFunctionNames;
      }

      const userOnFormulaInputChange = mergedParams.onFormulaInputChange;
      mergedParams.onFormulaInputChange = (formula: string) => {
        userOnFormulaInputChange?.(formula);
      };
      mergedParams.toDisplayFormula = (formula: string, item?: any) => {
        const rowId = item?.[this.getDatasetIdPropertyName()] as number | string | undefined;
        return rowId === undefined || rowId === null
          ? this.toDisplayFormula(formula)
          : this.toDisplayFormulaForCell(formula, rowId, column.id);
      };
      mergedParams.toStoredFormula = (formula: string, item?: any) => {
        const rowId = item?.[this.getDatasetIdPropertyName()] as number | string | undefined;
        const storedFormula = this.toStoredFormula(formula);
        if (rowId !== undefined && rowId !== null && this.containsDirectExcelReference(formula)) {
          this.captureFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, column.id), formula);
        }
        return storedFormula;
      };
      mergedParams.onFormulaCommit = (formula: string, item?: any) => {
        const rowId = item?.[this.getDatasetIdPropertyName()] as number | string | undefined;
        if (rowId !== undefined && rowId !== null) {
          this.setFormula(rowId, column.id, formula);
        }
      };

      const formulaValueFormatter = this.buildFormulaValueFormatter(column);
      const { formatter: pipelineFormatter, params: pipelineParams } = this.withFormulaFormatterPipeline(column, formulaValueFormatter);

      let nextFormatter = pipelineFormatter;
      const alreadyWrapped = !!(nextFormatter as any)?.__formulaAutoEditableWrapped;

      if (!alreadyWrapped) {
        const basePipelineFormatter = pipelineFormatter;
        const wrappedFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
          const formattedValue = basePipelineFormatter ? basePipelineFormatter(row, cell, value, columnDef, dataContext, grid) : value;
          const baseValue = formattedValue === undefined ? value : formattedValue;

          if (typeof autoEditableFormatter === 'function') {
            return autoEditableFormatter(row, cell, baseValue, columnDef, dataContext, grid);
          }

          // Fallback behavior: still show editable UI marker when formula feature is enabled.
          const isGridEditable = !!grid?.getOptions?.().editable;
          const isFormulaCell = !!columnDef?.allowFormula;
          if (!isGridEditable || !isFormulaCell) {
            return baseValue;
          }

          const divElm = createDomElement('div', { className: 'editing-field' });
          if (baseValue instanceof HTMLElement) {
            divElm.appendChild(baseValue);
          } else {
            divElm.textContent = baseValue === null || baseValue === undefined ? '' : String(baseValue);
          }
          return divElm;
        };
        (wrappedFormatter as any).__formulaAutoEditableWrapped = true;
        (wrappedFormatter as any).__formulaAutoEditableBaseFormatter = basePipelineFormatter;
        nextFormatter = wrappedFormatter;
      }

      if (!this._originalColumnDefsById.has(column.id)) {
        this._originalColumnDefsById.set(column.id, {
          formatter: column.formatter,
          params: column.params,
          editorClass: column.editorClass,
          editor: column.editor,
        });
      }

      hasChanges = true;
      return {
        ...column,
        formatter: nextFormatter,
        params: pipelineParams,
        editorClass: FormulaCellEditor,
        editor: {
          ...columnEditor,
          model: FormulaCellEditor,
          params: mergedParams,
        },
      };
    });

    if (hasChanges) {
      this._hasAutoAssignedFormulaEditor = true;
      this._grid.setColumns(updatedColumns as Column[]);
      this._grid.invalidate?.();
      this._grid.render?.();
    }
  }

  /** Restore columns to their pre-plugin formatter/editor definitions (mirrors {@link disableExcelHeaderPrefix}). */
  protected restoreAutoAssignedFormulaEditorColumns(): void {
    if (
      !this._hasAutoAssignedFormulaEditor ||
      !this._grid?.getColumns ||
      !this._grid?.setColumns ||
      this._originalColumnDefsById.size === 0
    ) {
      return;
    }

    const columns = (this._grid.getColumns() || []) as Column[];
    const restoredColumns = columns.map((column) => {
      const original = this._originalColumnDefsById.get(column.id);
      if (!original) {
        return column;
      }
      return { ...column, ...original };
    });

    this._grid.setColumns(restoredColumns as Column[]);
    this._grid.invalidate?.();
    this._grid.render?.();
    this._originalColumnDefsById.clear();
    this._hasAutoAssignedFormulaEditor = false;
  }
}
