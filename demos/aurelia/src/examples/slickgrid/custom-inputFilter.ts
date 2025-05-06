import {
  type Column,
  type ColumnFilter,
  emptyElement,
  type Filter,
  type FilterArguments,
  type FilterCallback,
  type GridOption,
  OperatorType,
  type OperatorString,
  type SearchTerm,
  type SlickGrid,
} from 'aurelia-slickgrid';

export class CustomInputFilter implements Filter {
  private _clearFilterTriggered = false;
  private _shouldTriggerQuery = true;
  private filterElm!: HTMLInputElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  operator: OperatorType | OperatorString = OperatorType.equal;

  /** Getter for the Filter Operator */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid?.getOptions() ?? {}) as GridOption;
  }

  /**
   * Initialize the Filter
   */
  init(args: FilterArguments) {
    this.grid = args.grid as SlickGrid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.searchTerms = (args.hasOwnProperty('searchTerms') ? args.searchTerms : []) || [];

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = Array.isArray(this.searchTerms) && this.searchTerms.length > 0 ? this.searchTerms[0] : '';

    // step 1, create HTML string template

    // step 2, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.filterElm = this.createDomElement(searchTerm);

    // step 3, subscribe to the keyup event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this.filterElm.addEventListener('keyup', this.handleKeyup.bind(this));
  }

  handleKeyup(event: any) {
    let value = event.target?.value ?? '';
    const enableWhiteSpaceTrim = this.gridOptions.enableFilterTrimWhiteSpace || this.columnFilter.enableTrimWhiteSpace;
    if (typeof value === 'string' && enableWhiteSpaceTrim) {
      value = value.trim();
    }

    if (this._clearFilterTriggered) {
      this.callback(event, {
        columnDef: this.columnDef,
        clearFilterTriggered: this._clearFilterTriggered,
        shouldTriggerQuery: this._shouldTriggerQuery,
      });
      this.filterElm.classList.remove('filled');
    } else {
      value === '' ? this.filterElm.classList.remove('filled') : this.filterElm.classList.add('filled');
      this.callback(event, { columnDef: this.columnDef, searchTerms: [value], shouldTriggerQuery: this._shouldTriggerQuery });
    }
    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.filterElm.value = '';
      this.filterElm.dispatchEvent(new Event('keyup'));
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    if (this.filterElm) {
      this.filterElm.removeEventListener('keyup', this.handleKeyup);
      this.filterElm.remove();
    }
  }

  /** Set value(s) on the DOM element */
  setValues(values: any) {
    if (values) {
      this.filterElm.value = values;
    }
  }

  //
  // private functions
  // ------------------

  /**
   * From the html template string, create a DOM element
   * @param filterTemplate
   */
  private createDomElement(searchTerm?: SearchTerm): HTMLInputElement {
    const headerElm = this.grid.getHeaderRowColumn(this.columnDef.id);
    emptyElement(headerElm);

    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    // create the DOM element & add an ID and filter class
    const filterElm = document.createElement('input');
    filterElm.className = 'form-control search-filter';
    filterElm.placeholder = placeholder;

    const searchTermInput = searchTerm as string;

    filterElm.value = searchTermInput;
    filterElm.dataset.columnid = `${this.columnDef.id}`;

    // append the new DOM element to the header row
    if (headerElm) {
      headerElm.appendChild(filterElm);
    }

    return filterElm;
  }
}
