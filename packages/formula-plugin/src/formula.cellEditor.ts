import { BindingEventService } from '@slickgrid-universal/binding';
import type { Editor, EditorArguments, EditorValidationResult, SelectionModel } from '@slickgrid-universal/common';
import { createDomElement, SlickRange } from '@slickgrid-universal/common';
import {
  buildFormulaReferenceCssHash,
  findFormulaReferenceTokens,
  FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY,
  FormulaReferenceColorCache,
  getExcelColumnNameByIndex,
  normalizeFormulaReferenceToken,
  parseExcelReferenceCell,
  setFormulaObjectProperty,
  skipFormulaString,
} from './formula-reference.js';
import type { FormulaEditorParams } from './interfaces/index.js';

export class FormulaCellEditor implements Editor {
  protected static _instanceCount = 0;
  protected _autocompleteElm?: HTMLDivElement;
  protected _autocompleteItems: string[] = [];
  protected _autocompleteSelectedIdx = 0;
  protected _editorElm!: HTMLDivElement;
  protected _gridContainerElm?: HTMLElement;
  protected _blurRestoreTimer?: ReturnType<typeof setTimeout>;
  protected _isDraggingGridRefSelection = false;
  protected _isComposing = false;
  protected _compositionStartValue = '';
  protected _isOpenedByTabKey = false;
  protected _isDestroyed = false;
  protected _isExitingEditor = false;
  protected _isValueTouched = false;
  protected _originalValue = '';
  protected _referenceEditRange?: { start: number; end: number };
  protected _referenceRangeAnchorCell?: { row: number; cell: number };
  protected _selectionRangesBeforeFormulaHighlight?: SlickRange[];
  protected _suppressNextGridClick = false;
  protected _suppressGridClickResetTimer?: ReturnType<typeof setTimeout>;
  protected _suppressInitialTabBlur = false;
  protected _tabNavigateTimer?: ReturnType<typeof setTimeout>;
  protected _isSyncingReferenceFromCaret = false;
  protected _isSelectionModelHighlightActive = false;
  protected _plainTextValue = ''; // Keep plain text in sync with DOM for reliable copy/paste
  protected _undoStack: Array<{ value: string; caret: number }> = [];
  protected _redoStack: Array<{ value: string; caret: number }> = [];
  protected _formulaRefColorCache: FormulaReferenceColorCache = new FormulaReferenceColorCache();
  protected _bindEventService: BindingEventService = new BindingEventService();
  protected readonly _autocompleteId: string;

  protected _initialLoadComplete = false; // Skip sync on first focusin during editor load

  constructor(protected readonly args: EditorArguments) {
    this._autocompleteId = `formula-autocomplete-${++FormulaCellEditor._instanceCount}`;
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
    this._editorElm.setAttribute('aria-autocomplete', 'list');
    this._editorElm.setAttribute('aria-controls', this._autocompleteId);
    this._editorElm.setAttribute('aria-expanded', 'false');
    this._editorElm.setAttribute('aria-haspopup', 'listbox');
    this._editorElm.setAttribute('spellcheck', 'false');
    this.args.container.appendChild(this._editorElm);

    this._bindEventService.bind(this._editorElm, 'input', this.handleInput.bind(this));
    this._bindEventService.bind(this._editorElm, 'compositionstart', this.handleCompositionStart.bind(this));
    this._bindEventService.bind(this._editorElm, 'compositionend', this.handleCompositionEnd.bind(this));
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
    this.clearFormulaReferenceColors();
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
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    const displayValue = editorParams?.toDisplayFormula?.(String(value), item) ?? String(value);
    this._originalValue = displayValue;
    this._plainTextValue = this._originalValue; // Keep in sync
    this._editorElm.textContent = this._originalValue;
    this._undoStack = [];
    this._redoStack = [];

    // Build cache first so colors are assigned correctly (this also applies colors to grid)
    this.buildFormulaReferenceColorCache();

    this.renderTokens();
    this._initialLoadComplete = true; // Allow sync on subsequent focusin events
  }

  serializeValue(): string {
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    return editorParams?.toStoredFormula?.(this.getPlainTextValue(), this.args.item) ?? this.getPlainTextValue();
  }

  applyValue(item: any, state: any): void {
    const field = this.args.column.field as string;
    setFormulaObjectProperty(item, field, state);
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    editorParams?.onFormulaCommit?.(String(state ?? ''), item);
  }

  isValueChanged(): boolean {
    return this.getPlainTextValue() !== this._originalValue;
  }

  validate(): EditorValidationResult {
    const validator = this.args.column.editor?.validator ?? this.args.column.validator;
    const formula = this.getPlainTextValue();
    const validation = validator?.(formula, this.args);
    if (validation && !validation.valid) {
      return validation;
    }
    const editorParams = this.args.column.editor?.params as FormulaEditorParams | undefined;
    const error = editorParams?.validateFormulas ? editorParams.validateFormula?.(formula, this.args.item) : undefined;
    return error ? { valid: false, msg: `Invalid formula: ${error}` } : { valid: true, msg: '' };
  }

  protected handleInput(): void {
    const nextValue = this.readEditorText();
    if (this._isComposing) {
      this._plainTextValue = nextValue;
      this.publishFormulaInput();
      return;
    }
    this.processInputChange(this._plainTextValue, nextValue);
  }

  protected processInputChange(previousValue: string, nextValue: string): void {
    if (previousValue !== nextValue) {
      this._undoStack.push({ value: previousValue, caret: Math.min(this.getCaretOffset(), previousValue.length) });
      this._redoStack = [];
    }
    this._isValueTouched = true;
    this._plainTextValue = nextValue;
    this.clearReferenceSelectionHighlight();

    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.syncReferenceSelectionFromCaret();
    this.updateAutocomplete();
    this.publishFormulaInput();
  }

  protected handleCompositionStart(): void {
    this._isComposing = true;
    this._compositionStartValue = this._plainTextValue;
  }

  protected handleCompositionEnd(): void {
    this._isComposing = false;
    this.processInputChange(this._compositionStartValue, this.readEditorText());
  }

  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    const previousValue = this._plainTextValue;
    let inputHandled = false;
    const inputListener = () => {
      inputHandled = true;
    };
    this._editorElm.addEventListener('input', inputListener, { once: true });
    document.execCommand('insertText', false, text);
    this._editorElm.removeEventListener('input', inputListener);
    if (!inputHandled) {
      const caret = this.getCaretOffset();
      this.processInputChange(previousValue, `${previousValue.slice(0, caret)}${text}${previousValue.slice(caret)}`);
      this.restoreCaretOffset(caret + text.length);
    }
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
    const isShortcut = (event.ctrlKey || event.metaKey) && !event.altKey;
    const shortcutKey = isShortcut ? event.key.toLowerCase() : '';

    // Keep Select-All scoped to the formula editor: let the browser select editor content, but stop SlickGrid handling it.
    if (shortcutKey === 'a') {
      this.stopEvent(event, false);
      return;
    }

    if (shortcutKey === 'z') {
      const stack = event.shiftKey ? this._redoStack : this._undoStack;
      if (stack.length) {
        this.stopEvent(event);
        this.applyInputHistory(event.shiftKey);
      }
      return;
    }

    // Copy/cut plain text only, not token HTML.
    if (shortcutKey === 'c' || shortcutKey === 'x') {
      this.stopEvent(event);
      const { text, start, end } = this.getClipboardSelection();
      navigator.clipboard.writeText(text).catch(() => {});
      if (shortcutKey === 'x') {
        const value = this.readEditorText();
        this._undoStack.push({ value, caret: start });
        this._redoStack = [];
        this.setEditorText(`${value.slice(0, start)}${value.slice(end)}`, start);
      }
      return;
    }

    if (this._autocompleteItems.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this.stopEvent(event);
        const count = this._autocompleteItems.length;
        this._autocompleteSelectedIdx = (this._autocompleteSelectedIdx + (event.key === 'ArrowDown' ? 1 : count - 1)) % count;
        this.renderAutocompleteItems();
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        this.stopEvent(event);
        this.selectAutocompleteItem(this._autocompleteItems[this._autocompleteSelectedIdx]);
        return;
      }

      if (event.key === 'Escape') {
        this.stopEvent(event);
        this.hideAutocomplete();
        return;
      }
    }

    if (isShortcut && !event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const text = this.getPlainTextValue();
      const tokenRanges = findFormulaReferenceTokens(text);
      if (tokenRanges.length > 0) {
        this.stopEvent(event);

        const caretOffset = this.getCaretOffset();
        const previousToken = tokenRanges.filter((range) => range.start < caretOffset).pop();
        const targetOffset =
          event.key === 'ArrowRight'
            ? (tokenRanges.find((range) => range.end > caretOffset)?.end ?? text.length)
            : (previousToken?.start ?? 0);

        this.moveCaretToOffset(targetOffset);
        return;
      }
    }

    if (event.key === 'Home' || event.key === 'End') {
      this.stopEvent(event);
      this.moveCaretToOffset(event.key === 'Home' ? 0 : this.getPlainTextValue().length);
      return;
    }

    if (!this.args.grid.getOptions().editorNavigateOnArrows && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.stopImmediatePropagation();
      return;
    }

    if (event.key === 'Enter') {
      this.stopEvent(event);
      this.commitEdit();
    } else if (event.key === 'Tab') {
      const grid = this.args.grid;
      const isShiftTab = event.shiftKey;

      this.stopEvent(event);

      if (this._isOpenedByTabKey && !this._isValueTouched) {
        this._isOpenedByTabKey = false;
        return;
      }

      this._isOpenedByTabKey = false;
      this._suppressInitialTabBlur = false;
      const didCommit = this.commitEdit();

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

  /** Commit through the editor lock; when validation keeps the editor open, resume editing. */
  protected commitEdit(): boolean | undefined {
    this._isExitingEditor = true;
    this.clearReferenceSelectionHighlight();
    const didCommit = this.args.grid.getEditorLock?.()?.commitCurrentEdit?.();
    if (didCommit === false) {
      this.args.commitChanges();
      this.restoreEditorAfterRejectedCommit();
    }
    return didCommit;
  }

  protected stopEvent(event: Event, preventDefault = true): void {
    if (preventDefault) {
      event.preventDefault();
    }
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  protected applyInputHistory(redo: boolean): void {
    const source = redo ? this._redoStack : this._undoStack;
    const target = redo ? this._undoStack : this._redoStack;
    const state = source.pop()!;
    target.push({ value: this._plainTextValue, caret: this.getCaretOffset() });
    this.setEditorText(state.value, state.caret);
  }

  /** Replace the editor text, then refresh reference colors, tokens, caret and listeners. */
  protected setEditorText(text: string, caret: number): void {
    this._plainTextValue = text;
    this._editorElm.textContent = text;
    this._isValueTouched = true;
    this.buildFormulaReferenceColorCache();
    this.renderTokens();
    this.restoreCaretOffset(caret);
    this.publishFormulaInput();
  }

  protected readEditorText(): string {
    return (this._editorElm.textContent as string).replace(/\u00a0/g, ' ');
  }

  protected restoreEditorAfterRejectedCommit(): void {
    if (this._isDestroyed || !this._editorElm?.isConnected) {
      return;
    }

    this._isExitingEditor = false;
    this._formulaRefColorCache.clear();
    this.buildFormulaReferenceColorCache();
    this.syncReferenceSelectionFromCaret();
  }

  protected handleWindowMouseDown = (event: MouseEvent): void => {
    if (!this.shouldCaptureGridReferenceSelection(event)) {
      return;
    }

    const cell = this.args.grid.getCellFromEvent(event);
    if (!cell || cell.row < 0 || cell.cell < 0) {
      return;
    }

    this.stopEvent(event);

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

    this.stopEvent(event);
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

    this.stopEvent(event);

    this.replaceReferenceRangeFromGridSelection(this._referenceRangeAnchorCell, cell);
  };

  protected handleWindowMouseUp = (event: MouseEvent): void => {
    if (!this._isDraggingGridRefSelection) {
      return;
    }

    this.stopEvent(event);

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

  /** Selected editor text and offsets; without a selection inside the editor, the whole formula. */
  protected getClipboardSelection(): { text: string; start: number; end: number } {
    const value = this.readEditorText();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
    if (!range || range.collapsed || !this._editorElm.contains(range.startContainer) || !this._editorElm.contains(range.endContainer)) {
      return { text: value, start: 0, end: value.length };
    }
    const offsetOf = (container: Node, offset: number) => {
      const prefix = range.cloneRange();
      prefix.selectNodeContents(this._editorElm);
      prefix.setEnd(container, offset);
      return prefix.toString().length;
    };
    return {
      text: range.toString().replace(/\u00a0/g, ' '),
      start: offsetOf(range.startContainer, range.startOffset),
      end: offsetOf(range.endContainer, range.endOffset),
    };
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
    const target = event.target as Node | null;
    return (
      !this._isDestroyed &&
      !this._isExitingEditor &&
      event.button === 0 &&
      !!this._editorElm?.isConnected &&
      this.getPlainTextValue().trimStart().startsWith('=') &&
      this.isEventInsideGrid(event) &&
      !(target && (this._editorElm.contains(target) || this._autocompleteElm?.contains(target))) &&
      !!this.args.grid.getCellFromEvent(event)
    );
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
    const caretOffset = this.getCaretOffset();
    const token = findFormulaReferenceTokens(this.getPlainTextValue()).find(({ start, end }) => caretOffset >= start && caretOffset <= end);
    return token && { start: token.start, end: token.end };
  }

  protected syncReferenceSelectionFromCaret(): void {
    if (this._isSyncingReferenceFromCaret || this._isDraggingGridRefSelection || this._isDestroyed || !this._editorElm?.isConnected) {
      return;
    }

    const activeReferenceRange = this.getPlainTextValue().trimStart().startsWith('=')
      ? this.getReferenceTokenRangeAtCaretOrUndefined()
      : undefined;
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
      this.renderSelectionModelHighlight(parsedRange.startCell, parsedRange.endCell);
    } finally {
      this._isSyncingReferenceFromCaret = false;
    }
  }

  protected parseExcelReferenceCellRange(
    referenceToken: string
  ): { startCell: { row: number; cell: number }; endCell: { row: number; cell: number } } | undefined {
    const [startToken, endToken = startToken] = normalizeFormulaReferenceToken(referenceToken).split(':', 2);
    const startCell = parseExcelReferenceCell(startToken);
    const endCell = parseExcelReferenceCell(endToken);
    return startCell && endCell ? { startCell, endCell } : undefined;
  }

  protected replaceReferenceRangeFromGridSelection(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): void {
    const nextReference = this.buildExcelReferenceFromCellRange(startCell, endCell);
    const text = this.getPlainTextValue();
    const replaceRange = this._referenceEditRange ?? this.getReferenceTokenRangeAtCaret();
    const safeStart = Math.max(0, Math.min(replaceRange.start, text.length));
    const safeEnd = Math.max(safeStart, Math.min(replaceRange.end, text.length));

    const nextText = `${text.slice(0, safeStart)}${nextReference}${text.slice(safeEnd)}`;
    this._referenceEditRange = { start: safeStart, end: safeStart + nextReference.length };

    this.args.grid.focus('internal');
    this._editorElm.focus();
    this.setEditorText(nextText, this._referenceEditRange.end);
    this.renderSelectionModelHighlight(startCell, endCell);
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
    const lastChar = textBeforeCaretTrimEnd[textBeforeCaretTrimEnd.length - 1];
    return /[=,(+\-*/^&:]/.test(lastChar);
  }

  protected getSingleReferenceTokenRangeOrUndefined(): { start: number; end: number } | undefined {
    const tokens = findFormulaReferenceTokens(this.getPlainTextValue());
    return tokens.length === 1 ? { start: tokens[0].start, end: tokens[0].end } : undefined;
  }

  protected resolveReferenceSelectionAnchorCell(
    selectedCell: { row: number; cell: number },
    existingReferenceCellRange?: { startCell: { row: number; cell: number }; endCell: { row: number; cell: number } }
  ): { row: number; cell: number } {
    if (!existingReferenceCellRange) {
      return selectedCell;
    }

    const { startCell, endCell } = existingReferenceCellRange;
    const isSelected = (cell: { row: number; cell: number }) => cell.row === selectedCell.row && cell.cell === selectedCell.cell;
    return isSelected(startCell) ? endCell : isSelected(endCell) ? startCell : selectedCell;
  }

  protected buildExcelReferenceFromCellRange(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): string {
    const toRef = (cell: number, row: number) => `${getExcelColumnNameByIndex(cell + 1)}${row + 1}`;
    const startRef = toRef(Math.min(startCell.cell, endCell.cell), Math.min(startCell.row, endCell.row));
    const endRef = toRef(Math.max(startCell.cell, endCell.cell), Math.max(startCell.row, endCell.row));
    return startRef === endRef ? startRef : `${startRef}:${endRef}`;
  }

  /**
   * Refresh the shared formula → reference → color → cells cache.
   * Must be called before any rendering or grid cell coloring operations.
   */
  protected buildFormulaReferenceColorCache(): void {
    this._formulaRefColorCache.update(this.getPlainTextValue());
    this.applyFormulaReferenceCellColors();
  }

  /**
   * Apply all cached formula reference colors to their corresponding grid cells.
   * This paints the entire grid to show all formula references in their colors.
   */
  protected applyFormulaReferenceCellColors(): void {
    if (!this._formulaRefColorCache.isDirty) {
      return; // No colors to apply
    }

    const hash = buildFormulaReferenceCssHash(
      this._formulaRefColorCache.values(),
      this.args.grid.getColumns?.() || [],
      this.args.grid.getDataLength?.()
    );

    if (Object.keys(hash).length > 0) {
      this.args.grid.setCellCssStyles?.(FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY, hash as any);
    } else {
      this.clearFormulaReferenceColors();
    }

    this._formulaRefColorCache.markClean();
  }

  protected clearFormulaReferenceColors(): void {
    this.args.grid.removeCellCssStyles?.(FORMULA_REFERENCE_HIGHLIGHT_STYLE_KEY);
  }

  protected clearReferenceSelectionHighlight(): void {
    const selectionModel = this.getGridSelectionModel();
    const hadSelectionHighlight = this._isSelectionModelHighlightActive;

    if (hadSelectionHighlight) {
      selectionModel?.setSelectedRanges(
        this._selectionRangesBeforeFormulaHighlight ?? [],
        'FormulaCellEditor.clearReferenceSelectionHighlight',
        ''
      );
      this._isSelectionModelHighlightActive = false;
    }
    this._selectionRangesBeforeFormulaHighlight = undefined;

    // When exiting the editor, also clear persistent formula colors
    // Otherwise they linger after ENTER/Escape even though the editor is closed
    if (this._isExitingEditor) {
      this.clearFormulaReferenceColors();
    }
  }

  protected renderSelectionModelHighlight(startCell: { row: number; cell: number }, endCell: { row: number; cell: number }): boolean {
    const selectionModel = this.getGridSelectionModel();
    if (!selectionModel) {
      return false;
    }

    if (!this._isSelectionModelHighlightActive) {
      const selectedRanges =
        typeof selectionModel.getSelectedRanges === 'function' ? selectionModel.getSelectedRanges() : ([] as SlickRange[]);
      this._selectionRangesBeforeFormulaHighlight = selectedRanges.map(
        (range) => new SlickRange(range.fromRow, range.fromCell, range.toRow, range.toCell)
      );
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

  protected moveCaretToOffset(offset: number): void {
    this._editorElm.focus({ preventScroll: true });
    this.restoreCaretOffset(offset);
    this._editorElm.scrollLeft = offset === 0 ? 0 : this._editorElm.scrollWidth;
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
    // Read from the shared cache; callers are responsible for calling buildFormulaReferenceColorCache() first
    const refColorCache = this._formulaRefColorCache;

    // Build nodes via the DOM API (instead of innerHTML+string concat) so untrusted formula
    // text (e.g. `=A1&"<img src=x onerror=...>"`) can never be parsed as markup.
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    for (const token of findFormulaReferenceTokens(raw)) {
      if (token.start > lastIndex) {
        fragment.appendChild(document.createTextNode(raw.slice(lastIndex, token.start)));
      }

      const normalizedRef = normalizeFormulaReferenceToken(token.ref);
      const colorIdx = refColorCache.get(normalizedRef)?.colorIdx ?? 0;
      const colorClass = `formula-token-color-${colorIdx + 1}`;
      const span = createDomElement('span', { className: `formula-token ${colorClass}` });
      span.textContent = token.ref;
      fragment.appendChild(span);

      lastIndex = token.end;
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
    const list = editorParams?.formulaFunctionList ?? editorParams?.getFormulaFunctionList?.();
    return Array.isArray(list) ? list : [];
  }

  protected updateAutocomplete(): void {
    const text = this.getPlainTextValue();
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    const allFunctions = this.getFormulaFunctionList();
    if (!textBeforeCaret.startsWith('=') || allFunctions.length === 0 || this.isInsideQuotedText(textBeforeCaret)) {
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
    this._editorElm.setAttribute('aria-expanded', 'true');
  }

  protected isInsideQuotedText(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"' || text[i] === "'") {
        i = skipFormulaString(text, i) - 1;
        if (i < 0) {
          return true;
        }
      }
    }
    return false;
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
    elm.id = this._autocompleteId;
    elm.setAttribute('role', 'listbox');
    elm.setAttribute('aria-label', 'Formula functions');
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
      itemElm.id = `${this._autocompleteId}-option-${i}`;
      itemElm.setAttribute('role', 'option');
      itemElm.setAttribute('aria-selected', String(i === this._autocompleteSelectedIdx));
      itemElm.textContent = suggestion;
      itemElm.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectAutocompleteItem(suggestion);
      });
      this._autocompleteElm.appendChild(itemElm);
    }
    this._editorElm.setAttribute('aria-activedescendant', `${this._autocompleteId}-option-${this._autocompleteSelectedIdx}`);
  }

  protected hideAutocomplete(): void {
    this._autocompleteItems = [];
    this._autocompleteSelectedIdx = 0;
    if (this._autocompleteElm) {
      this._autocompleteElm.style.display = 'none';
      this._autocompleteElm.innerHTML = '';
    }
    this._editorElm.removeAttribute('aria-activedescendant');
    this._editorElm.setAttribute('aria-expanded', 'false');
  }

  protected selectAutocompleteItem(functionName?: string): void {
    if (!functionName) {
      return;
    }

    const text = this.readEditorText();
    const caretOffset = this.getCaretOffset();
    const textBeforeCaret = text.slice(0, caretOffset);
    const textAfterCaret = text.slice(caretOffset).replace(/^[A-Za-z0-9_]*/, '');
    const match = textBeforeCaret.match(/(?:^|[^A-Za-z0-9_]\s*)([A-Za-z_][A-Za-z0-9_]*)?$/);
    if (!match || this.isInsideQuotedText(textBeforeCaret)) {
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

    this.hideAutocomplete();
    this.setEditorText(nextText, nextCaret);
  }
}
