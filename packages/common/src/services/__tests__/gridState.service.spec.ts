import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SlickEvent, SlickEventData, type SlickDataView, type SlickGrid } from '../../core/index.js';
import { ExtensionName } from '../../enums/index.js';
import type { SlickColumnPicker } from '../../extensions/slickColumnPicker.js';
import type { SlickRowSelectionModel } from '../../extensions/slickRowSelectionModel.js';
import type {
  BackendService,
  CheckboxSelectorOption,
  Column,
  CurrentColumn,
  CurrentFilter,
  CurrentPagination,
  CurrentPinning,
  CurrentRowSelection,
  CurrentSorter,
  GridOption,
  GridState,
  GridStateChange,
  RowDetailView,
  RowMoveManager,
  TreeToggleStateChange,
} from '../../interfaces/index.js';
import type { ExtensionService } from '../extension.service.js';
import type { FilterService } from '../filter.service.js';
import { GridStateService } from '../gridState.service.js';
import { SharedService } from '../shared.service.js';
import type { SortService } from '../sort.service.js';
import type { TreeDataService } from '../treeData.service.js';

vi.useFakeTimers();

const fnCallbacks: any = {};
const mockPubSub = {
  publish: vi.fn(),
  subscribe: (eventName, fn) => {
    if (Array.isArray(eventName)) {
      eventName.forEach((ev) => (fnCallbacks[ev as string] = fn));
    } else {
      fnCallbacks[eventName as string] = fn;
    }
  },
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;
vi.mock('@slickgrid-universal/event-pub-sub', () => ({
  PubSubService: () => mockPubSub,
}));

const gridOptionMock = {
  enableAutoResize: true,
  frozenBottom: false,
  frozenColumn: -1,
  frozenRow: -1,
} as GridOption;

const backendServiceStub = {
  getCurrentFilters: vi.fn(),
  getCurrentPagination: vi.fn(),
  getCurrentSorters: vi.fn(),
} as unknown as BackendService;

const dataViewStub = {
  getAllSelectedIds: vi.fn(),
  getAllSelectedFilteredIds: vi.fn(),
  getFilteredItems: vi.fn(),
  getGrouping: vi.fn(),
  mapIdsToRows: vi.fn(),
  mapRowsToIds: vi.fn(),
  onBeforePagingInfoChanged: new SlickEvent(),
  onPagingInfoChanged: new SlickEvent(),
  onSelectedRowIdsChanged: new SlickEvent(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: vi.fn(),
  getData: () => dataViewStub,
  getScrollbarDimensions: vi.fn(),
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getSelectionModel: vi.fn(),
  getSelectedRows: vi.fn(),
  setColumns: vi.fn(),
  setSelectedRows: vi.fn(),
  onColumnsReordered: new SlickEvent(),
  onColumnsResized: new SlickEvent(),
  onSetOptions: new SlickEvent(),
  onSelectedRowsChanged: new SlickEvent(),
} as unknown as SlickGrid;

const extensionServiceStub = {
  getExtensionByName: (_name: string) => {},
} as ExtensionService;

const filterServiceStub = {} as FilterService;

const sortServiceStub = {} as SortService;

const treeDataServiceStub = {
  getCurrentToggleState: vi.fn(),
} as unknown as TreeDataService;

const rowSelectionModelStub = {
  pluginName: 'RowSelectionModel',
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;

describe('GridStateService', () => {
  let service: GridStateService;
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
    service = new GridStateService(extensionServiceStub, filterServiceStub, mockPubSub, sharedService, sortServiceStub, treeDataServiceStub);
    service.init(gridStub);
    vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
  });

  afterEach(() => {
    service.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('init method', () => {
    let slickgridEvent: SlickEvent;

    beforeEach(() => {
      slickgridEvent = new SlickEvent();
    });

    afterEach(() => {
      slickgridEvent.unsubscribe();
    });

    it('should have called the "subscribeToAllGridChanges" method while initializing', () => {
      const gridStateSpy = vi.spyOn(service, 'subscribeToAllGridChanges');
      const pubSubSpy = vi.spyOn(mockPubSub, 'subscribe');

      service.init(gridStub);
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);

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
        const gridSpy = vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

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
        vi.spyOn(service, 'getAssociatedGridColumns').mockReturnValue([...columnsWithoutCheckboxMock]);
      });

      afterEach(() => {
        gridOptionMock.enableCheckboxSelector = false;
        gridOptionMock.enableRowDetailView = false;
        gridOptionMock.enableRowMoveManager = false;
        vi.clearAllMocks();
      });

      it('should call the method and expect slickgrid "setColumns" and "autosizeColumns" to be called with newest columns', () => {
        gridOptionMock.enableCheckboxSelector = true;
        gridOptionMock.enableRowDetailView = true;
        gridOptionMock.enableRowMoveManager = true;
        gridOptionMock.rowDetailView = { columnIndexPosition: 0 } as unknown as RowDetailView;
        gridOptionMock.rowMoveManager = { columnIndexPosition: 1 } as unknown as RowMoveManager;
        gridOptionMock.checkboxSelector = { columnIndexPosition: 2 } as unknown as CheckboxSelectorOption;

        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = vi.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock);

        expect(setColsSpy).toHaveBeenCalledWith([rowDetailColumnMock, rowMoveColumnMock, rowCheckboxColumnMock, ...columnsWithoutCheckboxMock]);
        expect(autoSizeSpy).toHaveBeenCalled();
        expect(pubSubSpy).not.toHaveBeenCalledWith('onFullResizeByContentRequested');
      });

      it('should call the method and expect slickgrid "setColumns" and a pubsub event "onFullResizeByContentRequested" to be called with newest columns when "triggerAutoSizeColumns" is false and "enableAutoResizeColumnsByCellContent" is true', () => {
        gridOptionMock.enableAutoResizeColumnsByCellContent = true;
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = vi.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect slickgrid "setColumns" but WITHOUT triggering pubsub event "onFullResizeByContentRequested" because it requires "enableAutoResizeColumnsByCellContent: true" AND "autosizeColumnsByCellContentOnFirstLoad: false" because this method is never called on first page load', () => {
        gridOptionMock.enableAutoResizeColumnsByCellContent = true;
        gridOptionMock.autosizeColumnsByCellContentOnFirstLoad = true;
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = vi.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).not.toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect slickgrid "setColumns" and a pubsub event "onFullResizeByContentRequested" to be called with newest columns when "triggerAutoSizeColumns" is false and 3rd is set to true', () => {
        vi.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(allColumnsMock);
        const setColsSpy = vi.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');
        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

        service.changeColumnsArrangement(presetColumnsMock, false, true);

        expect(setColsSpy).toHaveBeenCalledWith(columnsWithoutCheckboxMock);
        expect(autoSizeSpy).not.toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onFullResizeByContentRequested', { caller: 'GridStateService' });
      });

      it('should call the method and expect only 1 method of slickgrid "setColumns" to be called when we define 2nd argument (triggerAutoSizeColumns) as False', () => {
        const setColsSpy = vi.spyOn(gridStub, 'setColumns');
        const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');
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
        const stateChangeMock = { change: { newValues: associatedColumnsMock, type: 'columns' }, gridState: gridStateMock } as GridStateChange;

        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
        const gridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);
        const extensionSpy = vi.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock as any);

        service.init(gridStub);
        vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
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
        const stateChangeMock = { change: { newValues: associatedColumnsMock, type: 'columns' }, gridState: gridStateMock } as GridStateChange;

        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
        const gridColumnSpy = vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const gridColumnReorderSpy = vi.spyOn(gridStub.onColumnsReordered, 'subscribe');
        const gridColumnResizeSpy = vi.spyOn(gridStub.onColumnsResized, 'subscribe');
        const gridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

        service.init(gridStub);
        vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
        gridStub.onColumnsReordered.notify({ impactedColumns: columnsMock, previousColumnOrder: [], grid: gridStub }, new SlickEventData(), gridStub);
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
        const stateChangeMock = { change: { newValues: mockGridOptionsAfter, type: 'pinning' }, gridState: gridStateMock } as GridStateChange;
        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
        const gridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

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
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

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
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);

      const associatedGridColumns = service.getAssociatedGridColumns(gridStub, currentColumnsMock);
      const columns = service.getColumns();

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

  describe('getCurrentGrouping method', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "getCurrentGrouping" and return null when grouping is not enabled', () => {
      const gridOptionsMock = { enableGrouping: false, enableDraggableGrouping: false } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce(gridOptionsMock);

      const output = service.getCurrentGrouping();
      expect(output).toBeNull();
    });

    it('should call "getCurrentGrouping" and return grouped column Ids when enabled and Grouping getter are defined as strings', () => {
      const gridOptionsMock = { enableGrouping: true, enableDraggableGrouping: false } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      vi.spyOn(dataViewStub, 'getGrouping').mockReturnValue([{ getter: 'duration' }, { getter: 'active' }]);

      const output = service.getCurrentGrouping();
      const gridState = service.getCurrentGridState();

      expect(output).toEqual(['duration', 'active']);
      expect(gridState.grouping).toEqual(['duration', 'active']);
    });

    it('should call "getCurrentGrouping" and return grouped column Ids when enabled and DraggableGrouping getter are defined as strings', () => {
      const gridOptionsMock = { enableGrouping: false, enableDraggableGrouping: true } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      vi.spyOn(dataViewStub, 'getGrouping').mockReturnValue([{ getter: 'duration' }, { getter: 'active' }]);

      const output = service.getCurrentGrouping();
      const gridState = service.getCurrentGridState();

      expect(output).toEqual(['duration', 'active']);
      expect(gridState.grouping).toEqual(['duration', 'active']);
    });
  });

  describe('getCurrentPagination method', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "getCurrentPagination" and return null when no BackendService is used', () => {
      const output = service.getCurrentPagination();
      expect(output).toBeNull();
    });

    it('should call "getCurrentPagination" and return Pagination when using a Local Grid', () => {
      const gridOptionsMock = { enablePagination: true } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      sharedService.currentPagination = paginationMock;

      const output = service.getCurrentPagination();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBe(paginationMock);
    });

    it('should call "getCurrentPagination" and return Pagination when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub }, enablePagination: true } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = vi.spyOn(backendServiceStub, 'getCurrentPagination');
      (backendSpy as Mock).mockReturnValue(paginationMock);

      const output = service.getCurrentPagination();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(paginationMock);
    });

    it('should call "getCurrentGridState" method and return Pagination', () => {
      const gridOptionsMock = { enablePagination: true, frozenBottom: false, frozenColumn: -1, frozenRow: -1, enableTreeData: true } as GridOption;
      const paginationMock = { pageNumber: 2, pageSize: 50 } as CurrentPagination;
      const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }] as CurrentFilter[];
      const sorterMock = [
        { columnId: 'field1', direction: 'ASC' },
        { columnId: 'field2', direction: 'DESC' },
      ] as CurrentSorter[];
      const pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
      const treeDataMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;

      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const columnSpy = vi.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
      const filterSpy = vi.spyOn(service, 'getCurrentFilters').mockReturnValue(filterMock);
      const sorterSpy = vi.spyOn(service, 'getCurrentSorters').mockReturnValue(sorterMock);
      const paginationSpy = vi.spyOn(service, 'getCurrentPagination').mockReturnValue(paginationMock);
      const treeDataSpy = vi.spyOn(service, 'getCurrentTreeDataToggleState').mockReturnValue(treeDataMock);

      const output = service.getCurrentGridState();

      expect(columnSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(sorterSpy).toHaveBeenCalled();
      expect(paginationSpy).toHaveBeenCalled();
      expect(treeDataSpy).toHaveBeenCalled();
      expect(output).toEqual({
        columns: columnMock,
        filters: filterMock,
        sorters: sorterMock,
        pagination: paginationMock,
        pinning: pinningMock,
        treeData: treeDataMock,
      } as GridState);
    });
  });

  describe('getCurrentRowSelections method', () => {
    let pinningMock: CurrentPinning;

    beforeEach(() => {
      vi.clearAllMocks();
      pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
    });

    it('should return null when "enableCheckboxSelector" flag is disabled', () => {
      const gridOptionsMock = { enableCheckboxSelector: false, enableRowSelection: false, ...pinningMock } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.getCurrentRowSelections();

      expect(output).toBeNull();
    });

    it('should call "getCurrentGridState" method and return the Row Selection when either "enableCheckboxSelector" or "enableRowSelection" flag is enabled', () => {
      const selectedGridRows = [2];
      const selectedRowIds = [99];
      const gridOptionsMock = { enableCheckboxSelector: true, ...pinningMock } as GridOption;
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(selectedGridRows);
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const filterMock = [{ columnId: 'field1', operator: 'EQ', searchTerms: [] }] as CurrentFilter[];
      const sorterMock = [
        { columnId: 'field1', direction: 'ASC' },
        { columnId: 'field2', direction: 'DESC' },
      ] as CurrentSorter[];
      const selectionMock = { gridRowIndexes: selectedGridRows, dataContextIds: selectedRowIds } as CurrentRowSelection;

      const columnSpy = vi.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
      const filterSpy = vi.spyOn(service, 'getCurrentFilters').mockReturnValue(filterMock);
      const sorterSpy = vi.spyOn(service, 'getCurrentSorters').mockReturnValue(sorterMock);
      const selectionSpy = vi.spyOn(service, 'getCurrentRowSelections').mockReturnValue(selectionMock);

      const output = service.getCurrentGridState();

      expect(columnSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(sorterSpy).toHaveBeenCalled();
      expect(selectionSpy).toHaveBeenCalled();
      expect(output).toEqual({ columns: columnMock, filters: filterMock, sorters: sorterMock, rowSelection: selectionMock, pinning: pinningMock } as GridState);
    });

    it('should call the "mapIdsToRows" from the DataView and get the data IDs from the "selectedRowDataContextIds" array', () => {
      const mockRowIndexes = [3, 44];
      const mockRowIds = [333, 444];
      vi.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue(mockRowIds);
      vi.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValue(mockRowIds);
      vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockRowIndexes);

      service.selectedRowDataContextIds = mockRowIds;
      const output = service.getCurrentRowSelections();

      expect(output).toEqual({ gridRowIndexes: mockRowIndexes, dataContextIds: mockRowIds, filteredDataContextIds: mockRowIds });
    });
  });

  describe('Row Selection - bindSlickGridRowSelectionToGridStateChange method', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('with Pagination', () => {
      let pinningMock: CurrentPinning;
      beforeEach(() => {
        vi.clearAllMocks();
        service.dispose();
        pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
        const gridOptionsMock = { enablePagination: true, enableRowSelection: true, ...pinningMock } as GridOption;
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
      });

      it('should set new rows in the "selectedRowDataContextIds" setter when "onSelectedRowIdsChanged" is triggered with new selected row additions', () => {
        const mockPreviousDataIds = [333, 777];
        const mockNewRowIndexes = [3, 77, 55];
        const mockNewDataIds = [333, 777, 555];
        const columnMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
        const paginationMock = { pageNumber: 3, pageSize: 25 } as CurrentPagination;

        const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
        vi.spyOn(service, 'getCurrentColumns').mockReturnValue(columnMock);
        vi.spyOn(service, 'getCurrentPagination').mockReturnValue(paginationMock);
        vi.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue(mockNewDataIds);
        vi.spyOn(dataViewStub, 'getAllSelectedFilteredIds').mockReturnValue(mockNewDataIds);
        vi.spyOn(gridStub, 'getSelectedRows').mockReturnValue(mockNewRowIndexes);

        service.init(gridStub);
        service.selectedRowDataContextIds = mockPreviousDataIds;

        dataViewStub.onSelectedRowIdsChanged.notify({
          rows: mockNewRowIndexes,
          filteredIds: mockNewDataIds,
          ids: mockNewDataIds,
          selectedRowIds: mockNewDataIds,
          dataView: dataViewStub,
          grid: gridStub,
        });

        vi.runAllTimers();

        expect(service.selectedRowDataContextIds).toEqual(mockNewDataIds);
        expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, {
          change: {
            newValues: { gridRowIndexes: mockNewRowIndexes, dataContextIds: mockNewDataIds, filteredDataContextIds: mockNewDataIds },
            type: 'rowSelection',
          },
          gridState: {
            columns: columnMock,
            filters: null,
            sorters: null,
            pagination: paginationMock,
            pinning: pinningMock,
            rowSelection: { gridRowIndexes: mockNewRowIndexes, dataContextIds: mockNewDataIds, filteredDataContextIds: mockNewDataIds },
          },
        });
      });
    });
  });

  describe('getCurrentSorters method', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return null when no BackendService is used and SortService is missing the "getCurrentLocalSorters" method', () => {
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue({});

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return Sorters when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub } } as GridOption;
      const sorterMock = [
        { columnId: 'field1', direction: 'ASC' },
        { columnId: 'field2', direction: 'DESC' },
      ] as CurrentSorter[];
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = vi.spyOn(backendServiceStub, 'getCurrentSorters');
      (backendSpy as Mock).mockReturnValue(sorterMock);

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(sorterMock);
    });

    it('should return Sorters when Local grid is set and no BackendService is used', () => {
      const sorterMock = [
        { columnId: 'field1', direction: 'ASC' },
        { columnId: 'field2', direction: 'DESC' },
      ] as CurrentSorter[];
      sortServiceStub.getCurrentLocalSorters = () => sorterMock;
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue({});
      const sortSpy = vi.spyOn(sortServiceStub, 'getCurrentLocalSorters').mockReturnValue(sorterMock);

      const output = service.getCurrentSorters();

      expect(gridSpy).toHaveBeenCalled();
      expect(sortSpy).toHaveBeenCalled();
      expect(output).toBe(sorterMock);
    });
  });

  describe('getCurrentTreeDataToggleState method', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return null when Tree Data is not enabled', () => {
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue({ enableTreeData: false });

      const output = service.getCurrentTreeDataToggleState();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should expect Tree Data "getCurrentTreeDataToggleState" method to be called', () => {
      vi.spyOn(gridStub, 'getOptions').mockReturnValue({ enableTreeData: true });
      const treeDataMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;
      const getToggleSpy = vi.spyOn(treeDataServiceStub, 'getCurrentToggleState').mockReturnValue(treeDataMock);

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
      const gridSpy = vi.spyOn(gridStub, 'getOptions');

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return null when no BackendService is used and FilterService is missing the "getCurrentLocalFilters" method', () => {
      const gridSpy = vi.spyOn(gridStub, 'getOptions');

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(output).toBeNull();
    });

    it('should return Sorters when a BackendService is used', () => {
      const gridOptionsMock = { backendServiceApi: { service: backendServiceStub } } as GridOption;
      const filterMock = [
        { columnId: 'field1', operator: 'EQ', searchTerms: [] },
        { columnId: 'field2', operator: '>=', searchTerms: [2] },
      ] as CurrentFilter[];
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const backendSpy = vi.spyOn(backendServiceStub, 'getCurrentFilters');
      (backendSpy as Mock).mockReturnValue(filterMock);

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(backendSpy).toHaveBeenCalled();
      expect(output).toBe(filterMock);
    });

    it('should return Sorters when Local grid is set and no BackendService is used', () => {
      const filterMock = [
        { columnId: 'field1', operator: 'EQ', searchTerms: [] },
        { columnId: 'field2', operator: '>=', searchTerms: [2] },
      ] as CurrentFilter[];
      filterServiceStub.getCurrentLocalFilters = () => filterMock;
      const gridSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue({});
      const filterSpy = vi.spyOn(filterServiceStub, 'getCurrentLocalFilters').mockReturnValue(filterMock);

      const output = service.getCurrentFilters();

      expect(gridSpy).toHaveBeenCalled();
      expect(filterSpy).toHaveBeenCalled();
      expect(output).toBe(filterMock);
    });
  });

  describe('needToPreserveRowSelection method', () => {
    it('should return false when there are no "dataView" property defined in the grid options', () => {
      const gridOptionsMock = { dataView: null } as unknown as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(false);
    });

    it('should return false when "dataView" property is defined in the grid options with "syncGridSelection" property', () => {
      const gridOptionsMock = { dataView: null } as unknown as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(false);
    });

    it('should return true when the "dataView" grid option is a boolean and is set to True', () => {
      const gridOptionsMock = { dataView: { syncGridSelection: true }, enableRowSelection: true } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(true);
    });

    it('should return false when using BackendServiceApi and the "dataView" grid option is a boolean and is set to True but "syncGridSelectionWithBackendService" is disabled', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: false },
        backendServiceApi: {
          service: backendServiceStub,
          process: vi.fn(),
        },
        enableRowSelection: true,
      } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(false);
    });

    it('should return true when using BackendServiceApi and the "dataView" grid option is a boolean and is set to True but "syncGridSelectionWithBackendService" is enabled', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: true },
        backendServiceApi: {
          service: backendServiceStub,
          process: vi.fn(),
        },
        enableRowSelection: true,
      } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(true);
    });

    it('should return true when the "dataView" grid option is provided as an object', () => {
      const gridOptionsMock = {
        dataView: { syncGridSelection: { preserveHidden: true, preserveHiddenOnSelectionChange: false } },
        enableRowSelection: true,
      } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      const output = service.needToPreserveRowSelection();

      expect(output).toBe(true);
    });
  });

  describe('resetColumns method', () => {
    it('should call the method without any column definitions and expect "onGridStateChanged" to be triggered with empty changes', () => {
      const gridStateMock = { columns: [], filters: [], sorters: [] } as GridState;
      const stateChangeMock = { change: { newValues: [], type: 'columns' }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const serviceSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

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
      const stateChangeMock = { change: { newValues: currentColumnsMock, type: 'columns' }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const serviceSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      service.resetColumns(columnsMock);

      expect(serviceSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenLastCalledWith(`onGridStateChanged`, stateChangeMock);
    });
  });

  describe('resetToOriginalColumns method', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call the method and expect 2x slickgrid methods to be called by default "setColumns" & "autosizeColumns"', () => {
      const setColsSpy = vi.spyOn(gridStub, 'setColumns');
      const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');

      service.resetToOriginalColumns();

      expect(setColsSpy).toHaveBeenCalled();
      expect(autoSizeSpy).toHaveBeenCalled();
    });

    it('should call the method and expect only 1 slickgrid methods to be called "setColumns"', () => {
      const setColsSpy = vi.spyOn(gridStub, 'setColumns');
      const autoSizeSpy = vi.spyOn(gridStub, 'autosizeColumns');

      service.resetToOriginalColumns(false);

      expect(setColsSpy).toHaveBeenCalled();
      expect(autoSizeSpy).not.toHaveBeenCalled();
    });
  });

  describe('resetRowSelectionWhenRequired method', () => {
    it('should call the method and do nothing when row selection is not in use', () => {
      const setSelectSpy = vi.spyOn(gridStub, 'setSelectedRows');
      service.resetRowSelectionWhenRequired();
      expect(setSelectSpy).not.toHaveBeenCalled();
    });

    it('should call the method and call the grid selection reset when the selection extension is used', () => {
      const extensionMock = { name: ExtensionName.rowSelection, addon: {}, instance: {} as unknown as SlickColumnPicker, class: null };
      const gridOptionsMock = { enableRowSelection: true } as GridOption;
      const gridOptionSpy = vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      const setSelectionSpy = vi.spyOn(gridStub, 'setSelectedRows');
      const extensionSpy = vi.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock as any);

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
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);

      columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      filterMock = [
        { columnId: 'field1', operator: 'EQ', searchTerms: [] },
        { columnId: 'field2', operator: '>=', searchTerms: [2] },
      ] as CurrentFilter[];
      sorterMock = [{ columnId: 'field1', direction: 'ASC' }] as CurrentSorter[];
      currentColumnsMock = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];

      vi.spyOn(filterServiceStub, 'getCurrentLocalFilters').mockReturnValue(filterMock);
      vi.spyOn(sortServiceStub, 'getCurrentLocalSorters').mockReturnValue(sorterMock);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    it('should trigger a "onGridStateChanged" event when "onFilterChanged" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: filterMock, type: 'filter' }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

      fnCallbacks['onFilterChanged'](filterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onFilterCleared" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: [], type: 'filter' }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

      fnCallbacks['onFilterCleared'](filterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onSortChanged" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: sorterMock, type: 'sorter' }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');

      fnCallbacks['onSortChanged'](sorterMock);
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onSortCleared" is triggered', () => {
      const gridStateMock = { columns: currentColumnsMock, filters: filterMock, sorters: sorterMock, pinning: pinningMock } as GridState;
      const stateChangeMock = { change: { newValues: [], type: 'sorter' }, gridState: gridStateMock } as GridStateChange;

      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      fnCallbacks['onSortCleared'](sorterMock);

      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onHideColumns" or "onShowColumns" are triggered', () => {
      const columnsMock1 = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const currentColumnsMock1 = [{ columnId: 'field1', cssClass: 'red', headerCssClass: '', width: 100 }] as CurrentColumn[];
      const gridStateMock = { columns: currentColumnsMock1, filters: [], sorters: [] } as GridState;
      const stateChangeMock = { change: { newValues: currentColumnsMock1, type: 'columns' }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);
      const getAssocCurColSpy = vi.spyOn(service, 'getAssociatedCurrentColumns').mockReturnValue(currentColumnsMock1);

      for (const eventName of ['onHideColumns', 'onShowColumns']) {
        fnCallbacks[eventName](columnsMock1);

        expect(getCurGridStateSpy).toHaveBeenCalled();
        expect(getAssocCurColSpy).toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onGridStateChanged', stateChangeMock);
      }
    });

    it('should trigger a "onGridStateChanged" event when "onTreeItemToggled" is triggered', () => {
      const toggleChangeMock = {
        type: 'toggle-expand',
        fromItemId: 2,
        previousFullToggleType: 'full-collapse',
        toggledItems: [{ itemId: 2, isCollapsed: true }],
      } as TreeToggleStateChange;
      const gridStateMock = { columns: [], filters: [], sorters: [], treeData: toggleChangeMock } as GridState;
      const stateChangeMock = { change: { newValues: toggleChangeMock, type: 'treeData' }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      fnCallbacks['onTreeItemToggled'](toggleChangeMock);

      expect(getCurGridStateSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });

    it('should trigger a "onGridStateChanged" event when "onTreeFullToggleEnd" is triggered', () => {
      const toggleChangeMock = { type: 'full-expand', previousFullToggleType: 'full-expand', toggledItems: null } as TreeToggleStateChange;
      const gridStateMock = { columns: [], filters: [], sorters: [], treeData: toggleChangeMock } as GridState;
      const stateChangeMock = { change: { newValues: toggleChangeMock, type: 'treeData' }, gridState: gridStateMock } as GridStateChange;
      const pubSubSpy = vi.spyOn(mockPubSub, 'publish');
      const getCurGridStateSpy = vi.spyOn(service, 'getCurrentGridState').mockReturnValue(gridStateMock);

      fnCallbacks['onTreeFullToggleEnd'](toggleChangeMock);

      expect(getCurGridStateSpy).toHaveBeenCalled();
      expect(pubSubSpy).toHaveBeenCalledWith(`onGridStateChanged`, stateChangeMock);
    });
  });
});
