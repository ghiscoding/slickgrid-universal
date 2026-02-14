import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, emptyElement, isDefined, toSentenceCase } from '@slickgrid-universal/utils';
import { Constants } from '../constants.js';
import { SlickEventData, type SlickGrid } from '../core/index.js';
import { type OperatorType, type SearchTerm } from '../enums/index.js';
import type {
  Column,
  ColumnFilter,
  CurrentSliderOption,
  DOMEvent,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  OperatorDetail,
  SliderOption,
  SliderRangeOption,
  SliderType,
} from '../interfaces/index.js';
import type { TranslaterService } from '../services/translater.service.js';
import { mapOperatorToShorthandDesignation } from '../services/utilities.js';
import { applyOperatorAltTextWhenExists, buildSelectOperator, compoundOperatorNumeric } from './filterUtilities.js';

const DEFAULT_SLIDER_TRACK_FILLED_COLOR = '#86bff8';
const GAP_BETWEEN_SLIDER_HANDLES = 0;
const Z_INDEX_MIN_GAP = 20; // gap in Px before we change z-index so that lowest/highest handle doesn't block each other

/** A Slider Range Filter written in pure JS, this is only meant to be used as a range filter (with 2 handles lowest & highest values) */
export class SliderFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValue?: number;
  protected _currentValues?: number[];
  protected _lastSearchValue?: number | string;
  protected _shouldTriggerQuery = true;
  protected _sliderOptions!: CurrentSliderOption;
  protected _operator?: OperatorType;
  protected _filterElm!: HTMLDivElement;
  protected _argFilterContainerElm!: HTMLElement;
  protected _divContainerFilterElm!: HTMLDivElement;
  protected _filterContainerElm!: HTMLDivElement;
  protected _leftSliderNumberElm?: HTMLSpanElement;
  protected _rightSliderNumberElm?: HTMLSpanElement;
  protected _selectOperatorElm?: HTMLSelectElement;
  protected _sliderRangeContainElm!: HTMLDivElement;
  protected _sliderTrackElm!: HTMLDivElement;
  protected _sliderLeftInputElm?: HTMLInputElement;
  protected _sliderRightInputElm?: HTMLInputElement;
  protected _sliderTrackFilledColor: string = DEFAULT_SLIDER_TRACK_FILLED_COLOR;
  sliderType: SliderType = 'double';
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

  /** Getter for the Current Slider Value */
  get currentValue(): number | undefined {
    return this._currentValue;
  }

  /** Getter for the Current Slider Values */
  get currentValues(): number[] | undefined {
    return this._currentValues;
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType {
    if (this.sliderType === 'compound') {
      return '';
    } else if (this.sliderType === 'single') {
      return 'GE';
    }
    return this.gridOptions.defaultFilterRangeOperator || 'RangeInclusive';
  }

  get filterOptions(): SliderOption | SliderRangeOption {
    return { ...this.gridOptions.defaultFilterOptions?.slider, ...this.columnFilter?.options };
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  /** Getter for the current Slider Options */
  get sliderOptions(): CurrentSliderOption | undefined {
    return this._sliderOptions;
  }

  /** Getter for the Filter Operator */
  get operator(): OperatorType {
    return this._operator || (this.columnFilter.operator ?? this.defaultOperator);
  }

  /** Setter for the Filter Operator */
  set operator(operator: OperatorType) {
    this._operator = operator;
  }

  /** Initialize the Filter */
  init(args: FilterArguments): void {
    this.grid = args.grid;
    this.callback = args.callback;
    this.columnDef = args.columnDef;
    this.operator = args.operator || '';
    this.searchTerms = args?.searchTerms ?? [];
    this._argFilterContainerElm = args.filterContainerElm;

    // get slider track filled color from CSS variable when exist
    this._sliderTrackFilledColor =
      getComputedStyle(document.documentElement).getPropertyValue('--slick-slider-filter-filled-track-color') ||
      DEFAULT_SLIDER_TRACK_FILLED_COLOR;

    // step 1, create the DOM Element of the filter & initialize it if searchTerm is filled
    this._filterElm = this.createDomFilterElement(this.searchTerms);
  }

  /** Clear the filter value */
  clear(shouldTriggerQuery = true): void {
    if (this._filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      const lowestValue = +(this.filterOptions?.sliderStartValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE) as number;
      const highestValue = +((this.filterOptions as SliderRangeOption)?.sliderEndValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE) as number;

      if (this.sliderType === 'double') {
        if (this._sliderLeftInputElm) {
          this._sliderLeftInputElm.value = `${lowestValue}`;
        }
        if (this._sliderRightInputElm) {
          this._sliderRightInputElm.value = `${highestValue}`;
        }
        this._currentValues = [lowestValue, highestValue];
        this.slideLeftInputChanged(new Event('change') as DOMEvent<HTMLInputElement>, true);
        this.slideRightInputChanged(new Event('change') as DOMEvent<HTMLInputElement>, true);
      } else {
        // for compound/single sliders, we'll only change to the lowest value
        if (this._sliderRightInputElm) {
          this._sliderRightInputElm.value = `${lowestValue}`;
        }
        if (this._selectOperatorElm) {
          this._selectOperatorElm.selectedIndex = 0; // reset to empty Operator when included
        }
        this._currentValue = lowestValue;
        this.slideRightInputChanged(new Event('change') as DOMEvent<HTMLInputElement>, true);
      }

      const hideSliderNumbers =
        (this.filterOptions as SliderOption)?.hideSliderNumber ?? (this.filterOptions as SliderRangeOption)?.hideSliderNumbers;
      if (!hideSliderNumbers) {
        if (this.sliderType === 'double') {
          this.renderSliderValues(lowestValue, highestValue);
        } else {
          this.renderSliderValues(undefined, lowestValue);
        }
      }
      this.updateFilterStyle(false);
      this.callback(undefined, { columnDef: this.columnDef, clearFilterTriggered: true, shouldTriggerQuery, searchTerms: [] });
    }
  }

  /** destroy the filter */
  destroy(): void {
    this._bindEventService.unbindAll();
    this._sliderTrackElm?.remove();
    this._sliderLeftInputElm?.remove();
    this._sliderRightInputElm?.remove();
  }

  /**
   * Render both slider values (low/high) on screen
   * @param leftValue number
   * @param rightValue number
   */
  renderSliderValues(leftValue?: number | string, rightValue?: number | string, triggerTooltipMouseLeave = true): void {
    const leftVal = leftValue?.toString() || '';
    const rightVal = rightValue?.toString() || '';

    if (this._leftSliderNumberElm?.textContent) {
      this._leftSliderNumberElm.textContent = leftVal;
    }
    if (this._rightSliderNumberElm?.textContent) {
      this._rightSliderNumberElm.textContent = rightVal;
    }
    this._sliderRangeContainElm.title = this.sliderType === 'double' ? `${leftVal} - ${rightVal}` : `${rightVal}`;

    // when changing slider values dynamically (typically via a button), we'll want to avoid tooltips showing up
    // onHeaderRowMouseLeave will hide any tooltip
    if (triggerTooltipMouseLeave) {
      this.grid.onHeaderRowMouseLeave.notify({ column: this.columnDef, grid: this.grid });
    }
  }

  /** get current slider value(s), it could be a single value or an array of 2 values depending on the slider filter type */
  getValues(): number | number[] | undefined {
    return this.sliderType === 'double' ? this._currentValues : this._currentValue;
  }

  /**
   * Set value(s) on the DOM element
   * @params searchTerms
   */
  setValues(values: SearchTerm | SearchTerm[], operator?: OperatorType, triggerChange = false): void {
    if (values) {
      let sliderVals: Array<number | string | undefined> = [];
      const term1: SearchTerm | undefined = Array.isArray(values) ? values?.[0] : values;

      if (Array.isArray(values) && values.length === 2) {
        sliderVals = values as string[];
      } else {
        if (typeof term1 === 'string' && (term1 as string).indexOf('..') > 0) {
          sliderVals = (term1 as string).split('..');
          this._currentValue = +(sliderVals?.[0] ?? 0);
        } else if (isDefined(term1) || term1 === '') {
          this._currentValue = term1 === null ? undefined : +term1;
          sliderVals = [term1 as string | number];
        }
      }

      if (this.sliderType !== 'double' && this._sliderRightInputElm) {
        this._sliderRightInputElm.value = typeof values === 'string' ? values : `${term1}`;
        this.renderSliderValues(undefined, this._sliderRightInputElm.value);
      } else if (Array.isArray(sliderVals) && sliderVals.length === 2) {
        if (!(this.filterOptions as SliderRangeOption)?.hideSliderNumbers) {
          const [lowestValue, highestValue] = sliderVals;
          if (this._sliderLeftInputElm) {
            this._sliderLeftInputElm.value = String(lowestValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE);
          }
          if (this._sliderRightInputElm) {
            this._sliderRightInputElm.value = String(highestValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE);
          }
          this.renderSliderValues(...sliderVals);
        }
      }
    } else {
      this._currentValue = undefined;
      this._currentValues = undefined;
    }

    const val = this.getValues();
    const vals = val === undefined ? [] : Array.isArray(val) ? val : [val];

    // set the operator when defined
    this.updateFilterStyle(vals.length > 0);

    // set the operator when defined
    if (operator !== undefined) {
      this.operator = operator;
    }
    if (this.operator && this._selectOperatorElm) {
      const operatorShorthand = mapOperatorToShorthandDesignation(this.operator);
      this._selectOperatorElm.value = operatorShorthand;
    }

    if (triggerChange) {
      this.callback(undefined, {
        columnDef: this.columnDef,
        operator: this.operator,
        searchTerms: vals,
        shouldTriggerQuery: true,
      });
    }
  }

  /**
   * Create the Filter DOM element
   * Follows article with few modifications (without tooltip & neither slider track color)
   * https://codingartistweb.com/2021/06/double-range-slider-html-css-javascript/
   * @param searchTerm optional preset search terms
   */
  protected createDomFilterElement(searchTerms?: SearchTerm | SearchTerm[]): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    emptyElement(this._argFilterContainerElm);

    const { minValue, maxValue, step } = this.getSliderConfigs();
    const defaultStartValue = +(
      (Array.isArray(searchTerms) && searchTerms?.[0]) ??
      (this.filterOptions as SliderRangeOption)?.sliderStartValue ??
      minValue
    );
    const defaultEndValue = +(
      (Array.isArray(searchTerms) && searchTerms?.[1]) ??
      (this.filterOptions as SliderRangeOption)?.sliderEndValue ??
      maxValue
    );

    this._sliderRangeContainElm = createDomElement('div', {
      className: `filter-input filter-${columnId} slider-input-container slider-values`,
      title: this.sliderType === 'double' ? `${defaultStartValue} - ${defaultEndValue}` : `${defaultStartValue}`,
    });
    this._sliderTrackElm = createDomElement('div', { className: 'slider-track' });

    // create Operator dropdown DOM element
    if (this.sliderType === 'compound') {
      const spanPrependElm = createDomElement('span', { className: 'input-group-addon input-group-prepend operator' });
      this._selectOperatorElm = buildSelectOperator(this.getOperatorOptionValues(), this.grid);
      spanPrependElm.appendChild(this._selectOperatorElm);
    }

    // create 2nd (left) slider element to simulate a Slider Range with 2 handles
    // the left slider represents min value slider, while right slider is for max value
    if (this.sliderType === 'double') {
      this._sliderLeftInputElm = createDomElement('input', {
        type: 'range',
        className: `slider-filter-input form-control`,
        ariaLabel: this.columnFilter.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
        defaultValue: `${defaultStartValue}`,
        value: `${defaultStartValue}`,
        min: `${minValue}`,
        max: `${maxValue}`,
        step: `${step}`,
      });
    }

    // right slider will be used by all Slider types
    const rightDefaultVal = this.sliderType === 'double' ? defaultEndValue : defaultStartValue;
    this._sliderRightInputElm = createDomElement('input', {
      type: 'range',
      className: `slider-filter-input form-control compound-input`,
      ariaLabel: this.columnFilter.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      defaultValue: `${rightDefaultVal}`,
      value: `${rightDefaultVal}`,
      min: `${minValue}`,
      max: `${maxValue}`,
      step: `${step}`,
    });

    // put all DOM elements together to create the final Slider
    const hideSliderNumbers =
      (this.filterOptions as SliderOption)?.hideSliderNumber ?? (this.filterOptions as SliderRangeOption)?.hideSliderNumbers;
    const sliderNumberClass = hideSliderNumbers ? '' : 'input-group';
    this._divContainerFilterElm = createDomElement('div', {
      className: `${sliderNumberClass} search-filter slick-filter slider-container slider-values filter-${columnId}`.trim(),
    });

    this._sliderRangeContainElm.appendChild(this._sliderTrackElm);
    if (this.sliderType === 'double' && this._sliderLeftInputElm) {
      this._sliderRangeContainElm.appendChild(this._sliderLeftInputElm);
    }
    this._sliderRangeContainElm.appendChild(this._sliderRightInputElm);

    if (hideSliderNumbers) {
      this._divContainerFilterElm.appendChild(this._sliderRangeContainElm);
    } else {
      let leftDivGroupElm: HTMLDivElement | HTMLSpanElement | undefined;
      if (this.sliderType === 'compound' && this._selectOperatorElm) {
        leftDivGroupElm = createDomElement('span', { className: 'input-group-addon input-group-prepend operator' });
        leftDivGroupElm.appendChild(this._selectOperatorElm);
      } else if (this.sliderType === 'double') {
        leftDivGroupElm = createDomElement('div', { className: `input-group-addon input-group-prepend slider-range-value` });
        this._leftSliderNumberElm = createDomElement('span', {
          className: `input-group-text lowest-range-${columnId}`,
          textContent: `${defaultStartValue}`,
        });
        leftDivGroupElm.appendChild(this._leftSliderNumberElm);
      }

      const rightDivGroupElm = createDomElement('div', { className: `input-group-addon input-group-append slider-range-value` });
      this._rightSliderNumberElm = createDomElement(
        'span',
        { className: `input-group-text highest-range-${columnId}`, textContent: `${rightDefaultVal}` },
        rightDivGroupElm
      );

      if (leftDivGroupElm) {
        this._divContainerFilterElm.appendChild(leftDivGroupElm);
      }
      this._divContainerFilterElm.appendChild(this._sliderRangeContainElm);
      this._divContainerFilterElm.appendChild(rightDivGroupElm);
    }

    // merge options with optional user's custom options
    this._sliderOptions = { minValue, maxValue, step };

    // if we are preloading searchTerms, we'll keep them for reference
    this._currentValues = [defaultStartValue, defaultEndValue];

    // if there's a search term, we will add the "filled" class for styling purposes
    if (Array.isArray(searchTerms) && searchTerms.length > 0 && searchTerms[0] !== '') {
      this.updateFilterStyle(true);
      this._currentValue = defaultStartValue;
    }
    if (this.filterOptions.sliderStartValue !== undefined || this.columnFilter.minValue !== undefined) {
      this._currentValue = defaultStartValue;
    }

    // append the new DOM element to the header row
    this._argFilterContainerElm.appendChild(this._divContainerFilterElm);
    this.updateTrackFilledColorWhenEnabled();

    // attach events
    this._bindEventService.bind(this._sliderTrackElm, 'click', this.sliderTrackClicked.bind(this) as EventListener);
    this._bindEventService.bind(this._sliderRightInputElm, ['input', 'change'], this.slideRightInputChanged.bind(this) as EventListener);
    this._bindEventService.bind(this._sliderRightInputElm, ['change', 'mouseup', 'touchend'], (e) => this.onValueChanged(e));
    this._bindEventService.bind(this._sliderRightInputElm, ['keydown'], (e) => this.handleKeyDown(e, 'right'));

    if (this.sliderType === 'compound' && this._selectOperatorElm) {
      this._bindEventService.bind(this._selectOperatorElm, ['change'], this.onValueChanged.bind(this) as EventListener);
    } else if (this.sliderType === 'double' && this._sliderLeftInputElm) {
      this._bindEventService.bind(this._sliderLeftInputElm, ['input', 'change'], this.slideLeftInputChanged.bind(this) as EventListener);
      this._bindEventService.bind(this._sliderLeftInputElm, ['change', 'mouseup', 'touchend'], (e) => this.onValueChanged(e));
      this._bindEventService.bind(this._sliderLeftInputElm, ['keydown'], (e) => this.handleKeyDown(e, 'left'));
    }

    return this._divContainerFilterElm;
  }

  protected getInputValue(elm?: HTMLInputElement): number {
    return parseInt(elm?.value ?? '', 10);
  }

  /** Get the available operator option values to populate the operator select dropdown list */
  protected getOperatorOptionValues(): OperatorDetail[] {
    let operatorList: OperatorDetail[];
    if (this.columnFilter.compoundOperatorList) {
      operatorList = this.columnFilter.compoundOperatorList;
    } else {
      operatorList = compoundOperatorNumeric(this.gridOptions, this.translaterService);
    }

    // add alternate texts when provided
    applyOperatorAltTextWhenExists(this.gridOptions, operatorList, 'numeric');

    return operatorList;
  }

  /** get default slider defaults */
  protected getSliderConfigs(): Omit<CurrentSliderOption, 'sliderTrackBackground'> {
    return {
      minValue: +(this.columnFilter.minValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE),
      maxValue: +(this.columnFilter.maxValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE),
      step: +(this.columnFilter.valueStep ?? Constants.SLIDER_DEFAULT_STEP),
    };
  }

  /** use keydown event to increase/decrease slider value */
  protected handleKeyDown(event: Event, side: 'left' | 'right'): void {
    const e = event as KeyboardEvent;
    if (this.filterOptions.useArrowToSlide !== false && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const { minValue, maxValue, step } = this.getSliderConfigs();
      const currentValue = Number(side === 'left' ? this._sliderLeftInputElm?.value : this._sliderRightInputElm?.value);
      let newValue = e.key === 'ArrowLeft' ? currentValue - step : currentValue + step;
      newValue = newValue < minValue ? minValue : newValue > maxValue ? maxValue : newValue; // make we are within limits

      // Update input value & trigger an event to update tooltip as well
      let sliderRightVal = this.getInputValue(this._sliderRightInputElm);
      let sliderLeftVal = 0;
      if (this.sliderType === 'compound' || this.sliderType === 'single') {
        this._sliderRightInputElm!.value = `${newValue}`;
        sliderRightVal = newValue;
      } else if (this.sliderType === 'double' && this._sliderLeftInputElm) {
        this._sliderLeftInputElm.value = `${newValue}`;
        sliderLeftVal = newValue;
      }

      this.sliderLeftOrRightChanged(e as any, side, sliderLeftVal, sliderRightVal);
      this.onValueChanged(e as any);

      // Prevent default arrow key behavior
      e.stopPropagation();
      e.preventDefault();
    }
  }

  /** handle value change event triggered, trigger filter callback & update "filled" class name */
  protected onValueChanged(e: Event, skipTriggerEvent = false): void {
    const sliderRightVal = this.getInputValue(this._sliderRightInputElm);
    let value;
    let searchTerms: SearchTerm[];

    if (this.sliderType === 'compound' || this.sliderType === 'single') {
      // only update ref when the value from the input
      if ((e?.target as HTMLElement)?.tagName?.toLowerCase() !== 'select') {
        this._currentValue = +sliderRightVal;
      }
      value = this._currentValue;
      searchTerms = [value || '0'];
    } else if (this.sliderType === 'double') {
      const sliderLeftVal = this.getInputValue(this._sliderLeftInputElm);
      const values = [sliderLeftVal, sliderRightVal];
      value = values.join('..');
      searchTerms = values as SearchTerm[];
    }

    if (this._clearFilterTriggered) {
      this.updateFilterStyle(false);
      this.callback(e, {
        columnDef: this.columnDef,
        clearFilterTriggered: this._clearFilterTriggered,
        searchTerms: [],
        shouldTriggerQuery: this._shouldTriggerQuery,
      });
    } else {
      const selectedOperator = (this._selectOperatorElm?.value ?? this.operator) as OperatorType;
      this.updateFilterStyle(value !== '');

      // when changing compound operator, we don't want to trigger the filter callback unless the filter input is also provided
      const skipNullInput =
        this.columnFilter.skipCompoundOperatorFilterWithNullInput ?? this.gridOptions.skipCompoundOperatorFilterWithNullInput;
      const hasSkipNullValChanged =
        (skipNullInput && isDefined(this._currentValue)) || (!isDefined(this._currentValue) && isDefined(this._lastSearchValue));

      if (this.sliderType !== 'compound' || !skipNullInput || hasSkipNullValChanged) {
        this.callback(e, {
          columnDef: this.columnDef,
          operator: selectedOperator || '',
          searchTerms: searchTerms! as SearchTerm[],
          shouldTriggerQuery: this._shouldTriggerQuery,
        });
      }
    }
    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
    this.changeBothSliderFocuses(false);

    // trigger mouse enter event on the filter for optionally hooked SlickCustomTooltip
    // the minimum requirements for tooltip to work are the columnDef and targetElement
    if (!skipTriggerEvent) {
      this.grid.onHeaderRowMouseEnter.notify({ column: this.columnDef, grid: this.grid }, new SlickEventData(e));
    }
    this._lastSearchValue = value;
  }

  protected changeBothSliderFocuses(isAddingFocus: boolean): void {
    const addRemoveCmd = isAddingFocus ? 'add' : 'remove';
    this._sliderLeftInputElm?.classList[addRemoveCmd]('focus');
    this._sliderRightInputElm?.classList[addRemoveCmd]('focus');
  }

  protected slideLeftInputChanged(e: DOMEvent<HTMLInputElement>, skipTriggerEvent = false): void {
    const sliderLeftVal = this.getInputValue(this._sliderLeftInputElm);
    const sliderRightVal = this.getInputValue(this._sliderRightInputElm);

    if (
      this._sliderLeftInputElm &&
      sliderRightVal - sliderLeftVal <=
        ((this.filterOptions as SliderRangeOption)?.stopGapBetweenSliderHandles ?? GAP_BETWEEN_SLIDER_HANDLES)
    ) {
      this._sliderLeftInputElm.value = String(
        sliderLeftVal - ((this.filterOptions as SliderRangeOption)?.stopGapBetweenSliderHandles ?? GAP_BETWEEN_SLIDER_HANDLES)
      );
    }

    // change which handle has higher z-index to make them still usable,
    // ie when left handle reaches the end, it has to have higher z-index or else it will be stuck below
    // and we cannot move right because it cannot go below min value
    if (this._sliderLeftInputElm && this._sliderRightInputElm) {
      if (+this._sliderLeftInputElm.value >= +this._sliderRightInputElm.value - Z_INDEX_MIN_GAP) {
        this._sliderLeftInputElm.style.zIndex = '1';
        this._sliderRightInputElm.style.zIndex = '0';
      } else {
        this._sliderLeftInputElm.style.zIndex = '0';
        this._sliderRightInputElm.style.zIndex = '1';
      }
    }

    this.sliderLeftOrRightChanged(e, 'left', sliderLeftVal, sliderRightVal, skipTriggerEvent);
  }

  protected slideRightInputChanged(e: DOMEvent<HTMLInputElement>, skipTriggerEvent = false): void {
    const sliderLeftVal = this.getInputValue(this._sliderLeftInputElm);
    const sliderRightVal = this.getInputValue(this._sliderRightInputElm);

    if (
      this.sliderType === 'double' &&
      this._sliderRightInputElm &&
      sliderRightVal - sliderLeftVal <=
        ((this.filterOptions as SliderRangeOption)?.stopGapBetweenSliderHandles ?? GAP_BETWEEN_SLIDER_HANDLES)
    ) {
      this._sliderRightInputElm.value = String(
        sliderLeftVal + ((this.filterOptions as SliderRangeOption)?.stopGapBetweenSliderHandles ?? GAP_BETWEEN_SLIDER_HANDLES)
      );
    }

    this.sliderLeftOrRightChanged(e, 'right', sliderLeftVal, sliderRightVal, skipTriggerEvent);
  }

  protected sliderLeftOrRightChanged(
    e: DOMEvent<HTMLInputElement>,
    side: 'left' | 'right',
    sliderLeftVal: number,
    sliderRightVal: number,
    skipTriggerEvent = false
  ): void {
    let triggerEvent = true;
    this.updateTrackFilledColorWhenEnabled();
    this.changeBothSliderFocuses(true);
    this._sliderRangeContainElm.title = this.sliderType === 'double' ? `${sliderLeftVal} - ${sliderRightVal}` : `${sliderRightVal}`;

    //  left or right value should never be above each others
    // override the min value with max when then happens (or the inverse)
    if (this.sliderType === 'double' && this._sliderLeftInputElm && this._sliderRightInputElm) {
      if (side === 'left' && sliderLeftVal > sliderRightVal) {
        this._sliderLeftInputElm.value = `${sliderRightVal}`;
        triggerEvent = false;
      } else if (side === 'right' && sliderLeftVal > sliderRightVal) {
        this._sliderRightInputElm.value = `${sliderLeftVal}`;
        triggerEvent = false;
      }
    }

    const hideSliderNumbers =
      (this.filterOptions as SliderOption)?.hideSliderNumber ?? (this.filterOptions as SliderRangeOption)?.hideSliderNumbers;
    if (!hideSliderNumbers) {
      if (this._leftSliderNumberElm?.textContent) {
        this._leftSliderNumberElm.textContent = this._sliderLeftInputElm?.value ?? '';
      }
      if (this._rightSliderNumberElm?.textContent) {
        this._rightSliderNumberElm.textContent = this._sliderRightInputElm?.value ?? '';
      }
    }

    // does the user also want to trigger the filter while sliding?
    if (this.filterOptions.filterWhileSliding) {
      this.onValueChanged(e);
    }

    // also trigger mouse enter event on the filter in case a SlickCustomTooltip is attached
    if (triggerEvent && !skipTriggerEvent) {
      this.grid.onHeaderRowMouseEnter.notify({ column: this.columnDef, grid: this.grid }, new SlickEventData(e));
    }
  }

  protected sliderTrackClicked(e: MouseEvent): void {
    e.preventDefault();
    const sliderTrackX = e.offsetX;
    const sliderTrackWidth = this._sliderTrackElm.offsetWidth;
    const trackPercentPosition = ((sliderTrackX + 0) * 100) / sliderTrackWidth;

    if (this._sliderRightInputElm && this.sliderType !== 'double') {
      // when slider is compound/single, we'll automatically move to calculated clicked percentage
      // dispatch a change event to update its value & number when shown
      this._sliderRightInputElm.value = `${trackPercentPosition}`;
      this._sliderRightInputElm.dispatchEvent(new Event('change'));
    } else {
      // when tracker position is below 50% we'll auto-place the left slider thumb or else auto-place right slider thumb
      if (this._sliderLeftInputElm && this._sliderRightInputElm) {
        if (trackPercentPosition <= 50) {
          this._sliderLeftInputElm.value = `${trackPercentPosition}`;
          this._sliderLeftInputElm.dispatchEvent(new Event('change'));
        } else {
          this._sliderRightInputElm.value = `${trackPercentPosition}`;
          this._sliderRightInputElm.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  protected updateTrackFilledColorWhenEnabled(): void {
    if ((this.filterOptions as SliderRangeOption)?.enableSliderTrackColoring && this._sliderRightInputElm) {
      let percent1 = 0;
      if (this._sliderLeftInputElm) {
        percent1 =
          ((+this._sliderLeftInputElm.value - +this._sliderLeftInputElm.min) /
            (this.sliderOptions?.maxValue ?? 0 - +this._sliderLeftInputElm.min)) *
          100;
      }
      const percent2 =
        ((+this._sliderRightInputElm.value - +this._sliderRightInputElm.min) /
          (this.sliderOptions?.maxValue ?? 0 - +this._sliderRightInputElm.min)) *
        100;

      // prettier-ignore
      const bg = 'linear-gradient(to right, %b %p1, %c %p1, %c %p2, %b %p2)'
        .replace(/%b/g, '#eee')
        .replace(/%c/g, (this.filterOptions as SliderRangeOption)?.sliderTrackFilledColor || this._sliderTrackFilledColor || DEFAULT_SLIDER_TRACK_FILLED_COLOR)
        .replace(/%p1/g, `${percent1}%`)
        .replace(/%p2/g, `${percent2}%`);

      this._sliderTrackElm.style.background = bg;
      this._sliderOptions.sliderTrackBackground = bg;
    }
  }

  /** add/remove "filled" CSS class */
  protected updateFilterStyle(isFilled: boolean): void {
    this._divContainerFilterElm.classList.toggle('filled', isFilled);
    this._filterElm?.classList.toggle('filled', isFilled);
  }
}
