import { FieldType, OperatorType } from '../../enums/index';
import { Column, FilterArguments, GridOption, SlickGrid } from '../../interfaces/index';
import { Filters } from '../index';
import { CompoundSliderFilter } from '../compoundSliderFilter';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

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
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
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
      callback: jest.fn()
    };

    filter = new CompoundSliderFilter(translateService);
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

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.getAttribute('aria-label')).toBe('Duration Search Filter');
  });

  it('should call "setValues" with "operator" set in the filter arguments and expect that value to be in the callback when triggered', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '>' } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['2']);
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new CustomEvent('change'));

    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>', searchTerms: ['2'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with "operator" set in the filter arguments and expect that value, converted as a string, to be in the callback when triggered', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '<=' } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(3);
    const filterElm = divContainer.querySelector('.input-group.search-filter.filter-duration input') as HTMLInputElement;
    filterElm.dispatchEvent(new CustomEvent('change'));
    const filterFilledElms = divContainer.querySelectorAll('.slider-container.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenLastCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['3'], shouldTriggerQuery: true });
  });

  it('should trigger an operator change event and expect the callback to be called with the searchTerms and operator defined', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(9);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new CustomEvent('change'));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['9'], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" with a value and an extra operator and expect it to be set as new operator', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['9'], OperatorType.greaterThanOrEqual);

    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;
    filterSelectElm.dispatchEvent(new CustomEvent('change'));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>=', searchTerms: ['9'], shouldTriggerQuery: true });
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

  it('should create the input filter with default search terms range when passed as a filter argument', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3] } as FilterArguments;

    filter.init(filterArgs);
    const filterNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll('.slider-container.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(filterNumberElm.textContent).toBe('3');
    expect(filter.getValues()).toEqual(3);
  });

  it('should create the input filter with default search terms and a different step size when "valueStep" is provided', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [15] } as FilterArguments;
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
      params: {
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
    mockColumn.filter!.params = { hideSliderNumber: true };

    filter.init(filterArguments);

    const filterNumberElms = divContainer.querySelectorAll<HTMLInputElement>('.input-group-text');

    expect(filterNumberElms.length).toBe(0);
    expect(filter.getValues()).toEqual(3);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3] } as FilterArguments;
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArgs);
    filter.clear();

    expect(filter.getValues()).toBe(0);
    expect(spyCallback).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3] } as FilterArguments;
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toBe(0);
    expect(spyCallback).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method and expect min slider values being with values of "sliderStartValue" when defined through the filter params', () => {
    const filterArgs = { ...filterArguments, operator: '<=', searchTerms: [3] } as FilterArguments;
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter = {
      params: {
        sliderStartValue: 4,
        sliderEndValue: 69,
      }
    };

    filter.init(filterArgs);
    filter.clear(false);

    expect(filter.getValues()).toEqual(4);
    expect(spyCallback).toHaveBeenLastCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
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
    mockColumn.filter.compoundOperatorList = [
      { operator: '', description: '' },
      { operator: '=', description: 'Equal to' },
      { operator: '<', description: 'Less than' },
      { operator: '>', description: 'Greater than' },
    ];

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('> Greater than');
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
