import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, type SlickGrid } from '../../core/index.js';
import type { Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { Filters } from '../filters.index.js';
import { SingleSliderFilter } from '../singleSliderFilter.js';

const containerId = 'demo-container';
vi.useFakeTimers();

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
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

describe('SingleSliderFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: SingleSliderFilter;
  let filterArgs: FilterArguments;
  let spyGetHeaderRow: any;
  let mockColumn: Column;

  beforeEach(() => {
    vi.clearAllMocks();
    translateService = new TranslateServiceStub();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.slider } };
    filterArgs = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new SingleSliderFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should initialize the filter', () => {
    filter.init(filterArgs);
    const filterCount = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.currentValue).toBeUndefined();
  });

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArgs);
    const filterInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Duration Search Filter');
  });

  it('should call "setValues" and expect that value, converted as a number, to be in the callback when triggered', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const rowMouseLeaveSpy = vi.spyOn(gridStub.onHeaderRowMouseLeave, 'notify');

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenLastCalledWith(new Event('change'), { columnDef: mockColumn, operator: 'GE', searchTerms: [2], shouldTriggerQuery: true });
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
    expect(rowMouseLeaveSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub });
  });

  it('should trigger an slider input change event and expect slider value to be updated and also "onHeaderRowMouseEnter" to be notified', () => {
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('input'));

    expect(filterNumberElm.textContent).toBe('2');
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should call "setValues" and expect that value, converted as a number, to be in the callback when triggered', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.setValues(3);
    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('change'));
    const mockEvent = new Event('change');
    Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: { value: '13' } });
    filterElm.dispatchEvent(mockEvent);
    const filterFilledElms = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(callbackSpy).toHaveBeenLastCalledWith(new Event('change'), { columnDef: mockColumn, operator: 'GE', searchTerms: [3], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArgs);
    filter.setValues(9);
    let filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration') as HTMLInputElement;

    expect(filledInputElm.classList.contains('filled')).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration') as HTMLInputElement;
    expect(filledInputElm.classList.contains('filled')).toBeFalsy();
  });

  it('should create the input filter with default search terms range when passed as a filter argument', () => {
    filterArgs.searchTerms = [3];

    filter.init(filterArgs);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterNumberElm.textContent).toBe('3');
    expect(filter.getValues()).toEqual(3);
  });

  it('should create the input filter with default search terms and a different step size when "valueStep" is provided', () => {
    filterArgs.searchTerms = [15];
    mockColumn.filter!.valueStep = 5;

    filter.init(filterArgs);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.step).toBe('5');
    expect(filterNumberElm.textContent).toBe('15');
    expect(filter.getValues()).toEqual(15);
  });

  it('should create the input filter with min slider values being set by filter "minValue"', () => {
    mockColumn.filter = {
      minValue: 4,
      maxValue: 69,
    };

    filter.init(filterArgs);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with min/max slider values being set by filter "sliderStartValue" and "sliderEndValue" through the filter params', () => {
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArgs);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with min/max slider values being set by filter "sliderStartValue" and "sliderEndValue" through the filter params', () => {
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArgs);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with default search terms range but without showing side numbers when "hideSliderNumber" is set in params', () => {
    filterArgs.searchTerms = [3];
    mockColumn.filter!.options = { hideSliderNumber: true };

    filter.init(filterArgs);

    const filterNumberElms = divContainer.querySelectorAll<HTMLInputElement>('.input-group-text');

    expect(filterNumberElms.length).toBe(0);
    expect(filter.getValues()).toEqual(3);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArgs.searchTerms = [3];
    const callbackSpy = vi.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.clear();

    expect(filter.getValues()).toBe(0);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArgs.searchTerms = [3];
    const callbackSpy = vi.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toBe(0);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min slider values being with values of "sliderStartValue" when defined through the filter params', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toEqual(4);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min slider values being with values of "sliderStartValue" when defined through the filter params', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');
    mockColumn.filter = {
      options: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      },
    };

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toEqual(4);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should NOT trigger "onHeaderRowMouseEnter" event when calling clear() method since it is a programmatic change', () => {
    filterArgs.searchTerms = [3];

    filter.init(filterArgs);
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.clear();

    expect(filter.getValues()).toBe(0);
    expect(rowMouseEnterSpy).not.toHaveBeenCalled();
  });

  it('should trigger "onHeaderRowMouseEnter" event when user interacts with slider via input event', () => {
    const rowMouseEnterSpy = vi.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

    filter.init(filterArgs);
    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    filterElm.value = '15';
    filterElm.dispatchEvent(new Event('input'));

    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should enableSliderTrackColoring and trigger a change event and expect slider track to have background color', () => {
    mockColumn.filter = { options: { enableSliderTrackColoring: true } };
    filter.init(filterArgs);
    filter.setValues(['80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new Event('change'));

    expect(filter.sliderOptions?.sliderTrackBackground).toBe('linear-gradient(to right, #eee 0%, #86bff8 0%, #86bff8 80%, #eee 80%)');
  });

  it('should execute filter callback when filterWhileSliding is enabled and we only triggered an input event', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');

    mockColumn.filter = { options: { filterWhileSliding: true } };
    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('input'));

    expect(filterNumberElm.textContent).toBe('2');

    expect(callbackSpy).toHaveBeenLastCalledWith(expect.any(Event), {
      columnDef: mockColumn,
      operator: 'GE',
      searchTerms: [2],
      shouldTriggerQuery: true,
    });
  });

  it('should NOT execute filter callback when filterWhileSliding is disabled and we only triggered an input event', () => {
    const callbackSpy = vi.spyOn(filterArgs, 'callback');

    mockColumn.filter = { options: { filterWhileSliding: false } };
    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('input'));

    expect(filterNumberElm.textContent).toBe('2');

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('should click on the slider track and expect handle to move to the new position', () => {
    filter.init(filterArgs);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    const sliderRightChangeSpy = vi.spyOn(sliderInputs[0], 'dispatchEvent');

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 56 });
    Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 75 });
    sliderTrackElm.dispatchEvent(clickEvent);

    expect(sliderRightChangeSpy).toHaveBeenCalled();
  });

  describe('keydown event', () => {
    it('should decrease slider number value and tooltip when using ArrowLeft keydown with "useArrowToSlide" undefined', () => {
      const leftValue = 4;
      const callbackSpy = vi.spyOn(filterArgs, 'callback');
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: 69,
          useArrowToSlide: undefined,
        },
      };

      filter.init(filterArgs);

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');

      const mockEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      const prevDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropSpy = vi.spyOn(mockEvent, 'stopPropagation');

      sliderInputs[0].dispatchEvent(mockEvent);

      expect(callbackSpy).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), {
        columnDef: mockColumn,
        operator: 'GE',
        searchTerms: [leftValue - 1],
        shouldTriggerQuery: true,
      });
      expect(prevDefaultSpy).toHaveBeenCalled();
      expect(stopPropSpy).toHaveBeenCalled();
    });

    it('should increase slider number value and tooltip when using ArrowRight keydown with "useArrowToSlide" enabled', () => {
      const callbackSpy = vi.spyOn(filterArgs, 'callback');
      const leftValue = 4;
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: 69,
          useArrowToSlide: true,
        },
      };

      filter.init(filterArgs);

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');

      const mockEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      const prevDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
      const stopPropSpy = vi.spyOn(mockEvent, 'stopPropagation');

      sliderInputs[0].dispatchEvent(mockEvent);

      expect(callbackSpy).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), {
        columnDef: mockColumn,
        operator: 'GE',
        searchTerms: [leftValue + 1],
        shouldTriggerQuery: true,
      });
      expect(prevDefaultSpy).toHaveBeenCalled();
      expect(stopPropSpy).toHaveBeenCalled();
    });

    it('should not decrease or increase slider number value when "useArrowToSlide" is disabled', () => {
      const callbackSpy = vi.spyOn(filterArgs, 'callback');
      const leftValue = 4;
      mockColumn.filter = {
        options: {
          sliderStartValue: leftValue,
          sliderEndValue: 69,
          useArrowToSlide: false,
        },
      };

      filter.init(filterArgs);

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
