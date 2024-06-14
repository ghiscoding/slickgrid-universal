import autocompleter from 'autocompleter';
import type { AutocompleteItem, AutocompleteSettings } from 'autocompleter';
import { BindingEventService } from '@slickgrid-universal/binding';
import { classNameToList, createDomElement, emptyElement, isPrimitiveValue, toKebabCase, toSentenceCase } from '@slickgrid-universal/utils';

import {
  FieldType,
  OperatorType,
  type OperatorString,
  type SearchTerm,
} from '../enums/index';
import type {
  AutocompleterOption,
  AutocompleteSearchItem,
  CollectionCustomStructure,
  CollectionOption,
  Column,
  ColumnFilter,
  DOMEvent,
  Filter,
  FilterArguments,
  FilterCallback,
  FilterCallbackArg,
  GridOption,
  Locale,
} from '../interfaces/index';
import { addAutocompleteLoadingByOverridingFetch } from '../commonEditorFilter';
import type { CollectionService } from '../services/collection.service';
import { collectionObserver, propertyObserver } from '../services/observers';
import { getDescendantProperty, unsubscribeAll } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import { renderCollectionOptionsAsync } from './filterUtilities';
import type { RxJsFacade, Subscription } from '../services/rxjsFacade';
import { Constants } from '../constants';
import { type SlickGrid } from '../core/index';

export class AutocompleterFilter<T extends AutocompleteItem = any> implements Filter {
  protected _autocompleterOptions!: Partial<AutocompleterOption<T>>;
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _collection?: any[];
  protected _filterElm!: HTMLInputElement;
  protected _instance: any;
  protected _locales!: Locale;
  protected _shouldTriggerQuery = true;

  /** DOM Element Name, useful for auto-detecting positioning (dropup / dropdown) */
  elementName!: string;

  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  isFilled = false;
  isItemSelected = false;
  filterContainerElm!: HTMLDivElement;

  /** The property name for labels in the collection */
  labelName!: string;

  /** The property name for a prefix that can be added to the labels in the collection */
  labelPrefixName!: string;

  /** The property name for a suffix that can be added to the labels in the collection */
  labelSuffixName!: string;

  /** The property name for values in the collection */
  optionLabel!: string;

  /** The property name for values in the collection */
  valueName = 'label';

  enableTranslateLabel = false;
  subscriptions: Subscription[] = [];

  /**
   * Initialize the Filter
   */
  constructor(
    protected readonly translaterService?: TranslaterService | undefined,
    protected readonly collectionService?: CollectionService | undefined,
    protected readonly rxjs?: RxJsFacade | undefined
  ) {
    this._bindEventService = new BindingEventService();
  }

  /** Getter for the Autocomplete Option */
  get autocompleterOptions(): any {
    return this._autocompleterOptions || {};
  }

  /** Getter for the Collection Options */
  protected get collectionOptions(): CollectionOption {
    return this.columnDef?.filter?.collectionOptions ?? {};
  }

  /** Getter for the Collection Used by the Filter */
  get collection(): any[] | undefined {
    return this._collection;
  }

  /** Getter for the Filter Operator */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter || {};
  }

  /** Getter for the Editor DOM Element */
  get filterDomElement(): any {
    return this._filterElm;
  }

  get filterOptions(): AutocompleterOption {
    return { ...this.gridOptions.defaultFilterOptions?.autocompleter, ...this.columnFilter?.filterOptions };
  }

  /** Getter for the Custom Structure if exist */
  get customStructure(): CollectionCustomStructure | undefined {
    let customStructure = this.columnFilter?.customStructure;
    const columnType = this.columnFilter?.type ?? this.columnDef?.type;
    if (!customStructure && (columnType === FieldType.object && this.columnDef?.dataKey && this.columnDef?.labelKey)) {
      customStructure = {
        label: this.columnDef.labelKey,
        value: this.columnDef.dataKey,
      };
    }
    return customStructure;
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return OperatorType.equal;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  /** Kraaden AutoComplete instance */
  get instance(): any {
    return this._instance;
  }

  /** Getter of the Operator to use when doing the filter comparing */
  get operator(): OperatorType | OperatorString {
    return this.columnFilter?.operator ?? this.defaultOperator;
  }

  /** Setter for the filter operator */
  set operator(operator: OperatorType | OperatorString) {
    if (this.columnFilter) {
      this.columnFilter.operator = operator;
    }
  }

  /**
   * Initialize the filter template
   */
  init(args: FilterArguments): Promise<any[] | undefined> {
    if (!args) {
      throw new Error('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
    }
    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];
    this.filterContainerElm = args.filterContainerElm;

    if (!this.grid || !this.columnDef || !this.columnFilter || (!this.columnFilter.collection && !this.columnFilter.collectionAsync && !this.columnFilter.filterOptions)) {
      throw new Error(
        `[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") for the AutoComplete Filter to work correctly.` +
        ` Also each option should include a value/label pair (or value/labelKey when using Locale).` +
        ` For example:: { filter: model: Filters.autocompleter, collection: [{ value: true, label: 'True' }, { value: false, label: 'False'}] }`
      );
    }

    this.enableTranslateLabel = this.columnFilter?.enableTranslateLabel ?? false;
    this.labelName = this.customStructure?.label ?? 'label';
    this.valueName = this.customStructure?.value ?? 'value';
    this.labelPrefixName = this.customStructure?.labelPrefix ?? 'labelPrefix';
    this.labelSuffixName = this.customStructure?.labelSuffix ?? 'labelSuffix';

    // get locales provided by user in main file or else use default English locales via the Constants
    this._locales = this.gridOptions?.locales ?? Constants.locales;

    // always render the DOM element
    const newCollection = this.columnFilter.collection;
    this._collection = newCollection;
    this.renderDomElement(newCollection);

    return new Promise(async (resolve, reject) => {
      try {
        const collectionAsync = this.columnFilter.collectionAsync;
        let collectionOutput: Promise<any[]> | any[] | undefined;

        if (collectionAsync && !this.columnFilter.collection) {
          // only read the collectionAsync once (on the 1st load),
          // we do this because Http Fetch will throw an error saying body was already read and is streaming is locked
          collectionOutput = renderCollectionOptionsAsync(collectionAsync, this.columnDef, this.renderDomElement.bind(this), this.rxjs, this.subscriptions);
          resolve(collectionOutput);
        } else {
          collectionOutput = newCollection;
          resolve(newCollection);
        }

        // subscribe to both CollectionObserver and PropertyObserver
        // any collection changes will trigger a re-render of the DOM element filter
        if (collectionAsync || this.columnFilter.enableCollectionWatch) {
          await (collectionOutput ?? collectionAsync);
          this.watchCollectionChanges();
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true): void {
    if (this._filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._filterElm.value = '';
      this._filterElm.dispatchEvent(new CustomEvent('input'));
      this.updateFilterStyle(false);
    }
  }

  /**
   * destroy the filter
   */
  destroy(): void {
    if (typeof this._instance?.destroy === 'function') {
      this._instance.destroy();
    }
    if (this._filterElm) {
      // this._filterElm.autocomplete('destroy');
      // this._filterElm.off('input').remove();
    }
    this._filterElm?.remove?.();
    this._collection = undefined;
    this._bindEventService.unbindAll();

    // unsubscribe all the possible Observables if RxJS was used
    unsubscribeAll(this.subscriptions);
  }

  getValues(): string {
    return this._filterElm?.value || '';
  }

  /** Set value(s) on the DOM element  */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString, triggerChange = false): void {
    if (values && this._filterElm) {
      this._filterElm.value = values as string;
    }

    // add/remove "filled" class name
    this.updateFilterStyle(this.getValues() !== '');

    // set the operator when defined
    this.operator = operator || this.defaultOperator;

    if (triggerChange) {
      this.callback(undefined, { columnDef: this.columnDef, operator: this.operator, searchTerms: [this.getValues()], shouldTriggerQuery: true });
    }
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
      const filterCollectionBy = this.columnFilter.collectionOptions && this.columnFilter.collectionOptions.filterResultAfterEachPass || null;
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
  protected watchCollectionChanges(): void {
    if (this.columnFilter?.collection) {
      // subscribe to the "collection" changes (array `push`, `unshift`, `splice`, ...)
      collectionObserver(this.columnFilter.collection, (updatedArray) => {
        this.renderDomElement(this.columnFilter.collection || updatedArray || []);
      });

      // observe for any "collection" changes (array replace)
      // then simply recreate/re-render the Select (dropdown) DOM Element
      propertyObserver(this.columnFilter, 'collection', (newValue) => {
        this.renderDomElement(newValue || []);

        // when new assignment arrives, we need to also reassign observer to the new reference
        if (this.columnFilter.collection) {
          collectionObserver(this.columnFilter.collection, (updatedArray) => {
            this.renderDomElement(this.columnFilter.collection || updatedArray || []);
          });
        }
      });
    }
  }

  renderDomElement(collection?: any[]): void {
    if (!Array.isArray(collection) && this.collectionOptions?.collectionInsideObjectProperty) {
      const collectionInsideObjectProperty = this.collectionOptions.collectionInsideObjectProperty;
      collection = getDescendantProperty(collection, collectionInsideObjectProperty || '');
    }
    // if (!Array.isArray(collection)) {
    //   throw new Error('The "collection" passed to the Autocomplete Filter is not a valid array.');
    // }

    // assign the collection to a temp variable before filtering/sorting the collection
    let newCollection = collection;

    // user might want to filter and/or sort certain items of the collection
    if (newCollection) {
      newCollection = this.filterCollection(newCollection);
      newCollection = this.sortCollection(newCollection);
    }

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';

    // step 1, create the DOM Element of the filter & pre-load search term
    // also subscribe to the onSelect event
    this._collection = newCollection;
    this._filterElm = this.createFilterElement(newCollection, searchTerm);

    // step 3, subscribe to the input change event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this._bindEventService.bind(this._filterElm, 'input', this.handleOnInputChange.bind(this) as EventListener);
    this._bindEventService.bind(this._filterElm, 'blur', () => {
      if (!this.isItemSelected) {
        this.clear();
      }
    });
  }

  /**
   * Create the autocomplete filter DOM element
   * @param collection
   * @param searchTerm
   * @returns
   */
  protected createFilterElement(collection?: any[], searchTerm?: SearchTerm): HTMLInputElement {
    this._collection = collection;
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this.filterContainerElm);

    // create the DOM element & add an ID and filter class
    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    this._filterElm = createDomElement('input', {
      type: 'text',
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      autocomplete: 'off', ariaAutoComplete: 'none',
      placeholder,
      className: `form-control search-filter filter-${columnId} slick-autocomplete-container`,
      value: (searchTerm ?? '') as string,
      dataset: { columnid: `${columnId}` }
    });

    // create the DOM element & add an ID and filter class
    const searchTermInput = searchTerm as string;

    // the kradeen autocomplete lib only works with label/value pair, make sure that our array is in accordance
    if (Array.isArray(collection)) {
      if (collection.every(x => isPrimitiveValue(x))) {
        // when detecting an array of primitives, we have to remap it to an array of value/pair objects
        collection = collection.map(c => ({ label: c, value: c }));
      } else {
        // user might provide its own custom structures, if so remap them as the new label/value pair
        collection = collection.map((item) => ({
          label: item?.[this.labelName],
          value: item?.[this.valueName],
          labelPrefix: item?.[this.labelPrefixName] ?? '',
          labelSuffix: item?.[this.labelSuffixName] ?? ''
        }));
      }
    }

    // user might pass his own autocomplete options
    this._autocompleterOptions = {
      input: this._filterElm,
      debounceWaitMs: 200,
      className: `slick-autocomplete ${this.filterOptions?.className ?? ''}`.trim(),
      emptyMsg: this.gridOptions.enableTranslate && this.translaterService?.translate ? this.translaterService.translate('NO_ELEMENTS_FOUND') : this._locales?.TEXT_NO_ELEMENTS_FOUND ?? 'No elements found',
      customize: (_input, _inputRect, container) => {
        container.style.width = ''; // unset width that was set internally by the Autopleter lib
      },
      onSelect: (item: AutocompleteSearchItem) => {
        this.isItemSelected = true;
        this.handleSelect(item);
      },
      ...this.filterOptions,
    } as Partial<AutocompleteSettings<any>>;

    // add dark mode CSS class when enabled
    if (this.gridOptions?.darkMode) {
      this._autocompleterOptions.className += ' slick-dark-mode';
    }
    this.autocompleterOptions.className = classNameToList(this.autocompleterOptions.className).join(' ');

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

    // when user passes it's own autocomplete "fetch" method
    // we still need to provide our own "onSelect" callback implementation
    if (this.filterOptions?.fetch) {
      // add loading class by overriding user's fetch method
      addAutocompleteLoadingByOverridingFetch(this._filterElm, this._autocompleterOptions);

      // create the Kraaden AutoComplete
      this._instance = autocompleter(this._autocompleterOptions as AutocompleteSettings<any>);
    } else {
      this._instance = autocompleter({
        ...this._autocompleterOptions,
        fetch: (searchText, updateCallback) => {
          if (collection) {
            // you can also use AJAX requests instead of preloaded data
            // also at this point our collection was already modified, by the previous map, to have the "label" property (unless it's a string)
            updateCallback(collection.filter(c => {
              const label = (typeof c === 'string' ? c : c?.label) || '';
              return label.toLowerCase().includes(searchText.toLowerCase());
            }));
          }
        }
      } as AutocompleteSettings<any>);
    }

    this._filterElm.value = searchTermInput ?? '';

    // append the new DOM element to the header row
    const filterDivContainerElm = createDomElement('div', { className: 'autocomplete-filter-container' });
    filterDivContainerElm.appendChild(this._filterElm);

    // add an empty <span> in order to add loading spinner styling
    filterDivContainerElm.appendChild(createDomElement('span'));

    // if there's a search term, we will add the "filled" class for styling purposes
    if (searchTerm) {
      this._filterElm.classList.add('filled');
    }

    // append the new DOM element to the header row & an empty span
    this.filterContainerElm.appendChild(filterDivContainerElm);
    this.filterContainerElm.appendChild(document.createElement('span'));

    return this._filterElm;
  }

  //
  // protected functions
  // ------------------

  // this function should be PRIVATE but for unit tests purposes we'll make it public until a better solution is found
  // a better solution would be to get the autocomplete DOM element to work with selection but I couldn't find how to do that in Jest
  handleSelect(item: AutocompleteSearchItem): void | boolean {
    if (item !== undefined) {
      const event = undefined; // TODO do we need the event?

      // when the user defines a "renderItem" (or "_renderItem") template, then we assume the user defines his own custom structure of label/value pair
      // otherwise we know that the autocomplete lib always require a label/value pair, we can pull them directly
      const hasCustomRenderItemCallback = this.filterOptions?.renderItem ?? false;

      const itemLabel = typeof item === 'string' ? item : (hasCustomRenderItemCallback ? item[this.labelName] : item.label);
      let itemValue = typeof item === 'string' ? item : (hasCustomRenderItemCallback ? item[this.valueName] : item.value);

      // trim whitespaces when option is enabled globally or on the filter itself
      itemValue = this.trimWhitespaceWhenEnabled(itemValue);

      // add/remove "filled" class name
      this.updateFilterStyle(itemValue !== '');

      this.setValues(itemLabel);
      this.callback(event, { columnDef: this.columnDef, operator: this.operator, searchTerms: [itemValue], shouldTriggerQuery: this._shouldTriggerQuery });

      // reset both flags for next use
      this._clearFilterTriggered = false;
      this._shouldTriggerQuery = true;
    }
    return false;
  }

  protected handleOnInputChange(e: DOMEvent<HTMLInputElement>): void {
    let value = e?.target?.value ?? '';
    const shouldTriggerOnEveryKeyStroke = this.filterOptions.triggerOnEveryKeyStroke ?? false;

    // trim whitespaces when option is enabled globally or on the filter itself
    value = this.trimWhitespaceWhenEnabled(value);

    if (this._clearFilterTriggered || value === '' || shouldTriggerOnEveryKeyStroke) {
      const callbackArgs: FilterCallbackArg = { columnDef: this.columnDef, shouldTriggerQuery: this._shouldTriggerQuery };
      if (this._clearFilterTriggered) {
        callbackArgs.clearFilterTriggered = this._clearFilterTriggered;
      } else {
        callbackArgs.operator = this.operator;
        callbackArgs.searchTerms = [value];
      }

      this.updateFilterStyle(value !== '');
      this.callback(e, callbackArgs);
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }

  protected renderRegularItem(item: T): HTMLDivElement {
    const itemLabel = (typeof item === 'string' ? item : item?.label ?? '') as string;
    return createDomElement('div', {
      textContent: itemLabel || ''
    });
  }

  protected renderCustomItem(item: T): HTMLDivElement {
    const templateString = this._autocompleterOptions?.renderItem?.templateCallback(item) ?? '';

    // sanitize any unauthorized html tags like script and others
    const tmpElm = document.createElement('div');
    this.grid.applyHtmlCode(tmpElm, templateString);
    return tmpElm;
  }

  protected renderCollectionItem(item: any): HTMLDivElement {
    const isRenderHtmlEnabled = this.columnFilter?.enableRenderHtml ?? false;
    const prefixText = item.labelPrefix || '';
    const labelText = item.label || '';
    const suffixText = item.labelSuffix || '';
    const finalText = prefixText + labelText + suffixText;

    // sanitize any unauthorized html tags like script and others
    // for the remaining allowed tags we'll permit all attributes
    const sanitizedText = this.grid.sanitizeHtmlString<string>(finalText) || '';

    const div = document.createElement('div');
    div[isRenderHtmlEnabled ? 'innerHTML' : 'textContent'] = sanitizedText;
    return div;
  }

  /**
   * Trim whitespaces when option is enabled globally or on the filter itself
   * @param value - value found which could be a string or an object
   * @returns - trimmed value when it is a string and the feature is enabled
   */
  protected trimWhitespaceWhenEnabled(value: any): any {
    let outputValue = value;
    const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
    if (typeof value === 'string' && enableWhiteSpaceTrim) {
      outputValue = value.trim();
    }
    return outputValue;
  }

  /** add/remove "filled" CSS class */
  protected updateFilterStyle(isFilled: boolean): void {
    this.isItemSelected = isFilled;
    if (isFilled) {
      this._filterElm.classList.add('filled');
    } else {
      this._filterElm.classList.remove('filled');
    }
  }
}