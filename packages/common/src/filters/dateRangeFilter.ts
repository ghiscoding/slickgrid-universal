import * as flatpickr_ from 'flatpickr';
import * as moment_ from 'moment-mini';
import { BaseOptions as FlatpickrBaseOptions } from 'flatpickr/dist/types/options';
import { Instance as FlatpickrInstance, FlatpickrFn } from 'flatpickr/dist/types/instance';
const flatpickr: FlatpickrFn = (flatpickr_?.['default'] ?? flatpickr_) as any; // patch for rollup
const moment = (moment_ as any)?.['default'] ?? moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import {
  FieldType,
  OperatorString,
  OperatorType,
  SearchTerm,
} from '../enums/index';
import {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  FlatpickrOption,
  GridOption,
  SlickGrid,
} from '../interfaces/index';
import { createDomElement, destroyObjectDomElementProps, emptyElement, } from '../services/domUtilities';
import { mapFlatpickrDateFormatWithFieldType, mapMomentDateFormatWithFieldType } from '../services/utilities';
import { BindingEventService } from '../services/bindingEvent.service';
import { TranslaterService } from '../services/translater.service';

export class DateRangeFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValue?: string;
  protected _currentDates?: Date[] | string[];
  protected _currentDateStrings?: string[];
  protected _flatpickrOptions!: FlatpickrOption;
  protected _filterElm!: HTMLDivElement;
  protected _filterDivInputElm!: HTMLDivElement;
  protected _shouldTriggerQuery = true;
  flatInstance!: FlatpickrInstance;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  filterContainerElm!: HTMLDivElement;

  constructor(protected readonly translaterService: TranslaterService) {
    this._bindEventService = new BindingEventService();
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  /** Getter for the Column Filter */
  get columnFilter(): ColumnFilter {
    return this.columnDef && this.columnDef.filter || {};
  }

  /** Getter for the Current Dates selected */
  get currentDates() {
    return this._currentDates;
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return this.gridOptions.defaultFilterRangeOperator || OperatorType.rangeInclusive;
  }

  /** Getter for the Flatpickr Options */
  get flatpickrOptions(): FlatpickrOption {
    return this._flatpickrOptions || {};
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
    this.searchTerms = args?.searchTerms ?? [];
    this.filterContainerElm = args.filterContainerElm;

    // step 1, create the DOM Element of the filter which contain the compound Operator+Input
    this._filterElm = this.createDomFilterElement(this.searchTerms);

    // step 3, subscribe to the keyup event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this._bindEventService.bind(this._filterDivInputElm, 'keyup', this.onTriggerEvent.bind(this));
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.flatInstance) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      if (this.flatInstance.input) {
        this.flatInstance.clear();
      }
    }
    this._filterElm.classList.remove('filled');
    this._filterDivInputElm.classList.remove('filled');
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();

    if (typeof this.flatInstance?.destroy === 'function') {
      this.flatInstance.destroy();
      if (this.flatInstance.element) {
        destroyObjectDomElementProps(this.flatInstance);
      }
    }
    emptyElement(this.filterContainerElm);
    emptyElement(this._filterDivInputElm);
    this._filterDivInputElm?.remove();
    this.filterContainerElm?.remove();
    this._filterElm?.remove();
    this.grid = null as any;
  }

  hide() {
    if (typeof this.flatInstance?.close === 'function') {
      this.flatInstance.close();
    }
  }

  show() {
    if (typeof this.flatInstance?.open === 'function') {
      this.flatInstance.open();
    }
  }

  getValues() {
    return this._currentDates;
  }

  /**
   * Set value(s) on the DOM element
   * @params searchTerms
   */
  setValues(searchTerms: SearchTerm[] | SearchTerm | undefined, operator?: OperatorType | OperatorString) {
    let pickerValues: any[] = [];

    // get the picker values, if it's a string with the "..", we'll do the split else we'll use the array of search terms
    if (typeof searchTerms === 'string' || (Array.isArray(searchTerms) && typeof searchTerms[0] === 'string') && (searchTerms[0] as string).indexOf('..') > 0) {
      pickerValues = (typeof searchTerms === 'string') ? [(searchTerms as string)] : (searchTerms[0] as string).split('..');
    } else if (Array.isArray(searchTerms)) {
      pickerValues = searchTerms;
    }

    if (this.flatInstance) {
      this._currentDates = (searchTerms && pickerValues) ? pickerValues : undefined;
      this.flatInstance.setDate(this._currentDates || '');
    }

    const currentValues = this.getValues() || [];
    if (currentValues.length > 0 && searchTerms) {
      this._filterElm.classList.add('filled');
      this._filterDivInputElm.classList.add('filled');
    } else {
      this._filterElm.classList.remove('filled');
      this._filterDivInputElm.classList.remove('filled');
    }

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  //
  // protected functions
  // ------------------
  protected buildDatePickerInput(searchTerms?: SearchTerm | SearchTerm[]): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    const inputFormat = mapFlatpickrDateFormatWithFieldType(this.columnFilter.type || this.columnDef.type || FieldType.dateIso);
    const outputFormat = mapFlatpickrDateFormatWithFieldType(this.columnDef.outputType || this.columnFilter.type || this.columnDef.type || FieldType.dateUtc);
    const userFilterOptions = this.columnFilter?.filterOptions ?? {} as FlatpickrOption;

    // get current locale, if user defined a custom locale just use or get it the Translate Service if it exist else just use English
    let currentLocale = (userFilterOptions?.locale ?? this.translaterService?.getCurrentLanguage?.()) || this.gridOptions.locale || 'en';
    if (currentLocale.length > 2) {
      currentLocale = currentLocale.substring(0, 2);
    }

    let pickerValues: any[] = [];

    // get the picker values, if it's a string with the "..", we'll do the split else we'll use the array of search terms
    if (typeof searchTerms === 'string' || (Array.isArray(searchTerms) && typeof searchTerms[0] === 'string') && (searchTerms[0] as string).indexOf('..') > 0) {
      pickerValues = (typeof searchTerms === 'string') ? [(searchTerms as string)] : (searchTerms[0] as string).split('..');
    } else if (Array.isArray(searchTerms)) {
      pickerValues = searchTerms;
    }

    // if we are preloading searchTerms, we'll keep them for reference
    if (pickerValues) {
      this._currentDates = pickerValues as Date[];
      const outFormat = mapMomentDateFormatWithFieldType(this.columnFilter.type || this.columnDef.type || FieldType.dateIso);
      this._currentDateStrings = pickerValues.map(date => moment(date).format(outFormat));
    }

    const pickerOptions: FlatpickrOption = {
      defaultDate: (pickerValues || '') as string | string[],
      altInput: true,
      altFormat: outputFormat,
      dateFormat: inputFormat,
      mode: 'range',
      wrap: true,
      closeOnSelect: true,
      locale: currentLocale,
      onChange: (selectedDates: Date[] | Date) => {
        if (Array.isArray(selectedDates)) {
          this._currentDates = selectedDates;
          const outFormat = mapMomentDateFormatWithFieldType(this.columnDef.outputType || this.columnFilter.type || this.columnDef.type || FieldType.dateIso);
          this._currentDateStrings = selectedDates.map(date => moment(date).format(outFormat));
          this._currentValue = this._currentDateStrings.join('..');
        }

        // when using the time picker, we can simulate a keyup event to avoid multiple backend request
        // since backend request are only executed after user start typing, changing the time should be treated the same way
        const newEvent = pickerOptions.enableTime ? new Event('keyup') : undefined;
        this.onTriggerEvent(newEvent);
      },
      errorHandler: (error) => {
        if (error.toString().includes('invalid locale')) {
          console.warn(`[Slickgrid-Universal] Flatpickr missing locale imports (${currentLocale}), will revert to English as the default locale.
          See Flatpickr Localization for more info, for example if we want to use French, then we can import it with:  import 'flatpickr/dist/l10n/fr';`);
        }
      }
    };

    // add the time picker when format is UTC (Z) or has the 'h' (meaning hours)
    if (outputFormat && (outputFormat === 'Z' || outputFormat.toLowerCase().includes('h'))) {
      pickerOptions.enableTime = true;
    }

    // merge options with optional user's custom options
    this._flatpickrOptions = { ...pickerOptions, ...userFilterOptions };

    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    const filterDivInputElm = createDomElement('div', { className: `flatpickr search-filter filter-${columnId}` });
    filterDivInputElm.appendChild(
      createDomElement('input', {
        type: 'text', className: 'form-control',
        placeholder,
        dataset: { input: '', columnid: `${columnId}` }
      })
    );
    this.flatInstance = flatpickr(filterDivInputElm, this._flatpickrOptions as unknown as Partial<FlatpickrBaseOptions>);

    return filterDivInputElm;
  }

  /**
   * Create the DOM element
   * @params searchTerms
   */
  protected createDomFilterElement(searchTerms?: SearchTerm[]): HTMLDivElement {
    emptyElement(this.filterContainerElm);

    // create the DOM element filter container
    this._filterDivInputElm = this.buildDatePickerInput(searchTerms);

    // if there's a search term, we will add the "filled" class for styling purposes
    if (Array.isArray(searchTerms) && searchTerms.length > 0 && searchTerms[0] !== '') {
      this._filterDivInputElm.classList.add('filled');
      this._currentDates = searchTerms as Date[];
      this._currentValue = searchTerms[0] as string;
    }

    // append the new DOM element to the header row
    if (this._filterDivInputElm) {
      this.filterContainerElm.appendChild(this._filterDivInputElm);
    }

    return this._filterDivInputElm;
  }

  protected onTriggerEvent(e: Event | undefined) {
    if (this._clearFilterTriggered) {
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
      this._filterElm.classList.remove('filled');
    } else {
      (this._currentDateStrings) ? this._filterElm.classList.add('filled') : this._filterElm.classList.remove('filled');
      this.callback(e, { columnDef: this.columnDef, searchTerms: (this._currentDateStrings ? this._currentDateStrings : [this._currentValue as string]), operator: this.operator || '', shouldTriggerQuery: this._shouldTriggerQuery });
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }
}
