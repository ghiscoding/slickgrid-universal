jest.mock('sortablejs');

import 'jest-extended';
import { of, throwError } from 'rxjs';

import {
  autoAddEditorFormatterToColumnsWithEditor,
  BackendServiceApi,
  BackendUtilityService,
  Column,
  CollectionService,
  ColumnFilters,
  CurrentFilter,
  CurrentPagination,
  CurrentPinning,
  CurrentSorter,
  Editor,
  Editors,
  ExtensionList,
  ExtensionService,
  ExtensionUtility,
  Filters,
  FilterService,
  Formatter,
  GridEventService,
  GridOption,
  GridService,
  GridState,
  GridStateService,
  GridStateType,
  GroupingAndColspanService,
  OnRowCountChangedEventArgs,
  OnRowsChangedEventArgs,
  OnSetItemsCalledEventArgs,
  Pagination,
  PaginationService,
  ResizerService,
  ServicePagination,
  SharedService,
  SlickDataView,
  SlickEditorLock,
  SlickEventHandler,
  SlickGrid,
  SlickGroupItemMetadataProvider,
  SortService,
  TreeDataService,
  TranslaterService,
} from '@slickgrid-universal/common';
import { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, GraphqlServiceOption } from '@slickgrid-universal/graphql';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { SlickVanillaGridBundle } from '../slick-vanilla-grid-bundle';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { HttpStub } from '../../../../../test/httpClientStub';
import { MockSlickEvent, MockSlickEventHandler } from '../../../../../test/mockSlickEvent';
import { UniversalContainerService } from '../../services/universalContainer.service';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';

const extensionServiceStub = {
  addRxJsResource: jest.fn(),
  bindDifferentExtensions: jest.fn(),
  createExtensionsBeforeGridCreation: jest.fn(),
  dispose: jest.fn(),
  renderColumnHeaders: jest.fn(),
  translateAllExtensions: jest.fn(),
  translateCellMenu: jest.fn(),
  translateColumnHeaders: jest.fn(),
  translateColumnPicker: jest.fn(),
  translateContextMenu: jest.fn(),
  translateGridMenu: jest.fn(),
  translateHeaderMenu: jest.fn(),
} as unknown as ExtensionService;
Object.defineProperty(extensionServiceStub, 'extensionList', { get: jest.fn(() => { }), set: jest.fn(), configurable: true });

const mockExtensionUtility = {
  translateItems: jest.fn(),
} as unknown as ExtensionUtility;

const groupingAndColspanServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
  translateGroupingAndColSpan: jest.fn(),
} as unknown as GroupingAndColspanService;

const mockGraphqlService = {
  getDatasetName: jest.fn(),
  buildQuery: jest.fn(),
  init: jest.fn(),
  updateFilters: jest.fn(),
  updateSorters: jest.fn(),
  updatePagination: jest.fn(),
} as unknown as GraphqlService;

const backendUtilityServiceStub = {
  addRxJsResource: jest.fn(),
  executeBackendProcessesCallback: jest.fn(),
  executeBackendCallback: jest.fn(),
  onBackendError: jest.fn(),
  refreshBackendDataset: jest.fn(),
} as unknown as BackendUtilityService;

const collectionServiceStub = {
  filterCollection: jest.fn(),
  singleFilterCollection: jest.fn(),
  sortCollection: jest.fn(),
} as unknown as CollectionService;

const filterServiceStub = {
  addRxJsResource: jest.fn(),
  clearFilters: jest.fn(),
  dispose: jest.fn(),
  init: jest.fn(),
  bindBackendOnFilter: jest.fn(),
  bindLocalOnFilter: jest.fn(),
  bindLocalOnSort: jest.fn(),
  bindBackendOnSort: jest.fn(),
  populateColumnFilterSearchTermPresets: jest.fn(),
  refreshTreeDataFilters: jest.fn(),
  getColumnFilters: jest.fn(),
} as unknown as FilterService;

const gridEventServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
  bindOnBeforeEditCell: jest.fn(),
  bindOnCellChange: jest.fn(),
  bindOnClick: jest.fn(),
} as unknown as GridEventService;

const gridServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
} as unknown as GridService;

const gridStateServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
  getAssociatedGridColumns: jest.fn(),
  getCurrentGridState: jest.fn(),
  needToPreserveRowSelection: jest.fn(),
} as unknown as GridStateService;

const paginationServiceStub = {
  totalItems: 0,
  addRxJsResource: jest.fn(),
  init: jest.fn(),
  dispose: jest.fn(),
  getFullPagination: jest.fn(),
  updateTotalItems: jest.fn(),
} as unknown as PaginationService;

const resizerServiceStub = {
  dispose: jest.fn(),
  init: jest.fn(),
  resizeGrid: jest.fn(),
  resizeColumnsByCellContent: jest.fn(),
} as unknown as ResizerService;

Object.defineProperty(paginationServiceStub, 'totalItems', {
  get: jest.fn(() => 0),
  set: jest.fn()
});

const sortServiceStub = {
  addRxJsResource: jest.fn(),
  bindBackendOnSort: jest.fn(),
  bindLocalOnSort: jest.fn(),
  dispose: jest.fn(),
  loadGridSorters: jest.fn(),
  processTreeDataInitialSort: jest.fn(),
  sortHierarchicalDataset: jest.fn(),
} as unknown as SortService;

const treeDataServiceStub = {
  init: jest.fn(),
  convertFlatParentChildToTreeDataset: jest.fn(),
  convertFlatParentChildToTreeDatasetAndSort: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  sortHierarchicalDataset: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

const mockDataView = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  beginUpdate: jest.fn(),
  endUpdate: jest.fn(),
  getFilteredItemCount: jest.fn(),
  getItem: jest.fn(),
  getItemCount: jest.fn(),
  getItems: jest.fn(),
  getItemMetadata: jest.fn(),
  getLength: jest.fn(),
  getPagingInfo: jest.fn(),
  mapIdsToRows: jest.fn(),
  mapRowsToIds: jest.fn(),
  onRowsChanged: new MockSlickEvent<OnRowsChangedEventArgs>(),
  onRowCountChanged: new MockSlickEvent<OnRowCountChangedEventArgs>(),
  onSetItemsCalled: new MockSlickEvent<OnSetItemsCalledEventArgs>(),
  reSort: jest.fn(),
  setItems: jest.fn(),
  setSelectedIds: jest.fn(),
  syncGridSelection: jest.fn(),
} as unknown as SlickDataView;

const mockSlickEventHandler = {
  handlers: [],
  notify: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as unknown as SlickEventHandler;

const mockGetEditorLock = {
  isActive: () => true,
  commitCurrentEdit: jest.fn(),
} as unknown as SlickEditorLock;

const mockGrid = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  autosizeColumns: jest.fn(),
  destroy: jest.fn(),
  init: jest.fn(),
  invalidate: jest.fn(),
  getActiveCellNode: jest.fn(),
  getColumns: jest.fn(),
  getCellEditor: jest.fn(),
  getEditorLock: () => mockGetEditorLock,
  getUID: () => 'slickgrid_12345',
  getContainerNode: jest.fn(),
  getGridPosition: jest.fn(),
  getOptions: jest.fn(),
  getSelectionModel: jest.fn(),
  getScrollbarDimensions: jest.fn(),
  updateRow: jest.fn(),
  render: jest.fn(),
  registerPlugin: jest.fn(),
  reRenderColumns: jest.fn(),
  resizeCanvas: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setOptions: jest.fn(),
  setSelectedRows: jest.fn(),
  onClick: new MockSlickEvent(),
  onClicked: new MockSlickEvent(),
  onColumnsReordered: new MockSlickEvent(),
  onRendered: jest.fn(),
  onScroll: jest.fn(),
  onDataviewCreated: new MockSlickEvent(),
} as unknown as SlickGrid;

const template = `<div class="demo-container"><div class="grid1"></div></div>`;
const slickEventHandler = new MockSlickEventHandler() as unknown as SlickEventHandler;

jest.mock('@slickgrid-universal/common', () => ({
  ...(jest.requireActual('@slickgrid-universal/common') as any),
  autoAddEditorFormatterToColumnsWithEditor: jest.fn(),
  SlickGrid: jest.fn().mockImplementation(() => mockGrid),
  SlickEventHandler: jest.fn().mockImplementation(() => mockSlickEventHandler),
  SlickDataView: jest.fn().mockImplementation(() => mockDataView),
}));

describe('Slick-Vanilla-Grid-Bundle Component instantiated via Constructor', () => {
  let component: SlickVanillaGridBundle;
  let divContainer: HTMLDivElement;
  let cellDiv: HTMLDivElement;
  let columnDefinitions: Column[];
  let gridOptions: GridOption;
  let sharedService: SharedService;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  const http = new HttpStub();
  const container = new UniversalContainerService();
  let dataset = [];

  beforeEach(() => {
    divContainer = document.createElement('div');
    cellDiv = document.createElement('div');
    divContainer.innerHTML = template;
    divContainer.appendChild(cellDiv);
    document.body.appendChild(divContainer);
    columnDefinitions = [{ id: 'name', field: 'name' }];
    gridOptions = {
      enableExcelExport: false,
      dataView: null,
      autoResize: {
        bottomPadding: 45,
        calculateAvailableSizeBy: 'window',
        minHeight: 180,
        minWidth: 300,
        rightPadding: 0,
      },
    } as unknown as GridOption;
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    eventPubSubService = new EventPubSubService(divContainer);
    jest.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
    dataset = [];

    component = new SlickVanillaGridBundle(
      divContainer,
      columnDefinitions,
      gridOptions,
      dataset,
      undefined,
      {
        backendUtilityService: backendUtilityServiceStub,
        collectionService: collectionServiceStub,
        eventPubSubService,
        extensionService: extensionServiceStub,
        extensionUtility: mockExtensionUtility,
        filterService: filterServiceStub,
        gridEventService: gridEventServiceStub,
        gridService: gridServiceStub,
        gridStateService: gridStateServiceStub,
        groupingAndColspanService: groupingAndColspanServiceStub,
        paginationService: paginationServiceStub,
        resizerService: resizerServiceStub,
        sharedService,
        sortService: sortServiceStub,
        treeDataService: treeDataServiceStub,
        translaterService: translateService as unknown as TranslaterService,
        universalContainerService: container,
      }
    );
  });

  afterEach(() => {
    component?.dispose();
  });

  it('should make sure SlickVanillaGridBundle is defined', () => {
    expect(component).toBeTruthy();
    expect(component.isGridInitialized).toBeTruthy();
  });

  it('should provide the gridService lazily', () => {
    cellDiv = document.createElement('div');
    divContainer.innerHTML = template;
    divContainer.appendChild(cellDiv);

    const instance = new SlickVanillaGridBundle(
      divContainer,
      columnDefinitions,
      gridOptions,
      dataset,
      undefined,
      {
        backendUtilityService: backendUtilityServiceStub,
        collectionService: collectionServiceStub,
        eventPubSubService,
        extensionService: undefined,
        extensionUtility: mockExtensionUtility,
        filterService: filterServiceStub,
        gridEventService: gridEventServiceStub,
        gridService: gridServiceStub,
        gridStateService: gridStateServiceStub,
        groupingAndColspanService: groupingAndColspanServiceStub,
        paginationService: paginationServiceStub,
        resizerService: resizerServiceStub,
        sharedService,
        sortService: sortServiceStub,
        treeDataService: treeDataServiceStub,
        translaterService: translateService as unknown as TranslaterService,
        universalContainerService: container,
      }
    );

    expect((instance.extensionService as any).lazyGridService()).toBeDefined();
  });

  it('should load enabled mousewheel scrolling when using a frozen grid', () => {
    component.gridOptions.enableMouseWheelScrollHandler = undefined;
    component.gridOptions.frozenRow = 3;
    component.initialization(divContainer, slickEventHandler);

    expect(component.gridOptions.enableMouseWheelScrollHandler).toBeTrue();
  });

  it('should keep frozen column index reference (via frozenVisibleColumnId) when grid is a frozen grid', () => {
    const sharedFrozenIndexSpy = jest.spyOn(SharedService.prototype, 'frozenVisibleColumnId', 'set');
    component.gridOptions.frozenColumn = 0;
    component.initialization(divContainer, slickEventHandler);

    expect(sharedFrozenIndexSpy).toHaveBeenCalledWith('name');
  });

  it('should update "visibleColumns" in the Shared Service when "onColumnsReordered" event is triggered', () => {
    const sharedHasColumnsReorderedSpy = jest.spyOn(SharedService.prototype, 'hasColumnsReordered', 'set');
    const sharedVisibleColumnsSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
    const newVisibleColumns = [{ id: 'lastName', field: 'lastName' }, { id: 'fristName', field: 'fristName' }];

    component.gridOptions = { enableFiltering: true };
    component.initialization(divContainer, slickEventHandler);
    mockGrid.onColumnsReordered.notify({ impactedColumns: newVisibleColumns, grid: mockGrid });

    expect(component.eventHandler).toEqual(slickEventHandler);
    expect(sharedHasColumnsReorderedSpy).toHaveBeenCalledWith(true);
    expect(sharedVisibleColumnsSpy).toHaveBeenCalledWith(newVisibleColumns);
  });

  it('should create a grid and expect multiple event published', () => {
    const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

    component.initialization(divContainer, slickEventHandler);
    const instances = component.instances;

    expect(pubSubSpy).toHaveBeenCalled();
    expect(pubSubSpy).toHaveBeenNthCalledWith(1, 'onBeforeGridCreate', true);
    expect(pubSubSpy).toHaveBeenNthCalledWith(2, 'onDataviewCreated', expect.any(Object));
    expect(pubSubSpy).toHaveBeenNthCalledWith(3, 'onGridCreated', expect.any(Object));
    expect(pubSubSpy).toHaveBeenNthCalledWith(4, 'onSlickerGridCreated', instances);

    component.dispose();
    expect(pubSubSpy).toHaveBeenNthCalledWith(5, 'onBeforeGridDestroy', expect.any(Object));
    expect(pubSubSpy).toHaveBeenNthCalledWith(6, 'onAfterGridDestroyed', true);
  });

  // TODO: revisit later, this is conflicting with Grid State & Presets
  it.skip('should update column definitions when onPluginColumnsChanged event is triggered with updated columns', () => {
    const columnsMock = [
      { id: 'firstName', field: 'firstName', editor: undefined, internalColumnEditor: {} },
      { id: 'lastName', field: 'lastName', editor: undefined, internalColumnEditor: {} }
    ];
    eventPubSubService.publish('onPluginColumnsChanged', {
      columns: columnsMock,
      pluginName: 'RowMoveManager'
    });

    component.initialization(divContainer, slickEventHandler);

    expect(component.columnDefinitions).toEqual(columnsMock);
  });

  describe('initialization method', () => {
    const customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef) => {
      const isEditableItem = !!columnDef.editor;
      value = (value === null || value === undefined) ? '' : value;
      return isEditableItem ? `<div class="editing-field">${value}</div>` : value;
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize the grid with a fixed height when provided in the grid options', () => {
      const fixedHeight = 100;
      const resizerSpy = jest.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridHeight: fixedHeight };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: fixedHeight, width: undefined });
    });

    it('should initialize the grid with a fixed height when provided in the grid options', () => {
      const fixedHeight = 100;
      const resizerSpy = jest.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridHeight: fixedHeight };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: fixedHeight, width: undefined });
    });

    it('should initialize the grid with a fixed width when provided in the grid options', () => {
      const fixedWidth = 255;
      const resizerSpy = jest.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridWidth: fixedWidth };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: undefined, width: fixedWidth });
    });

    it('should initialize the grid with autoResize enabled and without height/width then expect a "gridResize" to be called for auto-resizing', () => {
      const resizerSpy = jest.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { enableAutoResize: true };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith();
    });

    describe('autoAddCustomEditorFormatter grid option', () => {
      it('should initialize the grid and automatically add custom Editor Formatter when provided in the grid options', () => {
        component.gridOptions = { autoAddCustomEditorFormatter: customEditableInputFormatter };
        component.initialization(divContainer, slickEventHandler);

        expect(autoAddEditorFormatterToColumnsWithEditor).toHaveBeenCalledWith([{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }], customEditableInputFormatter);
      });
    });

    describe('columns definitions changed', () => {
      it('should expect "translateColumnHeaders" being called when "enableTranslate" is set', () => {
        const translateSpy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const updateSpy = jest.spyOn(component, 'updateColumnDefinitionsList');
        const eventSpy = jest.spyOn(eventPubSubService, 'publish');
        const addPubSubSpy = jest.spyOn(component.translaterService as TranslaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.columnDefinitions = mockColDefs;
        component.gridOptions = { enableTranslate: true };
        component.initialization(divContainer, slickEventHandler);

        expect(component.translaterService).toBeTruthy();
        expect(addPubSubSpy).toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledTimes(4);
        expect(translateSpy).toHaveBeenCalled();
        expect(autosizeSpy).toHaveBeenCalled();
        expect(updateSpy).toHaveBeenCalledWith(mockColDefs);
      });

      it('should expect "renderColumnHeaders" being called when "enableTranslate" is disabled', () => {
        const translateSpy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const updateSpy = jest.spyOn(component, 'updateColumnDefinitionsList');
        const renderSpy = jest.spyOn(extensionServiceStub, 'renderColumnHeaders');
        const eventSpy = jest.spyOn(eventPubSubService, 'publish');
        const addPubSubSpy = jest.spyOn(component.translaterService as TranslaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.gridOptions = { enableTranslate: false, autoAddCustomEditorFormatter: customEditableInputFormatter };
        component.columnDefinitions = mockColDefs;
        component.initialization(divContainer, slickEventHandler);

        expect(translateSpy).not.toHaveBeenCalled();
        expect(autosizeSpy).toHaveBeenCalled();
        expect(addPubSubSpy).not.toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledTimes(4);
        expect(updateSpy).toHaveBeenCalledWith(mockColDefs);
        expect(renderSpy).toHaveBeenCalledWith(mockColDefs, true);
        expect(autoAddEditorFormatterToColumnsWithEditor).toHaveBeenCalledWith([{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }], customEditableInputFormatter);
      });
    });

    describe('dataset changed', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should expect "autosizeColumns" being called when "autoFitColumnsOnFirstLoad" is set we udpated the dataset', () => {
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true };
        component.initialization(divContainer, slickEventHandler);
        component.setData(mockData, true); // manually force an autoresize

        expect(autosizeSpy).toHaveBeenCalledTimes(2); // 1x by datasetChanged and 1x by bindResizeHook
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "autosizeColumns" being called when "autoFitColumnsOnFirstLoad" is set and we are on first page load', () => {
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(autosizeSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "autosizeColumns" NOT being called when "autoFitColumnsOnFirstLoad" is not set and we are on first page load', () => {
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: false };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(autosizeSpy).not.toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "resizeColumnsByCellContent" being called when "enableAutoResizeColumnsByCellContent" is set and we changing column definitions via its SETTER', () => {
        const resizeContentSpy = jest.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collection: ['male', 'female'] } }] as Column[];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.columnDefinitions = mockColDefs;
        component.gridOptions = { autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, autosizeColumnsByCellContentOnFirstLoad: true, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;
        component.columnDefinitions = mockColDefs;

        expect(resizeContentSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should throw an error if we try to enable both auto resize type at same time with "autoFitColumnsOnFirstLoad" and "autosizeColumnsByCellContentOnFirstLoad"', (done) => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true, autosizeColumnsByCellContentOnFirstLoad: true };

        try {
          component.initialization(divContainer, slickEventHandler);
          component.dataset = mockData;
        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use.');
          component.dispose();
          done();
        }
      });

      it('should throw an error if we try to enable both auto resize type at same time with "enableAutoSizeColumns" and "enableAutoResizeColumnsByCellContent"', (done) => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        jest.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { enableAutoSizeColumns: true, enableAutoResizeColumnsByCellContent: true };

        try {
          component.initialization(divContainer, slickEventHandler);
          component.dataset = mockData;
        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use.');
          component.dispose();
          done();
        }
      });
    });

    describe('options changed', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
        sharedService.gridOptions = gridOptions;
      });

      afterEach(() => {
        mockGrid.getOptions = jest.fn();
        jest.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
      });

      it('should merge grid options with global options when slickgrid "getOptions" does not exist yet', () => {
        mockGrid.getOptions = () => null as any;
        const setOptionSpy = jest.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockGridOptions = { autoCommitEdit: false, autoResize: null as any };

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        // expect(component.gridOptions.autoResize.bottomPadding).toEqual(50 + DATAGRID_FOOTER_HEIGHT); // calculated by the lib
        expect(setOptionSpy).toBeCalledWith(mockGridOptions, false, true);
        expect(sharedOptionSpy).toBeCalledWith(mockGridOptions);
      });

      it('should merge grid options with global options and expect bottom padding to be calculated', () => {
        mockGrid.getOptions = () => null as any;
        const setOptionSpy = jest.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockGridOptions = { autoCommitEdit: false, autoResize: null as any };

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        expect(setOptionSpy).toBeCalledWith(mockGridOptions, false, true);
        expect(sharedOptionSpy).toBeCalledWith(mockGridOptions);
      });

      it('should merge paginationOptions when some already exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [] };
        const paginationSrvSpy = jest.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual({ ...mockPagination, totalItems: 0 });
        expect(paginationSrvSpy).toHaveBeenCalledWith(0, true);
      });

      it('should set brand new paginationOptions when none previously exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [], totalItems: 1 };
        const paginationSrvSpy = jest.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = undefined;
        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual(mockPagination);
        expect(paginationSrvSpy).toHaveBeenNthCalledWith(2, 1, true);
      });
    });

    describe('with editors', () => {
      it('should display a console error when any of the column definition ids include a dot notation', () => {
        const consoleSpy = jest.spyOn(global.console, 'error').mockReturnValue();
        const mockColDefs = [{ id: 'user.gender', field: 'user.gender', editor: { model: Editors.text, collection: ['male', 'female'] } }] as Column[];

        component.columnDefinitions = mockColDefs;

        expect(consoleSpy).toHaveBeenCalledWith('[Slickgrid-Universal] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".');
      });

      it('should be able to load async editors with a regular Promise', (done) => {
        const mockCollection = ['male', 'female'];
        const promise = new Promise(resolve => resolve(mockCollection));
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions[0].editor).toBeTruthy();
          expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.model).toEqual(Editors.text);
          done();
        });
      });

      it('should be able to load collectionAsync and expect Editor to be destroyed and re-render when receiving new collection from await', (done) => {
        const mockCollection = ['male', 'female'];
        const promise = new Promise(resolve => resolve(mockCollection));
        const mockEditor = {
          disable: jest.fn(),
          destroy: jest.fn(),
          renderDomElement: jest.fn(),
        } as unknown as Editor;
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];
        jest.spyOn(mockGrid, 'getCellEditor').mockReturnValue(mockEditor);
        const disableSpy = jest.spyOn(mockEditor, 'disable');
        const destroySpy = jest.spyOn(mockEditor, 'destroy');
        const renderSpy = jest.spyOn(mockEditor, 'renderDomElement');

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions[0].editor).toBeTruthy();
          expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.model).toEqual(Editors.text);
          expect(disableSpy).toHaveBeenCalledWith(false);
          expect(destroySpy).toHaveBeenCalled();
          expect(renderSpy).toHaveBeenCalledWith(mockCollection);
          done();
        });
      });

      it('should be able to load async editors with as a Promise with content to simulate http-client', (done) => {
        const mockCollection = ['male', 'female'];
        const promise = new Promise(resolve => resolve({ content: mockCollection }));
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.model).toEqual(Editors.text);
          done();
        });
      });

      it('should be able to load async editors with a Fetch Promise', (done) => {
        const mockCollection = ['male', 'female'];
        http.status = 200;
        http.object = mockCollection;
        http.returnKey = 'date';
        http.returnValue = '6/24/1984';
        http.responseHeaders = { accept: 'json' };
        const collectionAsync = http.fetch('http://locahost/api', { method: 'GET' });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync } }] as Column[];

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.model).toEqual(Editors.text);
          done();
        });
      });

      it('should be able to load async editors with an Observable', (done) => {
        const mockCollection = ['male', 'female'];
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: of(mockCollection) } }] as Column[];

        const rxjsMock = new RxJsResourceStub();
        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.registerExternalResources([rxjsMock], true);
        component.initialization(divContainer, slickEventHandler);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor!.model).toEqual(Editors.text);
          done();
        });
      });

      it('should throw an error when Fetch Promise response bodyUsed is true', (done) => {
        const consoleSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
        const mockCollection = ['male', 'female'];
        http.status = 200;
        http.object = mockCollection;
        http.returnKey = 'date';
        http.returnValue = '6/24/1984';
        http.responseHeaders = { accept: 'json' };
        const collectionAsync = http.fetch('http://invalid-url', { method: 'GET' });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync } }] as Column[];
        component.columnDefinitions = mockColDefs;

        component.initialization(divContainer, slickEventHandler);

        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(expect.toInclude('[SlickGrid-Universal] The response body passed to collectionAsync was already read.'));
          done();
        });
      });
    });

    describe('use grouping', () => {
      it('should load groupItemMetaProvider to the DataView when using "draggableGrouping" feature', () => {
        const dataviewSpy = jest.spyOn(SlickDataView.prototype, 'constructor' as any);
        const sharedMetaSpy = jest.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');
        jest.spyOn(extensionServiceStub, 'extensionList', 'get').mockReturnValue({ draggableGrouping: { pluginName: 'DraggableGrouping' } } as unknown as ExtensionList<any>);

        component.gridOptions = { draggableGrouping: {} };
        component.initialization(divContainer, slickEventHandler);
        const extensions = component.extensions as ExtensionList<any>;

        expect(Object.keys(extensions).length).toBe(1);
        expect(dataviewSpy).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() }, eventPubSubService);
        expect(sharedService.groupItemMetadataProvider instanceof SlickGroupItemMetadataProvider).toBeTruthy();
        expect(sharedMetaSpy).toHaveBeenCalledWith(expect.toBeObject());
        expect(mockGrid.registerPlugin).toHaveBeenCalled();

        component.dispose();
      });

      it('should load groupItemMetaProvider to the DataView when using "enableGrouping" feature', () => {
        const dataviewSpy = jest.spyOn(SlickDataView.prototype, 'constructor' as any);
        const sharedMetaSpy = jest.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');

        component.gridOptions = { enableGrouping: true };
        component.initialization(divContainer, slickEventHandler);

        expect(dataviewSpy).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() }, eventPubSubService);
        expect(sharedMetaSpy).toHaveBeenCalledWith(expect.toBeObject());
        expect(sharedService.groupItemMetadataProvider instanceof SlickGroupItemMetadataProvider).toBeTruthy();
        expect(mockGrid.registerPlugin).toHaveBeenCalled();

        component.dispose();
      });
    });

    describe('dataView options', () => {
      afterEach(() => {
        component.dispose();
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should call the onDataviewCreated emitter', () => {
        const spy = jest.spyOn(eventPubSubService, 'publish');

        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenNthCalledWith(2, 'onDataviewCreated', expect.any(Object));
      });

      it('should call the "executeAfterDataviewCreated" and "loadGridSorters" methods and Sorter Presets are provided in the Grid Options', () => {
        const globalEaSpy = jest.spyOn(eventPubSubService, 'publish');
        const sortSpy = jest.spyOn(sortServiceStub, 'loadGridSorters');

        component.gridOptions = { presets: { sorters: [{ columnId: 'field1', direction: 'DESC' }] } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(globalEaSpy).toHaveBeenNthCalledWith(3, 'onGridCreated', expect.any(Object));
        expect(sortSpy).toHaveBeenCalled();
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as True when the "dataView.syncGridSelection" grid option is enabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: true }, enableRowSelection: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as False when the "dataView.syncGridSelection" grid option is disabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: false }, enableRowSelection: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with 3 arguments when the "dataView" grid option is provided as an object', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          dataView: { syncGridSelection: { preserveHidden: true, preserveHiddenOnSelectionChange: false } },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true, false);
      });

      it('should call the DataView "syncGridSelection" method when using BackendServiceApi and "syncGridSelectionWithBackendService" when the "dataView.syncGridSelection" grid option is enabled as well', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" BUT the "dataView.syncGridSelection" grid option is disabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: false, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" disabled and the "dataView.syncGridSelection" grid option is enabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: false },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });
    });

    describe('flag checks', () => {
      afterEach(() => {
        jest.clearAllMocks();
        component.dispose();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is disabled', () => {
        const spy = jest.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        // @ts-ignore
        expect(spy).toHaveBeenCalledWith(mockGrid, container);
      });

      it('should not initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is also enabled', () => {
        const spy = jest.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(spy).not.toHaveBeenCalled();
      });

      it('should call "translateColumnHeaders" from ExtensionService when "enableTranslate" is set', () => {
        const spy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');

        component.gridOptions = { enableTranslate: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalled();
      });

      it('should add RxJS resource to all necessary Services when RxJS external resource is registered', () => {
        const rxjsMock = new RxJsResourceStub();
        const backendUtilitySpy = jest.spyOn(backendUtilityServiceStub, 'addRxJsResource');
        const filterServiceSpy = jest.spyOn(filterServiceStub, 'addRxJsResource');
        const sortServiceSpy = jest.spyOn(sortServiceStub, 'addRxJsResource');
        const paginationServiceSpy = jest.spyOn(paginationServiceStub, 'addRxJsResource');

        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.resetExternalResources();
        component.registerExternalResources([rxjsMock], true);
        component.initialization(divContainer, slickEventHandler);

        expect(backendUtilitySpy).toHaveBeenCalled();
        expect(filterServiceSpy).toHaveBeenCalled();
        expect(sortServiceSpy).toHaveBeenCalled();
        expect(paginationServiceSpy).toHaveBeenCalled();
        expect(component.registeredResources.length).toBe(4); // RxJsResourceStub, GridService, GridStateService, SlickEmptyCompositeEditorComponent
        expect(component.registeredResources[0] instanceof RxJsResourceStub).toBeTrue();
      });

      it('should destroy customElement and its DOM element when requested', () => {
        const spy = jest.spyOn(component, 'emptyGridContainerElm');

        component.initialization(divContainer, slickEventHandler);
        component.dispose(true);

        expect(spy).toHaveBeenCalledWith();
      });

      it('should bind local filter when "enableFiltering" is set', () => {
        const bindLocalSpy = jest.spyOn(filterServiceStub, 'bindLocalOnFilter');

        component.gridOptions = { enableFiltering: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should bind local sort when "enableSorting" is set', () => {
        const bindLocalSpy = jest.spyOn(sortServiceStub, 'bindLocalOnSort');

        component.gridOptions = { enableSorting: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should refresh a local grid and change pagination options pagination when a preset for it is defined in grid options', (done) => {
        const expectedPageNumber = 2;
        const expectedTotalItems = 2;
        const refreshSpy = jest.spyOn(component, 'refreshGridData');

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions = {
          enablePagination: true,
          presets: { pagination: { pageSize: 2, pageNumber: expectedPageNumber } }
        };
        component.paginationOptions = undefined;
        component.paginationOptions = { pageSize: 2, pageNumber: 2, pageSizes: [2, 10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        setTimeout(() => {
          expect(component.paginationOptions!.pageSize).toBe(2);
          expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
          expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
          expect(refreshSpy).toHaveBeenCalledWith(mockData);
          done();
        });
      });

      it('should refresh a local grid defined and change pagination options pagination when a preset is defined in grid options and total rows is different when Filters are applied', (done) => {
        const expectedPageNumber = 3;
        const expectedTotalItems = 15;
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const getPagingSpy = jest.spyOn(mockDataView, 'getPagingInfo').mockReturnValue({ pageNum: 1, totalRows: expectedTotalItems, pageSize: 10, totalPages: 15, dataView: mockDataView });

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions = {
          enableFiltering: true,
          enablePagination: true,
          presets: { pagination: { pageSize: 10, pageNumber: expectedPageNumber } }
        };
        component.paginationOptions = { pageSize: 10, pageNumber: 2, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        setTimeout(() => {
          expect(getPagingSpy).toHaveBeenCalled();
          expect(component.paginationOptions!.pageSize).toBe(10);
          expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
          expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
          expect(refreshSpy).toHaveBeenCalledWith(mockData);
          done();
        });
      });
    });

    describe('Backend Service API', () => {
      beforeEach(() => {
        component.gridOptions = {
          backendServiceApi: {
            onInit: jest.fn(),
            service: mockGraphqlService as any,
            preProcess: jest.fn(),
            postProcess: jest.fn(),
            process: jest.fn(),
          }
        };
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call the "createBackendApiInternalPostProcessCallback" method when Backend Service API is defined with a Graphql Service', () => {
        const spy = jest.spyOn(component, 'createBackendApiInternalPostProcessCallback');

        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method that was created by "createBackendApiInternalPostProcessCallback" with Pagination', () => {
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { users: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback and expect totalItems to be updated in the PaginationService when "refreshGridData" is called on the 2nd time', () => {
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName').mockReturnValue('users');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const paginationSpy = jest.spyOn(paginationServiceStub, 'totalItems', 'set');
        const mockDataset = [{ firstName: 'John' }, { firstName: 'Jane' }];

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { users: { nodes: mockDataset, totalCount: mockDataset.length } } } as GraphqlPaginatedResult);
        component.refreshGridData(mockDataset, 1);
        component.refreshGridData(mockDataset, 1);

        expect(refreshSpy).toHaveBeenCalledTimes(3);
        expect(paginationSpy).toHaveBeenCalledWith(2);
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method that was created by "createBackendApiInternalPostProcessCallback" without Pagination (when disabled)', () => {
        component.gridOptions.enablePagination = false;
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { users: [{ firstName: 'John' }] } });

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method but return an empty dataset when dataset name does not match "getDatasetName"', () => {
        component.gridOptions.enablePagination = true;
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { notUsers: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).not.toHaveBeenCalled();
        expect(component.dataset).toEqual([]);
      });

      it('should invoke "updateFilters" method with filters returned from "getColumnFilters" of the Filter Service when there is no Presets defined', () => {
        const mockColumnFilter = { name: { columnId: 'name', columnDef: { id: 'name', field: 'name', filter: { model: Filters.autocompleter } }, operator: 'EQ', searchTerms: ['john'] } };
        jest.spyOn(filterServiceStub, 'getColumnFilters').mockReturnValue(mockColumnFilter as unknown as ColumnFilters);
        const backendSpy = jest.spyOn(mockGraphqlService, 'updateFilters');

        component.gridOptions.presets = undefined;
        component.initialization(divContainer, slickEventHandler);

        expect(backendSpy).toHaveBeenCalledWith(mockColumnFilter as unknown as CurrentFilter[], false);
      });

      it('should override frozen grid options when "pinning" is defined in the "presets" property', () => {
        const pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
        const gridOptionSetterSpy = jest.spyOn(component, 'gridOptions', 'set');

        component.gridOptions.presets = { pinning: pinningMock };
        component.initialization(divContainer, slickEventHandler);

        expect(gridOptionSetterSpy).toHaveBeenCalledWith({ ...component.gridOptions, ...pinningMock });
        expect(component.gridOptions).toEqual({ ...component.gridOptions, ...pinningMock });
      });

      it('should call the "updateFilters" method when filters are defined in the "presets" property', () => {
        const spy = jest.spyOn(mockGraphqlService, 'updateFilters');
        const mockFilters = [{ columnId: 'company', searchTerms: ['xyz'], operator: 'IN' }] as CurrentFilter[];
        component.gridOptions.presets = { filters: mockFilters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(mockFilters, true);
      });

      it('should call the "updateSorters" method when sorters are defined in the "presets" property with multi-column sort enabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const spy = jest.spyOn(mockGraphqlService, 'updateSorters');
        const mockSorters = [{ columnId: 'firstName', direction: 'asc' }, { columnId: 'lastName', direction: 'desc' }] as CurrentSorter[];

        component.gridOptions.presets = { sorters: mockSorters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(undefined, mockSorters);
      });

      it('should call the "updateSorters" method with ONLY 1 column sort when multi-column sort is disabled and user provided multiple sorters in the "presets" property', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const spy = jest.spyOn(mockGraphqlService, 'updateSorters');
        const mockSorters = [{ columnId: 'firstName', direction: 'asc' }, { columnId: 'lastName', direction: 'desc' }] as CurrentSorter[];

        component.gridOptions.multiColumnSort = false;
        component.gridOptions.presets = { sorters: mockSorters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(undefined, [mockSorters[0]]);
      });

      it('should call the "updatePagination" method when filters are defined in the "presets" property', () => {
        const spy = jest.spyOn(mockGraphqlService, 'updatePagination');

        component.gridOptions.presets = { pagination: { pageNumber: 2, pageSize: 20 } };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(2, 20);
      });

      it('should refresh the grid and change pagination options pagination when a preset for it is defined in grid options', () => {
        const expectedPageNumber = 3;
        const refreshSpy = jest.spyOn(component, 'refreshGridData');

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions.enablePagination = true;
        component.gridOptions.presets = { pagination: { pageSize: 10, pageNumber: expectedPageNumber } };
        component.paginationOptions = { pageSize: 10, pageNumber: 1, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.paginationOptions!.pageSize).toBe(10);
        expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options with a Promise and Pagination enabled', (done) => {
        const now = new Date();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const promise = new Promise(resolve => setTimeout(() => resolve(processResult), 1));
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = jest.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(backendExecuteSpy).toHaveBeenCalledWith(expect.toBeDate(), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
          done();
        }, 5);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options with an Observable and Pagination enabled', (done) => {
        const now = new Date();
        const rxjsMock = new RxJsResourceStub();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const processSpy = jest.spyOn((component.gridOptions as any).backendServiceApi as BackendServiceApi, 'process').mockReturnValue(of(processResult));
        jest.spyOn((component.gridOptions as any).backendServiceApi.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = jest.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.externalResources = [rxjsMock];
        component.registerExternalResources([rxjsMock], true);
        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(backendExecuteSpy).toHaveBeenCalledWith(expect.toBeDate(), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
          done();
        }, 5);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options without Pagination (when disabled)', (done) => {
        const now = new Date();
        const query = `query { users { id,name,gender,company } }`;
        const processResult = {
          data: { users: [] },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const promise = new Promise(resolve => setTimeout(() => resolve(processResult), 1));
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = jest.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(backendExecuteSpy).toHaveBeenCalledWith(expect.toBeDate(), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
          done();
        }, 5);
      });

      it('should throw an error when the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options', (done) => {
        const mockError = { error: '404' };
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const promise = new Promise((_resolve, reject) => setTimeout(() => reject(mockError), 1));
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        promise.catch((e) => {
          expect(e).toEqual(mockError);
          done();
        });
      });

      it('should throw an error when the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options from an Observable', (done) => {
        const mockError = { error: '404' };
        const rxjsMock = new RxJsResourceStub();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processSpy = jest.spyOn((component.gridOptions as any).backendServiceApi as BackendServiceApi, 'process').mockReturnValue(throwError(mockError));
        jest.spyOn((component.gridOptions as any).backendServiceApi.service, 'buildQuery').mockReturnValue(query);
        const backendErrorSpy = jest.spyOn(backendUtilityServiceStub, 'onBackendError');

        component.gridOptions.externalResources = [rxjsMock];
        component.registerExternalResources([rxjsMock], true);
        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(backendErrorSpy).toHaveBeenCalledWith(mockError, component.gridOptions.backendServiceApi);
          done();
        });
      });
    });

    describe('bindDifferentHooks private method called by "attached"', () => {
      beforeEach(() => {
        component.columnDefinitions = [{ id: 'firstName', field: 'firstName' }];
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call multiple translate methods when locale changes', (done) => {
        const transExtensionSpy = jest.spyOn(extensionServiceStub, 'translateAllExtensions');
        const transGroupingColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: false, enableDraggableGrouping: false, showCustomFooter: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', { language: 'fr' });

        setTimeout(() => {
          expect(setHeaderRowSpy).not.toHaveBeenCalled();
          expect(transGroupingColSpanSpy).not.toHaveBeenCalled();
          expect(transExtensionSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should call "setHeaderRowVisibility", "translateGroupingAndColSpan" and other methods when locale changes', (done) => {
        component.columnDefinitions = [{ id: 'firstName', field: 'firstName', filterable: true }];
        const transExtensionSpy = jest.spyOn(extensionServiceStub, 'translateAllExtensions');
        const transGroupingColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', {});

        setTimeout(() => {
          expect(transGroupingColSpanSpy).toHaveBeenCalled();
          expect(transExtensionSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should call "translateGroupingAndColSpan" translate methods when locale changes and Column Grouping PreHeader are enabled', (done) => {
        const groupColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', {});

        setTimeout(() => {
          expect(groupColSpanSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should reflect columns in the grid', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCols = [{ id: 'firstName', field: 'firstName' }];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue(mockCols);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.gridOptions = { presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra checkbox selection column in the grid when "enableCheckboxSelector" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_checkbox_selector', field: '_checkbox_selector', editor: undefined, internalColumnEditor: {} }, mockCol];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { enableCheckboxSelector: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra row detail column in the grid when "enableRowDetailView" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_detail_selector', field: '_detail_selector', editor: undefined, internalColumnEditor: {} }, mockCol];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { ...gridOptions, enableRowDetailView: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra row move column in the grid when "enableRowMoveManager" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_move', field: '_move', editor: undefined, internalColumnEditor: {} }, mockCol];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { ...gridOptions, enableRowMoveManager: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect 3 dynamic columns (1-RowMove, 2-RowSelection, 3-RowDetail) when all associated extension flags are enabled', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [
          { id: '_move', field: '_move', editor: undefined, internalColumnEditor: {} },
          { id: '_checkbox_selector', field: '_checkbox_selector', editor: undefined, internalColumnEditor: {} },
          { id: '_detail_selector', field: '_detail_selector', editor: undefined, internalColumnEditor: {} },
          mockCol
        ];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { ...gridOptions, enableCheckboxSelector: true, enableRowDetailView: true, enableRowMoveManager: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should execute backend service "init" method when set', () => {
        const mockPagination = { pageNumber: 1, pageSizes: [10, 25, 50], pageSize: 10, totalItems: 100 };
        const mockGraphqlOptions = { datasetName: 'users', extraQueryArguments: [{ field: 'userId', value: 123 }] } as GraphqlServiceOption;
        const bindBackendSpy = jest.spyOn(sortServiceStub, 'bindBackendOnSort');
        const mockGraphqlService2 = { ...mockGraphqlService, init: jest.fn() } as unknown as GraphqlService;
        const initSpy = jest.spyOn(mockGraphqlService2, 'init');

        component.gridOptions = {
          // enablePagination: true,
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService2,
            options: mockGraphqlOptions,
            preProcess: () => jest.fn(),
            process: () => new Promise(resolve => resolve({ data: { users: { nodes: [], totalCount: 100 } } })),
          } as GraphqlServiceApi,
          pagination: mockPagination,
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(initSpy).toHaveBeenCalledWith(mockGraphqlOptions, mockPagination, mockGrid, sharedService);
      });

      it('should call bind backend sorting when "enableSorting" is set', () => {
        const bindBackendSpy = jest.spyOn(sortServiceStub, 'bindBackendOnSort');

        component.gridOptions = {
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService,
            preProcess: () => jest.fn(),
            process: () => new Promise(resolve => resolve('process resolved')),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should call bind local sorting when "enableSorting" is set and "useLocalSorting" is set as well', () => {
        const bindLocalSpy = jest.spyOn(sortServiceStub, 'bindLocalOnSort');

        component.gridOptions = {
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService,
            useLocalSorting: true,
            preProcess: () => jest.fn(),
            process: () => new Promise(resolve => resolve('process resolved')),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should call bind backend filtering when "enableFiltering" is set', () => {
        const initSpy = jest.spyOn(filterServiceStub, 'init');
        const bindLocalSpy = jest.spyOn(filterServiceStub, 'bindLocalOnFilter');
        const populateSpy = jest.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).not.toHaveBeenCalled();
      });

      it('should call bind local filtering when "enableFiltering" is set and "useLocalFiltering" is set as well', () => {
        const bindLocalSpy = jest.spyOn(filterServiceStub, 'bindLocalOnFilter');

        component.gridOptions = {
          enableFiltering: true,
          backendServiceApi: {
            service: mockGraphqlService,
            useLocalFiltering: true,
            preProcess: () => jest.fn(),
            process: () => new Promise(resolve => resolve('process resolved')),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should reflect column filters when "enableFiltering" is set', () => {
        const initSpy = jest.spyOn(filterServiceStub, 'init');
        const bindBackendSpy = jest.spyOn(filterServiceStub, 'bindBackendOnFilter');
        const populateSpy = jest.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = {
          enableFiltering: true,
          backendServiceApi: {
            service: mockGraphqlService,
            preProcess: () => jest.fn(),
            process: () => new Promise(resolve => resolve('process resolved')),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).not.toHaveBeenCalled();
      });

      it('should reflect column filters and populate filter search terms when "enableFiltering" is set and preset filters are defined', () => {
        const mockPresetFilters = [{ columnId: 'firstName', operator: 'IN', searchTerms: ['John', 'Jane'] }] as CurrentFilter[];
        const initSpy = jest.spyOn(filterServiceStub, 'init');
        const populateSpy = jest.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true, presets: { filters: mockPresetFilters } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).toHaveBeenCalledWith(mockPresetFilters);
      });

      it('should return null when "getItemMetadata" is called without a colspan callback defined', () => {
        const itemSpy = jest.spyOn(mockDataView, 'getItem');

        component.gridOptions = { colspanCallback: undefined } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).not.toHaveBeenCalled();
      });

      it('should execute colspan callback when defined in the grid options and "getItemMetadata" is called', () => {
        const mockCallback = jest.fn();
        const mockItem = { firstName: 'John', lastName: 'Doe' };
        const itemSpy = jest.spyOn(mockDataView, 'getItem').mockReturnValue(mockItem);

        component.gridOptions = { colspanCallback: mockCallback } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).toHaveBeenCalledWith(2);
        expect(mockCallback).toHaveBeenCalledWith(mockItem);
      });

      it('should update each row and re-render the grid when filtering and DataView "onRowsChanged" event is triggered', () => {
        const renderSpy = jest.spyOn(mockGrid, 'render');
        const updateRowSpy = jest.spyOn(mockGrid, 'updateRow');

        component.gridOptions = { enableFiltering: true };
        component.initialization(divContainer, slickEventHandler);
        mockDataView.onRowsChanged.notify({ itemCount: 0, dataView: mockDataView, rows: [1, 2, 3], calledOnRowCountChanged: false });

        expect(component.eventHandler).toEqual(slickEventHandler);
        expect(renderSpy).toHaveBeenCalled();
        expect(updateRowSpy).toHaveBeenCalledTimes(3);
      });
    });

    describe('setHeaderRowVisibility grid method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should show the header row when "showHeaderRow" is called with argument True', () => {
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = jest.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer, slickEventHandler);
        component.showHeaderRow(true);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(true);
        expect(setColumnSpy).toHaveBeenCalledTimes(1);
      });

      it('should show the header row when "showHeaderRow" is called with argument False', () => {
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = jest.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer, slickEventHandler);
        component.showHeaderRow(false);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(false);
        expect(setColumnSpy).not.toHaveBeenCalled();
      });
    });

    describe('pagination events', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should call trigger a gridStage change event when pagination change is triggered', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as Pagination;
        const pluginEaSpy = jest.spyOn(eventPubSubService, 'publish');
        jest.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

        component.initialization(divContainer, slickEventHandler);
        component.paginationChanged(mockPagination);

        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });

      it('should call trigger a gridStage change event when "onPaginationChanged" from the Pagination Service is triggered', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as CurrentPagination;
        const mockServicePagination = {
          ...mockPagination,
          dataFrom: 5,
          dataTo: 10,
          pageCount: 1,
          pageSizes: [5, 10, 15, 20],
        } as ServicePagination;
        const pluginEaSpy = jest.spyOn(eventPubSubService, 'publish');
        jest.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

        component.gridOptions.enablePagination = true;
        component.initialization(divContainer, slickEventHandler);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        eventPubSubService.publish('onPaginationChanged', mockServicePagination);

        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });

      it('should trigger a gridStage change and reset selected rows when pagination change is triggered and "enableRowSelection" is set', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as Pagination;
        const pluginEaSpy = jest.spyOn(eventPubSubService, 'publish');
        const setRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

        component.gridOptions = {
          enableRowSelection: true,
          backendServiceApi: { service: mockGraphqlService as any }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.paginationChanged(mockPagination);

        expect(setRowSpy).toHaveBeenCalledWith([]);
        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });

      it('should call trigger a gridStage change and reset selected rows when pagination change is triggered and "enableCheckboxSelector" is set', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as Pagination;
        const pluginEaSpy = jest.spyOn(eventPubSubService, 'publish');
        const setRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

        component.gridOptions = {
          enableCheckboxSelector: true,
          backendServiceApi: { service: mockGraphqlService as any }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.paginationChanged(mockPagination);

        expect(setRowSpy).toHaveBeenCalledWith([]);
        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });
    });

    describe('Empty Warning Message', () => {
      it('should display an Empty Warning Message when "enableEmptyDataWarningMessage" is enabled and the dataset is empty', (done) => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];
        const mockGridOptions = { enableTranslate: true, enableEmptyDataWarningMessage: true, };
        jest.spyOn(mockGrid, 'getOptions').mockReturnValue(mockGridOptions);
        jest.spyOn(mockGrid, 'getGridPosition').mockReturnValue({ top: 10, left: 20 } as any);

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        const emptySpy = jest.spyOn(component.slickEmptyWarning!, 'showEmptyDataMessage');
        component.columnDefinitions = mockColDefs;
        component.refreshGridData([]);
        mockDataView.onRowCountChanged.notify({ current: 0, previous: 0, dataView: mockDataView, itemCount: 0, callingOnRowsChanged: false });

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.gridOptions.enableEmptyDataWarningMessage).toBeTrue();
          expect(component.slickEmptyWarning).toBeTruthy();
          expect(emptySpy).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    describe('resizeColumnsByCellContent method', () => {
      it('should call "resizeColumnsByCellContent" when the DataView "onSetItemsCalled" event is triggered and "enableAutoResizeColumnsByCellContent" is set', () => {
        const resizeContentSpy = jest.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        jest.spyOn(mockDataView, 'getLength').mockReturnValue(1);

        component.gridOptions = { enablePagination: false, resizeByContentOnlyOnFirstLoad: false, showCustomFooter: true, autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 1 });

        expect(resizeContentSpy).toHaveBeenCalledWith(true);
      });

      it('should call "resizeColumnsByCellContent" when the DataView "onSetItemsCalled" event is triggered and "enableAutoResizeColumnsByCellContent" and "resizeColumnsByCellContent" are both set', () => {
        const resizeContentSpy = jest.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        jest.spyOn(mockDataView, 'getLength').mockReturnValue(1);

        component.gridOptions = { enablePagination: false, resizeByContentOnlyOnFirstLoad: true, showCustomFooter: true, autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 1 });

        expect(resizeContentSpy).toHaveBeenCalledWith(false);
      });
    });

    describe('Custom Footer', () => {
      it('should have a Custom Footer when "showCustomFooter" is enabled and there are no Pagination used', (done) => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];
        const mockGridOptions = { enableTranslate: true, showCustomFooter: true, customFooterOptions: { hideRowSelectionCount: false, } } as GridOption;
        jest.spyOn(mockGrid, 'getOptions').mockReturnValue(mockGridOptions);

        translateService.use('fr');
        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.gridOptions.showCustomFooter).toBeTrue();
          expect(component.gridOptions.customFooterOptions).toEqual({
            dateFormat: 'YYYY-MM-DD, hh:mm a',
            hideRowSelectionCount: false,
            hideLastUpdateTimestamp: true,
            hideTotalItemCount: false,
            footerHeight: 25,
            leftContainerClass: 'col-xs-12 col-sm-5',
            metricSeparator: '|',
            metricTexts: {
              items: 'éléments',
              itemsKey: 'ITEMS',
              itemsSelected: 'éléments sélectionnés',
              itemsSelectedKey: 'ITEMS_SELECTED',
              of: 'de',
              ofKey: 'OF',
            },
            rightContainerClass: 'col-xs-6 col-sm-7',
          });
          done();
        });
      });

      it('should NOT have a Custom Footer when "showCustomFooter" is enabled WITH Pagination in use', (done) => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.gridOptions.enablePagination = true;
        component.gridOptions.showCustomFooter = true;
        component.initialization(divContainer, slickEventHandler);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.slickFooter).toBeUndefined();
          done();
        });
      });

      it('should have custom footer with metrics when the DataView "onRowCountChanged" event is triggered', () => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const invalidateSpy = jest.spyOn(mockGrid, 'invalidate');
        const expectation = {
          startTime: expect.toBeDate(),
          endTime: expect.toBeDate(),
          itemCount: 2,
          totalItemCount: 2
        };
        jest.spyOn(mockDataView, 'getItemCount').mockReturnValue(mockData.length);
        jest.spyOn(mockDataView, 'getFilteredItemCount').mockReturnValue(mockData.length);

        component.gridOptions = { enablePagination: false, showCustomFooter: true };
        component.initialization(divContainer, slickEventHandler);
        const footerSpy = jest.spyOn(component.slickFooter!, 'metrics', 'set');
        mockDataView.onRowCountChanged.notify({ current: 2, previous: 0, dataView: mockDataView, itemCount: 0, callingOnRowsChanged: false });

        expect(invalidateSpy).toHaveBeenCalled();
        expect(component.metrics).toEqual(expectation);
        expect(footerSpy).toHaveBeenCalledWith(expectation);
      });

      it('should have custom footer with metrics when the DataView "onSetItemsCalled" event is triggered', () => {
        const invalidateSpy = jest.spyOn(mockGrid, 'invalidate');
        const expectation = {
          startTime: expect.toBeDate(),
          endTime: expect.toBeDate(),
          itemCount: 0,
          totalItemCount: 0
        };
        jest.spyOn(mockDataView, 'getFilteredItemCount').mockReturnValue(0);

        component.gridOptions = { enablePagination: false, showCustomFooter: true };
        component.initialization(divContainer, slickEventHandler);
        const footerSpy = jest.spyOn(component.slickFooter!, 'metrics', 'set');
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 0 });

        expect(invalidateSpy).toHaveBeenCalled();
        expect(component.metrics).toEqual(expectation);
        expect(footerSpy).toHaveBeenCalledWith(expectation);
      });
    });

    describe('loadRowSelectionPresetWhenExists method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should call the "mapIdsToRows" from the DataView then "setSelectedRows" from the Grid when there are row selection presets with "dataContextIds" array set', (done) => {
        const selectedGridRows = [2];
        const selectedRowIds = [99];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const dataviewSpy = jest.spyOn(mockDataView, 'mapIdsToRows').mockReturnValue(selectedGridRows);
        const selectRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(mockDataView, 'getLength').mockReturnValue(0);
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);

        component.gridOptions.enableCheckboxSelector = true;
        component.gridOptions.presets = { rowSelection: { dataContextIds: selectedRowIds } };
        component.isDatasetInitialized = false;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        setTimeout(() => {
          expect(dataviewSpy).toHaveBeenCalled();
          expect(selectRowSpy).toHaveBeenCalledWith(selectedGridRows);
          done();
        });
      });

      it('should call the "setSelectedRows" from the Grid when there are row selection presets with "dataContextIds" array set', (done) => {
        const selectedGridRows = [22];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const selectRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        jest.spyOn(mockDataView, 'getLength').mockReturnValue(mockData.length);

        component.gridOptions.enableRowSelection = true;
        component.gridOptions.presets = { rowSelection: { gridRowIndexes: selectedGridRows } };
        component.dataset = mockData;
        component.isDatasetInitialized = false; // it won't call the preset unless we reset this flag
        component.initialization(divContainer, slickEventHandler);

        setTimeout(() => {
          expect(component.isDatasetInitialized).toBe(true);
          expect(selectRowSpy).toHaveBeenCalledWith(selectedGridRows);
          done();
        });
      });

      it('should call the "setSelectedRows" and "setSelectedIds" when the Grid has Local Pagination and there are row selection presets with "dataContextIds" array set', () => {
        const selectedGridRows = [22];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const gridSelectedRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        const dvSetSelectedIdSpy = jest.spyOn(mockDataView, 'setSelectedIds');
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        jest.spyOn(mockDataView, 'getLength').mockReturnValue(mockData.length);

        component.gridOptions = {
          enableRowSelection: true,
          enablePagination: true,
          backendServiceApi: null as any,
          presets: { rowSelection: { dataContextIds: selectedGridRows } }
        };
        component.dataset = mockData;
        component.isDatasetInitialized = false; // it won't call the preset unless we reset this flag
        component.initialization(divContainer, slickEventHandler);

        expect(component.isDatasetInitialized).toBe(true);
        expect(gridSelectedRowSpy).toHaveBeenCalledWith([2]);
        expect(dvSetSelectedIdSpy).toHaveBeenCalledWith([22], { applyRowSelectionToGrid: true, isRowBeingAdded: true, shouldTriggerEvent: false });
      });
    });

    describe('onPaginationVisibilityChanged event', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should change "showPagination" flag when "onPaginationVisibilityChanged" from the Pagination Service is triggered', () => {
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = null as any;

        component.initialization(divContainer, slickEventHandler);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        const disposeSpy = jest.spyOn(component.slickPagination!, 'dispose');
        eventPubSubService.publish('onPaginationVisibilityChanged', { visible: false });

        expect(component.showPagination).toBeFalsy();
        expect(disposeSpy).toHaveBeenCalled();
      });

      it('should call the backend service API to refresh the dataset', () => {
        const backendRefreshSpy = jest.spyOn(backendUtilityServiceStub, 'refreshBackendDataset');
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = {
          service: mockGraphqlService as any,
          process: jest.fn(),
        };

        component.initialization(divContainer, slickEventHandler);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);

        eventPubSubService.publish('onPaginationVisibilityChanged', { visible: true });

        expect(backendRefreshSpy).toHaveBeenCalled();
        expect(component.slickPagination).toBeTruthy();
        expect(component.showPagination).toBeTruthy();
      });
    });

    describe('Tree Data View', () => {
      beforeEach(() => {
        component.eventPubSubService = new EventPubSubService(divContainer);
      });
      afterEach(() => {
        component.dispose();
        jest.clearAllMocks();
      });

      it('should change flat dataset and expect "convertFlatParentChildToTreeDatasetAndSort" being called with other methods', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const treeConvertAndSortSpy = jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = jest.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.gridOptions = {
          enableTreeData: true, treeDataOptions: {
            columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files',
            initialSort: { columndId: 'file', direction: 'ASC' }
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(refreshTreeSpy).toHaveBeenCalled();
        expect(treeConvertAndSortSpy).toHaveBeenCalled();
      });

      it('should change flat dataset and expect "convertFlatParentChildToTreeDataset" being called (without sorting) and other methods as well', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const treeConvertSpy = jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDataset').mockReturnValue(mockHierarchical as any[]);
        const refreshTreeSpy = jest.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.gridOptions = {
          enableTreeData: true, treeDataOptions: {
            columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files'
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(refreshTreeSpy).toHaveBeenCalled();
        expect(treeConvertSpy).toHaveBeenCalled();
      });

      it('should change hierarchical dataset and expect processTreeDataInitialSort being called with other methods', (done) => {
        const mockHierarchical = [{ file: 'documents', files: [{ file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const clearFilterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
        const refreshFilterSpy = jest.spyOn(filterServiceStub, 'refreshTreeDataFilters');
        const setItemsSpy = jest.spyOn(mockDataView, 'setItems');
        const processSpy = jest.spyOn(sortServiceStub, 'processTreeDataInitialSort');

        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file' } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.datasetHierarchical = mockHierarchical;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(clearFilterSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        expect(setItemsSpy).toHaveBeenCalledWith([], 'id');
        setTimeout(() => {
          expect(refreshFilterSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should preset hierarchical dataset before the initialization and expect sortHierarchicalDataset to be called', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const clearFilterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
        const setItemsSpy = jest.spyOn(mockDataView, 'setItems');
        const processSpy = jest.spyOn(sortServiceStub, 'processTreeDataInitialSort');
        const sortHierarchicalSpy = jest.spyOn(treeDataServiceStub, 'sortHierarchicalDataset').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });

        component.dispose();
        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file', initialSort: { columndId: 'file', direction: 'ASC' } } } as unknown as GridOption;
        component.datasetHierarchical = mockHierarchical;
        component.eventPubSubService = new EventPubSubService(divContainer);
        component.initialization(divContainer, slickEventHandler);

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(clearFilterSpy).toHaveBeenCalled();
        expect(processSpy).not.toHaveBeenCalled();
        expect(setItemsSpy).toHaveBeenCalledWith(mockFlatDataset, 'id');
        expect(sortHierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
      });

      it('should expect "refreshTreeDataFilters" method to be called when our flat dataset was already set and it just got changed a 2nd time', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = jest.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.dataset = [{ id: 0, file: 'documents' }];
        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files', initialSort: { columndId: 'file', direction: 'ASC' } } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(refreshTreeSpy).toHaveBeenCalled();
      });

      it('should also expect "refreshTreeDataFilters" method to be called even when the dataset length is the same but still has different properties (e.g. different filename)', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'new-vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        jest.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = jest.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.dataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'old-vacation.txt', parentId: 0 }];
        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files', initialSort: { columndId: 'file', direction: 'ASC' } } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(refreshTreeSpy).toHaveBeenCalled();
      });
    });
  });
});

describe('Slick-Vanilla-Grid-Bundle Component instantiated via Constructor with a Hierarchical Dataset', () => {
  let component: SlickVanillaGridBundle;
  let divContainer: HTMLDivElement;
  let cellDiv: HTMLDivElement;
  let columnDefinitions: Column[];
  let gridOptions: GridOption;
  let sharedService: SharedService;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  let dataset = [];
  let hierarchicalDataset: any = null;
  let hierarchicalSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    dataset = [];
    divContainer = document.createElement('div');
    cellDiv = document.createElement('div');
    divContainer.innerHTML = template;
    divContainer.appendChild(cellDiv);
    document.body.appendChild(divContainer);
    columnDefinitions = [{ id: 'name', field: 'name' }];
    gridOptions = {
      enableExcelExport: false,
      dataView: null,
      autoResize: {
        bottomPadding: 45,
        calculateAvailableSizeBy: 'window',
        minHeight: 180,
        minWidth: 300,
        rightPadding: 0,
      },
    } as unknown as GridOption;
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    eventPubSubService = new EventPubSubService(divContainer);
    jest.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
    dataset = [];
    hierarchicalDataset = [{ file: 'documents', files: [{ file: 'vacation.txt' }] }];

    component = new SlickVanillaGridBundle(
      divContainer,
      columnDefinitions,
      gridOptions,
      dataset,
      hierarchicalDataset,
      {
        backendUtilityService: backendUtilityServiceStub,
        collectionService: collectionServiceStub,
        eventPubSubService,
        extensionService: extensionServiceStub,
        extensionUtility: mockExtensionUtility,
        filterService: filterServiceStub,
        gridEventService: gridEventServiceStub,
        gridService: gridServiceStub,
        gridStateService: gridStateServiceStub,
        groupingAndColspanService: groupingAndColspanServiceStub,
        paginationService: paginationServiceStub,
        resizerService: resizerServiceStub,
        sharedService,
        sortService: sortServiceStub,
        treeDataService: treeDataServiceStub,
        translaterService: translateService as unknown as TranslaterService,
      }
    );
    hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
  });

  it('should provide hierarchical dataset by the constructor and expect processTreeDataInitialSort being called with other methods', () => {
    const mockHierarchical = [{ file: 'documents', files: [{ file: 'vacation.txt' }] }];

    component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file' } } as unknown as GridOption;
    component.initialization(divContainer, slickEventHandler as any);

    expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
  });
});

describe('Slick-Vanilla-Grid-Bundle Component instantiated via Constructor with a Slickgrid Container that already exist', () => {
  let component: SlickVanillaGridBundle;
  let divContainer: HTMLDivElement;
  let cellDiv: HTMLDivElement;
  let columnDefinitions: Column[];
  let gridOptions: GridOption;
  let sharedService: SharedService;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  let dataset = [];

  beforeEach(() => {
    divContainer = document.createElement('div');
    cellDiv = document.createElement('div');
    divContainer.innerHTML = `<div class="demo-container"><div class="grid1"><div class="slickgrid-container"></div></div></div>`;
    divContainer.appendChild(cellDiv);
    document.body.appendChild(divContainer);

    dataset = [];
    columnDefinitions = [{ id: 'name', field: 'name' }];
    gridOptions = {} as unknown as GridOption;
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    eventPubSubService = new EventPubSubService(divContainer);
    jest.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
    dataset = [];

    component = new SlickVanillaGridBundle(
      divContainer,
      columnDefinitions,
      gridOptions,
      dataset,
      null as any,
      {
        backendUtilityService: backendUtilityServiceStub,
        collectionService: collectionServiceStub,
        eventPubSubService,
        extensionService: extensionServiceStub,
        extensionUtility: mockExtensionUtility,
        filterService: filterServiceStub,
        gridEventService: gridEventServiceStub,
        gridService: gridServiceStub,
        gridStateService: gridStateServiceStub,
        groupingAndColspanService: groupingAndColspanServiceStub,
        paginationService: paginationServiceStub,
        resizerService: resizerServiceStub,
        sharedService,
        sortService: sortServiceStub,
        treeDataService: treeDataServiceStub,
        translaterService: translateService as unknown as TranslaterService,
      }
    );
  });

  it('should not initialize the grid when there is already a grid that exist, we will not create a second grid', () => {
    expect(component.isGridInitialized).toBeFalse();
    expect(component.isDatasetInitialized).toBeFalse();
  });
});
