import { toSentenceCase } from '@slickgrid-universal/utils';

import { FieldType, OperatorString, OperatorType, SearchTerm, } from '../enums/index';
import {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  OperatorDetail,
  SlickGrid,
} from '../interfaces/index';
import { buildSelectOperator, compoundOperatorNumeric, compoundOperatorString } from './filterUtilities';
import { createDomElement, emptyElement } from '../services/domUtilities';
import { mapOperatorToShorthandDesignation } from '../services/utilities';
import { BindingEventService } from '../services/bindingEvent.service';
import { TranslaterService } from '../services/translater.service';

export class CompoundInputFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _currentValue?: number | string;
  protected _debounceTypingDelay = 0;
  protected _shouldTriggerQuery = true;
  protected _inputType = 'text';
  protected _timer?: NodeJS.Timeout;
  protected _filterElm!: HTMLDivElement;
  protected _filterInputElm!: HTMLInputElement;
  protected _selectOperatorElm!: HTMLSelectElement;
  protected _operator?: OperatorType | OperatorString;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  filterContainerElm!: HTMLDivElement;

  constructor(protected readonly translaterService: TranslaterService) {
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
    return this._operator || this.defaultOperator;
  }

  /** Setter of the Operator to use when doing the filter comparing */
  set operator(op: OperatorType | OperatorString) {
    this._operator = op;
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
    this.operator = args.operator as OperatorString;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];
    this.filterContainerElm = args.filterContainerElm;

    // analyze if we have any keyboard debounce delay (do we wait for user to finish typing before querying)
    // it is used by default for a backend service but is optional when using local dataset
    const backendApi = this.gridOptions?.backendServiceApi;
    this._debounceTypingDelay = (backendApi ? (backendApi?.filterTypingDebounce ?? this.gridOptions?.defaultBackendServiceFilterTypingDebounce) : this.gridOptions?.filterTypingDebounce) ?? 0;

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';

    // step 1, create the DOM Element of the filter which contain the compound Operator+Input
    // and initialize it if searchTerm is filled
    this._filterElm = this.createDomFilterElement(searchTerm);

    // step 3, subscribe to the keyup event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    // we'll use all necessary events to cover the following (keyup, change, mousewheel & spinner)
    this._bindEventService.bind(this._filterInputElm, ['keyup', 'blur', 'change', 'wheel'], this.onTriggerEvent.bind(this) as EventListener);
    this._bindEventService.bind(this._selectOperatorElm, 'change', this.onTriggerEvent.bind(this) as EventListener);
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this._filterElm && this._selectOperatorElm) {
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._filterInputElm.value = '';
      this._selectOperatorElm.selectedIndex = 0;
      this._currentValue = undefined;
      this._filterElm.classList.remove('filled');
      this._filterInputElm.classList.remove('filled');
      this.onTriggerEvent(undefined, true);
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();
    this._selectOperatorElm?.remove?.();
    this._filterElm?.remove?.();
  }

  getValues() {
    return this._filterInputElm.value;
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm[] | SearchTerm, operator?: OperatorType | OperatorString) {
    let newInputValue = '';
    if (values) {
      const newValue = Array.isArray(values) ? values[0] : values;
      newInputValue = `${newValue ?? ''}`;
    }
    this._filterInputElm.value = newInputValue;
    this._currentValue = newInputValue;

    if (this.getValues() !== '') {
      this._filterElm.classList.add('filled');
      this._filterInputElm.classList.add('filled');
    } else {
      this._filterElm.classList.remove('filled');
      this._filterInputElm.classList.remove('filled');
    }

    // set the operator, in the DOM as well, when defined
    this.operator = operator || this.defaultOperator;
    if (operator && this._selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this._selectOperatorElm.value = operatorShorthand;
    }
  }

  //
  // protected functions
  // ------------------

  protected buildInputElement(searchTerm?: SearchTerm): HTMLInputElement {
    const columnId = this.columnDef?.id ?? '';

    // create the DOM element & add an ID and filter class
    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    const searchVal = `${searchTerm ?? ''}`;
    const inputElm = createDomElement('input', {
      type: this._inputType || 'text',
      autocomplete: 'none', placeholder,
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      className: `form-control compound-input filter-${columnId}`,
      value: searchVal,
      dataset: { columnid: `${columnId}` }
    });

    if (searchTerm !== undefined) {
      this._currentValue = searchVal;
    }

    return inputElm;
  }

  /** Get the available operator option values to populate the operator select dropdown list */
  protected getOperatorOptionValues(): OperatorDetail[] {
    const type = (this.columnDef.type && this.columnDef.type) ? this.columnDef.type : FieldType.string;
    let optionValues = [];

    if (this.columnFilter?.compoundOperatorList) {
      return this.columnFilter.compoundOperatorList;
    } else {
      switch (type) {
        case FieldType.string:
        case FieldType.text:
        case FieldType.readonly:
        case FieldType.password:
          optionValues = compoundOperatorString(this.gridOptions, this.translaterService);
          break;
        default:
          optionValues = compoundOperatorNumeric(this.gridOptions, this.translaterService);
          break;
      }
    }

    return optionValues;
  }

  /**
   * Create the DOM element
   */
  protected createDomFilterElement(searchTerm?: SearchTerm) {
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this.filterContainerElm);

    // create the DOM Select dropdown for the Operator
    this._selectOperatorElm = buildSelectOperator(this.getOperatorOptionValues(), this.gridOptions);
    this._filterInputElm = this.buildInputElement(searchTerm);
    const emptySpanElm = createDomElement('span');

    const filterContainerElm = createDomElement('div', { className: `form-group search-filter filter-${columnId}` });
    const containerInputGroupElm = createDomElement('div', { className: 'input-group' });
    const operatorInputGroupAddonElm = createDomElement('div', { className: 'input-group-addon input-group-prepend operator' });

    // append operator & input DOM element
    operatorInputGroupAddonElm.appendChild(this._selectOperatorElm);
    containerInputGroupElm.appendChild(operatorInputGroupAddonElm);
    containerInputGroupElm.appendChild(this._filterInputElm);
    containerInputGroupElm.appendChild(emptySpanElm);

    // create the DOM element & add an ID and filter class
    filterContainerElm.appendChild(containerInputGroupElm);

    if (this.operator) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this._selectOperatorElm.value = operatorShorthand;
    }

    // if there's a search term, we will add the "filled" class for styling purposes
    if (searchTerm) {
      this._filterInputElm.classList.add('filled');
    }

    // append the new DOM element to the header row
    if (filterContainerElm) {
      this.filterContainerElm.appendChild(filterContainerElm);
    }

    return filterContainerElm;
  }

  /**
   * Event trigger, could be called by the Operator dropdown or the input itself and we will cover the following (keyup, change, mousewheel & spinner)
   * We will trigger the Filter Service callback from this handler
   */
  protected onTriggerEvent(event: MouseEvent | KeyboardEvent | undefined, isClearFilterEvent = false) {
    if (isClearFilterEvent) {
      this.callback(event, { columnDef: this.columnDef, clearFilterTriggered: isClearFilterEvent, shouldTriggerQuery: this._shouldTriggerQuery });
      this._filterElm.classList.remove('filled');
    } else {
      const eventType = event?.type ?? '';
      const selectedOperator = this._selectOperatorElm.value as OperatorString;
      let value = this._filterInputElm.value as string;
      const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
      if (typeof value === 'string' && enableWhiteSpaceTrim) {
        value = value.trim();
      }

      // only update ref when the value from the input
      if ((event?.target as HTMLElement)?.tagName.toLowerCase() !== 'select') {
        this._currentValue = value;
      }

      (value !== null && value !== undefined && value !== '') ? this._filterElm.classList.add('filled') : this._filterElm.classList.remove('filled');
      const callbackArgs = { columnDef: this.columnDef, searchTerms: (value ? [value] : null), operator: selectedOperator, shouldTriggerQuery: this._shouldTriggerQuery };
      const typingDelay = (eventType === 'keyup' && (event as KeyboardEvent)?.key !== 'Enter') ? this._debounceTypingDelay : 0;

      // when changing compound operator, we don't want to trigger the filter callback unless the filter input is also provided
      const skipCompoundOperatorFilterWithNullInput = this.columnFilter.skipCompoundOperatorFilterWithNullInput ?? this.gridOptions.skipCompoundOperatorFilterWithNullInput;
      if (!skipCompoundOperatorFilterWithNullInput || this._currentValue !== undefined) {
        if (typingDelay > 0) {
          clearTimeout(this._timer as NodeJS.Timeout);
          this._timer = setTimeout(() => this.callback(event, callbackArgs), typingDelay);
        } else {
          this.callback(event, callbackArgs);
        }
      }
    }

    // reset both flags for next use
    this._shouldTriggerQuery = true;
  }
}
