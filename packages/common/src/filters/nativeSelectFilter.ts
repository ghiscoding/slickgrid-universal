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
import { createDomElement, emptyElement, } from '../services/domUtilities';
import { toSentenceCase } from '../services/utilities';
import { TranslaterService } from '../services/translater.service';
import { BindingEventService } from '../services/bindingEvent.service';

export class NativeSelectFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _shouldTriggerQuery = true;
  protected _currentValues: any | any[] = [];
  filterElm!: HTMLSelectElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;

  constructor(protected readonly translater: TranslaterService) {
    this._bindEventService = new BindingEventService();
  }

  /** Getter for the Column Filter itself */
  protected get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return OperatorType.equal;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  /** Getter for the current Operator */
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

    if (!this.grid || !this.columnDef || !this.columnFilter || !this.columnFilter.collection) {
      throw new Error(`[Slickgrid-Universal] You need to pass a "collection" for the Native Select Filter to work correctly.`);
    }

    if (this.columnFilter.enableTranslateLabel && !this.gridOptions.enableTranslate && (!this.translater || typeof this.translater.translate !== 'function')) {
      throw new Error(`The I18N Service is required for the Native Select Filter to work correctly when "enableTranslateLabel" is set.`);
    }

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    let searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';
    if (typeof searchTerm === 'boolean' || typeof searchTerm === 'number') {
      searchTerm = `${searchTerm ?? ''}`;
    }

    // step 1, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.filterElm = this.createDomElement(searchTerm);

    // step 2, subscribe to the change event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this._bindEventService.bind(this.filterElm, 'change', this.handleOnChange.bind(this));
  }

  /**
   * Clear the filter values
   */
  clear(shouldTriggerQuery = true) {
    if (this.filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._currentValues = [];
      this.filterElm.value = '';
      this.filterElm.classList.remove('filled');
      this.filterElm.dispatchEvent(new Event('change'));
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();
    this.filterElm?.remove?.();
  }

  /**
   * Get selected values retrieved from the select element
   * @params selected items
   */
  getValues(): any[] {
    return this._currentValues || [];
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    if (Array.isArray(values)) {
      this.filterElm.value = `${values[0] ?? ''}`;
      this._currentValues = values;
    } else if (values) {
      this.filterElm.value = `${values ?? ''}`;
      this._currentValues = [values];
    }
    this.getValues().length > 0 ? this.filterElm.classList.add('filled') : this.filterElm.classList.remove('filled');

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  //
  // protected functions
  // ------------------

  /**
   * Create and return a select dropdown HTML element created from a collection
   * @param {Array<Object>} values - list of option values/labels
   * @returns {Object} selectElm - Select Dropdown HTML Element
   */
  buildFilterSelectFromCollection(collection: any[]): HTMLSelectElement {
    const columnId = this.columnDef?.id ?? '';
    const selectElm = createDomElement('select', { className: `form-control search-filter filter-${columnId}` });
    selectElm.setAttribute('aria-label', this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`);

    const labelName = this.columnFilter.customStructure?.label ?? 'label';
    const valueName = this.columnFilter.customStructure?.value ?? 'value';
    const isEnabledTranslate = this.columnFilter?.enableTranslateLabel ?? false;

    // collection could be an Array of Strings OR Objects
    if (collection.every(x => typeof x === 'string')) {
      for (const option of collection) {
        selectElm.appendChild(
          createDomElement('option', { value: option, label: option, textContent: option })
        );
      }
    } else {
      for (const option of collection) {
        if (!option || (option[labelName] === undefined && option.labelKey === undefined)) {
          throw new Error(`A collection with value/label (or value/labelKey when using Locale) is required to populate the Native Select Filter list, for example:: { filter: model: Filters.select, collection: [ { value: '1', label: 'One' } ]')`);
        }

        const labelKey = option.labelKey || option[labelName];
        const textLabel = ((option.labelKey || isEnabledTranslate) && this.translater && this.translater.translate && this.translater.getCurrentLanguage && this.translater.getCurrentLanguage()) ? this.translater.translate(labelKey || ' ') : labelKey;

        selectElm.appendChild(
          createDomElement('option', { value: option[valueName], textContent: textLabel })
        );
      }
    }

    return selectElm;
  }

  /**
   * From the html template string, create a DOM element
   * @param filterTemplate
   */
  protected createDomElement(searchTerm?: SearchTerm): HTMLSelectElement {
    const columnId = this.columnDef?.id ?? '';
    const headerElm = this.grid.getHeaderRowColumn(columnId);
    emptyElement(headerElm);

    // create the DOM element & add an ID and filter class
    const searchTermInput = (searchTerm || '') as string;

    const collection = this.columnFilter?.collection ?? [];
    if (!Array.isArray(collection)) {
      throw new Error('The "collection" passed to the Native Select Filter is not a valid array.');
    }

    const selectElm = this.buildFilterSelectFromCollection(collection);
    selectElm.value = searchTermInput;
    selectElm.dataset.columnid = `${columnId || ''}`;

    if (searchTermInput) {
      this._currentValues = [searchTermInput];
    }

    headerElm.appendChild(selectElm);

    return selectElm;
  }

  protected handleOnChange(e: any) {
    const value = e && e.target && e.target.value || '';
    this._currentValues = [value];

    if (this._clearFilterTriggered) {
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
      this.filterElm.classList.remove('filled');
    } else {
      value === '' ? this.filterElm.classList.remove('filled') : this.filterElm.classList.add('filled');
      this.callback(e, { columnDef: this.columnDef, operator: this.operator, searchTerms: [value], shouldTriggerQuery: this._shouldTriggerQuery });
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }
}
