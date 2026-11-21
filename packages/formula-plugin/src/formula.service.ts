import type {
  Aggregator,
  Column,
  ColumnEditor,
  ContainerService,
  ExternalResource,
  Formatter,
  FormulaExcelCustomFunctionExport,
  FormulaExcelDefinedNameExport,
  FormulaExcelExportContext,
  FormulaProvider,
  OnCellChangeEventArgs,
  OnDragReplaceCellsEventArgs,
  SlickDataView,
  SlickGrid,
} from '@slickgrid-universal/common';
import { createDomElement, Formatters, SlickEventHandler } from '@slickgrid-universal/common';
import { FORMULA_ERROR, isFormulaErrorCode } from './formula-errors.js';
import {
  calculateFormulaPower,
  createFormulaFunctionRegistry,
  formulaDateToSerial,
  formulaLogicalCondition,
  formulaReference,
  unwrapFormulaReference,
  type FormulaCallback,
} from './formula-functions.js';
import {
  compactFormulaRange,
  expandFormulaRanges,
  getFormulaRangeWidth,
  mapFormulaRanges,
  normalizeSumIfRangeDimensions,
  parseFormulaFunctionArguments,
  rewriteExcelHelperCounta,
} from './formula-range.js';
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

const FORMULA_EMPTY_RESULT = Symbol('formula empty result');

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

/**
 * Optional formula service storing formulas by row/column and exposing export helpers.
 * This MVP focuses on formula storage and Excel conversion support.
 */
export class FormulaService implements ExternalResource, FormulaProvider {
  readonly pluginName = 'FormulaService';
  readonly supportsGroupedFormulaExport = true;

  protected _grid!: SlickGrid;
  protected _dataView!: SlickDataView;
  protected _customFunctions: Map<string, FormulaCallback> = new Map<string, FormulaCallback>();
  protected _formulaStore: Map<string, string> = new Map<string, string>();
  protected _formulaCoordinatesByKey: Map<string, { rowId: number | string; columnId: number | string }> = new Map();
  protected _formulaReferenceAbsoluteFlagsByKey: Map<string, FormulaReferenceAbsoluteFlags[]> = new Map();
  protected _restoredFormulaKeys: Set<string> = new Set();
  protected _formulaRefColorCache: FormulaReferenceColorCache = new FormulaReferenceColorCache();
  protected _originalColumnNamesById: Map<number | string, string | HTMLElement | DocumentFragment | undefined> = new Map();
  protected _isExcelHeaderPrefixEnabled = false;
  protected _hasWarnedSelectionPrerequisite = false;
  protected _hasAutoAssignedFormulaEditor = false;
  protected _originalColumnDefsById: Map<number | string, Pick<Column, 'formatter' | 'params' | 'editorClass' | 'editor'>> = new Map();
  protected _evaluationMemo: Map<string, unknown> = new Map<string, unknown>();
  protected _isEvaluationMemoFlushScheduled = false;
  protected _formulaRefreshGeneration = 0;
  protected _formulaRefreshScheduled = false;
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
    this._formulaRefreshGeneration++;
    this._formulaRefreshScheduled = false;
    this._grid = grid;
    this._dataView = grid?.getData<SlickDataView>() || {};

    // Respect explicit grid opt-out; when disabled, the service stays inert.
    if (grid?.getOptions?.().enableFormulas === false) {
      return;
    }

    if (this._grid.onDragReplaceCells) {
      this._eventHandler.subscribe(this._grid.onDragReplaceCells, this.handleDragReplaceCells.bind(this));
    }
    if (this._grid.onCellChange) {
      this._eventHandler.subscribe(this._grid.onCellChange, this.handleCellChange.bind(this));
    }

    if (this._options.customFunctions) {
      this.registerCustomFunctions(this._options.customFunctions);
    }

    if (this._options.autoSyncFormulasFromDataset !== false) {
      this.syncFormulasFromDataset();
    }
    this.canonicalizeStoredFormulas();

    this.autoAssignFormulaEditorToColumns();
    if (this._grid.onBeforeSetColumns) {
      this._eventHandler.subscribe(this._grid.onBeforeSetColumns, (_event, args) => {
        this.autoAssignFormulaEditorToColumns(args.newColumns);
      });
    }
    this.validateSelectionModelPrerequisites();
  }

  /** Keep the store synchronized when a non-formula editor changes a formula-enabled cell. */
  protected handleCellChange(_event: unknown, args: OnCellChangeEventArgs): void {
    this.resetEvaluationMemo();
    const column = args?.column;
    const item = args?.item;
    if (this._formulaStore.size || column?.allowFormula) {
      this.scheduleFormulaRefresh();
    }
    const metadataColumns = this._dataView?.getItemMetadata?.(args?.row)?.columns;
    const metadataEditor =
      column && metadataColumns && (metadataColumns[column.id]?.editorClass ?? metadataColumns[args.cell]?.editorClass);
    const editor = metadataEditor ?? column?.editorClass ?? column?.editor?.model;
    const activeEditor = this._grid.getCellEditor?.();
    const isFormulaEditor = activeEditor ? activeEditor instanceof FormulaCellEditor : editor === FormulaCellEditor;
    if (!column?.allowFormula || !item || isFormulaEditor) {
      return;
    }
    const rowId = item[this.getDatasetIdPropertyName()] as number | string | undefined;
    if (rowId === undefined || rowId === null) {
      return;
    }
    const value = item[String(column.field ?? column.id)];
    if (typeof value === 'string' && value.trim().startsWith('=')) {
      const formula = value.trim();
      const rows = this.getGroupedDisplayRowIds();
      if (rows) {
        this.captureFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, column.id), formula, rows);
        this.setFormula(rowId, column.id, this.convertA1ReferencesToStableRefs(formula, this.getFormulaColumnIds(), rows, true));
      } else {
        this.setFormula(rowId, column.id, formula);
      }
    } else {
      this.removeFormula(rowId, column.id);
    }
  }

  /** Grid commits render before onCellChange; refresh after the editor has closed. */
  protected scheduleFormulaRefresh(): void {
    if (this._formulaRefreshScheduled) {
      return;
    }
    this._formulaRefreshScheduled = true;
    const generation = this._formulaRefreshGeneration;
    queueMicrotask(() => {
      if (generation !== this._formulaRefreshGeneration) {
        return;
      }
      this._formulaRefreshScheduled = false;
      if (this._dataView?.getGrouping?.().length) {
        this._dataView.refresh?.();
      }
      this._grid.invalidate?.();
      this._grid.render?.();
    });
  }

  dispose(): void {
    this._formulaRefreshGeneration++;
    this._formulaRefreshScheduled = false;
    this._eventHandler.unsubscribeAll();
    this.clearFormulaReferenceHighlights();
    this.disableExcelHeaderPrefix();
    this.restoreAutoAssignedFormulaEditorColumns();
    this._formulaStore.clear();
    this._formulaCoordinatesByKey.clear();
    this._formulaReferenceAbsoluteFlagsByKey.clear();
    this._restoredFormulaKeys.clear();
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
      this.getGroupedDisplayRowIds() ?? this.getFormulaRowIds(),
      1,
      true
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
    this._restoredFormulaKeys.clear();
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
    const storedFormulaIsStable =
      !!normalizedStoredFormula &&
      (/\bREF\(\s*COLUMN\(/i.test(normalizedStoredFormula) || this._restoredFormulaKeys.has(this.buildStoreKey(rowId, columnId)));
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
      const errorValue = FORMULA_ERROR.NUM;
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
      this._formulaReferenceAbsoluteFlagsByKey.delete(key);
      this._restoredFormulaKeys.delete(key);
      this.resetEvaluationMemo();
    }
    return wasDeleted;
  }

  /** Capture the stable formula and its absolute reference flags for persistence. */
  getFormulaSnapshot(rowId: number | string, columnId: number | string): FormulaCellSnapshot | undefined {
    const key = this.buildStoreKey(rowId, columnId);
    const formula = this._formulaStore.get(key);
    return formula === undefined
      ? undefined
      : { version: 1, formula, referenceFlags: (this._formulaReferenceAbsoluteFlagsByKey.get(key) ?? []).map((flag) => ({ ...flag })) };
  }

  /** Capture all stored formulas for saving alongside a grid state or preset. */
  getFormulaStoreSnapshot(): FormulaStoreSnapshot {
    const cells: FormulaStoreSnapshot['cells'] = [];
    for (const { rowId, columnId } of this._formulaCoordinatesByKey.values()) {
      const snapshot = this.getFormulaSnapshot(rowId, columnId);
      if (snapshot) {
        cells.push({ rowId, columnId, ...snapshot });
      }
    }
    return { version: 1, cells };
  }

  /** Replace the formula store atomically. Existing dataset values are not modified. */
  setFormulaStoreSnapshot(snapshot: FormulaStoreSnapshot): void {
    if (!this._grid) {
      throw new Error('Initialize FormulaService before restoring formula snapshots');
    }
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.cells)) {
      throw new TypeError('Invalid formula store snapshot');
    }

    const formulas = new Map<string, string>();
    const coordinates = new Map<string, { rowId: number | string; columnId: number | string }>();
    const flags = new Map<string, FormulaReferenceAbsoluteFlags[]>();
    const validId = (id: unknown): id is number | string =>
      (typeof id === 'string' && id.length > 0) || (typeof id === 'number' && Number.isFinite(id));
    for (const cell of snapshot.cells) {
      if (!cell || !validId(cell.rowId) || !validId(cell.columnId) || !this.isValidFormulaCellSnapshot(cell)) {
        throw new TypeError('Invalid formula store snapshot');
      }
      const key = this.buildStoreKey(cell.rowId, cell.columnId);
      if (formulas.has(key)) {
        throw new TypeError('Duplicate formula cell in snapshot');
      }
      formulas.set(key, this.toStoredFormula(cell.formula));
      coordinates.set(key, { rowId: cell.rowId, columnId: cell.columnId });
      flags.set(
        key,
        cell.referenceFlags.map((flag) => ({ ...flag }))
      );
    }

    this._formulaStore = formulas;
    this._formulaCoordinatesByKey = coordinates;
    this._formulaReferenceAbsoluteFlagsByKey = flags;
    this._restoredFormulaKeys = new Set(formulas.keys());
    this.resetEvaluationMemo();
  }

  /** Restore a snapshot after the referenced data and columns have been initialized. */
  setFormulaSnapshot(rowId: number | string, columnId: number | string, snapshot: FormulaCellSnapshot): void {
    if (!this.isValidFormulaCellSnapshot(snapshot)) {
      throw new TypeError('Invalid formula cell snapshot');
    }
    this.setFormula(rowId, columnId, snapshot.formula);
    this._formulaReferenceAbsoluteFlagsByKey.set(
      this.buildStoreKey(rowId, columnId),
      snapshot.referenceFlags.map((flag) => ({ ...flag }))
    );
    this._restoredFormulaKeys.add(this.buildStoreKey(rowId, columnId));
  }

  protected isValidFormulaCellSnapshot(snapshot: FormulaCellSnapshot): boolean {
    return (
      snapshot?.version === 1 &&
      typeof snapshot.formula === 'string' &&
      snapshot.formula.trim().startsWith('=') &&
      Array.isArray(snapshot.referenceFlags) &&
      snapshot.referenceFlags.every((flag) => typeof flag?.column === 'boolean' && typeof flag?.row === 'boolean')
    );
  }

  setFormula(rowId: number | string, columnId: number | string, formula?: string | null): void {
    const key = this.buildStoreKey(rowId, columnId);
    this._restoredFormulaKeys.delete(key);
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
    const groupedRows = this.getGroupedDisplayRowIds();
    const toStoredFormula = (formula: string) =>
      groupedRows
        ? this.convertA1ReferencesToStableRefs(formula, this.getFormulaColumnIds(), groupedRows, true)
        : this.toStoredFormula(formula);
    handleFormulaDragFill(args, {
      grid: this._grid,
      dataView: this._dataView,
      getDatasetIdPropertyName: this.getDatasetIdPropertyName.bind(this),
      getFormula: this.getFormula.bind(this),
      setFormula: (rowId, columnId, formula) => {
        if (formula && groupedRows) {
          this.captureFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, columnId), formula, groupedRows);
          this.setFormula(rowId, columnId, toStoredFormula(formula));
        } else {
          this.setFormula(rowId, columnId, formula);
        }
      },
      toStoredFormula,
      toDisplayFormulaForCell: (formula, rowId, columnId) => this.toDisplayFormulaForCell(formula, rowId, columnId, !!groupedRows),
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

  protected captureFormulaReferenceAbsoluteFlags(key: string, formula: string, rowIds?: Array<string | undefined>): void {
    const previousFlags = this._formulaReferenceAbsoluteFlagsByKey.get(key) ?? [];
    const flags: FormulaReferenceAbsoluteFlags[] = [];
    const tokens =
      /REF\(\s*COLUMN\("(?:\\.|[^"\\])*"\)\s*,\s*ROW\("(?:\\.|[^"\\])*"\)\s*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])/gi;
    const expanded = expandFormulaRanges(this.normalizeFormulaRangeDimensions(formula), (row) => !rowIds || rowIds[row] !== undefined);
    expanded.replace(tokens, (token) => {
      if (/^REF\(/i.test(token)) {
        flags.push(previousFlags[flags.length] ?? { column: false, row: false });
      } else if (!/^["']/.test(token)) {
        const match = token.match(/^(\$?)[A-Z]{1,3}(\$?)(\d+)$/i)!;
        flags.push({ column: match[1] === '$', row: match[2] === '$' });
      }
      return token;
    });
    this._formulaReferenceAbsoluteFlagsByKey.set(key, flags);
  }

  protected toDisplayFormulaForCell(formula: string, rowId: number | string, columnId: number | string, useGroupedRows = false): string {
    const groupedRows = useGroupedRows ? this.getGroupedDisplayRowIds() : undefined;
    const storedFormula = this.getFormula(rowId, columnId);
    const sourceFormula = storedFormula ?? formula;
    const displayFormula = groupedRows
      ? this.replaceRefFunctionsWithA1Refs(sourceFormula, this.getFormulaColumnIds(), groupedRows, 1, true)
      : this.toDisplayFormula(sourceFormula);
    return mapFormulaRanges(
      this.applyFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, columnId), displayFormula),
      (members) => compactFormulaRange(members) ?? `REFRANGE(${members.join(',')})`
    );
  }

  protected applyFormulaReferenceAbsoluteFlags(key: string, formula: string): string {
    const flags = this._formulaReferenceAbsoluteFlagsByKey.get(key);
    if (!flags?.length) {
      return formula;
    }

    const tokens =
      /REF\(\s*COLUMN\("(?:\\.|[^"\\])*"\)\s*,\s*ROW\("(?:\\.|[^"\\])*"\)\s*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![A-Za-z0-9_])\$?[A-Z]{1,3}\$?\d+(?![A-Za-z0-9_])/gi;
    let flagIndex = 0;
    return formula.replace(tokens, (token) => {
      if (/^REF\(/i.test(token)) {
        flagIndex++;
        return token;
      }
      if (/^["']/.test(token)) {
        return token;
      }
      const flag = flags[flagIndex++];
      if (!flag) {
        return token;
      }
      const parsed = token.match(/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/i)!;
      return `${flag.column ? '$' : ''}${parsed[2].toUpperCase()}${flag.row ? '$' : ''}${parsed[4]}`;
    });
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

  /** Adapt a standard grouping aggregator to consume calculated cell values without modifying dataset records. */
  createGroupingAggregator(aggregator: Aggregator, columnId: number | string = aggregator.field): Aggregator {
    return {
      field: aggregator.field,
      type: aggregator.type,
      get isInitialized() {
        return aggregator.isInitialized;
      },
      init: (item, isTreeAggregator) => {
        this.resetEvaluationMemo();
        aggregator.init(item, isTreeAggregator);
      },
      accumulate: (item, isTreeParent) => {
        const rowId = item?.[this.getDatasetIdPropertyName()];
        const value = item?.[aggregator.field];
        const resolvedItem =
          rowId == null
            ? item
            : {
                ...item,
                [aggregator.field]: this.getEvaluatedCellValue(rowId, columnId, value, value),
              };
        aggregator.accumulate?.(resolvedItem, isTreeParent);
      },
      storeResult: (totals) => aggregator.storeResult(totals),
    };
  }

  registerCustomFunction(functionName: string, functionInput: FormulaCustomFunctionInput): void {
    const normalizedCallback = this.normalizeCustomFunctionInput(functionInput);
    if (!normalizedCallback) {
      return;
    }
    this._customFunctions.set(functionName.toUpperCase(), normalizedCallback);
    this.resetEvaluationMemo();
    if (this._formulaStore.size && this._grid) {
      this.scheduleFormulaRefresh();
    }
  }

  registerCustomFunctions(customFunctions: Record<string, FormulaCustomFunctionInput>): void {
    for (const [functionName, functionInput] of Object.entries(customFunctions || {})) {
      this.registerCustomFunction(functionName, functionInput);
    }
  }

  unregisterCustomFunction(functionName: string): boolean {
    const removed = this._customFunctions.delete(functionName.toUpperCase());
    if (removed) {
      this.resetEvaluationMemo();
      if (this._formulaStore.size && this._grid) {
        this.scheduleFormulaRefresh();
      }
    }
    return removed;
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
    const columns = context.columnIds.map(String);
    const rowPositions =
      context.groupedRowPositions ?? new Map(context.rowIds.map((id, index) => [String(id), index + context.excelRowOffset]));
    const stableFormula = this.toStoredFormula(normalizedFormula);
    if (context.groupedRowPositions && this.containsDirectExcelReference(stableFormula)) {
      return undefined;
    }
    let mapped = stableFormula.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|REF\(\s*COLUMN\(("(?:\\.|[^"\\])*")\)\s*,\s*ROW\(("(?:\\.|[^"\\])*")\)\s*\)/gi,
      (token, columnId?: string, rowId?: string) => {
        if (!columnId) {
          return token;
        }
        const column = columns.indexOf(JSON.parse(columnId));
        const row = rowPositions.get(JSON.parse(rowId!));
        return column < 0 || row === undefined
          ? FORMULA_ERROR.REF
          : `${getExcelColumnNameByIndex(column + 1 + (context.groupedColumnOffset ?? 0))}${row}`;
      }
    );
    let hasUnmappedRef = false;
    this.transformFormulaOutsideQuotedStrings(mapped, (segment) => {
      hasUnmappedRef ||= /\bREF\s*\(/i.test(segment);
      return segment;
    });
    if (context.groupedRowPositions && hasUnmappedRef) {
      return undefined;
    }
    // Numeric ROW(n) and legacy A1 references remain supported for ungrouped exports.
    if (!context.groupedRowPositions) {
      if (mapped === stableFormula) {
        mapped = this.shiftDirectExcelReferences(mapped, this.getFormulaColumnIds(), columns, Math.max(0, context.excelRowOffset - 1));
      }
      mapped = this.replaceRefFunctionsWithA1Refs(mapped, columns, context.rowIds.map(String), context.excelRowOffset);
    }
    let hasMissing = false;
    this.transformFormulaOutsideQuotedStrings(mapped, (segment) => {
      hasMissing ||= segment.includes(FORMULA_ERROR.REF);
      return segment;
    });
    if (context.groupedRowPositions && hasMissing) {
      return FORMULA_ERROR.REF;
    }
    mapped = this.applyFormulaReferenceAbsoluteFlags(this.buildStoreKey(context.rowId, context.columnId), mapped);
    const helpers = new Map<string, () => string>();
    const output = mapFormulaRanges(mapped, (members) => {
      if (members.includes(FORMULA_ERROR.REF)) {
        return FORMULA_ERROR.REF;
      }
      const contiguous = compactFormulaRange(members);
      if (contiguous) {
        return contiguous;
      }
      const width = getFormulaRangeWidth(members);
      const helper =
        (width > 1 ? context.registerFormulaRange?.(members, width) : context.registerFormulaRange?.(members)) ?? FORMULA_ERROR.REF;
      if (helper !== FORMULA_ERROR.REF) {
        helpers.set(helper, () => {
          const presence =
            width > 1 ? context.registerFormulaPresenceRange?.(members, width) : context.registerFormulaPresenceRange?.(members);
          if (presence) {
            return presence === FORMULA_ERROR.REF ? presence : `SUM(${presence})`;
          }
          const chunks: string[] = [];
          for (let i = 0; i < members.length; i += 255) {
            chunks.push(`COUNTA(${members.slice(i, i + 255).join(',')})`);
          }
          return chunks.join('+');
        });
      }
      return helper;
    });
    const rewritten = this.transformFormulaOutsideQuotedStrings(
      this.normalizeFormulaSyntax(rewriteExcelHelperCounta(output, helpers)),
      (segment) =>
        segment.replace(/(?<![\w.])(RANDOM|RAN|CONCATENATE)(?=\s*\()/gi, (name: string) =>
          this._customFunctions.has(name.toUpperCase()) ? name : name.toUpperCase() === 'CONCATENATE' ? 'CONCAT' : 'RAND'
        )
    );
    return rewritten.length > 8192 ? FORMULA_ERROR.REF : rewritten;
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
    return JSON.stringify([String(rowId), String(columnId)]);
  }

  protected buildEvaluationMemoKey(rowId: number | string, columnId: number | string, formula: string): string {
    return JSON.stringify([this.buildStoreKey(rowId, columnId), formula.trim()]);
  }

  /** Share dependency results only within one evaluation; DataView data can change synchronously. */
  protected getOrCreateEvaluationMemo(): Map<string, unknown> {
    return new Map();
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
    const formulaBody = formula.trim().startsWith('=') ? formula.trim().slice(1) : formula.trim();
    const normalized = this.normalizeFormulaRangeDimensions(formulaBody);
    if (!normalized) {
      return FORMULA_ERROR.NULL;
    }

    let hasUnsafeInput = false;
    this.transformFormulaOutsideQuotedStrings(normalized, (segment) => {
      hasUnsafeInput ||= /[;{}\\`]/.test(segment);
      return segment;
    });
    if (hasUnsafeInput) {
      return FORMULA_ERROR.PARSE;
    }
    const formulaFunctions = this.getFormulaFunctionRegistry();
    const lazyExpression = this._customFunctions.has('IF') ? normalized : this.replaceLazyIfCalls(normalized, context, formulaFunctions);
    const normalizedSyntax = this.normalizeFormulaSyntax(
      this.replaceRefFunctionsWithA1Refs(
        lazyExpression,
        ((this._grid?.getColumns?.() as Column[] | undefined) || []).map((col) => String(col.id)),
        this.getDataItems().map((item) => String(item?.[this.getDatasetIdPropertyName()] ?? '')),
        1
      )
    );

    let hasMissingReference = false;
    this.transformFormulaOutsideQuotedStrings(normalizedSyntax, (segment) => {
      hasMissingReference ||= segment.includes(FORMULA_ERROR.REF);
      return segment;
    });
    if (hasMissingReference) {
      return FORMULA_ERROR.REF;
    }

    const references = new Map<string, unknown>();
    let referenceSequence = 0;
    const referenceLiteral = (value: unknown, row?: number) => {
      let name: string;
      do {
        name = `__FORMULA_CELL_${referenceSequence++}`;
      } while (normalizedSyntax.toUpperCase().includes(name));
      const normalizedValue =
        value === FORMULA_EMPTY_RESULT
          ? ''
          : value === '' || value === undefined
            ? null
            : typeof value === 'object' && value !== null && !(value instanceof Date)
              ? String(value)
              : value;
      references.set(name, formulaReference(normalizedValue, row));
      return name;
    };

    const expressionWithRanges = normalizedSyntax.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![A-Za-z0-9_])\$?([A-Z]{1,3})\$?(\d+)\s*:\s*\$?([A-Z]{1,3})\$?(\d+)(?![A-Za-z0-9_])/gi,
      (match, startCol: string, startRow: string, endCol: string, endRow: string) => {
        if (!startCol) {
          return match;
        }
        const rangeValues = this.resolveExcelRangeValues(startCol, Number(startRow), endCol, Number(endRow), context);
        const width = Math.abs(getExcelColumnIndexByName(startCol.toUpperCase()) - getExcelColumnIndexByName(endCol.toUpperCase())) + 1;
        const firstRow = Math.min(Number(startRow), Number(endRow));
        return `[${rangeValues.map((value, index) => referenceLiteral(value, firstRow + Math.floor(index / width))).join(',')}]`;
      }
    );

    const expressionWithValues = mapFormulaRanges(expressionWithRanges, (members) => {
      const values = members.map((member) => {
        const cell = parseExcelReferenceCell(member);
        const value = cell
          ? this.resolveExcelReferenceValue(getExcelColumnNameByIndex(cell.cell + 1), cell.row + 1, context)
          : FORMULA_ERROR.REF;
        return referenceLiteral(value, cell?.row);
      });
      return `[${values.join(',')}]`;
    }).replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![A-Za-z0-9_])\$?([A-Z]{1,3})\$?(\d+)(?![A-Za-z0-9_])/gi,
      (match, colName: string, rowNumber: string) => {
        if (!colName) {
          return match;
        }
        const resolved = this.resolveExcelReferenceValue(colName, Number(rowNumber), context);
        return referenceLiteral(resolved);
      }
    );

    const jsExpression = this.transformFormulaOutsideQuotedStrings(expressionWithValues, (segment) =>
      segment
        .replace(/<>/g, '!=')
        .replace(/\bTRUE\b/gi, 'true')
        .replace(/\bFALSE\b/gi, 'false')
        .replace(/(?<![<>=!])=(?!=)/g, '==')
    );

    try {
      // The recursive-descent parser below implements the full supported grammar (operators, ranges,
      // whitelisted functions); it is used exclusively so no formula text is ever passed to a dynamic
      // code evaluator (e.g. `Function`/`eval`), which would otherwise be an unnecessary injection surface.
      const result = this.evaluateExpressionWithParser(jsExpression, formulaFunctions, false, references);
      return result === null ? 0 : result;
    } catch {
      return FORMULA_ERROR.ERROR;
    }
  }

  /** Defer built-in IF branches until the parser evaluates the containing expression. */
  protected replaceLazyIfCalls(expression: string, context: FormulaEvaluationContext, functions: Map<string, FormulaCallback>): string {
    const token = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?<![A-Za-z0-9_])IF\s*\(/gi;
    let result = '';
    let previous = 0;
    let match: RegExpExecArray | null;
    let sequence = 0;
    while ((match = token.exec(expression)) !== null) {
      if (/^["']/.test(match[0])) {
        continue;
      }
      const parsed = parseFormulaFunctionArguments(expression, token.lastIndex - 1);
      if (!parsed || parsed.args.length < 2 || parsed.args.length > 3 || parsed.args.some((arg) => !arg.trim())) {
        continue;
      }
      const { args, end } = parsed;
      let name = `__FORMULA_LAZY_IF_${sequence++}`;
      while (functions.has(name) || expression.toUpperCase().includes(name)) {
        name = `__FORMULA_LAZY_IF_${sequence++}`;
      }
      const validSyntax = args.every((arg) => {
        const syntax = this.transformFormulaOutsideQuotedStrings(this.normalizeFormulaSyntax(arg), (segment) =>
          segment
            .replace(/\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+/gi, '1')
            .replace(/#(?:CIRCREF!|PARSE!|REF!|DIV\/0!|VALUE!|NAME\?|NUM!|NULL!|ERROR!|N\/A)/gi, '1')
            .replace(/<>/g, '!=')
            .replace(/(?<![<>=!])=(?!=)/g, '==')
        );
        return !isFormulaErrorCode(this.evaluateExpressionWithParser(syntax, functions, true));
      });
      functions.set(name, () => {
        if (!validSyntax) {
          return FORMULA_ERROR.PARSE;
        }
        const condition = this.evaluateFormulaExpression(args[0], context);
        if (isFormulaErrorCode(condition)) {
          return condition;
        }
        const logicalCondition = formulaLogicalCondition(condition);
        if (typeof logicalCondition !== 'boolean') {
          return logicalCondition;
        }
        const selected = logicalCondition ? args[1] : (args[2] ?? 'FALSE');
        return this.evaluateFormulaExpression(selected, context);
      });
      result += expression.slice(previous, match.index) + `${name}()`;
      previous = end + 1;
      token.lastIndex = previous;
    }
    return result + expression.slice(previous);
  }

  protected evaluateExpressionWithParser(
    expression: string,
    formulaFunctions: Map<string, FormulaCallback>,
    syntaxOnly = false,
    references: Map<string, unknown> = new Map<string, unknown>()
  ): unknown {
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
        let closed = false;
        while (i < src.length) {
          const c = src[i];
          if (c === '\\' && i + 1 < src.length) {
            const escaped = src[i + 1];
            const unicode = escaped === 'u' ? src.slice(i + 2, i + 6) : '';
            if (/^[\da-f]{4}$/i.test(unicode)) {
              value += String.fromCharCode(Number.parseInt(unicode, 16));
              i += 6;
            } else {
              const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
              value += escapes[escaped] ?? escaped;
              i += 2;
            }
            continue;
          }
          if (c === quote) {
            if (src[i + 1] === quote) {
              value += quote;
              i += 2;
              continue;
            }
            i++;
            closed = true;
            break;
          }
          value += c;
          i++;
        }
        if (!closed) {
          return FORMULA_ERROR.PARSE;
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
          return FORMULA_ERROR.PARSE;
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

      return FORMULA_ERROR.PARSE;
    }

    pushToken('eof', '');

    let cursor = 0;
    let allowCountErrorReferences = false;
    const peek = () => tokens[cursor];
    const consume = () => tokens[cursor++];
    const matchOperator = (...ops: string[]) => peek().type === 'operator' && ops.includes(peek().value);
    const matchParen = (p: '(' | ')') => peek().type === 'paren' && peek().value === p;
    const matchBracket = (b: '[' | ']') => peek().type === 'bracket' && peek().value === b;
    const skipToClosing = (open: string, close: string) => {
      let depth = 0;
      while (peek().type !== 'eof') {
        const token = consume();
        if (token.type !== 'paren' && token.type !== 'bracket') {
          continue;
        }
        if (token.value === close && depth === 0) {
          return;
        }
        if (token.value === open) {
          depth++;
        } else if (token.value === close) {
          depth--;
        }
      }
    };
    const toNumber = (value: unknown): number => {
      value = unwrapFormulaReference(value);
      return FormulaService.toArithmeticNumber(value);
    };

    const parseExpression = (): unknown => parseComparison();

    const parseComparison = (): unknown => {
      let left = parseConcatenation();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('==', '!=', '<', '>', '<=', '>=')) {
        const op = consume().value;
        let right = unwrapFormulaReference(parseConcatenation());
        left = unwrapFormulaReference(left);
        if (isFormulaErrorCode(left)) {
          return left;
        }
        if (left instanceof Date) {
          left = formulaDateToSerial(left);
        }
        if (right instanceof Date) {
          right = formulaDateToSerial(right);
        }
        if ((typeof left === 'number' && Number.isNaN(left)) || (typeof right === 'number' && Number.isNaN(right))) {
          return FORMULA_ERROR.VALUE;
        }
        if (left === null) {
          left = typeof right === 'string' ? '' : typeof right === 'boolean' ? false : 0;
        }
        if (right === null) {
          right = typeof left === 'string' ? '' : typeof left === 'boolean' ? false : 0;
        }
        if (isFormulaErrorCode(right)) {
          return right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          left = left.toUpperCase();
          right = right.toUpperCase();
        } else if (
          typeof left !== typeof right &&
          ['number', 'string', 'boolean'].includes(typeof left) &&
          ['number', 'string', 'boolean'].includes(typeof right)
        ) {
          // Spreadsheet comparisons order numbers before text and logical values.
          const rank = (value: unknown) => (typeof value === 'boolean' ? 2 : typeof value === 'string' ? 1 : 0);
          left = rank(left);
          right = rank(right);
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
        const right = unwrapFormulaReference(parseAdditive());
        left = unwrapFormulaReference(left);
        if (isFormulaErrorCode(left)) {
          return left;
        }
        if (isFormulaErrorCode(right)) {
          return right;
        }
        const textValue = (value: unknown) => (typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value ?? ''));
        left = `${textValue(left)}${textValue(right)}`;
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
        const right = unwrapFormulaReference(parseMultiplicative());
        left = unwrapFormulaReference(left);
        if (isFormulaErrorCode(left)) {
          return left;
        }
        if (isFormulaErrorCode(right)) {
          return right;
        }
        left = syntaxOnly
          ? 1
          : op === '+'
            ? FormulaService.addFormulaValues(left, right)
            : FormulaService.subtractFormulaValues(left, right);
        if (typeof left === 'number' && !Number.isFinite(left)) {
          return Number.isNaN(left) ? FORMULA_ERROR.VALUE : FORMULA_ERROR.NUM;
        }
      }
      return left;
    };

    const parseMultiplicative = (): unknown => {
      let left = parsePower();
      if (isFormulaErrorCode(left)) {
        return left;
      }
      while (matchOperator('*', '/')) {
        const op = consume().value;
        const right = unwrapFormulaReference(parsePower());
        left = unwrapFormulaReference(left);
        if (isFormulaErrorCode(left)) {
          return left;
        }
        if (isFormulaErrorCode(right)) {
          return right;
        }
        if (syntaxOnly) {
          left = 1;
          continue;
        }
        const leftNumber = toNumber(left);
        const rightNumber = toNumber(right);
        if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
          return FORMULA_ERROR.VALUE;
        }
        if (op === '/' && rightNumber === 0) {
          return FORMULA_ERROR.DIV0;
        }
        left = op === '*' ? leftNumber * rightNumber : leftNumber / rightNumber;
        if (typeof left === 'number' && !Number.isFinite(left)) {
          return Number.isNaN(left) ? FORMULA_ERROR.VALUE : FORMULA_ERROR.NUM;
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
        const right = unwrapFormulaReference(parsePostfix());
        left = unwrapFormulaReference(left);
        if (isFormulaErrorCode(left)) {
          return left;
        }
        if (isFormulaErrorCode(right)) {
          return right;
        }
        const leftNumber = toNumber(left);
        const rightNumber = toNumber(right);
        left = syntaxOnly
          ? 1
          : Number.isNaN(leftNumber) || Number.isNaN(rightNumber)
            ? FORMULA_ERROR.VALUE
            : calculateFormulaPower(leftNumber, rightNumber);
        if (isFormulaErrorCode(left)) {
          return left;
        }
      }
      return left;
    };

    const parsePostfix = (): unknown => {
      let value = parseUnary();
      if (isFormulaErrorCode(value)) {
        return value;
      }
      while (matchOperator('%')) {
        consume();
        value = syntaxOnly ? 1 : toNumber(value) / 100;
        if (typeof value === 'number' && Number.isNaN(value)) {
          return FORMULA_ERROR.VALUE;
        }
      }
      return value;
    };

    const parseUnary = (): unknown => {
      if (matchOperator('+')) {
        consume();
        const unary = unwrapFormulaReference(parseUnary());
        if (isFormulaErrorCode(unary)) {
          return unary;
        }
        const numeric = syntaxOnly ? 1 : toNumber(unary);
        return Number.isNaN(numeric) ? FORMULA_ERROR.VALUE : numeric;
      }
      if (matchOperator('-')) {
        consume();
        const unary = unwrapFormulaReference(parseUnary());
        if (isFormulaErrorCode(unary)) {
          return unary;
        }
        const numeric = syntaxOnly ? 1 : toNumber(unary);
        return Number.isNaN(numeric) ? FORMULA_ERROR.VALUE : -numeric;
      }
      return parsePrimary();
    };

    const parsePrimary = (): unknown => {
      const tk = peek();

      if (tk.type === 'number') {
        consume();
        return syntaxOnly ? 1 : Number(tk.value);
      }

      if (tk.type === 'string') {
        consume();
        return syntaxOnly ? '' : tk.value;
      }

      if (tk.type === 'identifier') {
        const ident = consume().value;
        const upperIdent = ident.toUpperCase();
        if (references.has(upperIdent)) {
          const reference = references.get(upperIdent);
          const value = unwrapFormulaReference(reference);
          return !allowCountErrorReferences && isFormulaErrorCode(value) ? value : reference;
        }
        if (matchParen('(')) {
          consume();
          const args: unknown[] = [];
          const previousAllowCountErrorReferences = allowCountErrorReferences;
          allowCountErrorReferences = (upperIdent === 'COUNT' || upperIdent === 'COUNTA') && !this._customFunctions.has(upperIdent);
          try {
            if (!matchParen(')')) {
              while (true) {
                const value = parseExpression();
                if (isFormulaErrorCode(value)) {
                  if (!allowCountErrorReferences || value === FORMULA_ERROR.PARSE || value === FORMULA_ERROR.CIRCREF) {
                    // Consume this function's remaining tokens so an enclosing COUNT/COUNTA
                    // can handle the error as one complete argument.
                    skipToClosing('(', ')');
                    return value;
                  }
                  // The failed expression may still have tokens after the error.
                  // Skip to this argument's comma or closing parenthesis.
                  let depth = 0;
                  while (peek().type !== 'eof') {
                    if (depth === 0 && (peek().type === 'comma' || matchParen(')'))) {
                      break;
                    }
                    if (matchParen('(') || matchBracket('[')) {
                      depth++;
                    }
                    if (matchParen(')') || matchBracket(']')) {
                      depth--;
                    }
                    consume();
                  }
                }
                args.push(value);
                if (peek().type === 'comma') {
                  consume();
                  continue;
                }
                break;
              }
            }
          } finally {
            allowCountErrorReferences = previousAllowCountErrorReferences;
          }

          if (!matchParen(')')) {
            return FORMULA_ERROR.PARSE;
          }
          consume();

          if (syntaxOnly) {
            return 1;
          }

          const fn = formulaFunctions.get(upperIdent);
          if (typeof fn !== 'function') {
            return FORMULA_ERROR.NAME;
          }
          const unwrapCustomArgument = (value: unknown): unknown =>
            Array.isArray(value) ? value.map(unwrapCustomArgument) : unwrapFormulaReference(value);
          let result: unknown;
          if (this._customFunctions.has(upperIdent)) {
            try {
              result = fn(...args.map(unwrapCustomArgument));
            } catch {
              return FORMULA_ERROR.ERROR;
            }
          } else {
            result = fn(...args);
          }
          return typeof result === 'number' && !Number.isFinite(result)
            ? Number.isNaN(result)
              ? FORMULA_ERROR.VALUE
              : FORMULA_ERROR.NUM
            : result;
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
        return syntaxOnly ? 1 : FORMULA_ERROR.NAME;
      }

      if (matchParen('(')) {
        consume();
        const value = parseExpression();
        if (isFormulaErrorCode(value)) {
          skipToClosing('(', ')');
          return value;
        }
        if (!matchParen(')')) {
          return FORMULA_ERROR.PARSE;
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
              skipToClosing('[', ']');
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
          return FORMULA_ERROR.PARSE;
        }
        consume();
        return values;
      }

      return FORMULA_ERROR.PARSE;
    };

    const output = parseExpression();
    if (isFormulaErrorCode(output)) {
      return output;
    }
    if (peek().type !== 'eof') {
      return FORMULA_ERROR.PARSE;
    }
    return unwrapFormulaReference(output);
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

    return this.transformFormulaOutsideQuotedStrings(expression, (segment) =>
      segment.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–—]/g, '-')
    );
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

  /** Display indexes include structural rows, which cannot be formula targets. */
  protected getGroupedDisplayRowIds(): Array<string | undefined> | undefined {
    if (!this._dataView?.getGrouping?.().length || !this._dataView.getItem || !this._dataView.getLength) {
      return undefined;
    }
    const idProperty = this.getDatasetIdPropertyName();
    return Array.from({ length: this._dataView.getLength() }, (_, row) => {
      const item = this._dataView.getItem(row);
      const id = item?.__group || item?.__groupTotals ? undefined : item?.[idProperty];
      return id == null ? undefined : String(id);
    });
  }

  /**
   * Convert user-facing A1 references to stable AG-style references.
   * Quoted formula strings are intentionally ignored so values such as "A1" remain literals.
   */
  protected convertA1ReferencesToStableRefs(
    formula: string,
    columnIds: string[] = this.getFormulaColumnIds(),
    rowIds: Array<string | undefined> = this.getFormulaRowIds(),
    invalidRowAsError = false
  ): string {
    formula = this.normalizeFormulaRangeDimensions(formula);
    if (!formula || columnIds.length === 0 || rowIds.length === 0) {
      return formula;
    }

    formula = formula.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|REF\(COLUMN\("[^"]+"\),ROW\("[^"]+"\)\)\s*:\s*REF\(COLUMN\("[^"]+"\),ROW\("[^"]+"\)\)/gi,
      (token) => (token.startsWith('REF(') ? this.replaceRefFunctionsWithA1Refs(token, columnIds, rowIds) : token)
    );
    if (invalidRowAsError) {
      formula = this.transformFormulaOutsideQuotedStrings(formula, (segment) =>
        segment.replace(/(?<![\w])\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+(?![\w])/gi, (range) => {
          const endpoints = range.split(':').map((part) => parseExcelReferenceCell(part.trim()));
          return endpoints.some((cell) => !cell || cell.row >= rowIds.length || cell.cell >= columnIds.length) ? FORMULA_ERROR.REF : range;
        })
      );
    }
    formula = expandFormulaRanges(formula, (row) => !invalidRowAsError || rowIds[row] !== undefined);

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
        if (startRowId === undefined && invalidRowAsError) {
          return FORMULA_ERROR.REF;
        }
        if (startColumnId === undefined || startRowId === undefined) {
          return reference;
        }

        const startRef = `REF(COLUMN(${JSON.stringify(startColumnId)}),ROW(${JSON.stringify(startRowId)}))`;
        return startRef;
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

  protected normalizeFormulaRangeDimensions(formula: string): string {
    return this._customFunctions.has('SUMIF') ? formula : normalizeSumIfRangeDimensions(formula);
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
  protected replaceRefFunctionsWithA1Refs(
    expression: string,
    columnIds: string[],
    rowIds: Array<string | undefined>,
    excelRowOffset = 1,
    preserveMissing = false
  ): string {
    if (!expression) {
      return expression;
    }

    const withNamedRowRefs = expression.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|REF\(\s*COLUMN\(("(?:\\.|[^"\\])*")\)\s*,\s*ROW\(("(?:\\.|[^"\\])*")\)\s*\)/gi,
      (match, columnToken?: string, rowToken?: string) => {
        if (!columnToken) {
          return match;
        }
        const columnId = JSON.parse(columnToken) as string;
        const rowId = JSON.parse(rowToken!) as string;
        const columnIdx = columnIds.indexOf(String(columnId));
        const rowIdx = rowIds.indexOf(String(rowId));
        if (columnIdx < 0 || rowIdx < 0) {
          return preserveMissing && columnIdx >= 0 && this.getFormulaRowIds().includes(rowId) ? match : FORMULA_ERROR.REF;
        }

        const excelColName = getExcelColumnNameByIndex(columnIdx + 1);
        const excelRowNumber = rowIdx + excelRowOffset;
        return `${excelColName}${excelRowNumber}`;
      }
    );

    return withNamedRowRefs.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|REF\(\s*COLUMN\("([^"]+)"\)\s*,\s*ROW\((\d+)\)\s*\)/gi,
      (match, columnId: string, rowNumber: string) => {
        if (!columnId) {
          return match;
        }
        const columnIdx = columnIds.indexOf(String(columnId));
        const rowIdx = Number(rowNumber);
        if (columnIdx < 0 || Number.isNaN(rowIdx)) {
          return FORMULA_ERROR.REF;
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

  protected static toArithmeticNumber(value: unknown): number {
    if (Array.isArray(value) || (typeof value === 'string' && !value.trim())) {
      return NaN;
    }
    return value instanceof Date ? formulaDateToSerial(value) : Number(value);
  }

  protected static addFormulaValues(left: unknown, right: unknown): unknown {
    if (left instanceof Date && right instanceof Date) {
      return formulaDateToSerial(left) + formulaDateToSerial(right);
    }
    if (left instanceof Date || right instanceof Date) {
      const date = left instanceof Date ? left : (right as Date);
      const offset = FormulaService.toArithmeticNumber(left instanceof Date ? right : left);
      if (!Number.isFinite(formulaDateToSerial(date)) || !Number.isFinite(offset)) {
        return NaN;
      }
      return FormulaService.addDays(date, offset);
    }
    return FormulaService.toArithmeticNumber(left) + FormulaService.toArithmeticNumber(right);
  }

  protected static subtractFormulaValues(left: unknown, right: unknown): unknown {
    if (left instanceof Date && right instanceof Date) {
      return formulaDateToSerial(left) - formulaDateToSerial(right);
    }
    if (left instanceof Date) {
      const offset = FormulaService.toArithmeticNumber(right);
      if (!Number.isFinite(formulaDateToSerial(left)) || !Number.isFinite(offset)) {
        return NaN;
      }
      return FormulaService.addDays(left, -offset);
    }
    return FormulaService.toArithmeticNumber(left) - FormulaService.toArithmeticNumber(right);
  }

  protected static addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    const wholeDays = Math.trunc(days);
    result.setDate(result.getDate() + wholeDays);
    return new Date(result.getTime() + (days - wholeDays) * 24 * 60 * 60 * 1000);
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
    const storedFormula = this.getFormula(rowId, columnId);

    if (storedFormula || (typeof rawValue === 'string' && rawValue.trim().startsWith('='))) {
      const key = this.buildStoreKey(rowId, columnId);
      if (context.visited.has(key)) {
        return FORMULA_ERROR.CIRCREF;
      }

      const nestedFormula = storedFormula ?? rawValue;
      const nestedMemoKey = this.buildEvaluationMemoKey(rowId, columnId, nestedFormula);
      if (context.memo.has(nestedMemoKey)) {
        const cached = context.memo.get(nestedMemoKey);
        return cached === '' ? FORMULA_EMPTY_RESULT : cached;
      }

      context.visited.add(key);
      const nested = this.evaluateFormulaExpression(nestedFormula, context);
      context.visited.delete(key);
      context.memo.set(nestedMemoKey, nested);
      return nested === '' ? FORMULA_EMPTY_RESULT : nested;
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

  protected autoAssignFormulaEditorToColumns(incomingColumns?: Column[]): void {
    if (!this._grid?.getColumns || !this._grid?.setColumns) {
      return;
    }

    const autoEditableFormatter = this._grid.getOptions?.().autoAddCustomEditorFormatter as Formatter | undefined;
    const columns = incomingColumns ?? ((this._grid.getColumns?.() || []) as Column[]);
    let hasChanges = false;

    const updatedColumns = columns.map((column) => {
      if (!column?.allowFormula) {
        return column;
      }

      const columnEditor = (column.editor || {}) as ColumnEditor;
      const selectedEditor = column.editorClass ?? columnEditor.model;
      const useFormulaEditor = selectedEditor === FormulaCellEditor || (!selectedEditor && this._options.autoAssignEditor !== false);

      if ((column.formatter as any)?.__formulaServiceOwner === this) {
        if (selectedEditor !== FormulaCellEditor) {
          const original = this._originalColumnDefsById.get(column.id);
          if (original) {
            original.editor = column.editor;
            original.editorClass = column.editorClass;
          }
        }
        return column;
      }

      const mergedParams = {
        ...(this._options.editorParams || {}),
        ...(columnEditor.params || {}),
      } as FormulaEditorParams;

      if (!Array.isArray(mergedParams.formulaFunctionList) || mergedParams.formulaFunctionList.length === 0) {
        mergedParams.formulaFunctionList = undefined;
        mergedParams.getFormulaFunctionList ??= () =>
          Array.from(this.getFormulaFunctionRegistry().keys()).sort((a, b) => a.localeCompare(b));
      }

      const userOnFormulaInputChange = mergedParams.onFormulaInputChange;
      mergedParams.onFormulaInputChange = (formula: string) => {
        userOnFormulaInputChange?.(formula);
      };
      mergedParams.toDisplayFormula = (formula: string, item?: any) => {
        const rowId = item?.[this.getDatasetIdPropertyName()] as number | string | undefined;
        return rowId === undefined || rowId === null
          ? this.toDisplayFormula(formula)
          : this.toDisplayFormulaForCell(formula, rowId, column.id, true);
      };
      mergedParams.toStoredFormula = (formula: string, item?: any) => {
        const rowId = item?.[this.getDatasetIdPropertyName()] as number | string | undefined;
        const existing = rowId == null ? undefined : this.getFormula(rowId, column.id);
        if (existing && formula === this.toDisplayFormulaForCell(existing, rowId!, column.id, true)) {
          return existing;
        }
        const groupedRows = this.getGroupedDisplayRowIds();
        const storedFormula = groupedRows
          ? this.convertA1ReferencesToStableRefs(formula, this.getFormulaColumnIds(), groupedRows, true)
          : this.toStoredFormula(formula);
        if (rowId !== undefined && rowId !== null && this.containsDirectExcelReference(formula)) {
          this.captureFormulaReferenceAbsoluteFlags(this.buildStoreKey(rowId, column.id), formula, groupedRows);
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

          if (!useFormulaEditor) {
            return baseValue;
          }
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
        (wrappedFormatter as any).__formulaServiceOwner = this;
        nextFormatter = wrappedFormatter;
      }

      this._originalColumnDefsById.set(column.id, {
        formatter: column.formatter,
        params: column.params,
        editorClass: column.editorClass,
        editor: column.editor,
      });

      hasChanges = true;
      return {
        ...column,
        formatter: nextFormatter,
        params: pipelineParams,
        ...(useFormulaEditor
          ? { editorClass: FormulaCellEditor, editor: { ...columnEditor, model: FormulaCellEditor, params: mergedParams } }
          : {}),
      };
    });

    if (hasChanges) {
      this._hasAutoAssignedFormulaEditor = true;
      if (incomingColumns) {
        incomingColumns.splice(0, incomingColumns.length, ...updatedColumns);
        return;
      }
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
      if (!original || (column.formatter as any)?.__formulaServiceOwner !== this) {
        return column;
      }
      const currentEditor = column.editorClass ?? column.editor?.model;
      return currentEditor && currentEditor !== FormulaCellEditor
        ? { ...column, formatter: original.formatter, params: original.params }
        : { ...column, ...original };
    });

    this._grid.setColumns(restoredColumns as Column[]);
    this._grid.invalidate?.();
    this._grid.render?.();
    this._originalColumnDefsById.clear();
    this._hasAutoAssignedFormulaEditor = false;
  }
}
