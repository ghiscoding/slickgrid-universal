import 'jquery-ui/ui/widgets/autocomplete';

import { FieldType, KeyCode, } from '../enums/index';
import {
  AutocompleteOption,
  CollectionCustomStructure,
  CollectionOverrideArgs,
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  GridOption,
  SlickGrid,
  SlickNamespace,
} from './../interfaces/index';
import { textValidator } from '../editorValidators/textValidator';
import { sanitizeTextByAvailableSanitizer, } from '../services/domUtilities';
import {
  findOrDefault,
  getDescendantProperty,
  setDeepValue,
  toKebabCase
} from '../services/utilities';

// minimum length of chars to type before starting to start querying
const MIN_LENGTH = 3;

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class AutoCompleteEditor implements Editor {
  protected _autoCompleteOptions!: AutocompleteOption;
  protected _currentValue: any;
  protected _defaultTextValue!: string;
  protected _originalValue: any;
  protected _elementCollection!: any[] | null;
  protected _isValueTouched = false;
  protected _lastInputKeyEvent?: JQuery.Event;
  protected _lastTriggeredByClearInput = false;

  /** The JQuery DOM element */
  protected _$editorInputGroupElm: any;
  protected _$input: any;
  protected _$closeButtonGroupElm: any;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** The property name for labels in the collection */
  labelName!: string;

  /** The property name for a prefix that can be added to the labels in the collection */
  labelPrefixName!: string;

  /** The property name for a suffix that can be added to the labels in the collection */
  labelSuffixName!: string;

  /** The property name for values in the collection */
  valueName!: string;

  forceUserInput = false;

  /** Final collection displayed in the UI, that is after processing filter/sort/override */
  finalCollection: any[] = [];

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.init();
  }

  /** Getter for the Autocomplete Option */
  get autoCompleteOptions(): Partial<AutocompleteOption> {
    return this._autoCompleteOptions || {};
  }

  /** Getter of the Collection */
  get collection(): any[] {
    return this.columnEditor?.collection ?? [];
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): any {
    return this._$input;
  }

  /** Getter for the Final Collection used in the AutoCompleted Source (this may vary from the "collection" especially when providing a customStructure) */
  get elementCollection(): any[] | null {
    return this._elementCollection;
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.internalColumnEditor || {};
  }

  /** Getter for the Custom Structure if exist */
  get customStructure(): CollectionCustomStructure | undefined {
    let customStructure = this.columnEditor?.customStructure;
    const columnType = this.columnEditor?.type ?? this.columnDef?.type;
    if (!customStructure && (columnType === FieldType.object && this.columnDef?.dataKey && this.columnDef?.labelKey)) {
      customStructure = {
        label: this.columnDef.labelKey,
        value: this.columnDef.dataKey,
      };
    }
    return customStructure;
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  get editorOptions(): AutocompleteOption {
    return this.columnEditor?.editorOptions || {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions?.() ?? {};
  }

  /** jQuery UI AutoComplete instance */
  get instance(): any {
    return this._$input.autocomplete('instance');
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init() {
    this.labelName = this.customStructure && this.customStructure.label || 'label';
    this.valueName = this.customStructure && this.customStructure.value || 'value';
    this.labelPrefixName = this.customStructure && this.customStructure.labelPrefix || 'labelPrefix';
    this.labelSuffixName = this.customStructure && this.customStructure.labelSuffix || 'labelSuffix';

    // always render the DOM element, even if user passed a "collectionAsync",
    const newCollection = this.columnEditor.collection || [];
    this.renderDomElement(newCollection);

    // when having a collectionAsync and a collection that is empty, we'll toggle the Editor to disabled,
    // it will be re-enabled when we get the collection filled (in slick-vanilla-bundle on method "updateEditorCollection()")
    if (this.disabled || (this.columnEditor?.collectionAsync && Array.isArray(newCollection) && newCollection.length === 0)) {
      this.disable(true);
    }
  }

  destroy() {
    if (this._$input) {
      this._$input.autocomplete('destroy');
      this._$input.off('keydown.nav').remove();
    }
    this._$input = null;
    this._elementCollection = null;
  }

  /**
   * Dynamically change an Editor option, this is especially useful with Composite Editor
   * since this is the only way to change option after the Editor is created (for example dynamically change "minDate" or another Editor)
   * @param {string} optionName - MultipleSelect option name
   * @param {newValue} newValue - MultipleSelect new option value
   */
  changeEditorOption(optionName: keyof AutocompleteOption, newValue: any) {
    if (!this.columnEditor.editorOptions) {
      this.columnEditor.editorOptions = {};
    }
    this.columnEditor.editorOptions[optionName] = newValue;
    this._autoCompleteOptions = { ...this._autoCompleteOptions, [optionName]: newValue };
    this._$input.autocomplete('option', optionName, newValue);
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
          this.clear(true);
        }
      } else {
        this._$input.removeAttr('disabled');
      }
    }
  }

  focus() {
    if (this._$input) {
      this._$input.focus().select();
    }
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue() {
    return this._$input.val();
  }

  setValue(inputValue: any, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    let label = inputValue;
    // if user provided a custom structure, we will serialize the value returned from the object with custom structure
    if (inputValue && inputValue.hasOwnProperty(this.labelName)) {
      label = inputValue[this.labelName];
    } else {
      label = inputValue;
    }
    this._$input.val(label);

    if (isApplyingValue) {
      this._currentValue = inputValue;
      this._defaultTextValue = typeof inputValue === 'string' ? inputValue : (inputValue?.[this.labelName] ?? '');
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions && triggerOnCompositeEditorChange) {
        this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'system');
      }
    }
  }

  applyValue(item: any, state: any) {
    let newValue = state;
    const fieldName = this.columnDef && this.columnDef.field;

    if (fieldName !== undefined) {
      // if we have a collection defined, we will try to find the string within the collection and return it
      if (Array.isArray(this.collection) && this.collection.length > 0) {
        newValue = findOrDefault(this.collection, (collectionItem: any) => {
          if (collectionItem && typeof state === 'object' && collectionItem.hasOwnProperty(this.labelName)) {
            return (collectionItem.hasOwnProperty(this.labelName) && collectionItem[this.labelName].toString()) === (state.hasOwnProperty(this.labelName) && state[this.labelName].toString());
          } else if (collectionItem && typeof state === 'string' && collectionItem.hasOwnProperty(this.labelName)) {
            return (collectionItem.hasOwnProperty(this.labelName) && collectionItem[this.labelName].toString()) === state;
          }
          return collectionItem && collectionItem.toString() === state;
        });
      }

      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, newValue);
      newValue = (validation && validation.valid) ? newValue : '';

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
    const elmValue = this._$input.val();
    const lastKeyEvent = this._lastInputKeyEvent && this._lastInputKeyEvent.keyCode;
    if (this.columnEditor && this.columnEditor.alwaysSaveOnEnterKey && lastKeyEvent === KeyCode.ENTER) {
      return true;
    }
    const isValueChanged = (!(elmValue === '' && (this._defaultTextValue === null || this._defaultTextValue === undefined))) && (elmValue !== this._defaultTextValue);
    return this._lastTriggeredByClearInput || isValueChanged;
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const data = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this._currentValue = data;
      this._originalValue = data;
      this._defaultTextValue = typeof data === 'string' ? data : (data?.[this.labelName] ?? '');
      this._$input.val(this._defaultTextValue);
      this._$input.select();
    }
  }

  clear(clearByDisableCommand = false) {
    if (this._$input) {
      this._currentValue = '';
      this._defaultTextValue = '';
      this.setValue('', true); // set the input value and also apply the change to the datacontext item
    }
    this._isValueTouched = true;
    this._lastTriggeredByClearInput = true;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
    } else {
      this.save();
    }
  }

  /**
   * You can reset the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: any, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputValue = value ?? this._originalValue ?? '';
    if (this._$input) {
      this._currentValue = inputValue;
      this._defaultTextValue = typeof inputValue === 'string' ? inputValue : (inputValue?.[this.labelName] ?? '');
      this._$input.val(this._defaultTextValue);
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

  serializeValue(): any {
    // if you want to add the autocomplete functionality but want the user to be able to input a new option
    if (this.editorOptions.forceUserInput) {
      const minLength = this.editorOptions?.minLength ?? MIN_LENGTH;
      this._currentValue = this._$input.val().length > minLength ? this._$input.val() : this._currentValue;
    }

    // if user provided a custom structure, we will serialize the value returned from the object with custom structure
    if (this.customStructure && this._currentValue && this._currentValue.hasOwnProperty(this.valueName) && (this.columnDef?.type !== FieldType.object && this.columnEditor?.type !== FieldType.object)) {
      return this._currentValue[this.valueName];
    } else if (this._currentValue && this._currentValue.value !== undefined) {
      // when object has a "value" property and its column is set as an Object type, we'll return an object with optional custom structure
      if (this.columnDef?.type === FieldType.object || this.columnEditor?.type === FieldType.object) {
        return {
          [this.labelName]: this._currentValue.label,
          [this.valueName]: this._currentValue.value
        };
      }
      return this._currentValue.value;
    }
    // if it falls here it might be that the user provided its own custom item with something else than the regular label/value pair
    // at this point it's only available when user provide a custom template for the autocomplete renderItem callback
    return this._currentValue;
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

    const val = (inputValue !== undefined) ? inputValue : this._$input?.val();
    return textValidator(val, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minLength: this.columnEditor.minLength,
      maxLength: this.columnEditor.maxLength,
      operatorConditionalType: this.columnEditor.operatorConditionalType,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  //
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({
      ...activeCell, item: this.dataContext, column: this.args.column, grid: this.grid, target: 'composite', compositeEditorOptions: this.args.compositeEditorOptions
    });
    this.disable(isCellEditable === false);
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

  // this function should be protected but for unit tests purposes we'll make it public until a better solution is found
  // a better solution would be to get the autocomplete DOM element to work with selection but I couldn't find how to do that in Jest
  handleSelect(event: Event, ui: { item: any; }) {
    if (ui && ui.item) {
      const selectedItem = ui && ui.item;
      this._currentValue = selectedItem;
      this._isValueTouched = true;
      const compositeEditorOptions = this.args.compositeEditorOptions;

      // when the user defines a "renderItem" (or "_renderItem") template, then we assume the user defines his own custom structure of label/value pair
      // otherwise we know that jQueryUI always require a label/value pair, we can pull them directly
      const hasCustomRenderItemCallback = this.columnEditor?.callbacks?.hasOwnProperty('_renderItem') ?? this.columnEditor?.editorOptions?.renderItem ?? false;

      const itemLabel = typeof selectedItem === 'string' ? selectedItem : (hasCustomRenderItemCallback ? selectedItem[this.labelName] : selectedItem.label);
      this.setValue(itemLabel);

      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
      } else {
        this.save();
      }

      // if user wants to hook to the "select", he can do via this "onSelect"
      // it purposely has a similar signature as the "select" callback + some extra arguments (row, cell, column, dataContext)
      if (this.editorOptions.onSelect) {
        const activeCell = this.grid.getActiveCell();
        this.editorOptions.onSelect(event, ui, activeCell.row, activeCell.cell, this.args.column, this.args.item);
      }

      setTimeout(() => this._lastTriggeredByClearInput = false); // reset flag after a cycle
    }
    return false;
  }

  protected renderCustomItem(ul: HTMLElement, item: any) {
    const templateString = this._autoCompleteOptions?.renderItem?.templateCallback(item) ?? '';

    // sanitize any unauthorized html tags like script and others
    // for the remaining allowed tags we'll permit all attributes
    const sanitizedTemplateText = sanitizeTextByAvailableSanitizer(this.gridOptions, templateString) || '';

    return $('<li></li>')
      .data('item.autocomplete', item)
      .append(sanitizedTemplateText)
      .appendTo(ul);
  }

  protected renderCollectionItem(ul: HTMLElement, item: any) {
    const isRenderHtmlEnabled = this.columnEditor?.enableRenderHtml ?? false;
    const prefixText = item.labelPrefix || '';
    const labelText = item.label || '';
    const suffixText = item.labelSuffix || '';
    const finalText = prefixText + labelText + suffixText;

    // sanitize any unauthorized html tags like script and others
    // for the remaining allowed tags we'll permit all attributes
    const sanitizedText = sanitizeTextByAvailableSanitizer(this.gridOptions, finalText) || '';

    const $liDiv = $('<div></div>')[isRenderHtmlEnabled ? 'html' : 'text'](sanitizedText);
    return $('<li></li>')
      .data('item.autocomplete', item)
      .append($liDiv)
      .appendTo(ul);
  }

  renderDomElement(collection?: any[]) {
    if (!Array.isArray(collection)) {
      throw new Error('The "collection" passed to the Autocomplete Editor is not a valid array.');
    }
    const columnId = this.columnDef?.id ?? '';
    const placeholder = this.columnEditor?.placeholder ?? '';
    const title = this.columnEditor?.title ?? '';

    this._$input = $(`<input type="text" role="presentation" autocomplete="off" class="autocomplete form-control editor-text editor-${columnId}" placeholder="${placeholder}" title="${title}" />`)
      .appendTo(this.args.container)
      .on('keydown.nav', (event: JQuery.Event) => {
        this._lastInputKeyEvent = event;
        if (event.keyCode === KeyCode.LEFT || event.keyCode === KeyCode.RIGHT) {
          event.stopImmediatePropagation();
        }
      });

    // append the new DOM element to the slick cell container,
    // we need the autocomplete-container so that the spinner is aligned properly with the Composite Editor
    if (this._$input && typeof this._$input.appendTo === 'function') {
      this._$editorInputGroupElm = $(`<div class="autocomplete-container input-group"></div>`);
      this._$editorInputGroupElm.appendTo(this.args.container);
      this._$input.appendTo(this._$editorInputGroupElm);
      this._$input.addClass('input-group-editor');

      const $closeButtonGroupElm = $(`<span class="input-group-btn input-group-append" data-clear></span>`);
      this._$closeButtonGroupElm = $(`<button class="btn btn-default icon-clear" type="button"></button>`);

      // add an empty <span> in order to add loading spinner styling
      $(`<span></span>`).appendTo(this._$editorInputGroupElm);

      // show clear date button (unless user specifically doesn't want it)
      if (!this.columnEditor?.params?.hideClearButton) {
        this._$closeButtonGroupElm.appendTo($closeButtonGroupElm);
        $closeButtonGroupElm.appendTo(this._$editorInputGroupElm);
        this._$closeButtonGroupElm.on('click', this.clear.bind(this));
      }
    }

    // user might pass his own autocomplete options
    const autoCompleteOptions: AutocompleteOption = this.columnEditor.editorOptions;

    // assign the collection to a temp variable before filtering/sorting the collection
    let finalCollection = collection;

    // user could also override the collection
    if (this.columnEditor?.collectionOverride) {
      const overrideArgs: CollectionOverrideArgs = { column: this.columnDef, dataContext: this.dataContext, grid: this.grid, originalCollections: this.collection };
      if (this.args.compositeEditorOptions) {
        const { formValues, modalType } = this.args.compositeEditorOptions;
        overrideArgs.compositeEditorOptions = { formValues, modalType };
      }
      finalCollection = this.columnEditor.collectionOverride(finalCollection, overrideArgs);
    }

    // keep reference of the final collection displayed in the UI
    this.finalCollection = finalCollection;

    // user might provide his own custom structure
    // jQuery UI autocomplete requires a label/value pair, so we must remap them when user provide different ones
    if (Array.isArray(finalCollection)) {
      finalCollection = finalCollection.map((item) => {
        return { label: item[this.labelName], value: item[this.valueName], labelPrefix: item[this.labelPrefixName] || '', labelSuffix: item[this.labelSuffixName] || '' };
      });
    }

    // keep the final source collection used in the AutoComplete as reference
    this._elementCollection = finalCollection;

    // when user passes it's own autocomplete options
    // we still need to provide our own "select" callback implementation
    if (autoCompleteOptions?.source) {
      autoCompleteOptions.select = (event: Event, ui: { item: any; }) => this.handleSelect(event, ui);
      this._autoCompleteOptions = { ...autoCompleteOptions };

      // when "renderItem" is defined, we need to add our custom style CSS class
      if (this._autoCompleteOptions.renderItem) {
        this._autoCompleteOptions.classes = {
          'ui-autocomplete': `autocomplete-custom-${toKebabCase(this._autoCompleteOptions.renderItem.layout)}`
        };
      }
      // create the jQueryUI AutoComplete
      this._$input.autocomplete(this._autoCompleteOptions);

      // when "renderItem" is defined, we need to call the user's custom renderItem template callback
      if (this._autoCompleteOptions.renderItem) {
        this._$input.autocomplete('instance')._renderItem = this.renderCustomItem.bind(this);
      }
    } else {
      const definedOptions: AutocompleteOption = {
        source: finalCollection,
        minLength: 0,
        select: (event: Event, ui: { item: any; }) => this.handleSelect(event, ui),
      };
      this._autoCompleteOptions = { ...definedOptions, ...(this.columnEditor.editorOptions as AutocompleteOption) };
      this._$input.autocomplete(this._autoCompleteOptions);

      // we'll use our own renderer so that it works with label prefix/suffix and also with html rendering when enabled
      this._$input.autocomplete('instance')._renderItem = this.renderCollectionItem.bind(this);
    }

    // in case the user wants to save even an empty value,
    // we need to subscribe to the onKeyDown event for that use case and clear the current value
    if (this.columnEditor.alwaysSaveOnEnterKey) {
      this._$input.keydown((event: KeyboardEvent) => {
        if (event.keyCode === KeyCode.ENTER) {
          this._currentValue = null;
        }
      });
    }

    // user might override any of the jQueryUI callback methods
    if (this.columnEditor.callbacks) {
      for (const callback of Object.keys(this.columnEditor.callbacks)) {
        if (typeof this.columnEditor.callbacks[callback] === 'function') {
          this.instance[callback] = this.columnEditor.callbacks[callback];
        }
      }
    }

    this._$input.on('focus', () => {
      this._$input.select();

      // we could optionally trigger a search to open the AutoComplete search list
      if (this.editorOptions.openSearchListOnFocus) {
        this._$input.autocomplete('search', this._$input.val());
      }
    });

    if (!this.args.compositeEditorOptions) {
      setTimeout(() => this.focus(), 50);
    }
  }
}
