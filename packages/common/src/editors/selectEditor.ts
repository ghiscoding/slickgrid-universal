import { emptyElement, setDeepValue } from '@slickgrid-universal/utils';
import { dequal } from 'dequal/lite';
import { multipleSelect, type MultipleSelectInstance, type MultipleSelectOption, type OptionRowData } from 'multiple-select-vanilla';
import {
  createBlankSelectEntry,
  filterCollectionWithOptions,
  getCollectionFromObjectWhenEnabled,
  sortCollectionWithOptions,
} from '../commonEditorFilter/commonEditorFilterUtils.js';
import { Constants } from '../constants.js';
import { SlickEventData, type SlickGrid } from '../core/index.js';
import { buildMsSelectCollectionList, CollectionService, findOrDefault, type TranslaterService } from '../services/index.js';
import { getDescendantProperty, getTranslationPrefix } from '../services/utilities.js';
import { FieldType } from './../enums/index.js';
import type {
  CollectionCustomStructure,
  CollectionOption,
  CollectionOverrideArgs,
  Column,
  ColumnEditor,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidationResult,
  EditorValidator,
  GridOption,
  Locale,
  SelectOption,
  ValidateOption,
} from './../interfaces/index.js';

/**
 * Slickgrid editor class for multiple/single select lists
 */
export class SelectEditor implements Editor {
  protected _isValueTouched = false;

  /** Locales */
  protected _locales: Locale;

  // flag to signal that the editor is destroying itself, helps prevent
  // commit changes from being called twice and erroring
  protected _isDisposingOrCallingSave = false;

  /** Collection Service */
  protected _collectionService!: CollectionService;

  /** The translate library */
  protected _translaterService?: TranslaterService;

  protected _msInstance?: MultipleSelectInstance;

  /** Editor DOM element */
  editorElm?: HTMLElement;

  /** is the Editor disabled? */
  disabled = false;

  /** Editor Multiple-Select options */
  editorElmOptions!: Partial<MultipleSelectOption>;

  /** DOM Element Name, useful for auto-detecting positioning (dropup / dropdown) */
  elementName: string;

  /** The multiple-select options for a multiple select list */
  defaultOptions: Partial<MultipleSelectOption>;

  /** The original item values that are set at the beginning */
  originalValue: any | any[];

  /** The property name for labels in the collection */
  labelName!: string;

  /** The property name for a prefix that can be added to the labels in the collection */
  labelPrefixName!: string;

  /** The property name for a suffix that can be added to the labels in the collection */
  labelSuffixName!: string;

  /** A label that can be added to each option and can be used as an alternative to display selected options */
  optionLabel!: string;

  /** The property name for values in the collection */
  valueName!: string;

  /** Grid options */
  gridOptions: GridOption;

  /** Do we translate the label? */
  enableTranslateLabel = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Final collection displayed in the UI, that is after processing filter/sort/override */
  finalCollection: any[] = [];

  constructor(
    protected readonly args: EditorArguments,
    protected readonly isMultipleSelect: boolean
  ) {
    this.grid = args.grid;
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
    if (this.gridOptions?.translater) {
      this._translaterService = this.gridOptions.translater;
    }

    // get locales provided by user in main file or else use default English locales via the Constants
    this._locales = this.gridOptions.locales || Constants.locales;

    // provide the name attribute to the DOM element which will be needed to auto-adjust drop position (dropup / dropdown)
    this.elementName = `editor-${this.columnId}`;
    const compositeEditorOptions = this.args.compositeEditorOptions;

    const libOptions = {
      autoAdjustDropHeight: true,
      autoAdjustDropPosition: true,
      autoAdjustDropWidthByTextSize: true,
      container: 'body',
      darkMode: !!this.gridOptions.darkMode,
      filter: false,
      isOpen: !this.args.isCompositeEditor,
      maxHeight: 275,
      minHeight: 25,
      name: this.elementName,
      single: true,
      singleRadio: true,
      renderOptionLabelAsHtml: this.columnEditor?.enableRenderHtml ?? false,
      sanitizer: (dirtyHtml: string) => this.grid.sanitizeHtmlString(dirtyHtml),
      onClick: () => (this._isValueTouched = true),
      onCheckAll: () => (this._isValueTouched = true),
      onUncheckAll: () => (this._isValueTouched = true),
      onBlur: (e) => {
        const keyEvt = e as KeyboardEvent | undefined;
        if (keyEvt?.key === 'Tab' && this._msInstance?.getOptions().isOpen) {
          keyEvt.preventDefault();
          this._msInstance.close('blur');
          if (!this.args.isCompositeEditor) {
            keyEvt.shiftKey ? this.grid.navigatePrev() : this.grid.navigateNext();
          }
        }
      },
      onClose: (reason) => {
        if (reason === 'key.escape' || reason === 'body.click' || (!this.hasAutoCommitEdit && !this.isValueChanged())) {
          if (reason === 'key.escape') {
            this.cancel();
          }
          return;
        }

        if (compositeEditorOptions) {
          this.handleChangeOnCompositeEditor(compositeEditorOptions);
        } else {
          this._isDisposingOrCallingSave = true;
          this.save(this.hasAutoCommitEdit);
        }
      },
    } as Partial<MultipleSelectOption>;

    if (isMultipleSelect) {
      libOptions.single = false;
      libOptions.singleRadio = false;
      libOptions.displayTitle = true;
      libOptions.showOkButton = true;

      const translationPrefix = getTranslationPrefix(this.gridOptions);
      libOptions.countSelectedText = this.translateOrDefault(`${translationPrefix}X_OF_Y_SELECTED`, this._locales?.TEXT_X_OF_Y_SELECTED);
      libOptions.allSelectedText = this.translateOrDefault(`${translationPrefix}ALL_SELECTED`, this._locales?.TEXT_ALL_SELECTED);
      libOptions.selectAllText = this.translateOrDefault(`${translationPrefix}SELECT_ALL`, this._locales?.TEXT_SELECT_ALL);
      libOptions.okButtonText = this.translateOrDefault(`${translationPrefix}OK`, this._locales?.TEXT_OK);
      libOptions.noMatchesFoundText = this.translateOrDefault(`${translationPrefix}NO_MATCHES_FOUND`, this._locales?.TEXT_NO_MATCHES_FOUND);
    }

    // assign the multiple select lib options
    this.defaultOptions = libOptions;
    this.init();
  }

  /** Get the Collection */
  get collection(): SelectOption[] {
    return this.columnEditor?.collection ?? [];
  }

  /** Getter for the Collection Options */
  get collectionOptions(): CollectionOption | undefined {
    return this.columnEditor?.collectionOptions;
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  get columnId(): string | number {
    return this.columnDef?.id ?? '';
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return (this.columnDef?.editor ?? {}) as ColumnEditor;
  }

  /** Getter for item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  get editorOptions(): MultipleSelectOption {
    return { ...this.gridOptions.defaultEditorOptions?.select, ...this.columnEditor?.editorOptions, ...this.columnEditor?.options };
  }

  /** Getter for the Custom Structure if exist */
  protected get customStructure(): CollectionCustomStructure | undefined {
    return this.columnDef?.editor?.customStructure;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  get msInstance(): MultipleSelectInstance | undefined {
    return this._msInstance;
  }

  get selectOptions(): Partial<MultipleSelectOption> {
    return this.defaultOptions;
  }

  /**
   * The current selected values (multiple select) from the collection
   */
  get currentValues(): any[] | null {
    const selectedValuesSet = new Set();
    (this._msInstance?.getSelects('value') ?? []).forEach((x) => selectedValuesSet.add(x.toString()));

    // collection of strings, just return the filtered string that are equals
    if (this.collection.every((x) => typeof x === 'number' || typeof x === 'string')) {
      return this.collection.filter((c: SelectOption) => selectedValuesSet.has(c?.toString()));
    }

    // collection of label/value pair
    const separatorBetweenLabels = this.collectionOptions?.separatorBetweenTextLabels ?? '';
    const isIncludingPrefixSuffix = this.collectionOptions?.includePrefixSuffixToSelectedValues ?? false;

    return this.collection
      .filter((c) => selectedValuesSet.has(c?.[this.valueName]?.toString()))
      .map((c) => {
        const labelText = c[this.valueName];
        let prefixText = c[this.labelPrefixName] || '';
        let suffixText = c[this.labelSuffixName] || '';

        // when it's a complex object, then pull the object name only, e.g.: "user.firstName" => "user"
        const fieldName = this.columnDef?.field ?? '';

        // is the field a complex object, "address.streetNumber"
        const isComplexObject = fieldName?.indexOf('.') > 0;
        const serializeComplexValueFormat = this.columnEditor?.serializeComplexValueFormat ?? 'object';

        if (isComplexObject && typeof c === 'object' && serializeComplexValueFormat === 'object') {
          return c;
        }

        // also translate prefix/suffix if enableTranslateLabel is true and text is a string
        prefixText = this.translatePrefixSuffix(prefixText);
        suffixText = this.translatePrefixSuffix(suffixText);

        if (isIncludingPrefixSuffix) {
          const tmpOptionArray = [prefixText, labelText, suffixText].filter((text) => text); // add to a temp array for joining purpose and filter out empty text
          return tmpOptionArray.join(separatorBetweenLabels);
        }
        return labelText;
      });
  }

  /**
   * The current selected values (single select) from the collection
   */
  get currentValue(): number | string {
    const selectedValues = this._msInstance?.getSelects() ?? [];
    const selectedValue = selectedValues.length ? selectedValues[0] : '';
    const fieldName = this.columnDef?.field;

    if (fieldName !== undefined) {
      // collection of strings, just return the filtered string that are equals
      if (this.collection.every((x) => typeof x === 'number' || typeof x === 'string')) {
        return findOrDefault(this.collection, (c: any) => c?.toString?.() === `${selectedValue}`);
      }

      // collection of label/value pair
      const separatorBetweenLabels = this.collectionOptions?.separatorBetweenTextLabels ?? '';
      const isIncludingPrefixSuffix = this.collectionOptions?.includePrefixSuffixToSelectedValues ?? false;
      const itemFound = findOrDefault(
        this.collection,
        (c: any) => c.hasOwnProperty(this.valueName) && c[this.valueName]?.toString() === `${selectedValue}`
      );

      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const serializeComplexValueFormat = this.columnEditor?.serializeComplexValueFormat ?? 'object';

      if (isComplexObject && typeof itemFound === 'object' && serializeComplexValueFormat === 'object') {
        return itemFound;
      } else if (itemFound && itemFound.hasOwnProperty(this.valueName)) {
        const labelText = itemFound[this.valueName];

        if (isIncludingPrefixSuffix) {
          let prefixText = itemFound[this.labelPrefixName] || '';
          let suffixText = itemFound[this.labelSuffixName] || '';

          // also translate prefix/suffix if enableTranslateLabel is true and text is a string
          prefixText = this.translatePrefixSuffix(prefixText);
          suffixText = this.translatePrefixSuffix(suffixText);

          // add to a temp array for joining purpose and filter out empty text
          const tmpOptionArray = [prefixText, labelText, suffixText].filter((text) => text);
          return tmpOptionArray.join(separatorBetweenLabels);
        }
        return labelText;
      }
    }
    return '';
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    if (!this.columnDef || !this.columnDef.editor || (!this.columnDef.editor.collection && !this.columnDef.editor.collectionAsync)) {
      throw new Error(`[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") inside Column Definition Editor for the MultipleSelect/SingleSelect Editor to work correctly.
      Also each option should include a value/label pair (or value/labelKey when using Locale).
      For example: { editor: { collection: [{ value: true, label: 'True' },{ value: false, label: 'False'}] } }`);
    }

    this._collectionService = new CollectionService(this._translaterService);
    this.enableTranslateLabel = this.columnEditor?.enableTranslateLabel ?? false;
    this.labelName = this.customStructure?.label ?? 'label';
    this.labelPrefixName = this.customStructure?.labelPrefix ?? 'labelPrefix';
    this.labelSuffixName = this.customStructure?.labelSuffix ?? 'labelSuffix';
    this.optionLabel = this.customStructure?.optionLabel ?? 'value';
    this.valueName = this.customStructure?.value ?? 'value';

    if (this.enableTranslateLabel && (!this._translaterService || typeof this._translaterService.translate !== 'function')) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }

    // always render the Select (dropdown) DOM element, even if user passed a "collectionAsync",
    // if that is the case, the Select will simply be without any options but we still have to render it (else SlickGrid would throw an error)
    this.renderDomElement(this.collection);

    // when having a collectionAsync and a collection that is empty, we'll toggle the Editor to disabled,
    // it will be re-enabled when we get the collection filled (in slick-vanilla-bundle on method "updateEditorCollection()")
    if (this.disabled || (this.columnEditor?.collectionAsync && Array.isArray(this.collection) && this.collection.length === 0)) {
      this.disable(true);
    }
  }

  getValue(): any | any[] {
    return this.isMultipleSelect ? this.currentValues : this.currentValue;
  }

  setValue(value: any | any[], isApplyingValue = false, triggerOnCompositeEditorChange = true): void {
    if (this.isMultipleSelect && Array.isArray(value)) {
      this.loadMultipleValues(value);
    } else {
      this.loadSingleValue(value);
    }

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions && triggerOnCompositeEditorChange) {
        this.handleChangeOnCompositeEditor(compositeEditorOptions, 'system');
      }
    }
  }

  cancel(): void {
    if (this.args?.cancelChanges) {
      this.args.cancelChanges();
    }
  }

  hide(): void {
    if (this._msInstance) {
      this._msInstance.close();
    }
  }

  show(openDelay?: number | null): void {
    if (!this.args.isCompositeEditor && this._msInstance) {
      this._msInstance.open(openDelay);
    } else if (this.args.isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  applyValue(item: any, state: any): void {
    const fieldName = this.columnDef?.field;
    const fieldType = this.columnDef?.type;
    let newValue = state;

    if (fieldName !== undefined) {
      // when the provided user defined the column field type as a possible number then try parsing the state value as that
      if (
        (fieldType === FieldType.number || fieldType === FieldType.integer || fieldType === FieldType.boolean) &&
        !isNaN(parseFloat(state))
      ) {
        newValue = parseFloat(state);
      }

      // when set as a multiple selection, we can assume that the 3rd party lib multiple-select will return a CSV string
      // we need to re-split that into an array to be the same as the original column
      if (this.isMultipleSelect && typeof state === 'string' && state.indexOf(',') >= 0) {
        newValue = state.split(',');
      }

      // is the field a complex object, "user.address.streetNumber"
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

  destroy(): void {
    // when autoCommitEdit is enabled, we might end up leaving an editor without it being saved, if so do call a save before destroying
    // this mainly happens doing a blur or focusing on another cell in the grid (it won't come here if we click outside the grid, in the body)
    if (
      this._msInstance &&
      this.hasAutoCommitEdit &&
      this.isValueChanged() &&
      !this._isDisposingOrCallingSave &&
      !this.args.isCompositeEditor
    ) {
      this._isDisposingOrCallingSave = true; // change destroying flag to avoid infinite loop
      this.save(true);
    }

    this._isDisposingOrCallingSave = true;
    if (typeof this._msInstance?.destroy === 'function') {
      this._msInstance.destroy();
    }
    this.editorElm?.remove();
    this._msInstance = undefined;
  }

  loadValue(item: any): void {
    const fieldName = this.columnDef?.field;

    // is the field a complex object, "address.streetNumber"
    const isComplexObject = fieldName !== undefined && fieldName?.indexOf('.') > 0;

    if (item && fieldName !== undefined) {
      // when it's a complex object, user could override the object path (where the editable object is located)
      // else we use the path provided in the Field Column Definition
      const objectPath = this.columnEditor?.complexObjectPath ?? fieldName;
      const currentValue = isComplexObject
        ? getDescendantProperty(item, objectPath as string)
        : item.hasOwnProperty(fieldName) && item[fieldName];
      const value = isComplexObject && currentValue?.hasOwnProperty(this.valueName) ? currentValue[this.valueName] : currentValue;

      if (this.isMultipleSelect && Array.isArray(value)) {
        this.loadMultipleValues(value);
      } else {
        this.loadSingleValue(value);
      }
    }
  }

  loadMultipleValues(currentValues: any[]): void {
    // convert to string because that is how the DOM will return these values
    if (Array.isArray(currentValues)) {
      // keep the default values in memory for references
      this.originalValue = currentValues.map((i: any) => (typeof i === 'number' || typeof i === 'boolean' ? `${i}` : i));
      this._msInstance?.setSelects(this.originalValue);

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(compositeEditorOptions);
      }
    }
  }

  loadSingleValue(currentValue: any): void {
    // keep the default value in memory for references
    this.originalValue = typeof currentValue === 'number' || typeof currentValue === 'boolean' ? `${currentValue}` : currentValue;
    this._msInstance?.setSelects([this.originalValue]);
  }

  serializeValue(): any | any[] {
    return this.isMultipleSelect ? this.currentValues : this.currentValue;
  }

  /**
   * Dynamically change an Editor option, this is especially useful with Composite Editor
   * since this is the only way to change option after the Editor is created (for example dynamically change "minDate" or another Editor)
   * @param {string} optionName - MultipleSelect option name
   * @param {newValue} newValue - MultipleSelect new option value
   */
  changeEditorOption<T extends keyof Required<MultipleSelectOption>, K extends Required<MultipleSelectOption>[T]>(
    optionName: T,
    newValue: K
  ): void {
    if (this.columnEditor) {
      this.columnEditor.options ??= {};
      this.columnEditor.editorOptions ??= {};
      this.columnEditor.options[optionName] = this.columnEditor.editorOptions[optionName] = newValue;
      this.editorElmOptions = { ...this.editorElmOptions, [optionName]: newValue };
      this._msInstance?.refreshOptions(this.editorElmOptions);
    }
  }

  disable(isDisabled = true): void {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._msInstance) {
      if (isDisabled) {
        this._msInstance.disable();

        // clear select when it's newly disabled and not yet empty
        const currentValues: string | number | Array<string | number> = this.getValue();
        const isValueBlank = Array.isArray(currentValues) && this.isMultipleSelect ? currentValues?.[0] === '' : currentValues === '';
        if (prevIsDisabled !== isDisabled && this.args.isCompositeEditor && !isValueBlank) {
          this.reset('', true, true);
        }
      } else {
        this._msInstance.enable();
      }
    }
  }

  focus(): void {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();
    this._msInstance?.focus();
  }

  isValueChanged(): boolean {
    const valueSelection = this._msInstance?.getSelects();
    if (this.isMultipleSelect) {
      const isEqual = dequal(valueSelection, this.originalValue);
      return !isEqual;
    }
    const value = Array.isArray(valueSelection) && valueSelection.length > 0 ? valueSelection[0] : undefined;
    return value !== undefined && value !== this.originalValue;
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false): void {
    const inputValue = value ?? this.originalValue;
    if (this._msInstance) {
      this.originalValue = this.isMultipleSelect ? (inputValue !== undefined ? [inputValue] : []) : inputValue;
      const selection = this.originalValue === undefined ? [] : [this.originalValue];
      this._msInstance.setSelects(selection);
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(compositeEditorOptions, 'user', shouldDeleteFormValue);
    }
  }

  save(forceCommitCurrentEdit = false): void {
    const validation = this.validate();
    const isValid = validation?.valid ?? false;

    if ((!this._isDisposingOrCallingSave || forceCommitCurrentEdit) && this.hasAutoCommitEdit && isValid) {
      // do not use args.commitChanges() as this sets the focus to the next row.
      // also the select list will stay shown when clicking off the grid
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  validate(_targetElm?: any, options?: ValidateOption): EditorValidationResult {
    const isRequired = this.args.isCompositeEditor ? false : this.columnEditor?.required;
    const elmValue = options?.inputValue ?? this._msInstance?.getSelects(); // && this.$editorElm.val && this.$editorElm.val();
    const errorMsg = this.columnEditor?.errorMessage;

    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.isCompositeEditor) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    if (this.validator) {
      const value = options !== undefined ? options : this.isMultipleSelect ? this.currentValues : this.currentValue;
      return this.validator(value, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && (elmValue === '' || (Array.isArray(elmValue) && elmValue.length === 0))) {
      return {
        valid: false,
        msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD,
      };
    }

    return {
      valid: true,
      msg: null,
    };
  }

  //
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState(): void {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell
      .notify({
        ...activeCell,
        item: this.dataContext,
        column: this.args.column,
        grid: this.grid,
        target: 'composite',
        compositeEditorOptions: this.args.compositeEditorOptions,
      })
      .getReturnValue();
    this.disable(isCellEditable === false);
  }

  protected translatePrefixSuffix(prefixSuffix: string | number): string | number {
    return this.enableTranslateLabel && this._translaterService && prefixSuffix && typeof prefixSuffix === 'string'
      ? this._translaterService.translate(prefixSuffix || ' ')
      : prefixSuffix;
  }

  protected translateOrDefault(translationKey: string, defaultValue = ''): string {
    const isTranslateEnabled = this.gridOptions?.enableTranslate ?? false;
    return isTranslateEnabled && this._translaterService?.translate ? this._translaterService.translate(translationKey) : defaultValue;
  }

  renderDomElement(inputCollection?: any[]): void {
    inputCollection = getCollectionFromObjectWhenEnabled(inputCollection, this.columnEditor);
    if (!Array.isArray(inputCollection)) {
      throw new Error('The "collection" passed to the Select Editor is not a valid array.');
    }

    // make a copy of the collection so that we don't impact SelectFilter, this could happen when calling "addBlankEntry" or "addCustomFirstEntry"
    let collection: any[] = [];
    if (inputCollection.length > 0) {
      collection = [...inputCollection];
    }

    // user can optionally add a blank entry at the beginning of the collection
    // make sure however that it wasn't added more than once
    if (
      this.collectionOptions?.addBlankEntry &&
      Array.isArray(collection) &&
      collection.length > 0 &&
      collection[0][this.valueName] !== ''
    ) {
      collection.unshift(createBlankSelectEntry(this.labelName, this.valueName, this.labelPrefixName, this.labelSuffixName));
      this.collection.unshift(createBlankSelectEntry(this.labelName, this.valueName, this.labelPrefixName, this.labelSuffixName)); // also make the change on the original collection
    }

    // user can optionally add his own custom entry at the beginning of the collection
    if (
      this.collectionOptions?.addCustomFirstEntry &&
      Array.isArray(collection) &&
      collection.length > 0 &&
      collection[0][this.valueName] !== this.collectionOptions.addCustomFirstEntry[this.valueName]
    ) {
      collection.unshift(this.collectionOptions.addCustomFirstEntry);
      this.collection.unshift(this.collectionOptions.addCustomFirstEntry); // also make the change on the original collection
    }

    // user can optionally add his own custom entry at the end of the collection
    if (this.collectionOptions?.addCustomLastEntry && Array.isArray(collection) && collection.length > 0) {
      const lastCollectionIndex = collection.length - 1;
      if (collection[lastCollectionIndex][this.valueName] !== this.collectionOptions.addCustomLastEntry[this.valueName]) {
        collection.push(this.collectionOptions.addCustomLastEntry);
      }
    }

    // assign the collection to a temp variable before filtering/sorting the collection
    let finalCollection = collection;

    // user might want to filter and/or sort certain items of the collection
    finalCollection = filterCollectionWithOptions(
      finalCollection,
      this._collectionService,
      this.columnEditor?.collectionFilterBy,
      this.collectionOptions
    );
    finalCollection = sortCollectionWithOptions(
      finalCollection,
      this.columnDef,
      this._collectionService,
      this.columnEditor?.collectionSortBy,
      this.enableTranslateLabel
    );

    // user could also override the collection
    if (this.columnEditor?.collectionOverride) {
      const overrideArgs: CollectionOverrideArgs = {
        column: this.columnDef,
        dataContext: this.dataContext,
        grid: this.grid,
        originalCollections: this.collection,
      };
      if (this.args.compositeEditorOptions) {
        const { formValues, modalType } = this.args.compositeEditorOptions;
        overrideArgs.compositeEditorOptions = { formValues, modalType };
      }
      finalCollection = this.columnEditor.collectionOverride(finalCollection, overrideArgs);
    }

    // keep reference of the final collection displayed in the UI
    this.finalCollection = finalCollection;

    // step 1, create HTML string template
    const selectBuildResult = buildMsSelectCollectionList(
      'editor',
      finalCollection,
      this.columnDef,
      this.grid,
      this.isMultipleSelect,
      this._translaterService
    );

    // step 2, create the DOM Element of the editor
    // we will later also subscribe to the onClose event to save the Editor whenever that event is triggered
    this.createDomElement(selectBuildResult.selectElement, selectBuildResult.dataCollection);
  }

  /**
   * From the Select DOM Element created earlier, create a Multiple/Single Select Editor using the multiple-select-vanilla.js lib
   * @param {Object} selectElement
   */
  protected createDomElement(selectElement: HTMLSelectElement, dataCollection: OptionRowData[]): void {
    const cellContainer = this.args.container;
    if (selectElement && cellContainer && typeof cellContainer.appendChild === 'function') {
      emptyElement(cellContainer);
      cellContainer.appendChild(selectElement);
    }

    // add placeholder when found
    const placeholder = this.columnEditor?.placeholder ?? '';
    this.defaultOptions.placeholder = placeholder || '';

    this.editorElmOptions = { ...this.defaultOptions, ...this.editorOptions, data: dataCollection };
    this._msInstance = multipleSelect(selectElement, this.editorElmOptions) as MultipleSelectInstance;
    this.editorElm = this._msInstance.getParentElement();
    this.columnEditor.onInstantiated?.(this._msInstance);
  }

  protected handleChangeOnCompositeEditor(
    compositeEditorOptions: CompositeEditorOption,
    triggeredBy: 'user' | 'system' = 'user',
    isCalledByClearValue = false
  ): void {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const item = this.dataContext;
    const grid = this.grid;
    const newValues = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.dataContext, newValues);
    }
    this.applyValue(compositeEditorOptions.formValues, newValues);

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (
      isCalledByClearValue ||
      (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(this.columnId))
    ) {
      delete compositeEditorOptions.formValues[this.columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      {
        ...activeCell,
        item,
        grid,
        column,
        formValues: compositeEditorOptions.formValues,
        editors: compositeEditorOptions.editors,
        triggeredBy,
      },
      new SlickEventData()
    );
  }
}
