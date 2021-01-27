import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption, SlickGrid, SlickNamespace } from '../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';
import { sliderValidator } from '../editorValidators/sliderValidator';

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
  protected _defaultValue = 0;
  protected _elementRangeInputId = '';
  protected _elementRangeOutputId = '';
  protected _$editorElm: any;
  protected _$input: any;
  $sliderNumber: any;
  originalValue: any;

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
    return this._$editorElm;
  }

  /** Getter for the Editor Input DOM Element */
  get editorInputDomElement(): any {
    return this._$input;
  }

  get hasAutoCommitEdit() {
    return this.grid && this.grid.getOptions && this.grid.getOptions().autoCommitEdit;
  }

  /** Getter for the Editor Generic Params */
  protected get editorParams(): any {
    return this.columnEditor.params || {};
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
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
      const editorTemplate = this.buildTemplateHtmlString();
      this._$editorElm = $(editorTemplate);
      this._$input = this._$editorElm.children('input');
      this.$sliderNumber = this._$editorElm.children('div.input-group-addon.input-group-append').children();

      if (!compositeEditorOptions) {
        this.focus();
      }

      // watch on change event
      this._$editorElm.appendTo(container);

      this._$editorElm.on('change mouseup touchend', (event: Event) => {
        if (compositeEditorOptions) {
          this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
        } else {
          this.save();
        }
      });

      // if user chose to display the slider number on the right side, then update it every time it changes
      // we need to use both "input" and "change" event to be all cross-browser
      if (!this.editorParams.hideSliderNumber) {
        this._$editorElm.on('input change', (event: JQuery.Event & { target: HTMLInputElement }) => {
          const value = event && event.target && event.target.value || '';
          if (value && document) {
            const elements = document.getElementsByClassName(this._elementRangeOutputId || '');
            if (elements && elements.length > 0 && elements[0].innerHTML) {
              elements[0].innerHTML = value;
            }
          }
        });
      }
    }
  }

  cancel() {
    this._$input.val(this.originalValue);
    this.args.cancelChanges();
  }

  destroy() {
    if (this._$editorElm) {
      this._$editorElm.off('input change mouseup touchend').remove();
      this._$editorElm = null;
    }
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._$input) {
      if (isDisabled) {
        this._$input.attr('disabled', 'disabled');

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this._defaultValue = 0;
          this._$editorElm.children('input').val(0);
          this._$editorElm.children('div.input-group-addon.input-group-append').children().html(0);
          this._$editorElm.val(0);
          this.handleChangeOnCompositeEditor(null, this.args.compositeEditorOptions);
        }
      } else {
        this._$input.removeAttr('disabled');
      }
    }
  }

  focus() {
    if (this._$input) {
      this._$input.focus();
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
    return this._$input.val() || '';
  }

  setValue(value: number | string, isApplyingValue = false) {
    this._$input.val(value);
    this.$sliderNumber.html(value);

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
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
        setDeepValue(item, fieldName, newValue);
      } else if (item) {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._$input.val();
    return (!(elmValue === '' && this.originalValue === undefined)) && (+elmValue !== this.originalValue);
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
      this._$input.val(value);
      this.$sliderNumber.html(value);
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
    const elmValue: string = this._$input.val();
    return elmValue !== '' ? parseInt(elmValue, 10) : this.originalValue;
  }

  validate(_targetElm?: undefined, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = (inputValue !== undefined) ? inputValue : this._$input?.val();
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
  protected buildTemplateHtmlString() {
    const columnId = this.columnDef?.id ?? '';
    const title = this.columnEditor && this.columnEditor.title || '';
    const minValue = this.columnEditor.hasOwnProperty('minValue') ? this.columnEditor.minValue : DEFAULT_MIN_VALUE;
    const maxValue = this.columnEditor.hasOwnProperty('maxValue') ? this.columnEditor.maxValue : DEFAULT_MAX_VALUE;
    const defaultValue = this.editorParams.hasOwnProperty('sliderStartValue') ? this.editorParams.sliderStartValue : minValue;
    const step = this.columnEditor.hasOwnProperty('valueStep') ? this.columnEditor.valueStep : DEFAULT_STEP;
    this._defaultValue = defaultValue;

    if (this.editorParams.hideSliderNumber) {
      return `
      <div class="slider-container slider-editor">
        <input type="range" name="${this._elementRangeInputId}" title="${title}"
          defaultValue="${defaultValue}" value="${defaultValue}"
          min="${minValue}" max="${maxValue}" step="${step}"
          class="form-control slider-editor-input editor-${columnId} range ${this._elementRangeInputId}" />
      </div>`;
    }

    return `
      <div class="input-group slider-container slider-editor">
        <input type="range" name="${this._elementRangeInputId}" title="${title}"
          defaultValue="${defaultValue}" value="${defaultValue}"
          min="${minValue}" max="${maxValue}" step="${step}"
          class="form-control slider-editor-input editor-${columnId} range ${this._elementRangeInputId}" />
        <div class="input-group-addon input-group-append slider-value"><span class="input-group-text ${this._elementRangeOutputId}">${defaultValue}</span></div>
      </div>`;
  }

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
}
