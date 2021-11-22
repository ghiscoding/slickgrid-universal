import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption, SlickGrid, SlickNamespace } from '../interfaces/index';
import { getDescendantProperty, setDeepValue, toSentenceCase } from '../services/utilities';
import { sliderValidator } from '../editorValidators/sliderValidator';
import { BindingEventService } from '../services/bindingEvent.service';
import { createDomElement } from '../services/domUtilities';

const DEFAULT_MIN_VALUE = 0;
const DEFAULT_MAX_VALUE = 100;
const DEFAULT_STEP = 1;

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class SliderEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _defaultValue = 0;
  protected _elementRangeInputId = '';
  protected _elementRangeOutputId = '';
  protected _editorElm!: HTMLDivElement;
  protected _inputElm!: HTMLInputElement;
  protected _isValueTouched = false;
  originalValue?: number | string;
  sliderNumberElm: HTMLSpanElement | null = null;

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
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
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

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): HTMLDivElement {
    return this._editorElm;
  }

  /** Getter for the Editor Input DOM Element */
  get editorInputDomElement(): HTMLInputElement {
    return this._inputElm;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Getter for the Editor Generic Params */
  protected get editorParams(): any {
    return this.columnEditor.params || {};
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    const container = this.args && this.args.container;

    if (container && this.columnDef) {
      // define the input & slider number IDs
      const itemId = this.args?.item?.id ?? '';
      this._elementRangeInputId = `rangeInput_${this.columnDef.id}_${itemId}`;
      this._elementRangeOutputId = `rangeOutput_${this.columnDef.id}_${itemId}`;
      const compositeEditorOptions = this.args.compositeEditorOptions;

      // create HTML string template
      this._editorElm = this.buildDomElement();
      this._inputElm = this._editorElm.querySelector('input') as HTMLInputElement;
      this.sliderNumberElm = this._editorElm.querySelector<HTMLSpanElement>(`span.input-group-text.${this._elementRangeOutputId}`);

      if (!compositeEditorOptions) {
        this.focus();
      }

      // watch on change event
      container.appendChild(this._editorElm);
      this._bindEventService.bind(this._editorElm, ['change', 'mouseup', 'touchend'], this.handleChangeEvent.bind(this));

      // if user chose to display the slider number on the right side, then update it every time it changes
      // we need to use both "input" and "change" event to be all cross-browser
      if (!this.editorParams.hideSliderNumber) {
        this._bindEventService.bind(this._editorElm, ['input', 'change'], this.handleChangeSliderNumber.bind(this));
      }
    }
  }

  cancel() {
    if (this._inputElm) {
      this._inputElm.value = `${this.originalValue}`;
    }
    this.args.cancelChanges();
  }

  destroy() {
    this._bindEventService.unbindAll();
    this._inputElm?.remove?.();
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._inputElm) {
      if (isDisabled) {
        this._inputElm.disabled = true;

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this.reset(0, true, true);
        }
      } else {
        this._inputElm.disabled = false;
      }
    }
  }

  focus() {
    if (this._inputElm) {
      this._inputElm.focus();
    }
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue(): string {
    return this._inputElm?.value ?? '';
  }

  setValue(value: number | string, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    if (this._inputElm) {
      this._inputElm.value = `${value}`;
    }
    if (this.sliderNumberElm) {
      this.sliderNumberElm.textContent = `${value}`;
    }

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
    const fieldName = this.columnDef?.field ?? '';
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      const validation = this.validate(undefined, state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        // when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor?.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else if (item) {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._inputElm?.value ?? '';
    return (!(elmValue === '' && this.originalValue === undefined)) && (+elmValue !== this.originalValue);
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any) {
    const fieldName = this.columnDef?.field ?? '';


    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      let value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) ? item[fieldName] : this._defaultValue);

      if (value === '' || value === null || value === undefined) {
        value = this._defaultValue; // load default value when item doesn't have any value
      }
      this.originalValue = +value;
      if (this._inputElm) {
        this._inputElm.value = `${value}`;
      }
      if (this.sliderNumberElm) {
        this.sliderNumberElm.textContent = `${value}`;
      }
    }
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: number | string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputValue = value ?? this.originalValue ?? 0;
    if (this._editorElm) {
      this._editorElm.querySelector<HTMLInputElement>('input')!.value = `${inputValue}`;
      this._editorElm.querySelector<HTMLInputElement>('div.input-group-addon.input-group-append')!.textContent = `${inputValue}`;
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
    const elmValue: string = this._inputElm?.value ?? '';
    return elmValue !== '' ? parseInt(elmValue, 10) : this.originalValue;
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

    const elmValue = (inputValue !== undefined) ? inputValue : this._inputElm?.value;
    return sliderValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  //
  // protected functions
  // ------------------

  /**
   * Create the HTML template as a string
   */
  protected buildDomElement(): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    const title = this.columnEditor && this.columnEditor.title || '';
    const minValue = this.columnEditor.hasOwnProperty('minValue') ? this.columnEditor.minValue : DEFAULT_MIN_VALUE;
    const maxValue = this.columnEditor.hasOwnProperty('maxValue') ? this.columnEditor.maxValue : DEFAULT_MAX_VALUE;
    const defaultValue = this.editorParams.hasOwnProperty('sliderStartValue') ? this.editorParams.sliderStartValue : minValue;
    this._defaultValue = defaultValue;

    const inputElm = createDomElement('input', {
      type: 'range', name: this._elementRangeInputId, title,
      defaultValue, value: defaultValue, min: `${minValue}`, max: `${maxValue}`,
      step: `${this.columnEditor.hasOwnProperty('valueStep') ? this.columnEditor.valueStep : DEFAULT_STEP}`,
      className: `form-control slider-editor-input editor-${columnId} range ${this._elementRangeInputId}`,
    });
    inputElm.setAttribute('aria-label', this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Slider Editor`);

    const divContainerElm = createDomElement('div', { className: 'slider-container slider-editor' });
    divContainerElm.appendChild(inputElm);

    if (!this.editorParams.hideSliderNumber) {
      divContainerElm.classList.add('input-group');

      // <div class="input-group-addon input-group-append slider-value"><span class="input-group-text ${this._elementRangeOutputId}">${defaultValue}</span></div>
      const divGroupAddonElm = createDomElement('div', { className: 'input-group-addon input-group-append slider-value' });
      divGroupAddonElm.appendChild(
        createDomElement('span', { className: `input-group-text ${this._elementRangeOutputId}`, textContent: `${defaultValue}` })
      );
      divContainerElm.appendChild(divGroupAddonElm);
    }

    return divContainerElm;
  }

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({
      ...activeCell, item: this.dataContext, column: this.args.column, grid: this.grid, target: 'composite', compositeEditorOptions: this.args.compositeEditorOptions
    });
    this.disable(isCellEditable === false);
  }

  protected handleChangeEvent(event: Event) {
    this._isValueTouched = true;
    const compositeEditorOptions = this.args.compositeEditorOptions;

    if (compositeEditorOptions) {
      this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
    } else {
      this.save();
    }
  }

  protected handleChangeSliderNumber(event: Event) {
    const value = (<HTMLInputElement>event.target)?.value ?? '';
    if (value !== '' && this.sliderNumberElm) {
      this.sliderNumberElm.textContent = value;
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
      { ...new Slick.EventData(), ...event }
    );
  }
}
