import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { FieldType, OperatorType } from '../../enums/index.js';
import type { BackendServiceApi, Column, FilterArguments, GridOption } from '../../interfaces/index.js';
import { Filters } from '../index.js';
import { CompoundInputFilter } from '../compoundInputFilter.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import type { SlickGrid } from '../../core/index.js';
import * as utils from '../../core/utils.js';

vi.useFakeTimers();

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

function removeExtraSpaces(text: string) {
  return `${text}`.replace(/\s+/g, ' ');
}

const gridOptionMock = {
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getOptions: vi.fn(),
  getColumns: vi.fn(),
  getHeaderRowColumn: vi.fn(),
  render: vi.fn(),
} as unknown as SlickGrid;

describe('CompoundInputFilter', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: CompoundInputFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow: MockInstance;
  let mockColumn: Column;

  beforeEach(() => {
    translateService = new TranslateServiceStub();

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionMock);
    vi.spyOn(utils, 'applyHtmlToElement').mockImplementation((elm, val) => {
      elm.innerHTML = `${val || ''}`;
    });

    mockColumn = { id: 'duration', field: 'duration', filterable: true, filter: { model: Filters.input, operator: 'EQ' } };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: vi.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id),
    };

    filter = new CompoundInputFilter(translateService);
  });

  afterEach(() => {
    filter.destroy();
  });

  it('should initialize the filter', () => {
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('.search-filter.filter-duration').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
    expect(filter.inputType).toBe('text');
  });

  it('should have an aria-label when creating the filter', () => {
    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.ariaLabel).toBe('Duration Search Filter');
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter!.placeholder = testValue;

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.placeholder).toBe(testValue);
    expect(filterInputElm.ariaLabel).toBe('Duration Search Filter');
  });

  it('should call "setValues" and expect that value to be in the callback when triggered', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['abc']);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['abc'], shouldTriggerQuery: true });
  });

  it('should call "setValues" and expect that value to be in the callback when triggered by ENTER key', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['abc']);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    const event = new (window.window as any).Event('keyup', { bubbles: true, cancelable: true });
    event.key = 'Enter';
    filterInputElm.dispatchEvent(event);
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.filter-duration.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['abc'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with "operator" set in the filter arguments and expect that value to be in the callback when triggered', () => {
    mockColumn.type = FieldType.number;
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '>' } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['9']);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>', searchTerms: ['9'], shouldTriggerQuery: true });
  });

  it('should be able to call "setValues" with a value and an extra operator and expect it to be set as new operator', () => {
    mockColumn.type = FieldType.number;
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['9'], OperatorType.greaterThanOrEqual);

    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>=', searchTerms: ['9'], shouldTriggerQuery: true });
    expect(filterSelectElm.value).toBe('>=');
  });

  it('should be able to call "setValues" and set empty values and the input to not have the "filled" css class', () => {
    filter.init(filterArguments);
    filter.setValues('9');
    let filledInputElm = divContainer.querySelector('.search-filter.filter-duration') as HTMLInputElement;

    expect(filledInputElm.classList.contains('filled')).toBeTruthy();

    filter.setValues('');
    filledInputElm = divContainer.querySelector('.search-filter.filter-duration') as HTMLInputElement;
    expect(filledInputElm.classList.contains('filled')).toBeFalsy();
  });

  it('should trigger an operator change event and expect the callback to be called with the searchTerms and operator defined', () => {
    mockColumn.type = FieldType.number;
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['9']);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '<=', searchTerms: ['9'], shouldTriggerQuery: true });
  });

  it('should change operator dropdown without a value entered and not expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as True and value is undefined', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = true;
    mockColumn.type = FieldType.number;
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('should change operator dropdown without a value entered and not expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as undefined and value is also undefined', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = undefined;
    mockColumn.type = FieldType.number;
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('should change operator dropdown without a value entered and not expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as True and value is empty string', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = true;
    mockColumn.type = FieldType.number;
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues(['']);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).not.toHaveBeenCalled();
  });

  it('should change operator dropdown without a value entered and expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" but value was changed from set to unset', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = true;
    mockColumn.type = FieldType.number;
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;
    filter.setValues(['abc']);
    filterSelectElm.dispatchEvent(new Event('change'));

    filter.setValues(['']);
    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenCalled();
  });

  it('should change operator dropdown without a value entered and not expect the callback to be called when "skipCompoundOperatorFilterWithNullInput" is defined as False', () => {
    mockColumn.filter!.skipCompoundOperatorFilterWithNullInput = false;
    mockColumn.type = FieldType.number;
    const callbackSpy = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterSelectElm = divContainer.querySelector('.search-filter.filter-duration select') as HTMLInputElement;

    filterSelectElm.value = '<=';
    filterSelectElm.dispatchEvent(new Event('change'));

    expect(callbackSpy).toHaveBeenCalled();
  });

  it('should call "setValues" with extra spaces at the beginning of the searchTerms and trim value when "enableFilterTrimWhiteSpace" is enabled in grid options', () => {
    gridOptionMock.enableFilterTrimWhiteSpace = true;
    mockColumn.type = FieldType.number;
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '>' } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['   987 ']);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>', searchTerms: ['987'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with extra spaces at the beginning of the searchTerms and trim value when "enableTrimWhiteSpace" is enabled in the column filter', () => {
    gridOptionMock.enableFilterTrimWhiteSpace = false;
    mockColumn.filter!.enableTrimWhiteSpace = true;
    mockColumn.type = FieldType.number;
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    const filterArgs = { ...filterArguments, operator: '>' } as FilterArguments;

    filter.init(filterArgs);
    filter.setValues(['   987 ']);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '>', searchTerms: ['987'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method when user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.value = 'a';
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method with a delay when "filterTypingDebounce" is set in grid options and user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    gridOptionMock.filterTypingDebounce = 2;

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.value = 'a';
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(2);

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method with a delay when BackendService is used with a "filterTypingDebounce" is set in grid options and user types something in the input', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    gridOptionMock.defaultBackendServiceFilterTypingDebounce = 2;
    gridOptionMock.backendServiceApi = {
      filterTypingDebounce: 2,
      service: {},
    } as unknown as BackendServiceApi;

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    filterInputElm.focus();
    filterInputElm.value = 'a';
    filterInputElm.dispatchEvent(new (window.window as any).Event('keyup', { key: 'a', keyCode: 97, bubbles: true, cancelable: true }));

    vi.advanceTimersByTime(2);

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: '', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;

    expect(filterInputElm.value).toBe('xyz');
  });

  it('should expect the input not to have the "filled" css class when the search term provided is an empty string', () => {
    filterArguments.searchTerms = [''];

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.filter-duration.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
  });

  it('should create the input filter with operator dropdown options related to numbers when column definition type is FieldType.number', () => {
    mockColumn.type = FieldType.number;
    filterArguments.searchTerms = ['9'];

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterInputElm.value).toBe('9');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Less than');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Less than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Greater than');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Greater than or equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Not equal to');
  });

  it('should create the input filter with operator dropdown options related to strings when column definition type is FieldType.string', () => {
    mockColumn.type = FieldType.string;
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterInputElm.value).toBe('xyz');
    expect(removeExtraSpaces(filterOperatorElm[0][0].textContent!)).toBe(' Contains');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('<> Not contains');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('= Equals');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('!= Not equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('a* Starts With');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('*z Ends With');
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear();
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.filter-duration.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    const spyCallback = vi.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear(false);
    const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('.search-filter.filter-duration.filled');

    expect(filterInputElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(undefined, { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should have custom compound operator list showing up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['xyz'];
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
    filterArguments.searchTerms = ['xyz'];
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionMock,
      compoundOperatorAltTexts: {
        numeric: { '=': { operatorAlt: 'eq', descAlt: 'alternate numeric equal description' } },
        text: { '=': { operatorAlt: 'eq', descAlt: 'alternate text equal description' } },
      },
    });

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

    expect(filterOperatorElm[0][0].title).toBe('');
    expect(removeExtraSpaces(filterOperatorElm[0][0].textContent!)).toBe(' Contains');
    expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('<> Not contains');
    expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('eq alternate text equal description');
    expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('!= Not equal to');
    expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('a* Starts With');
    expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('*z Ends With');
  });

  it('should have custom compound operator list including alternate texts and show up in the operator select dropdown options list', () => {
    mockColumn.outputType = null as any;
    filterArguments.searchTerms = ['xyz'];
    mockColumn.filter!.compoundOperatorList = [
      { operator: '', desc: '' },
      { operator: '=', desc: 'Equal to' },
      { operator: '<', desc: 'Less than' },
      { operator: '>', desc: 'Greater than' },
      { operator: 'Custom', desc: 'SQL LIKE' },
    ];
    vi.spyOn(gridStub, 'getOptions').mockReturnValue({
      ...gridOptionMock,
      compoundOperatorAltTexts: {
        text: {
          '=': { operatorAlt: 'eq', descAlt: 'alternate numeric equal description' },
          Custom: { operatorAlt: '%', descAlt: 'alternate SQL LIKE' },
        },
      },
    });

    filter.init(filterArguments);
    const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

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
      filterArguments.searchTerms = ['9'];

      filter.init(filterArguments);
      const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
      const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

      expect(filterInputElm.value).toBe('9');
      expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('= Égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('< Plus petit que');
      expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('<= Plus petit ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('> Plus grand que');
      expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('>= Plus grand ou égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][6].textContent!)).toBe('<> Non égal à');
    });

    it('should have French text translated with operator dropdown options related to strings when column definition type is FieldType.string', () => {
      mockColumn.type = FieldType.string;
      filterArguments.searchTerms = ['xyz'];

      filter.init(filterArguments);
      const filterInputElm = divContainer.querySelector('.search-filter.filter-duration input') as HTMLInputElement;
      const filterOperatorElm = divContainer.querySelectorAll<HTMLSelectElement>('.search-filter.filter-duration select');

      expect(filterInputElm.value).toBe('xyz');
      expect(removeExtraSpaces(filterOperatorElm[0][0].textContent!)).toBe(' Contient');
      expect(removeExtraSpaces(filterOperatorElm[0][1].textContent!)).toBe('<> Ne contient pas');
      expect(removeExtraSpaces(filterOperatorElm[0][2].textContent!)).toBe('= Égale');
      expect(removeExtraSpaces(filterOperatorElm[0][3].textContent!)).toBe('!= Non égal à');
      expect(removeExtraSpaces(filterOperatorElm[0][4].textContent!)).toBe('a* Commence par');
      expect(removeExtraSpaces(filterOperatorElm[0][5].textContent!)).toBe('*z Se termine par');
    });
  });
});
