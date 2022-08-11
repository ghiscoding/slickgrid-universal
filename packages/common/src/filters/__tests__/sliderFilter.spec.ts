import { Filters } from '../filters.index';
import { Column, FilterArguments, GridOption, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { SliderFilter } from '../sliderFilter';

const containerId = 'demo-container';
declare const Slick: SlickNamespace;

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
  onHeaderMouseLeave: new Slick.Event(),
} as unknown as SlickGrid;

describe('SliderFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: SliderFilter;
  let filterArgs: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.slider } };
    filterArgs = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };

    filter = new SliderFilter();
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should initialize the filter', () => {
    filter.init(filterArgs);
    const filterCount = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArgs);
    const filterInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.getAttribute('aria-label')).toBe('Duration Search Filter');
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    const spyCallback = jest.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new CustomEvent('change'));

    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['2'], shouldTriggerQuery: true });
  });

  it('should call "setValues" and expect that value, converted as a string, to be in the callback when triggered', () => {
    const spyCallback = jest.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.setValues(3);
    const filterElm = divContainer.querySelector('.search-filter.slider-container.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new CustomEvent('change'));
    const mockEvent = new CustomEvent(`change`);
    Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: { value: '13' } });
    filterElm.dispatchEvent(mockEvent);
    const filterFilledElms = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['13'], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArgs);
    filter.setValues(9);
    let filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration.filled') as HTMLInputElement;

    expect(filledInputElm).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.slider-container.filter-duration.filled') as HTMLInputElement;
    expect(filledInputElm).toBeFalsy();
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
      params: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArgs);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with default search terms range but without showing side numbers when "hideSliderNumber" is set in params', () => {
    filterArgs.searchTerms = [3];
    mockColumn.filter!.params = { hideSliderNumber: true };

    filter.init(filterArgs);

    const filterNumberElms = divContainer.querySelectorAll<HTMLInputElement>('.input-group-text');

    expect(filterNumberElms.length).toBe(0);
    expect(filter.getValues()).toEqual(3);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArgs.searchTerms = [3];
    const spyCallback = jest.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.clear();

    expect(filter.getValues()).toBe(0);
    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArgs.searchTerms = [3];
    const spyCallback = jest.spyOn(filterArgs, 'callback');

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toBe(0);
    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min slider values being with values of "sliderStartValue" when defined through the filter params', () => {
    const spyCallback = jest.spyOn(filterArgs, 'callback');
    mockColumn.filter = {
      params: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toEqual(4);
    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });
});
