import { BindingEventService } from '@slickgrid-universal/binding';
import type { Editor, EditorArguments, EditorValidationResult, SelectionModel } from '@slickgrid-universal/common';
import { createDomElement, SlickRange } from '@slickgrid-universal/common';

const FORMULA_TOKEN_COLOR_COUNT = 10;

export interface FormulaEditorParams {
  debug?: boolean;
  formulaFunctionList?: string[];
  onFormulaInputChange?: (formula: string) => void;
}

function extractExcelReferencesFromFormula(formula: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  const regex = /\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+|\$?[A-Z]{1,3}\$?\d+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(formula)) !== null) {
    const ref = normalizeFormulaReferenceToken(match[0]);
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
  protected _referenceSelectionStyleKey = 'formula-editor-grid-ref-selection';
  protected _suppressNextGridClick = false;
  protected _suppressGridClickResetTimer?: ReturnType<typeof setTimeout>;
  protected _suppressInitialTabBlur = false;
  protected _tabNavigateTimer?: ReturnType<typeof setTimeout>;
  protected _isSyncingReferenceFromCaret = false;
  protected _isSelectionModelHighlightActive = false;
  protected _bindEventService: BindingEventService = new BindingEventService();

  protected readonly _referenceTokenRegex: RegExp = /\$?[A-Z]{1,3}\$?\d+\s*:\s*\$?[A-Z]{1,3}\$?\d+|\$?[A-Z]{1,3}\$?\d+/g;

  constructor(protected readonly args: EditorArguments) {
    this._isOpenedByTabKey = (this.args.event as KeyboardEvent | undefined)?.key === 'Tab';
    // Some grid focus transitions trigger an immediate blur right after editor activation.
    // Suppress the first external blur by default to keep keyboard focus inside the grid.
    this._suppressInitialTabBlur = true;
    this.init();
  }

  init(): void {
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
    this._editorElm.textContent = this._originalValue;
    this.renderTokens();
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
    this.clearReferenceSelectionHighlight();
    this.renderTokens();
    this.syncReferenceSelectionFromCaret();
    this.updateAutocomplete();
    this.publishFormulaInput();
  }

  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  protected handleFocusIn(): void {
    this.syncReferenceSelectionFromCaret();
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
    return (this._editorElm.textContent || '').replace(/\u00a0/g, ' ');
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

    return { row: rowIndex, cell: columnIndex - 1 };
  }

  protected replaceReferenceRangeFromGridSelection(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): void {
    const nextReference = this.buildExcelReferenceFromCellRange(startCell, endCell);
    const text = this.getPlainTextValue();
    const replaceRange = this._referenceEditRange ?? this.getReferenceTokenRangeAtCaret();
    const safeStart = Math.max(0, Math.min(replaceRange.start, text.length));
    const safeEnd = Math.max(safeStart, Math.min(replaceRange.end, text.length));

    const nextText = `${text.slice(0, safeStart)}${nextReference}${text.slice(safeEnd)}`;
    this._referenceEditRange = { start: safeStart, end: safeStart + nextReference.length };

    this._editorElm.textContent = nextText;
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
    if (this.renderSelectionModelHighlight(startCell, endCell)) {
      this.args.grid.removeCellCssStyles?.(this._referenceSelectionStyleKey);
      return;
    }

    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCell = Math.min(startCell.cell, endCell.cell);
    const maxCell = Math.max(startCell.cell, endCell.cell);
    const columns = this.args.grid.getColumns?.() || [];
    const hash: Record<number, Record<string | number, string>> = {};

    for (let row = minRow; row <= maxRow; row++) {
      const rowStyles: Record<string | number, string> = {};
      for (let cell = minCell; cell <= maxCell; cell++) {
        const column = columns[cell];
        if (column?.id !== undefined && column?.id !== null) {
          rowStyles[column.id] = 'formula-ref-cell-color-1';
        }
      }
      if (Object.keys(rowStyles).length > 0) {
        hash[row] = rowStyles;
      }
    }

    if (Object.keys(hash).length > 0) {
      this.args.grid.setCellCssStyles?.(this._referenceSelectionStyleKey, hash as any);
    }
  }

  protected clearReferenceSelectionHighlight(): void {
    const selectionModel = this.getGridSelectionModel();
    if (selectionModel && this._isSelectionModelHighlightActive) {
      selectionModel.setSelectedRanges([], 'FormulaCellEditor.clearReferenceSelectionHighlight', '');
      this._isSelectionModelHighlightActive = false;
    }

    this.args.grid.removeCellCssStyles?.(this._referenceSelectionStyleKey);
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
    const refs = extractExcelReferencesFromFormula(raw);
    const refColorIndex = new Map<string, number>();
    refs.forEach((ref, idx) => refColorIndex.set(ref, idx % FORMULA_TOKEN_COLOR_COUNT));

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
      const colorIdx = refColorIndex.get(normalizedRef) ?? 0;
      const span = createDomElement('span', { className: `formula-token formula-token-color-${colorIdx + 1}` });
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

    const match = textBeforeCaret.match(/(?:^|[=(,]\s*)([A-Za-z_][A-Za-z0-9_]*)?$/);
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

    const text = this.getPlainTextValue();
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    const textAfterCaret = text.slice(caretOffset);
    const match = textBeforeCaret.match(/(?:^|[=(,]\s*)([A-Za-z_][A-Za-z0-9_]*)?$/);
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

    this._editorElm.textContent = nextText;
    this.renderTokens();
    this.restoreCaretOffset(nextCaret);
    this._isValueTouched = true;
    this.hideAutocomplete();
    this.publishFormulaInput();
  }
}
