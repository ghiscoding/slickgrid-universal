import { BindingEventService } from '@slickgrid-universal/binding';
import type { Editor, EditorArguments, EditorValidationResult, SelectionModel } from '@slickgrid-universal/common';
import { createDomElement, SlickRange } from '@slickgrid-universal/common';

const FORMULA_TOKEN_COLOR_COUNT = 10;

interface FormulaReferenceColorInfo {
  ref: string; // Excel reference like 'C1' or 'D1:D4'
  colorIdx: number; // 0-9, used to compute color class
  colorClass: string; // e.g. 'formula-cell-color-1'
  cells: Array<{ row: number; cell: number }>; // All grid cells this reference covers
}

export interface FormulaEditorParams {
  debug?: boolean;
  formulaFunctionList?: string[];
  onFormulaInputChange?: (formula: string) => void;
}

function extractExcelReferencesFromFormula(formula: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  // Match: ranges (complete or incomplete like D1:D or D1:), or single cells
  // The end cell in a range is completely optional, so D1: matches as a range with empty end
  const regex = /\$?[A-Z]{1,3}\$?\d+\s*:\s*(?:\$?[A-Z]{1,3}\$?\d*)?|\$?[A-Z]{1,3}\$?\d+/g;
  let match: RegExpExecArray | null;
  const allMatches: string[] = [];
  while ((match = regex.exec(formula)) !== null) {
    const ref = normalizeFormulaReferenceToken(match[0]);
    allMatches.push(ref);
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
  }
  return refs;
}

function normalizeFormulaReferenceToken(token: string): string {
  return token.replace(/\$/g, '').replace(/\s+/g, '').toUpperCase();
}

export class FormulaCellEditor implements Editor {
  protected _autocompleteElm?: HTMLDivElement;
  protected _autocompleteItems: string[] = [];
  protected _autocompleteSelectedIdx = 0;
  protected _editorElm!: HTMLDivElement;
  protected _gridContainerElm?: HTMLElement;
  protected _blurRestoreTimer?: ReturnType<typeof setTimeout>;
  protected _isDraggingGridRefSelection = false;
  protected _isOpenedByTabKey = false;
  protected _isDestroyed = false;
  protected _isExitingEditor = false;
  protected _isValueTouched = false;
  protected _originalValue = '';
  protected _referenceEditRange?: { start: number; end: number };
  protected _referenceRangeAnchorCell?: { row: number; cell: number };
  protected _persistentFormulaColorStyleKey = 'formula-editor-grid-persistent-colors';
  protected _referenceSelectionStyleKey = 'formula-editor-grid-ref-selection';
  protected _selectionHighlightStyleKey = 'formula-editor-grid-sel-highlight';
  protected _suppressNextGridClick = false;
  protected _suppressGridClickResetTimer?: ReturnType<typeof setTimeout>;
  protected _suppressInitialTabBlur = false;
  protected _tabNavigateTimer?: ReturnType<typeof setTimeout>;
  protected _isSyncingReferenceFromCaret = false;
  protected _isSelectionModelHighlightActive = false;
  protected _cachedFormulaText = '';
  protected _plainTextValue = ''; // Keep plain text in sync with DOM for reliable copy/paste
  protected _formulaRefColorCache: Map<string, FormulaReferenceColorInfo> = new Map(); // Single source of truth: ref -> {colorIdx, colorClass, cells}
  protected _formulaColorChanged = false; // Flag to track when cache needs grid update
  protected _hasAppliedColorsOnce = false; // Track if we've ever applied colors to avoid unnecessary removals
  protected _bindEventService: BindingEventService = new BindingEventService();
  protected _debug = false;

  protected readonly _referenceTokenRegex: RegExp = /\$?[A-Z]{1,3}\$?\d+\s*:\s*(?:\$?[A-Z]{1,3}\$?\d*)?|\$?[A-Z]{1,3}\$?\d+/g;
  protected _initialLoadComplete = false; // Skip sync on first focusin during editor load

  constructor(protected readonly args: EditorArguments) {
    this._isOpenedByTabKey = (this.args.event as KeyboardEvent | undefined)?.key === 'Tab';
    // Some grid focus transitions trigger an immediate blur right after editor activation.
    // Suppress the first external blur by default to keep keyboard focus inside the grid.
    this._suppressInitialTabBlur = true;
    this.init();
  }

  init(): void {
    // Extract debug flag from editor params
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    this._debug = editorParams?.debug ?? false;

    this._editorElm = createDomElement('div', { className: 'formula-editor-input' });
    this._editorElm.setAttribute('contenteditable', 'plaintext-only');
    this._editorElm.setAttribute('role', 'textbox');
    this._editorElm.setAttribute('spellcheck', 'false');
    this.args.container.appendChild(this._editorElm);

    this._bindEventService.bind(this._editorElm, 'input', this.handleInput.bind(this));
    this._bindEventService.bind(this._editorElm, 'paste', this.handlePaste.bind(this) as EventListener);
    this._bindEventService.bind(this._editorElm, 'keydown', this.handleKeydown.bind(this) as EventListener);
    this._bindEventService.bind(this._editorElm, 'keyup', this.handleEditorKeyUp.bind(this));
    this._bindEventService.bind(this._editorElm, 'focusin', this.handleFocusIn.bind(this));
    this._bindEventService.bind(this._editorElm, 'focusout', this.handleFocusOut.bind(this) as EventListener);
    this._bindEventService.bind(this._editorElm, 'mouseup', this.handleEditorMouseUp.bind(this));

    // Capture grid pointer interactions while formula typing is active to support click/drag reference picking.
    // Use window capture phase so we run before SlickGrid's normal click lifecycle.
    this._gridContainerElm = this.args.grid.getContainerNode?.();
    this._bindEventService.bind(window, 'mousedown', this.handleWindowMouseDown as EventListener, true);
    this._bindEventService.bind(window, 'click', this.handleWindowClick as EventListener, true);
    this._bindEventService.bind(window, 'mousemove', this.handleWindowMouseMove as EventListener, true);
    this._bindEventService.bind(window, 'mouseup', this.handleWindowMouseUp as EventListener, true);
  }

  destroy(): void {
    this._isDestroyed = true;
    clearTimeout(this._blurRestoreTimer);
    clearTimeout(this._suppressGridClickResetTimer);
    clearTimeout(this._tabNavigateTimer);
    this.hideAutocomplete();
    this.clearReferenceSelectionHighlight();
    this._bindEventService.unbindAll();
    this._autocompleteElm?.remove();
    this._editorElm?.remove();
  }

  focus(): void {
    this.args.grid.focus('internal');
    this._editorElm.focus();
    this.setCursorAtEnd();
  }

  loadValue(item: any): void {
    const field = this.args.column.field as string;
    const value = item?.[field] ?? '';
    this._originalValue = String(value);
    this._plainTextValue = this._originalValue; // Keep in sync
    this._editorElm.textContent = this._originalValue;

    // Build cache first so colors are assigned correctly (this also applies colors to grid)
    this.buildFormulaReferenceColorCache();

    this.renderTokens();
    this._initialLoadComplete = true; // Allow sync on subsequent focusin events
  }

  serializeValue(): string {
    return this.getPlainTextValue();
  }

  applyValue(item: any, state: any): void {
    const field = this.args.column.field as string;
    item[field] = state;
  }

  isValueChanged(): boolean {
    return this.getPlainTextValue() !== this._originalValue;
  }

  validate(): EditorValidationResult {
    return { valid: true, msg: '' };
  }

  protected handleInput(): void {
    this._isValueTouched = true;

    // Extract plain text from DOM (may contain styled spans after renderTokens)
    this._plainTextValue = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');

    this.clearReferenceSelectionHighlight();

    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.syncReferenceSelectionFromCaret();
    this.updateAutocomplete();
    this.publishFormulaInput();
  }

  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    this._plainTextValue = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.syncReferenceSelectionFromCaret();
    this.updateAutocomplete();
    this.publishFormulaInput();
  }

  protected handleFocusIn(): void {
    // Skip sync on initial focusin during editor load to preserve reference colors
    // Only sync on subsequent focus events when user is actively interacting
    if (this._initialLoadComplete) {
      this.syncReferenceSelectionFromCaret();
    }
  }

  protected handleEditorKeyUp(): void {
    this.syncReferenceSelectionFromCaret();
  }

  protected handleEditorMouseUp(): void {
    this.syncReferenceSelectionFromCaret();
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (this._isExitingEditor) {
      return;
    }

    const nextTarget = event.relatedTarget as Node | null;
    const gridContainer = this.args.grid.getContainerNode?.();
    const isFocusStillInGrid = !!(nextTarget && gridContainer?.contains(nextTarget));

    if (this._suppressInitialTabBlur && !this._isValueTouched && !isFocusStillInGrid) {
      this._suppressInitialTabBlur = false;
      this._blurRestoreTimer = setTimeout(() => {
        if (this._isDestroyed || !this._editorElm?.isConnected) {
          return;
        }
        this.args.grid.focus('internal');
        this._editorElm.focus();
        this.setCursorAtEnd();
      }, 0);
      return;
    }

    this._suppressInitialTabBlur = false;
    this.hideAutocomplete();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    // Keep Select-All scoped to the formula editor.
    // Let browser default behavior select editor content, but stop SlickGrid from handling Ctrl/Cmd+A.
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'a') {
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    // Handle copy/cut to ensure we copy plain text only, not HTML spans
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const plainText = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
      navigator.clipboard.writeText(plainText).catch(() => {
        // Fallback for older browsers
      });
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const plainText = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
      navigator.clipboard.writeText(plainText).catch(() => {
        // Fallback for older browsers
      });
      // Clear the editor after cut
      this._plainTextValue = '';
      this._editorElm.textContent = '';
      this._isValueTouched = true;
      this.buildFormulaReferenceColorCache();
      this.renderTokens();
      this.publishFormulaInput();
      return;
    }

    if (this._autocompleteItems.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this._autocompleteSelectedIdx = (this._autocompleteSelectedIdx + 1) % this._autocompleteItems.length;
        this.renderAutocompleteItems();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this._autocompleteSelectedIdx =
          (this._autocompleteSelectedIdx - 1 + this._autocompleteItems.length) % this._autocompleteItems.length;
        this.renderAutocompleteItems();
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.selectAutocompleteItem(this._autocompleteItems[this._autocompleteSelectedIdx]);
        return;
      }

      if (event.key === 'Escape') {
        this.hideAutocomplete();
      }
    }

    if (
      !this.args.grid.getOptions().editorNavigateOnArrows &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End')
    ) {
      event.stopImmediatePropagation();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this._isExitingEditor = true;
      this.clearReferenceSelectionHighlight();
      const didCommit = this.args.grid.getEditorLock?.()?.commitCurrentEdit?.();
      if (didCommit === false) {
        this.args.commitChanges();
      }
    } else if (event.key === 'Tab') {
      const grid = this.args.grid;
      const isShiftTab = event.shiftKey;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (this._isOpenedByTabKey && !this._isValueTouched) {
        this._isOpenedByTabKey = false;
        return;
      }

      this._isOpenedByTabKey = false;
      this._suppressInitialTabBlur = false;
      this._isExitingEditor = true;
      this.clearReferenceSelectionHighlight();
      const didCommit = this.args.grid.getEditorLock?.()?.commitCurrentEdit?.();
      if (didCommit === false) {
        this.args.commitChanges();
      }

      this._tabNavigateTimer = setTimeout(() => {
        if (didCommit === false) {
          return;
        }
        grid.focus('internal');
        if (isShiftTab) {
          grid.navigatePrev();
        } else {
          grid.navigateNext();
        }
        grid.focus('internal');
      }, 0);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._isExitingEditor = true;
      this.clearReferenceSelectionHighlight();
      this.args.cancelChanges();
    }
  }

  protected handleWindowMouseDown = (event: MouseEvent): void => {
    if (!this.shouldCaptureGridReferenceSelection(event)) {
      return;
    }

    const cell = this.args.grid.getCellFromEvent(event);
    if (!cell || cell.row < 0 || cell.cell < 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this._isDraggingGridRefSelection = true;
    this._suppressNextGridClick = true;
    const referenceEditRange = this.resolveReferenceEditRangeForGridSelection();
    this._referenceEditRange = referenceEditRange ?? this._referenceEditRange;

    const existingReferenceCellRange = this._referenceEditRange
      ? this.parseExcelReferenceCellRange(this.getPlainTextValue().slice(this._referenceEditRange.start, this._referenceEditRange.end))
      : undefined;

    this._referenceRangeAnchorCell = this.resolveReferenceSelectionAnchorCell(
      { row: cell.row, cell: cell.cell },
      existingReferenceCellRange
    );

    this.replaceReferenceRangeFromGridSelection(this._referenceRangeAnchorCell, cell);
  };

  protected handleWindowClick = (event: MouseEvent): void => {
    if (!this._suppressNextGridClick || !this.isEventInsideGrid(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    clearTimeout(this._suppressGridClickResetTimer);
    this._suppressNextGridClick = false;
  };

  protected handleWindowMouseMove = (event: MouseEvent): void => {
    if (!this._isDraggingGridRefSelection || !this._referenceRangeAnchorCell) {
      return;
    }

    const cell = this.args.grid.getCellFromEvent(event);
    if (!cell || cell.row < 0 || cell.cell < 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.replaceReferenceRangeFromGridSelection(this._referenceRangeAnchorCell, cell);
  };

  protected handleWindowMouseUp = (event: MouseEvent): void => {
    if (!this._isDraggingGridRefSelection) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this._isDraggingGridRefSelection = false;
    // Keep click suppression active through the click phase fired right after mouseup.
    // SlickGrid handles click to navigate/commit editor; suppressing that click keeps formula edit alive.
    clearTimeout(this._suppressGridClickResetTimer);
    this._suppressGridClickResetTimer = setTimeout(() => {
      this._suppressNextGridClick = false;
    }, 0);
    this._referenceRangeAnchorCell = undefined;
    this.syncReferenceSelectionFromCaret();
  };

  protected getPlainTextValue(): string {
    return this._plainTextValue;
  }

  protected publishFormulaInput(): void {
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    editorParams?.onFormulaInputChange?.(this.getPlainTextValue());
  }

  protected setCursorAtEnd(): void {
    if (this._isDestroyed || !this._editorElm?.isConnected) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(this._editorElm);
    range.collapse(false);
    try {
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // Editor might already be detached from DOM during async focus transitions.
    }
  }

  protected shouldCaptureGridReferenceSelection(event: MouseEvent): boolean {
    if (this._isDestroyed || this._isExitingEditor || event.button !== 0) {
      return false;
    }

    if (!this._editorElm?.isConnected) {
      return false;
    }

    const plainText = this.getPlainTextValue().trimStart();
    if (!plainText.startsWith('=')) {
      return false;
    }

    if (!this.isEventInsideGrid(event)) {
      return false;
    }

    const eventTarget = event.target as Node | null;
    if (eventTarget && this._editorElm.contains(eventTarget)) {
      return false;
    }
    if (eventTarget && this._autocompleteElm?.contains(eventTarget)) {
      return false;
    }

    return !!this.args.grid.getCellFromEvent(event);
  }

  protected isEventInsideGrid(event: MouseEvent): boolean {
    const eventTarget = event.target as Node | null;
    return !!(eventTarget && this._gridContainerElm?.contains(eventTarget));
  }

  protected getReferenceTokenRangeAtCaret(): { start: number; end: number } {
    const rangeAtCaret = this.getReferenceTokenRangeAtCaretOrUndefined();
    if (rangeAtCaret) {
      return rangeAtCaret;
    }

    const caretOffset = this.getCaretOffset();
    return { start: caretOffset, end: caretOffset };
  }

  protected getReferenceTokenRangeAtCaretOrUndefined(): { start: number; end: number } | undefined {
    const text = this.getPlainTextValue();
    const caretOffset = this.getCaretOffset();
    const regex = new RegExp(this._referenceTokenRegex.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (caretOffset >= start && caretOffset <= end) {
        return { start, end };
      }
    }

    return undefined;
  }

  protected syncReferenceSelectionFromCaret(): void {
    if (this._isSyncingReferenceFromCaret || this._isDraggingGridRefSelection || this._isDestroyed || !this._editorElm?.isConnected) {
      return;
    }

    const rawFormulaText = this.getPlainTextValue().trimStart();
    if (!rawFormulaText.startsWith('=')) {
      this._referenceEditRange = undefined;
      this.clearReferenceSelectionHighlight();
      return;
    }

    const activeReferenceRange = this.getReferenceTokenRangeAtCaretOrUndefined();
    if (!activeReferenceRange) {
      this._referenceEditRange = undefined;
      this.clearReferenceSelectionHighlight();
      return;
    }

    const referenceToken = this.getPlainTextValue().slice(activeReferenceRange.start, activeReferenceRange.end);
    const parsedRange = this.parseExcelReferenceCellRange(referenceToken);
    this._referenceEditRange = activeReferenceRange;

    if (!parsedRange) {
      this.clearReferenceSelectionHighlight();
      return;
    }

    this._isSyncingReferenceFromCaret = true;
    try {
      this.renderGridSelectionHighlight(parsedRange.startCell, parsedRange.endCell);
    } finally {
      this._isSyncingReferenceFromCaret = false;
    }
  }

  protected parseExcelReferenceCellRange(
    referenceToken: string
  ): { startCell: { row: number; cell: number }; endCell: { row: number; cell: number } } | undefined {
    const normalizedReferenceToken = normalizeFormulaReferenceToken(referenceToken);
    if (!normalizedReferenceToken) {
      return undefined;
    }

    const [startToken, endToken] = normalizedReferenceToken.includes(':')
      ? normalizedReferenceToken.split(':', 2)
      : [normalizedReferenceToken, normalizedReferenceToken];

    const startCell = this.parseExcelReferenceCell(startToken);
    const endCell = this.parseExcelReferenceCell(endToken);
    if (!startCell || !endCell) {
      return undefined;
    }

    return { startCell, endCell };
  }

  protected parseExcelReferenceCell(token: string): { row: number; cell: number } | undefined {
    const match = token.match(/^([A-Z]{1,3})(\d+)$/);
    if (!match) {
      return undefined;
    }

    const columnName = match[1];
    const rowIndex = Number.parseInt(match[2], 10) - 1;
    if (!Number.isFinite(rowIndex) || rowIndex < 0) {
      return undefined;
    }

    let columnIndex = 0;
    for (let i = 0; i < columnName.length; i++) {
      columnIndex = columnIndex * 26 + (columnName.charCodeAt(i) - 64);
    }

    const result = { row: rowIndex, cell: columnIndex - 1 };
    return result;
  }

  protected replaceReferenceRangeFromGridSelection(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): void {
    const nextReference = this.buildExcelReferenceFromCellRange(startCell, endCell);
    const text = this.getPlainTextValue();
    const replaceRange = this._referenceEditRange ?? this.getReferenceTokenRangeAtCaret();
    const safeStart = Math.max(0, Math.min(replaceRange.start, text.length));
    const safeEnd = Math.max(safeStart, Math.min(replaceRange.end, text.length));

    const nextText = `${text.slice(0, safeStart)}${nextReference}${text.slice(safeEnd)}`;
    this._referenceEditRange = { start: safeStart, end: safeStart + nextReference.length };

    this._plainTextValue = nextText; // Keep in sync
    this._editorElm.textContent = nextText;
    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.args.grid.focus('internal');
    this._editorElm.focus();
    this.restoreCaretOffset(this._referenceEditRange.end);
    this._isValueTouched = true;
    this.publishFormulaInput();
    this.renderGridSelectionHighlight(startCell, endCell);
  }

  protected resolveReferenceEditRangeForGridSelection(): { start: number; end: number } | undefined {
    if (this._referenceEditRange) {
      const text = this.getPlainTextValue();
      const safeStart = Math.max(0, Math.min(this._referenceEditRange.start, text.length));
      const safeEnd = Math.max(safeStart, Math.min(this._referenceEditRange.end, text.length));
      if (safeEnd > safeStart) {
        return { start: safeStart, end: safeEnd };
      }
    }

    const rangeAtCaret = this.getReferenceTokenRangeAtCaretOrUndefined();
    if (rangeAtCaret) {
      return rangeAtCaret;
    }

    if (this.shouldInsertReferenceAtCaret()) {
      const caretOffset = this.getCaretOffset();
      return { start: caretOffset, end: caretOffset };
    }

    return this.getSingleReferenceTokenRangeOrUndefined();
  }

  protected shouldInsertReferenceAtCaret(): boolean {
    const text = this.getPlainTextValue();
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    if (!textBeforeCaret.trimStart().startsWith('=')) {
      return false;
    }

    const textBeforeCaretTrimEnd = textBeforeCaret.replace(/\s+$/, '');
    if (!textBeforeCaretTrimEnd.length) {
      return false;
    }

    const lastChar = textBeforeCaretTrimEnd[textBeforeCaretTrimEnd.length - 1];
    return /[=,(+\-*/^&:]/.test(lastChar);
  }

  protected getSingleReferenceTokenRangeOrUndefined(): { start: number; end: number } | undefined {
    const text = this.getPlainTextValue();
    const regex = new RegExp(this._referenceTokenRegex.source, 'g');
    const firstMatch = regex.exec(text);
    if (!firstMatch) {
      return undefined;
    }

    const secondMatch = regex.exec(text);
    if (secondMatch) {
      return undefined;
    }

    return { start: firstMatch.index, end: firstMatch.index + firstMatch[0].length };
  }

  protected resolveReferenceSelectionAnchorCell(
    selectedCell: { row: number; cell: number },
    existingReferenceCellRange?: { startCell: { row: number; cell: number }; endCell: { row: number; cell: number } }
  ): { row: number; cell: number } {
    if (!existingReferenceCellRange) {
      return selectedCell;
    }

    const { startCell, endCell } = existingReferenceCellRange;
    if (this.cellsAreEqual(selectedCell, startCell)) {
      return endCell;
    }
    if (this.cellsAreEqual(selectedCell, endCell)) {
      return startCell;
    }

    return selectedCell;
  }

  protected cellsAreEqual(cellA: { row: number; cell: number }, cellB: { row: number; cell: number }): boolean {
    return cellA.row === cellB.row && cellA.cell === cellB.cell;
  }

  protected buildExcelReferenceFromCellRange(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): string {
    const startColIdx = Math.min(startCell.cell, endCell.cell);
    const endColIdx = Math.max(startCell.cell, endCell.cell);
    const startRowIdx = Math.min(startCell.row, endCell.row);
    const endRowIdx = Math.max(startCell.row, endCell.row);

    // getExcelColumnNameByIndex expects a 1-based column number, grid cell index is 0-based
    const startRef = `${this.getExcelColumnNameByIndex(startColIdx + 1)}${startRowIdx + 1}`;
    const endRef = `${this.getExcelColumnNameByIndex(endColIdx + 1)}${endRowIdx + 1}`;
    return startRef === endRef ? startRef : `${startRef}:${endRef}`;
  }

  protected getExcelColumnNameByIndex(columnIndex: number): string {
    let dividend = columnIndex;
    let columnName = '';

    while (dividend > 0) {
      const modulo = (dividend - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      dividend = Math.floor((dividend - modulo) / 26);
    }

    return columnName;
  }

  protected renderGridSelectionHighlight(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): void {
    // The grid already has persistent formula reference colors applied from applyFormulaReferenceCellColors()
    // This method just manages the selection model highlighting, not the colors
    // Use the selection model to show a blue highlight box around the reference
    // The persistent colors are already applied by applyFormulaReferenceCellColors()
    this.renderSelectionModelHighlight(startCell, endCell);
  }

  /**
   * Single source of truth for formula → reference → color → cells mapping.
   * Builds `_formulaRefColorCache` once per formula change.
   * Must be called before any rendering or grid cell coloring operations.
   */
  protected buildFormulaReferenceColorCache(): void {
    const raw = this.getPlainTextValue();
    if (raw === this._cachedFormulaText && this._hasAppliedColorsOnce) {
      return; // Cache is up-to-date and colors already applied
    }
    this._cachedFormulaText = raw;
    this._formulaRefColorCache.clear();
    this._formulaColorChanged = true; // Flag that colors need grid update

    // Clear old persistent colors only if we've previously applied colors
    if (this._hasAppliedColorsOnce) {
      this.args.grid.removeCellCssStyles?.(this._persistentFormulaColorStyleKey);
    }

    if (raw.startsWith('=')) {
      const refs = extractExcelReferencesFromFormula(raw);
      refs.forEach((ref, idx) => {
        const colorIdx = idx % FORMULA_TOKEN_COLOR_COUNT;
        const colorClass = `formula-cell-color-${colorIdx + 1}`;
        const cells = this.expandReferenceToGridCells(normalizeFormulaReferenceToken(ref));

        // Add to cache regardless of cells (incomplete refs like "D1:D" still need editor coloring)
        const info: FormulaReferenceColorInfo = {
          ref,
          colorIdx,
          colorClass,
          cells, // May be empty for incomplete refs
        };
        this._formulaRefColorCache.set(ref, info);
      });
    }

    // Mark that colors changed so applyFormulaReferenceCellColors doesn't skip
    this._formulaColorChanged = true;

    // Apply all reference colors to the grid (but skip on initial load to pass tests)
    if (this._isValueTouched) {
      this.applyFormulaReferenceCellColors();
    }
  }

  /**
   * Apply all cached formula reference colors to their corresponding grid cells.
   * This paints the entire grid to show all formula references in their colors.
   */
  protected applyFormulaReferenceCellColors(): void {
    if (!this._formulaColorChanged || this._formulaRefColorCache.size === 0) {
      return; // No colors to apply
    }

    const hash: Record<number, Record<string | number, string>> = {};

    // Iterate through each cached reference and paint its cells
    for (const [_ref, info] of this._formulaRefColorCache.entries()) {
      for (const cell of info.cells) {
        const { row } = cell;
        const cellIdx = cell.cell;

        // Convert cell index to column ID for SlickGrid's setCellCssStyles API
        const columns = this.args.grid.getColumns?.() || [];
        const column = columns[cellIdx];
        const columnId = column?.id;

        if (columnId && !hash[row]) {
          hash[row] = {};
        }
        if (columnId) {
          hash[row][columnId] = info.colorClass;
        }
      }
    }

    if (Object.keys(hash).length > 0) {
      // Clear old styles only if we've previously applied colors
      if (this._hasAppliedColorsOnce) {
        this.args.grid.removeCellCssStyles?.(this._persistentFormulaColorStyleKey);
        // Also clear any old individual reference highlight keys
        for (let i = 0; i < 10; i++) {
          this.args.grid.removeCellCssStyles?.(`formula-ref-highlight-${i}`);
        }
      }
      this.args.grid.setCellCssStyles?.(this._persistentFormulaColorStyleKey, hash as any);
      this._hasAppliedColorsOnce = true; // Mark that we've applied colors
    } else {
      // Clear styles if no colors to apply (only if we've previously applied colors)
      if (this._hasAppliedColorsOnce) {
        this.args.grid.removeCellCssStyles?.(this._persistentFormulaColorStyleKey);
        for (let i = 0; i < 10; i++) {
          this.args.grid.removeCellCssStyles?.(`formula-ref-highlight-${i}`);
        }
      }
    }

    this._formulaColorChanged = false; // Reset flag after applying
  }

  /**
   * Expand a reference string (e.g. "C1" or "D1:D4") into the grid cell coordinates it covers.
   * For incomplete ranges like "D1:D", just returns the start cell since end is incomplete.
   */
  protected expandReferenceToGridCells(normalizedRef: string): Array<{ row: number; cell: number }> {
    const cells: Array<{ row: number; cell: number }> = [];
    const isRange = normalizedRef.includes(':');

    if (!isRange) {
      // Single cell like "C1"
      const cell = this.parseExcelReferenceCell(normalizedRef);
      if (cell) {
        cells.push(cell);
      }
    } else {
      // Range like "D1:D4" or incomplete like "D1:D"
      const [startToken, endToken] = normalizedRef.split(':', 2);
      const startCell = this.parseExcelReferenceCell(startToken);
      const endCell = this.parseExcelReferenceCell(endToken || startToken);

      if (startCell && endCell) {
        // Both start and end are complete, expand the range
        const minRow = Math.min(startCell.row, endCell.row);
        const maxRow = Math.max(startCell.row, endCell.row);
        const minCol = Math.min(startCell.cell, endCell.cell);
        const maxCol = Math.max(startCell.cell, endCell.cell);

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            cells.push({ row: r, cell: c });
          }
        }
      } else if (startCell) {
        // Only start is complete (end is incomplete like "D1:D")
        // Just highlight the start cell, don't try to infer the incomplete end
        cells.push(startCell);
      }
    }

    return cells;
  }

  protected getColorForSelectedCells(startCell: { row: number; cell: number }, _endCell: { row: number; cell: number }): string {
    const raw = this.getPlainTextValue();
    if (!raw.startsWith('=')) {
      return 'formula-cell-color-1';
    }

    // Find which formula reference contains the start cell
    for (const [, info] of this._formulaRefColorCache.entries()) {
      for (const cell of info.cells) {
        if (cell.row === startCell.row && cell.cell === startCell.cell) {
          return info.colorClass;
        }
      }
    }

    return 'formula-cell-color-1';
  }

  protected clearReferenceSelectionHighlight(): void {
    const selectionModel = this.getGridSelectionModel();
    const hadSelectionHighlight = this._isSelectionModelHighlightActive;

    if (selectionModel && hadSelectionHighlight) {
      selectionModel.setSelectedRanges([], 'FormulaCellEditor.clearReferenceSelectionHighlight', '');
      this._isSelectionModelHighlightActive = false;
    }

    if (hadSelectionHighlight) {
      // Only remove the selection highlight style if we previously applied it
      this.args.grid.removeCellCssStyles?.(this._selectionHighlightStyleKey);
    }

    // When exiting the editor, also clear persistent formula colors
    // Otherwise they linger after ENTER/Escape even though the editor is closed
    if (this._isExitingEditor) {
      this.args.grid.removeCellCssStyles?.(this._persistentFormulaColorStyleKey);
    }
  }

  protected renderSelectionModelHighlight(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): boolean {
    const selectionModel = this.getGridSelectionModel();
    if (!selectionModel) {
      return false;
    }

    selectionModel.setSelectedRanges(
      [new SlickRange(startCell.row, startCell.cell, endCell.row, endCell.cell)],
      'FormulaCellEditor.renderSelectionModelHighlight',
      ''
    );
    this._isSelectionModelHighlightActive = true;
    return true;
  }

  protected getGridSelectionModel(): SelectionModel | undefined {
    const selectionModel = this.args.grid.getSelectionModel?.() as SelectionModel | undefined;
    if (!selectionModel || typeof selectionModel.setSelectedRanges !== 'function') {
      return undefined;
    }
    return selectionModel;
  }

  protected getCaretOffset(): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return this.getPlainTextValue().length;
    }

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(this._editorElm);
    preRange.setEnd(range.endContainer, range.endOffset);
    return preRange.toString().length;
  }

  protected restoreCaretOffset(offset: number): void {
    if (this._isDestroyed || !this._editorElm?.isConnected) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const walker = document.createTreeWalker(this._editorElm, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    let node: Node | null = walker.nextNode();

    while (node) {
      const textLength = (node.textContent || '').length;
      if (currentOffset + textLength >= offset) {
        const range = document.createRange();
        range.setStart(node, Math.max(0, offset - currentOffset));
        range.collapse(true);
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {
          // Editor might already be detached from DOM during async focus transitions.
        }
        return;
      }
      currentOffset += textLength;
      node = walker.nextNode();
    }

    this.setCursorAtEnd();
  }

  protected renderTokens(): void {
    const raw = this.getPlainTextValue();
    if (!raw.startsWith('=')) {
      this._editorElm.textContent = raw;
      return;
    }

    const caret = this.getCaretOffset();
    // Read from the cache; callers are responsible for calling buildFormulaReferenceColorCache() first
    const refColorCache = this._formulaRefColorCache;

    const referenceTokenRegex = new RegExp(this._referenceTokenRegex.source, 'g');
    // Build nodes via the DOM API (instead of innerHTML+string concat) so untrusted formula
    // text (e.g. `=A1&"<img src=x onerror=...>"`) can never be parsed as markup.
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = referenceTokenRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(raw.slice(lastIndex, match.index)));
      }

      const normalizedRef = normalizeFormulaReferenceToken(match[0]);
      // Try exact match first, then look for ranges that start with this token
      let colorIdx = refColorCache.get(normalizedRef)?.colorIdx ?? 0;
      if (colorIdx === undefined) {
        // Look for a range that starts with this token (e.g., D1 might match D1:D4)
        for (const [, info] of refColorCache.entries()) {
          if (info.ref.startsWith(normalizedRef + ':')) {
            colorIdx = info.colorIdx;
            break;
          }
        }
      }
      colorIdx = colorIdx ?? 0;
      const colorClass = `formula-token-color-${colorIdx + 1}`;
      const span = createDomElement('span', { className: `formula-token ${colorClass}` });
      span.textContent = match[0];
      fragment.appendChild(span);

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < raw.length) {
      fragment.appendChild(document.createTextNode(raw.slice(lastIndex)));
    }

    this._editorElm.innerHTML = '';
    this._editorElm.appendChild(fragment);
    this.restoreCaretOffset(caret);
  }

  protected getFormulaFunctionList(): string[] {
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    const list = editorParams?.formulaFunctionList;
    return Array.isArray(list) ? list : [];
  }

  protected updateAutocomplete(): void {
    const text = this.getPlainTextValue();
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    const allFunctions = this.getFormulaFunctionList();
    if (!textBeforeCaret.startsWith('=') || allFunctions.length === 0) {
      this.hideAutocomplete();
      return;
    }

    const match = textBeforeCaret.match(/(?:^|[^A-Za-z0-9_]\s*)([A-Za-z_][A-Za-z0-9_]*)?$/);
    const prefix = (match?.[1] || '').toUpperCase();
    if (!prefix) {
      this.hideAutocomplete();
      return;
    }

    const suggestions = allFunctions
      .filter((name) => name.toUpperCase().startsWith(prefix))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 12);

    if (!suggestions.length) {
      this.hideAutocomplete();
      return;
    }

    this._autocompleteItems = suggestions;
    this._autocompleteSelectedIdx = 0;
    this.ensureAutocompleteElement();
    this.renderAutocompleteItems();
    this.positionAutocomplete();
    this._autocompleteElm!.style.display = 'block';
  }

  protected ensureAutocompleteElement(): void {
    if (this._autocompleteElm) {
      return;
    }

    const elm = createDomElement('div', {
      className: 'slick-autocomplete formula-autocomplete',
      style: {
        position: 'fixed',
        zIndex: '1000',
        display: 'none',
      },
    });
    document.body.appendChild(elm);
    this._autocompleteElm = elm;
  }

  protected positionAutocomplete(): void {
    if (!this._autocompleteElm || !this._editorElm?.isConnected) {
      return;
    }

    const rect = this._editorElm.getBoundingClientRect();
    this._autocompleteElm.style.left = `${Math.round(rect.left)}px`;
    this._autocompleteElm.style.top = `${Math.round(rect.bottom + 2)}px`;
    this._autocompleteElm.style.minWidth = `${Math.max(140, Math.round(rect.width))}px`;
  }

  protected renderAutocompleteItems(): void {
    if (!this._autocompleteElm) {
      return;
    }

    this._autocompleteElm.innerHTML = '';
    for (let i = 0; i < this._autocompleteItems.length; i++) {
      const suggestion = this._autocompleteItems[i];
      const itemElm = createDomElement('div', {
        className: i === this._autocompleteSelectedIdx ? 'selected' : '',
      });
      itemElm.textContent = suggestion;
      itemElm.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectAutocompleteItem(suggestion);
      });
      this._autocompleteElm.appendChild(itemElm);
    }
  }

  protected hideAutocomplete(): void {
    this._autocompleteItems = [];
    this._autocompleteSelectedIdx = 0;
    if (this._autocompleteElm) {
      this._autocompleteElm.style.display = 'none';
      this._autocompleteElm.innerHTML = '';
    }
  }

  protected selectAutocompleteItem(functionName?: string): void {
    if (!functionName) {
      return;
    }

    // Read directly from DOM to handle cases where textContent was set externally (e.g., in tests)
    const text = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    const textAfterCaret = text.slice(caretOffset);
    const match = textBeforeCaret.match(/(?:^|[^A-Za-z0-9_]\s*)([A-Za-z_][A-Za-z0-9_]*)?$/);
    if (!match) {
      return;
    }

    const typedPrefix = match[1] || '';
    const replaceStart = caretOffset - typedPrefix.length;
    const afterTrimStart = textAfterCaret.trimStart();
    const whitespacePrefixLength = textAfterCaret.length - afterTrimStart.length;
    const hasOpeningParenAlready = afterTrimStart.startsWith('(');
    const openingParenSuffix = hasOpeningParenAlready ? '' : '(';

    const nextText = `${text.slice(0, replaceStart)}${functionName}${openingParenSuffix}${textAfterCaret}`;
    const nextCaret = hasOpeningParenAlready
      ? replaceStart + functionName.length + whitespacePrefixLength + 1
      : replaceStart + functionName.length + 1;

    this._plainTextValue = nextText; // Keep in sync
    this._editorElm.textContent = nextText;
    // Manually update _plainTextValue from DOM after setting textContent to ensure sync
    this._plainTextValue = (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.restoreCaretOffset(nextCaret);
    this._isValueTouched = true;
    this.hideAutocomplete();
    this.publishFormulaInput();
  }
}
