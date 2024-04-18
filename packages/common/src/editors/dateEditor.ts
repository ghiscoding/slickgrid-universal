import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, destroyAllElementProps, emptyElement, setDeepValue } from '@slickgrid-universal/utils';
import flatpickr from 'flatpickr';
import type { BaseOptions as FlatpickrBaseOptions } from 'flatpickr/dist/types/options';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_;

import { Constants } from './../constants';
import { FieldType } from '../enums/index';
import type {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  FlatpickrOption,
  GridOption,
} from './../interfaces/index';
import { getDescendantProperty, mapFlatpickrDateFormatWithFieldType, mapMomentDateFormatWithFieldType, } from './../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import { SlickEventData, type SlickGrid } from '../core/index';

/*
 * An example of a date picker editor using Flatpickr
 * https://chmln.github.io/flatpickr
 */
export class DateEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _clearButtonElm!: HTMLButtonElement;
  protected _editorInputGroupElm!: HTMLDivElement;
  protected _inputElm!: HTMLInputElement;
  protected _inputWithDataElm!: HTMLInputElement | null;
  protected _isValueTouched = false;
  protected _lastTriggeredByClearDate = false;
  protected _originalDate?: string;
  protected _pickerMergedOptions!: FlatpickrOption;

  flatInstance!: FlatpickrInstance;
  defaultDate?: string;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  /** The translate library */
  protected _translaterService: TranslaterService | undefined;

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
    if (this.gridOptions?.translater) {
      this._translaterService = this.gridOptions.translater;
    }
    this._bindEventService = new BindingEventService();
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
  get editorDomElement(): HTMLInputElement {
    return this._inputElm;
  }

  /** Get Flatpickr options passed to the editor by the user */
  get editorOptions(): FlatpickrOption {
    return { ...this.gridOptions.defaultEditorOptions?.date, ...this.columnEditor?.editorOptions };
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  get pickerOptions(): FlatpickrOption {
    return this._pickerMergedOptions;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    if (this.args && this.columnDef) {
      const compositeEditorOptions = this.args.compositeEditorOptions;
      const columnId = this.columnDef?.id ?? '';
      const gridOptions = (this.args.grid.getOptions() || {}) as GridOption;
      this.defaultDate = (this.args.item) ? this.args.item[this.columnDef.field] : null;
      const inputFormat = mapFlatpickrDateFormatWithFieldType(this.columnEditor.type || this.columnDef.type || FieldType.dateUtc);
      const outputFormat = mapFlatpickrDateFormatWithFieldType(this.columnDef.outputType || this.columnEditor.type || this.columnDef.type || FieldType.dateUtc);
      let currentLocale = this._translaterService?.getCurrentLanguage?.() || gridOptions.locale || 'en';
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

      this._editorInputGroupElm = createDomElement('div', { className: 'flatpickr input-group' });
      const closeButtonGroupElm = createDomElement('span', { className: 'input-group-btn input-group-append', dataset: { clear: '' } });
      this._clearButtonElm = createDomElement('button', { type: 'button', className: 'btn btn-default icon-clear' });
      this._inputElm = createDomElement(
        'input',
        {
          placeholder: this.columnEditor?.placeholder ?? '',
          title: this.columnEditor && this.columnEditor.title || '',
          className: inputCssClasses.replace(/\./g, ' '),
          dataset: { input: '', defaultdate: this.defaultDate }
        },
        this._editorInputGroupElm
      );

      // show clear date button (unless user specifically doesn't want it)
      if (!(this.editorOptions as FlatpickrOption)?.hideClearButton) {
        closeButtonGroupElm.appendChild(this._clearButtonElm);
        this._editorInputGroupElm.appendChild(closeButtonGroupElm);
        this._bindEventService.bind(this._clearButtonElm, 'click', () => this._lastTriggeredByClearDate = true);
      }

      this.args.container.appendChild(this._editorInputGroupElm);
      this.flatInstance = flatpickr(this._editorInputGroupElm, this._pickerMergedOptions as unknown as Partial<FlatpickrBaseOptions>);

      // add dark mode CSS class when enabled
      if (this.gridOptions?.darkMode) {
        this.flatInstance.calendarContainer.classList.add('slick-dark-mode');
      }

      // when we're using an alternate input to display data, we'll consider this input as the one to do the focus later on
      // else just use the top one
      this._inputWithDataElm = (this._pickerMergedOptions?.altInput) ? document.querySelector<HTMLInputElement>(`${inputCssClasses}.flatpickr-alt-input`) : this._inputElm;

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
    this._bindEventService.unbindAll();

    if (typeof this.flatInstance?.destroy === 'function') {
      this.flatInstance.destroy();
      if (this.flatInstance?.element) {
        setTimeout(() => destroyAllElementProps(this.flatInstance));
      }
    }
    emptyElement(this._editorInputGroupElm);
    emptyElement(this._inputWithDataElm);
    emptyElement(this._inputElm);
    this._editorInputGroupElm?.remove?.();
    this._inputWithDataElm?.remove?.();
    this._inputElm?.remove?.();
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this.flatInstance?._input) {
      if (isDisabled) {
        this.flatInstance._input.setAttribute('disabled', 'disabled');
        this._clearButtonElm.disabled = true;

        // clear picker when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this.reset('', true, true);
        }
      } else {
        this.flatInstance._input.removeAttribute('disabled');
        this._clearButtonElm.disabled = false;
      }
    }
  }

  /**
   * Dynamically change an Editor option, this is especially useful with Composite Editor
   * since this is the only way to change option after the Editor is created (for example dynamically change "minDate" or another Editor)
   * @param {string} optionName - Flatpickr option name
   * @param {newValue} newValue - Flatpickr new option value
   */
  changeEditorOption(optionName: keyof FlatpickrBaseOptions, newValue: any) {
    if (!this.columnEditor.editorOptions) {
      this.columnEditor.editorOptions = {};
    }
    this.columnEditor.editorOptions[optionName] = newValue;
    this._pickerMergedOptions = { ...this._pickerMergedOptions, [optionName]: newValue };
    this.flatInstance.set(optionName, newValue);
  }

  focus() {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();

    this.show();
    this._inputElm?.focus();
    if (this._inputWithDataElm?.focus) {
      this._inputWithDataElm.focus();
      this._inputWithDataElm.select();
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
    return this._inputElm.value;
  }

  setValue(val: string, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    this.flatInstance.setDate(val);

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions && triggerOnCompositeEditorChange) {
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
    const elmValue = this._inputElm.value;
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

  isValueTouched(): boolean {
    return this._isValueTouched;
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

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputValue = value ?? this._originalDate ?? '';
    if (this.flatInstance) {
      this._originalDate = inputValue;
      this.flatInstance.setDate(inputValue);
      if (!inputValue) {
        this.flatInstance.clear();
      }
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(compositeEditorOptions, 'user', shouldDeleteFormValue);
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
    const domValue: string = this._inputElm.value;

    if (!domValue) {
      return '';
    }

    const inputFormat = mapMomentDateFormatWithFieldType(this.columnEditor.type || this.columnDef?.type || FieldType.dateIso);
    const outputTypeFormat = mapMomentDateFormatWithFieldType((this.columnDef && (this.columnDef.outputType || this.columnEditor.type || this.columnDef.type)) || FieldType.dateIso);
    const value = moment(domValue, inputFormat, false).format(outputTypeFormat);

    return value;
  }

  validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
    const isRequired = this.args?.compositeEditorOptions ? false : this.columnEditor.required;
    const elmValue = (inputValue !== undefined) ? inputValue : this._inputElm?.value;
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
      return { valid: false, msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD };
    }

    return { valid: true, msg: null };
  }

  //
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

  protected handleOnDateChange() {
    this._isValueTouched = true;
    const currentFlatpickrOptions = this.flatInstance?.config ?? this._pickerMergedOptions;

    if (this.args && currentFlatpickrOptions?.closeOnSelect) {
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(compositeEditorOptions);
      } else {
        this.save();
      }
    }
    setTimeout(() => this._lastTriggeredByClearDate = false); // reset flag after a cycle
  }

  protected handleChangeOnCompositeEditor(compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user', isCalledByClearValue = false) {
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
      new SlickEventData()
    );
  }
}