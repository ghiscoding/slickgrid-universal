import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, emptyElement, isDefined, toSentenceCase } from '@slickgrid-universal/utils';
import { type SlickGrid } from '../core/index.js';
import { OperatorType, type OperatorString, type SearchTerm } from '../enums/index.js';
import type { Column, ColumnFilter, Filter, FilterArguments, FilterCallback, GridOption, OperatorDetail } from '../interfaces/index.js';
import { mapOperatorToShorthandDesignation, type TranslaterService } from '../services/index.js';
import { applyOperatorAltTextWhenExists, buildSelectOperator, compoundOperatorNumeric, compoundOperatorString } from './filterUtilities.js';

export class InputFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _currentValue?: number | string;
  protected _debounceTypingDelay = 0;
  protected _shouldTriggerQuery = true;
  protected _inputType = 'text';
  protected _timer?: any;
  protected _cellContainerElm!: HTMLElement;
  protected _filterContainerElm!: HTMLElement;
  protected _filterInputElm!: HTMLInputElement;
  protected _lastSearchValue?: number | string;
  protected _selectOperatorElm?: HTMLSelectElement;
  inputFilterType: 'single' | 'compound' = 'single';
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;

  constructor(protected readonly translaterService?: TranslaterService | undefined) {
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
  get inputType(): string {
    return this._inputType;
  }

  /** Setter of input type (text, number, password) */
  set inputType(type: string) {
    this._inputType = type;
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType | OperatorString {
    return this.columnFilter?.operator ?? this.defaultOperator;
  }

  /** Setter for the Filter Operator */
  set operator(operator: OperatorType | OperatorString) {
    if (this.columnFilter) {
      this.columnFilter.operator = operator;
    }
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  get isCompoundFilter(): boolean {
    return this.inputFilterType === 'compound';
  }

  /**
   * Initialize the Filter
   */
  init(args: FilterArguments): void {
    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    if (this.isCompoundFilter) {
      this.operator = args.operator || '';
    }
    this.searchTerms = args?.searchTerms ?? [];
    this._cellContainerElm = args.filterContainerElm;

    // analyze if we have any keyboard debounce delay (do we wait for user to finish typing before querying)
    // it is used by default for a backend service but is optional when using local dataset
    const backendApi = this.gridOptions?.backendServiceApi;
    this._debounceTypingDelay =
      (backendApi
        ? (backendApi?.filterTypingDebounce ?? this.gridOptions?.defaultBackendServiceFilterTypingDebounce)
        : this.gridOptions?.filterTypingDebounce) ?? 0;

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = Array.isArray(this.searchTerms) && this.searchTerms.length >= 0 ? this.searchTerms[0] : '';

    // when we're using an input filter and we have an empty search value,
    // we probably want this value to be a valid filter option that will ONLY return value that are empty (not everything like its default behavior)
    // user can still override it by defining it
    this.columnDef.filter ??= {};
    this.columnDef.filter.emptySearchTermReturnAllValues ??= false;

    // step 1, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.createDomFilterElement(searchTerm);

    // step 2, subscribe to the input event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    // we'll use all necessary events to cover the following (keyup, change, mousewheel & spinner)
    this._bindEventService.bind(this._filterInputElm, ['keyup', 'blur', 'change'], this.onTriggerEvent.bind(this) as EventListener);
    this._bindEventService.bind(this._filterInputElm, 'wheel', this.onTriggerEvent.bind(this) as EventListener, {
      passive: true,
    });
    if (this.isCompoundFilter && this._selectOperatorElm) {
      this._bindEventService.bind(this._selectOperatorElm, 'change', this.onTriggerEvent.bind(this) as EventListener);
    }
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true): void {
    if (this._filterInputElm) {
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._filterInputElm.value = '';
      this._currentValue = undefined;
      this.updateFilterStyle(false);
      if (this.isCompoundFilter && this._selectOperatorElm) {
        this._selectOperatorElm.selectedIndex = 0;
      }
      this.onTriggerEvent(undefined, true);
    }
  }

  /**
   * destroy the filter
   */
  destroy(): void {
    this._bindEventService.unbindAll();
    this._selectOperatorElm?.remove?.();
    this._filterInputElm?.remove?.();
  }

  getValues(): string {
    return this._filterInputElm.value;
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString, triggerChange = false): void {
    const searchValues = Array.isArray(values) ? values : [values];
    let newInputValue: SearchTerm = '';
    for (const value of searchValues) {
      if (!this.isCompoundFilter) {
        newInputValue = operator ? this.addOptionalOperatorIntoSearchString(value, operator) : value;
      } else {
        newInputValue = `${value}`;
      }
      this._filterInputElm.value = `${newInputValue ?? ''}`;
      this._currentValue = this._filterInputElm.value;
    }

    // update "filled" CSS class
    this.updateFilterStyle(this.getValues() !== '');

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
    if (operator && this._selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this._selectOperatorElm.value = operatorShorthand;
    }

    if (triggerChange) {
      this.onTriggerEvent(undefined, false);
    }
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

    if (operator) {
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
        case 'EQ':
          searchTermPrefix = '=';
          break;
        case 'GE':
          searchTermPrefix = '>=';
          break;
        case 'GT':
          searchTermPrefix = '>';
          break;
        case 'NE':
          searchTermPrefix = '!=';
          break;
        case 'LE':
          searchTermPrefix = '<=';
          break;
        case 'LT':
          searchTermPrefix = '<';
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
      outputValue = `${searchTermPrefix}${this.trimValueWhenEnabled(outputValue)}${searchTermSuffix}`;
    }

    return outputValue;
  }

  /** Get the available operator option values to populate the operator select dropdown list */
  protected getCompoundOperatorOptionValues(): OperatorDetail[] {
    const type = this.columnDef.type ? this.columnDef.type : 'string';
    let operatorList: OperatorDetail[];
    let listType: 'text' | 'numeric' = 'text';

    if (this.columnFilter?.compoundOperatorList) {
      operatorList = this.columnFilter.compoundOperatorList;
    } else {
      switch (type) {
        case 'string':
        case 'text':
        case 'readonly':
        case 'password':
          listType = 'text';
          operatorList = compoundOperatorString(this.gridOptions, this.translaterService);
          break;
        default:
          listType = 'numeric';
          operatorList = compoundOperatorNumeric(this.gridOptions, this.translaterService);
          break;
      }
    }

    // add alternate texts when provided
    applyOperatorAltTextWhenExists(this.gridOptions, operatorList, listType);

    return operatorList;
  }

  /**
   * From the html template string, create a DOM element
   * @param {Object} searchTerm - filter search term
   * @returns {Object} DOM element filter
   */
  protected createDomFilterElement(searchTerm?: SearchTerm): void {
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this._cellContainerElm);

    // create the DOM element & add an ID and filter class
    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    let searchVal = `${searchTerm ?? ''}`;
    if (!this.isCompoundFilter) {
      searchVal = this.addOptionalOperatorIntoSearchString(searchVal, this.operator);
    }
    this._filterInputElm = createDomElement('input', {
      type: this._inputType || 'text',
      autocomplete: 'off',
      ariaAutoComplete: 'none',
      placeholder,
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      className: `form-control filter-${columnId}`,
      value: searchVal,
      dataset: { columnid: `${columnId}` },
    });

    // if there's a search term, we will add the "filled" class for styling purposes
    this.updateFilterStyle(!!searchTerm);
    if (searchTerm !== undefined) {
      this._currentValue = searchVal;
    }

    // create the DOM Select dropdown for the Operator
    if (!this.isCompoundFilter) {
      this._filterContainerElm = this._filterInputElm;
      // append the new DOM element to the header row & an empty span
      this._filterInputElm.classList.add('search-filter', 'slick-filter');
      this._cellContainerElm.appendChild(this._filterInputElm);
      this._cellContainerElm.appendChild(document.createElement('span'));
    } else {
      // compound filter
      this._filterInputElm.classList.add('compound-input');
      this._selectOperatorElm = buildSelectOperator(this.getCompoundOperatorOptionValues(), this.grid);
      this._filterContainerElm = createDomElement('div', { className: `form-group search-filter slick-filter filter-${columnId}` });
      const containerInputGroupElm = createDomElement('div', { className: 'input-group' }, this._filterContainerElm);
      const operatorInputGroupAddonElm = createDomElement(
        'div',
        { className: 'input-group-addon input-group-prepend operator' },
        containerInputGroupElm
      );

      // append operator & input DOM element
      operatorInputGroupAddonElm.appendChild(this._selectOperatorElm);
      containerInputGroupElm.appendChild(this._filterInputElm);
      containerInputGroupElm.appendChild(createDomElement('span'));

      if (this.operator) {
        this._selectOperatorElm.value = mapOperatorToShorthandDesignation(this.operator);
      }

      // append the new DOM element to the header row
      if (this._filterContainerElm) {
        this._cellContainerElm.appendChild(this._filterContainerElm);
      }
    }
  }

  protected trimValueWhenEnabled(val: string): string {
    const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
    if (typeof val === 'string' && enableWhiteSpaceTrim) {
      return val.trim();
    }
    return val;
  }

  /**
   * Event handler to cover the following (keyup, change, mousewheel & spinner)
   * We will trigger the Filter Service callback from this handler
   */
  protected onTriggerEvent(event?: MouseEvent | KeyboardEvent, isClearFilterEvent = false): void {
    if (isClearFilterEvent) {
      this.callback(event, {
        columnDef: this.columnDef,
        clearFilterTriggered: isClearFilterEvent,
        shouldTriggerQuery: this._shouldTriggerQuery,
      });
      this.updateFilterStyle(false);
    } else {
      const eventType = event?.type || '';
      // pull operator from compound or re-evaluate on each keystroke
      const selectedOperator = (this._selectOperatorElm?.value ?? (!this.isCompoundFilter ? '' : this.operator)) as OperatorString;
      const value = this.trimValueWhenEnabled(this._filterInputElm.value);
      if ((event?.target as HTMLElement)?.tagName.toLowerCase() !== 'select') {
        this._currentValue = value;
      }

      this.updateFilterStyle(value !== '');
      const callbackArgs = {
        columnDef: this.columnDef,
        operator: selectedOperator,
        searchTerms: value ? [value] : null,
        shouldTriggerQuery: this._shouldTriggerQuery,
      };
      const typingDelay = eventType === 'keyup' && (event as KeyboardEvent)?.key !== 'Enter' ? this._debounceTypingDelay : 0;

      const skipNullInput =
        this.columnFilter.skipCompoundOperatorFilterWithNullInput ??
        this.gridOptions.skipCompoundOperatorFilterWithNullInput ??
        this.gridOptions.skipCompoundOperatorFilterWithNullInput === undefined;
      const hasSkipNullValChanged =
        (skipNullInput && isDefined(this._currentValue)) || (this._currentValue === '' && isDefined(this._lastSearchValue));

      if (!this.isCompoundFilter || !skipNullInput || hasSkipNullValChanged) {
        if (typingDelay > 0) {
          clearTimeout(this._timer);
          this._timer = setTimeout(() => this.callback(event, callbackArgs), typingDelay);
        } else {
          this.callback(event, callbackArgs);
        }
      }
      this._lastSearchValue = value;
    }

    // reset both flags for next use
    this._shouldTriggerQuery = true;
  }

  /** add/remove "filled" CSS class */
  protected updateFilterStyle(isFilled: boolean): void {
    this._filterContainerElm?.classList.toggle('filled', isFilled);
    this._filterInputElm.classList.toggle('filled', isFilled);
  }
}
