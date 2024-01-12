import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, getOffset, type HtmlElementPosition, setDeepValue, toSentenceCase } from '@slickgrid-universal/utils';

import { Constants } from './../constants';
import type {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  ElementPosition,
  GridOption,
  Locale,
  LongTextEditorOption,
} from '../interfaces/index';
import { getDescendantProperty, getTranslationPrefix, } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import { textValidator } from '../editorValidators/textValidator';
import { SlickEventData, type SlickGrid } from '../core/index';

/*
 * An example of a 'detached' editor.
 * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class LongTextEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _defaultTextValue: any;
  protected _isValueTouched = false;
  protected _locales: Locale;
  protected _timer?: NodeJS.Timeout;
  protected _currentLengthElm!: HTMLSpanElement;
  protected _textareaElm!: HTMLTextAreaElement;
  protected _wrapperElm!: HTMLDivElement;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  /** The translate library */
  protected _translater?: TranslaterService;

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = args.grid && args.grid.getOptions() as GridOption;
    const options = this.gridOptions || this.args.column.params || {};
    if (options?.translater) {
      this._translater = options.translater;
    }

    // get locales provided by user in forRoot or else use default English locales via the Constants
    this._locales = this.gridOptions && this.gridOptions.locales || Constants.locales;

    this._bindEventService = new BindingEventService();
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.internalColumnEditor ?? {} as ColumnEditor;
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): HTMLTextAreaElement {
    return this._textareaElm;
  }

  get editorOptions(): LongTextEditorOption {
    return this.columnEditor?.editorOptions ?? {};
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions?.autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    let cancelText = '';
    let saveText = '';
    if (this._translater && this._translater.translate && this.gridOptions.enableTranslate) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      const cancelKey = this.editorOptions.buttonTexts?.cancelKey ?? `${translationPrefix}CANCEL`;
      const saveKey = this.editorOptions.buttonTexts?.saveKey ?? `${translationPrefix}SAVE`;
      cancelText = this._translater.translate(`${translationPrefix}${cancelKey}`);
      saveText = this._translater.translate(`${translationPrefix}${saveKey}`);
    } else {
      cancelText = this.editorOptions.buttonTexts?.cancel ?? this._locales?.TEXT_CANCEL ?? 'Cancel';
      saveText = this.editorOptions.buttonTexts?.save ?? this._locales?.TEXT_SAVE ?? 'Save';
    }

    const compositeEditorOptions = this.args.compositeEditorOptions;
    const columnId = this.columnDef?.id ?? '';
    const maxLength = this.columnEditor?.maxLength;
    const textAreaRows = this.editorOptions?.rows ?? 4;

    const containerElm = compositeEditorOptions ? this.args.container : document.body;
    this._wrapperElm = createDomElement('div', {
      className: `slick-large-editor-text editor-${columnId}`,
      style: { position: compositeEditorOptions ? 'relative' : 'absolute' }
    });
    containerElm.appendChild(this._wrapperElm);

    // use textarea row if defined but don't go over 3 rows with composite editor modal
    this._textareaElm = createDomElement(
      'textarea',
      {
        ariaLabel: this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Text Editor`,
        cols: this.editorOptions?.cols ?? 40,
        rows: (compositeEditorOptions && textAreaRows > 3) ? 3 : textAreaRows,
        placeholder: this.columnEditor?.placeholder ?? '',
        title: this.columnEditor?.title ?? '',
      },
      this._wrapperElm
    );

    const editorFooterElm = createDomElement('div', { className: 'editor-footer' });
    const countContainerElm = createDomElement('span', { className: 'counter' });
    this._currentLengthElm = createDomElement('span', { className: 'text-length', textContent: '0' });
    countContainerElm.appendChild(this._currentLengthElm);

    if (maxLength !== undefined) {
      countContainerElm.appendChild(
        createDomElement('span', { className: 'separator', textContent: '/' })
      );
      countContainerElm.appendChild(
        createDomElement('span', { className: 'max-length', textContent: `${maxLength}` })
      );
    }
    editorFooterElm.appendChild(countContainerElm);

    if (!compositeEditorOptions) {
      const cancelBtnElm = createDomElement('button', { className: 'btn btn-cancel btn-default btn-xs', textContent: cancelText }, editorFooterElm);
      const saveBtnElm = createDomElement('button', { className: 'btn btn-save btn-primary btn-xs', textContent: saveText }, editorFooterElm);
      this._bindEventService.bind(cancelBtnElm, 'click', this.cancel.bind(this) as EventListener);
      this._bindEventService.bind(saveBtnElm, 'click', this.save.bind(this) as EventListener);
      this.position(this.args?.position as ElementPosition);
      this._textareaElm.focus();
      this._textareaElm.select();
    }
    this._wrapperElm.appendChild(editorFooterElm);

    this._bindEventService.bind(this._textareaElm, 'keydown', this.handleKeyDown.bind(this) as EventListener);
    this._bindEventService.bind(this._textareaElm, 'input', this.handleOnInputChange.bind(this) as unknown as EventListener);
    this._bindEventService.bind(this._textareaElm, 'paste', this.handleOnInputChange.bind(this) as unknown as EventListener);
  }

  cancel() {
    const value = this._defaultTextValue || '';
    this._textareaElm.value = value;
    this._currentLengthElm.textContent = `${value.length}`;
    if (this.args?.cancelChanges) {
      this.args.cancelChanges();
    }
  }

  hide() {
    this._wrapperElm.style.display = 'none';
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (!isCompositeEditor) {
      this._wrapperElm.style.display = 'block';
    } else {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  destroy() {
    this._bindEventService.unbindAll();
    this._wrapperElm?.remove?.();
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._textareaElm && this._wrapperElm) {
      if (isDisabled) {
        this._textareaElm.disabled = true;
        this._wrapperElm.classList.add('disabled');

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this.reset('', true, true);
        }
      } else {
        this._textareaElm.disabled = false;
        this._wrapperElm.classList.remove('disabled');
      }
    }
  }

  focus() {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();

    if (this._textareaElm) {
      this._textareaElm.focus();
      this._textareaElm.select();
    }
  }

  getValue(): string {
    return this._textareaElm.value;
  }

  setValue(val: string, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    this._textareaElm.value = val;
    this._currentLengthElm.textContent = `${val.length}`;

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions && triggerOnCompositeEditorChange) {
        this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'system');
      }
    }
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef?.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(undefined, state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        // when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor?.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._textareaElm.value;
    return (!(elmValue === '' && (this._defaultTextValue === null || this._defaultTextValue === undefined))) && (elmValue !== this._defaultTextValue);
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any) {
    const fieldName = this.columnDef?.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this._defaultTextValue = value || '';
      this._textareaElm.value = this._defaultTextValue;
      this._currentLengthElm.textContent = this._defaultTextValue.length;
      this._textareaElm.defaultValue = this._defaultTextValue;
      this._textareaElm.select();
    }
  }

  /**
   * Reposition the LongText Editor to be right over the cell, so that it looks like we opened the editor on top of the cell when in reality we just reposition (absolute) over the cell.
   * By default we use an "auto" mode which will allow to position the LongText Editor to the best logical position in the window, also when we say position, we are talking about the relative position against the grid cell.
   * We can assume that in 80% of the time the default position is bottom right, the default is "auto" but we can also override this and use a specific position.
   * Most of the time positioning of the editor will be to the "right" of the cell is ok but if our column is completely on the right side then we'll want to change the position to "left" align.
   * Same goes for the top/bottom position, Most of the time positioning the editor to the "bottom" but we are clicking on a cell at the bottom of the grid then we might need to reposition to "top" instead.
   * NOTE: this only applies to Inline Editing and will not have any effect when using the Composite Editor modal window.
   */
  position(parentPosition: Partial<HtmlElementPosition>) {
    const containerOffset = getOffset(this.args.container);
    const containerHeight = this.args.container.offsetHeight;
    const containerWidth = this.args.container.offsetWidth;
    const calculatedEditorHeight = this._wrapperElm.getBoundingClientRect().height || (this.args.position as ElementPosition).height;
    const calculatedEditorWidth = this._wrapperElm.getBoundingClientRect().width || (this.args.position as ElementPosition).width;
    const calculatedBodyHeight = document.body.offsetHeight || window.innerHeight; // body height/width might be 0 if so use the window height/width
    const calculatedBodyWidth = document.body.offsetWidth || window.innerWidth;

    // first defined position will be bottom/right (which will position the editor completely over the cell)
    let newPositionTop = containerOffset?.top ?? parentPosition.top ?? 0;
    let newPositionLeft = containerOffset?.left ?? parentPosition.left ?? 0;

    // user could explicitely use a "left" position (when user knows his column is completely on the right)
    // or when using "auto" and we detect not enough available space then we'll position to the "left" of the cell
    const position = this.editorOptions?.position ?? 'auto';
    if (position === 'left' || (position === 'auto' && (newPositionLeft + calculatedEditorWidth) > calculatedBodyWidth)) {
      const marginRightAdjustment = this.editorOptions?.marginRight ?? 0;
      newPositionLeft -= (calculatedEditorWidth - containerWidth + marginRightAdjustment);
    }

    // do the same calculation/reposition with top/bottom (default is bottom of the cell or in other word starting from the cell going down)
    if (position === 'top' || (position === 'auto' && (newPositionTop + calculatedEditorHeight) > calculatedBodyHeight)) {
      newPositionTop -= (calculatedEditorHeight - containerHeight);
    }

    // reposition the editor over the cell (90% of the time this will end up using a position on the "right" of the cell)
    this._wrapperElm.style.top = `${newPositionTop}px`;
    this._wrapperElm.style.left = `${newPositionLeft}px`;
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputValue = value ?? this._defaultTextValue ?? '';
    if (this._textareaElm) {
      this._defaultTextValue = inputValue;
      this._textareaElm.value = inputValue;
      this._currentLengthElm.textContent = inputValue.length;
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
    }
  }

  save() {
    const validation = this.validate();
    const isValid = validation?.valid ?? false;

    if (this.hasAutoCommitEdit && isValid) {
      // do not use args.commitChanges() as this sets the focus to the next row.
      // also the select list will stay shown when clicking off the grid
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  serializeValue() {
    return this._textareaElm.value;
  }

  validate(_targetElm?: HTMLElement, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._textareaElm?.value;
    return textValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minLength: this.columnEditor.minLength,
      maxLength: this.columnEditor.maxLength,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  // --
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({
      ...activeCell, item: this.dataContext, column: this.args.column, grid: this.grid, target: 'composite', compositeEditorOptions: this.args.compositeEditorOptions
    }).getReturnValue();
    this.disable(isCellEditable === false);
  }

  protected handleKeyDown(event: KeyboardEvent) {
    const key = event.key;
    this._isValueTouched = true;

    if (!this.args.compositeEditorOptions) {
      if ((key === 'Enter' && event.ctrlKey) || (event.ctrlKey && event.key.toUpperCase() === 'S')) {
        event.preventDefault();
        this.save();
      } else if (key === 'Escape') {
        event.preventDefault();
        this.cancel();
      } else if (key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        if (this.args && this.grid) {
          this.grid.navigatePrev();
        }
      } else if (key === 'Tab') {
        event.preventDefault();
        if (this.args && this.grid) {
          this.grid.navigateNext();
        }
      }
    }
  }

  /** On every input change event, we'll update the current text length counter */
  protected handleOnInputChange(event: Event & { clipboardData: DataTransfer, target: HTMLTextAreaElement; }) {
    const compositeEditorOptions = this.args.compositeEditorOptions;
    const maxLength = this.columnEditor?.maxLength;

    // when user defines a maxLength, we'll make sure that it doesn't go over this limit if so then truncate the text (disregard the extra text)
    let isTruncated = false;
    if (maxLength) {
      isTruncated = this.truncateText(this._textareaElm, maxLength);
    }

    // if the text get truncated then update text length as maxLength, else update text length with actual
    if (isTruncated) {
      this._currentLengthElm.textContent = `${maxLength}`;
    } else {
      const newText = event.type === 'paste' ? event.clipboardData.getData('text') : event.target.value;
      this._currentLengthElm.textContent = `${newText.length}`;
    }

    // when using a Composite Editor, we'll want to add a debounce delay to avoid perf issue since Composite could affect other editors in the same form
    if (compositeEditorOptions) {
      const typingDelay = this.gridOptions?.editorTypingDebounce ?? 500;
      clearTimeout(this._timer as NodeJS.Timeout);
      this._timer = setTimeout(() => this.handleChangeOnCompositeEditor(event, compositeEditorOptions), typingDelay);
    }
  }

  protected handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user', isCalledByClearValue = false) {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.dataContext;
    const grid = this.grid;
    const newValue = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.dataContext, newValue);
    }
    this.applyValue(compositeEditorOptions.formValues, newValue);

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (isCalledByClearValue || (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(columnId))) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      { ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues, editors: compositeEditorOptions.editors, triggeredBy },
      new SlickEventData(event)
    );
  }

  /**
   * Truncate text if the value is longer than the acceptable max length
   * @param inputElm - textarea html element
   * @param maxLength - max acceptable length
   * @returns truncated - returns True if it truncated or False otherwise
   */
  protected truncateText(inputElm: HTMLTextAreaElement, maxLength: number): boolean {
    const text = inputElm.value + '';
    if (text.length > maxLength) {
      inputElm.value = text.substring(0, maxLength);
      return true;
    }
    return false;
  }
}
