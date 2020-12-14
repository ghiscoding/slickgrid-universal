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
import { TranslaterService } from '../services/translater.service';

export class NativeSelectFilter implements Filter {
  private _clearFilterTriggered = false;
  private _shouldTriggerQuery = true;
  private _currentValues: any | any[] = [];
  $filterElm: any;
  grid: SlickGrid;
  searchTerms: SearchTerm[];
  columnDef: Column;
  callback: FilterCallback;

  constructor(private translater: TranslaterService) { }

  /** Getter for the Column Filter itself */
  protected get columnFilter(): ColumnFilter {
    return this.columnDef && this.columnDef.filter || {};
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
    return this.columnFilter && this.columnFilter.operator || this.defaultOperator;
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
      searchTerm = `${searchTerm}`;
    }

    // step 1, create HTML string template
    const filterTemplate = this.buildTemplateHtmlString();

    // step 2, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.$filterElm = this.createDomElement(filterTemplate, searchTerm);

    // step 3, subscribe to the change event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this.$filterElm.change(this.handleOnChange.bind(this));
  }

  /**
   * Clear the filter values
   */
  clear(shouldTriggerQuery = true) {
    if (this.$filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      this._currentValues = [];
      this.$filterElm.val('');
      this.$filterElm.trigger('change');
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    if (this.$filterElm) {
      this.$filterElm.off('change').remove();
    }
    this.$filterElm = null;
  }

  /**
   * Get selected values retrieved from the select element
   * @params selected items
   */
  getValues(): any[] {
    return this._currentValues;
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    if (Array.isArray(values)) {
      this.$filterElm.val(values[0]);
      this._currentValues = values;
    } else if (values) {
      this.$filterElm.val(values);
      this._currentValues = [values];
    }

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  //
  // private functions
  // ------------------

  private buildTemplateHtmlString() {
    const collection = this.columnFilter && this.columnFilter.collection || [];
    if (!Array.isArray(collection)) {
      throw new Error('The "collection" passed to the Native Select Filter is not a valid array.');
    }

    const columnId = this.columnDef?.id ?? '';
    const labelName = (this.columnFilter.customStructure) ? this.columnFilter.customStructure.label : 'label';
    const valueName = (this.columnFilter.customStructure) ? this.columnFilter.customStructure.value : 'value';
    const isEnabledTranslate = (this.columnFilter.enableTranslateLabel) ? this.columnFilter.enableTranslateLabel : false;

    let options = '';

    // collection could be an Array of Strings OR Objects
    if (collection.every(x => typeof x === 'string')) {
      collection.forEach((option: string) => {
        options += `<option value="${option}" label="${option}">${option}</option>`;
      });
    } else {
      collection.forEach((option: any) => {
        if (!option || (option[labelName] === undefined && option.labelKey === undefined)) {
          throw new Error(`A collection with value/label (or value/labelKey when using Locale) is required to populate the Native Select Filter list, for example:: { filter: model: Filters.select, collection: [ { value: '1', label: 'One' } ]')`);
        }
        const labelKey = option.labelKey || option[labelName];
        const textLabel = ((option.labelKey || isEnabledTranslate) && this.translater && this.translater.translate && this.translater.getCurrentLanguage && this.translater.getCurrentLanguage()) ? this.translater.translate(labelKey || ' ') : labelKey;
        options += `<option value="${option[valueName]}">${textLabel}</option>`;
      });
    }
    return `<select class="form-control search-filter filter-${columnId}">${options}</select>`;
  }

  /**
   * From the html template string, create a DOM element
   * @param filterTemplate
   */
  private createDomElement(filterTemplate: string, searchTerm?: SearchTerm) {
    const columnId = this.columnDef?.id ?? '';
    const $headerElm = this.grid.getHeaderRowColumn(columnId);
    $($headerElm).empty();

    // create the DOM element & add an ID and filter class
    const $filterElm = $(filterTemplate);
    const searchTermInput = (searchTerm || '') as string;

    $filterElm.val(searchTermInput);
    $filterElm.data('columnId', columnId);

    if (searchTermInput) {
      this._currentValues = [searchTermInput];
    }

    // append the new DOM element to the header row
    if ($filterElm && typeof $filterElm.appendTo === 'function') {
      $filterElm.appendTo($headerElm);
    }

    return $filterElm;
  }

  private handleOnChange(e: any) {
    const value = e && e.target && e.target.value || '';
    this._currentValues = [value];

    if (this._clearFilterTriggered) {
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
      this.$filterElm.removeClass('filled');
    } else {
      value === '' ? this.$filterElm.removeClass('filled') : this.$filterElm.addClass('filled');
      this.callback(e, { columnDef: this.columnDef, operator: this.operator, searchTerms: [value], shouldTriggerQuery: this._shouldTriggerQuery });
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }
}
