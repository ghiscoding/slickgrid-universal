import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, type SlickGrid } from '../../core/index.js';
import type { Column, FilterArguments, GridOption, SliderRangeOption } from '../../interfaces/index.js';
import { Filters } from '../filters.index.js';
import { SliderRangeFilter } from '../sliderRangeFilter.js';

const containerId = 'demo-container';
vi.useFakeTimers();

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

let gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
  onHeaderMouseLeave: new SlickEvent(),
  onHeaderRowMouseEnter: new SlickEvent(),
  onHeaderRowMouseLeave: new SlickEvent(),
} as unknown as SlickGrid;

describe('SliderRangeFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: SliderRangeFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow: any;
  let mockColumn: Column;

  beforeEach(() => {
    vi.clearAllMocks();
    translateService = new TranslateServiceStub();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.sliderRange } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };
    gridOptionMock = {
      enableFiltering: true,
      enableFilterTrimWhiteSpace: true,
    };

    filter = new SliderRangeFilter(translateService);
  });

  afterEach(() => {
    vi.resetAllMocks();
    filter.destroy();
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should initialize the filter with slider value define in user filter options', () => {
    mockColumn.filter!.options = { sliderStartValue: 1 } as SliderRangeOption;
    filter.init(filterArguments);

    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    expect(filterElm.defaultValue).toBe('1');
    expect(filterElm.value).toBe('1');
  });

  it('should initialize the filter with slider value define in user filter options', () => {
    mockColumn.filter!.options = { sliderStartValue: 1 } as SliderRangeOption;
    filter.init(filterArguments);

    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    expect(filterElm.defaultValue).toBe('1');
    expect(filterElm.value).toBe('1');
  });

  it('should initialize the filter with slider value define in global default user filter options', () => {
    gridOptionMock.defaultFilterOptions = {
      slider: { sliderStartValue: 2 },
    };
    filter.init(filterArguments);

    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    expect(filterElm.defaultValue).toBe('2');
    expect(filterElm.value).toBe('2');
  });

  it('should be able to retrieve default slider options through the Getter', () => {
    filter.init(filterArguments);

    expect(filter.sliderOptions).toEqual({
      maxValue: 100,
      minValue: 0,
      step: 1,
    });
  });

  it('should be able to retrieve slider options defined through the Getter when passing different filter options', () => {
    mockColumn.filter = {
      minValue: 4,
      maxValue: 69,
      valueStep: 5,
    };
    filter.init(filterArguments);

    expect(filter.sliderOptions).toEqual({
      maxValue: 69,
      minValue: 4,
      step: 5,
    });
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const rowMouseLeaveSpy = vi.spyOn(gridStub.onHeaderRowMouseLeave, 'notify');

    filter.init(filterArguments);
    filter.setValues(['2..80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'RangeInclusive',
      searchTerms: [2, 80],
      shouldTriggerQuery: true,
    });
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
    expect(rowMouseLeaveSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub });
  });

  it('should trigger an slider input change event and expect slider value to be updated and also "onHeaderRowMouseEnter" to be notified', () => {
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.init(filterArguments);
    filter.setValues([2, 80]);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('input'));

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterLowestElm.textContent).toBe('2');
    expect(filterHighestElm.textContent).toBe('80');
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should not have min value above max value when sliding right', () => {
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.init(filterArguments);
    filter.setValues([32, 25]);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('input'));

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterElms[0].value).toBe('25');
    expect(filterElms[1].value).toBe('25');
    expect(filterLowestElm.textContent).toBe('25');
    expect(filterHighestElm.textContent).toBe('25');
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should not have max value above min value when sliding left', () => {
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.init(filterArguments);
    filter.setValues([32, 25]);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[1].dispatchEvent(new CustomEvent('input'));

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterElms[0].value).toBe('32');
    expect(filterElms[1].value).toBe('32');
    expect(filterLowestElm.textContent).toBe('32');
    expect(filterHighestElm.textContent).toBe('32');
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues([3, 84]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].style.zIndex).toBe('0');
    expect(sliderInputs[1].style.zIndex).toBe('1');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'RangeInclusive',
      searchTerms: [3, 84],
      shouldTriggerQuery: true,
    });
  });

  it('should change z-index on left handle when it is by 20px near right handle so it shows over the right handle not below', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues([50, 63]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].style.zIndex).toBe('1');
    expect(sliderInputs[1].style.zIndex).toBe('0');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'RangeInclusive',
      searchTerms: [50, 63],
      shouldTriggerQuery: true,
    });
  });

  it('should change minValue to a lower value when it is to close to maxValue and "stopGapBetweenSliderHandles" is enabled so it will auto-change minValue to a lower value plus gap', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');
    const minVal = 56;
    const maxVal = 58;

    mockColumn.filter = {
      options: { stopGapBetweenSliderHandles: 5 },
    };
    filter.init(filterArguments);
    filter.setValues([minVal, maxVal]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].value).toBe(`${minVal - 5}`);
    expect(sliderInputs[1].value).toBe('58');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'RangeInclusive',
      searchTerms: [51, 58],
      shouldTriggerQuery: true,
    });
  });

  it('should change maxValue to a lower value when it is to close to minValue and "stopGapBetweenSliderHandles" is enabled so it will auto-change maxValue to a lower value plus gap', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');
    const minVal = 56;
    const maxVal = 58;

    mockColumn.filter = {
      options: { stopGapBetweenSliderHandles: 5 },
    };
    filter.init(filterArguments);
    filter.setValues([minVal, maxVal]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[1].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].value).toBe('56');
    expect(sliderInputs[1].value).toBe(`${minVal + 5}`);
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), {
      columnDef: mockColumn,
      operator: 'RangeInclusive',
      searchTerms: [56, 61],
      shouldTriggerQuery: true,
    });
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArguments);
    filter.setValues([3, 80]);
    let filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration') as HTMLInputElement;

    expect(filledInputElm.classList.contains('filled')).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration') as HTMLInputElement;
    expect(filledInputElm.classList.contains('filled')).toBeFalsy();
  });

  it('should create the input filter with default search terms range when passed as a filter argument', () => {
    filterArguments.searchTerms = [3, 80];

    filter.init(filterArguments);

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterLowestElm.textContent).toBe('3');
    expect(filterHighestElm.textContent).toBe('80');
    expect(filter.currentValues).toEqual([3, 80]);
  });

  it('should create the input filter with min/max slider values being set by filter "minValue" and "maxValue"', () => {
    mockColumn.filter = {
      minValue: 4,
      maxValue: 69,
    };

    filter.init(filterArguments);

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterLowestElm.textContent).toBe('4');
    expect(filterHighestElm.textContent).toBe('69');
    expect(filter.currentValues).toEqual([4, 69]);
  });

  it('should create the input filter with min/max slider values being set by filter "sliderStartValue" and "sliderEndValue" through the filter options', () => {
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArguments);

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterLowestElm.textContent).toBe('4');
    expect(filterHighestElm.textContent).toBe('69');
    expect(filter.currentValues).toEqual([4, 69]);
  });

  it('should create the input filter with default search terms range but without showing side numbers when "hideSliderNumbers" is set in options', () => {
    filterArguments.searchTerms = [3, 80];
    mockColumn.filter!.options = { hideSliderNumbers: true };

    filter.init(filterArguments);

    const filterLowestElms = divContainer.querySelectorAll<HTMLInputElement>('.lowest-range-duration');
    const filterHighestElms = divContainer.querySelectorAll<HTMLInputElement>('.highest-range-duration');

    expect(filterLowestElms.length).toBe(0);
    expect(filterHighestElms.length).toBe(0);
    expect(filter.currentValues).toEqual([3, 80]);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArguments.searchTerms = [3, 80];
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear();

    expect(filter.currentValues).toEqual([0, 100]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = [3, 80];
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear(false);

    expect(filter.currentValues).toEqual([0, 100]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min/max slider values being with values of "sliderStartValue" and "sliderEndValue" when defined through the options', () => {
    const callbackSpy = vi.spyOn(filterArguments, 'callback');
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArguments);
    filter.clear(false);

    expect(filter.currentValues).toEqual([4, 69]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should NOT trigger "onHeaderRowMouseEnter" event when calling clear() method since it is a programmatic change', () => {
    filterArguments.searchTerms = [3, 80];

    filter.init(filterArguments);
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.clear();

    expect(filter.currentValues).toEqual([0, 100]);
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should call slideLeftInputChanged with skipTriggerEvent=true when calling clear() on double slider', () => {
    filterArguments.searchTerms = [3, 80];
    filter.init(filterArguments);

    const slideLeftSpy = vi.spyOn(filter as any, 'slideLeftInputChanged');
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.clear();

    expect(slideLeftSpy).toHaveBeenCalledWith(expect.anything(), true);
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should call slideRightInputChanged with skipTriggerEvent=true when calling clear() on double slider', () => {
    filterArguments.searchTerms = [3, 80];
    filter.init(filterArguments);

    const slideRightSpy = vi.spyOn(filter as any, 'slideRightInputChanged');
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.clear();

    expect(slideRightSpy).toHaveBeenCalledWith(expect.anything(), true);
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should trigger callback with clearFilterTriggered flag when calling clear() with filterWhileSliding enabled', () => {
    mockColumn.filter = { operator: '>=', options: { filterWhileSliding: true } as SliderRangeOption };
    filterArguments.searchTerms = [3, 80];
    filter.init(filterArguments);

    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.clear();

    expect(filter.currentValues).toEqual([0, 100]);
    expect(callbackSpy).toHaveBeenCalledWith(expect.anything(), {
      columnDef: mockColumn,
      clearFilterTriggered: true,
      searchTerms: [],
      shouldTriggerQuery: true,
    });
  });

  it('should trigger "onHeaderRowMouseEnter" event when user interacts with left slider via input event', () => {
    filter.init(filterArguments);
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].value = '15';
    filterElms[0].dispatchEvent(new Event('input'));

    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should trigger "onHeaderRowMouseEnter" event when user interacts with right slider via input event', () => {
    filter.init(filterArguments);
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[1].value = '75';
    filterElms[1].dispatchEvent(new Event('input'));

    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should enableSliderTrackColoring and trigger a change event and expect slider track to have background color', () => {
    mockColumn.filter = { options: { enableSliderTrackColoring: true } };
    filter.init(filterArguments);
    filter.setValues(['2..80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(filter.sliderOptions?.sliderTrackBackground).toBe('linear-gradient(to right, #eee 2%, #86bff8 2%, #86bff8 80%, #eee 80%)');
  });

  it('should click on the slider track and expect left handle to move to the new position when calculated percent is below 50%', () => {
    filter.init(filterArguments);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    const sliderOneChangeSpy = vi.spyOn(sliderInputs[0], 'dispatchEvent');
    const sliderTwoChangeSpy = vi.spyOn(sliderInputs[1], 'dispatchEvent');

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 22 });
    Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 85 });
    sliderTrackElm.dispatchEvent(clickEvent);

    expect(sliderOneChangeSpy).toHaveBeenCalled();
    expect(sliderTwoChangeSpy).not.toHaveBeenCalled();
  });

  it('should click on the slider track and expect right handle to move to the new position when calculated percent is above 50%', () => {
    filter.init(filterArguments);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    const sliderOneChangeSpy = vi.spyOn(sliderInputs[0], 'dispatchEvent');
    const sliderTwoChangeSpy = vi.spyOn(sliderInputs[1], 'dispatchEvent');

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 56 });
    Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 75 });
    sliderTrackElm.dispatchEvent(clickEvent);

    expect(sliderOneChangeSpy).not.toHaveBeenCalled();
    expect(sliderTwoChangeSpy).toHaveBeenCalled();
  });

  describe('keydown event', () => {
    it('should decrease left slider number value and tooltip when using ArrowLeft keydown with "useArrowToSlide" undefined and calculated percent is above 50%', () => {
      const leftValue = 56;
      const rightValue = 69;
      const callbackSpy = vi.spyOn(filterArguments, 'callback');
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: 69,
          useArrowToSlide: undefined,
        },
      };

      filter.init(filterArguments);

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');

      const mockEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      const prevDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropSpy = vi.spyOn(mockEvent, 'stopPropagation');

      sliderInputs[0].dispatchEvent(mockEvent);

      expect(callbackSpy).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), {
        columnDef: mockColumn,
        operator: 'RangeInclusive',
        searchTerms: [leftValue - 1, rightValue],
        shouldTriggerQuery: true,
      });
      expect(prevDefaultSpy).toHaveBeenCalled();
      expect(stopPropSpy).toHaveBeenCalled();
    });

    it('should increase slider number value and tooltip when using ArrowRight keydown with "useArrowToSlide" enabled and calculated percent is above 50%', () => {
      const callbackSpy = vi.spyOn(filterArguments, 'callback');
      const leftValue = 56;
      const rightValue = 69;
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: rightValue,
          useArrowToSlide: true,
        },
      };

      filter.init(filterArguments);

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');

      const mockEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      const prevDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropSpy = vi.spyOn(mockEvent, 'stopPropagation');

      sliderInputs[0].dispatchEvent(mockEvent);

      expect(callbackSpy).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), {
        columnDef: mockColumn,
        operator: 'RangeInclusive',
        searchTerms: [leftValue + 1, rightValue],
        shouldTriggerQuery: true,
      });
      expect(prevDefaultSpy).toHaveBeenCalled();
      expect(stopPropSpy).toHaveBeenCalled();
    });

    it('should not decrease or increase slider number value when "useArrowToSlide" is disabled and calculated percent is above 50%', () => {
      const callbackSpy = vi.spyOn(filterArguments, 'callback');
      const leftValue = 56;
      const rightValue = 69;
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: rightValue,
          useArrowToSlide: false,
        },
      };

      filter.init(filterArguments);

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');

      const mockEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      const prevDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropSpy = vi.spyOn(mockEvent, 'stopPropagation');

      sliderInputs[0].dispatchEvent(mockEvent);

      expect(callbackSpy).not.toHaveBeenCalled();
      expect(prevDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropSpy).not.toHaveBeenCalled();
    });
  });
});
