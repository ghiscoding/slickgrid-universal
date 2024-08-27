import { FieldType, OperatorType } from '../../enums/index';
import type { Column, FilterArguments, GridOption, SliderOption } from '../../interfaces/index';
import { Filters } from '../index';
import { CompoundSliderFilter } from '../compoundSliderFilter';
import { SlickEvent, type SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const containerId = 'demo-container';
jest.useFakeTimers();

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s+/g, ' ');
}

let gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
  onHeaderMouseLeave: new SlickEvent(),
  onHeaderRowMouseEnter: new SlickEvent(),
  onHeaderRowMouseLeave: new SlickEvent(),
} as unknown as SlickGrid;

describe('CompoundSliderFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: CompoundSliderFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.compoundSlider } };
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

    filter = new CompoundSliderFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrow('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.search-filter.slider-container.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.currentValue).toBeUndefined();
  });

  it('should initialize the filter with slider value define in user filter options', () => {
    mockColumn.filter!.filterOptions = { sliderStartValue: 1 } as SliderOption;
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

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Duration Search Filter');
  });

  it('should call "setValues" with "operator" set in the filter arguments and expect that value to be converted to number and in the callback when triggered', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const rowMouseLeaveSpy = jest.spyOn(gridStub.onHeaderRowMouseLeave, 'notify');
    const filterArgs = { ...filterArguments, operator: '>', grid: gridStub } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>', searchTerms: [2], shouldTriggerQuery: true });
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
    expect(rowMouseLeaveSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub });
  });

  it('should trigger an slider input change event and expect slider value to be updated and also "onHeaderRowMouseEnter" to be notified', () => {
    const rowMouseEnterSpy = jest.spyOn(gridStub.onHeaderRowMouseEnter, 'notify');
    const filterArgs = { ...filterArguments, operator: '>', grid: gridStub } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('input'));

    expect(filterNumberElm.textContent).toBe('2');
    expect(rowMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
  });

  it('should call "setValues" with "operator" set in the filter arguments and expect that value, converted as a string, to be in the callback when triggered', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '<=', grid: gridStub } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(3);
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new Event('change'));
    const filterFilledElms = divContainer.querySelectorAll('.slider-container.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(callbackSpy).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: [3], shouldTriggerQuery: true });
  });

  it('should trigger an operator change event and expect the callback to be called with the searchTerms and operator defined', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(9);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: [9], shouldTriggerQuery: true });
  });

  it('should change operator dropdown without a value entered and not expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as True', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = true;
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('should change operator dropdown without a value entered and expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as False', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = false;
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenCalled();
  });

  it('should be able to call "setValues" with a value, converted as a number, and an extra operator and expect it to be set as new operator', () => {
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['9'], OperatorType.greaterThanOrEqual);

    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>=', searchTerms: [9], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArguments);
    filter.setValues(9);
    let filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;

    expect(filledInputElm).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;
    expect(filledInputElm).toBeFalsy();
  });

  it('should be able to call "setValues" and call an event trigger', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    filter.init(filterArguments);
    filter.setValues(9, '>=', true);
    const filledInputElm = divContainer.querySelector('.search-filter.filter-duration.filled') as HTMLInputElement;

    expect(filledInputElm).toBeTruthy();
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, operator: '>=', searchTerms: [9], shouldTriggerQuery: true });
  });

  it('should create the input filter with default search terms range when passed as a filter argument', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3], grid: gridStub } as FilterArguments;

    filter.init(filterArgs);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll('.slider-container.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterNumberElm.textContent).toBe('3');
    expect(filter.getValues()).toEqual(3);
  });

  it('should create the input filter with default search terms and a different step size when "valueStep" is provided', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [15], grid: gridStub } as FilterArguments;
    mockColumn.filter!.valueStep = 5;

    filter.init(filterArgs);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.step).toBe('5');
    expect(filterNumberElm.textContent).toBe('15');
    expect(filter.getValues()).toEqual(15);
  });

  it('should create the input filter with min slider values being set by filter "minValue"', () => {
    mockColumn.filter = {
      minValue: 4,
      maxValue: 69,
    };

    filter.init(filterArguments);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with min/max slider values being set by filter "sliderStartValue" and "sliderEndValue" through the filter params', () => {
    mockColumn.filter = {
      filterOptions: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArguments);

    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

    expect(filterNumberElm.textContent).toBe('4');
    expect(filter.getValues()).toEqual(4);
  });

  it('should create the input filter with default search terms range but without showing side numbers when "hideSliderNumber" is set in params', () => {
    filterArguments.searchTerms = [3];
    mockColumn.filter!.filterOptions = { hideSliderNumber: true };

    filter.init(filterArguments);

    const filterNumberElms = divContainer.querySelectorAll<HTMLInputElement>('.input-group-text');

    expect(filterNumberElms.length).toBe(0);
    expect(filter.getValues()).toEqual(3);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3], grid: gridStub } as FilterArguments;
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArgs);
    filter.clear();

    expect(filter.getValues()).toBe(0);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3], grid: gridStub } as FilterArguments;
    const callbackSpy = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toBe(0);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min slider values being with values of "sliderStartValue" when defined through the filter params', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3], grid: gridStub, } as FilterArguments;
    const callbackSpy = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter = {
      filterOptions: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toEqual(4);
    expect(callbackSpy).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, searchTerms: [], shouldTriggerQuery: false });
  });

  it('should enableSliderTrackColoring and trigger a change event and expect slider track to have background color', () => {
    mockColumn.filter = { filterOptions: { enableSliderTrackColoring: true } };
    filter.init(filterArguments);
    filter.setValues(['80']);
    const filterElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.slider-container.filter-duration input');
    filterElms[0].dispatchEvent(new Event('change'));

    expect(filter.sliderOptions?.sliderTrackBackground).toBe('linear-gradient(to right, #eee 0%, #86bff8 0%, #86bff8 80%, #eee 80%)');
  });

  it('should click on the slider track and expect handle to move to the new position', () => {
    filter.init(filterArguments);
    const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-filter-input');
    const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

    const sliderRightChangeSpy = jest.spyOn(sliderInputs[0], 'dispatchEvent');

    const clickEvent = new Event('click');
    Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 56 });
    Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 75 });
    sliderTrackElm.dispatchEvent(clickEvent);

    expect(sliderRightChangeSpy).toHaveBeenCalled();
  });

  it('should create the input filter with all available operators in a select dropdown options as a prepend element', () => {
    filterArguments.searchTerms = ['9'];

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterInputElm.value).toBe('9');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Less than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Greater than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Not equal to');
  });

  it('should have custom compound operator list showing up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['9'];
    mockColumn.filter!.compoundOperatorList = [
      { operator: '', desc: '' },
      { operator: '=', desc: 'Equal to' },
      { operator: '<', desc: 'Less than' },
      { operator: '>', desc: 'Greater than' },
    ];

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('> Greater than');
  });

  it('should be able to change compound operator & description with alternate texts for the operator list showing up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['9'];
    gridOptionMock.compoundOperatorAltTexts = {
      numeric: { '=': { operatorAlt: 'eq', descAlt: 'alternate numeric equal description' } },
      text: { '=': { operatorAlt: 'eq', descAlt: 'alternate text equal description' } }
    };

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('eq alternate numeric equal description');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Less than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Greater than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Not equal to');
  });

  it('should have custom compound operator list including alternate texts and show up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['9'];
    mockColumn.filter!.compoundOperatorList = [
      { operator: '', desc: '' },
      { operator: '=', desc: 'Equal to' },
      { operator: '<', desc: 'Less than' },
      { operator: '>', desc: 'Greater than' },
      { operator: 'Custom', desc: 'SQL LIKE' },
    ];
    gridOptionMock.compoundOperatorAltTexts = {
      numeric: {
        '=': { operatorAlt: 'eq', descAlt: 'alternate numeric equal description' },
        'Custom': { operatorAlt: '%', descAlt: 'alternate SQL LIKE' }
      }
    };

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.input-group-prepend.operator select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('eq alternate numeric equal description');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('% alternate SQL LIKE');
  });

  describe('with French I18N translations', () => {
    beforeEach(() => {
      gridOptionMock.enableTranslate = true;
      translateService.use('fr');
    });

    it('should have French text translated with operator dropdown options related to numbers when column definition type is FieldType.number', () => {
      mockColumn.type = FieldType.number;
      filterArguments.searchTerms = [9];

      filter.init(filterArguments);
      const filterInputElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
      const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

      expect(filterInputElm.value).toBe('9');
      expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Plus petit que');
      expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Plus petit ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Plus grand que');
      expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Plus grand ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Non égal à');
    });
  });
});
