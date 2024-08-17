import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, setDeepValue, toSentenceCase } from '@slickgrid-universal/utils';

import type {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  GridOption,
} from '../interfaces/index';
import { getDescendantProperty } from '../services/utilities';
import { textValidator } from '../editorValidators/textValidator';
import { SlickEventData, type SlickGrid } from '../core/index';

const DEFAULT_DECIMAL_PLACES = 0;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class InputEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _input!: HTMLInputElement | undefined;
  protected _inputType = 'text';
  protected _isValueTouched = false;
  protected _lastInputKeyEvent?: KeyboardEvent;
  protected _originalValue?: number | string;
  protected _timer?: number;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  constructor(protected readonly args: EditorArguments, inputType = 'text') {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = args.grid && args.grid.getOptions() as GridOption;
    this._bindEventService = new BindingEventService();
    this.inputType = inputType;
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.editor || {} as ColumnEditor;
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): any {
    return this._input;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Getter of input type (text, number, password) */
  get inputType(): string {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    const columnId = this.columnDef?.id ?? '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    this._input = createDomElement('input', {
      type: this._inputType || 'text', autocomplete: 'off', ariaAutoComplete: 'none',
      ariaLabel: this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Input Editor`,
      className: `editor-text editor-${columnId}`,
      placeholder: this.columnEditor?.placeholder ?? '',
      title: this.columnEditor?.title ?? '',
    });

    // add "step" attribute when editor type is integer/float
    if (this.inputType === 'number') {
      this._input.step = `${(this.columnEditor.valueStep !== undefined) ? this.columnEditor.valueStep : this.getInputDecimalSteps()}`;
    }

    const cellContainer = this.args.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      cellContainer.appendChild(this._input);
    }

    this._bindEventService.bind(this._input, 'focus', () => this._input?.select());
    this._bindEventService.bind(this._input, 'keydown', ((event: KeyboardEvent) => {
      this._isValueTouched = true;
      this._lastInputKeyEvent = event;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.stopImmediatePropagation();
      }
    }) as EventListener);

    // listen to focusout or blur to automatically call a save
    if (this.hasAutoCommitEdit && !compositeEditorOptions) {
      this._bindEventService.bind(this._input, ['focusout', 'blur'], () => {
        this._isValueTouched = true;
        this.save();
      });
    }

    if (compositeEditorOptions) {
      this._bindEventService.bind(this._input, ['input', 'paste'], this.handleOnInputChange.bind(this) as EventListener);

      // add an extra mousewheel listener when editor type is integer/float
      if (this.inputType === 'number') {
        this._bindEventService.bind(this._input, 'wheel', this.handleOnMouseWheel.bind(this) as EventListener, { passive: true });
      }
    }
  }

  destroy(): void {
    this._bindEventService.unbindAll();
    this._input?.remove?.();
  }

  disable(isDisabled = true): void {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._input) {
      if (isDisabled) {
        this._input.setAttribute('disabled', 'disabled');

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this.reset('', true, true);
        }
      } else {
        this._input.removeAttribute('disabled');
      }
    }
  }

  focus(): void {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();
    this._input?.focus();
  }

  getDecimalPlaces(): number {
    // returns the number of fixed decimal places or null
    let rtn = this.columnEditor?.decimal ?? this.columnEditor?.params?.decimalPlaces ?? undefined;

    if (rtn === undefined) {
      rtn = DEFAULT_DECIMAL_PLACES;
    }
    return (!rtn && rtn !== 0 ? null : rtn);
  }

  /** when editor is a float input editor, we'll want to know how many decimals to show */
  getInputDecimalSteps(): string {
    const decimals = this.getDecimalPlaces();
    let zeroString = '';
    for (let i = 1; i < decimals; i++) {
      zeroString += '0';
    }

    if (decimals > 0) {
      return `0.${zeroString}1`;
    }
    return '1';
  }

  show(): void {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue(): string {
    return this._input?.value || '';
  }

  setValue(value: number | string, isApplyingValue = false, triggerOnCompositeEditorChange = true): void {
    if (this._input) {
      this._input.value = `${value}`;

      if (isApplyingValue) {
        this.applyValue(this.args.item, this.serializeValue());

        // if it's set by a Composite Editor, then also trigger a change for it
        const compositeEditorOptions = this.args.compositeEditorOptions;
        if (compositeEditorOptions && triggerOnCompositeEditorChange) {
          this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'system');
        }
      }
    }
  }

  applyValue(item: any, state: any): void {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, state);
      const newValue = (validation?.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        // when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor?.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else if (fieldName) {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._input?.value;
    const lastEventKey = this._lastInputKeyEvent?.key;
    if (this.columnEditor?.alwaysSaveOnEnterKey && lastEventKey === 'Enter') {
      return true;
    }
    return (!(elmValue === '' && (this._originalValue === null || this._originalValue === undefined))) && (elmValue !== this._originalValue);
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any): void {
    const fieldName = this.columnDef?.field;

    if (item && fieldName !== undefined && this._input) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) && item[fieldName] || '');

      this._originalValue = value;
      this._input.value = this._originalValue as string;
      this._input.select();
    }
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: number | string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false): void {
    const inputValue = value ?? this._originalValue ?? '';
    if (this._input) {
      this._originalValue = inputValue;
      this._input.value = `${inputValue}`;
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
    }
  }

  save(): void {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;

    if (this.hasAutoCommitEdit && isValid) {
      // do not use args.commitChanges() as this sets the focus to the next row.
      // also the select list will stay shown when clicking off the grid
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  serializeValue(): number | string {
    return this._input?.value ?? '';
  }

  validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._input && this._input.value;
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
  protected applyInputUsabilityState(): void {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({
      ...activeCell, item: this.dataContext, column: this.args.column, grid: this.grid, target: 'composite', compositeEditorOptions: this.args.compositeEditorOptions
    }).getReturnValue();
    this.disable(isCellEditable === false);
  }

  protected handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user', isCalledByClearValue = false): void {
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

  protected handleOnInputChange(event: KeyboardEvent): void {
    this._isValueTouched = true;
    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      const typingDelay = this.gridOptions?.editorTypingDebounce ?? 500;
      window.clearTimeout(this._timer);
      this._timer = window.setTimeout(() => this.handleChangeOnCompositeEditor(event, compositeEditorOptions), typingDelay);
    }
  }

  /** When the input value changes (this will cover the input spinner arrows on the right) */
  protected handleOnMouseWheel(event: KeyboardEvent): void {
    this._isValueTouched = true;
    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
    }
  }
}
