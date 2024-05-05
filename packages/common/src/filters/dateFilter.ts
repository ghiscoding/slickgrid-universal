import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, emptyElement, extend, } from '@slickgrid-universal/utils';
import { format, parse } from '@formkit/tempo';
import { VanillaCalendar, type IOptions } from 'vanilla-calendar-picker';

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
  GridOption,
  OperatorDetail,
} from '../interfaces/index';
import { buildSelectOperator, compoundOperatorNumeric } from './filterUtilities';
import { formatTempoDateByFieldType, mapTempoDateFormatWithFieldType } from '../services/dateUtils';
import { mapOperatorToShorthandDesignation } from '../services/utilities';
import type { TranslaterService } from '../services/translater.service';
import type { SlickGrid } from '../core/index';
import { setPickerDates } from '../commonEditorFilter';

export class DateFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValue?: string;
  protected _currentDateOrDates?: Date | Date[] | string | string[];
  protected _currentDateStrings?: string[];
  protected _lastClickIsDate = false;
  protected _pickerOptions!: IOptions;
  protected _filterElm!: HTMLDivElement;
  protected _dateInputElm!: HTMLInputElement;
  protected _operator!: OperatorType | OperatorString;
  protected _selectOperatorElm?: HTMLSelectElement;
  protected _shouldTriggerQuery = true;
  hasTimePicker = false;
  inputFilterType: 'compound' | 'range' = 'range';
  calendarInstance?: VanillaCalendar;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;
  filterContainerElm!: HTMLDivElement;

  constructor(protected readonly translaterService?: TranslaterService) {
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

  /** Getter for the date picker options */
  get pickerOptions(): IOptions {
    return this._pickerOptions || {};
  }

  get filterOptions(): IOptions {
    return { ...this.gridOptions.defaultFilterOptions?.date, ...this.columnFilter?.filterOptions };
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

  /** Initialize the Filter */
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

    // if there's a search term, we will add the "filled" class for styling purposes
    if (this.searchTerms.length) {
      this._filterElm.classList.add('filled');
    }

    // step 3, subscribe to the keyup event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    if (this._selectOperatorElm) {
      this._bindEventService.bind(this._selectOperatorElm, 'change', this.onTriggerEvent.bind(this));
    }

    // close picker on Esc/Tab keys
    this._bindEventService.bind(document.body, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        this.hide();
      }
    }) as EventListener);

    // clear date picker + compound operator when Backspace is pressed
    this._bindEventService.bind(this._dateInputElm, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        this.clear(true);
      }
    }) as EventListener);
  }

  /** Clear the filter value */
  clear(shouldTriggerQuery = true) {
    if (this.calendarInstance) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      if (this._selectOperatorElm) {
        this._selectOperatorElm.selectedIndex = 0;
      }
      if (this.calendarInstance.input) {
        this.calendarInstance.settings.selected.dates = [];
        this._dateInputElm.value = '';
      }
    }
    this.onTriggerEvent(new Event('keyup'));
    this._filterElm.classList.remove('filled');
  }

  /** Destroy the filter */
  destroy() {
    this._bindEventService.unbindAll();
    this.calendarInstance?.destroy();

    emptyElement(this.filterContainerElm);
    this.filterContainerElm?.remove();
    this._selectOperatorElm?.remove();
    this._filterElm?.remove();
  }

  hide() {
    if (typeof this.calendarInstance?.hide === 'function') {
      this.calendarInstance.hide();
    }
  }

  show() {
    if (typeof this.calendarInstance?.show === 'function') {
      this.calendarInstance.show();
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

    if (this.calendarInstance && pickerValues !== undefined) {
      setPickerDates(this._dateInputElm, this.calendarInstance, pickerValues, this.columnDef, this.columnFilter);
      this._currentDateOrDates = (values && pickerValues) ? pickerValues : undefined;
    }

    const currentValueOrValues = this.getValues() || [];
    if (this.getValues() || (Array.isArray(currentValueOrValues) && currentValueOrValues.length > 0 && values)) {
      this._filterElm.classList.add('filled');
    } else {
      this._filterElm.classList.remove('filled');
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
  protected buildDatePickerInput(searchTerms?: SearchTerm | SearchTerm[]) {
    const columnId = this.columnDef?.id ?? '';
    const columnFieldType = this.columnFilter.type || this.columnDef.type || FieldType.dateIso;
    const outputFieldType = this.columnDef.outputType || this.columnFilter.type || this.columnDef.type || FieldType.dateUtc;
    const outputFormat = mapTempoDateFormatWithFieldType(outputFieldType);
    const inputFieldType = this.columnFilter.type || this.columnDef.type || FieldType.dateIso;

    // add the time picker when format is UTC (Z) or has the 'h' (meaning hours)
    if (outputFormat && this.inputFilterType !== 'range' && (outputFormat === 'ISO8601' || outputFormat.toLowerCase().includes('h'))) {
      this.hasTimePicker = true;
    }
    const pickerFormat = mapTempoDateFormatWithFieldType(this.hasTimePicker ? FieldType.dateTimeIsoAM_PM : FieldType.dateIso);

    // get current locale, if user defined a custom locale just use or get it the Translate Service if it exist else just use English
    const currentLocale = ((this.filterOptions?.locale ?? this.translaterService?.getCurrentLanguage?.()) || this.gridOptions.locale || 'en') as string;

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
        this._currentDateStrings = pickerValues.map(date => formatTempoDateByFieldType(date, undefined, inputFieldType));
      }
    }

    const pickerOptions: IOptions = {
      input: true,
      jumpToSelectedDate: true,
      type: this.inputFilterType === 'range' ? 'multiple' : 'default',
      sanitizer: (dirtyHtml) => this.grid.sanitizeHtmlString(dirtyHtml),
      toggleSelected: false,
      actions: {
        clickDay: (_e) => {
          this._lastClickIsDate = true;
        },
        changeToInput: (_e, self) => {
          if (self.HTMLInputElement) {
            let outDates: Array<Date | string> = [];
            let firstDate = '';
            let lastDate = ''; // when using date range

            if (self.selectedDates[1]) {
              self.selectedDates.sort((a, b) => +new Date(a) - +new Date(b));
              firstDate = self.selectedDates[0];
              lastDate = self.selectedDates[self.selectedDates.length - 1];
              const firstDisplayDate = format(self.selectedDates[0], outputFormat, 'en-US');
              const lastDisplayDate = format(lastDate, outputFormat, 'en-US');
              self.HTMLInputElement.value = `${firstDisplayDate} — ${lastDisplayDate}`;
              outDates = [firstDate, lastDate];
            } else if (self.selectedDates[0]) {
              firstDate = self.selectedDates[0];
              self.HTMLInputElement.value = formatTempoDateByFieldType(firstDate, FieldType.dateIso, outputFieldType);
              outDates = self.selectedDates;
            } else {
              self.HTMLInputElement.value = '';
            }

            if (this.hasTimePicker && firstDate) {
              const tempoDate = parse(firstDate, pickerFormat);
              tempoDate.setHours(+(self.selectedHours || 0));
              tempoDate.setMinutes(+(self.selectedMinutes || 0));
              self.HTMLInputElement.value = formatTempoDateByFieldType(tempoDate, undefined, outputFieldType);
              outDates = [tempoDate];
            }

            if (this.inputFilterType === 'compound') {
              this._currentValue = formatTempoDateByFieldType(outDates[0], undefined, columnFieldType);
            } else {
              if (Array.isArray(outDates)) {
                this._currentDateStrings = outDates.map(date => formatTempoDateByFieldType(date, undefined, columnFieldType));
                this._currentValue = this._currentDateStrings.join('..');
              }
            }

            this._currentDateOrDates = outDates.map(d => d instanceof Date ? d : parse(d, pickerFormat));

            // when using the time picker, we can simulate a keyup event to avoid multiple backend request
            // since backend request are only executed after user start typing, changing the time should be treated the same way
            if (this._currentValue) {
              const newEvent = this.hasTimePicker ? new Event('keyup') : undefined;
              this.onTriggerEvent(newEvent);
            }

            // when using date range and we're not yet having 2 dates, then don't close picker just yet
            if (this.inputFilterType === 'range' && self.selectedDates.length < 2) {
              this._lastClickIsDate = false;
            }
            // if you want to hide the calendar after picking a date
            if (this._lastClickIsDate) {
              self.hide();
              this._lastClickIsDate = false;
            }
          }
        }
      },
      settings: {
        lang: currentLocale,
        iso8601: false,
        visibility: {
          theme: this.gridOptions?.darkMode ? 'dark' : 'light',
          positionToInput: 'auto',
          weekend: false,
        },
      },
    };

    if (this.inputFilterType === 'range') {
      pickerOptions.type = 'multiple';
      pickerOptions.months = 2;
      pickerOptions.jumpMonths = 2;
      pickerOptions.settings = {
        ...pickerOptions.settings,
        range: {
          edgesOnly: true,
        },
        selection: {
          day: 'multiple-ranged',
        },
        visibility: {
          ...pickerOptions.settings?.visibility,
          daysOutside: false,
        },
      };
    }

    // add the time picker when format is UTC (Z) or has the 'h' (meaning hours)
    if (this.hasTimePicker) {
      pickerOptions.settings!.selection ??= {};
      pickerOptions.settings!.selection.time = 24;
    }

    // merge options with optional user's custom options
    this._pickerOptions = extend(true, {}, pickerOptions, { settings: this.filterOptions });

    let placeholder = this.gridOptions?.defaultFilterPlaceholder ?? '';
    if (this.columnFilter?.placeholder) {
      placeholder = this.columnFilter.placeholder;
    }

    this._dateInputElm = createDomElement('input', {
      type: 'text', className: 'form-control date-picker',
      placeholder,
      readOnly: true,
      dataset: { input: '', columnid: `${columnId}` }
    });

    this.calendarInstance = new VanillaCalendar(this._dateInputElm, this._pickerOptions);
    this.calendarInstance.init();

    if (this._pickerOptions.settings?.selected?.dates) {
      pickerValues = this._pickerOptions.settings.selected.dates;
    }

    if (pickerValues) {
      setPickerDates(this._dateInputElm, pickerOptions, pickerValues, this.columnDef, this.columnFilter);
    }
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
    this.buildDatePickerInput(searchTerms);

    if (this.inputFilterType === 'range') {
      // if there's a search term, we will add the "filled" class for styling purposes
      const inputContainerElm = createDomElement('div', { className: `date-picker form-group search-filter filter-${columnId}` });

      if (Array.isArray(searchTerms) && searchTerms.length > 0 && searchTerms[0] !== '') {
        this._currentDateOrDates = searchTerms as Date[];
        this._currentValue = searchTerms[0] as string;
      }
      inputContainerElm.appendChild(this._dateInputElm);

      // append the new DOM element to the header row
      if (inputContainerElm) {
        this.filterContainerElm.appendChild(inputContainerElm);
      }

      return inputContainerElm;
    } else {
      this._selectOperatorElm = buildSelectOperator(this.getOperatorOptionValues(), this.grid);
      const filterContainerElm = createDomElement('div', { className: `date-picker form-group search-filter filter-${columnId}` });
      const containerInputGroupElm = createDomElement('div', { className: 'input-group date-picker' }, filterContainerElm);
      const operatorInputGroupAddonElm = createDomElement('div', { className: 'input-group-addon input-group-prepend operator' }, containerInputGroupElm);

      operatorInputGroupAddonElm.appendChild(this._selectOperatorElm);
      containerInputGroupElm.appendChild(this._dateInputElm);

      if (this.operator) {
        const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
        this._selectOperatorElm.value = operatorShorthand;
      }

      this._currentDateOrDates = searchTerms as Date;
      this._currentValue = searchTerms as string;

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
        this._currentValue ? this._filterElm.classList.add('filled') : this._filterElm.classList.remove('filled');

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
