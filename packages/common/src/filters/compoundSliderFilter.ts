import { hasData, toSentenceCase } from '@slickgrid-universal/utils';

import {
  Column,
  ColumnFilter,
  DOMEvent,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  OperatorDetail,
  SlickGrid,
} from '../interfaces/index';
import { Constants } from '../constants';
import { OperatorString, OperatorType, SearchTerm } from '../enums/index';
import { buildSelectOperator, compoundOperatorNumeric } from './filterUtilities';
import { createDomElement, emptyElement } from '../services/domUtilities';
import { mapOperatorToShorthandDesignation, } from '../services/utilities';
import { BindingEventService } from '../services/bindingEvent.service';
import { TranslaterService } from '../services/translater.service';

export class CompoundSliderFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValue?: number;
  protected _shouldTriggerQuery = true;
  protected _elementRangeInputId = '';
  protected _elementRangeOutputId = '';
  protected _operator?: OperatorType | OperatorString;
  protected containerInputGroupElm?: HTMLDivElement;
  protected divContainerFilterElm?: HTMLDivElement;
  protected filterElm!: HTMLDivElement;
  protected filterInputElm!: HTMLInputElement;
  protected filterNumberElm?: HTMLSpanElement;
  protected selectOperatorElm!: HTMLSelectElement;
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

  /** Getter for the Filter Generic Params */
  protected get filterParams(): any {
    return this.columnDef?.filter?.params ?? {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get gridOptions(): GridOption {
    return this.grid?.getOptions?.() ?? {};
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType | OperatorString {
    return this._operator || this.columnFilter.operator || this.defaultOperator;
  }

  /** Setter for the Filter Operator */
  set operator(operator: OperatorType | OperatorString) {
    this._operator = operator;
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
    this.operator = args.operator || '';
    this.searchTerms = args?.searchTerms ?? [];
    this.filterContainerElm = args.filterContainerElm;

    // define the input & slider number IDs
    this._elementRangeInputId = `rangeInput_${this.columnDef.field}`;
    this._elementRangeOutputId = `rangeOutput_${this.columnDef.field}`;

    // filter input can only have 1 search term, so we will use the 1st array index if it exist
    const searchTerm = (Array.isArray(this.searchTerms) && this.searchTerms.length >= 0) ? this.searchTerms[0] : '';

    // step 1, create the DOM Element of the filter which contain the compound Operator+Input
    // and initialize it if searchTerm is filled
    this.filterElm = this.createDomFilterElement(searchTerm);

    // step 2, subscribe to the change event and run the callback when that happens
    // also add/remove "filled" class for styling purposes
    this._bindEventService.bind(this.filterInputElm, ['change', 'mouseup', 'touchend'], this.handleFilterChange.bind(this) as EventListener);
    this._bindEventService.bind(this.selectOperatorElm, ['change', 'mouseup', 'touchend'], this.handleFilterChange.bind(this) as EventListener);

    // if user chose to display the slider number on the right side, then update it every time it changes
    // we need to use both "input" and "change" event to support cross-browser
    this._bindEventService.bind(this.filterInputElm, ['input', 'change'], this.handleInputChange.bind(this));
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.filterElm && this.selectOperatorElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      const clearedValue = this.filterParams?.sliderStartValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE;
      this._currentValue = +clearedValue;
      this.selectOperatorElm.selectedIndex = 0;
      this.filterInputElm.value = clearedValue;
      if (this.filterNumberElm) {
        this.filterNumberElm.textContent = clearedValue;
      }
      this.filterElm.classList.remove('filled');
      this.divContainerFilterElm?.classList.remove('filled');
      this.handleFilterChange(undefined);
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();
    this.selectOperatorElm?.remove?.();
    emptyElement(this.filterElm);
    this.filterElm?.remove?.();
  }

  /**
   * Get selected value retrieved from the slider element
   * @params selected items
   */
  getValues(): number | undefined {
    return this._currentValue;
  }

  /** Set value(s) on the DOM element */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    const newValue = Array.isArray(values) ? values[0] : values;
    this._currentValue = hasData(newValue) ? +newValue : undefined;
    this.filterInputElm.value = `${newValue ?? ''}`;
    if (this.filterNumberElm) {
      this.filterNumberElm.textContent = `${this._currentValue ?? ''}`;
    }

    if (this.getValues() !== undefined) {
      this.filterElm.classList.add('filled');
      this.divContainerFilterElm?.classList.add('filled');
    } else {
      this.filterElm.classList.remove('filled');
      this.divContainerFilterElm?.classList.remove('filled');
    }

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
    if (operator && this.selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this.selectOperatorElm.value = operatorShorthand;
    }
  }

  //
  // protected functions
  // ------------------

  /**
   * Create the Filter DOM element
   * @param searchTerm optional preset search terms
   */
  protected createDomFilterElement(searchTerm?: SearchTerm): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    const minValue = this.columnFilter?.minValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE;
    const maxValue = this.columnFilter?.maxValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE;
    const defaultValue = this.filterParams?.sliderStartValue ?? minValue;
    const step = this.columnFilter?.valueStep ?? Constants.SLIDER_DEFAULT_STEP;
    const startValue = +(this.filterParams?.sliderStartValue ?? minValue);
    emptyElement(this.filterContainerElm);

    // create the DOM element & add an ID and filter class
    let searchTermInput = (searchTerm || '0') as string;
    if (+searchTermInput < minValue) {
      searchTermInput = `${minValue}`;
    }
    if (+searchTermInput < startValue) {
      searchTermInput = `${startValue}`;
    }
    this._currentValue = +searchTermInput;

    // create the DOM Select dropdown for the Operator
    this.selectOperatorElm = buildSelectOperator(this.getOperatorOptionValues(), this.gridOptions);

    const spanPrependElm = createDomElement('span', { className: 'input-group-addon input-group-prepend operator' });
    spanPrependElm.appendChild(this.selectOperatorElm);

    // create the DOM element
    this.filterInputElm = createDomElement('input', {
      type: 'range', name: this._elementRangeInputId,
      className: `form-control slider-filter-input range compound-slider ${this._elementRangeInputId}`,
      defaultValue, value: searchTermInput, title: searchTermInput,
      min: `${minValue}`, max: `${maxValue}`, step: `${step}`,
    });
    this.filterInputElm.setAttribute('aria-label', this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`);

    this.divContainerFilterElm = createDomElement('div', { className: `form-group search-filter slider-single slider-container filter-${columnId}` });
    this.containerInputGroupElm = createDomElement('div', { className: `input-group search-filter filter-${columnId}` });
    this.containerInputGroupElm.appendChild(spanPrependElm);
    this.containerInputGroupElm.appendChild(this.filterInputElm);
    this.divContainerFilterElm.appendChild(this.containerInputGroupElm);

    if (!this.filterParams.hideSliderNumber) {
      this.containerInputGroupElm.classList.add('input-group');
      this.filterInputElm.value = searchTermInput;

      const divGroupAppendElm = createDomElement('div', { className: 'input-group-addon input-group-append slider-value' });
      this.filterNumberElm = createDomElement('span', {
        className: `input-group-text ${this._elementRangeOutputId}`,
        textContent: searchTermInput
      });
      divGroupAppendElm.appendChild(this.filterNumberElm);
      this.containerInputGroupElm.appendChild(divGroupAppendElm);
    }

    this.divContainerFilterElm.dataset.columnid = `${columnId}`;

    if (this.operator) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this.selectOperatorElm.value = operatorShorthand;
    }

    // if there's a search term, we will add the "filled" class for styling purposes
    if (searchTerm) {
      this.divContainerFilterElm.classList.add('filled');
    }

    // append the new DOM element to the header row
    this.filterContainerElm.appendChild(this.divContainerFilterElm);

    return this.divContainerFilterElm;
  }

  /** Get the available operator option values to populate the operator select dropdown list */
  protected getOperatorOptionValues(): OperatorDetail[] {
    if (this.columnFilter?.compoundOperatorList) {
      return this.columnFilter.compoundOperatorList;
    }
    return compoundOperatorNumeric(this.gridOptions, this.translaterService);
  }

  protected handleInputChange(event: Event) {
    const value = (event?.target as HTMLInputElement).value;
    if (value !== undefined && value !== null) {
      if (!this.filterParams.hideSliderNumber && this.filterNumberElm?.textContent) {
        this.filterNumberElm.textContent = value;
      }
      this.filterInputElm.title = value;
    }
  }

  protected handleFilterChange(e?: DOMEvent<HTMLInputElement>) {
    const value = this.filterInputElm.value;
    this._currentValue = +value;

    if (this._clearFilterTriggered) {
      this.filterElm.classList.remove('filled');
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
    } else {
      const selectedOperator = this.selectOperatorElm.value as OperatorString;
      value === '' ? this.filterElm.classList.remove('filled') : this.filterElm.classList.add('filled');
      this.callback(e, { columnDef: this.columnDef, searchTerms: [value || '0'], operator: selectedOperator || '', shouldTriggerQuery: this._shouldTriggerQuery });
    }

    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;

    // trigger leave event to avoid having previous value still being displayed with custom tooltip feat
    this.grid?.onHeaderMouseLeave.notify({ column: this.columnDef, grid: this.grid });
  }
}
