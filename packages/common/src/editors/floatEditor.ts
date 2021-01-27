import { KeyCode } from '../enums/index';
import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption, SlickGrid, SlickNamespace, } from '../interfaces/index';
import { debounce, getDescendantProperty, setDeepValue } from '../services/utilities';
import { floatValidator } from '../editorValidators/floatValidator';
import { BindingEventService } from '../services/bindingEvent.service';

const DEFAULT_DECIMAL_PLACES = 0;

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class FloatEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _input: HTMLInputElement | null;
  protected _lastInputKeyEvent: KeyboardEvent;
  protected _originalValue: number | string;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = args.grid && args.grid.getOptions() as GridOption;
    this._bindEventService = new BindingEventService();
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): any {
    return this._input;
  }

  get hasAutoCommitEdit() {
    return this.grid && this.grid.getOptions && this.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init() {
    if (this.columnDef && this.columnEditor && this.args) {
      const columnId = this.columnDef?.id ?? '';
      const placeholder = this.columnEditor?.placeholder ?? '';
      const title = this.columnEditor?.title ?? '';
      const inputStep = (this.columnEditor.valueStep !== undefined) ? this.columnEditor.valueStep : this.getInputDecimalSteps();
      const compositeEditorOptions = this.args.compositeEditorOptions;

      this._input = document.createElement('input') as HTMLInputElement;
      this._input.className = `editor-text editor-${columnId}`;
      this._input.type = 'number';
      this._input.setAttribute('role', 'presentation');
      this._input.autocomplete = 'off';
      this._input.placeholder = placeholder;
      this._input.title = title;
      this._input.step = `${inputStep}`;
      const cellContainer = this.args.container;
      if (cellContainer && typeof cellContainer.appendChild === 'function') {
        cellContainer.appendChild(this._input);
      }

      this._bindEventService.bind(this._input, 'focus', () => this._input?.select());
      this._bindEventService.bind(this._input, 'keydown', ((event: KeyboardEvent) => {
        this._lastInputKeyEvent = event;
        if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT) {
          event.stopImmediatePropagation();
        }
      }));

      // the lib does not get the focus out event for some reason
      // so register it here
      if (this.hasAutoCommitEdit && !compositeEditorOptions) {
        this._bindEventService.bind(this._input, 'focusout', () => this.save());
      }

      if (compositeEditorOptions) {
        this._bindEventService.bind(this._input, 'input', this.handleOnInputChange.bind(this));
        this._bindEventService.bind(this._input, 'paste', this.handleOnInputChange.bind(this));
        this._bindEventService.bind(this._input, 'wheel', this.handleOnMouseWheel.bind(this));
      }
    }
  }

  destroy() {
    this._bindEventService.unbindAll();
    if (this._input) {
      setTimeout(() => {
        if (this._input) {
          this._input.remove();
          this._input = null;
        }
      });
    }
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._input) {
      if (isDisabled) {
        this._input.setAttribute('disabled', 'disabled');

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this._originalValue = '';
          this._input.value = '';
          this.handleChangeOnCompositeEditor(null, this.args.compositeEditorOptions);
        }
      } else {
        this._input.removeAttribute('disabled');
      }
    }
  }

  focus(): void {
    if (this._input) {
      this._input.focus();
    }
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getDecimalPlaces(): number {
    // returns the number of fixed decimal places or null
    let rtn = this.columnEditor?.decimal ?? this.columnEditor?.params?.decimalPlaces ?? undefined;

    if (rtn === undefined) {
      rtn = DEFAULT_DECIMAL_PLACES;
    }
    return (!rtn && rtn !== 0 ? null : rtn);
  }

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

  getValue(): string {
    return this._input?.value || '';
  }

  setValue(value: number | string, isApplyingValue = false) {
    if (this._input) {
      this._input.value = `${value}`;

      if (isApplyingValue) {
        this.applyValue(this.args.item, this.serializeValue());

        // if it's set by a Composite Editor, then also trigger a change for it
        const compositeEditorOptions = this.args.compositeEditorOptions;
        if (compositeEditorOptions) {
          this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'system');
        }
      }
    }
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      const validation = this.validate(null, state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._input?.value;
    const lastKeyEvent = this._lastInputKeyEvent && this._lastInputKeyEvent.keyCode;
    if (this.columnEditor && this.columnEditor.alwaysSaveOnEnterKey && lastKeyEvent === KeyCode.ENTER) {
      return true;
    }
    return (!(elmValue === '' && (this._originalValue === null || this._originalValue === undefined))) && (elmValue !== this._originalValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (fieldName !== undefined) {

      if (item && fieldName !== undefined && this._input) {
        // is the field a complex object, "address.streetNumber"
        const isComplexObject = fieldName?.indexOf('.') > 0;
        const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

        this._originalValue = value;
        const decPlaces = this.getDecimalPlaces();
        if (decPlaces !== null && (this._originalValue || this._originalValue === 0) && (+this._originalValue).toFixed) {
          this._originalValue = (+this._originalValue).toFixed(decPlaces);
        }
        this._input.value = `${this._originalValue}`;
        this._input.select();
      }
    }
  }

  save() {
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

  serializeValue() {
    const elmValue = this._input?.value;
    if (elmValue === undefined || elmValue === '' || isNaN(+elmValue)) {
      return elmValue;
    }

    let rtn = parseFloat(elmValue);
    const decPlaces = this.getDecimalPlaces();
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }

    return rtn;
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._input?.value;
    return floatValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      decimal: this.getDecimalPlaces(),
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
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
    const isCellEditable = this.grid.onBeforeEditCell.notify({ ...activeCell, item: this.args.item, column: this.args.column, grid: this.grid });
    this.disable(isCellEditable === false);
  }

  protected handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user') {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.args.item;
    const grid = this.grid;
    const newValue = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.args.item, newValue);
    }
    this.applyValue(compositeEditorOptions.formValues, newValue);

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(columnId)) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      { ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues, editors: compositeEditorOptions.editors, triggeredBy },
      { ...new Slick.EventData(), ...event }
    );
  }

  /** When the input value changes (this will cover the input spinner arrows on the right) */
  protected handleOnMouseWheel(event: KeyboardEvent) {
    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
    }
  }

  protected handleOnInputChange(event: KeyboardEvent) {
    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      const typingDelay = this.gridOptions?.editorTypingDebounce ?? 500;
      debounce(() => this.handleChangeOnCompositeEditor(event, compositeEditorOptions), typingDelay)();
    }
  }
}
