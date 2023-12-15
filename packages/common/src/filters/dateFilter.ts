import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, destroyAllElementProps, emptyElement, } from '@slickgrid-universal/utils';
import flatpickr from 'flatpickr';
import moment from 'moment-mini';
import type { BaseOptions as FlatpickrBaseOptions } from 'flatpickr/dist/types/options';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';

import {
  FieldType,
  OperatorType,
  type OperatorString,
  type SearchTerm,
} from '../enums/index';
import type {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  FlatpickrOption,
  GridOption,
  OperatorDetail,
} from '../interfaces/index';
import { buildSelectOperator, compoundOperatorNumeric } from './filterUtilities';
import { mapFlatpickrDateFormatWithFieldType, mapMomentDateFormatWithFieldType, mapOperatorToShorthandDesignation } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import type { SlickGrid } from '../core/index';

export class DateFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValue?: string;
  protected _currentDateOrDates?: Date | Date[] | string[];
  protected _currentDateStrings?: string[];
  protected _flatpickrOptions!: FlatpickrOption;
  protected _filterElm!: HTMLDivElement;
  protected _filterDivInputElm!: HTMLDivElement;
  protected _operator!: OperatorType | OperatorString;
  protected _selectOperatorElm?: HTMLSelectElement;
  protected _shouldTriggerQuery = true;
  inputFilterType: 'compound' | 'range' = 'range';
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
    return this.grid?.getOptions() ?? {};
  }

  /** Getter for the Column Filter */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter || {} as ColumnFilter;
  }

  /** Getter for the Current Date(s) selected */
  get currentDateOrDates() {
    return this._currentDateOrDates;
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return this.inputFilterType === 'compound'
      ? OperatorType.empty
      : (this.gridOptions.defaultFilterRangeOperator || OperatorType.rangeInclusive);
  }

  /** Getter for the Flatpickr Options */
  get flatpickrOptions(): FlatpickrOption {
    return this._flatpickrOptions || {};
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType | OperatorString {
    if (this.inputFilterType === 'compound') {
      return this._operator || this.columnFilter.operator || this.defaultOperator;
    }
    return this.columnFilter?.operator ?? this.defaultOperator;
  }

  /** Setter for the filter operator */
  set operator(operator: OperatorType | OperatorString) {
    if (this.inputFilterType === 'compound') {
      this._operator = operator;
    } else if (this.columnFilter) {
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
    if (this.inputFilterType === 'compound') {
      this.operator = args.operator || '';
    }
    this.searchTerms = args?.searchTerms ?? [];
    this.filterContainerElm = args.filterContainerElm;

    // date input can only have 1 search term, so we will use the 1st array index if it exist
    const searchValues = this.inputFilterType === 'compound'
      ? (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : ''
      : this.searchTerms;

    // step 1, create the DOM Element of the filter which contain the compound Operator+Input
    this._filterElm = this.createDomFilterElement(searchValues);

    // step 3, subscribe to the keyup event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this._bindEventService.bind(this._filterDivInputElm, 'keyup', this.onTriggerEvent.bind(this));
    if (this._selectOperatorElm) {
      this._bindEventService.bind(this._selectOperatorElm, 'change', this.onTriggerEvent.bind(this));
    }
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.flatInstance) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      if (this._selectOperatorElm) {
        this._selectOperatorElm.selectedIndex = 0;
      }
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
        destroyAllElementProps(this.flatInstance);
      }
    }
    emptyElement(this.filterContainerElm);
    emptyElement(this._filterDivInputElm);
    this._filterDivInputElm?.remove();
    this.filterContainerElm?.remove();
    this._selectOperatorElm?.remove();
    this._filterElm?.remove();
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
    return this._currentDateOrDates;
  }

  /**
   * Set value(s) on the DOM element
   * @params searchTerms
   */
  setValues(values?: SearchTerm[] | SearchTerm, operator?: OperatorType | OperatorString) {
    let pickerValues: any | any[];

    if (this.inputFilterType === 'compound') {
      pickerValues = Array.isArray(values) ? values[0] : values;

    } else {
      // get the picker values, if it's a string with the "..", we'll do the split else we'll use the array of search terms
      if (typeof values === 'string' || (Array.isArray(values) && typeof values[0] === 'string') && (values[0] as string).indexOf('..') > 0) {
        pickerValues = (typeof values === 'string') ? [(values as string)] : (values[0] as string).split('..');
      } else if (Array.isArray(values)) {
        pickerValues = values;
      }
    }

    if (this.flatInstance) {
      this._currentDateOrDates = (values && pickerValues) ? pickerValues : undefined;
      this.flatInstance.setDate(this._currentDateOrDates || '');
    }

    const currentValueOrValues = this.getValues() || [];
    if (this.getValues() || (Array.isArray(currentValueOrValues) && currentValueOrValues.length > 0 && values)) {
      this._filterElm.classList.add('filled');
      this._filterDivInputElm.classList.add('filled');
    } else {
      this._filterElm.classList.remove('filled');
      this._filterDivInputElm.classList.remove('filled');
    }

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
    if (operator && this._selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this._selectOperatorElm.value = operatorShorthand;
    }
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
    if (currentLocale?.length > 2) {
      currentLocale = currentLocale.substring(0, 2);
    }

    let pickerValues: any | any[];

    if (this.inputFilterType === 'compound') {
      if (searchTerms) {
        pickerValues = searchTerms;
        this._currentDateOrDates = searchTerms as Date;
      }
    } else {
      // get the picker values, if it's a string with the "..", we'll do the split else we'll use the array of search terms
      if (typeof searchTerms === 'string' || (Array.isArray(searchTerms) && typeof searchTerms[0] === 'string') && (searchTerms[0] as string).indexOf('..') > 0) {
        pickerValues = (typeof searchTerms === 'string') ? [(searchTerms as string)] : (searchTerms[0] as string).split('..');
      } else if (Array.isArray(searchTerms)) {
        pickerValues = searchTerms;
      }

      // if we are preloading searchTerms, we'll keep them for reference
      if (Array.isArray(pickerValues)) {
        this._currentDateOrDates = pickerValues as Date[];
        const outFormat = mapMomentDateFormatWithFieldType(this.columnFilter.type || this.columnDef.type || FieldType.dateIso);
        this._currentDateStrings = pickerValues.map(date => moment(date).format(outFormat));
      }
    }

    const pickerOptions: FlatpickrOption = {
      defaultDate: (pickerValues || '') as string | string[],
      altInput: true,
      altFormat: outputFormat,
      dateFormat: inputFormat,
      mode: this.inputFilterType === 'range' ? 'range' : 'single',
      wrap: true,
      closeOnSelect: true,
      locale: currentLocale,
      onChange: (selectedDates: Date[] | Date, dateStr: string) => {
        if (this.inputFilterType === 'compound') {
          this._currentValue = dateStr;
          this._currentDateOrDates = Array.isArray(selectedDates) && selectedDates[0] || undefined;
        } else {
          if (Array.isArray(selectedDates)) {
            this._currentDateOrDates = selectedDates;
            const outFormat = mapMomentDateFormatWithFieldType(this.columnDef.outputType || this.columnFilter.type || this.columnDef.type || FieldType.dateIso);
            this._currentDateStrings = selectedDates.map(date => moment(date).format(outFormat));
            this._currentValue = this._currentDateStrings.join('..');
          }
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

    const filterDivInputElm = createDomElement('div', { className: 'flatpickr' });
    if (this.inputFilterType === 'range') {
      filterDivInputElm.classList.add('search-filter', `filter-${columnId}`);
    }
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

  /** Get the available operator option values to populate the operator select dropdown list */
  protected getOperatorOptionValues(): OperatorDetail[] {
    if (this.columnFilter?.compoundOperatorList) {
      return this.columnFilter.compoundOperatorList;
    } else {
      return compoundOperatorNumeric(this.gridOptions, this.translaterService);
    }
  }

  /**
   * Create the DOM element
   * @params searchTerms
   */
  protected createDomFilterElement(searchTerms?: SearchTerm | SearchTerm[]): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this.filterContainerElm);

    // create the DOM element filter container
    this._filterDivInputElm = this.buildDatePickerInput(searchTerms);

    if (this.inputFilterType === 'range') {
      // if there's a search term, we will add the "filled" class for styling purposes
      if (Array.isArray(searchTerms) && searchTerms.length > 0 && searchTerms[0] !== '') {
        this._filterDivInputElm.classList.add('filled');
        this._currentDateOrDates = searchTerms as Date[];
        this._currentValue = searchTerms[0] as string;
      }

      // append the new DOM element to the header row
      if (this._filterDivInputElm) {
        this.filterContainerElm.appendChild(this._filterDivInputElm);
      }

      return this._filterDivInputElm;
    } else {
      this._selectOperatorElm = buildSelectOperator(this.getOperatorOptionValues(), this.grid);
      const filterContainerElm = createDomElement('div', { className: `form-group search-filter filter-${columnId}` });
      const containerInputGroupElm = createDomElement('div', { className: 'input-group flatpickr' }, filterContainerElm);
      const operatorInputGroupAddonElm = createDomElement('div', { className: 'input-group-addon input-group-prepend operator' }, containerInputGroupElm);

      operatorInputGroupAddonElm.appendChild(this._selectOperatorElm);
      containerInputGroupElm.appendChild(this._filterDivInputElm);

      if (this.operator) {
        const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
        this._selectOperatorElm.value = operatorShorthand;
      }

      // if there's a search term, we will add the "filled" class for styling purposes
      if (searchTerms !== '') {
        this._filterDivInputElm.classList.add('filled');
        this._currentDateOrDates = searchTerms as Date;
        this._currentValue = searchTerms as string;
      }

      // append the new DOM element to the header row
      if (filterContainerElm) {
        this.filterContainerElm.appendChild(filterContainerElm);
      }

      return filterContainerElm;
    }
  }

  protected onTriggerEvent(e: Event | undefined) {
    if (this._clearFilterTriggered) {
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
      this._filterElm.classList.remove('filled');
    } else {
      if (this.inputFilterType === 'range') {
        (this._currentDateStrings) ? this._filterElm.classList.add('filled') : this._filterElm.classList.remove('filled');
        this.callback(e, { columnDef: this.columnDef, searchTerms: (this._currentDateStrings ? this._currentDateStrings : [this._currentValue as string]), operator: this.operator || '', shouldTriggerQuery: this._shouldTriggerQuery });
      } else if (this.inputFilterType === 'compound' && this._selectOperatorElm) {
        const selectedOperator = this._selectOperatorElm.value as OperatorString;
        (this._currentValue) ? this._filterElm.classList.add('filled') : this._filterElm.classList.remove('filled');

        // when changing compound operator, we don't want to trigger the filter callback unless the date input is also provided
        const skipCompoundOperatorFilterWithNullInput = this.columnFilter.skipCompoundOperatorFilterWithNullInput ?? this.gridOptions.skipCompoundOperatorFilterWithNullInput ?? this.gridOptions.skipCompoundOperatorFilterWithNullInput === undefined;
        if (!skipCompoundOperatorFilterWithNullInput || this._currentDateOrDates !== undefined) {
          this.callback(e, { columnDef: this.columnDef, searchTerms: (this._currentValue ? [this._currentValue] : null), operator: selectedOperator || '', shouldTriggerQuery: this._shouldTriggerQuery });
        }
      }
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
  }
}
