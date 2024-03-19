import { multipleSelect, type MultipleSelectInstance, type MultipleSelectOption, type OptionRowData } from 'multiple-select-vanilla';
import { emptyElement, isPrimitiveValue } from '@slickgrid-universal/utils';

import { Constants } from '../constants';
import { type OperatorString, OperatorType, type SearchTerm, } from '../enums/index';
import type {
  CollectionCustomStructure,
  CollectionOption,
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  Locale,
} from './../interfaces/index';
import type { CollectionService } from '../services/collection.service';
import { collectionObserver, propertyObserver } from '../services/observers';
import { getDescendantProperty, getTranslationPrefix, unsubscribeAll } from '../services/utilities';
import { buildMsSelectCollectionList, type RxJsFacade, sanitizeTextByAvailableSanitizer, type Subscription, type TranslaterService } from '../services/index';
import { renderCollectionOptionsAsync } from './filterUtilities';
import type { SlickGrid } from '../core/index';

export class SelectFilter implements Filter {
  protected _isMultipleSelect = true;
  protected _collectionLength = 0;
  protected _locales!: Locale;
  protected _msInstance?: MultipleSelectInstance;
  protected _shouldTriggerQuery = true;

  /** DOM Element Name, useful for auto-detecting positioning (dropup / dropdown) */
  elementName!: string;

  /** Filter Multiple-Select options */
  filterElmOptions!: Partial<MultipleSelectOption>;

  /** The DOM element */
  filterElm?: HTMLElement;

  grid!: SlickGrid;
  searchTerms: SearchTerm[] | undefined;
  columnDef!: Column;
  callback!: FilterCallback;
  defaultOptions!: Partial<MultipleSelectOption>;
  isFilled = false;
  labelName!: string;
  labelPrefixName!: string;
  labelSuffixName!: string;
  optionLabel!: string;
  valueName!: string;
  enableTranslateLabel = false;
  subscriptions: Subscription[] = [];
  filterContainerElm!: HTMLDivElement;

  /**
   * Initialize the Filter
   */
  constructor(
    protected readonly translaterService?: TranslaterService,
    protected readonly collectionService?: CollectionService,
    protected readonly rxjs?: RxJsFacade,
    isMultipleSelect = true) {
    this._isMultipleSelect = isMultipleSelect;
  }

  /** Getter for the Collection Options */
  protected get collectionOptions(): CollectionOption {
    return this.columnDef?.filter?.collectionOptions ?? {};
  }

  /** Getter for the Filter Operator */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter for the Custom Structure if exist */
  get customStructure(): CollectionCustomStructure | undefined {
    return this.columnDef?.filter?.customStructure;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return this.isMultipleSelect ? OperatorType.in : OperatorType.equal;
  }

  /** Getter to know if the current filter is a multiple-select (false means it's a single select) */
  get isMultipleSelect(): boolean {
    return this._isMultipleSelect;
  }

  get msInstance() {
    return this._msInstance;
  }

  get selectOptions() {
    return this.defaultOptions;
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType | OperatorString {
    return this.columnFilter?.operator ?? this.defaultOperator;
  }

  /** Setter for the filter operator */
  set operator(operator: OperatorType | OperatorString) {
    if (this.columnFilter) {
      this.columnFilter.operator = operator;
    }
  }

  /** Initialize the filter template */
  init(args: FilterArguments): Promise<any[]> {
    if (!args) {
      throw new Error('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
    }

    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];
    this.filterContainerElm = args.filterContainerElm;

    if (!this.grid || !this.columnDef || !this.columnFilter || (!this.columnFilter.collection && !this.columnFilter.collectionAsync)) {
      throw new Error(`[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") for the MultipleSelect/SingleSelect Filter to work correctly. Also each option should include a value/label pair (or value/labelKey when using Locale). For example:: { filter: model: Filters.multipleSelect, collection: [{ value: true, label: 'True' }, { value: false, label: 'False'}] }`);
    }

    this.enableTranslateLabel = this.columnFilter?.enableTranslateLabel ?? false;
    this.labelName = this.customStructure?.label ?? 'label';
    this.labelPrefixName = this.customStructure?.labelPrefix ?? 'labelPrefix';
    this.labelSuffixName = this.customStructure?.labelSuffix ?? 'labelSuffix';
    this.optionLabel = this.customStructure?.optionLabel ?? 'value';
    this.valueName = this.customStructure?.value ?? 'value';

    if (this.enableTranslateLabel && (!this.translaterService || typeof this.translaterService.translate !== 'function')) {
      throw new Error(`[select-filter] The Translate Service is required for the Select Filter to work correctly when "enableTranslateLabel" is set.`);
    }

    // get locales provided by user in main file or else use default English locales via the Constants
    this._locales = this.gridOptions?.locales ?? Constants.locales;

    // create the multiple select element
    this.initMultipleSelectTemplate();

    // add placeholder when found
    let placeholder = this.gridOptions?.defaultFilterPlaceholder || '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }
    this.defaultOptions.placeholder = placeholder || '';

    // when we're using a multiple-select filter and we have an empty select option,
    // we probably want this value to be a valid filter option that will ONLY return value that are empty (not everything like its default behavior)
    // user can still override it by defining it
    if (this._isMultipleSelect && this.columnDef?.filter) {
      this.columnDef.filter.emptySearchTermReturnAllValues = this.columnDef.filter?.emptySearchTermReturnAllValues ?? false;
    }

    // always render the Select (dropdown) DOM element,
    // if that is the case, the Select will simply be without any options but we still have to render it (else SlickGrid would throw an error)
    const newCollection = this.columnFilter.collection || [];

    return new Promise(async (resolve, reject) => {
      try {
        let collectionOutput: Promise<any[]> | any[] | undefined;

        if (this.columnFilter.collectionAsync && !this.columnFilter.collection) {
          // only read the collectionAsync once (on the 1st load),
          // we do this because Http Fetch will throw an error saying body was already read and its streaming is locked
          collectionOutput = renderCollectionOptionsAsync(this.columnFilter.collectionAsync, this.columnDef, this.renderDomElement.bind(this), this.rxjs, this.subscriptions);
          resolve(collectionOutput);
        } else {
          collectionOutput = newCollection;
          this.renderDomElement(newCollection);
          resolve(newCollection);
        }

        // subscribe to both CollectionObserver and PropertyObserver
        // any collection changes will trigger a re-render of the DOM element filter
        if (this.columnFilter.collectionAsync || this.columnFilter.enableCollectionWatch) {
          await (collectionOutput ?? this.columnFilter.collectionAsync);
          this.watchCollectionChanges();
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /** Clear the filter values */
  clear(shouldTriggerQuery = true) {
    if (this._msInstance && this._collectionLength > 0) {
      // reload the filter element by it's id, to make sure it's still a valid element (because of some issue in the GraphQL example)
      this._msInstance.setSelects([]);
      this.filterElm?.classList.remove('filled');
      this._msInstance?.getParentElement()?.classList.remove('filled');
      this.searchTerms = [];
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.callback(undefined, { columnDef: this.columnDef, clearFilterTriggered: true, shouldTriggerQuery: this._shouldTriggerQuery });
      this._shouldTriggerQuery = true; // reset flag for next use
    }
  }

  /** destroy the filter */
  destroy() {
    if (typeof this._msInstance?.destroy === 'function') {
      this._msInstance.destroy();
    }
    this.filterElm?.remove();

    // unsubscribe all the possible Observables if RxJS was used
    unsubscribeAll(this.subscriptions);
  }

  /**
   * Get selected values retrieved from the multiple-selected element
   * @params selected items
   */
  getValues(): any[] {
    return this._msInstance?.getSelects() ?? [];
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    if (values !== undefined && this._msInstance) {
      values = Array.isArray(values)
        ? values.every(x => isPrimitiveValue(x)) ? values.map(String) : values
        : [values];
      this._msInstance.setSelects(values);
    }
    this.updateFilterStyle(this.getValues().length > 0);

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  //
  // protected functions
  // ------------------

  /**
   * user might want to filter certain items of the collection
   * @param inputCollection
   * @return outputCollection filtered and/or sorted collection
   */
  protected filterCollection(inputCollection: any[]): any[] {
    let outputCollection = inputCollection;

    // user might want to filter certain items of the collection
    if (this.columnFilter && this.columnFilter.collectionFilterBy) {
      const filterBy = this.columnFilter.collectionFilterBy;
      const filterCollectionBy = this.columnFilter.collectionOptions?.filterResultAfterEachPass || null;
      outputCollection = this.collectionService?.filterCollection(outputCollection, filterBy, filterCollectionBy) || [];
    }

    return outputCollection;
  }

  /**
   * user might want to sort the collection in a certain way
   * @param inputCollection
   * @return outputCollection filtered and/or sorted collection
   */
  protected sortCollection(inputCollection: any[]): any[] {
    let outputCollection = inputCollection;

    // user might want to sort the collection
    if (this.columnFilter && this.columnFilter.collectionSortBy) {
      const sortBy = this.columnFilter.collectionSortBy;
      outputCollection = this.collectionService?.sortCollection(this.columnDef, outputCollection, sortBy, this.enableTranslateLabel) || [];
    }

    return outputCollection;
  }

  /**
   * Subscribe to both CollectionObserver & PropertyObserver with BindingEngine.
   * They each have their own purpose, the "propertyObserver" will trigger once the collection is replaced entirely
   * while the "collectionObverser" will trigger on collection changes (`push`, `unshift`, `splice`, ...)
   */
  protected watchCollectionChanges() {
    if (this.columnFilter?.collection) {
      // subscribe to the "collection" changes (array `push`, `unshift`, `splice`, ...)
      collectionObserver(this.columnFilter.collection, this.watchCallback.bind(this));

      // observe for any "collection" changes (array replace)
      // then simply recreate/re-render the Select (dropdown) DOM Element
      propertyObserver(this.columnFilter, 'collection', this.propertyObserverCallback.bind(this));
    }
  }

  protected propertyObserverCallback(newValue: any) {
    this.renderDomElement(newValue || []);

    // when new assignment arrives, we need to also reassign observer to the new reference
    if (this.columnFilter.collection) {
      collectionObserver(this.columnFilter.collection, this.watchCallback.bind(this));
    }
  }

  protected watchCallback(updatedArray: any[]) {
    this.renderDomElement(this.columnFilter.collection || updatedArray || []);
  }

  renderDomElement(inputCollection: any[]) {
    if (!Array.isArray(inputCollection) && this.collectionOptions?.collectionInsideObjectProperty) {
      const collectionInsideObjectProperty = this.collectionOptions.collectionInsideObjectProperty;
      inputCollection = getDescendantProperty(inputCollection, collectionInsideObjectProperty || '');
    }
    if (!Array.isArray(inputCollection)) {
      throw new Error('The "collection" passed to the Select Filter is not a valid array.');
    }

    // make a copy of the collection so that we don't impact SelectEditor, this could happen when calling "addBlankEntry" or "addCustomFirstEntry"
    let collection: any[] = [];
    if (inputCollection.length > 0) {
      collection = [...inputCollection];
    }

    // user can optionally add a blank entry at the beginning of the collection
    // make sure however that it wasn't added more than once
    if (this.collectionOptions?.addBlankEntry && Array.isArray(collection) && collection.length > 0 && collection[0][this.valueName] !== '') {
      collection.unshift(this.createBlankEntry());
    }

    // user can optionally add his own custom entry at the beginning of the collection
    if (this.collectionOptions?.addCustomFirstEntry && Array.isArray(collection) && collection.length > 0 && collection[0][this.valueName] !== this.collectionOptions.addCustomFirstEntry[this.valueName]) {
      collection.unshift(this.collectionOptions.addCustomFirstEntry);
    }

    // user can optionally add his own custom entry at the end of the collection
    if (this.collectionOptions?.addCustomLastEntry && Array.isArray(collection) && collection.length > 0) {
      const lastCollectionIndex = collection.length - 1;
      if (collection[lastCollectionIndex][this.valueName] !== this.collectionOptions.addCustomLastEntry[this.valueName]) {
        collection.push(this.collectionOptions.addCustomLastEntry);
      }
    }

    // assign the collection to a temp variable before filtering/sorting the collection
    let newCollection = collection;

    // user might want to filter and/or sort certain items of the collection
    newCollection = this.filterCollection(newCollection);
    newCollection = this.sortCollection(newCollection);

    // step 1, create HTML DOM element
    const selectBuildResult = buildMsSelectCollectionList(
      'filter',
      newCollection,
      this.columnDef,
      this.grid,
      this.isMultipleSelect,
      this.translaterService,
      this.searchTerms || []
    );
    this.isFilled = selectBuildResult.hasFoundSearchTerm;

    // step 2, create the DOM Element of the filter & pre-load search terms
    // we will later also subscribe to the onClose event to filter the data whenever that event is triggered
    this.createFilterElement(selectBuildResult.selectElement, selectBuildResult.dataCollection);
    this._collectionLength = newCollection.length;
  }

  /** Create a blank entry that can be added to the collection. It will also reuse the same collection structure provided by the user */
  protected createBlankEntry(): any {
    const blankEntry = {
      [this.labelName]: '',
      [this.valueName]: ''
    };
    if (this.labelPrefixName) {
      blankEntry[this.labelPrefixName] = '';
    }
    if (this.labelSuffixName) {
      blankEntry[this.labelSuffixName] = '';
    }
    return blankEntry;
  }

  /**
   * From the Select DOM Element created earlier, create a Multiple/Single Select Filter using the multiple-select-vanilla.js lib
   * @param {Object} selectElement
   */
  protected createFilterElement(selectElement: HTMLSelectElement, dataCollection: OptionRowData[]) {
    const columnId = this.columnDef?.id ?? '';

    // provide the name attribute to the DOM element which will be needed to auto-adjust drop position (dropup / dropdown)
    this.elementName = `filter-${columnId}`;
    this.defaultOptions.name = this.elementName;

    emptyElement(this.filterContainerElm);

    // create the DOM element & add an ID and filter class
    this.filterElm = selectElement;
    this.filterElm.dataset.columnId = `${columnId}`;

    // if there's a search term, we will add the "filled" class for styling purposes
    this.updateFilterStyle(this.isFilled);

    // append the new DOM element to the header row
    this.filterContainerElm.appendChild(selectElement);

    // merge options & attach multiSelect
    const filterOptions: MultipleSelectOption = (this.columnFilter) ? this.columnFilter.filterOptions : {};
    this.filterElmOptions = { ...this.defaultOptions, ...(filterOptions as MultipleSelectOption), data: dataCollection };
    this._msInstance = multipleSelect(selectElement, this.filterElmOptions) as MultipleSelectInstance;
  }

  protected initMultipleSelectTemplate() {
    const isTranslateEnabled = this.gridOptions?.enableTranslate ?? false;
    const columnId = this.columnDef?.id ?? '';

    // default options used by this Filter, user can overwrite any of these by passing "otions"
    const options = {
      autoAdjustDropHeight: true,
      autoAdjustDropPosition: true,
      autoAdjustDropWidthByTextSize: true,
      name: `${columnId}`,
      container: 'body',
      darkMode: !!this.gridOptions.darkMode,
      filter: false,  // input search term on top of the select option list
      maxHeight: 275,
      single: true,
      renderOptionLabelAsHtml: this.columnFilter?.enableRenderHtml ?? false,
      sanitizer: (dirtyHtml: string) => sanitizeTextByAvailableSanitizer(this.gridOptions, dirtyHtml),
      // we will subscribe to the onClose event for triggering our callback
      // also add/remove "filled" class for styling purposes
      onClose: () => this.onTriggerEvent()
    } as MultipleSelectOption;

    if (this._isMultipleSelect) {
      options.single = false;
      options.showOkButton = true;
      options.displayTitle = true; // show tooltip of all selected items while hovering the filter
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      options.countSelectedText = (isTranslateEnabled && this.translaterService?.translate) ? this.translaterService.translate(`${translationPrefix}X_OF_Y_SELECTED`) : this._locales?.TEXT_X_OF_Y_SELECTED;
      options.allSelectedText = (isTranslateEnabled && this.translaterService?.translate) ? this.translaterService.translate(`${translationPrefix}ALL_SELECTED`) : this._locales?.TEXT_ALL_SELECTED;
      options.noMatchesFoundText = (isTranslateEnabled && this.translaterService?.translate) ? this.translaterService.translate(`${translationPrefix}NO_MATCHES_FOUND`) : this._locales?.TEXT_NO_MATCHES_FOUND;
      options.okButtonText = (isTranslateEnabled && this.translaterService?.translate) ? this.translaterService.translate(`${translationPrefix}OK`) : this._locales?.TEXT_OK;
      options.selectAllText = (isTranslateEnabled && this.translaterService?.translate) ? this.translaterService.translate(`${translationPrefix}SELECT_ALL`) : this._locales?.TEXT_SELECT_ALL;
    }
    this.defaultOptions = options;
  }

  protected onTriggerEvent() {
    if (this._msInstance) {
      const selectedItems = this.getValues();
      this.updateFilterStyle(Array.isArray(selectedItems) && selectedItems.length > 1 || (selectedItems.length === 1 && selectedItems[0] !== ''));
      this.searchTerms = selectedItems;
      this.callback(undefined, { columnDef: this.columnDef, operator: this.operator, searchTerms: selectedItems, shouldTriggerQuery: this._shouldTriggerQuery });
      // reset flag for next use
      this._shouldTriggerQuery = true;
    }
  }

  /** Set value(s) on the DOM element */
  protected updateFilterStyle(isFilled: boolean) {
    if (isFilled) {
      this.isFilled = true;
      this.filterElm?.classList.add('filled');
      this._msInstance?.getParentElement()?.classList.add('filled');
    } else {
      this.isFilled = false;
      this.filterElm?.classList.remove('filled');
      this._msInstance?.getParentElement()?.classList.remove('filled');
    }
  }
}
