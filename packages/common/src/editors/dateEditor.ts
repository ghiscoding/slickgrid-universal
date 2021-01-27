import * as flatpickr_ from 'flatpickr';
import * as moment_ from 'moment-mini';
import { BaseOptions as FlatpickrBaseOptions } from 'flatpickr/dist/types/options';
import { Instance as FlatpickrInstance, FlatpickrFn } from 'flatpickr/dist/types/instance';
const flatpickr: FlatpickrFn = (flatpickr_ && flatpickr_['default'] || flatpickr_) as any; // patch for rollup
const moment = moment_['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import { Constants } from './../constants';
import { FieldType } from '../enums/index';
import {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  FlatpickrOption,
  GridOption,
  SlickGrid,
  SlickNamespace,
} from './../interfaces/index';
import { destroyObjectDomElementProps, getDescendantProperty, mapFlatpickrDateFormatWithFieldType, mapMomentDateFormatWithFieldType, setDeepValue } from './../services/utilities';
import { TranslaterService } from '../services/translater.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a date picker editor using Flatpickr
 * https://chmln.github.io/flatpickr
 */
export class DateEditor implements Editor {
  protected _$inputWithData: any;
  protected _$input: any;
  protected _$editorInputElm: any;
  protected _$closeButtonGroupElm: any;
  protected _lastTriggeredByClearDate = false;
  protected _originalDate: string;
  protected _pickerMergedOptions: FlatpickrOption;

  flatInstance: FlatpickrInstance;
  defaultDate: string;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  /** The translate library */
  protected _translaterService: TranslaterService;

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
    if (this.gridOptions?.translater) {
      this._translaterService = this.gridOptions.translater;
    }
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
    return this._$input;
  }

  /** Get Flatpickr options passed to the editor by the user */
  get editorOptions(): FlatpickrOption {
    return this.columnEditor.editorOptions || {};
  }

  get hasAutoCommitEdit() {
    return this.grid.getOptions().autoCommitEdit;
  }

  get pickerOptions(): FlatpickrOption {
    return this._pickerMergedOptions;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init(): void {
    if (this.args && this.columnDef) {
      const compositeEditorOptions = this.args.compositeEditorOptions;
      const columnId = this.columnDef?.id ?? '';
      const placeholder = this.columnEditor?.placeholder ?? '';
      const title = this.columnEditor && this.columnEditor.title || '';
      const gridOptions = (this.args.grid.getOptions() || {}) as GridOption;
      this.defaultDate = (this.args.item) ? this.args.item[this.columnDef.field] : null;
      const inputFormat = mapFlatpickrDateFormatWithFieldType(this.columnEditor.type || this.columnDef.type || FieldType.dateUtc);
      const outputFormat = mapFlatpickrDateFormatWithFieldType(this.columnDef.outputType || this.columnEditor.type || this.columnDef.type || FieldType.dateUtc);
      let currentLocale = this._translaterService && this._translaterService.getCurrentLanguage && this._translaterService.getCurrentLanguage() || gridOptions.locale || 'en';
      if (currentLocale.length > 2) {
        currentLocale = currentLocale.substring(0, 2);
      }

      const pickerOptions: FlatpickrOption = {
        defaultDate: this.defaultDate as string,
        altInput: true,
        altFormat: outputFormat,
        dateFormat: inputFormat,
        closeOnSelect: true,
        wrap: true,
        locale: currentLocale,
        onChange: () => this.handleOnDateChange(),
        errorHandler: (error: Error) => {
          if (error.toString().includes('invalid locale')) {
            console.warn(`[Slickgrid-Universal] Flatpickr missing locale imports (${currentLocale}), will revert to English as the default locale.
          See Flatpickr Localization for more info, for example if we want to use French, then we can import it with:  import 'flatpickr/dist/l10n/fr';`);
          }
          // for any other error do nothing
          // Flatpickr is a little too sensitive and will throw an error when provided date is lower than minDate so just disregard the error completely
        }
      };

      // merge options with optional user's custom options
      this._pickerMergedOptions = { ...pickerOptions, ...(this.editorOptions as FlatpickrOption) };
      const inputCssClasses = `.editor-text.editor-${columnId}.form-control`;
      if (this._pickerMergedOptions.altInput) {
        this._pickerMergedOptions.altInputClass = 'flatpickr-alt-input form-control';
      }

      this._$editorInputElm = $(`<div class="flatpickr input-group"></div>`);
      const $closeButtonGroupElm = $(`<span class="input-group-btn input-group-append" data-clear></span>`);
      this._$closeButtonGroupElm = $(`<button class="btn btn-default icon-close" type="button"></button>`);

      this._$input = $(`<input type="text" data-input data-defaultDate="${this.defaultDate}" class="${inputCssClasses.replace(/\./g, ' ')}" placeholder="${placeholder}" title="${title}" />`);
      this._$input.appendTo(this._$editorInputElm);

      // show clear date button (unless user specifically doesn't want it)
      if (!this.columnEditor?.params?.hideClearButton) {
        this._$closeButtonGroupElm.appendTo($closeButtonGroupElm);
        $closeButtonGroupElm.appendTo(this._$editorInputElm);
        this._$closeButtonGroupElm.on('click', () => this._lastTriggeredByClearDate = true);
      }

      this._$editorInputElm.appendTo(this.args.container);
      this.flatInstance = (flatpickr && this._$editorInputElm[0] && typeof this._$editorInputElm[0].flatpickr === 'function') ? this._$editorInputElm[0].flatpickr(this._pickerMergedOptions) : flatpickr(this._$editorInputElm, this._pickerMergedOptions as unknown as Partial<FlatpickrBaseOptions>);

      // when we're using an alternate input to display data, we'll consider this input as the one to do the focus later on
      // else just use the top one
      this._$inputWithData = (this._pickerMergedOptions && this._pickerMergedOptions.altInput) ? $(`${inputCssClasses}.flatpickr-alt-input`) : this._$input;

      if (!compositeEditorOptions) {
        setTimeout(() => {
          this.show();
          this.focus();
        }, 50);
      }
    }
  }

  destroy() {
    this.hide();
    if (this.flatInstance && typeof this.flatInstance.destroy === 'function') {
      this.flatInstance.destroy();
      if (this.flatInstance.element) {
        setTimeout(() => destroyObjectDomElementProps(this.flatInstance));
      }
    }
    if (this._$editorInputElm?.remove) {
      this._$editorInputElm.remove();
      this._$editorInputElm = null;
    }
    if (this._$inputWithData?.remove) {
      this._$inputWithData.remove();
      this._$inputWithData = null;
    }
    this._$input.remove();
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this.flatInstance?._input) {
      if (isDisabled) {
        this.flatInstance._input.setAttribute('disabled', 'disabled');
        this._$closeButtonGroupElm.prop('disabled', true);

        // clear picker when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this._originalDate = '';
          this.flatInstance.setDate('');
          this.flatInstance.clear();
        }
      } else {
        this.flatInstance._input.removeAttribute('disabled');
        this._$closeButtonGroupElm.prop('disabled', false);
      }
    }
  }

  /**
   * Dynamically change an Editor option, this is especially useful with Composite Editor
   * since this is the only way to change option after the Editor is created (for example dynamically change "minDate" or another Editor)
   * @param {string} optionName - Flatpickr option name
   * @param {newValue} newValue - Flatpickr new option value
   */
  changeEditorOption(optionName: keyof FlatpickrOption, newValue: any) {
    if (!this.columnEditor.editorOptions) {
      this.columnEditor.editorOptions = {};
    }
    this.columnEditor.editorOptions[optionName] = newValue;
    this._pickerMergedOptions = { ...this._pickerMergedOptions, [optionName]: newValue };
    this.flatInstance.set(optionName, newValue);
  }

  focus() {
    if (this._$input) {
      this._$input.focus();
    }
    if (this._$inputWithData && typeof this._$inputWithData.focus === 'function') {
      this._$inputWithData.focus().select();
    }
  }

  hide() {
    if (this.flatInstance && typeof this.flatInstance.close === 'function') {
      this.flatInstance.close();
    }
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (!isCompositeEditor && this.flatInstance && typeof this.flatInstance.open === 'function' && this.flatInstance._input) {
      this.flatInstance.open();
    } else if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue(): string {
    return this._$input.val();
  }

  setValue(val: string, isApplyingValue = false) {
    this.flatInstance.setDate(val);

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(compositeEditorOptions, 'system');
      }
    }
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const outputTypeFormat = mapMomentDateFormatWithFieldType((this.columnDef && (this.columnDef.outputType || this.columnEditor.type || this.columnDef.type)) || FieldType.dateUtc);
      const saveTypeFormat = mapMomentDateFormatWithFieldType((this.columnDef && (this.columnDef.saveOutputType || this.columnDef.outputType || this.columnEditor.type || this.columnDef.type)) || FieldType.dateUtc);
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, state);
      const newValue = (state && validation && validation.valid) ? moment(state, outputTypeFormat).format(saveTypeFormat) : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._$input.val();
    const inputFormat = mapMomentDateFormatWithFieldType(this.columnEditor.type || this.columnDef?.type || FieldType.dateIso);
    const outputTypeFormat = mapMomentDateFormatWithFieldType((this.columnDef && (this.columnDef.outputType || this.columnEditor.type || this.columnDef.type)) || FieldType.dateUtc);
    const elmDateStr = elmValue ? moment(elmValue, inputFormat, false).format(outputTypeFormat) : '';
    const orgDateStr = this._originalDate ? moment(this._originalDate, inputFormat, false).format(outputTypeFormat) : '';
    if (elmDateStr === 'Invalid date' || orgDateStr === 'Invalid date') {
      return false;
    }
    const isChanged = this._lastTriggeredByClearDate || (!(elmDateStr === '' && orgDateStr === '')) && (elmDateStr !== orgDateStr);

    return isChanged;
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this._originalDate = value;
      this.flatInstance.setDate(value);
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
    const domValue: string = this._$input.val();

    if (!domValue) {
      return '';
    }

    const inputFormat = mapMomentDateFormatWithFieldType(this.columnEditor.type || this.columnDef?.type || FieldType.dateIso);
    const outputTypeFormat = mapMomentDateFormatWithFieldType((this.columnDef && (this.columnDef.outputType || this.columnEditor.type || this.columnDef.type)) || FieldType.dateIso);
    const value = moment(domValue, inputFormat, false).format(outputTypeFormat);

    return value;
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    const isRequired = this.args?.compositeEditorOptions ? false : this.columnEditor.required;
    const elmValue = (inputValue !== undefined) ? inputValue : this._$input && this._$input.val && this._$input.val();
    const errorMsg = this.columnEditor.errorMessage;

    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    if (this.validator) {
      return this.validator(elmValue, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && elmValue === '') {
      return {
        valid: false,
        msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD
      };
    }

    return {
      valid: true,
      msg: null
    };
  }

  //
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({ ...activeCell, item: this.args.item, column: this.args.column, grid: this.grid });
    this.disable(isCellEditable === false);
  }

  protected handleOnDateChange() {
    if (this.args) {
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(compositeEditorOptions);
      } else {
        this.save();
      }
    }
    setTimeout(() => this._lastTriggeredByClearDate = false); // reset flag after a cycle
  }

  protected handleChangeOnCompositeEditor(compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user') {
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
      new Slick.EventData()
    );
  }
}
