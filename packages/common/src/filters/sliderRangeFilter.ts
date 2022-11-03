import { toSentenceCase } from '@slickgrid-universal/utils';

import { Constants } from '../constants';
import { OperatorString, OperatorType, SearchTerm, } from '../enums/index';
import {
  Column,
  ColumnFilter,
  Filter,
  FilterArguments,
  FilterCallback,
  GridOption,
  SlickGrid,
  SlickNamespace,
  SliderRangeOption,
} from '../interfaces/index';
import { BindingEventService } from '../services/bindingEvent.service';
import { createDomElement, emptyElement } from '../services/domUtilities';

interface CurrentSliderOption {
  minValue: number;
  maxValue: number;
  step: number;
  sliderTrackBackground?: string;
}

declare const Slick: SlickNamespace;
const GAP_BETWEEN_SLIDER_HANDLES = 0;
const Z_INDEX_MIN_GAP = 20; // gap in Px before we change z-index so that lowest/highest handle doesn't block each other

/** A Slider Range Filter written in pure JS, this is only meant to be used as a range filter (with 2 handles lowest & highest values) */
export class SliderRangeFilter implements Filter {
  protected _bindEventService: BindingEventService;
  protected _clearFilterTriggered = false;
  protected _currentValues?: number[];
  protected _shouldTriggerQuery = true;
  protected _sliderOptions!: CurrentSliderOption;
  protected filterElm!: HTMLDivElement;
  protected _argFilterContainerElm!: HTMLDivElement;
  protected _divContainerFilterElm!: HTMLDivElement;
  protected _filterContainerElm!: HTMLDivElement;
  protected _leftSliderNumberElm?: HTMLSpanElement;
  protected _rightSliderNumberElm?: HTMLSpanElement;
  protected _sliderRangeContainElm!: HTMLDivElement;
  protected _sliderTrackElm!: HTMLDivElement;
  protected _sliderLeftElm!: HTMLInputElement;
  protected _sliderRightElm!: HTMLInputElement;
  grid!: SlickGrid;
  searchTerms: SearchTerm[] = [];
  columnDef!: Column;
  callback!: FilterCallback;

  constructor() {
    this._bindEventService = new BindingEventService();
  }

  /** @deprecated Getter for the Filter Generic Params */
  protected get filterParams(): any {
    return this.columnDef?.filter?.params ?? {};
  }

  /** Getter for the Filter Options */
  get filterOptions(): SliderRangeOption | undefined {
    return this.columnFilter.filterOptions;
  }

  /** Getter for the Column Filter */
  get columnFilter(): ColumnFilter {
    return this.columnDef?.filter ?? {};
  }

  /** Getter for the Current Slider Values */
  get currentValues(): number[] | undefined {
    return this._currentValues;
  }

  /** Getter to know what would be the default operator when none is specified */
  get defaultOperator(): OperatorType | OperatorString {
    return this.gridOptions.defaultFilterRangeOperator || OperatorType.rangeInclusive;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  /** Getter for the current Slider Options */
  get sliderRangeOptions(): CurrentSliderOption | undefined {
    return this._sliderOptions;
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
    this._argFilterContainerElm = args.filterContainerElm;

    // step 1, create the DOM Element of the filter & initialize it if searchTerm is filled
    this.filterElm = this.createDomFilterElement(this.searchTerms);
  }

  /**
   * Clear the filter value
   */
  clear(shouldTriggerQuery = true) {
    if (this.filterElm) {
      this._clearFilterTriggered = true;
      this._shouldTriggerQuery = shouldTriggerQuery;
      this.searchTerms = [];
      const lowestValue = (this.getFilterOptionByName('sliderStartValue') ?? Constants.SLIDER_DEFAULT_MIN_VALUE) as number;
      const highestValue = (this.getFilterOptionByName('sliderEndValue') ?? Constants.SLIDER_DEFAULT_MAX_VALUE) as number;
      this._currentValues = [lowestValue, highestValue];
      this._sliderLeftElm.value = `${lowestValue}`;
      this._sliderRightElm.value = `${highestValue}`;
      this.dispatchBothEvents();

      if (!this.getFilterOptionByName('hideSliderNumbers')) {
        this.renderSliderValues(lowestValue, highestValue);
      }
      this._divContainerFilterElm.classList.remove('filled');
      this.filterElm.classList.remove('filled');
      this.callback(undefined, { columnDef: this.columnDef, clearFilterTriggered: true, shouldTriggerQuery });
    }
  }

  /**
   * destroy the filter
   */
  destroy() {
    this._bindEventService.unbindAll();
  }

  /**
   * Get option from filter.params PR filter.filterOptions
   * @deprecated this should be removed when slider filterParams are replaced by filterOptions
   */
  getFilterOptionByName<T extends string | number | boolean>(optionName: string, defaultValue?: string | number | boolean): T {
    let outValue: string | number | boolean | undefined;
    if (this.filterOptions?.[optionName as keyof SliderRangeOption] !== undefined) {
      outValue = this.filterOptions[optionName as keyof SliderRangeOption];
    } else if (this.filterParams?.[optionName] !== undefined) {
      console.warn('[Slickgrid-Universal] All filter.params were moved, and deprecated, to "filterOptions" as SliderRangeOption for better typing support.');
      outValue = this.filterParams?.[optionName];
    }
    return outValue as T ?? defaultValue ?? undefined;
  }

  /**
   * Render both slider values (low/high) on screen
   * @param lowestValue number
   * @param highestValue number
   */
  renderSliderValues(lowestValue: number | string, highestValue: number | string) {
    if (this._leftSliderNumberElm?.textContent) {
      this._leftSliderNumberElm.textContent = lowestValue.toString();
    }
    if (this._rightSliderNumberElm?.textContent) {
      this._rightSliderNumberElm.textContent = highestValue.toString();
    }
  }

  getValues() {
    return this._currentValues;
  }

  /**
   * Set value(s) on the DOM element
   * @params searchTerms
   */
  setValues(searchTerms: SearchTerm | SearchTerm[], operator?: OperatorType | OperatorString) {
    if (searchTerms) {
      let sliderValues: number[] | string[] = [];

      // get the slider values, if it's a string with the "..", we'll do the split else we'll use the array of search terms
      if (typeof searchTerms === 'string' || (Array.isArray(searchTerms) && typeof searchTerms[0] === 'string') && (searchTerms[0] as string).indexOf('..') > 0) {
        sliderValues = (typeof searchTerms === 'string') ? [(searchTerms as string)] : (searchTerms[0] as string).split('..');
      } else if (Array.isArray(searchTerms)) {
        sliderValues = searchTerms as string[];
      }

      if (Array.isArray(sliderValues) && sliderValues.length === 2) {
        if (!this.getFilterOptionByName('hideSliderNumbers')) {
          const [lowestValue, highestValue] = sliderValues;
          this._sliderLeftElm.value = String(lowestValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE);
          this._sliderRightElm.value = String(highestValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE);
          this.renderSliderValues(sliderValues[0], sliderValues[1]);
        }
      }
    }

    (searchTerms && (this.getValues?.() ?? []).length > 0)
      ? this.filterElm.classList.add('filled')
      : this.filterElm.classList.remove('filled');

    // set the operator when defined
    this.operator = operator || this.defaultOperator;
  }

  /**
   * Create the Filter DOM element
   * Follows article with few modifications (without tooltip & neither slider track color)
   * https://codingartistweb.com/2021/06/double-range-slider-html-css-javascript/
   * @param searchTerm optional preset search terms
   */
  protected createDomFilterElement(searchTerms?: SearchTerm | SearchTerm[]) {
    const columnId = this.columnDef?.id ?? '';
    const minValue = +(this.columnFilter?.minValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE);
    const maxValue = +(this.columnFilter?.maxValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE);
    const step = +(this.columnFilter?.valueStep ?? Constants.SLIDER_DEFAULT_STEP);
    emptyElement(this._argFilterContainerElm);

    let defaultStartValue: number = Constants.SLIDER_DEFAULT_MIN_VALUE;
    let defaultEndValue: number = Constants.SLIDER_DEFAULT_MAX_VALUE;
    if (Array.isArray(searchTerms) && searchTerms.length > 1) {
      defaultStartValue = +searchTerms[0];
      defaultEndValue = +searchTerms[1];
    } else {
      defaultStartValue = +(this.getFilterOptionByName('sliderStartValue') ?? minValue);
      defaultEndValue = +(this.getFilterOptionByName('sliderEndValue') ?? maxValue);
    }

    this._sliderRangeContainElm = createDomElement('div', { className: `filter-input filter-${columnId} slider-range-container slider-values` });
    this._sliderRangeContainElm.title = `${defaultStartValue} - ${defaultEndValue}`;

    this._sliderTrackElm = createDomElement('div', { className: 'slider-track' });
    this._sliderLeftElm = createDomElement('input', {
      type: 'range',
      className: `slider-filter-input`,
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      defaultValue: `${defaultStartValue}`, value: `${defaultStartValue}`,
      min: `${minValue}`, max: `${maxValue}`, step: `${step}`,
    });
    this._sliderRightElm = createDomElement('input', {
      type: 'range',
      className: `slider-filter-input`,
      ariaLabel: this.columnFilter?.ariaLabel ?? `${toSentenceCase(columnId + '')} Search Filter`,
      defaultValue: `${defaultEndValue}`, value: `${defaultEndValue}`,
      min: `${minValue}`, max: `${maxValue}`, step: `${step}`,
    });

    this._bindEventService.bind(this._sliderTrackElm, 'click', this.sliderTrackClicked.bind(this) as EventListener);
    this._bindEventService.bind(this._sliderLeftElm, ['input', 'change'], this.slideLeftInputChanged.bind(this));
    this._bindEventService.bind(this._sliderRightElm, ['input', 'change'], this.slideRightInputChanged.bind(this));
    this._bindEventService.bind(this._sliderLeftElm, ['change', 'mouseup', 'touchend'], this.onValueChanged.bind(this) as EventListener);
    this._bindEventService.bind(this._sliderRightElm, ['change', 'mouseup', 'touchend'], this.onValueChanged.bind(this) as EventListener);

    // create the DOM element
    const sliderNumberClass = this.getFilterOptionByName('hideSliderNumbers') ? '' : 'input-group';
    this._divContainerFilterElm = createDomElement('div', { className: `${sliderNumberClass} search-filter slider-container slider-values filter-${columnId}`.trim() });

    this._sliderRangeContainElm.append(this._sliderTrackElm);
    this._sliderRangeContainElm.append(this._sliderLeftElm);
    this._sliderRangeContainElm.append(this._sliderRightElm);

    if (this.getFilterOptionByName('hideSliderNumbers')) {
      this._divContainerFilterElm.append(this._sliderRangeContainElm);
    } else {
      const lowestSliderContainerDivElm = createDomElement('div', { className: `input-group-addon input-group-prepend slider-range-value` });
      this._leftSliderNumberElm = createDomElement('span', { className: `input-group-text lowest-range-${columnId}`, textContent: `${defaultStartValue}` });
      lowestSliderContainerDivElm.append(this._leftSliderNumberElm);

      const highestSliderContainerDivElm = createDomElement('div', { className: `input-group-addon input-group-append slider-range-value` });
      this._rightSliderNumberElm = createDomElement('span', { className: `input-group-text highest-range-${columnId}`, textContent: `${defaultEndValue}` });
      highestSliderContainerDivElm.append(this._rightSliderNumberElm);

      this._divContainerFilterElm.append(lowestSliderContainerDivElm);
      this._divContainerFilterElm.append(this._sliderRangeContainElm);
      this._divContainerFilterElm.append(highestSliderContainerDivElm);
    }

    // if we are preloading searchTerms, we'll keep them for reference
    this._currentValues = [defaultStartValue, defaultEndValue];

    // merge options with optional user's custom options
    this._sliderOptions = { minValue, maxValue, step };

    // if there's a search term, we will add the "filled" class for styling purposes
    if (Array.isArray(searchTerms) && searchTerms.length > 0 && searchTerms[0] !== '') {
      this._divContainerFilterElm.classList.add('filled');
    }

    // append the new DOM element to the header row
    this._argFilterContainerElm.append(this._divContainerFilterElm);
    this.updateTrackFilledColor();

    return this._divContainerFilterElm;
  }

  protected dispatchBothEvents() {
    this._sliderLeftElm.dispatchEvent(new Event('change'));
    this._sliderRightElm.dispatchEvent(new Event('change'));
  }

  /** handle value change event triggered, trigger filter callback & update "filled" class name */
  protected onValueChanged(e: MouseEvent) {
    const sliderLeftVal = parseInt(this._sliderLeftElm.value, 10);
    const sliderRightVal = parseInt(this._sliderRightElm.value, 10);
    const values = [sliderLeftVal, sliderRightVal];
    const value = values.join('..');

    if (this._clearFilterTriggered) {
      this.filterElm.classList.remove('filled');
      this.callback(e, { columnDef: this.columnDef, clearFilterTriggered: this._clearFilterTriggered, shouldTriggerQuery: this._shouldTriggerQuery });
    } else {
      value === '' ? this.filterElm.classList.remove('filled') : this.filterElm.classList.add('filled');
      this.callback(e, { columnDef: this.columnDef, operator: this.operator, searchTerms: values, shouldTriggerQuery: this._shouldTriggerQuery });
    }
    // reset both flags for next use
    this._clearFilterTriggered = false;
    this._shouldTriggerQuery = true;
    this.changeBothSliderFocuses(false);

    // trigger mouse enter event on the filter for optionally hooked SlickCustomTooltip
    // the minimum requirements for tooltip to work are the columnDef and targetElement
    setTimeout(() => this.grid.onHeaderRowMouseEnter.notify(
      { column: this.columnDef, grid: this.grid },
      { ...new Slick.EventData(), target: this._argFilterContainerElm }
    ));
  }

  protected changeBothSliderFocuses(isAddingFocus: boolean) {
    const addRemoveCmd = isAddingFocus ? 'add' : 'remove';
    this._sliderLeftElm.classList[addRemoveCmd]('focus');
    this._sliderRightElm.classList[addRemoveCmd]('focus');
  }

  protected slideLeftInputChanged() {
    const sliderLeftVal = parseInt(this._sliderLeftElm.value, 10);
    const sliderRightVal = parseInt(this._sliderRightElm.value, 10);

    if (sliderRightVal - sliderLeftVal <= this.getFilterOptionByName<number>('stopGapBetweenSliderHandles', GAP_BETWEEN_SLIDER_HANDLES)) {
      this._sliderLeftElm.value = String(sliderLeftVal - this.getFilterOptionByName<number>('stopGapBetweenSliderHandles', GAP_BETWEEN_SLIDER_HANDLES));
    }

    this._sliderRangeContainElm.title = `${sliderLeftVal} - ${sliderRightVal}`;

    // change which handle has higher z-index to make them still usable,
    // ie when left handle reaches the end, it has to have higher z-index or else it will be stuck below
    // and we cannot move right because it cannot go below min value
    if (+this._sliderLeftElm.value >= +this._sliderRightElm.value - Z_INDEX_MIN_GAP) {
      this._sliderLeftElm.style.zIndex = '1';
      this._sliderRightElm.style.zIndex = '0';
    } else {
      this._sliderLeftElm.style.zIndex = '0';
      this._sliderRightElm.style.zIndex = '1';
    }

    this.updateTrackFilledColor();
    this.changeBothSliderFocuses(true);
    if (!this.getFilterOptionByName('hideSliderNumbers') && this._leftSliderNumberElm?.textContent) {
      this._leftSliderNumberElm.textContent = this._sliderLeftElm.value;
    }

  }

  protected slideRightInputChanged() {
    const sliderLeftVal = parseInt(this._sliderLeftElm.value, 10);
    const sliderRightVal = parseInt(this._sliderRightElm.value, 10);

    if (sliderRightVal - sliderLeftVal <= this.getFilterOptionByName<number>('stopGapBetweenSliderHandles', GAP_BETWEEN_SLIDER_HANDLES)) {
      this._sliderRightElm.value = String(sliderLeftVal + this.getFilterOptionByName<number>('stopGapBetweenSliderHandles', GAP_BETWEEN_SLIDER_HANDLES));
    }

    this.updateTrackFilledColor();
    this.changeBothSliderFocuses(true);
    this._sliderRangeContainElm.title = `${sliderLeftVal} - ${sliderRightVal}`;

    if (!this.getFilterOptionByName('hideSliderNumbers') && this._rightSliderNumberElm?.textContent) {
      this._rightSliderNumberElm.textContent = this._sliderRightElm.value;
    }
  }

  protected sliderTrackClicked(e: MouseEvent) {
    e.preventDefault();
    const sliderTrackX = e.offsetX;
    const sliderTrackWidth = this._sliderTrackElm.offsetWidth;
    const trackPercentPosition = (sliderTrackX + 0) * 100 / sliderTrackWidth;

    // when tracker position is below 50% we'll auto-place the left slider thumb or else auto-place right slider thumb
    if (trackPercentPosition <= 50) {
      this._sliderLeftElm.value = `${trackPercentPosition}`;
      this._sliderLeftElm.dispatchEvent(new Event('change'));
    } else {
      this._sliderRightElm.value = `${trackPercentPosition}`;
      this._sliderRightElm.dispatchEvent(new Event('change'));
    }
  }

  protected updateTrackFilledColor() {
    if (this.getFilterOptionByName('enableSliderTrackColoring')) {
      const percent1 = ((+this._sliderLeftElm.value - +this._sliderLeftElm.min) / (this.sliderRangeOptions?.maxValue ?? 0 - +this._sliderLeftElm.min)) * 100;
      const percent2 = ((+this._sliderRightElm.value - +this._sliderRightElm.min) / (this.sliderRangeOptions?.maxValue ?? 0 - +this._sliderRightElm.min)) * 100;
      const bg = 'linear-gradient(to right, %b %p1, %c %p1, %c %p2, %b %p2)'
        .replace(/%b/g, '#eee')
        .replace(/%c/g, (this.getFilterOptionByName('sliderTrackFilledColor') ?? 'var(--slick-slider-filter-thumb-color, #86bff8)') as string)
        .replace(/%p1/g, `${percent1}%`)
        .replace(/%p2/g, `${percent2}%`);

      this._sliderTrackElm.style.background = bg;
      this._sliderOptions.sliderTrackBackground = bg;
    }
  }
}
