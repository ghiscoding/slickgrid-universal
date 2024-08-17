import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { ExtensionService } from '../extension.service';
import type { FilterService } from '../filter.service';
import { GridStateService } from '../gridState.service';
import type { SortService } from '../sort.service';
import { GridStateType, ExtensionName } from '../../enums/index';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index';
import type {
  BackendService,
  CheckboxSelectorOption,
  Column,
  CurrentPagination,
  CurrentPinning,
  CurrentRowSelection,
  CurrentSorter,
  CurrentFilter,
  CurrentColumn,
  GridOption,
  GridStateChange,
  GridState,
  RowDetailView,
  RowMoveManager,
  TreeToggleStateChange,
} from '../../interfaces/index';
import { SharedService } from '../shared.service';
import type { TreeDataService } from '../treeData.service';
import type { SlickRowSelectionModel } from '../../extensions/slickRowSelectionModel';
import type { SlickColumnPicker } from '../../extensions/slickColumnPicker';

const fnCallbacks = {};
const mockPubSub = {
  publish: jest.fn(),
  subscribe: (eventName, fn) => fnCallbacks[eventName as string] = fn,
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;
jest.mock('@slickgrid-universal/event-pub-sub', () => ({
  PubSubService: () => mockPubSub
}));

const gridOptionMock = {
  enableAutoResize: true,
  frozenBottom: false,
  frozenColumn: -1,
  frozenRow: -1,
} as GridOption;

const backendServiceStub = {
  getCurrentFilters: () => { },
  getCurrentPagination: () => { },
  getCurrentSorters: () => { },
} as BackendService;

const dataViewStub = {
  getAllSelectedIds: jest.fn(),
  getAllSelectedFilteredIds: jest.fn(),
  getFilteredItems: jest.fn(),
  mapIdsToRows: jest.fn(),
  mapRowsToIds: jest.fn(),
  onBeforePagingInfoChanged: new SlickEvent(),
  onPagingInfoChanged: new SlickEvent(),
  onSelectedRowIdsChanged: new SlickEvent(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: jest.fn(),
  getData: () => dataViewStub,
  getScrollbarDimensions: jest.fn(),
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getSelectionModel: jest.fn(),
  getSelectedRows: jest.fn(),
  setColumns: jest.fn(),
  setSelectedRows: jest.fn(),
  onColumnsReordered: new SlickEvent(),
  onColumnsResized: new SlickEvent(),
  onSetOptions: new SlickEvent(),
  onSelectedRowsChanged: new SlickEvent(),
} as unknown as SlickGrid;

const extensionServiceStub = {
  getExtensionByName: (_name: string) => { }
} as ExtensionService;

const filterServiceStub = {
} as FilterService;

const sortServiceStub = {
} as SortService;

const treeDataServiceStub = {
  getCurrentToggleState: jest.fn(),
} as unknown as TreeDataService;

const rowSelectionModelStub = {
  pluginName: 'RowSelectionModel',
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;

describe('GridStateService', () => {
  let service: GridStateService;
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
    service = new GridStateService(extensionServiceStub, filterServiceStub, mockPubSub, sharedService, sortServiceStub, treeDataServiceStub);
    service.init(gridStub);
    jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
  });

  afterEach(() => {
    service.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('init method', () => {
    let slickgridEvent;

    beforeEach(() => {
      slickgridEvent = new SlickEvent();
    });

    afterEach(() => {
      slickgridEvent.unsubscribe();
    });

    it('should have called the "subscribeToAllGridChanges" method while initializing', () => {
      const gridStateSpy = jest.spyOn(service, 'subscribeToAllGridChanges');
      const pubSubSpy = jest.spyOn(mockPubSub, 'subscribe');

      service.init(gridStub);
      jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);

      expect(gridStateSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledTimes(7);
      // expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onFilterChanged`, () => { });
    });

    describe('getCurrentColumns method', () => {
      it('should call "getCurrentColumns" and return empty array when no columns is defined', () => {
        const output = service.getCurrentColumns();
        expect(output).toEqual([]);
      });

      it('should call "getCurrentColumns" and return Columns when the method is called', () => {
        const columnsMock = [
          { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
          { id: 'field2', field: 'field2', width: 150, headerCssClass: 'blue' },
          { id: 'field3', field: 'field3' },
        ] as Column[];
        const gridSpy = jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

        const output = service.getCurrentColumns();

        expect(gridSpy).toHaveBeenCalled();
        expect(output).toEqual([
          { columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 },
          { columnId: 'field2', cssClass: '', headerCssClass: 'blue', width: 150 },
          { columnId: 'field3', cssClass: '', headerCssClass: '', width: 0 },
        ] as CurrentColumn[]);
      });
    });

    describe('changeColumnsArrangement method', () => {
      const rowCheckboxColumnMock: Column = { id: '_checkbox_selector', field: '_checkbox_selector', minWidth: 50 };
      const rowDetailColumnMock: Column = { id: '_detail_selector', field: '_detail_selector', minWidth: 50 };
      const rowMoveColumnMock: Column = { id: '_move', field: '_move', minWidth: 50 };
      let presetColumnsMock: CurrentColumn[];
      let columnsWithoutCheckboxMock: Column[];
      let allColumnsMock: Column[];

      beforeEach(() => {
        allColumnsMock = [
          rowDetailColumnMock,
          rowMoveColumnMock,
          rowCheckboxColumnMock,
          { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
          { id: 'field2', field: 'field2', width: 150, headerCssClass: 'blue' },
          { id: 'field3', field: 'field3' },
        ] as Column[];
        columnsWithoutCheckboxMock = [
          { id: 'field2', field: 'field2', width: 150, headerCssClass: 'blue' },
          { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
          { id: 'field3', field: 'field3' },
        ] as Column[];
        presetColumnsMock = [
          { columnId: 'field2', width: 150, headerCssClass: 'blue' },
          { columnId: 'field1', width: 100, cssClass: 'red' },
          { columnId: 'field3' },
        ] as CurrentColumn[];
        jest.spyOn(service, 'getAssociatedGridColumns').mockReturnValue([...columnsWithoutCheckboxMock]);
      });

      afterEach(() => {
        gridOptionMock.enableCheckboxSelector = false;
        gridOptionMock.enableRowDetailView = false;
        gridOptionMock.enableRowMoveManager = false;
        jest.clearAllMocks();
      });

      it('should call the method and expect slickgrid "setColumns" and "autosizeColumns" to be called with newest columns', () => {
        gridOptionMock.enableCheckboxSelector = true;
        gridOptionMock.enableRowDetailView = true;
        gridOptionMock.enableRowMoveManager = true;
        gridOptionMock.rowDetailView = { columnIndexPosition: 0 } as unknown as RowDetailView;
        gridOptionMock.rowMoveManager = { columnIndexPosition: 1 } as unknown as RowMoveManager;
        gridOptionMock.checkboxSelector = { columnIndexPosition: 2 } as unknown as CheckboxSelectorOption;

        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = jest.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock);

        expect(setColsSpy).toHaveBeenCalledWith([rowDetailColumnMock, rowMoveColumnMock, rowCheckboxColumnMock, ...columnsWithoutCheckboxMock]);
        expect(autoSizeSpy).toHaveBeenCalled();
        expect(pubSubSpy).not.toHaveBeenCalledWith('onFullResizeByContentRequested');
      });

      it('should call the method and expect slickgrid "setColumns" and a pubsub event "onFullResizeByContentRequested" to be called with newest columns when "triggerAutoSizeColumns" is false and "enableAutoResizeColumnsByCellContent" is true', () => {
        gridOptionMock.enableAutoResizeColumnsByCellContent = true;
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = jest.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect slickgrid "setColumns" but WITHOUT triggering pubsub event "onFullResizeByContentRequested" because it requires "enableAutoResizeColumnsByCellContent: true" AND "autosizeColumnsByCellContentOnFirstLoad: false" because this method is never called on first page load', () => {
        gridOptionMock.enableAutoResizeColumnsByCellContent = true;
        gridOptionMock.autosizeColumnsByCellContentOnFirstLoad = true;
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = jest.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).not.toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect slickgrid "setColumns" and a pubsub event "onFullResizeByContentRequested" to be called with newest columns when "triggerAutoSizeColumns" is false and 3rd is set to true', () => {
        jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = jest.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false, true);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect only 1 method of slickgrid "setColumns" to be called when we define 2nd argument (triggerAutoSizeColumns) as False', () => {
        const setColsSpy = jest.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');
        const presetColumnsMock = [
          { columnId: 'field2', width: 150, headerCssClass: 'blue' },
          { columnId: 'field1', width: 100, cssClass: 'red' },
          { columnId: 'field3' },
        ] as CurrentColumn[];

        service.changeColumnsArrangement(presetColumnsMock, false);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
      });
    });

    describe('bindExtensionAddonEventToGridStateChange tests', () => {
      it('should subscribe to some Extension Addon SlickGrid events and expect the event to be triggered when a notify is triggered after service was initialized', () => {
        const instanceMock = { onColumnsChanged: slickgridEvent };
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const associatedColumnsMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
        const extensionMock = { name: ExtensionName.columnPicker, addon: instanceMock, instance: instanceMock as SlickColumnPicker, class: null };
        const gridStateMock = { columns: associatedColumnsMock, filters: [], sorters: [] } as GridState;
        const stateChangeMock = { change: { newValues: associatedColumnsMock, type: GridStateType.columns }, gridState: gridStateMock } as GridStateChange;

        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
        const gridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);
        const extensionSpy = jest.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock as any);

        service.init(gridStub);
        jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
        slickgridEvent.notify({ columns: columnsMock }, new SlickEventData(), gridStub);

        expect(gridStateSpy).toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onGridStateChanged`, stateChangeMock);
        expect(extensionSpy).toHaveBeenCalledWith(ExtensionName.columnPicker);
        expect(extensionSpy).toHaveBeenLastCalledWith(ExtensionName.gridMenu);
      });
    });

    describe('bindSlickGridColumnChangeEventToGridStateChange tests', () => {
      it('should subscribe to some SlickGrid events and expect the event to be triggered when a notify is triggered after service was initialized', () => {
        const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
        const associatedColumnsMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
        const gridStateMock = { columns: associatedColumnsMock, filters: [], sorters: [] } as GridState;
        const stateChangeMock = { change: { newValues: associatedColumnsMock, type: GridStateType.columns }, gridState: gridStateMock } as GridStateChange;

        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
        const gridColumnSpy = jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const gridColumnReorderSpy = jest.spyOn(gridStub.onColumnsReordered, 'subscribe');
        const gridColumnResizeSpy = jest.spyOn(gridStub.onColumnsResized, 'subscribe');
        const gridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

        service.init(gridStub);
        jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsMock, grid: gridStub }, new SlickEventData(), gridStub);
        service.resetColumns();

        expect(gridColumnSpy).toHaveBeenCalled();
        expect(gridColumnReorderSpy).toHaveBeenCalled();
        expect(gridColumnResizeSpy).toHaveBeenCalled();
        expect(gridStateSpy).toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenNthCalledWith(1, `onGridStateChanged`, stateChangeMock);
      });
    });

    describe('bindSlickGridOnSetOptionsEventToGridStateChange tests', () => {
      it('should subscribe to some SlickGrid events and expect the event to be triggered when a notify is triggered after service was initialized', () => {
        const mockGridOptionsBefore = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as GridOption;
        const mockGridOptionsAfter = { frozenBottom: true, frozenColumn: 1, frozenRow: 1 } as GridOption;
        const gridStateMock = { pinning: mockGridOptionsBefore, columns: [], filters: [], sorters: [] } as GridState;
        const stateChangeMock = { change: { newValues: mockGridOptionsAfter, type: GridStateType.pinning }, gridState: gridStateMock } as GridStateChange;
        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
        const gridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

        service.init(gridStub);
        gridStub.onSetOptions.notify({ optionsBefore: mockGridOptionsBefore, optionsAfter: mockGridOptionsAfter, grid: gridStub }, new SlickEventData());

        expect(gridStateSpy).toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
      });
    });
  });

  describe('getAssociatedCurrentColumns method', () => {
    it('should call "getAssociatedCurrentColumns" and expect "getCurrentColumns" to return current cached Columns', () => {
      const columnsMock = [
        { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
        { id: 'field2', field: 'field2', width: 150, headerCssClass: 'blue' },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      const associatedColumnsMock = [
        { columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 },
        { columnId: 'field2', cssClass: '', headerCssClass: 'blue', width: 150 },
        { columnId: 'field3', cssClass: '', headerCssClass: '', width: 0 },
      ] as CurrentColumn[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

      const associatedColumns = service.getAssociatedCurrentColumns(columnsMock);
      const currentColumns = service.getCurrentColumns();

      expect(associatedColumns).toEqual(associatedColumnsMock);
      expect(currentColumns).toEqual(associatedColumnsMock);
    });
  });

  describe('getAssociatedGridColumns method', () => {
    it('should call "getAssociatedGridColumns" and return empty array when empty array is provided as current columns', () => {
      const associatedGridColumns = service.getAssociatedGridColumns(gridStub, []);
      const columns = service.getColumns();

      expect(associatedGridColumns).toEqual([]);
      expect(columns).toEqual([]);
    });

    it('should call "getAssociatedGridColumns" and return empty array when empty array is provided as current columns', () => {
      const columnsMock = [
        { id: 'field1', field: 'field1', width: 100, cssClass: 'red' },
        { id: 'field2', field: 'field2', width: 150, headerCssClass: 'blue' },
        { id: 'field3', field: 'field3' },
      ] as Column[];
      const currentColumnsMock = [
        { columnId: 'field1', cssClass: 'purple', headerCssClass: 'custom-hdr', width: 100 },
        { columnId: 'field2', cssClass: '', width: 150 },
        { columnId: 'field3', cssClass: '', headerCssClass: '', width: 0 },
      ] as CurrentColumn[];
      const gridSpy = jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

      const associatedGridColumns = service.getAssociatedGridColumns(gridStub, currentColumnsMock);
      const columns = service.getColumns();

      expect(gridSpy).toHaveBeenCalled();

      // cssClass: red will change to purple and headerCssClass will remain blue when defined in either
      expect(associatedGridColumns).toEqual([
        { id: 'field1', field: 'field1', width: 100, cssClass: 'purple', headerCssClass: 'custom-hdr' },
        { id: 'field2', field: 'field2', width: 150, cssClass: undefined, headerCssClass: 'blue' },
        { id: 'field3', field: 'field3', width: 0, cssClass: undefined, headerCssClass: undefined },
      ]);
      expect(columns).toEqual([
        { id: 'field1', field: 'field1', width: 100, cssClass: 'purple', headerCssClass: 'custom-hdr' },
        { id: 'field2', field: 'field2', width: 150, cssClass: undefined, headerCssClass: 'blue' },
        { id: 'field3', field: 'field3', width: 0, cssClass: undefined, headerCssClass: undefined },
      ]);
    });
  });

  describe('getCurrentPagination method', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call "getCurrentPagination" and return null when no BackendService is used', () => {
      const output = service.getCurrentPagination();
      expect(output).toBeNull();
    });

    it('should call "getCurrentPagination" and return Pagination when using a Local Grid', () => {
      const gridOptionsMock = { enablePagination: true } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const sharedSpy = jest.spyOn(SharedService.prototype, 'currentPagination', 'get').mockReturnValue(paginationMock);

      const output = service.getCurrentPagination();

      expect(gridSpy).toHaveBeenCalled();
      expect(sharedSpy).toHaveBeenCalled();
      expect(output).toBe(paginationMock);
    });

    it('should call "getCurrentPagination" and return Pagination when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub }, enablePagination: true } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = jest.spyOn(backendServiceStub, 'getCurrentPagination').mockReturnValue(paginationMock);

      const output = service.getCurrentPagination();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(paginationMock);
    });

    it('should call "getCurrentGridState" method and return Pagination', () => {
      const gridOptionsMock = { enablePagination: true, frozenBottom: false, frozenColumn: -1, frozenRow: -1, enableTreeData: true, } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }] as CurrentFilter[];
      const sorterMock = [{ columnId: 'field1', direction: 'ASC' }, { columnId: 'field2', direction: 'DESC' }] as CurrentSorter[];
      const pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
      const treeDataMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;

      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const columnSpy = jest.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
      const filterSpy = jest.spyOn(service, 'getCurrentFilters').mockReturnValue(filterMock);
      const sorterSpy = jest.spyOn(service, 'getCurrentSorters').mockReturnValue(sorterMock);
      const paginationSpy = jest.spyOn(service, 'getCurrentPagination').mockReturnValue(paginationMock);
      const treeDataSpy = jest.spyOn(service, 'getCurrentTreeDataToggleState').mockReturnValue(treeDataMock);

      const output = service.getCurrentGridState();

      expect(columnSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(sorterSpy).toHaveBeenCalled();
      expect(paginationSpy).toHaveBeenCalled();
      expect(treeDataSpy).toHaveBeenCalled();
      expect(output).toEqual({ columns: columnMock, filters: filterMock, sorters: sorterMock, pagination: paginationMock, pinning: pinningMock, treeData: treeDataMock } as GridState);
    });
  });

  describe('getCurrentRowSelections method', () => {
    let pinningMock: CurrentPinning;

    beforeEach(() => {
      jest.clearAllMocks();
      pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
    });

    it('should return null when "enableCheckboxSelector" flag is disabled', () => {
      const gridOptionsMock = { enableCheckboxSelector: false, enableRowSelection: false, ...pinningMock } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.getCurrentRowSelections();

      expect(output).toBeNull();
    });

    it('should call "getCurrentGridState" method and return the Row Selection when either "enableCheckboxSelector" or "enableRowSelection" flag is enabled', () => {
      const selectedGridRows = [2];
      const selectedRowIds = [99];
      const gridOptionsMock = { enableCheckboxSelector: true, ...pinningMock } as GridOption;
      jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(selectedGridRows);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }] as CurrentFilter[];
      const sorterMock = [{ columnId: 'field1', direction: 'ASC' }, { columnId: 'field2', direction: 'DESC' }] as CurrentSorter[];
      const selectionMock = { gridRowIndexes: selectedGridRows, dataContextIds: selectedRowIds } as CurrentRowSelection;

      const columnSpy = jest.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
      const filterSpy = jest.spyOn(service, 'getCurrentFilters').mockReturnValue(filterMock);
      const sorterSpy = jest.spyOn(service, 'getCurrentSorters').mockReturnValue(sorterMock);
      const selectionSpy = jest.spyOn(service, 'getCurrentRowSelections').mockReturnValue(selectionMock);

      const output = service.getCurrentGridState();

      expect(columnSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(sorterSpy).toHaveBeenCalled();
      expect(selectionSpy).toHaveBeenCalled();
      expect(output).toEqual({ columns: columnMock, filters: filterMock, sorters: sorterMock, rowSelection: selectionMock, pinning: pinningMock, } as GridState);
    });

    it('should call the "mapIdsToRows" from the DataView and get the data IDs from the "selectedRowDataContextIds" array', () => {
      const mockRowIndexes = [3, 44];
      const mockRowIds = [333, 444];
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue(mockRowIds);
      jest.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValue(mockRowIds);
      jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowIndexes);

      service.selectedRowDataContextIds = mockRowIds;
      const output = service.getCurrentRowSelections();

      expect(output).toEqual({ gridRowIndexes: mockRowIndexes, dataContextIds: mockRowIds, filteredDataContextIds: mockRowIds });
    });
  });

  describe('Row Selection - bindSlickGridRowSelectionToGridStateChange method', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('with Pagination', () => {
      let pinningMock: CurrentPinning;
      beforeEach(() => {
        jest.clearAllMocks();
        service.dispose();
        pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
        const gridOptionsMock = { enablePagination: true, enableRowSelection: true, ...pinningMock } as GridOption;
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should set new rows in the "selectedRowDataContextIds" setter when "onSelectedRowIdsChanged" is triggered with new selected row additions', (done) => {
        const mockPreviousDataIds = [333, 777];
        const mockNewRowIndexes = [3, 77, 55];
        const mockNewDataIds = [333, 777, 555];
        const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
        const paginationMock = { pageNumber: 3, pageSize: 25 } as CurrentPagination;

        const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
        jest.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
        jest.spyOn(service, 'getCurrentPagination').mockReturnValue(paginationMock);
        jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue(mockNewDataIds);
        jest.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValue(mockNewDataIds);
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockNewRowIndexes);

        service.init(gridStub);
        service.selectedRowDataContextIds = mockPreviousDataIds;

        dataViewStub.onSelectedRowIdsChanged.notify({ rows: mockNewRowIndexes, filteredIds: mockNewDataIds, ids: mockNewDataIds, selectedRowIds: mockNewDataIds, dataView: dataViewStub, grid: gridStub });

        window.setTimeout(() => {
          expect(service.selectedRowDataContextIds).toEqual(mockNewDataIds);
          expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, {
            change: {
              newValues: { gridRowIndexes: mockNewRowIndexes, dataContextIds: mockNewDataIds, filteredDataContextIds: mockNewDataIds },
              type: GridStateType.rowSelection,
            },
            gridState: {
              columns: columnMock,
              filters: null,
              sorters: null,
              pagination: paginationMock,
              pinning: pinningMock,
              rowSelection: { gridRowIndexes: mockNewRowIndexes, dataContextIds: mockNewDataIds, filteredDataContextIds: mockNewDataIds },
            }
          });
          done();
        });
      });
    });
  });

  describe('getCurrentSorters method', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when no BackendService is used and SortService is missing the "getCurrentLocalSorters" method', () => {
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue({});

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return Sorters when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub } } as GridOption;
      const sorterMock = [{ columnId: 'field1', direction: 'ASC' }, { columnId: 'field2', direction: 'DESC' }] as CurrentSorter[];
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = jest.spyOn(backendServiceStub, 'getCurrentSorters').mockReturnValue(sorterMock);

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(sorterMock);
    });

    it('should return Sorters when Local grid is set and no BackendService is used', () => {
      const sorterMock = [{ columnId: 'field1', direction: 'ASC' }, { columnId: 'field2', direction: 'DESC' }] as CurrentSorter[];
      sortServiceStub.getCurrentLocalSorters = () => sorterMock;
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
      const sortSpy = jest.spyOn(sortServiceStub, 'getCurrentLocalSorters').mockReturnValue(sorterMock);

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(sortSpy).toHaveBeenCalled();
      expect(output).toBe(sorterMock);
    });
  });

  describe('getCurrentTreeDataToggleState method', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when Tree Data is not enabled', () => {
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableTreeData: false });

      const output = service.getCurrentTreeDataToggleState();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should expect Tree Data "getCurrentTreeDataToggleState" method to be called', () => {
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableTreeData: true });
      const treeDataMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;
      const getToggleSpy = jest.spyOn(treeDataServiceStub, 'getCurrentToggleState').mockReturnValue(treeDataMock);

      const output = service.getCurrentTreeDataToggleState();

      expect(getToggleSpy).toHaveBeenCalled();
      expect(output).toEqual(treeDataMock);
    });
  });

  describe('getCurrentFilters method', () => {
    afterEach(() => {
      gridStub.getOptions = () => gridOptionMock;
    });

    it('should return null when no BackendService is used and FilterService is missing the "getCurrentLocalFilters" method', () => {
      gridStub.getOptions = () => undefined as any;
      const output = service.getCurrentFilters();
      expect(output).toBeNull();
    });

    it('should return null when no BackendService is used and FilterService is missing the "getCurrentLocalFilters" method', () => {
      const gridSpy = jest.spyOn(gridStub, 'getOptions');

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return null when no BackendService is used and FilterService is missing the "getCurrentLocalFilters" method', () => {
      const gridSpy = jest.spyOn(gridStub, 'getOptions');

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return Sorters when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub } } as GridOption;
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }, { columnId: 'field2', operator: '>=', searchTerms: [2] }] as CurrentFilter[];
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = jest.spyOn(backendServiceStub, 'getCurrentFilters').mockReturnValue(filterMock);

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(filterMock);
    });

    it('should return Sorters when Local grid is set and no BackendService is used', () => {
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }, { columnId: 'field2', operator: '>=', searchTerms: [2] }] as CurrentFilter[];
      filterServiceStub.getCurrentLocalFilters = () => filterMock;
      const gridSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue({});
      const filterSpy = jest.spyOn(filterServiceStub, 'getCurrentLocalFilters').mockReturnValue(filterMock);

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(output).toBe(filterMock);
    });
  });

  describe('needToPreserveRowSelection method', () => {
    it('should return false when there are no "dataView" property defined in the grid options', () => {
      const gridOptionsMock = { dataView: null } as unknown as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeFalse();
    });

    it('should return false when "dataView" property is defined in the grid options with "syncGridSelection" property', () => {
      const gridOptionsMock = { dataView: null } as unknown as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeFalse();
    });

    it('should return true when the "dataView" grid option is a boolean and is set to True', () => {
      const gridOptionsMock = { dataView: { syncGridSelection: true }, enableRowSelection: true } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeTrue();
    });

    it('should return false when using BackendServiceApi and the "dataView" grid option is a boolean and is set to True but "syncGridSelectionWithBackendService" is disabled', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: false },
        backendServiceApi: {
          service: backendServiceStub,
          process: jest.fn(),
        },
        enableRowSelection: true
      } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeFalse();
    });

    it('should return true when using BackendServiceApi and the "dataView" grid option is a boolean and is set to True but "syncGridSelectionWithBackendService" is enabled', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: true },
        backendServiceApi: {
          service: backendServiceStub,
          process: jest.fn(),
        },
        enableRowSelection: true
      } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeTrue();
    });

    it('should return true when the "dataView" grid option is provided as an object', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: { preserveHidden: true, preserveHiddenOnSelectionChange: false } },
        enableRowSelection: true
      } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBeTrue();
    });
  });

  describe('resetColumns method', () => {
    it('should call the method without any column definitions and expect "onGridStateChanged" to be triggered with empty changes', () => {
      const gridStateMock = { columns: [], filters: [], sorters: [] } as GridState;
      const stateChangeMock = { change: { newValues: [], type: GridStateType.columns }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      const serviceSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      service.resetColumns();

      expect(serviceSpy).toHaveBeenCalled();
      // expect(pubSubSpy).toHaveBeenCalledTimes(1);
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it(`should call the method with column definitions and expect "onGridStateChanged" to be triggered
      with "newValues" property being the columns and still empty "gridState" property`, () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const currentColumnsMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const gridStateMock = { columns: [], filters: [], sorters: [] } as GridState;
      const stateChangeMock = { change: { newValues: currentColumnsMock, type: GridStateType.columns }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      const serviceSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      service.resetColumns(columnsMock);

      expect(serviceSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onGridStateChanged`, stateChangeMock);
    });
  });

  describe('resetToOriginalColumns method', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call the method and expect 2x slickgrid methods to be called by default "setColumns" & "autosizeColumns"', () => {
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');

      service.resetToOriginalColumns();

      expect(setColsSpy).toHaveBeenCalled();
      expect(autoSizeSpy).toHaveBeenCalled();
    });

    it('should call the method and expect only 1 slickgrid methods to be called "setColumns"', () => {
      const setColsSpy = jest.spyOn(gridStub, 'setColumns');
      const autoSizeSpy = jest.spyOn(gridStub, 'autosizeColumns');

      service.resetToOriginalColumns(false);

      expect(setColsSpy).toHaveBeenCalled();
      expect(autoSizeSpy).not.toHaveBeenCalled();
    });
  });

  describe('resetRowSelectionWhenRequired method', () => {
    it('should call the method and do nothing when row selection is not in use', () => {
      const setSelectSpy = jest.spyOn(gridStub, 'setSelectedRows');
      service.resetRowSelectionWhenRequired();
      expect(setSelectSpy).not.toHaveBeenCalled();
    });

    it('should call the method and call the grid selection reset when the selection extension is used', () => {
      const extensionMock = { name: ExtensionName.rowSelection, addon: {}, instance: {} as unknown as SlickColumnPicker, class: null };
      const gridOptionsMock = { enableRowSelection: true } as GridOption;
      const gridOptionSpy = jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const setSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const extensionSpy = jest.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock as any);

      service.resetRowSelectionWhenRequired();

      expect(gridOptionSpy).toHaveBeenCalled();
      expect(extensionSpy).toHaveBeenCalledWith(ExtensionName.rowSelection);
      expect(setSelectionSpy).toHaveBeenCalled();
    });
  });

  describe('subscribeToAllGridChanges events', () => {
    let columnsMock: Column[];
    let currentColumnsMock: CurrentColumn[];
    let filterMock: CurrentFilter[];
    let sorterMock: CurrentSorter[];
    let pinningMock: CurrentPinning;

    beforeEach(() => {
      pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
      const gridOptionsMock = { enablePagination: false, enableCheckboxSelector: false, ...pinningMock } as GridOption;
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }, { columnId: 'field2', operator: '>=', searchTerms: [2] }] as CurrentFilter[];
      sorterMock = [{ columnId: 'field1', direction: 'ASC' }] as CurrentSorter[];
      currentColumnsMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];

      jest.spyOn(filterServiceStub, 'getCurrentLocalFilters').mockReturnValue(filterMock);
      jest.spyOn(sortServiceStub, 'getCurrentLocalSorters').mockReturnValue(sorterMock);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    it('should trigger a "onGridStateChanged" event when "onFilterChanged" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: filterMock, type: GridStateType.filter }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

      fnCallbacks['onFilterChanged'](filterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onFilterCleared" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: [], type: GridStateType.filter }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

      fnCallbacks['onFilterCleared'](filterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onSortChanged" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: sorterMock, type: GridStateType.sorter }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');

      fnCallbacks['onSortChanged'](sorterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onSortCleared" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: [], type: GridStateType.sorter }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      fnCallbacks['onSortCleared'](sorterMock);

      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onHeaderMenuHideColumns" is triggered', () => {
      const columnsMock1 = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const currentColumnsMock1 = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const gridStateMock = { columns: currentColumnsMock1, filters: [], sorters: [] } as GridState;
      const stateChangeMock = { change: { newValues: currentColumnsMock1, type: GridStateType.columns }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);
      const getAssocCurColSpy = jest.spyOn(service, 'getAssociatedCurrentColumns').mockReturnValue(currentColumnsMock1);

      fnCallbacks['onHeaderMenuHideColumns'](columnsMock1);

      expect(getCurGridStateSpy).toHaveBeenCalled();
      expect(getAssocCurColSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onTreeItemToggled" is triggered', () => {
      const toggleChangeMock = { type: 'toggle-expand', fromItemId: 2, previousFullToggleType: 'full-collapse', toggledItems: [{ itemId: 2, isCollapsed: true }] } as TreeToggleStateChange;
      const gridStateMock = { columns: [], filters: [], sorters: [], treeData: toggleChangeMock } as GridState;
      const stateChangeMock = { change: { newValues: toggleChangeMock, type: GridStateType.treeData }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      fnCallbacks['onTreeItemToggled'](toggleChangeMock);

      expect(getCurGridStateSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onTreeFullToggleEnd" is triggered', () => {
      const toggleChangeMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;
      const gridStateMock = { columns: [], filters: [], sorters: [], treeData: toggleChangeMock } as GridState;
      const stateChangeMock = { change: { newValues: toggleChangeMock, type: GridStateType.treeData }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = jest.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = jest.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      fnCallbacks['onTreeFullToggleEnd'](toggleChangeMock);

      expect(getCurGridStateSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });
  });
});
