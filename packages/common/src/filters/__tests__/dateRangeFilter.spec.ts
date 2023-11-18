import 'jest-extended';
import { FieldType } from '../../enums/index';
import { Column, FilterArguments, GridOption } from '../../interfaces/index';
import { Filters } from '../filters.index';
import { DateRangeFilter } from '../dateRangeFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickGrid } from '../../core/index';

const containerId = 'demo-container';

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
} as unknown as SlickGrid;

describe('DateRangeFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: DateRangeFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'finish', field: 'finish', filterable: true, filter: { model: Filters.dateRange, operator: 'RangeInclusive' } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };

    filter = new DateRangeFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.flatpickr.search-filter.filter-finish').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter!.placeholder = testValue;

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input') as HTMLInputElement;

    expect(filterElm.placeholder).toBe(testValue);
  });

  it('should hide the DOM element when the "hide" method is called', () => {
    filter.init(filterArguments);
    const spy = jest.spyOn(filter.flatInstance, 'close');
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    filter.hide();

    expect(calendarElm).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('should show the DOM element when the "show" method is called', () => {
    filter.init(filterArguments);
    const spy = jest.spyOn(filter.flatInstance, 'open');
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    filter.show();

    expect(calendarElm).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('should be able to retrieve default flatpickr options through the Getter', () => {
    filter.init(filterArguments);

    expect(filter.flatInstance).toBeTruthy();
    expect(filter.flatpickrOptions).toEqual({
      altFormat: 'Z',
      altInput: true,
      closeOnSelect: true,
      dateFormat: 'Y-m-d',
      defaultDate: [],
      enableTime: true,
      errorHandler: expect.toBeFunction(),
      locale: 'en',
      mode: 'range',
      onChange: expect.anything(),
      wrap: true,
    });
  });

  it('should be able to call "setValues" and have them set in the picker', () => {
    const mockDates = ['2001-01-02T16:02:02.239Z', '2001-01-31T16:02:02.239Z'];
    filter.init(filterArguments);
    filter.setValues(mockDates);
    expect(filter.currentDateOrDates).toEqual(mockDates);
  });

  it('should be able to call "setValues" with 2 dots (..) notation and have them set in the picker', () => {
    const mockDate = '2001-01-02T16:02:02.239Z..2001-01-31T16:02:02.239Z';
    filter.init(filterArguments);
    filter.setValues([mockDate]);
    expect(filter.currentDateOrDates).toEqual(mockDate.split('..'));
  });

  it('should trigger input change event and expect the callback to be called with the date provided in the input', () => {
    mockColumn.filter!.filterOptions = { allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = 'RangeInclusive';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    filterInputElm.value = '2001-01-02T16:02:02.239Z to 2001-01-31T16:02:02.239Z';
    filterInputElm.dispatchEvent(new CustomEvent('change'));
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: ['2001-01-02', '2001-01-31'], shouldTriggerQuery: true });
  });

  it('should pass a different operator then trigger an input change event and expect the callback to be called with the date provided in the input', () => {
    mockColumn.filter!.filterOptions = { allowInput: true, enableTime: false }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = 'RangeExclusive';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    filterInputElm.value = '2001-01-02T16:02:02.239Z to 2001-01-31T16:02:02.239Z';
    filterInputElm.dispatchEvent(new CustomEvent('change'));
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeExclusive', searchTerms: ['2001-01-02', '2001-01-31'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z'];
    mockColumn.filter!.operator = 'RangeInclusive';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterInputElm.value).toBe('2000-01-01T05:00:00.000Z to 2000-01-31T05:00:00.000Z');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: ['2000-01-01', '2000-01-31'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument with 2 dots (..) notation', () => {
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z..2000-01-31T05:00:00.000Z'];
    mockColumn.filter!.operator = 'RangeInclusive';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterInputElm.value).toBe('2000-01-01T05:00:00.000Z to 2000-01-31T05:00:00.000Z');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: ['2000-01-01', '2000-01-31'], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the picker input to not have the "filled" css class', () => {
    const mockDates = ['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z'];
    filter.init(filterArguments);
    filter.setValues(mockDates);
    let filledInputElm = divContainer.querySelector('.search-filter.filter-finish.filled') as HTMLInputElement;

    expect(filter.currentDateOrDates).toEqual(mockDates);
    expect(filledInputElm).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.filter-finish.filled') as HTMLInputElement;
    expect(filledInputElm).toBeFalsy();
  });

  it('should work with different locale when locale is changed', async () => {
    await (await import('flatpickr/dist/l10n/fr')).French;

    translateService.use('fr');
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z'];
    mockColumn.filter!.operator = 'RangeInclusive';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    const selectonOptionElms = calendarElm.querySelectorAll<HTMLSelectElement>(' .flatpickr-monthDropdown-months option');

    filter.show();

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterInputElm.value).toBe('2000-01-01T05:00:00.000Z au 2000-01-31T05:00:00.000Z');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'RangeInclusive', searchTerms: ['2000-01-01', '2000-01-31'], shouldTriggerQuery: true });
    expect(calendarElm).toBeTruthy();
    expect(selectonOptionElms.length).toBe(12);
    expect(selectonOptionElms[0].textContent).toBe('janvier');
  });

  it('should display a console warning when locale is not previously imported', (done) => {
    const consoleSpy = jest.spyOn(global.console, 'warn').mockReturnValue();

    translateService.use('zz-yy'); // will be trimmed to 2 chars "zz"
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z'];
    mockColumn.filter!.operator = 'RangeInclusive';

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    const selectonOptionElms = calendarElm.querySelectorAll<HTMLSelectElement>(' .flatpickr-monthDropdown-months option');

    filter.show();

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));

    setTimeout(() => {
      expect(selectonOptionElms.length).toBe(12);
      expect(selectonOptionElms[0].textContent).toBe('January');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`[Slickgrid-Universal] Flatpickr missing locale imports (zz), will revert to English as the default locale.`));
      done();
    });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    filterArguments.searchTerms = ['2000-01-01', '2000-01-31'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear();
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = ['2000-01-01', '2000-01-31'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear(false);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should have a value with date & time in the picker when "enableTime" option is set and we trigger a change', () => {
    mockColumn.filter!.filterOptions = { enableTime: true, allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.outputType = FieldType.dateTimeIsoAmPm;
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.input') as HTMLInputElement;
    filterInputElm.value = '2000-01-01T05:00:00.000+05:00 to 2000-01-31T05:00:00.000+05:00';
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    // expect(filter.currentDateOrDates.map((date) => date.toISOString())).toEqual(['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z']);
    expect(filterInputElm.value).toBe('2000-01-01 5:00:00 AM to 2000-01-31 5:00:00 AM');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), {
      columnDef: mockColumn, operator: '>', searchTerms: ['2000-01-01 05:00:00 am', '2000-01-31 05:00:00 am'], shouldTriggerQuery: true
    });
  });

  it('should have a value with date & time in the picker when using no "outputType" which will default to UTC date', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z'];
    mockColumn.filter!.operator = '<=';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.flatpickr.search-filter.filter-finish input.flatpickr-input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.flatpickr.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filter.currentDateOrDates).toEqual(['2000-01-01T05:00:00.000Z', '2000-01-31T05:00:00.000Z']);
    expect(filterInputElm.value).toBe('2000-01-01 to 2000-01-31');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['2000-01-01', '2000-01-31'], shouldTriggerQuery: true });
  });
});
