import { of, Subject } from 'rxjs';

import { Filters } from '../index';
import { AutocompleterFilter } from '../autocompleterFilter';
import { FieldType, OperatorType } from '../../enums/index';
import { AutocompleterOption, Column, ColumnFilter, FilterArguments, GridOption } from '../../interfaces/index';
import { CollectionService } from '../../services/collection.service';
import { HttpStub } from '../../../../../test/httpClientStub';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickGrid } from '../../core/index';

jest.useFakeTimers();

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const gridOptionMock = {
  enableFiltering: true,
  enableFilterTrimWhiteSpace: true,
} as GridOption;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
} as unknown as SlickGrid;

describe('AutocompleterFilter', () => {
  let translaterService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let filter: AutocompleterFilter;
  let filterArguments: FilterArguments;
  let spyGetHeaderRow;
  let mockColumn: Column & { filter: ColumnFilter; };
  let collectionService: CollectionService;
  const http = new HttpStub();

  beforeEach(() => {
    translaterService = new TranslateServiceStub();
    collectionService = new CollectionService(translaterService);

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);
    spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

    mockColumn = {
      id: 'gender', field: 'gender', filterable: true,
      filter: {
        model: Filters.autocompleter,
      }
    };
    filterArguments = {
      grid: gridStub,
      columnDef: mockColumn,
      callback: jest.fn(),
      filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
    };

    filter = new AutocompleterFilter(translaterService, collectionService);
  });

  afterEach(() => {
    filter.destroy();
    jest.clearAllMocks();
  });

  it('should throw an error when trying to call init without any arguments', () => {
    expect(() => filter.init(null as any)).toThrowError('[Slickgrid-Universal] A filter must always have an "init()" with valid arguments.');
  });

  it('should throw an error when there is no collection provided in the filter property', (done) => {
    try {
      mockColumn.filter.collection = undefined;
      filter.init(filterArguments);
    } catch (e) {
      expect(e.toString()).toContain(`[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") for the AutoComplete Filter to work correctly.`);
      done();
    }
  });

  it('should initialize the filter', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.search-filter.filter-gender').length;

    expect(filter.instance).toBeTruthy();
    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should initialize the filter even when user define his own filter options', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    mockColumn.filter.filterOptions = { minLength: 3 } as AutocompleterOption;
    filter.init(filterArguments);
    const filterCount = divContainer.querySelectorAll('input.search-filter.filter-gender').length;

    expect(spyGetHeaderRow).toHaveBeenCalled();
    expect(filterCount).toBe(1);
  });

  it('should have a placeholder when defined in its column definition', () => {
    const testValue = 'test placeholder';
    mockColumn.filter.placeholder = testValue;
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.search-filter.filter-gender') as HTMLInputElement;

    expect(filterElm.placeholder).toBe(testValue);
  });

  it('should call "setValues" and expect that value to be in the callback when triggered and triggerOnEveryKeyStroke is enabled', () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    mockColumn.filter.filterOptions = { triggerOnEveryKeyStroke: true };

    filter.init(filterArguments);
    filter.setValues('male');
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true }));
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'm', bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['male'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with extra spaces at the beginning of the searchTerms and trim value when "enableFilterTrimWhiteSpace" is enabled in grid options and triggerOnEveryKeyStroke is enabled', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    mockColumn.filter.filterOptions = { triggerOnEveryKeyStroke: true };
    gridOptionMock.enableFilterTrimWhiteSpace = true;
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('    abc ');
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['abc'], shouldTriggerQuery: true });
  });

  it('should call "setValues" with extra spaces at the beginning of the searchTerms and trim value when "enableTrimWhiteSpace" is enabled in the column filter and triggerOnEveryKeyStroke is enabled', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    mockColumn.filter.filterOptions = { triggerOnEveryKeyStroke: true };
    gridOptionMock.enableFilterTrimWhiteSpace = false;
    mockColumn.filter.enableTrimWhiteSpace = true;
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    filter.setValues('    abc ');
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['abc'], shouldTriggerQuery: true });
  });

  it('should trigger the callback method when user types something in the input and triggerOnEveryKeyStroke is enabled', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    mockColumn.filter.filterOptions = { triggerOnEveryKeyStroke: true };
    const spyCallback = jest.spyOn(filterArguments, 'callback');

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    filterElm.focus();
    filterElm.value = 'a';
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));

    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['a'], shouldTriggerQuery: true });
  });

  it('should create the input filter with a default search term when passed as a filter argument', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    expect(filterElm.value).toBe('xyz');
  });

  it('should expect the input not to have the "filled" css class when the search term provided is an empty string', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    filterArguments.searchTerms = [''];

    filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
  });

  it('should trigger a callback with the clear filter set when calling the "clear" method', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear();
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should expect "clear" method be called when input "blur" event is triggered', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    const clearSpy = jest.spyOn(filter, 'clear');
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;

    filterElm.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

    jest.runAllTimers(); // fast-forward timer

    expect(clearSpy).toHaveBeenCalled();
    expect(filterElm.value).toBe('');
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: true });
  });

  it('should trigger a callback with the clear filter but without querying when when calling the "clear" method with False as argument', () => {
    mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    filterArguments.searchTerms = ['xyz'];

    filter.init(filterArguments);
    filter.clear(false);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

    expect(filterElm.value).toBe('');
    expect(filterFilledElms.length).toBe(0);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, clearFilterTriggered: true, shouldTriggerQuery: false });
  });

  it('should create the filter with a default search term when using "collectionAsync" as a Promise and triggerOnEveryKeyStroke is enabled', async () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];
    mockColumn.filter.collectionAsync = Promise.resolve(mockCollection);
    mockColumn.filter.filterOptions = { showOnFocus: true, triggerOnEveryKeyStroke: true } as AutocompleterOption;

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));

    jest.runAllTimers(); // fast-forward timer

    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');
    const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
    expect(autocompleteListElms.length).toBe(1);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should add custom render callback and expect it to be called when a search is triggered', async () => {
    const renderSpy = jest.spyOn(filter, 'renderDomElement');
    const mockDataResponse = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }];
    const callbackMock = jest.fn().mockReturnValue(mockDataResponse);

    mockColumn.filter = {
      filterOptions: {
        triggerOnEveryKeyStroke: true,
        showOnFocus: true,
        fetch: (searchText, updateCallback) => {
          callbackMock(searchText);
        }
      }
    };

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    filterElm.focus();

    jest.runAllTimers(); // fast-forward timer

    expect(filter.filterDomElement.classList.contains('slick-autocomplete-loading')).toBeTrue();
    expect(callbackMock).toHaveBeenCalledWith('female');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('should add custom "fetch" call and expect "renderRegularItem" callback be called when focusing on the autocomplete input', async () => {
    const mockDataResponse = [{ value: 'female', label: 'Female' }, { value: 'undefined', label: 'Undefined' }];

    mockColumn.filter = {
      filterOptions: {
        showOnFocus: true,
        fetch: (searchText, updateCallback) => {
          updateCallback(mockDataResponse);
        }
      }
    };

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    filterElm.focus();

    jest.runAllTimers(); // fast-forward timer

    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');
    const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
    expect(autocompleteListElms.length).toBe(2);
    expect(autocompleteListElms[0].textContent).toBe('Female');
    expect(autocompleteListElms[1].textContent).toBe('Undefined');
    expect(filterFilledElms.length).toBe(1);
  });

  it('should create the filter with a default search term when using "collectionAsync" as a Promise with content to simulate http-client and triggerOnEveryKeyStroke is enabled', async () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];
    mockColumn.filter.collectionAsync = Promise.resolve({ content: mockCollection });
    mockColumn.filter.filterOptions = { showOnFocus: true, triggerOnEveryKeyStroke: true } as AutocompleterOption;

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));

    jest.runAllTimers(); // fast-forward time

    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');
    const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
    expect(autocompleteListElms.length).toBe(1);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the filter with a default search term when using "collectionAsync" is a Fetch Promise and triggerOnEveryKeyStroke is enabled', async () => {
    const spyCallback = jest.spyOn(filterArguments, 'callback');
    const mockCollection = ['male', 'female'];

    http.status = 200;
    http.object = mockCollection;
    http.returnKey = 'date';
    http.returnValue = '6/24/1984';
    http.responseHeaders = { accept: 'json' };
    mockColumn.filter.collectionAsync = http.fetch('http://locahost/api', { method: 'GET' });
    mockColumn.filter.filterOptions = { showOnFocus: true, triggerOnEveryKeyStroke: true } as AutocompleterOption;

    filterArguments.searchTerms = ['female'];
    await filter.init(filterArguments);
    const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
    filterElm.focus();
    filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true }));

    jest.runAllTimers(); // fast-forward time

    const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
    const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');
    expect(autocompleteListElms.length).toBe(1);
    expect(filterFilledElms.length).toBe(1);
    expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'], shouldTriggerQuery: true });
  });

  it('should create the filter and filter the string collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionFilterBy: { operator: OperatorType.equal, value: 'other' }
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(1);
    expect(filterCollection[0]).toBe('other');
  });

  it('should create the filter and filter the value/label pair collection when "collectionFilterBy" is set', () => {
    mockColumn.filter = {
      collection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }],
      collectionFilterBy: [
        { property: 'value', operator: OperatorType.notEqual, value: 'other' },
        { property: 'value', operator: OperatorType.notEqual, value: 'male' }
      ],
      customStructure: { value: 'value', label: 'description', },
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(1);
    expect(filterCollection[0]).toEqual({ value: 'female', description: 'female' });
  });

  it('should create the filter and filter the value/label pair collection when "collectionFilterBy" is set and "filterResultAfterEachPass" is set to "merge"', () => {
    mockColumn.filter = {
      collection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }],
      collectionFilterBy: [
        { property: 'value', operator: OperatorType.equal, value: 'other' },
        { property: 'value', operator: OperatorType.equal, value: 'male' }
      ],
      collectionOptions: { filterResultAfterEachPass: 'merge' },
      customStructure: { value: 'value', label: 'description', },
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(2);
    expect(filterCollection[0]).toEqual({ value: 'other', description: 'other' });
    expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
  });

  it('should create the filter with a value/label pair collection that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', () => {
    mockColumn.filter = {
      collection: { deep: { myCollection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }] } } as any,
      collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
      customStructure: { value: 'value', label: 'description', },
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(3);
    expect(filterCollection[0]).toEqual({ value: 'other', description: 'other' });
    expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
    expect(filterCollection[2]).toEqual({ value: 'female', description: 'female' });
  });

  it('should create the filter with a value/label pair collection that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', () => {
    mockColumn.filter = {
      collection: { deep: { myCollection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }] } } as any,
      collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
    };
    mockColumn.type = FieldType.object;
    mockColumn.dataKey = 'value';
    mockColumn.labelKey = 'description';

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(3);
    expect(filterCollection[0]).toEqual({ value: 'other', description: 'other' });
    expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
    expect(filterCollection[2]).toEqual({ value: 'female', description: 'female' });
  });

  it('should create the filter with a value/label pair collectionAsync that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', async () => {
    try {
      const mockCollection = { deep: { myCollection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }] } };
      mockColumn.filter = {
        collectionAsync: Promise.resolve(mockCollection),
        collectionOptions: { collectionInsideObjectProperty: 'deep.myCollection' },
        customStructure: { value: 'value', label: 'description', },
      };

      await filter.init(filterArguments);
      const filterCollection = filter.collection as any[];

      expect(filterCollection.length).toBe(3);
      expect(filterCollection[0]).toEqual({ value: 'other', description: 'other' });
      expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
      expect(filterCollection[2]).toEqual({ value: 'female', description: 'female' });
    } catch (e) {
      console.log('ERROR', e)
    }
  });

  it('should create the filter and sort the string collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: ['other', 'male', 'female'],
      collectionSortBy: {
        sortDesc: true,
        fieldType: FieldType.string
      }
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(3);
    expect(filterCollection[0]).toEqual('other');
    expect(filterCollection[1]).toEqual('male');
    expect(filterCollection[2]).toEqual('female');
  });

  it('should create the filter and sort the value/label pair collection when "collectionSortBy" is set', () => {
    mockColumn.filter = {
      collection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }],
      collectionSortBy: {
        property: 'value',
        sortDesc: false,
        fieldType: FieldType.string
      },
      customStructure: {
        value: 'value',
        label: 'description',
      },
    };

    filter.init(filterArguments);
    const filterCollection = filter.collection as any[];

    expect(filterCollection.length).toBe(3);
    expect(filterCollection[0]).toEqual({ value: 'female', description: 'female' });
    expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
    expect(filterCollection[2]).toEqual({ value: 'other', description: 'other' });
  });

  describe('handleSelect method', () => {
    it('should expect the "handleSelect" method to be called when the callback method is triggered when user provide his own filterOptions', () => {
      const spy = jest.spyOn(filter, 'handleSelect');

      mockColumn.filter.collection = [];
      mockColumn.filter.filterOptions = { minLength: 3 } as AutocompleterOption;
      filter.init(filterArguments);
      filter.autocompleterOptions.onSelect({ item: 'fem' });

      expect(spy).toHaveBeenCalledWith({ item: 'fem' });
    });

    it('should expect the "handleSelect" method to be called when the callback method is triggered', () => {
      const spy = jest.spyOn(filter, 'handleSelect');

      mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
      filter.init(filterArguments);
      filter.autocompleterOptions.onSelect({ item: 'fem' });

      expect(spy).toHaveBeenCalledWith({ item: 'fem' });
    });

    it('should initialize the filter with filterOptions and expect the "handleSelect" method to be called when the callback method is triggered', () => {
      const spy = jest.spyOn(filter, 'handleSelect');

      mockColumn.filter.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
      mockColumn.filter.filterOptions = { minLength: 3 } as AutocompleterOption;
      filter.init(filterArguments);
      filter.autocompleterOptions.onSelect({ item: 'fem' });

      expect(spy).toHaveBeenCalledWith({ item: 'fem' });
    });

    it('should trigger a re-render of the DOM element when collection is replaced by new collection', async () => {
      const renderSpy = jest.spyOn(filter, 'renderDomElement');
      const newCollection = [{ value: 'val1', label: 'label1' }, { value: 'val2', label: 'label2' }];
      const mockDataResponse = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }];

      mockColumn.filter = {
        collection: [],
        collectionAsync: Promise.resolve(mockDataResponse),
        enableCollectionWatch: true,
      };

      await filter.init(filterArguments);
      mockColumn.filter.collection = newCollection;
      mockColumn.filter.collection.push({ value: 'val3', label: 'label3' });

      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(3);
      expect(renderSpy).toHaveBeenCalledWith(newCollection);
    });

    it('should trigger a re-render of the DOM element when collection changes', async () => {
      const renderSpy = jest.spyOn(filter, 'renderDomElement');
      const mockDataResponse = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }];

      mockColumn.filter = {
        collection: [],
        collectionAsync: new Promise((resolve) => resolve(mockDataResponse)),
        enableCollectionWatch: true,
      };

      await filter.init(filterArguments);
      mockColumn.filter.collection!.push({ value: 'other', label: 'other' });

      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(renderSpy).toHaveBeenCalledWith(mockColumn.filter.collection);
    });
  });

  describe('renderItem callback method', () => {
    it('should provide "renderItem" in the "filterOptions" and expect the autocomplete "render" to be overriden', () => {
      const mockTemplateString = `<div>Hello World</div>`;
      const mockTemplateCallback = () => mockTemplateString;
      mockColumn.filter.collection = ['male', 'female'];
      mockColumn.filter.filterOptions = {
        showOnFocus: true,
        renderItem: {
          layout: 'fourCorners',
          templateCallback: mockTemplateCallback
        },
      } as AutocompleterOption;

      filter.init(filterArguments);
      const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));

      jest.runAllTimers(); // fast-forward timer

      const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.autocomplete-custom-four-corners');
      expect(filter.filterDomElement).toBeTruthy();
      expect(filter.instance).toBeTruthy();
      expect(filter.autocompleterOptions.render).toEqual(expect.any(Function));
      expect(autocompleteListElms.length).toBe(1);
      expect(autocompleteListElms[0].innerHTML).toContain(mockTemplateString);
    });

    it('should throw an error when "collectionAsync" Promise does not return a valid array', (done) => {
      const promise = Promise.resolve({ hello: 'world' });
      mockColumn.filter.collectionAsync = promise;
      mockColumn.filter.filterOptions = { showOnFocus: true } as AutocompleterOption;
      filter.init(filterArguments).catch((e) => {
        expect(e.toString()).toContain(`Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`);
        done();
      });
    });
  });

  describe('AutocompleterFilter using RxJS Observables', () => {
    let divContainer: HTMLDivElement;
    let filter: AutocompleterFilter;
    let filterArguments: FilterArguments;
    let mockColumn: Column & { filter: ColumnFilter; };
    let collectionService: CollectionService;
    let rxjs: RxJsResourceStub;
    let translaterService: TranslateServiceStub;
    const http = new HttpStub();

    beforeEach(() => {
      translaterService = new TranslateServiceStub();
      collectionService = new CollectionService(translaterService);
      rxjs = new RxJsResourceStub();

      divContainer = document.createElement('div');
      divContainer.innerHTML = template;
      document.body.appendChild(divContainer);
      spyGetHeaderRow = jest.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(divContainer);

      mockColumn = {
        id: 'gender', field: 'gender', filterable: true,
        filter: {
          model: Filters.autocompleter,
        }
      };
      filterArguments = {
        grid: gridStub,
        columnDef: mockColumn,
        callback: jest.fn(),
        filterContainerElm: gridStub.getHeaderRowColumn(mockColumn.id)
      };

      filter = new AutocompleterFilter(translaterService, collectionService, rxjs);
    });

    afterEach(() => {
      filter.destroy();
      jest.clearAllMocks();
    });

    it('should create the filter with a default search term when using "collectionAsync" as an Observable and triggerOnEveryKeyStroke is enabled', async () => {
      const spyCallback = jest.spyOn(filterArguments, 'callback');
      mockColumn.filter.collectionAsync = of(['male', 'female']);
      mockColumn.filter.filterOptions = { showOnFocus: true, triggerOnEveryKeyStroke: true } as AutocompleterOption;

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);

      const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
      // filter.setValues('male');

      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).Event('input', { key: 'a', bubbles: true, cancelable: true }));

      jest.runAllTimers(); // fast-forward time

      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');
      const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
      expect(autocompleteListElms.length).toBe(1);
      expect(filterFilledElms.length).toBe(1);
      expect(spyCallback).toHaveBeenCalledWith(expect.anything(), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['female'], shouldTriggerQuery: true });
    });

    it('should create the autocomplete filter with a "collectionAsync" as an Observable and be able to call next on it and triggerOnEveryKeyStroke is enabled', async () => {
      const mockCollection = ['male', 'female'];
      mockColumn.filter.collectionAsync = of(mockCollection);
      mockColumn.filter.filterOptions = { showOnFocus: true } as AutocompleterOption;

      filterArguments.searchTerms = ['female'];
      await filter.init(filterArguments);

      const filterElm = divContainer.querySelector('input.filter-gender') as HTMLInputElement;
      // filter.setValues('male');

      filterElm.focus();
      filterElm.dispatchEvent(new (window.window as any).Event('input', { key: 'a', bubbles: true, cancelable: true }));


      // after await (or timeout delay) we'll get the Subject Observable
      mockCollection.push('other');
      (mockColumn.filter.collectionAsync as Subject<any[]>).next(mockCollection);

      jest.runAllTimers(); // fast-forward time

      const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
      const filterFilledElms = divContainer.querySelectorAll<HTMLInputElement>('input.filter-gender.filled');

      expect(autocompleteListElms.length).toBe(1);
      expect(filterFilledElms.length).toBe(1);
    });

    it('should create the filter with a value/label pair collectionAsync that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', async () => {
      mockColumn.filter = {
        collectionAsync: of({ deep: { myCollection: [{ value: 'other', description: 'other' }, { value: 'male', description: 'male' }, { value: 'female', description: 'female' }] } }),
        collectionOptions: {
          collectionInsideObjectProperty: 'deep.myCollection'
        },
        customStructure: {
          value: 'value',
          label: 'description',
        },
      };

      await filter.init(filterArguments);
      jest.runAllTimers(); // fast-forward time

      const filterCollection = filter.collection as any[];

      expect(filterCollection.length).toBe(3);
      expect(filterCollection[0]).toEqual({ value: 'other', description: 'other' });
      expect(filterCollection[1]).toEqual({ value: 'male', description: 'male' });
      expect(filterCollection[2]).toEqual({ value: 'female', description: 'female' });
    });

    it('should throw an error when "collectionAsync" Observable does not return a valid array', (done) => {
      mockColumn.filter.collectionAsync = of({ hello: 'world' });
      filter.init(filterArguments).catch((e) => {
        expect(e.toString()).toContain(`Something went wrong while trying to pull the collection from the "collectionAsync" call in the Filter, the collection is not a valid array.`);
        done();
      });
    });
  });
});
