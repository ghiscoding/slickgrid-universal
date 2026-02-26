import { emptyElement, isPrimitiveValue } from '@slickgrid-universal/utils';
import { multipleSelect, type MultipleSelectInstance, type MultipleSelectOption, type OptionRowData } from 'multiple-select-vanilla';
import {
  createBlankSelectEntry,
  filterCollectionWithOptions,
  getCollectionFromObjectWhenEnabled,
  sortCollectionWithOptions,
} from '../commonEditorFilter/commonEditorFilterUtils.js';
import { Constants } from '../constants.js';
import type { SlickGrid } from '../core/index.js';
import { type OperatorType, type SearchTerm } from '../enums/index.js';
import type { CollectionService } from '../services/collection.service.js';
import { buildMsSelectCollectionList, type RxJsFacade, type Subscription, type TranslaterService } from '../services/index.js';
import { collectionObserver, propertyObserver } from '../services/observers.js';
import { fetchAsPromise, getTranslationPrefix, unsubscribeAll } from '../services/utilities.js';
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
} from './../interfaces/index.js';
import { renderCollectionOptionsAsync } from './filterUtilities.js';

export class SelectFilter implements Filter {
  protected _isMultipleSelect = true;
  protected _collectionLength = 0;
  protected _collectionObservers: Array<null | { disconnect: () => void }> = [];
  protected _locales!: Locale;
  protected _msInstance?: MultipleSelectInstance;
  protected _shouldTriggerQuery = true;
  protected _isLazyDataLoaded = false;

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
  filterContainerElm!: HTMLElement;

  /**
   * Initialize the Filter
   */
  constructor(
    protected readonly translaterService?: TranslaterService | undefined,
    protected readonly collectionService?: CollectionService | undefined,
    protected readonly rxjs?: RxJsFacade | undefined,
    isMultipleSelect = true
  ) {
    this._isMultipleSelect = isMultipleSelect;
  }

  /** Getter for the Collection Options */
  protected get collectionOptions(): CollectionOption {
    return this.columnDef?.filter?.collectionOptions ?? {};
  }

  get columnId(): string | number {
    return this.columnDef?.id ?? '';
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
  get defaultOperator(): OperatorType {
    return this.isMultipleSelect ? 'IN' : 'EQ';
  }

  get filterOptions(): MultipleSelectOption {
    return { ...this.gridOptions.defaultFilterOptions?.select, ...this.columnFilter?.options };
  }

  /** Getter to know if the current filter is a multiple-select (false means it's a single select) */
  get isMultipleSelect(): boolean {
    return this._isMultipleSelect;
  }

  get msInstance(): MultipleSelectInstance | undefined {
    return this._msInstance;
  }

  get selectOptions(): Partial<MultipleSelectOption> {
    return this.defaultOptions;
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType {
    return this.columnFilter?.operator ?? this.defaultOperator;
  }

  /** Setter for the filter operator */
  set operator(operator: OperatorType) {
    if (this.columnFilter) {
      this.columnFilter.operator = operator;
    }
  }

  /** Initialize the filter template */
  init(args: FilterArguments): Promise<any[]> {
    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];
    this.filterContainerElm = args.filterContainerElm;

    if (
      !this.grid ||
      !this.columnDef ||
      !this.columnFilter ||
      (!this.columnFilter.collection && !this.columnFilter.collectionAsync && !this.columnFilter.collectionLazy)
    ) {
      throw new Error(
        `[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") for the MultipleSelect/SingleSelect Filter to work correctly. Also each option should include a value/label pair (or value/labelKey when using Locale). For example:: { filter: model: Filters.multipleSelect, collection: [{ value: true, label: 'True' }, { value: false, label: 'False'}] }`
      );
    }

    this.enableTranslateLabel = this.columnFilter?.enableTranslateLabel ?? false;
    this.labelName = this.customStructure?.label ?? 'label';
    this.labelPrefixName = this.customStructure?.labelPrefix ?? 'labelPrefix';
    this.labelSuffixName = this.customStructure?.labelSuffix ?? 'labelSuffix';
    this.optionLabel = this.customStructure?.optionLabel ?? 'value';
    this.valueName = this.customStructure?.value ?? 'value';

    if (this.enableTranslateLabel && (!this.translaterService || typeof this.translaterService.translate !== 'function')) {
      throw new Error(
        `[select-filter] The Translate Service is required for the Select Filter to work correctly when "enableTranslateLabel" is set.`
      );
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
      this.columnDef.filter.emptySearchTermReturnAllValues ??= false;
    }

    // always render the Select (dropdown) DOM element,
    // if that is the case, the Select will simply be without any options but we still have to render it (else SlickGrid would throw an error)
    const newCollection = this.columnFilter.collection || [];

    return new Promise(async (resolve, reject) => {
      try {
        let collectionOutput: Promise<any[]> | any[] | undefined;

        if (this.columnFilter.collectionAsync && !this.columnFilter.collection) {
          // only read the collectionAsync once (on the 1st load),
          // we do this because Http Fetch will throw an error saying body was already read and its streaming becomes locked
          collectionOutput = renderCollectionOptionsAsync(
            this.columnFilter.collectionAsync,
            this.columnDef,
            this.renderDomElement.bind(this),
            this.rxjs,
            this.subscriptions
          );
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
      } catch (e: any) {
        reject(e);
      }
    });
  }

  /** Clear the filter values */
  clear(shouldTriggerQuery = true): void {
    if (this._msInstance && this._collectionLength > 0) {
      // reload the filter element by it's id, to make sure it's still a valid element (because of some issue in the GraphQL example)
      this._msInstance.setSelects([]);
      this.updateFilterStyle(false);
      this.searchTerms = [];
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.callback(undefined, {
        columnDef: this.columnDef,
        clearFilterTriggered: true,
        shouldTriggerQuery: this._shouldTriggerQuery,
      });
      this._shouldTriggerQuery = true; // reset flag for next use
    }
  }

  /** destroy the filter */
  destroy(): void {
    if (typeof this._msInstance?.destroy === 'function') {
      this._msInstance.destroy();
    }
    this.filterElm?.remove();

    // TODO: causing Example 7 E2E tests to fails, will revisit later
    // this._collectionObservers.forEach(obs => obs?.disconnect());

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
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType, triggerChange = false): void {
    if (values !== undefined && this._msInstance) {
      values = Array.isArray(values) ? (values.every((x) => isPrimitiveValue(x)) ? values.map(String) : values) : [values];
      this._msInstance.setSelects(values);
    }

    // set the operator when defined
    this.updateFilterStyle(this.getValues().length > 0);

    // set the operator when defined
    this.operator = operator || this.defaultOperator;

    if (triggerChange) {
      this.onTriggerEvent();
    }
  }

  //
  // protected functions
  // ------------------

  /**
   * Subscribe to both CollectionObserver & PropertyObserver with BindingEngine.
   * They each have their own purpose, the "propertyObserver" will trigger once the collection is replaced entirely
   * while the "collectionObverser" will trigger on collection changes (`push`, `unshift`, `splice`, ...)
   */
  protected watchCollectionChanges(): void {
    if (this.columnFilter?.collection) {
      // subscribe to the "collection" changes (array `push`, `unshift`, `splice`, ...)
      this._collectionObservers.push(collectionObserver(this.columnFilter.collection, this.watchCallback.bind(this)));

      // observe for any "collection" changes (array replace)
      // then simply recreate/re-render the Select (dropdown) DOM Element
      propertyObserver(this.columnFilter, 'collection', this.propertyObserverCallback.bind(this));
    }
  }

  protected propertyObserverCallback(newValue: any): void {
    this.renderDomElement(newValue || []);

    // when new assignment arrives, we need to also reassign observer to the new reference
    if (this.columnFilter.collection) {
      this._collectionObservers.push(collectionObserver(this.columnFilter.collection, this.watchCallback.bind(this)));
    }
  }

  protected watchCallback(updatedArray: any[]): void {
    this.renderDomElement(this.columnFilter.collection || updatedArray || []);
  }

  renderDomElement(inputCollection: any[]): void {
    inputCollection = getCollectionFromObjectWhenEnabled(inputCollection, this.columnFilter);
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
    if (
      this.collectionOptions?.addBlankEntry &&
      Array.isArray(collection) &&
      collection.length > 0 &&
      collection[0][this.valueName] !== ''
    ) {
      collection.unshift(createBlankSelectEntry(this.labelName, this.valueName, this.labelPrefixName, this.labelSuffixName));
    }

    // user can optionally add his own custom entry at the beginning of the collection
    if (
      this.collectionOptions?.addCustomFirstEntry &&
      Array.isArray(collection) &&
      collection.length > 0 &&
      collection[0][this.valueName] !== this.collectionOptions.addCustomFirstEntry[this.valueName]
    ) {
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
    // user might want to filter and/or sort certain items of the collection
    const { dataCollection, hasFoundSearchTerm, selectElement } = this.filterSortAndParseCollection(collection);

    // step 1, create HTML DOM element
    this.isFilled = hasFoundSearchTerm;

    // step 2, create the DOM Element of the filter & pre-load search terms
    // we will later also subscribe to the onClose event to filter the data whenever that event is triggered
    this.createFilterElement(selectElement, dataCollection);
    this._collectionLength = dataCollection.length;
  }

  /**
   * From the Select DOM Element created earlier, create a Multiple/Single Select Filter using the multiple-select-vanilla.js lib
   * @param {Object} selectElement
   */
  protected createFilterElement(selectElement: HTMLSelectElement, dataCollection: OptionRowData[]): void {
    // provide the name attribute to the DOM element which will be needed to auto-adjust drop position (dropup / dropdown)
    this.elementName = `filter-${this.columnId}`;
    this.defaultOptions.name = this.elementName;

    emptyElement(this.filterContainerElm);

    // create the DOM element & add an ID and filter class
    this.filterElm = selectElement;
    this.filterElm.dataset.columnId = `${this.columnId}`;

    // if there's a search term, we will add the "filled" class for styling purposes
    this.updateFilterStyle(this.isFilled);

    // append the new DOM element to the header row
    this.filterContainerElm.appendChild(selectElement);

    // merge options & attach multiSelect
    this.filterElmOptions = { ...this.defaultOptions, ...this.filterOptions, data: dataCollection };
    this._msInstance = multipleSelect(selectElement, this.filterElmOptions) as MultipleSelectInstance;
    this.columnFilter.onInstantiated?.(this._msInstance);
  }

  protected filterSortAndParseCollection(inputCollection: any[]): {
    selectElement: HTMLSelectElement;
    dataCollection: OptionRowData[];
    hasFoundSearchTerm: boolean;
  } {
    // user might want to filter and/or sort certain items of the collection
    inputCollection = filterCollectionWithOptions(
      inputCollection,
      this.collectionService,
      this.columnFilter?.collectionFilterBy,
      this.collectionOptions
    );
    inputCollection = sortCollectionWithOptions(
      inputCollection,
      this.columnDef,
      this.collectionService,
      this.columnFilter?.collectionSortBy,
      this.enableTranslateLabel
    );

    return buildMsSelectCollectionList(
      'filter',
      inputCollection,
      this.columnDef,
      this.grid,
      this.isMultipleSelect,
      this.translaterService,
      this.searchTerms || []
    );
  }

  protected initMultipleSelectTemplate(): void {
    // default options used by this Filter, user can overwrite any of these by passing "otions"
    const options: Partial<MultipleSelectOption> = {
      autoAdjustDropHeight: true,
      autoAdjustDropPosition: true,
      autoAdjustDropWidthByTextSize: true,
      name: `${this.columnId}`,
      container: 'body',
      closeOnTab: true,
      darkMode: !!this.gridOptions.darkMode,
      filter: false, // input search term on top of the select option list
      maxHeight: 275,
      single: true,
      singleRadio: true,
      showSearchClear: true,
      tabIndex: 0,
      renderOptionLabelAsHtml: this.columnFilter?.enableRenderHtml ?? false,
      sanitizer: (dirtyHtml: string) => this.grid.sanitizeHtmlString(dirtyHtml),
      // we will subscribe to the onClose event for triggering our callback
      // also add/remove "filled" class for styling purposes & refocus on ms-select parent after closing
      onClose: () => {
        this.onTriggerEvent();
        this._msInstance?.focus();
      },
      onClear: () => this.clear(),
    };

    // optional lazy loading of the collection (when select is opened)
    if (this.columnFilter.collectionLazy) {
      options.lazyData = (resolve, reject) => {
        const lazyProcess = this.columnFilter.collectionLazy?.(this.columnDef);
        fetchAsPromise(lazyProcess, this.rxjs)
          .then((collectionData) => {
            // user might want to filter and/or sort certain items of the collection
            collectionData = getCollectionFromObjectWhenEnabled(collectionData, this.columnFilter);
            const { dataCollection } = this.filterSortAndParseCollection(collectionData);
            resolve(dataCollection || []);
          })
          .catch((error) => reject(error));
      };
    }

    if (this._isMultipleSelect) {
      options.single = false;
      options.singleRadio = false;
      options.showOkButton = true;
      options.displayTitle = true; // show tooltip of all selected items while hovering the filter
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      options.countSelectedText = this.translateOrDefault(`${translationPrefix}X_OF_Y_SELECTED`, this._locales?.TEXT_X_OF_Y_SELECTED);
      options.allSelectedText = this.translateOrDefault(`${translationPrefix}ALL_SELECTED`, this._locales?.TEXT_ALL_SELECTED);
      options.noMatchesFoundText = this.translateOrDefault(`${translationPrefix}NO_MATCHES_FOUND`, this._locales?.TEXT_NO_MATCHES_FOUND);
      options.okButtonText = this.translateOrDefault(`${translationPrefix}OK`, this._locales?.TEXT_OK);
      options.selectAllText = this.translateOrDefault(`${translationPrefix}SELECT_ALL`, this._locales?.TEXT_SELECT_ALL);
      options.lazyLoadingText = this.translateOrDefault(`${translationPrefix}LOADING`, this._locales?.TEXT_LOADING);
    }
    this.defaultOptions = options;
  }

  protected onTriggerEvent(): void {
    if (this._msInstance) {
      const selectedItems = this.getValues();
      this.updateFilterStyle(
        (Array.isArray(selectedItems) && selectedItems.length > 1) || (selectedItems.length === 1 && selectedItems[0] !== '')
      );
      this.searchTerms = selectedItems;
      this.callback(undefined, {
        columnDef: this.columnDef,
        operator: this.operator,
        searchTerms: selectedItems,
        shouldTriggerQuery: this._shouldTriggerQuery,
      });
      // reset flag for next use
      this._shouldTriggerQuery = true;
    }
  }

  /** add/remove "filled" CSS class */
  protected updateFilterStyle(isFilled: boolean): void {
    this.isFilled = isFilled;
    this.filterElm?.classList.toggle('filled', isFilled);
    this._msInstance?.getParentElement()?.classList.toggle('filled', isFilled);
  }

  protected translateOrDefault(translationKey: string, defaultValue = ''): string {
    const isTranslateEnabled = this.gridOptions?.enableTranslate ?? false;
    return isTranslateEnabled && this.translaterService?.translate ? this.translaterService.translate(translationKey) : defaultValue;
  }
}
