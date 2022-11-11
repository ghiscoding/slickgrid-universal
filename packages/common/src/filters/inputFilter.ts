import { toSentenceCase } from '@slickgrid-universal/utils';

import {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  SlickGrid,
} from '../interfaces/index';
import { OperatorType, OperatorString, SearchTerm } from '../enums/index';
import { BindingEventService } from '../services/bindingEvent.service';
import { createDomElement, emptyElement, } from '../services';

export class InputFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _debounceTypingDelay = 0;
  protected _shouldTriggerQuery = true;
  protected _inputType = 'text';
  protected _timer?: NodeJS.Timeout;
  protected _filterInputElm!: HTMLInputElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  filterContainerElm!: HTMLDivElement;

  constructor() {
    this._bindEventService = new BindingEventService();
  }

  /** Getter for the Column Filter */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return OperatorType.empty;
  }

  /** Getter of input type (text, number, password) */
  get inputType() {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
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

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return this.grid?.getOptions?.() ?? {};
  }

  /**
   * Initialize the Filter
   */
  init(args: FilterArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
    }
    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];
    this.filterContainerElm = args.filterContainerElm;

    // analyze if we have any keyboard debounce delay (do we wait for user to finish typing before querying)
    // it is used by default for a backend service but is optional when using local dataset
    const backendApi = this.gridOptions?.backendServiceApi;
    this._debounceTypingDelay = (backendApi ? (backendApi?.filterTypingDebounce ?? this.gridOptions?.defaultBackendServiceFilterTypingDebounce) : this.gridOptions?.filterTypingDebounce) ?? 0;

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';

    // step 1, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.createDomFilterElement(searchTerm);

    // step 2, subscribe to the input event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    // we'll use all necessary events to cover the following (keyup, change, mousewheel & spinner)
    this._bindEventService.bind(this._filterInputElm, ['keyup', 'blur', 'change', 'wheel'], this.onTriggerEvent.bind(this) as EventListener);
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this._filterInputElm) {
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._filterInputElm.value = '';
      this._filterInputElm.classList.remove('filled');
      this.onTriggerEvent(undefined, true);
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();
    this._filterInputElm?.remove?.();
  }

  getValues(): string {
    return this._filterInputElm.value;
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    const searchValues = Array.isArray(values) ? values : [values];
    let searchValue: SearchTerm = '';
    for (const value of searchValues) {
      searchValue = operator ? this.addOptionalOperatorIntoSearchString(value, operator) : value;
      this._filterInputElm.value = `${searchValue ?? ''}`;
    }
    this.getValues() !== '' ? this._filterInputElm.classList.add('filled') : this._filterInputElm.classList.remove('filled');

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  //
  // protected functions
  // ------------------

  /**
   * When loading the search string from the outside into the input text field, we should also add the prefix/suffix of the operator.
   * We do this so that if it was loaded by a Grid Presets then we should also add the operator into the search string
   * Let's take these 3 examples:
   * 1. (operator: '>=', searchTerms:[55]) should display as ">=55"
   * 2. (operator: 'StartsWith', searchTerms:['John']) should display as "John*"
   * 3. (operator: 'EndsWith', searchTerms:['John']) should display as "*John"
   * @param operator - operator string
   */
  protected addOptionalOperatorIntoSearchString(inputValue: SearchTerm, operator: OperatorType | OperatorString): string {
    let searchTermPrefix = '';
    let searchTermSuffix = '';
    let outputValue = inputValue === undefined || inputValue === null ? '' : `${inputValue}`;

    if (operator && outputValue) {
      switch (operator) {
        case '<>':
        case '!=':
        case '=':
        case '==':
        case '>':
        case '>=':
        case '<':
        case '<=':
          searchTermPrefix = operator;
          break;
        case 'EndsWith':
        case '*z':
          searchTermPrefix = '*';
          break;
        case 'StartsWith':
        case 'a*':
          searchTermSuffix = '*';
          break;
      }
      outputValue = `${searchTermPrefix}${outputValue}${searchTermSuffix}`;
    }

    return outputValue;
  }

  /**
   * From the html template string, create a DOM element
   * @param {Object} searchTerm - filter search term
   * @returns {Object} DOM element filter
   */
  protected createDomFilterElement(searchTerm?: SearchTerm) {
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this.filterContainerElm);

    // create the DOM element & add an ID and filter class
    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    this._filterInputElm = createDomElement('input', {
      type: this._inputType || 'text',
      autocomplete: 'none', placeholder,
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      className: `form-control search-filter filter-${columnId}`,
      value: `${searchTerm ?? ''}`,
      dataset: { columnid: `${columnId}` }
    });


    // if there's a search term, we will add the "filled" class for styling purposes
    if (searchTerm) {
      this._filterInputElm.classList.add('filled');
    }

    // append the new DOM element to the header row & an empty span
    this.filterContainerElm.appendChild(this._filterInputElm);
    this.filterContainerElm.appendChild(document.createElement('span'));

    return this._filterInputElm;
  }

  /**
   * Event handler to cover the following (keyup, change, mousewheel & spinner)
   * We will trigger the Filter Service callback from this handler
   */
  protected onTriggerEvent(event?: MouseEvent | KeyboardEvent, isClearFilterEvent = false) {
    if (isClearFilterEvent) {
      this.callback(event, { columnDef: this.columnDef, clearFilterTriggered: isClearFilterEvent, shouldTriggerQuery: this._shouldTriggerQuery });
      this._filterInputElm.classList.remove('filled');
    } else {
      const eventType = event?.type ?? '';
      let value = (event?.target as HTMLInputElement)?.value ?? '';
      const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
      if (typeof value === 'string' && enableWhiteSpaceTrim) {
        value = value.trim();
      }
      value === '' ? this._filterInputElm.classList.remove('filled') : this._filterInputElm.classList.add('filled');
      const callbackArgs = { columnDef: this.columnDef, operator: this.operator, searchTerms: [value], shouldTriggerQuery: this._shouldTriggerQuery };
      const typingDelay = (eventType === 'keyup' && (event as KeyboardEvent)?.key !== 'Enter') ? this._debounceTypingDelay : 0;

      if (typingDelay > 0) {
        clearTimeout(this._timer as NodeJS.Timeout);
        this._timer = setTimeout(() => this.callback(event, callbackArgs), typingDelay);
      } else {
        this.callback(event, callbackArgs);
      }
    }

    // reset both flags for next use
    this._shouldTriggerQuery = true;
  }
}
