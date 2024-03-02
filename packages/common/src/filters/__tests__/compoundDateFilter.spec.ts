import 'jest-extended';
import { Filters } from '../filters.index';
import { FieldType, OperatorType } from '../../enums/index';
import { Column, FilterArguments, GridOption } from '../../interfaces/index';
import { CompoundDateFilter } from '../compoundDateFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickGrid } from '../../core/index';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s+/g, ' ');
}

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getOptions: jest.fn(),
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
} as unknown as SlickGrid;

describe('CompoundDateFilter', () => {
  let divContainer: HTMLDivElement;
  let filter: CompoundDateFilter;
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
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionMock);

    mockColumn = { id: 'finish', field: 'finish', filterable: true, outputType: FieldType.dateIso, filter: { model: Filters.compoundDate, operator: '>' } };

    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };

    filter = new CompoundDateFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
    jest.clearAllMocks();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.form-group.search-filter.filter-finish').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter!.placeholder = testValue;

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;

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

  it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element', () => {
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionMock, darkMode: true
    });

    filter.init(filterArguments);
    const spy = jest.spyOn(filter.flatInstance, 'open');
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    filter.show();

    expect(calendarElm.classList.contains('slick-dark-mode')).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('should be able to retrieve default flatpickr options through the Getter', () => {
    filter.init(filterArguments);

    expect(filter.flatInstance).toBeTruthy();
    expect(filter.flatpickrOptions).toEqual({
      altFormat: 'Y-m-d',
      altInput: true,
      closeOnSelect: true,
      dateFormat: 'Y-m-d',
      defaultDate: '',
      errorHandler: expect.toBeFunction(),
      locale: 'en',
      mode: 'single',
      onChange: expect.anything(),
      theme: 'light',
      wrap: true,
    });
  });

  it('should be able to call "setValues" and have that value set in the picker', () => {
    const mockDate = '2001-01-02T16:02:02.239Z';
    filter.init(filterArguments);
    filter.setValues(mockDate);
    expect(filter.currentDateOrDates).toEqual(mockDate);
  });

  it('should be able to call "setValues" as an array and have that value set in the picker', () => {
    const mockDate = '2001-01-02T16:02:02.239Z';
    filter.init(filterArguments);
    filter.setValues([mockDate]);
    expect(filter.currentDateOrDates).toEqual(mockDate);
  });

  it('should be able to call "setValues" with a value and an extra operator and expect it to be set as new operator', () => {
    const mockDate = '2001-01-02T16:02:02.239Z';
    filter.init(filterArguments);
    filter.setValues([mockDate], OperatorType.greaterThanOrEqual);

    const filterOperatorElm = divContainer.querySelector('.input-group-prepend.operator select') as HTMLInputElement;

    expect(filter.currentDateOrDates).toEqual(mockDate);
    expect(filterOperatorElm.value).toBe('>=');
  });

  it('should trigger input change event and expect the callback to be called with the date provided in the input', () => {
    mockColumn.filter!.filterOptions = { allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    filterInputElm.value = '2001-01-02T16:02:02.239Z';
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, {
      columnDef: mockColumn, operator: '>', searchTerms: ['2001-01-02'], shouldTriggerQuery: true
    });
  });

  it('should pass a different operator then trigger an input change event and expect the callback to be called with the date provided in the input', () => {
    mockColumn.filter!.filterOptions = { allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    filterInputElm.value = '2001-01-02T16:02:02.239Z';
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: '>', searchTerms: ['2001-01-02'], shouldTriggerQuery: true });
  });

  it('should change operator dropdown without a date entered and not expect the callback to be called', () => {
    mockColumn.filter!.filterOptions = { allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-finish select') as HTMLInputElement;
    filterInputElm.value = undefined as any;
    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(spyCallback).not.toHaveBeenCalled();
  });

  it('should change operator dropdown without a date entered and expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as False', () => {
    mockColumn.filter!.filterOptions = { allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.filter!.operator = '>';
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = false;
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-finish select') as HTMLInputElement;
    filterInputElm.value = undefined as any;
    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(spyCallback).toHaveBeenCalled();
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.operator = '<=';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filter.currentDateOrDates).toBe('2000-01-01T05:00:00.000Z');
    expect(filterInputElm.value).toBe('2000-01-01');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['2000-01-01T05:00:00.000Z'], shouldTriggerQuery: true });
  });

  it('should trigger an operator change event and expect the callback to be called with the searchTerms and operator defined', () => {
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-finish select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new CustomEvent('change'));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['2000-01-01T05:00:00.000Z'], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the picker input to not have the "filled" css class', () => {
    const mockDate = '2001-01-02T16:02:02.239Z';
    filter.init(filterArguments);
    filter.setValues(mockDate);
    let filledInputElm = divContainer.querySelector('.search-filter.filter-finish .filled') as HTMLInputElement;

    expect(filter.currentDateOrDates).toEqual(mockDate);
    expect(filledInputElm).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.filter-finish .filled') as HTMLInputElement;
    expect(filledInputElm).toBeFalsy();
  });

  it('should work with different locale when locale is changed', async () => {
    await (await import('flatpickr/dist/l10n/fr')).French;

    translateService.use('fr');
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.operator = '<=';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    const calendarElm = document.body.querySelector('.flatpickr-calendar') as HTMLDivElement;
    const selectonOptionElms = calendarElm.querySelectorAll<HTMLSelectElement>(' .flatpickr-monthDropdown-months option');

    filter.show();

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filter.currentDateOrDates).toBe('2000-01-01T05:00:00.000Z');
    expect(filterInputElm.value).toBe('2000-01-01');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['2000-01-01T05:00:00.000Z'], shouldTriggerQuery: true });
    expect(calendarElm).toBeTruthy();
    expect(selectonOptionElms.length).toBe(12);
    expect(selectonOptionElms[0].textContent).toBe('janvier');
  });

  it('should display a console warning when locale is not previously imported', (done) => {
    const consoleSpy = jest.spyOn(global.console, 'warn').mockReturnValue();

    translateService.use('zz-yy'); // will be trimmed to 2 chars "zz"
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.operator = '<=';

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
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
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear();
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.clear(false);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should have a value with date & time in the picker when "enableTime" option is set and we trigger a change', () => {
    mockColumn.filter!.filterOptions = { enableTime: true, allowInput: true }; // change to allow input value only for testing purposes
    mockColumn.outputType = FieldType.dateTimeIsoAmPm;
    mockColumn.filter!.operator = '>';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;
    filterInputElm.value = '2001-01-02T16:02:02.000+05:00';
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    // expect(filter.currentDateOrDates.toISOString()).toBe('2001-01-02T21:02:02.000Z');
    expect(filterInputElm.value).toBe('2001-01-02 4:02:02 PM');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), {
      columnDef: mockColumn, operator: '>', searchTerms: ['2001-01-02'], shouldTriggerQuery: true
    });
  });

  it('should have a value with date & time in the picker when using no "outputType" which will default to UTC date', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.operator = '<=';
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-finish .flatpickr input.input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).KeyboardEvent('keyup', { keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.form-group.search-filter.filter-finish.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filter.currentDateOrDates).toBe('2000-01-01T05:00:00.000Z');
    expect(filterInputElm.value).toBe('2000-01-01T05:00:00.000Z');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['2000-01-01T05:00:00.000Z'], shouldTriggerQuery: true });
  });

  it('should have default English text with operator dropdown options related to dates', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.input-group-prepend.operator select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Less than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Greater than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Not equal to');
  });

  it('should have custom compound operator list showing up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    mockColumn.filter!.compoundOperatorList = [
      { operator: '', desc: '' },
      { operator: '=', desc: 'Equal to' },
      { operator: '<', desc: 'Less than' },
      { operator: '>', desc: 'Greater than' },
    ];

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.input-group-prepend.operator select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('> Greater than');
  });

  it('should be able to change compound operator & description with alternate texts for the operator list showing up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];
    jest.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionMock, compoundOperatorAltTexts: {
        numeric: { '=': { operatorAlt: 'eq', descAlt: 'alternate numeric equal description' } },
        text: { '=': { operatorAlt: 'eq', descAlt: 'alternate text equal description' } }
      }
    });

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.input-group-prepend.operator select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('eq alternate numeric equal description');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Less than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Greater than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Not equal to');
  });

  describe('with French I18N translations', () => {
    beforeEach(() => {
      gridOptionMock.enableTranslate = true;
      translateService.use('fr');
    });

    it('should have French text translated with operator dropdown options related to dates', () => {
      mockColumn.outputType = null as any;
      filterArguments.searchTerms = ['2000-01-01T05:00:00.000Z'];

      filter.init(filterArguments);
      const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.input-group-prepend.operator select');

      expect(filterOperatorElm[0][0].title).toBe('');
      expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Plus petit que');
      expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Plus petit ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Plus grand que');
      expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Plus grand ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Non égal à');
    });
  });
});
