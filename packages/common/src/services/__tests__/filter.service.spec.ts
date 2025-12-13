import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, SlickEventData, type SlickDataView, type SlickEventHandler, type SlickGrid } from '../../core/index.js';
import { FieldType } from '../../enums/index.js';
import { getParsedSearchTermsByFieldType } from '../../filter-conditions/index.js';
import { FilterFactory } from '../../filters/filterFactory.js';
import { Filters, InputFilter, SingleSelectFilter } from '../../filters/index.js';
import type {
  BackendService,
  BackendServiceApi,
  Column,
  ColumnFilters,
  CurrentFilter,
  GridMenuItem,
  GridOption,
  MenuCommandItem,
  RowDetailView,
} from '../../interfaces/index.js';
import { SlickgridConfig } from '../../slickgrid-config.js';
import { BackendUtilityService } from '../backendUtility.service.js';
import { CollectionService } from '../collection.service.js';
import { FilterService } from '../filter.service.js';
import { SharedService } from '../shared.service.js';

vi.useFakeTimers();

const DOM_ELEMENT_ID = 'row-detail123';

function initSetWithValues(values: any[]) {
  const tmpSet = new Set();
  values.forEach((val) => tmpSet.add(val));
  return tmpSet;
}

const gridOptionMock = {
  enableFiltering: true,
  enablePagination: true,
  backendServiceApi: {
    service: undefined,
    preProcess: vi.fn(),
    process: vi.fn(),
    postProcess: vi.fn(),
  },
  gridMenu: {
    commandItems: [
      {
        command: 'clear-filter',
        disabled: false,
        iconCssClass: 'mdi mdi-filter-remove-outline',
        positionOrder: 50,
        title: 'Clear all Filters',
      },
      {
        command: 'toggle-filter',
        disabled: false,
        hidden: true,
        iconCssClass: 'mdi mdi-flip-vertical',
        positionOrder: 52,
        title: 'Toggle Filter Row',
      },
    ],
  },
} as unknown as GridOption;

const dataViewStub = {
  getIdxById: vi.fn(),
  getItemById: vi.fn(),
  getItems: vi.fn(),
  refresh: vi.fn(),
  reSort: vi.fn(),
  setFilter: vi.fn(),
  setFilterArgs: vi.fn(),
  sort: vi.fn(),
} as unknown as SlickDataView;

const backendServiceStub = {
  buildQuery: vi.fn(),
  clearFilters: vi.fn(),
  getCurrentFilters: vi.fn(),
  getCurrentPagination: vi.fn(),
  updateFilters: vi.fn(),
  processOnFilterChanged: () => 'backend query',
} as unknown as BackendService;

const gridStub = {
  autosizeColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getData: () => dataViewStub,
  getHeaderRowColumn: vi.fn(),
  getSortColumns: vi.fn(),
  invalidate: vi.fn(),
  onLocalSortChanged: vi.fn(),
  onSort: new SlickEvent(),
  onBeforeHeaderRowCellDestroy: new SlickEvent(),
  onHeaderRowCellRendered: new SlickEvent(),
  render: vi.fn(),
  setColumns: vi.fn(),
  updateColumns: vi.fn(),
  setHeaderRowVisibility: vi.fn(),
  setSortColumns: vi.fn(),
  setOptions: vi.fn(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

describe('FilterService', () => {
  let service: FilterService;
  let backendUtilityService: BackendUtilityService;
  let collectionService: CollectionService;
  let sharedService: SharedService;
  let slickgridConfig: SlickgridConfig;
  let slickgridEventHandler: SlickEventHandler;
  let rxjsResourceStub: RxJsResourceStub;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    // define a <div> container to simulate a row detail DOM element
    const div = document.createElement('div');
    div.innerHTML = `<div id="${DOM_ELEMENT_ID}">some text</div>`;
    document.body.appendChild(div);

    sharedService = new SharedService();
    slickgridConfig = new SlickgridConfig();
    translateService = new TranslateServiceStub();
    collectionService = new CollectionService(translateService);
    rxjsResourceStub = new RxJsResourceStub();
    backendUtilityService = new BackendUtilityService();
    const filterFactory = new FilterFactory(slickgridConfig, translateService, collectionService);
    service = new FilterService(filterFactory, pubSubServiceStub, sharedService, backendUtilityService, rxjsResourceStub);
    slickgridEventHandler = service.eventHandler;
    vi.spyOn(gridStub, 'getHeaderRowColumn').mockReturnValue(div);
  });

  afterEach(() => {
    delete gridOptionMock.backendServiceApi;
    vi.clearAllMocks();
    service.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should dispose of the event handler', () => {
    const spy = vi.spyOn(slickgridEventHandler, 'unsubscribeAll');
    service.dispose();
    expect(spy).toHaveBeenCalled();
  });

  describe('bindBackendOnFilter method', () => {
    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
    });

    it('should create a filter and its metadata when "onHeaderRowCellRendered" event is triggered', () => {
      const mockArgs = {
        grid: gridStub,
        column: { id: 'firstName', field: 'firstName', filterable: true } as Column,
        node: document.getElementById(DOM_ELEMENT_ID),
      };

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      const columnFilters = service.getColumnFilters();
      const filterMetadataArray = service.getFiltersMetadata();
      const destroySpy = vi.spyOn(filterMetadataArray[0], 'destroy');

      expect(columnFilters).toEqual({});
      expect(filterMetadataArray.length).toBe(1);
      expect(filterMetadataArray[0] instanceof InputFilter).toBeTruthy();
      expect(filterMetadataArray[0].searchTerms).toEqual([]);

      gridStub.onBeforeHeaderRowCellDestroy.notify(mockArgs as any, new SlickEventData(), gridStub);
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call the same filter twice but expect the filter to be rendered only once', () => {
      const mockColumn = {
        id: 'isActive',
        field: 'isActive',
        filterable: true,
        type: FieldType.boolean,
        filter: {
          model: Filters.singleSelect,
          searchTerms: [true],
          collection: [
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      } as Column;
      const mockArgs = { grid: gridStub, column: mockColumn, node: document.getElementById(DOM_ELEMENT_ID) };

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      const columnFilters = service.getColumnFilters();
      const filterMetadataArray = service.getFiltersMetadata();
      const destroySpy = vi.spyOn(filterMetadataArray[0], 'destroy');

      expect(service.isFilterFirstRender).toBe(false);
      expect(columnFilters).toEqual({
        isActive: { columnDef: mockColumn, columnId: 'isActive', operator: 'EQ', searchTerms: [true], parsedSearchTerms: true, type: FieldType.boolean },
      });
      expect(filterMetadataArray.length).toBe(1);
      expect(filterMetadataArray[0] instanceof SingleSelectFilter).toBeTruthy();
      expect(filterMetadataArray[0].searchTerms).toEqual([true]);

      gridStub.onBeforeHeaderRowCellDestroy.notify(mockArgs as any, new SlickEventData(), gridStub);
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call "onBackendFilterChange" when "onSearchChange" event is triggered', async () => {
      const mockColumn = {
        id: 'isActive',
        field: 'isActive',
        filterable: true,
        filter: {
          model: Filters.singleSelect,
          searchTerms: [true],
          collection: [
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      } as Column;
      const mockSearchArgs = {
        clearFilterTriggered: false,
        shouldTriggerQuery: true,
        columnId: 'isActive',
        columnDef: mockColumn,
        operator: 'EQ',
        searchTerms: ['John'],
        grid: gridStub,
      };
      (vi.spyOn(backendServiceStub, 'getCurrentFilters') as Mock).mockReturnValue([{ columnId: 'isActive', operator: 'EQ', searchTerms: ['John'] }]);
      const mockHeaderArgs = { grid: gridStub, column: mockColumn, node: document.getElementById(DOM_ELEMENT_ID) };
      const spyBackendChange = vi.spyOn(service, 'onBackendFilterChange');
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockHeaderArgs as any, new SlickEventData(), gridStub);
      service.onSearchChange!.notify(mockSearchArgs, new SlickEventData(), gridStub);

      expect(spyBackendChange).toHaveBeenCalledWith(expect.anything(), mockSearchArgs);

      await new Promise(process.nextTick);

      expect(gridOptionMock.backendServiceApi!.service.getCurrentFilters).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'isActive', operator: 'EQ', searchTerms: ['John'] }]);
      expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'isActive', operator: 'EQ', searchTerms: ['John'] }]);
    });
  });

  describe('bindLocalOnFilter method', () => {
    beforeEach(() => {
      gridOptionMock.backendServiceApi = undefined;
    });

    it('should create a filter and its metadata when "onHeaderRowCellRendered" event is triggered', () => {
      const mockArgs = {
        grid: gridStub,
        column: { id: 'firstName', field: 'firstName', filterable: true } as Column,
        node: document.getElementById(DOM_ELEMENT_ID),
      };

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      const columnFilters = service.getColumnFilters();
      const filterMetadataArray = service.getFiltersMetadata();
      const destroySpy = vi.spyOn(filterMetadataArray[0], 'destroy');

      expect(columnFilters).toEqual({});
      expect(filterMetadataArray.length).toBe(1);
      expect(filterMetadataArray[0] instanceof InputFilter).toBeTruthy();
      expect(filterMetadataArray[0].searchTerms).toEqual([]);

      gridStub.onBeforeHeaderRowCellDestroy.notify(mockArgs as any, new SlickEventData(), gridStub);
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call "onFilterChanged" when "onSearchChange" event is triggered', async () => {
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
      const mockArgs = {
        clearFilterTriggered: false,
        shouldTriggerQuery: true,
        columnId: 'firstName',
        columnDef: { id: 'firstName', field: 'firstName', filterable: true } as Column,
        operator: 'EQ',
        searchTerms: ['John'],
        grid: gridStub,
      };

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      service.onSearchChange!.notify(mockArgs as any, new SlickEventData(), gridStub);

      await new Promise(process.nextTick);

      expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, []);
      expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, []);
    });

    it('should call "onFilterChanged" with column filter when both onHeaderRowCellRendered" and "onSearchChange" events are triggered', async () => {
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
      const mockColumn = {
        id: 'firstName',
        field: 'firstName',
        filterable: true,
        filter: {
          model: Filters.singleSelect,
          searchTerms: [true],
          collection: [
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      } as Column;
      const tmpDivElm = document.createElement('div');
      tmpDivElm.className = 'some-classes';
      const mockHeaderArgs = { grid: gridStub, column: mockColumn, node: document.getElementById(DOM_ELEMENT_ID) };
      const mockSearchArgs = {
        clearFilterTriggered: false,
        shouldTriggerQuery: true,
        columnId: 'firstName',
        columnDef: { id: 'firstName', field: 'firstName', filterable: true } as Column,
        operator: 'EQ',
        searchTerms: ['John'],
        target: tmpDivElm,
        grid: gridStub,
      };
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockHeaderArgs as any, new SlickEventData(), gridStub);
      service.onSearchChange!.notify(mockSearchArgs, new SlickEventData(), gridStub);

      await new Promise(process.nextTick);

      expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'firstName', operator: 'EQ', searchTerms: [true] }]);
      expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'firstName', operator: 'EQ', searchTerms: [true] }]);
    });
  });

  // this is a private method test, but we can access it by triggering a Filter Search event or through the Filter metadata
  describe('callbackSearchEvent (private) method', () => {
    let mockColumn: Column;
    let mockArgs: any;

    beforeEach(() => {
      gridOptionMock.backendServiceApi = undefined;
      mockColumn = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      mockArgs = { grid: gridStub, column: mockColumn, node: document.getElementById(DOM_ELEMENT_ID) };
      sharedService.allColumns = [mockColumn];
    });

    it('should execute the search callback normally when a input change event is triggered and searchTerms are defined', async () => {
      const expectationColumnFilter = {
        columnDef: mockColumn,
        columnId: 'firstName',
        operator: 'EQ',
        searchTerms: ['John'],
        parsedSearchTerms: ['John'],
        targetSelector: '',
        type: FieldType.string,
      };
      const spySearchChange = vi.spyOn(service.onSearchChange as any, 'notify');
      const spyEmit = vi.spyOn(service, 'emitFilterChanged');

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[0].callback(new Event('input'), { columnDef: mockColumn, operator: 'EQ', searchTerms: ['John'], shouldTriggerQuery: true });

      await new Promise(process.nextTick);

      expect(service.getColumnFilters()).toEqual(expect.objectContaining({ firstName: expectationColumnFilter }));
      expect(spySearchChange).toHaveBeenCalledWith(
        {
          clearFilterTriggered: undefined,
          shouldTriggerQuery: true,
          columnId: 'firstName',
          columnDef: mockColumn,
          columnFilters: { firstName: expectationColumnFilter },
          operator: 'EQ',
          searchTerms: ['John'],
          parsedSearchTerms: ['John'],
          grid: gridStub,
          target: null,
        },
        expect.anything()
      );
      expect(spyEmit).toHaveBeenCalledWith('local');
    });

    it('should execute the callback normally when a input change event is triggered and the searchTerm comes from this event.target', () => {
      const expectationColumnFilter = {
        columnDef: mockColumn,
        columnId: 'firstName',
        operator: 'EQ',
        searchTerms: ['John'],
        parsedSearchTerms: ['John'],
        targetSelector: '',
        type: FieldType.string,
      };
      const spySearchChange = vi.spyOn(service.onSearchChange as any, 'notify');
      sharedService.allColumns = [mockColumn];

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);

      const mockEvent = new Event('input');
      Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: { value: 'John' } });
      service.getFiltersMetadata()[0].callback(mockEvent, { columnDef: mockColumn, operator: 'EQ', shouldTriggerQuery: true });

      expect(service.getColumnFilters()).toEqual(expect.objectContaining({ firstName: expectationColumnFilter }));
      expect(spySearchChange).toHaveBeenCalledWith(
        {
          clearFilterTriggered: undefined,
          shouldTriggerQuery: true,
          columnId: 'firstName',
          columnDef: mockColumn,
          columnFilters: { firstName: expectationColumnFilter },
          operator: 'EQ',
          searchTerms: ['John'],
          parsedSearchTerms: ['John'],
          grid: gridStub,
          target: { value: 'John' },
        },
        expect.anything()
      );
    });

    it('should delete the column filters entry (from column filter object) when searchTerms is empty', () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[0].callback(new Event('input'), {
        columnDef: { ...mockColumn, filter: { model: Filters.singleSelect } },
        operator: 'EQ',
        searchTerms: [''],
        shouldTriggerQuery: true,
      });

      expect(service.getColumnFilters()).toEqual({});
    });

    it('should NOT delete the column filters entry (from column filter object) even when searchTerms is empty when user set `emptySearchTermReturnAllValues` to False', () => {
      const expectationColumnFilter = {
        columnDef: mockColumn,
        columnId: 'firstName',
        operator: 'EQ',
        searchTerms: [''],
        parsedSearchTerms: [''],
        targetSelector: 'div.some-classes',
        type: FieldType.string,
      };
      const spySearchChange = vi.spyOn(service.onSearchChange as any, 'notify');
      sharedService.allColumns = [mockColumn];

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      mockArgs.column.filter = { emptySearchTermReturnAllValues: false };
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      const tmpDivElm = document.createElement('div');
      tmpDivElm.className = 'some-classes';
      const inputEvent = new Event('input');
      Object.defineProperty(inputEvent, 'target', { writable: true, configurable: true, value: tmpDivElm });
      service
        .getFiltersMetadata()[0]
        .callback(inputEvent, { columnDef: mockColumn, operator: 'EQ', searchTerms: [''], shouldTriggerQuery: true, target: tmpDivElm } as any);

      expect(service.getColumnFilters()).toEqual(expect.objectContaining({ firstName: expectationColumnFilter }));
      expect(spySearchChange).toHaveBeenCalledWith(
        {
          clearFilterTriggered: undefined,
          shouldTriggerQuery: true,
          columnId: 'firstName',
          columnDef: mockColumn,
          columnFilters: { firstName: expectationColumnFilter },
          operator: 'EQ',
          searchTerms: [''],
          parsedSearchTerms: [''],
          grid: gridStub,
          target: tmpDivElm,
        },
        expect.anything()
      );
      expect(service.getCurrentLocalFilters()).toEqual([{ columnId: 'firstName', operator: 'EQ', searchTerms: [''], targetSelector: 'div.some-classes' }]);
    });

    it('should delete the column filters entry (from column filter object) when searchTerms is empty array and even when triggered event is undefined', () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[0].callback(undefined, { columnDef: mockColumn, operator: 'EQ', searchTerms: [], shouldTriggerQuery: true });

      expect(service.getColumnFilters()).toEqual({});
    });

    it('should delete the column filters entry (from column filter object) when searchTerms & operator are undefined or not provided', () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[0].callback(undefined, { columnDef: mockColumn, shouldTriggerQuery: true });

      expect(service.getColumnFilters()).toEqual({});
    });
  });

  describe('clearFilter methods on backend grid', () => {
    let mockColumn1: Column;
    let mockColumn2: Column;
    let mockColumn3: Column;

    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
      // we must use 3 separate Filters because we aren't loading the Framework and so our Filters are not transient (as defined in lib config)
      mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true, filter: { model: Filters.input } } as Column;
      mockColumn2 = { id: 'lastName', field: 'lastName', filterable: true, filter: { model: Filters.inputText } } as Column;
      mockColumn3 = { id: 'age', field: 'age', filterable: true, filter: { model: Filters.inputNumber } } as Column;

      const mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
      const mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
      const mockArgs3 = { grid: gridStub, column: mockColumn3, node: document.getElementById(DOM_ELEMENT_ID) };

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs3 as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[1].callback(new Event('input'), { columnDef: mockColumn3 });
      service.getFiltersMetadata()[0].callback(new Event('input'), { columnDef: mockColumn1, operator: 'EQ', searchTerms: ['John'], shouldTriggerQuery: true });
      service.getFiltersMetadata()[1].callback(new Event('input'), { columnDef: mockColumn2, operator: 'NE', searchTerms: ['Doe'], shouldTriggerQuery: true });
    });

    describe('clearFilterByColumnId method', () => {
      it('should clear the filter by passing a column id as argument on a backend grid', async () => {
        const filterExpectation = {
          columnDef: mockColumn2,
          columnId: 'lastName',
          operator: 'NE',
          searchTerms: ['Doe'],
          parsedSearchTerms: ['Doe'],
          targetSelector: '',
          type: FieldType.string,
        };
        const newEvent = new SlickEventData(new CustomEvent(`mouseup`));
        const spyClear = vi.spyOn(service.getFiltersMetadata()[0], 'clear');
        const spyFilterChange = vi.spyOn(service, 'onBackendFilterChange');
        const spyEmitter = vi.spyOn(service, 'emitFilterChanged');
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        const filterCountBefore = Object.keys(service.getColumnFilters()).length;
        await service.clearFilterByColumnId(newEvent, 'firstName');
        const filterCountAfter = Object.keys(service.getColumnFilters()).length;

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterClear`, { columnId: 'firstName' }, 0);
        expect(spyClear).toHaveBeenCalled();
        expect(spyFilterChange).toHaveBeenCalledWith(newEvent, { grid: gridStub, columnFilters: { lastName: filterExpectation } });
        expect(filterCountBefore).toBe(2);
        expect(filterCountAfter).toBe(1);
        expect(service.getColumnFilters()).toEqual({ lastName: filterExpectation });
        expect(spyEmitter).toHaveBeenCalledWith('remote');
      });

      it('should not call "onBackendFilterChange" method when the filter is previously empty', async () => {
        const filterFirstExpectation = {
          columnDef: mockColumn1,
          columnId: 'firstName',
          operator: 'EQ',
          searchTerms: ['John'],
          parsedSearchTerms: ['John'],
          targetSelector: '',
          type: FieldType.string,
        };
        const filterLastExpectation = {
          columnDef: mockColumn2,
          columnId: 'lastName',
          operator: 'NE',
          searchTerms: ['Doe'],
          parsedSearchTerms: ['Doe'],
          targetSelector: '',
          type: FieldType.string,
        };
        const newEvent = new SlickEventData(new CustomEvent(`mouseup`));
        const spyClear = vi.spyOn(service.getFiltersMetadata()[2], 'clear');
        const spyFilterChange = vi.spyOn(service, 'onBackendFilterChange');
        const spyEmitter = vi.spyOn(service, 'emitFilterChanged');
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        const filterCountBefore = Object.keys(service.getColumnFilters()).length;
        await service.clearFilterByColumnId(newEvent, 'age');
        const filterCountAfter = Object.keys(service.getColumnFilters()).length;

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterClear`, { columnId: 'age' }, 0);
        expect(spyClear).toHaveBeenCalled();
        expect(spyFilterChange).not.toHaveBeenCalled();
        expect(filterCountBefore).toBe(2);
        expect(filterCountAfter).toBe(2);
        expect(service.getColumnFilters()).toEqual({ firstName: filterFirstExpectation, lastName: filterLastExpectation });
        expect(spyEmitter).toHaveBeenCalledWith('remote');
      });
    });

    describe('clearFilters method', () => {
      beforeEach(() => {
        const mockColumns = [
          { id: 'field1', field: 'field1', width: 100, filter: { searchTerms: ['John'] } },
          { id: 'field2', field: 'field2', width: 100 },
        ];
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(mockColumns);
      });

      it('should clear all the Filters when the query response is a string', async () => {
        gridOptionMock.backendServiceApi!.service.processOnFilterChanged = () => 'filter query string';
        const spyClear = vi.spyOn(service.getFiltersMetadata()[0], 'clear');
        const spyFilterChange = vi.spyOn(service, 'onBackendFilterChange');
        const spyEmitter = vi.spyOn(service, 'emitFilterChanged');
        const spyProcess = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'process');

        const filterCountBefore = Object.keys(service.getColumnFilters()).length;
        await service.clearFilters();

        expect(spyClear).toHaveBeenCalled();
        expect(filterCountBefore).toBe(2);
        expect(spyProcess).toHaveBeenCalledWith('filter query string');
        expect(service.getColumnFilters()).toEqual({});
        expect(spyFilterChange).not.toHaveBeenCalled();
        expect(spyEmitter).not.toHaveBeenCalled();
        expect(sharedService.columnDefinitions[0].filter!.searchTerms).toBeUndefined();
      });

      it('should execute the "onError" method when the Promise throws an error', async () => {
        const errorExpected = 'promise error';
        gridOptionMock.backendServiceApi!.process = () => Promise.reject(errorExpected);
        gridOptionMock.backendServiceApi!.onError = () => vi.fn();
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const spyOnError = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'onError');
        const updateFilterSpy = vi.spyOn(service, 'updateFilters');
        vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'process');

        // get previous filters before calling the query that will fail
        const previousFilters = service.getPreviousFilters();

        service.clearFilters();
        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterClear`, true, 0);

        await new Promise(process.nextTick);

        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterCleared`, true);
        expect(spyOnError).toHaveBeenCalledWith(errorExpected);
        expect(updateFilterSpy).toHaveBeenCalledWith(previousFilters, false, false, false);
      });

      it('should execute the "onError" method when the Observable throws an error', async () => {
        const errorExpected = 'observable error';
        const spyProcess = vi.fn();
        gridOptionMock.backendServiceApi!.process = () => of(spyProcess);
        gridOptionMock.backendServiceApi!.onError = () => vi.fn();
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const spyOnError = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'onError');
        vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(throwError(errorExpected));

        backendUtilityService.addRxJsResource(rxjsResourceStub);
        service.addRxJsResource(rxjsResourceStub);
        service.clearFilters();

        await new Promise(process.nextTick);

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterClear`, true, 0);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterCleared`, true);
        expect(spyOnError).toHaveBeenCalledWith(errorExpected);
      });
    });
  });

  describe('clearFilter methods on local grid', () => {
    let mockColumn1: Column;
    let mockColumn2: Column;

    beforeEach(() => {
      // we must use 2 separate Filters because we aren't loading the Framework and so our Filters are not transient (as defined in lib config)
      gridOptionMock.backendServiceApi = undefined;
      mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true, filter: { model: Filters.input } } as Column;
      mockColumn2 = { id: 'lastName', field: 'lastName', filterable: true, filter: { model: Filters.inputText } } as Column;
      const mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
      const mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
      sharedService.allColumns = [mockColumn1, mockColumn2];

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      service.getFiltersMetadata()[0].callback(new Event('input'), { columnDef: mockColumn1, operator: 'EQ', searchTerms: ['John'], shouldTriggerQuery: true });
      service.getFiltersMetadata()[1].callback(new Event('input'), { columnDef: mockColumn2, operator: 'NE', searchTerms: ['Doe'], shouldTriggerQuery: true });
    });

    describe('clearFilterByColumnId method', () => {
      it('should clear the filter by passing a column id as argument on a local grid', async () => {
        const spyClear = vi.spyOn(service.getFiltersMetadata()[0], 'clear');
        const spyEmitter = vi.spyOn(service, 'emitFilterChanged');
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const newEvent = new SlickEventData(new CustomEvent(`mouseup`));
        const filterCountBefore = Object.keys(service.getColumnFilters()).length;
        await service.clearFilterByColumnId(newEvent, 'firstName');
        const filterCountAfter = Object.keys(service.getColumnFilters()).length;

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterClear`, { columnId: 'firstName' }, 0);
        expect(spyClear).toHaveBeenCalled();
        expect(filterCountBefore).toBe(2);
        expect(filterCountAfter).toBe(1);
        expect(service.getColumnFilters()).toEqual({
          lastName: {
            columnDef: mockColumn2,
            columnId: 'lastName',
            operator: 'NE',
            searchTerms: ['Doe'],
            parsedSearchTerms: ['Doe'],
            targetSelector: '',
            type: FieldType.string,
          },
        });
        expect(spyEmitter).toHaveBeenCalledWith('local');
      });
    });
  });

  describe('customLocalFilter method', () => {
    let mockItem1: any;

    beforeEach(() => {
      vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);
      mockItem1 = { firstName: 'John', lastName: 'Doe', fullName: 'John Doe', age: 26, address: { zip: 123456 } };
    });

    it('should run "filterPredicate" when provided by the user as a custom filter callback and return True when predicate returns true', () => {
      const columnId = 'firstName';
      const searchTerms = ['John'];
      const mockColumn1 = {
        id: columnId,
        field: columnId,
        filterable: true,
        filter: {
          model: Filters.inputText,
          filterPredicate: (dataContext: any, searchFilterArgs: any) => {
            return dataContext[columnId] === searchFilterArgs.parsedSearchTerms![0];
          },
        },
      } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should run "filterPredicate" when provided by the user as a custom filter callback and return False when predicate returns false', () => {
      const columnId = 'firstName';
      const searchTerms = ['JANE'];
      const mockColumn1 = {
        id: columnId,
        field: columnId,
        filterable: true,
        filter: {
          model: Filters.inputText,
          filterPredicate: (dataContext: any, searchFilterArgs: any) => {
            return dataContext[columnId] === searchFilterArgs.parsedSearchTerms![0];
          },
        },
      } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should execute "getParsedSearchTermsByFieldType" once if the first "customLocalFilter" is executed without parsedSearchTerms at the beginning', () => {
      const searchTerms = ['John'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);

      service.init(gridStub);
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(columnFilters.firstName['parsedSearchTerms']).toEqual(['John']);
      expect(output).toBe(true);
    });

    it('should return True (nothing to filter, all rows will be returned) when there are no column definition found', () => {
      const searchTerms = ['John'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is the same as the searchTerms', () => {
      const searchTerms = ['John'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should work on a hidden column by using the sharedService "allColumns" and return True when input value the same as the searchTerms', () => {
      const searchTerms = ['John'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      sharedService.allColumns = [mockColumn1];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: {
          columnDef: undefined as any,
          columnId: 'firstName',
          operator: 'EQ',
          searchTerms,
          parsedSearchTerms,
          targetSelector: '',
          type: FieldType.string,
        },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when the searchTerms is an empty array', () => {
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'EQ', searchTerms: [], type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when the searchTerms is equal to the operator', () => {
      const mockColumn1 = { id: 'age', field: 'age', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilters = { age: { columnDef: mockColumn1, columnId: 'age', operator: '<=', searchTerms: ['<='], type: FieldType.string } } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return False when input value from datacontext is not equal to the searchTerms', () => {
      const searchTerms = ['Johnny'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should work on a hidden column by using the sharedService "allColumns" and return return False when input value is not equal to the searchTerms', () => {
      const searchTerms = ['Johnny'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      sharedService.allColumns = [mockColumn1];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should return True when input value from datacontext is a number and searchTerms is also a number', () => {
      const searchTerms = [26];
      const mockColumn1 = { id: 'age', field: 'age', filterable: true, type: FieldType.number } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'age', type: FieldType.number };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'number');
      const columnFilters = {
        age: { ...columnFilter, operator: 'EQ', searchTerms: filterCondition.searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is a number, "filterSearchType" is a FieldType number and finally searchTerms is also a number', () => {
      const searchTerms = [26];
      const mockColumn1 = { id: 'age', field: 'age', filterable: true, filterSearchType: FieldType.number } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'age', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'number');
      const columnFilters = {
        age: { ...columnFilter, operator: 'EQ', searchTerms: filterCondition.searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is equal to startsWith substring', () => {
      const searchTerms = ['Jo*'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is equal to startsWith (1x)char + endsWith (1x)char', () => {
      const searchTerms = ['J*n'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is equal to startsWith substring + endsWith substring', () => {
      const searchTerms = ['Jo*hn'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return False when input value from datacontext does NOT equal both startsWith substring + endsWith substring', () => {
      const searchTerms = ['J*nee'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should return True when input value from datacontext is equal to startsWith substring when using Operator startsWith', () => {
      const searchTerms = ['Jo'];
      const operator = 'a*';
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'text');
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator, searchTerms, parsedSearchTerms, type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is equal to startsWith substring when having (*) as the last character in the searchTerms', () => {
      const searchTerms = ['Jo*'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return False when input value has special char "*" substring but "autoParseInputFilterOperator" is set to false so the text "Jo*" will not be found', () => {
      const searchTerms = ['Jo*'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true, autoParseInputFilterOperator: false } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should return True when input value from datacontext is equal to endsWith substring', () => {
      const searchTerms = ['*hn'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is equal to endsWith substring when using Operator endsWith', () => {
      const searchTerms = ['*hn'];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstName: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext is IN searchTerms', () => {
      const customFirstNameFormatter = (_row: number, _cell: number, _value: any, _columnDef: any, dataContext: any) => dataContext.fullName.split(' ')[0];
      const mockColumn1 = {
        id: 'firstName',
        field: 'firstName',
        filterable: true,
        formatter: customFirstNameFormatter,
        params: { useFormatterOuputToFilter: true },
      } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        firstName: { columnDef: mockColumn1, columnId: 'firstName', operator: 'IN', searchTerms: ['Jane', 'John'], type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when input value from datacontext contains an operator ">=" and its value is greater than 10', () => {
      const searchTerms = ['>=10'];
      const mockColumn1 = { id: 'age', field: 'age', filterable: true, autoParseInputFilterOperator: false } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'age', type: FieldType.number };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'number');
      const columnFilters = {
        age: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return False, since firstname is filled, when input value from datacontext contains an operator "<>" and its value is an empty string', () => {
      const searchTerms = ['<> '];
      const mockColumn1 = { id: 'firstName', field: 'firstName', filterable: true } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'firstName', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'text');
      const columnFilters = {
        firstname: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should return False when input value from datacontext contains an operator >= and its value is greater than 10 substring but "autoParseInputFilterOperator" is set to false', () => {
      const searchTerms = ['>=10'];
      const mockColumn1 = { id: 'age', field: 'age', filterable: true, autoParseInputFilterOperator: false } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);

      service.init(gridStub);
      const columnFilter = { columnDef: mockColumn1, columnId: 'age', type: FieldType.string };
      const filterCondition = service.parseFormInputFilterConditions(searchTerms, columnFilter);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(filterCondition.searchTerms, 'string');
      const columnFilters = {
        age: { ...columnFilter, operator: filterCondition.operator, searchTerms: filterCondition.searchTerms, parsedSearchTerms },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should return True when input value is a complex object searchTerms value is found following the dot notation', () => {
      const searchTerms = [123456];
      const mockColumn1 = { id: 'zip', field: 'zip', filterable: true, queryFieldFilter: 'address.zip', type: FieldType.number } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const parsedSearchTerms = getParsedSearchTermsByFieldType(searchTerms, 'number');
      const columnFilters = {
        zip: { columnDef: mockColumn1, columnId: 'zip', operator: 'EQ', searchTerms, parsedSearchTerms, type: FieldType.number },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when using row detail and the item is found in its parent', () => {
      gridOptionMock.enableRowDetailView = true;
      const mockColumn1 = { id: 'zip', field: 'zip', filterable: true, queryFieldFilter: 'address.zip', type: FieldType.number } as Column;
      const mockItem2 = { __isPadding: true, __parent: mockItem1 };
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        zip: { columnDef: mockColumn1, columnId: 'zip', operator: 'EQ', searchTerms: [123456], parsedSearchTerms: [123456], type: FieldType.number },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem2, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should return True when using row detail custom "keyPrefix" and the item is found in its parent', () => {
      gridOptionMock.rowDetailView = { keyPrefix: 'prefix_' } as RowDetailView;
      gridOptionMock.enableRowDetailView = true;
      const mockColumn1 = { id: 'zip', field: 'zip', filterable: true, queryFieldFilter: 'address.zip', type: FieldType.number } as Column;
      const mockItem2 = { prefix_isPadding: true, prefix_parent: mockItem1 };
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        zip: { columnDef: mockColumn1, columnId: 'zip', operator: 'EQ', searchTerms: [123456], parsedSearchTerms: [123456], type: FieldType.number },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem2, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should execute "queryFieldNameGetterFn()" callback and return True when input value matches the full name', () => {
      const mockColumn1 = { id: 'name', field: 'name', filterable: true, queryFieldNameGetterFn: () => 'fullName' } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        name: { columnDef: mockColumn1, columnId: 'name', operator: 'EQ', searchTerms: ['John Doe'], parsedSearchTerms: ['John Doe'], type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(true);
    });

    it('should execute "queryFieldNameGetterFn()" callback and return False when input value is not fullName but just the firstName', () => {
      const mockColumn1 = { id: 'name', field: 'name', filterable: true, queryFieldNameGetterFn: () => 'fullName' } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        name: { columnDef: mockColumn1, columnId: 'name', operator: 'EQ', searchTerms: ['John'], parsedSearchTerms: ['John'], type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });

    it('should execute "queryFieldNameGetterFn()" callback and return False when input value is not fullName but just the lastName', () => {
      const mockColumn1 = { id: 'name', field: 'name', filterable: true, queryFieldNameGetterFn: () => 'fullName' } as Column;
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0);

      service.init(gridStub);
      const columnFilters = {
        name: { columnDef: mockColumn1, columnId: 'name', operator: 'EQ', searchTerms: ['Doe'], parsedSearchTerms: ['Doe'], type: FieldType.string },
      } as ColumnFilters;
      const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

      expect(output).toBe(false);
    });
  });

  describe('onBackendFilterChange method', () => {
    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        service: backendServiceStub,
        preProcess: vi.fn(),
        process: vi.fn(),
        postProcess: vi.fn(),
      };
    });

    it('should throw an error when grid argument is undefined', () =>
      new Promise((done: any) => {
        service.onBackendFilterChange(undefined as any, undefined as any).catch((error) => {
          expect(error.message).toContain(`Something went wrong when trying to bind the "onBackendFilterChange(event, args)" function`);
          done();
        });
      }));

    it('should throw an error when grid argument is an empty object', () =>
      new Promise((done: any) => {
        service.onBackendFilterChange(undefined as any, {} as any).catch((error) => {
          expect(error.message).toContain(`Something went wrong when trying to bind the "onBackendFilterChange(event, args)" function`);
          done();
        });
      }));

    it('should throw an error when backendServiceApi is undefined', () =>
      new Promise((done: any) => {
        gridOptionMock.backendServiceApi = undefined;

        service.onBackendFilterChange(undefined as any, { grid: gridStub } as any).catch((error) => {
          expect(error.message).toContain(`BackendServiceApi requires at least a "process" function and a "service" defined`);
          done();
        });
      }));

    it('should execute "preProcess" method when it is defined', () => {
      const spy = vi.spyOn(gridOptionMock.backendServiceApi as BackendServiceApi, 'preProcess');

      service.init(gridStub);
      service.onBackendFilterChange(undefined as any, { grid: gridStub } as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('populateColumnFilterSearchTermPresets method', () => {
    beforeEach(() => {
      gridStub.getColumns = vi.fn();
      gridOptionMock.presets = {
        filters: [{ columnId: 'gender', searchTerms: ['male'], operator: 'EQ' }],
        sorters: [{ columnId: 'name', direction: 'asc' }],
        pagination: { pageNumber: 2, pageSize: 20 },
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return an empty array when column definitions returns nothing as well', () => {
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([]);

      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(undefined as any);

      expect(output).toEqual([]);
    });

    it('should populate presets and remove column definitions searchTerms to be replaced by the presets values', () => {
      const spy = vi.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ', searchTerms: ['John'] } },
        { id: 'gender', field: 'gender' },
      ]);

      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(gridOptionMock.presets!.filters as any);

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ' } },
        { id: 'gender', field: 'gender', filter: { operator: 'EQ', searchTerms: ['male'] } },
      ]);
    });

    it('should use the column definition operator when not provided in the presets filter', () => {
      gridOptionMock.presets = {
        filters: [{ columnId: 'gender', searchTerms: ['male'] }],
        sorters: [{ columnId: 'name', direction: 'asc' }],
        pagination: { pageNumber: 2, pageSize: 20 },
      };
      const spy = vi.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'name', field: 'name' },
        { id: 'gender', field: 'gender', filter: { model: Filters.input, operator: 'EQ', searchTerms: ['male'] } },
      ]);

      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(gridOptionMock.presets!.filters as any);

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual([
        { id: 'name', field: 'name' },
        { id: 'gender', field: 'gender', filter: { model: Filters.input, operator: 'EQ', searchTerms: ['male'] } },
      ]);
    });

    it('should have an operator with empty string when it is not provided in the presets filter neither in its column definition', () => {
      gridOptionMock.presets = {
        filters: [{ columnId: 'gender', searchTerms: ['male'] }],
        sorters: [{ columnId: 'name', direction: 'asc' }],
        pagination: { pageNumber: 2, pageSize: 20 },
      };
      const spy = vi.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'name', field: 'name' },
        { id: 'gender', field: 'gender' },
      ]);

      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(gridOptionMock.presets!.filters as any);

      expect(spy).toHaveBeenCalled();
      expect(output).toEqual([
        { id: 'name', field: 'name' },
        { id: 'gender', field: 'gender', filter: { operator: '', searchTerms: ['male'] } },
      ]);
    });

    it('should pre-filter the tree dataset when the grid is a Tree Data View & dataset is empty', () => {
      const spyRefresh = vi.spyOn(dataViewStub, 'refresh');
      const spyPreFilter = vi.spyOn(service, 'preFilterTreeData');
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ' } },
        { id: 'gender', field: 'gender' },
        { id: 'size', field: 'size', filter: { model: Filters.input, operator: '>=' } },
      ]);
      const mockFlatDataset = [
        { id: 0, name: 'John', gender: 'male', size: 170 },
        { id: 1, name: 'Jane', gender: 'female', size: 150 },
      ];
      vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'get').mockReturnValue(mockFlatDataset);
      gridOptionMock.enableTreeData = true;
      gridOptionMock.treeDataOptions = { columnId: 'file', childrenPropName: 'files' };
      gridOptionMock.presets = {
        filters: [{ columnId: 'size', searchTerms: [20], operator: '>=' }],
      };
      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(gridOptionMock.presets!.filters as any);

      expect(spyRefresh).not.toHaveBeenCalled();
      vi.spyOn(dataViewStub, 'getItems').mockReturnValue(mockFlatDataset);

      vi.runAllTimers();

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyPreFilter).toHaveBeenCalled();
      expect(spyRefresh).toHaveBeenCalled();
      expect(output).toEqual([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ' } },
        { id: 'gender', field: 'gender' },
        { id: 'size', field: 'size', filter: { model: Filters.input, operator: '>=', searchTerms: [20] } },
      ]);
    });

    it('should pre-filter the tree dataset when the grid is a Tree Data View & dataset is filled', () => {
      const spyRefresh = vi.spyOn(dataViewStub, 'refresh');
      const spyPreFilter = vi.spyOn(service, 'preFilterTreeData');
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ' } },
        { id: 'gender', field: 'gender' },
        { id: 'size', field: 'size', filter: { model: Filters.input, operator: '>=' } },
      ]);
      const mockFlatDataset = [
        { id: 0, name: 'John', gender: 'male', size: 170 },
        { id: 1, name: 'Jane', gender: 'female', size: 150 },
      ];
      vi.spyOn(dataViewStub, 'getItems').mockReturnValue(mockFlatDataset);
      gridOptionMock.enableTreeData = true;
      gridOptionMock.treeDataOptions = { columnId: 'file', childrenPropName: 'files' };
      gridOptionMock.presets = {
        filters: [{ columnId: 'size', searchTerms: [20], operator: '>=' }],
      };
      service.init(gridStub);
      const output = service.populateColumnFilterSearchTermPresets(gridOptionMock.presets!.filters as any);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyRefresh).toHaveBeenCalled();
      expect(spyPreFilter).toHaveBeenCalled();
      expect(output).toEqual([
        { id: 'name', field: 'name', filter: { model: Filters.input, operator: 'EQ' } },
        { id: 'gender', field: 'gender' },
        { id: 'size', field: 'size', filter: { model: Filters.input, operator: '>=', searchTerms: [20] } },
      ]);
    });
  });

  describe('updateFilters method', () => {
    let mockColumn1: Column;
    let mockColumn2: Column;
    let mockArgs1: any;
    let mockArgs2: any;
    let mockNewFilters: CurrentFilter[];

    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.enableTreeData = false;
      gridOptionMock.backendServiceApi = undefined;
      mockColumn1 = { id: 'firstName', name: 'firstName', field: 'firstName', filterable: true, filter: { model: Filters.inputText } };
      mockColumn2 = {
        id: 'isActive',
        name: 'isActive',
        field: 'isActive',
        type: FieldType.boolean,
        filterable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      };
      mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
      mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
      mockNewFilters = [
        { columnId: 'firstName', searchTerms: ['Jane'], operator: 'StartsWith' },
        { columnId: 'isActive', searchTerms: [false] },
      ];
      sharedService.allColumns = [mockColumn1, mockColumn2];
    });

    it('should throw an error when there are no filters defined in the column definitions', async () => {
      try {
        gridOptionMock.enableFiltering = false;
        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        await service.updateFilters([{ columnId: 'firstName', searchTerms: ['John'] }]);
      } catch (e: any) {
        expect(e.toString()).toContain(
          '[Slickgrid-Universal] in order to use "updateFilters" method, you need to have Filterable Columns defined in your grid'
        );
      }
    });

    it('should call "clearFilters" without triggering a clear event but trigger an "emitFilterChanged" local when using "bindLocalOnFilter" and also expect filters to be set in ColumnFilters', async () => {
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      expect(emitSpy).toHaveBeenCalledWith('local');
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          type: FieldType.string,
        },
        isActive: { columnId: 'isActive', columnDef: mockColumn2, searchTerms: [false], operator: 'EQ', parsedSearchTerms: false, type: FieldType.boolean },
      });
    });

    it('should call "resetToPreviousSearchFilters" when "onBeforeSearchChange" event is prevented from bubbling and "resetFilterSearchValueAfterOnBeforeCancellation" is set to true', async () => {
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish').mockReturnValue(false);
      const resetPrevSpy = vi.spyOn(service, 'resetToPreviousSearchFilters');

      gridOptionMock.resetFilterSearchValueAfterOnBeforeCancellation = true;
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters, false, false, true);

      expect(pubSubSpy).toHaveBeenCalledWith('onBeforeSearchChange', expect.any(Object));
      expect(resetPrevSpy).toHaveBeenCalled();
      vi.spyOn(pubSubServiceStub, 'publish').mockReturnValue(true);
    });

    it('should expect filters to be set in ColumnFilters when using "bindLocalOnFilter" without triggering a filter changed event when 2nd flag argument is set to false', async () => {
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters, false);

      expect(emitSpy).not.toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          type: FieldType.string,
        },
        isActive: { columnId: 'isActive', columnDef: mockColumn2, searchTerms: [false], operator: 'EQ', parsedSearchTerms: false, type: FieldType.boolean },
      });
    });

    it('should call "clearFilters" without triggering a clear event but trigger an "emitFilterChanged" remote when using "bindBackendOnFilter" and also expect filters to be set in ColumnFilters', async () => {
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const backendUpdateSpy = vi.spyOn(backendServiceStub, 'updateFilters');
      const backendProcessSpy = vi.spyOn(backendServiceStub, 'processOnFilterChanged');
      const refreshBackendSpy = vi.spyOn(backendUtilityService, 'refreshBackendDataset');

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      expect(emitSpy).toHaveBeenCalledWith('remote');
      expect(backendProcessSpy).not.toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(backendUpdateSpy).toHaveBeenCalledWith(mockNewFilters, true);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          type: FieldType.string,
        },
        isActive: { columnId: 'isActive', columnDef: mockColumn2, searchTerms: [false], operator: 'EQ', parsedSearchTerms: false, type: FieldType.boolean },
      });
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(refreshBackendSpy).toHaveBeenCalledWith(gridOptionMock);
    });

    it('should expect filters to be sent to the backend when using "bindBackendOnFilter" without triggering a filter changed event neither a backend query when both flag arguments are set to false', async () => {
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const backendUpdateSpy = vi.spyOn(backendServiceStub, 'updateFilters');
      const backendProcessSpy = vi.spyOn(backendServiceStub, 'processOnFilterChanged');
      const refreshBackendSpy = vi.spyOn(backendUtilityService, 'refreshBackendDataset');

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters, false, false);

      expect(backendProcessSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
      expect(refreshBackendSpy).not.toHaveBeenCalled();
      expect(backendUpdateSpy).toHaveBeenCalledWith(mockNewFilters, true);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          type: FieldType.string,
        },
        isActive: { columnId: 'isActive', columnDef: mockColumn2, searchTerms: [false], operator: 'EQ', parsedSearchTerms: false, type: FieldType.boolean },
      });
      expect(clearSpy).toHaveBeenCalledWith(false);
    });

    it('should expect filters to be set in ColumnFilters and also expect onSearchChange to be called when last argument is set to True', async () => {
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const spySearchChange = vi.spyOn(service.onSearchChange as any, 'notify');

      gridOptionMock.enableTreeData = true;
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters.slice(0, 1), true, false, true);

      expect(emitSpy).toHaveBeenCalledWith('local');
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          targetSelector: '',
          type: FieldType.string,
        },
      });
      expect(spySearchChange).toHaveBeenCalledWith(
        {
          clearFilterTriggered: undefined,
          shouldTriggerQuery: true,
          columnId: 'firstName',
          columnDef: mockColumn1,
          columnFilters: {
            firstName: {
              columnDef: mockColumn1,
              columnId: 'firstName',
              operator: 'StartsWith',
              searchTerms: ['Jane'],
              parsedSearchTerms: ['Jane'],
              targetSelector: '',
              type: FieldType.string,
            },
          },
          operator: 'StartsWith',
          searchTerms: ['Jane'],
          parsedSearchTerms: ['Jane'],
          grid: gridStub,
        },
        undefined
      );
    });

    it('should expect filters to be set in ColumnFilters and also expect onSearchChange to be called when "enableTreeData" is set', async () => {
      const clearSpy = vi.spyOn(service, 'clearFilters');
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const spySearchChange = vi.spyOn(service.onSearchChange as any, 'notify');

      gridOptionMock.enableTreeData = true;
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters.slice(0, 1));

      expect(emitSpy).toHaveBeenCalledWith('local');
      expect(clearSpy).toHaveBeenCalledWith(false);
      expect(service.getColumnFilters()).toEqual({
        firstName: {
          columnId: 'firstName',
          columnDef: mockColumn1,
          searchTerms: ['Jane'],
          operator: 'StartsWith',
          parsedSearchTerms: ['Jane'],
          targetSelector: '',
          type: FieldType.string,
        },
      });
      expect(spySearchChange).toHaveBeenCalledWith(
        {
          clearFilterTriggered: undefined,
          shouldTriggerQuery: true,
          columnId: 'firstName',
          columnDef: mockColumn1,
          columnFilters: {
            firstName: {
              columnDef: mockColumn1,
              columnId: 'firstName',
              operator: 'StartsWith',
              searchTerms: ['Jane'],
              parsedSearchTerms: ['Jane'],
              targetSelector: '',
              type: FieldType.string,
            },
          },
          operator: 'StartsWith',
          searchTerms: ['Jane'],
          parsedSearchTerms: ['Jane'],
          grid: gridStub,
        },
        undefined
      );
    });
  });

  describe('updateSingleFilter method', () => {
    let mockColumn1: Column;
    let mockColumn2: Column;
    let mockArgs1: any;
    let mockArgs2: any;

    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.enableTreeData = false;
      gridOptionMock.backendServiceApi = undefined;
      mockColumn1 = { id: 'firstName', name: 'firstName', field: 'firstName' };
      mockColumn2 = { id: 'isActive', name: 'isActive', field: 'isActive', type: FieldType.boolean };
      mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
      mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1, mockColumn2]);
    });

    it('should call "updateSingleFilter" method and expect event "emitFilterChanged" to be trigged local when using "bindLocalOnFilter" and also expect filters to be set in dataview', async () => {
      const expectation = {
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: ['Jane'], operator: 'StartsWith', type: FieldType.string },
      };
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const setFilterArgsSpy = vi.spyOn(dataViewStub, 'setFilterArgs');
      const refreshSpy = vi.spyOn(dataViewStub, 'refresh');
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateSingleFilter({ columnId: 'firstName', searchTerms: ['Jane'], operator: 'StartsWith' });

      expect(setFilterArgsSpy).toHaveBeenCalledWith({ columnFilters: expectation, grid: gridStub });
      expect(refreshSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('local');
      expect(service.getColumnFilters()).toEqual({
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: ['Jane'], operator: 'StartsWith', type: FieldType.string },
      });
    });

    it('should call "updateSingleFilter" method with an empty search term and still expect event "emitFilterChanged" to be trigged local when setting `emptySearchTermReturnAllValues` to False', async () => {
      const expectation = {
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: [''], operator: 'StartsWith', type: FieldType.string },
      };
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const setFilterArgsSpy = vi.spyOn(dataViewStub, 'setFilterArgs');
      const refreshSpy = vi.spyOn(dataViewStub, 'refresh');
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      mockArgs1.column.filter = { emptySearchTermReturnAllValues: false };
      mockArgs2.column.filter = { emptySearchTermReturnAllValues: false };
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateSingleFilter({ columnId: 'firstName', searchTerms: [''], operator: 'StartsWith' });

      expect(setFilterArgsSpy).toHaveBeenCalledWith({ columnFilters: expectation, grid: gridStub });
      expect(refreshSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('local');
      expect(service.getColumnFilters()).toEqual({
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: [''], operator: 'StartsWith', type: FieldType.string },
      });
      expect(service.getCurrentLocalFilters()).toEqual([{ columnId: 'firstName', operator: 'StartsWith', searchTerms: [''] }]);
    });

    it('should call "updateSingleFilter" method and expect event "emitFilterChanged" to be trigged local when using "bindBackendOnFilter" and also expect filters to be set in dataview', async () => {
      const expectation = {
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: ['Jane'], operator: 'StartsWith', type: FieldType.string },
      };
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const backendUpdateSpy = vi.spyOn(backendServiceStub, 'updateFilters');
      const backendProcessSpy = vi.spyOn(backendServiceStub, 'processOnFilterChanged');
      const refreshBackendSpy = vi.spyOn(backendUtilityService, 'refreshBackendDataset');

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateSingleFilter({ columnId: 'firstName', searchTerms: ['Jane'], operator: 'StartsWith' });

      expect(emitSpy).toHaveBeenCalledWith('remote');
      expect(backendProcessSpy).not.toHaveBeenCalled();
      expect(backendUpdateSpy).toHaveBeenCalledWith(expectation, true);
      expect(service.getColumnFilters()).toEqual(expectation);
      expect(refreshBackendSpy).toHaveBeenCalledWith(gridOptionMock);
    });

    it('should expect filter to be sent to the backend when using "bindBackendOnFilter" without triggering a filter changed event neither a backend query when both flag arguments are set to false', async () => {
      const expectation = {
        firstName: { columnId: 'firstName', columnDef: mockColumn1, searchTerms: ['Jane'], operator: 'StartsWith', type: FieldType.string },
      };
      gridOptionMock.backendServiceApi = {
        filterTypingDebounce: 0,
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(vi.fn())),
      };
      const emitSpy = vi.spyOn(service, 'emitFilterChanged');
      const backendUpdateSpy = vi.spyOn(backendServiceStub, 'updateFilters');
      const backendProcessSpy = vi.spyOn(backendServiceStub, 'processOnFilterChanged');
      const refreshBackendSpy = vi.spyOn(backendUtilityService, 'refreshBackendDataset');

      service.init(gridStub);
      service.bindBackendOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateSingleFilter({ columnId: 'firstName', searchTerms: ['Jane'], operator: 'StartsWith' }, false, false);

      expect(backendProcessSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
      expect(refreshBackendSpy).not.toHaveBeenCalled();
      expect(backendUpdateSpy).toHaveBeenCalledWith(expectation, true);
      expect(service.getColumnFilters()).toEqual(expectation);
    });
  });

  describe('disableFilterFunctionality method', () => {
    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.showHeaderRow = true;
    });

    it('should disable the Filter Functionality from the Grid Options & toggle the Header Filter row', () => {
      const mockColumns = [
        { id: 'field1', field: 'field1', width: 100, header: { menu: { commandItems: [{ command: 'clear-filter' }] } } },
        { id: 'field2', field: 'field2', width: 100, header: { menu: { commandItems: [{ command: 'clear-filter' }] } } },
      ];
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(mockColumns);

      service.init(gridStub);
      service.disableFilterFunctionality();

      mockColumns.forEach((col) =>
        col.header.menu.commandItems.forEach((item) => {
          expect((item as MenuCommandItem).hidden).toBeTruthy();
        })
      );
      gridOptionMock.gridMenu!.commandItems!.forEach((item) => {
        expect((item as GridMenuItem).hidden).toBeTruthy();
      });
      expect(setOptionSpy).toHaveBeenCalledWith({ enableFiltering: false }, false, true);
      expect(setHeaderSpy).toHaveBeenCalledWith(false);
      expect(updateColumnSpy).toHaveBeenCalled();
    });

    it('should enable the Filter Functionality when passing 1st argument as False', () => {
      gridOptionMock.enableFiltering = false;
      gridOptionMock.showHeaderRow = false;

      const mockColumns = [
        { id: 'field1', field: 'field1', width: 100, header: { menu: { commandItems: [{ command: 'clear-filter' }] } } },
        { id: 'field2', field: 'field2', width: 100, header: { menu: { commandItems: [{ command: 'clear-filter' }] } } },
      ];
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(mockColumns);

      service.init(gridStub);
      service.disableFilterFunctionality(false);

      mockColumns.forEach((col) =>
        col.header.menu.commandItems.forEach((item) => {
          expect((item as MenuCommandItem).hidden).toBeFalsy();
        })
      );
      gridOptionMock.gridMenu!.commandItems!.forEach((item) => {
        expect((item as GridMenuItem).hidden).toBeFalsy();
      });
      expect(setOptionSpy).toHaveBeenCalledWith({ enableFiltering: true }, false, true);
      expect(setHeaderSpy).toHaveBeenCalledWith(true);
      expect(updateColumnSpy).toHaveBeenCalled();
    });

    it('should NOT change neither call anything if the end result of disabling is the same', () => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.showHeaderRow = true;

      const mockColumns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');
      const setColsSpy = vi.spyOn(gridStub, 'setColumns');
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(mockColumns);

      service.init(gridStub);
      service.disableFilterFunctionality(false);

      expect(setOptionSpy).not.toHaveBeenCalled();
      expect(setHeaderSpy).not.toHaveBeenCalled();
      expect(setColsSpy).not.toHaveBeenCalled();
    });
  });

  describe('toggleFilterFunctionality method', () => {
    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.showHeaderRow = true;
    });

    it('should toggle the Filter Functionality from the Grid Options & toggle the Header Filter row', () => {
      const mockColumns = [
        { id: 'field1', field: 'field1', width: 100 },
        { id: 'field2', field: 'field2', width: 100 },
      ];
      const setOptionSpy = vi.spyOn(gridStub, 'setOptions');
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
      vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(mockColumns);

      service.init(gridStub);
      service.toggleFilterFunctionality();

      expect(setOptionSpy).toHaveBeenCalledWith({ enableFiltering: false }, false, true);
      expect(setHeaderSpy).toHaveBeenCalledWith(false);
      expect(updateColumnSpy).toHaveBeenCalled();
    });
  });

  describe('toggleHeaderFilterRow method', () => {
    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.showHeaderRow = true;
    });

    it('should toggle the Header Filter Row (to disabled when previously enabled)', () => {
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');

      service.init(gridStub);
      service.toggleHeaderFilterRow();

      expect(setHeaderSpy).toHaveBeenCalledWith(false);
    });

    it('should toggle the Header Filter Row and expect to call "setColumns" when changing to enabled when previously disabled', () => {
      gridOptionMock.showHeaderRow = false;
      const setHeaderSpy = vi.spyOn(gridStub, 'setHeaderRowVisibility');
      const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');

      service.init(gridStub);
      service.toggleHeaderFilterRow();

      expect(setHeaderSpy).toHaveBeenCalledWith(true);
      expect(updateColumnSpy).toHaveBeenCalled();
    });
  });

  describe('setSortColumnIcons method', () => {
    it('should set the sorting icon by calling "setSortColumns" on the grid object', () => {
      const mockSortColumns = [{ columnId: 'duration', sortAsc: true }];
      const spy = vi.spyOn(gridStub, 'setSortColumns');

      service.init(gridStub);
      service.setSortColumnIcons(mockSortColumns);

      expect(spy).toHaveBeenCalledWith(mockSortColumns);
    });
  });

  describe('drawFilterTemplate method', () => {
    let mockColumn1: Column;
    let mockColumn2: Column;
    let mockColumn3: Column;
    let mockArgs1: any;
    let mockArgs2: any;
    let mockNewFilters: CurrentFilter[];

    beforeEach(() => {
      gridOptionMock.enableFiltering = true;
      gridOptionMock.enableTreeData = false;
      gridOptionMock.backendServiceApi = undefined;
      mockColumn1 = { id: 'firstName', name: 'firstName', field: 'firstName', filterable: true, filter: { model: Filters.inputText } };
      mockColumn2 = {
        id: 'isActive',
        name: 'isActive',
        field: 'isActive',
        type: FieldType.boolean,
        filterable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
        },
      };
      mockColumn3 = { id: 'name', field: 'name', filterable: true, filter: { model: Filters.inputText } };
      mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
      mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
      mockNewFilters = [
        { columnId: 'firstName', searchTerms: ['Jane'], operator: 'StartsWith' },
        { columnId: 'isActive', searchTerms: [false] },
      ];
      vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1, mockColumn2, mockColumn3]);
    });

    it('should Draw DOM Element Filter on custom HTML element by string id', async () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      const columnFilterMetadada = service.drawFilterTemplate('name', `#${DOM_ELEMENT_ID}`);
      const filterElm = document.body.querySelector<HTMLDivElement>(`#${DOM_ELEMENT_ID}`);

      expect(filterElm).toBeTruthy();
      expect(columnFilterMetadada!.columnDef.id).toBe('name');
    });

    it('should Draw DOM Element Filter on custom HTML element by string id with searchTerms', async () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      const columnFilterMetadada = service.drawFilterTemplate('firstName', `#${DOM_ELEMENT_ID}`);
      const filterElm = document.body.querySelector<HTMLDivElement>(`#${DOM_ELEMENT_ID}`);

      expect(filterElm).toBeTruthy();
      expect(columnFilterMetadada!.columnDef.id).toBe('firstName');
    });

    it('should Draw DOM Element Filter on custom HTML element by HTMLDivElement', async () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      const filterContainerElm = document.querySelector(`#${DOM_ELEMENT_ID}`) as HTMLDivElement;
      const columnFilterMetadada = service.drawFilterTemplate('isActive', filterContainerElm);
      const filterElm = document.body.querySelector<HTMLDivElement>(`#${DOM_ELEMENT_ID}`);

      expect(filterElm).toBeTruthy();
      expect(columnFilterMetadada!.columnDef.id).toBe('isActive');
    });

    it('should Draw DOM Element Filter on custom HTML element return null', async () => {
      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
      await service.updateFilters(mockNewFilters);

      const filterContainerElm = document.querySelector(`#${DOM_ELEMENT_ID}`) as HTMLDivElement;
      const columnFilterMetadada1 = service.drawFilterTemplate('selector', filterContainerElm);
      const columnFilterMetadada2 = service.drawFilterTemplate('name', `#not-exists`);
      const columnFilterMetadada3 = service.drawFilterTemplate('invalid-column', filterContainerElm);

      expect(columnFilterMetadada1).toBeNull();
      expect(columnFilterMetadada2).toBeNull();
      expect(columnFilterMetadada3).toBeNull();
    });
  });

  describe('Tree Data View', () => {
    beforeEach(() => {
      gridOptionMock.enableTreeData = true;
      gridOptionMock.treeDataOptions = { columnId: 'file', childrenPropName: 'files' };
      vi.clearAllMocks();
    });

    it('should expect "setSortColumns" to have been called after init', () => {
      const spySetSortCols = vi.spyOn(gridStub, 'setSortColumns');
      service.init(gridStub);

      expect(spySetSortCols).toHaveBeenCalledWith([{ columnId: 'file', sortAsc: true }]);
    });

    it('should create a filter and its metadata when "onHeaderRowCellRendered" event is triggered', () => {
      const spySetSortCols = vi.spyOn(gridStub, 'setSortColumns');
      const mockArgs = {
        grid: gridStub,
        column: { id: 'firstName', field: 'firstName', filterable: true } as Column,
        node: document.getElementById(DOM_ELEMENT_ID),
      };

      service.init(gridStub);
      service.bindLocalOnFilter(gridStub);
      gridStub.onHeaderRowCellRendered.notify(mockArgs as any, new SlickEventData(), gridStub);
      const columnFilters = service.getColumnFilters();
      const filterMetadataArray = service.getFiltersMetadata();

      expect(spySetSortCols).toHaveBeenCalledWith([{ columnId: 'file', sortAsc: true }]);
      expect(columnFilters).toEqual({});
      expect(filterMetadataArray.length).toBe(1);
      expect(filterMetadataArray[0] instanceof InputFilter).toBeTruthy();
      expect(filterMetadataArray[0].searchTerms).toEqual([]);
    });

    describe('bindLocalOnFilter method', () => {
      let dataset: any[] = [];
      let datasetHierarchical: any[] = [];
      let mockColumn1: Column;
      let mockColumn2: Column;
      let mockColumn3: Column;
      let mockArgs1: any;
      let mockArgs2: any;
      let mockArgs3: any;

      beforeEach(() => {
        gridStub.getColumns = vi.fn();
        gridOptionMock.backendServiceApi = undefined;
        gridOptionMock.presets = {
          treeData: { toggledItems: [{ itemId: 4, isCollapsed: true }] },
        };
        dataset = [
          { __parentId: null, __treeLevel: 0, dateModified: '2012-03-05T12:44:00.123Z', file: 'bucket-list.txt', id: 24, size: 0.5 },
          { __hasChildren: true, __parentId: null, __treeLevel: 0, file: 'documents', id: 21, size: 0.4 },
          { __hasChildren: true, __parentId: 21, __treeLevel: 1, file: 'misc', id: 9 },
          { __parentId: 9, __treeLevel: 2, dateModified: '2015-02-26T16:50:00.123Z', file: 'todo.txt', id: 10, size: 0.4 },
          { __hasChildren: true, __parentId: 21, __treeLevel: 1, file: 'pdf', id: 4 },
          { __parentId: 4, __treeLevel: 2, dateModified: '2015-05-12T14:50:00.123Z', file: 'internet-bill.pdf', id: 6, size: 1.4 },
          { __parentId: 4, __treeLevel: 2, dateModified: '2015-05-21T10:22:00.123Z', file: 'map.pdf', id: 5, size: 3.1 },
          { __parentId: 4, __treeLevel: 2, dateModified: '2015-05-01T07:50:00.123Z', file: 'phone-bill.pdf', id: 23, size: 1.4 },
          { __hasChildren: true, __parentId: 21, __treeLevel: 1, file: 'txt', id: 2 },
          { __parentId: 2, __treeLevel: 2, dateModified: '2015-05-12T14:50:00.123Z', file: 'todo.txt', id: 3, size: 0.7 },
          { __hasChildren: true, __parentId: 21, __treeLevel: 1, file: 'xls', id: 7 },
          { __parentId: 7, __treeLevel: 2, dateModified: '2014-10-02T14:50:00.123Z', file: 'compilation.xls', id: 8, size: 2.3 },
          { __parentId: null, __treeLevel: 0, dateModified: '2015-03-03T03:50:00.123Z', file: 'something.txt', id: 18, size: 90 },
        ];

        datasetHierarchical = [
          { id: 24, file: 'bucket-list.txt', dateModified: '2012-03-05T12:44:00.123Z', size: 0.5 },
          { id: 18, file: 'something.txt', dateModified: '2015-03-03T03:50:00.123Z', size: 90 },
          {
            id: 21,
            file: 'documents',
            files: [
              { id: 2, file: 'txt', files: [{ id: 3, file: 'todo.txt', dateModified: '2015-05-12T14:50:00.123Z', size: 0.7 }] },
              {
                id: 4,
                file: 'pdf',
                files: [
                  { id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 },
                  { id: 6, file: 'internet-bill.pdf', dateModified: '2015-05-12T14:50:00.123Z', size: 1.4 },
                  { id: 23, file: 'phone-bill.pdf', dateModified: '2015-05-01T07:50:00.123Z', size: 1.4 },
                ],
              },
              { id: 9, file: 'misc', files: [{ id: 10, file: 'todo.txt', dateModified: '2015-02-26T16:50:00.123Z', size: 0.4 }] },
              { id: 7, file: 'xls', files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00.123Z', size: 2.3 }] },
            ],
          },
        ];

        gridOptionMock.enableFiltering = true;
        gridOptionMock.backendServiceApi = undefined;
        mockColumn1 = { id: 'file', name: 'file', field: 'file', filterable: true, filter: { model: Filters.inputText } };
        mockColumn2 = {
          id: 'dateModified',
          name: 'dateModified',
          field: 'dateModified',
          filterable: true,
          filter: {
            model: Filters.singleSelect,
            collection: [
              { value: true, label: 'True' },
              { value: false, label: 'False' },
            ],
          },
        };
        mockColumn3 = { id: 'size', name: 'size', field: 'size', filterable: true, filter: { model: Filters.inputText } };
        mockArgs1 = { grid: gridStub, column: mockColumn1, node: document.getElementById(DOM_ELEMENT_ID) };
        mockArgs2 = { grid: gridStub, column: mockColumn2, node: document.getElementById(DOM_ELEMENT_ID) };
        mockArgs3 = { grid: gridStub, column: mockColumn3, node: document.getElementById(DOM_ELEMENT_ID) };
        vi.spyOn(dataViewStub, 'getItems').mockReturnValue(dataset);
        vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn1, mockColumn2, mockColumn3]);
        sharedService.allColumns = [mockColumn1, mockColumn2, mockColumn3];
        vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'get').mockReturnValue(datasetHierarchical);
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should return True when item is found and its parent is not collapsed', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any), __collapsed: false })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 4, id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['map'],
            parsedSearchTerms: ['map'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['map'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(output).toBe(true);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([21, 4, 5]));
      });

      it('should return True when item is found and its parent is not collapsed', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any), __collapsed: false })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        gridOptionMock.treeDataOptions!.autoRecalcTotalsOnFilterChange = true;
        const mockItem1 = { __parentId: 4, id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['map'],
            parsedSearchTerms: ['map'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['map'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        const pdfFolder = datasetHierarchical[2].files[1];
        const mapPdfItem = pdfFolder.files[0];
        expect(mapPdfItem.file).toBe('map.pdf');
        expect(mapPdfItem.__filteredOut).toBe(false);
        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(output).toBe(true);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([21, 4, 5]));
      });

      it('should return False when item is found BUT its parent is collapsed', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any), __collapsed: true })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 4, id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['map'],
            parsedSearchTerms: ['map'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['map'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([21, 4, 5]));
      });

      it('should return False even when using "autoRecalcTotalsOnFilterChange" and item is found BUT its parent is collapsed', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any), __collapsed: true })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        gridOptionMock.treeDataOptions!.autoRecalcTotalsOnFilterChange = true;
        const mockItem1 = { __parentId: 4, id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['map'],
            parsedSearchTerms: ['map'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['map'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['map'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([21, 4, 5]));
      });

      it('should return False when item is not found in the dataset', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 4, id: 5, file: 'unknown.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: { columnDef: mockColumn1, columnId: 'file', searchTerms: ['unknown'], targetSelector: '', type: FieldType.string },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['unknown'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['unknown'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['unknown'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, {
          ...columnFilters,
          file: { ...columnFilters.file, operator: 'Contains', parsedSearchTerms: ['unknown'] },
        }); // it will use Contains by default
        expect(preFilterSpy).toHaveReturnedWith(new Set());
      });

      it('should return False also when called by "updateSingleFilter" and when item is not found in the dataset', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 4, id: 5, file: 'unknown.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 };

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = { file: { columnDef: mockColumn1, columnId: 'file', searchTerms: ['unknown'], type: FieldType.string } } as ColumnFilters;
        await service.updateSingleFilter({ columnId: 'file', operator: 'Contains', searchTerms: ['unknown'] }, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['unknown'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['unknown'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, {
          ...columnFilters,
          file: { ...columnFilters.file, operator: 'Contains', parsedSearchTerms: ['unknown'] },
        }); // it will use Contains by default
        expect(preFilterSpy).toHaveReturnedWith(new Set());
      });

      // -- excludeChildrenWhenFilteringTree -- //

      it('should return True (file is included) when item is not found BUT its parent passes the filter criteria AND "excludeChildrenWhenFilteringTree" is disabled', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 9, __treeLevel: 2, dateModified: '2015-02-26T16:50:00.123Z', file: 'todo.txt', id: 10, size: 0.4 };
        gridOptionMock.treeDataOptions!.excludeChildrenWhenFilteringTree = false;

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['misc'],
            parsedSearchTerms: ['misc'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['misc'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(output).toBe(true);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([9, 21, 10])); // todo.txt (10) is included
      });

      it('should return False (file is excluded) when item is not found EVEN when its parent passes the filter criteria because "excludeChildrenWhenFilteringTree" is enabled', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 9, __treeLevel: 2, dateModified: '2015-02-26T16:50:00.123Z', file: 'todo.txt', id: 10, size: 0.4 };
        gridOptionMock.treeDataOptions!.excludeChildrenWhenFilteringTree = true;

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['misc'],
            parsedSearchTerms: ['misc'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['misc'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([9, 21])); // todo.txt (10) is excluded
      });

      it('should return True (file is included) when item is not found BUT its parent passes the filter criteria with "autoApproveParentItemWhenTreeColumnIsValid" and when "excludeChildrenWhenFilteringTree" is disabled', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 9, __treeLevel: 2, dateModified: '2015-02-26T16:50:00.123Z', file: 'todo.txt', id: 10, size: 0.4 };
        gridOptionMock.treeDataOptions!.excludeChildrenWhenFilteringTree = false;
        gridOptionMock.treeDataOptions!.autoApproveParentItemWhenTreeColumnIsValid = true;

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          file: {
            columnDef: mockColumn1,
            columnId: 'file',
            operator: 'Contains',
            searchTerms: ['misc'],
            parsedSearchTerms: ['misc'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'file', operator: '', searchTerms: ['misc'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'file', operator: 'Contains', searchTerms: ['misc'] }]);
        expect(output).toBe(true);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([9, 21, 10])); // todo.txt (10) is included
      });

      it('should return False (file is not included) when Parent item is not valid and is tagged as "filteredParents: false" when "excludeChildrenWhenFilteringTree" is disabled', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        const preFilterSpy = vi.spyOn(service, 'preFilterTreeData');
        vi.spyOn(dataViewStub, 'getItemById')
          .mockReturnValueOnce({ ...(dataset[4] as any) })
          .mockReturnValueOnce(dataset[5])
          .mockReturnValueOnce(dataset[6]);

        const mockItem1 = { __parentId: 9, __treeLevel: 2, dateModified: '2015-02-26T16:50:00.123Z', file: 'todo.txt', id: 10, size: 0.4 };
        gridOptionMock.treeDataOptions!.excludeChildrenWhenFilteringTree = false;
        gridOptionMock.treeDataOptions!.autoApproveParentItemWhenTreeColumnIsValid = false;

        service.init(gridStub);
        service.bindLocalOnFilter(gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs1 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs2 as any, new SlickEventData(), gridStub);
        gridStub.onHeaderRowCellRendered.notify(mockArgs3 as any, new SlickEventData(), gridStub);

        const columnFilters = {
          size: {
            columnDef: mockColumn3,
            columnId: 'size',
            operator: '<',
            searchTerms: ['0.1'],
            parsedSearchTerms: ['0.1'],
            targetSelector: '',
            type: FieldType.string,
          },
        } as ColumnFilters;
        await service.updateFilters([{ columnId: 'size', operator: '<', searchTerms: ['0.1'] }], true, true, true);
        const output = service.customLocalFilter(mockItem1, { dataView: dataViewStub, grid: gridStub, columnFilters });

        expect(pubSubSpy).toHaveBeenCalledWith(`onBeforeFilterChange`, [{ columnId: 'size', operator: '<', searchTerms: ['0.1'] }]);
        expect(pubSubSpy).toHaveBeenCalledWith(`onFilterChanged`, [{ columnId: 'size', operator: '<', searchTerms: ['0.1'] }]);
        expect(output).toBe(false);
        expect(preFilterSpy).toHaveBeenCalledWith(dataset, columnFilters);
        expect(preFilterSpy).toHaveReturnedWith(initSetWithValues([9, 21, 4, 2, 7])); // todo.txt (10) is included
      });
    });
  });
});
