import autocompleter from 'autocompleter';
import type { AutocompleteItem, AutocompleteResult, AutocompleteSettings } from 'autocompleter';
import { BindingEventService } from '@slickgrid-universal/binding';
import { isObject, isPrimitiveValue, setDeepValue, toKebabCase } from '@slickgrid-universal/utils';

import { Constants } from './../constants';
import { FieldType } from '../enums/index';
import type {
  AutocompleterOption,
  AutocompleteSearchItem,
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
  Locale,
} from '../interfaces/index';
import { textValidator } from '../editorValidators/textValidator';
import { addAutocompleteLoadingByOverridingFetch } from '../commonEditorFilter';
import { createDomElement, sanitizeTextByAvailableSanitizer, } from '../services/domUtilities';
import { findOrDefault, getDescendantProperty, } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import { SlickEventData, type SlickGrid } from '../core/index';

// minimum length of chars to type before starting to start querying
const MIN_LENGTH = 3;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class AutocompleterEditor<T extends AutocompleteItem = any> implements Editor {
  protected _autocompleterOptions!: Partial<AutocompleterOption<T>>;
  protected _bindEventService: BindingEventService;
  protected _currentValue: any;
  protected _defaultTextValue!: string;
  protected _originalValue: any;
  protected _elementCollection!: T[] | null;
  protected _instance?: AutocompleteResult;
  protected _isValueTouched = false;
  protected _lastInputKeyEvent?: KeyboardEvent;
  protected _lastTriggeredByClearInput = false;
  protected _locales: Locale;

  /** The Editor DOM element */
  protected _editorInputGroupElm!: HTMLDivElement;
  protected _inputElm!: HTMLInputElement;
  protected _closeButtonGroupElm!: HTMLSpanElement;
  protected _clearButtonElm!: HTMLButtonElement;

  /** The translate library */
  protected _translater?: TranslaterService;

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
  finalCollection: T[] = [];

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this._bindEventService = new BindingEventService();
    if (this.gridOptions?.translater) {
      this._translater = this.gridOptions.translater;
    }

    // get locales provided by user in forRoot or else use default English locales via the Constants
    this._locales = this.gridOptions && this.gridOptions.locales || Constants.locales;

    this.init();
  }

  /** Getter for the Autocomplete Option */
  get autocompleterOptions(): Partial<AutocompleterOption> {
    return this._autocompleterOptions || {};
  }

  /** Getter of the Collection */
  get collection(): T[] {
    return this.columnEditor?.collection ?? [];
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): HTMLInputElement {
    return this._inputElm;
  }

  /** Getter for the Final Collection used in the AutoCompleted Source (this may vary from the "collection" especially when providing a customStructure) */
  get elementCollection(): Array<T | CollectionCustomStructure> | null {
    return this._elementCollection;
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.internalColumnEditor || {} as ColumnEditor;
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
  get dataContext(): T {
    return this.args.item;
  }

  get editorOptions(): AutocompleterOption {
    return this.columnEditor?.editorOptions || {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  /** Kraaden AutoComplete instance */
  get instance(): AutocompleteResult | undefined {
    return this._instance;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init() {
    this.labelName = this.customStructure?.label ?? 'label';
    this.valueName = this.customStructure?.value ?? 'value';
    this.labelPrefixName = this.customStructure?.labelPrefix ?? 'labelPrefix';
    this.labelSuffixName = this.customStructure?.labelSuffix ?? 'labelSuffix';

    // always render the DOM element, even if user passed a "collectionAsync",
    let newCollection = this.columnEditor.collection;
    if (this.columnEditor?.collectionAsync && !newCollection) {
      newCollection = [];
    }
    // const newCollection = this.columnEditor.collection;
    this.renderDomElement(newCollection);

    // when having a collectionAsync and a collection that is empty, we'll toggle the Editor to disabled,
    // it will be re-enabled when we get the collection filled (in slick-vanilla-bundle on method "updateEditorCollection()")
    if (this.disabled || (this.columnEditor?.collectionAsync && Array.isArray(newCollection) && newCollection.length === 0)) {
      this.disable(true);
    }
  }

  destroy() {
    this._bindEventService.unbindAll();
    if (typeof this._instance?.destroy === 'function') {
      this._instance.destroy();
    }
    this._inputElm?.remove?.();
    this._elementCollection = null;
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
          this.clear(true);
        }
      } else {
        this._inputElm.disabled = false;
      }
    }
  }

  focus() {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();

    if (this._inputElm) {
      this._inputElm.focus();
      this._inputElm.select();
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
    return this._inputElm.value;
  }

  setValue(inputValue: any, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    // if user provided a custom structure, we will serialize the value returned from the object with custom structure
    this._inputElm.value = (inputValue?.hasOwnProperty(this.labelName))
      ? inputValue[this.labelName]
      : inputValue;

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
    const fieldName = this.columnDef?.field;

    if (fieldName !== undefined) {
      // if we have a collection defined, we will try to find the string within the collection and return it
      if (Array.isArray(this.collection) && this.collection.length > 0) {
        newValue = findOrDefault(this.collection, (collectionItem: any) => {
          if (collectionItem && isObject(state) && collectionItem.hasOwnProperty(this.valueName)) {
            return (collectionItem[this.valueName].toString()) === (state.hasOwnProperty(this.valueName) && state[this.valueName].toString());
          } else if (collectionItem && typeof state === 'string' && collectionItem.hasOwnProperty(this.valueName)) {
            return (collectionItem[this.valueName].toString()) === state;
          }
          return collectionItem?.toString() === state;
        }, '');
      }

      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, newValue);
      newValue = validation?.valid ? newValue : '';

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
    const lastEventKey = this._lastInputKeyEvent?.key;
    if (this.columnEditor?.alwaysSaveOnEnterKey && lastEventKey === 'Enter') {
      return true;
    }
    const isValueChanged = (!(elmValue === '' && (this._defaultTextValue === null || this._defaultTextValue === undefined))) && (elmValue !== this._defaultTextValue);
    return this._lastTriggeredByClearInput || isValueChanged;
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any) {
    const fieldName = this.columnDef?.field;

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const data = isComplexObject ? getDescendantProperty(item, fieldName) : item[fieldName];

      this._currentValue = data;
      this._originalValue = data;
      this._defaultTextValue = typeof data === 'string' ? data : (data?.[this.labelName] ?? '');
      this._inputElm.value = this._defaultTextValue as string;
      this._inputElm.select();
    }
  }

  clear(clearByDisableCommand = false) {
    if (this._inputElm) {
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
    if (this._inputElm) {
      this._currentValue = inputValue;
      this._defaultTextValue = typeof inputValue === 'string' ? inputValue : (inputValue?.[this.labelName] ?? '');
      this._inputElm.value = this._defaultTextValue;
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

  serializeValue(): any {
    // if you want to add the autocomplete functionality but want the user to be able to input a new option
    if (this._inputElm && this.editorOptions.forceUserInput) {
      const minLength = this.editorOptions?.minLength ?? MIN_LENGTH;
      this._currentValue = this._inputElm.value.length > minLength ? this._inputElm.value : this._currentValue;
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

    const val = (inputValue !== undefined) ? inputValue : this._inputElm?.value;
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
    }).getReturnValue();
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
      { ...new SlickEventData(), ...event as Event }
    );
  }

  // this function should be protected but for unit tests purposes we'll make it public until a better solution is found
  // a better solution would be to get the autocomplete DOM element to work with selection but I couldn't find how to do that in Jest
  handleSelect(item: AutocompleteSearchItem) {
    if (item !== undefined) {
      const event = null; // TODO do we need the event?
      const selectedItem = item;
      this._currentValue = selectedItem;
      this._isValueTouched = true;
      const compositeEditorOptions = this.args.compositeEditorOptions;

      // when the user defines a "renderItem" template, then we assume the user defines his own custom structure of label/value pair
      // otherwise we know that the autocomplete lib always require a label/value pair, we can pull them directly
      const hasCustomRenderItemCallback = this.editorOptions?.renderItem ?? false;

      const itemLabel = typeof selectedItem === 'string' ? selectedItem : (hasCustomRenderItemCallback ? selectedItem[this.labelName] : selectedItem.label);
      this.setValue(itemLabel);

      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
      } else {
        this.save();
      }

      // if user wants to hook to the "select", he can do via this "onSelect"
      // its signature is purposely similar to the "onSelect" callback + some extra arguments (row, cell, column, dataContext)
      if (typeof this.editorOptions.onSelectItem === 'function') {
        const { row, cell } = this.grid.getActiveCell() || {};
        this.editorOptions.onSelectItem(item, row, cell, this.args.column, this.args.item);
      }

      setTimeout(() => this._lastTriggeredByClearInput = false); // reset flag after a cycle
    }
    return false;
  }

  protected renderRegularItem(item: T) {
    const itemLabel = (typeof item === 'string' ? item : item?.label ?? '') as string;
    return createDomElement('div', { textContent: itemLabel || '' });
  }

  protected renderCustomItem(item: T) {
    const templateString = this._autocompleterOptions?.renderItem?.templateCallback(item) ?? '';

    // sanitize any unauthorized html tags like script and others
    const tmpElm = document.createElement('div');
    this.grid.applyHtmlCode(tmpElm, templateString);
    return tmpElm;
  }

  protected renderCollectionItem(item: any) { // CollectionCustomStructure
    const isRenderHtmlEnabled = this.columnEditor?.enableRenderHtml ?? false;
    const prefixText = item.labelPrefix || '';
    const labelText = item.label || '';
    const suffixText = item.labelSuffix || '';
    const finalText = prefixText + labelText + suffixText;

    // sanitize any unauthorized html tags like script and others
    // for the remaining allowed tags we'll permit all attributes
    const sanitizedText = sanitizeTextByAvailableSanitizer(this.gridOptions, finalText) || '';

    const div = document.createElement('div');
    div[isRenderHtmlEnabled ? 'innerHTML' : 'textContent'] = sanitizedText;
    return div;
  }

  renderDomElement(collection?: any[]) {
    const columnId = this.columnDef?.id ?? '';
    const placeholder = this.columnEditor?.placeholder ?? '';
    const title = this.columnEditor?.title ?? '';

    this._editorInputGroupElm = createDomElement('div', { className: 'autocomplete-container input-group' });
    const closeButtonGroupElm = createDomElement('span', { className: 'input-group-btn input-group-append', dataset: { clear: '' } });
    this._clearButtonElm = createDomElement('button', { type: 'button', className: 'btn btn-default icon-clear' });
    this._inputElm = createDomElement(
      'input',
      {
        type: 'text', placeholder, title,
        autocomplete: 'off', ariaAutoComplete: 'none',
        className: `autocomplete form-control editor-text input-group-editor editor-${columnId}`,
        dataset: { input: '' }
      },
      this._editorInputGroupElm
    );

    // add an empty <span> in order to add loading spinner styling
    this._editorInputGroupElm.appendChild(document.createElement('span'));

    // show clear date button (unless user specifically doesn't want it)
    if (!(this.columnEditor.editorOptions as AutocompleterOption)?.hideClearButton) {
      closeButtonGroupElm.appendChild(this._clearButtonElm);
      this._editorInputGroupElm.appendChild(closeButtonGroupElm);
      this._bindEventService.bind(this._clearButtonElm, 'click', () => this.clear());
    }

    this._bindEventService.bind(this._inputElm, 'focus', () => this._inputElm?.select());
    this._bindEventService.bind(this._inputElm, 'keydown', ((event: KeyboardEvent) => {
      this._lastInputKeyEvent = event;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.stopImmediatePropagation();
      }

      // in case the user wants to save even an empty value,
      // we need to subscribe to the onKeyDown event for that use case and clear the current value
      if (this.columnEditor.alwaysSaveOnEnterKey) {
        if (event.key === 'Enter') {
          this._currentValue = null;
        }
      }
    }) as EventListener);

    // assign the collection to a temp variable before filtering/sorting the collection
    let finalCollection = collection;

    // user could also override the collection
    if (finalCollection && this.columnEditor?.collectionOverride) {
      const overrideArgs: CollectionOverrideArgs = { column: this.columnDef, dataContext: this.dataContext, grid: this.grid, originalCollections: this.collection };
      if (this.args.compositeEditorOptions) {
        const { formValues, modalType } = this.args.compositeEditorOptions;
        overrideArgs.compositeEditorOptions = { formValues, modalType };
      }
      finalCollection = this.columnEditor.collectionOverride(finalCollection, overrideArgs);
    }

    // keep reference of the final collection displayed in the UI
    if (finalCollection) {
      this.finalCollection = finalCollection;
    }

    // the kradeen autocomplete lib only works with label/value pair, make sure that our array is in accordance
    if (Array.isArray(finalCollection)) {
      if (this.collection.every(x => isPrimitiveValue(x))) {
        // when detecting an array of primitives, we have to remap it to an array of value/pair objects
        finalCollection = finalCollection.map(c => ({ label: c, value: c }));
      } else {
        // user might provide its own custom structures, if so remap them as the new label/value pair
        finalCollection = finalCollection.map((item) => ({
          label: item?.[this.labelName],
          value: item?.[this.valueName],
          labelPrefix: item?.[this.labelPrefixName] ?? '',
          labelSuffix: item?.[this.labelSuffixName] ?? ''
        }));
      }

      // keep the final source collection used in the AutoComplete as reference
      this._elementCollection = finalCollection;
    }

    // merge custom autocomplete options with default basic options
    this._autocompleterOptions = {
      input: this._inputElm,
      debounceWaitMs: 200,
      className: `slick-autocomplete ${this.editorOptions?.className ?? ''}`.trim(),
      emptyMsg: this.gridOptions.enableTranslate && this._translater?.translate ? this._translater.translate('NO_ELEMENTS_FOUND') : this._locales?.TEXT_NO_ELEMENTS_FOUND ?? 'No elements found',
      customize: (_input, _inputRect, container) => {
        container.style.width = ''; // unset width that was set internally by the Autopleter lib
      },
      onSelect: this.handleSelect.bind(this),
      ...this.editorOptions,
    } as Partial<AutocompleteSettings<any>>;

    // "render" callback overriding
    if (this._autocompleterOptions.renderItem?.layout) {
      // when "renderItem" is defined, we need to add our custom style CSS classes & custom item renderer
      this._autocompleterOptions.className += ` autocomplete-custom-${toKebabCase(this._autocompleterOptions.renderItem.layout)}`;
      this._autocompleterOptions.render = this.renderCustomItem.bind(this);
    } else if (Array.isArray(collection)) {
      // we'll use our own renderer so that it works with label prefix/suffix and also with html rendering when enabled
      this._autocompleterOptions.render = this._autocompleterOptions.render?.bind(this) ?? this.renderCollectionItem.bind(this);
    } else if (!this._autocompleterOptions.render) {
      // when no render callback is defined, we still need to define our own renderer for regular item
      // because we accept string array but the Kraaden autocomplete doesn't by default and we can change that
      this._autocompleterOptions.render = this.renderRegularItem.bind(this);
    }

    // when user passes it's own autocomplete options
    // we still need to provide our own "select" callback implementation
    if (this._autocompleterOptions?.fetch) {
      // add loading class by overriding user's fetch method
      addAutocompleteLoadingByOverridingFetch(this._inputElm, this._autocompleterOptions);

      // create the Kraaden AutoComplete
      this._instance = autocompleter(this._autocompleterOptions as AutocompleteSettings<any>);
    } else {
      this._instance = autocompleter({
        ...this._autocompleterOptions,
        fetch: (searchTerm, updateCallback) => {
          if (finalCollection) {
            // you can also use AJAX requests instead of preloaded data
            // also at this point our collection was already modified, by the previous map, to have the "label" property (unless it's a string)
            updateCallback(finalCollection!.filter(c => {
              const label = (typeof c === 'string' ? c : c?.label) || '';
              return label.toLowerCase().includes(searchTerm.toLowerCase());
            }));
          }
        },
      } as AutocompleteSettings<any>);
    }

    this.args.container.appendChild(this._editorInputGroupElm);

    if (!this.args.compositeEditorOptions) {
      setTimeout(() => this.focus(), 50);
    }
  }
}