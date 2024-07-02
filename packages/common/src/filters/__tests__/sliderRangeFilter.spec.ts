import { Filters } from '../filters.index';
import { Column, FilterArguments, GridOption, type SliderRangeOption } from '../../interfaces/index';
import { SlickEvent, SlickGrid } from '../../core/index';
import { SliderRangeFilter } from '../sliderRangeFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const containerId = 'demo-container';
jest.useFakeTimers();

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

let gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
  onHeaderMouseLeave: new SlickEvent(),
  onHeaderRowMouseEnter: new SlickEvent(),
  onHeaderRowMouseLeave: new SlickEvent(),
} as unknown as SlickGrid;

describe('SliderRangeFilter', () => {
  let translateService: TranslateServiceStub;
  let consoleSpy: any;
  let divContainer: HTMLDivElement;
  let filter: SliderRangeFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    consoleSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.sliderRange } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };
    gridOptionMock = {
      enableFiltering: true,
      enableFilterTrimWhiteSpace: true,
    };

    filter = new SliderRangeFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should initialize the filter with slider value define in user filter options', () => {
    mockColumn.filter!.filterOptions = { sliderStartValue: 1 } as SliderRangeOption;
    filter.init(filterArguments);

    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    expect(filterElm.defaultValue).toBe('1');
    expect(filterElm.value).toBe('1');
  });

  it('should initialize the filter with slider value define in global default user filter options', () => {
    gridOptionMock.defaultFilterOptions = {
      slider: { sliderStartValue: 2 }
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

  it('should be able to retrieve slider options defined through the Getter when passing different filterOptions', () => {
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
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const rowMouseLeaveSpy = jest.spyOn(gridStub.onHeaderRowMouseLeave, 'notify');

    filter.init(filterArguments);
    filter.setValues(['2..80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: [2, 80], shouldTriggerQuery: true });
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
    expect(rowMouseLeaveSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub });
  });

  it('should trigger an slider input change event and expect slider value to be updated and also "onHeaderRowMouseEnter" to be notified', () => {
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

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
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

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
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should not have max value above min value when sliding left', () => {
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');

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
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues([3, 84]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].style.zIndex).toBe('0');
    expect(sliderInputs[1].style.zIndex).toBe('1');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: [3, 84], shouldTriggerQuery: true });
  });

  it('should change z-index on left handle when it is by 20px near right handle so it shows over the right handle not below', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues([50, 63]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].style.zIndex).toBe('1');
    expect(sliderInputs[1].style.zIndex).toBe('0');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: [50, 63], shouldTriggerQuery: true });
  });

  it('should change minValue to a lower value when it is to close to maxValue and "stopGapBetweenSliderHandles" is enabled so it will auto-change minValue to a lower value plus gap', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    const minVal = 56;
    const maxVal = 58;

    mockColumn.filter = {
      filterOptions: { stopGapBetweenSliderHandles: 5 }
    };
    filter.init(filterArguments);
    filter.setValues([minVal, maxVal]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].value).toBe(`${minVal - 5}`);
    expect(sliderInputs[1].value).toBe('58');
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: [51, 58], shouldTriggerQuery: true });
  });

  it('should change maxValue to a lower value when it is to close to minValue and "stopGapBetweenSliderHandles" is enabled so it will auto-change maxValue to a lower value plus gap', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    const minVal = 56;
    const maxVal = 58;

    mockColumn.filter = {
      filterOptions: { stopGapBetweenSliderHandles: 5 }
    };
    filter.init(filterArguments);
    filter.setValues([minVal, maxVal]);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[1].dispatchEvent(new CustomEvent('change'));

    expect(sliderInputs[0].value).toBe('56');
    expect(sliderInputs[1].value).toBe(`${minVal + 5}`);
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: [56, 61], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArguments);
    filter.setValues([3, 80]);
    let filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration.filled') as HTMLInputElement;

    expect(filledInputElm).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration.filled') as HTMLInputElement;
    expect(filledInputElm).toBeFalsy();
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

  it('should create the input filter with min/max slider values being set by filter "sliderStartValue" and "sliderEndValue" through the filterOptions', () => {
    mockColumn.filter = {
      filterOptions: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArguments);

    const filterLowestElm = divContainer.querySelector('.lowest-range-duration') as HTMLInputElement;
    const filterHighestElm = divContainer.querySelector('.highest-range-duration') as HTMLInputElement;

    expect(filterLowestElm.textContent).toBe('4');
    expect(filterHighestElm.textContent).toBe('69');
    expect(filter.currentValues).toEqual([4, 69]);
  });

  it('should create the input filter with default search terms range but without showing side numbers when "hideSliderNumbers" is set in filterOptions', () => {
    filterArguments.searchTerms = [3, 80];
    mockColumn.filter!.filterOptions = { hideSliderNumbers: true };

    filter.init(filterArguments);

    const filterLowestElms = divContainer.querySelectorAll<HTMLInputElement>('.lowest-range-duration');
    const filterHighestElms = divContainer.querySelectorAll<HTMLInputElement>('.highest-range-duration');

    expect(filterLowestElms.length).toBe(0);
    expect(filterHighestElms.length).toBe(0);
    expect(filter.currentValues).toEqual([3, 80]);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArguments.searchTerms = [3, 80];
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear();

    expect(filter.currentValues).toEqual([0, 100]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = [3, 80];
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear(false);

    expect(filter.currentValues).toEqual([0, 100]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min/max slider values being with values of "sliderStartValue" and "sliderEndValue" when defined through the filterOptions', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter = {
      filterOptions: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArguments);
    filter.clear(false);

    expect(filter.currentValues).toEqual([4, 69]);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should enableSliderTrackColoring and trigger a change event and expect slider track to have background color', () => {
    mockColumn.filter = { filterOptions: { enableSliderTrackColoring: true } };
    filter.init(filterArguments);
    filter.setValues(['2..80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new CustomEvent('change'));
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    // expect(sliderTrackElm.style.background).toBe('linear-gradient(to right, #eee 2%, #86bff8 2%, #86bff8 80%, #eee 80%)');
    expect(filter.sliderOptions?.sliderTrackBackground).toBe('linear-gradient(to right, #eee 2%, #86bff8 2%, #86bff8 80%, #eee 80%)');
  });

  it('should click on the slider track and expect left handle to move to the new position when calculated percent is below 50%', () => {
    filter.init(filterArguments);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    const sliderOneChangeSpy = jest.spyOn(sliderInputs[0], 'dispatchEvent');
    const sliderTwoChangeSpy = jest.spyOn(sliderInputs[1], 'dispatchEvent');

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

    const sliderOneChangeSpy = jest.spyOn(sliderInputs[0], 'dispatchEvent');
    const sliderTwoChangeSpy = jest.spyOn(sliderInputs[1], 'dispatchEvent');

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 56 });
    Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 75 });
    sliderTrackElm.dispatchEvent(clickEvent);

    expect(sliderOneChangeSpy).not.toHaveBeenCalled();
    expect(sliderTwoChangeSpy).toHaveBeenCalled();
  });
});