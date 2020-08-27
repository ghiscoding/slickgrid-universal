import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, SlickGrid, SlickNamespace } from '../interfaces/index';
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
  private _elementRangeInputId = '';
  private _elementRangeOutputId = '';
  private _$editorElm: any;
  private _$input: any;
  $sliderNumber: any;
  defaultValue: any;
  originalValue: any;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  constructor(private args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column | undefined {
    return this.args && this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  /** Get the Editor DOM Element */
  get editorDomElement(): any {
    return this._$input;
  }

  get hasAutoCommitEdit() {
    return this.grid && this.grid.getOptions && this.grid.getOptions().autoCommitEdit;
  }

  /** Getter for the Editor Generic Params */
  private get editorParams(): any {
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
      const itemId = this.args && this.args.item && this.args.item.id;
      this._elementRangeInputId = `rangeInput_${this.columnDef.field}_${itemId}`;
      this._elementRangeOutputId = `rangeOutput_${this.columnDef.field}_${itemId}`;
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

      this._$editorElm.on('mouseup touchend', (event: Event) => {
        if (compositeEditorOptions) {
          this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
        } else {
          this.save();
        }
      });

      // if user chose to display the slider number on the right side, then update it every time it changes
      // we need to use both "input" and "change" event to be all cross-browser
      if (!this.editorParams.hideSliderNumber) {
        this._$editorElm.on('input change', (event: JQueryEventObject & { target: HTMLInputElement }) => {
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
    this._$editorElm.off('input change mouseup touchend').remove();
  }

  focus() {
    this._$input.focus();
  }

  getValue(): string {
    return this._$input.val() || '';
  }

  setValue(value: number | string) {
    this._$input.val(value);
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
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
    const fieldName = this.columnDef && this.columnDef.field;


    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      let value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) && item[fieldName]);

      if (value === '' || value === null || value === undefined) {
        value = this.defaultValue; // load default value when item doesn't have any value
      }
      this.originalValue = +value;
      this._$input.val(value);
      this.$sliderNumber.html(value);
    }
  }

  save() {
    const validation = this.validate();
    if (validation && validation.valid && this.isValueChanged()) {
      if (this.hasAutoCommitEdit) {
        this.args.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
    }
  }

  serializeValue() {
    const elmValue: string = this._$input.val();
    return elmValue !== '' ? parseInt(elmValue, 10) : this.originalValue;
  }

  validate(_targetElm?: undefined, inputValue?: any): EditorValidationResult {
    const elmValue = (inputValue !== undefined) ? inputValue : this._$input && this._$input.val && this._$input.val();
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
  // private functions
  // ------------------

  /**
   * Create the HTML template as a string
   */
  private buildTemplateHtmlString() {
    const fieldId = this.columnDef && this.columnDef.id;
    const title = this.columnEditor && this.columnEditor.title || '';
    const minValue = this.columnEditor.hasOwnProperty('minValue') ? this.columnEditor.minValue : DEFAULT_MIN_VALUE;
    const maxValue = this.columnEditor.hasOwnProperty('maxValue') ? this.columnEditor.maxValue : DEFAULT_MAX_VALUE;
    const defaultValue = this.editorParams.hasOwnProperty('sliderStartValue') ? this.editorParams.sliderStartValue : minValue;
    const step = this.columnEditor.hasOwnProperty('valueStep') ? this.columnEditor.valueStep : DEFAULT_STEP;
    this.defaultValue = defaultValue;

    if (this.editorParams.hideSliderNumber) {
      return `
      <div class="slider-container slider-editor">
        <input type="range" name="${this._elementRangeInputId}" title="${title}"
          defaultValue="${defaultValue}" value="${defaultValue}"
          min="${minValue}" max="${maxValue}" step="${step}"
          class="form-control slider-editor-input editor-${fieldId} range ${this._elementRangeInputId}" />
      </div>`;
    }

    return `
      <div class="input-group slider-container slider-editor">
        <input type="range" name="${this._elementRangeInputId}" title="${title}"
          defaultValue="${defaultValue}" value="${defaultValue}"
          min="${minValue}" max="${maxValue}" step="${step}"
          class="form-control slider-editor-input editor-${fieldId} range ${this._elementRangeInputId}" />
        <div class="input-group-addon input-group-append slider-value"><span class="input-group-text ${this._elementRangeOutputId}">${defaultValue}</span></div>
      </div>`;
  }

  private handleChangeOnCompositeEditor(event: Event, compositeEditorOptions: CompositeEditorOption) {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const item = this.args.item;
    const grid = this.grid;

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.args.item, this.serializeValue());
    }
    this.applyValue(compositeEditorOptions.formValues, this.serializeValue());
    grid.onCompositeEditorChange.notify({ ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues }, { ...new Slick.EventData(), ...event });
  }
}
