import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { of, throwError } from 'rxjs';

vi.mock('sortablejs');

import {
  autoAddEditorFormatterToColumnsWithEditor,
  type BackendServiceApi,
  type BackendUtilityService,
  type Column,
  type CollectionService,
  type ColumnFilters,
  type CurrentFilter,
  type CurrentPagination,
  type CurrentPinning,
  type CurrentSorter,
  type Editor,
  Editors,
  type ExtensionList,
  type ExtensionService,
  type ExtensionUtility,
  Filters,
  type FilterService,
  type Formatter,
  type GridEventService,
  type GridOption,
  type GridService,
  type GridState,
  type GridStateService,
  GridStateType,
  type GroupingAndColspanService,
  type OnRowCountChangedEventArgs,
  type OnRowsChangedEventArgs,
  type OnSetItemsCalledEventArgs,
  type Pagination,
  type PaginationService,
  type ResizerService,
  type ServicePagination,
  SharedService,
  SlickDataView,
  type SlickEditorLock,
  type SlickEventHandler,
  type SlickGrid,
  SlickGroupItemMetadataProvider,
  type SortService,
  type TreeDataService,
  type TranslaterService,
} from '@slickgrid-universal/common';
import type { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, GraphqlServiceOption } from '@slickgrid-universal/graphql';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { SlickVanillaGridBundle } from '../slick-vanilla-grid-bundle';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { HttpStub } from '../../../../../test/httpClientStub';
import { MockSlickEvent, MockSlickEventHandler } from '../../../../../test/mockSlickEvent';
import { UniversalContainerService } from '../../services/universalContainer.service';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';

vi.useFakeTimers();

const addVanillaEventPropagation = function (event) {
  Object.defineProperty(event, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  Object.defineProperty(event, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
  return event;
};

const viewportElm = document.createElement('div');
viewportElm.className = 'slick-viewport';
Object.defineProperty(viewportElm, 'offsetHeight', { writable: true, configurable: true, value: 12 });

const extensionServiceStub = {
  addRxJsResource: vi.fn(),
  bindDifferentExtensions: vi.fn(),
  createExtensionsBeforeGridCreation: vi.fn(),
  dispose: vi.fn(),
  renderColumnHeaders: vi.fn(),
  translateAllExtensions: vi.fn(),
  translateCellMenu: vi.fn(),
  translateColumnHeaders: vi.fn(),
  translateColumnPicker: vi.fn(),
  translateContextMenu: vi.fn(),
  translateGridMenu: vi.fn(),
  translateHeaderMenu: vi.fn(),
} as unknown as ExtensionService;
Object.defineProperty(extensionServiceStub, 'extensionList', { get: vi.fn(() => { }), set: vi.fn(), configurable: true });

const mockExtensionUtility = {
  translateItems: vi.fn(),
} as unknown as ExtensionUtility;

const groupingAndColspanServiceStub = {
  init: vi.fn(),
  dispose: vi.fn(),
  translateGroupingAndColSpan: vi.fn(),
} as unknown as GroupingAndColspanService;

const mockGraphqlService = {
  getDatasetName: vi.fn(),
  buildQuery: vi.fn(),
  init: vi.fn(),
  updateFilters: vi.fn(),
  updateSorters: vi.fn(),
  updatePagination: vi.fn(),
} as unknown as GraphqlService;

const backendUtilityServiceStub = {
  addRxJsResource: vi.fn(),
  executeBackendProcessesCallback: vi.fn(),
  executeBackendCallback: vi.fn(),
  onBackendError: vi.fn(),
  refreshBackendDataset: vi.fn(),
  setInfiniteScrollBottomHit: vi.fn(),
} as unknown as BackendUtilityService;

const collectionServiceStub = {
  filterCollection: vi.fn(),
  singleFilterCollection: vi.fn(),
  sortCollection: vi.fn(),
} as unknown as CollectionService;

const filterServiceStub = {
  addRxJsResource: vi.fn(),
  clearFilters: vi.fn(),
  dispose: vi.fn(),
  init: vi.fn(),
  bindBackendOnFilter: vi.fn(),
  bindLocalOnFilter: vi.fn(),
  bindLocalOnSort: vi.fn(),
  bindBackendOnSort: vi.fn(),
  populateColumnFilterSearchTermPresets: vi.fn(),
  refreshTreeDataFilters: vi.fn(),
  getColumnFilters: vi.fn(),
} as unknown as FilterService;

const gridEventServiceStub = {
  init: vi.fn(),
  dispose: vi.fn(),
  bindOnBeforeEditCell: vi.fn(),
  bindOnCellChange: vi.fn(),
  bindOnClick: vi.fn(),
} as unknown as GridEventService;

const gridServiceStub = {
  init: vi.fn(),
  dispose: vi.fn(),
} as unknown as GridService;

const gridStateServiceStub = {
  init: vi.fn(),
  dispose: vi.fn(),
  getAssociatedGridColumns: vi.fn(),
  getCurrentGridState: vi.fn(),
  needToPreserveRowSelection: vi.fn(),
} as unknown as GridStateService;

const paginationServiceStub = {
  totalItems: 0,
  addRxJsResource: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getFullPagination: vi.fn(),
  goToNextPage: vi.fn(),
  updateTotalItems: vi.fn(),
} as unknown as PaginationService;

const resizerServiceStub = {
  dispose: vi.fn(),
  init: vi.fn(),
  resizeGrid: vi.fn(),
  resizeColumnsByCellContent: vi.fn(),
} as unknown as ResizerService;

Object.defineProperty(paginationServiceStub, 'totalItems', {
  get: vi.fn(() => 0),
  set: vi.fn()
});

const sortServiceStub = {
  addRxJsResource: vi.fn(),
  bindBackendOnSort: vi.fn(),
  bindLocalOnSort: vi.fn(),
  dispose: vi.fn(),
  loadGridSorters: vi.fn(),
  processTreeDataInitialSort: vi.fn(),
  sortHierarchicalDataset: vi.fn(),
} as unknown as SortService;

const treeDataServiceStub = {
  init: vi.fn(),
  convertFlatParentChildToTreeDataset: vi.fn(),
  convertFlatParentChildToTreeDatasetAndSort: vi.fn(),
  dispose: vi.fn(),
  handleOnCellClick: vi.fn(),
  sortHierarchicalDataset: vi.fn(),
  toggleTreeDataCollapse: vi.fn(),
} as unknown as TreeDataService;

const mockDataView = {
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  beginUpdate: vi.fn(),
  endUpdate: vi.fn(),
  getFilteredItemCount: vi.fn(),
  getItem: vi.fn(),
  getItemCount: vi.fn(),
  getItems: vi.fn(),
  getItemMetadata: vi.fn(),
  getLength: vi.fn(),
  getPagingInfo: vi.fn(),
  mapIdsToRows: vi.fn(),
  mapRowsToIds: vi.fn(),
  onRowsChanged: new MockSlickEvent<OnRowsChangedEventArgs>(),
  onRowCountChanged: new MockSlickEvent<OnRowCountChangedEventArgs>(),
  onSetItemsCalled: new MockSlickEvent<OnSetItemsCalledEventArgs>(),
  reSort: vi.fn(),
  setItems: vi.fn(),
  setSelectedIds: vi.fn(),
  syncGridSelection: vi.fn(),
} as unknown as SlickDataView;

const mockSlickEventHandler = {
  handlers: [],
  notify: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as unknown as SlickEventHandler;

const mockGetEditorLock = {
  isActive: () => true,
  commitCurrentEdit: vi.fn(),
} as unknown as SlickEditorLock;

const mockGrid = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  autosizeColumns: vi.fn(),
  destroy: vi.fn(),
  init: vi.fn(),
  invalidate: vi.fn(),
  getActiveCellNode: vi.fn(),
  getColumns: vi.fn(),
  getCellEditor: vi.fn(),
  getEditorLock: () => mockGetEditorLock,
  getViewportNode: () => viewportElm,
  getUID: () => 'slickgrid_12345',
  getContainerNode: vi.fn(),
  getGridPosition: vi.fn(),
  getOptions: vi.fn(),
  getRenderedRange: vi.fn(),
  getSelectionModel: vi.fn(),
  getScrollbarDimensions: vi.fn(),
  updateRow: vi.fn(),
  render: vi.fn(),
  registerPlugin: vi.fn(),
  reRenderColumns: vi.fn(),
  resizeCanvas: vi.fn(),
  setColumns: vi.fn(),
  setHeaderRowVisibility: vi.fn(),
  setOptions: vi.fn(),
  setSelectedRows: vi.fn(),
  onClick: new MockSlickEvent(),
  onClicked: new MockSlickEvent(),
  onColumnsReordered: new MockSlickEvent(),
  onSetOptions: new MockSlickEvent(),
  onRendered: vi.fn(),
  onScroll: new MockSlickEvent(),
  onDataviewCreated: new MockSlickEvent(),
} as unknown as SlickGrid;

const template = `<div class="demo-container"><div class="grid1"></div></div>`;
const slickEventHandler = new MockSlickEventHandler() as unknown as SlickEventHandler;

vi.mock('@slickgrid-universal/common', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    autoAddEditorFormatterToColumnsWithEditor: vi.fn(),
    SlickGrid: vi.fn().mockImplementation(() => mockGrid),
    SlickEventHandler: vi.fn().mockImplementation(() => mockSlickEventHandler),
    SlickDataView: vi.fn().mockImplementation(() => mockDataView),
  };
});

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
      backendServiceApi: null,
    } as unknown as GridOption;
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    eventPubSubService = new EventPubSubService(divContainer);
    vi.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
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

    expect(component.gridOptions.enableMouseWheelScrollHandler).toBe(true);
  });

  it('should keep frozen column index reference (via frozenVisibleColumnId) when grid is a frozen grid', () => {
    const sharedFrozenIndexSpy = vi.spyOn(SharedService.prototype, 'frozenVisibleColumnId', 'set');
    component.gridOptions.frozenColumn = 0;
    component.initialization(divContainer, slickEventHandler);

    expect(sharedFrozenIndexSpy).toHaveBeenCalledWith('name');
  });

  it('should update "visibleColumns" in the Shared Service when "onColumnsReordered" event is triggered', () => {
    const sharedHasColumnsReorderedSpy = vi.spyOn(SharedService.prototype, 'hasColumnsReordered', 'set');
    const sharedVisibleColumnsSpy = vi.spyOn(SharedService.prototype, 'visibleColumns', 'set');
    const newVisibleColumns = [{ id: 'lastName', field: 'lastName' }, { id: 'fristName', field: 'fristName' }];

    component.gridOptions = { enableFiltering: true };
    component.initialization(divContainer, slickEventHandler);
    mockGrid.onColumnsReordered.notify({ impactedColumns: newVisibleColumns, grid: mockGrid });

    expect(component.eventHandler).toEqual(slickEventHandler);
    expect(sharedHasColumnsReorderedSpy).toHaveBeenCalledWith(true);
    expect(sharedVisibleColumnsSpy).toHaveBeenCalledWith(newVisibleColumns);
  });

  it('should change Dark Mode by using "setOptions" when triggered with "onSetOptions" event', () => {
    component.gridOptions = { darkMode: false };
    component.initialization(divContainer, slickEventHandler);
    mockGrid.onSetOptions.notify({ optionsBefore: { darkMode: false }, optionsAfter: { darkMode: true }, grid: mockGrid });

    expect(component.eventHandler).toEqual(slickEventHandler);
    expect(divContainer.classList.contains('slick-dark-mode')).toBeTruthy();
  });

  it('should change back to Light Mode by using "setOptions" when triggered with "onSetOptions" event', () => {
    component.gridOptions = { darkMode: true };
    component.initialization(divContainer, slickEventHandler);
    mockGrid.onSetOptions.notify({ optionsBefore: { darkMode: true }, optionsAfter: { darkMode: false }, grid: mockGrid });

    expect(component.eventHandler).toEqual(slickEventHandler);
    expect(divContainer.classList.contains('slick-dark-mode')).toBeFalsy();
  });

  it('should create a grid and expect multiple event published', () => {
    const pubSubSpy = vi.spyOn(eventPubSubService, 'publish');

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
      { id: 'firstName', field: 'firstName', editor: undefined, editorClass: {} },
      { id: 'lastName', field: 'lastName', editor: undefined, editorClass: {} }
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
      vi.clearAllMocks();
    });

    it('should initialize the grid with a fixed height when provided in the grid options', () => {
      const fixedHeight = 100;
      const resizerSpy = vi.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridHeight: fixedHeight };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: fixedHeight, width: undefined });
    });

    it('should initialize the grid with a fixed height when provided in the grid options', () => {
      const fixedHeight = 100;
      const resizerSpy = vi.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridHeight: fixedHeight };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: fixedHeight, width: undefined });
    });

    it('should initialize the grid with a fixed width when provided in the grid options', () => {
      const fixedWidth = 255;
      const resizerSpy = vi.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { gridWidth: fixedWidth };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith(0, { height: undefined, width: fixedWidth });
    });

    it('should initialize the grid with autoResize enabled and without height/width then expect a "gridResize" to be called for auto-resizing', () => {
      const resizerSpy = vi.spyOn(resizerServiceStub, 'resizeGrid');

      component.gridOptions = { enableAutoResize: true };
      component.initialization(divContainer, slickEventHandler);

      expect(resizerSpy).toHaveBeenCalledWith();
    });

    describe('autoAddCustomEditorFormatter grid option', () => {
      it('should initialize the grid and automatically add custom Editor Formatter when provided in the grid options', () => {
        component.gridOptions = { autoAddCustomEditorFormatter: customEditableInputFormatter };
        component.initialization(divContainer, slickEventHandler);

        expect(autoAddEditorFormatterToColumnsWithEditor).toHaveBeenCalledWith([{ id: 'name', field: 'name', editor: undefined }], customEditableInputFormatter);
      });
    });

    describe('columns definitions changed', () => {
      it('should expect "translateColumnHeaders" being called when "enableTranslate" is set', () => {
        const translateSpy = vi.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const autosizeSpy = vi.spyOn(mockGrid, 'autosizeColumns');
        const updateSpy = vi.spyOn(component, 'updateColumnDefinitionsList');
        const eventSpy = vi.spyOn(eventPubSubService, 'publish');
        const addPubSubSpy = vi.spyOn(component.translaterService as TranslaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined }];

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
        const translateSpy = vi.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const autosizeSpy = vi.spyOn(mockGrid, 'autosizeColumns');
        const updateSpy = vi.spyOn(component, 'updateColumnDefinitionsList');
        const renderSpy = vi.spyOn(extensionServiceStub, 'renderColumnHeaders');
        const eventSpy = vi.spyOn(eventPubSubService, 'publish');
        const addPubSubSpy = vi.spyOn(component.translaterService as TranslaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined }];

        component.gridOptions = { enableTranslate: false, autoAddCustomEditorFormatter: customEditableInputFormatter };
        component.columnDefinitions = mockColDefs;
        component.initialization(divContainer, slickEventHandler);

        expect(translateSpy).not.toHaveBeenCalled();
        expect(autosizeSpy).toHaveBeenCalled();
        expect(addPubSubSpy).not.toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledTimes(4);
        expect(updateSpy).toHaveBeenCalledWith(mockColDefs);
        expect(renderSpy).toHaveBeenCalledWith(mockColDefs, true);
        expect(autoAddEditorFormatterToColumnsWithEditor).toHaveBeenCalledWith([{ id: 'name', field: 'name', editor: undefined }], customEditableInputFormatter);
      });
    });

    describe('dataset changed', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should expect "autosizeColumns" being called when "autoFitColumnsOnFirstLoad" is set we udpated the dataset', () => {
        const autosizeSpy = vi.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true };
        component.initialization(divContainer, slickEventHandler);
        component.setData(mockData, true); // manually force an autoresize

        expect(autosizeSpy).toHaveBeenCalledTimes(2); // 1x by datasetChanged and 1x by bindResizeHook
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "autosizeColumns" being called when "autoFitColumnsOnFirstLoad" is set and we are on first page load', () => {
        const autosizeSpy = vi.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(autosizeSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "autosizeColumns" NOT being called when "autoFitColumnsOnFirstLoad" is not set and we are on first page load', () => {
        const autosizeSpy = vi.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: false };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(autosizeSpy).not.toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "resizeColumnsByCellContent" being called when "enableAutoResizeColumnsByCellContent" is set and we changing column definitions via its SETTER', () => {
        const resizeContentSpy = vi.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collection: ['male', 'female'] } }] as Column[];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.columnDefinitions = mockColDefs;
        component.gridOptions = { autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, autosizeColumnsByCellContentOnFirstLoad: true, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;
        component.columnDefinitions = mockColDefs;

        expect(resizeContentSpy).toHaveBeenCalledTimes(1);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should throw an error if we try to enable both auto resize type at same time with "autoFitColumnsOnFirstLoad" and "autosizeColumnsByCellContentOnFirstLoad"', () => new Promise((done: any) => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { autoFitColumnsOnFirstLoad: true, autosizeColumnsByCellContentOnFirstLoad: true };

        try {
          component.initialization(divContainer, slickEventHandler);
          component.dataset = mockData;
        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use.');
          component.dispose();
          done();
        }
      }));

      it('should throw an error if we try to enable both auto resize type at same time with "enableAutoSizeColumns" and "enableAutoResizeColumnsByCellContent"', () => new Promise((done: any) => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getLength').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(mockData.length);

        component.gridOptions = { enableAutoSizeColumns: true, enableAutoResizeColumnsByCellContent: true };

        try {
          component.initialization(divContainer, slickEventHandler);
          component.dataset = mockData;
        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use.');
          component.dispose();
          done();
        }
      }));
    });

    describe('options changed', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
        sharedService.gridOptions = gridOptions;
      });

      afterEach(() => {
        mockGrid.getOptions = vi.fn();
        vi.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
      });

      it('should merge grid options with global options when slickgrid "getOptions" does not exist yet', () => {
        mockGrid.getOptions = () => null as any;
        const setOptionSpy = vi.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockGridOptions = { autoCommitEdit: false, autoResize: null as any };

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        // expect(component.gridOptions.autoResize.bottomPadding).toEqual(50 + DATAGRID_FOOTER_HEIGHT); // calculated by the lib
        expect(setOptionSpy).toHaveBeenCalledWith(mockGridOptions, false, true);
        expect(sharedOptionSpy).toHaveBeenCalledWith(mockGridOptions);
      });

      it('should merge grid options with global options and expect bottom padding to be calculated', () => {
        mockGrid.getOptions = () => null as any;
        const setOptionSpy = vi.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const mockGridOptions = { autoCommitEdit: false, autoResize: null as any };

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        expect(setOptionSpy).toHaveBeenCalledWith(mockGridOptions, false, true);
        expect(sharedOptionSpy).toHaveBeenCalledWith(mockGridOptions);
      });

      it('should merge paginationOptions when some already exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [] };
        const paginationSrvSpy = vi.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual({ ...mockPagination, totalItems: 0 });
        expect(paginationSrvSpy).toHaveBeenCalledWith(0, true);
      });

      it('should set brand new paginationOptions when none previously exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [], totalItems: 1 };
        const paginationSrvSpy = vi.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = undefined;
        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual(mockPagination);
        expect(paginationSrvSpy).toHaveBeenNthCalledWith(2, 1, true);
      });
    });

    describe('with editors', () => {
      it('should display a console error when any of the column definition ids include a dot notation', () => {
        const consoleSpy = vi.spyOn(global.console, 'error').mockReturnValue();
        const mockColDefs = [{ id: 'user.gender', field: 'user.gender', editor: { model: Editors.text, collection: ['male', 'female'] } }] as Column[];

        component.columnDefinitions = mockColDefs;

        expect(consoleSpy).toHaveBeenCalledWith('[Slickgrid-Universal] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".');
      });

      it('should be able to load async editors with a regular Promise', async () => {
        const mockCollection = ['male', 'female'];
        const promise = Promise.resolve(mockCollection);
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];

        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
        expect(component.columnDefinitions[0].editor!.model).toEqual(Editors.text);
      });

      it('should be able to load collectionAsync and expect Editor to be destroyed and re-render when receiving new collection from await', async () => {
        const mockCollection = ['male', 'female'];
        const promise = Promise.resolve(mockCollection);
        const mockEditor = {
          disable: vi.fn(),
          destroy: vi.fn(),
          renderDomElement: vi.fn(),
        } as unknown as Editor;
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];
        vi.spyOn(mockGrid, 'getCellEditor').mockReturnValue(mockEditor);
        const disableSpy = vi.spyOn(mockEditor, 'disable');
        const destroySpy = vi.spyOn(mockEditor, 'destroy');
        const renderSpy = vi.spyOn(mockEditor, 'renderDomElement');

        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
        expect(component.columnDefinitions[0].editor!.model).toEqual(Editors.text);
        expect(disableSpy).toHaveBeenCalledWith(false);
        expect(destroySpy).toHaveBeenCalled();
        expect(renderSpy).toHaveBeenCalledWith(mockCollection);
      });

      it('should be able to load async editors with as a Promise with content to simulate http-client', async () => {
        const mockCollection = ['male', 'female'];
        const promise = Promise.resolve({ content: mockCollection });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];

        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
        expect(component.columnDefinitions[0].editor!.model).toEqual(Editors.text);
      });

      it('should be able to load async editors with a Fetch Promise', async () => {
        const mockCollection = ['male', 'female'];
        http.status = 200;
        http.object = mockCollection;
        http.returnKey = 'date';
        http.returnValue = '6/24/1984';
        http.responseHeaders = { accept: 'json' };
        const collectionAsync = http.fetch('http://locahost/api', { method: 'GET' });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync } }] as Column[];

        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
        expect(component.columnDefinitions[0].editor!.model).toEqual(Editors.text);
      });

      it('should be able to load async editors with an Observable', () => {
        const mockCollection = ['male', 'female'];
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: of(mockCollection) } }] as Column[];

        const rxjsMock = new RxJsResourceStub();
        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.registerExternalResources([rxjsMock], true);
        component.columnDefinitions = mockColDefs;
        component.initialization(divContainer, slickEventHandler);

        vi.advanceTimersByTime(5);
        expect(component.columnDefinitions[0].editor!.collection).toEqual(mockCollection);
        expect(component.columnDefinitions[0].editor!.model).toEqual(Editors.text);
        expect(component.columnDefinitions[0].editorClass).toEqual(Editors.text);
      });

      it('should throw an error when Fetch Promise response bodyUsed is true', async () => {
        const consoleSpy = vi.spyOn(global.console, 'warn').mockReturnValue();
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

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(consoleSpy).toHaveBeenCalledWith(expect.toInclude('[SlickGrid-Universal] The response body passed to collectionAsync was already read.'));
      });
    });

    describe('use grouping', () => {
      it('should load groupItemMetaProvider to the DataView when using "draggableGrouping" feature', () => {
        const sharedMetaSpy = vi.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');
        vi.spyOn(extensionServiceStub, 'extensionList', 'get').mockReturnValue({ draggableGrouping: { pluginName: 'DraggableGrouping' } } as unknown as ExtensionList<any>);

        component.gridOptions = { draggableGrouping: {} };
        component.initialization(divContainer, slickEventHandler);
        const extensions = component.extensions as ExtensionList<any>;

        expect(Object.keys(extensions).length).toBe(1);
        expect(SlickDataView).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() }, eventPubSubService);
        expect(sharedService.groupItemMetadataProvider instanceof SlickGroupItemMetadataProvider).toBeTruthy();
        expect(sharedMetaSpy).toHaveBeenCalledWith(expect.any(Object));
        expect(mockGrid.registerPlugin).toHaveBeenCalled();

        component.dispose();
      });

      it('should load groupItemMetaProvider to the DataView when using "enableGrouping" feature', () => {
        const sharedMetaSpy = vi.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');

        component.gridOptions = { enableGrouping: true };
        component.initialization(divContainer, slickEventHandler);

        expect(SlickDataView).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() }, eventPubSubService);
        expect(sharedMetaSpy).toHaveBeenCalledWith(expect.any(Object));
        expect(sharedService.groupItemMetadataProvider instanceof SlickGroupItemMetadataProvider).toBeTruthy();
        expect(mockGrid.registerPlugin).toHaveBeenCalled();

        component.dispose();
      });
    });

    describe('dataView options', () => {
      afterEach(() => {
        component.dispose();
        vi.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should call the onDataviewCreated emitter', () => {
        const spy = vi.spyOn(eventPubSubService, 'publish');

        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenNthCalledWith(2, 'onDataviewCreated', expect.any(Object));
      });

      it('should call the "executeAfterDataviewCreated" and "loadGridSorters" methods and Sorter Presets are provided in the Grid Options', () => {
        const globalEaSpy = vi.spyOn(eventPubSubService, 'publish');
        const sortSpy = vi.spyOn(sortServiceStub, 'loadGridSorters');

        component.gridOptions = { presets: { sorters: [{ columnId: 'field1', direction: 'DESC' }] } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(globalEaSpy).toHaveBeenNthCalledWith(3, 'onGridCreated', expect.any(Object));
        expect(sortSpy).toHaveBeenCalled();
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as True when the "dataView.syncGridSelection" grid option is enabled', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: true }, enableRowSelection: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as False when the "dataView.syncGridSelection" grid option is disabled', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: false }, enableRowSelection: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with 3 arguments when the "dataView" grid option is provided as an object', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          dataView: { syncGridSelection: { preserveHidden: true, preserveHiddenOnSelectionChange: false } },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true, false);
      });

      it('should call the DataView "syncGridSelection" method when using BackendServiceApi and "syncGridSelectionWithBackendService" when the "dataView.syncGridSelection" grid option is enabled as well', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
          dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" BUT the "dataView.syncGridSelection" grid option is disabled', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
          dataView: { syncGridSelection: false, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" disabled and the "dataView.syncGridSelection" grid option is enabled', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const syncSpy = vi.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
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
        vi.clearAllMocks();
        component.dispose();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is disabled', () => {
        const spy = vi.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        // @ts-ignore
        expect(spy).toHaveBeenCalledWith(mockGrid, container);
      });

      it('should call "translateColumnHeaders" from ExtensionService when "enableTranslate" is set', () => {
        const spy = vi.spyOn(extensionServiceStub, 'translateColumnHeaders');

        component.gridOptions = { enableTranslate: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalled();
      });

      it('should add RxJS resource to all necessary Services when RxJS external resource is registered', () => {
        const rxjsMock = new RxJsResourceStub();
        const backendUtilitySpy = vi.spyOn(backendUtilityServiceStub, 'addRxJsResource');
        const filterServiceSpy = vi.spyOn(filterServiceStub, 'addRxJsResource');
        const sortServiceSpy = vi.spyOn(sortServiceStub, 'addRxJsResource');
        const paginationServiceSpy = vi.spyOn(paginationServiceStub, 'addRxJsResource');

        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.resetExternalResources();
        component.registerExternalResources([rxjsMock], true);
        component.initialization(divContainer, slickEventHandler);

        expect(backendUtilitySpy).toHaveBeenCalled();
        expect(filterServiceSpy).toHaveBeenCalled();
        expect(sortServiceSpy).toHaveBeenCalled();
        expect(paginationServiceSpy).toHaveBeenCalled();
        expect(component.registeredResources.length).toBe(4); // RxJsResourceStub, GridService, GridStateService, SlickEmptyCompositeEditorComponent
        expect(component.registeredResources[0] instanceof RxJsResourceStub).toBe(true);
      });

      it('should destroy customElement and its DOM element when requested', () => {
        const spy = vi.spyOn(component, 'emptyGridContainerElm');

        component.initialization(divContainer, slickEventHandler);
        component.dispose(true);

        expect(spy).toHaveBeenCalledWith();
      });

      it('should bind local filter when "enableFiltering" is set', () => {
        const bindLocalSpy = vi.spyOn(filterServiceStub, 'bindLocalOnFilter');

        component.gridOptions = { enableFiltering: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should bind local sort when "enableSorting" is set', () => {
        const bindLocalSpy = vi.spyOn(sortServiceStub, 'bindLocalOnSort');

        component.gridOptions = { enableSorting: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should refresh a local grid and change pagination options pagination when a preset for it is defined in grid options', () => {
        const expectedPageNumber = 2;
        const expectedTotalItems = 2;
        const refreshSpy = vi.spyOn(component, 'refreshGridData');

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        vi.spyOn(mockDataView, 'getItems').mockReturnValueOnce(mockData);
        component.gridOptions = {
          enablePagination: true,
          presets: { pagination: { pageSize: 2, pageNumber: expectedPageNumber } }
        };
        component.paginationOptions = undefined;
        component.paginationOptions = { pageSize: 2, pageNumber: 2, pageSizes: [2, 10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        vi.advanceTimersByTime(5);
        expect(component.paginationOptions!.pageSize).toBe(2);
        expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
        expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should refresh a local grid defined and change pagination options pagination when a preset is defined in grid options and total rows is different when Filters are applied', () => {
        const expectedPageNumber = 3;
        const expectedTotalItems = 15;
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const getPagingSpy = vi.spyOn(mockDataView, 'getPagingInfo').mockReturnValue({ pageNum: 1, totalRows: expectedTotalItems, pageSize: 10, totalPages: 15, dataView: mockDataView });

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions = {
          enableFiltering: true,
          enablePagination: true,
          presets: { pagination: { pageSize: 10, pageNumber: expectedPageNumber } }
        };
        component.paginationOptions = { pageSize: 10, pageNumber: 2, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        vi.advanceTimersByTime(5);
        expect(getPagingSpy).toHaveBeenCalled();
        expect(component.paginationOptions!.pageSize).toBe(10);
        expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
        expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });
    });

    describe('Backend Service API', () => {
      beforeEach(() => {
        component.gridOptions = {
          backendServiceApi: {
            disableInternalPostProcess: false,
            onInit: vi.fn(),
            service: mockGraphqlService as any,
            preProcess: vi.fn(),
            postProcess: vi.fn(),
            process: vi.fn(),
          }
        };
      });

      afterEach(() => {
        vi.clearAllMocks();
        mockGraphqlService.options = undefined;
      });

      it('should call the "createBackendApiInternalPostProcessCallback" method when Backend Service API is defined with a Graphql Service', () => {
        const spy = vi.spyOn(component, 'createBackendApiInternalPostProcessCallback');

        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should NOT call the "createBackendApiInternalPostProcessCallback" method when Backend Service API is defined with a Graphql Service with "disableInternalPostProcess"', () => {
        const spy = vi.spyOn(component, 'createBackendApiInternalPostProcessCallback');

        component.gridOptions.backendServiceApi!.disableInternalPostProcess = true;
        component.initialization(divContainer, slickEventHandler);

        expect(spy).not.toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toBeUndefined();
      });

      it('should execute the "internalPostProcess" callback method that was created by "createBackendApiInternalPostProcessCallback" with Pagination', () => {
        const getDataNameSpy = vi.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName');
        (getDataNameSpy as Mock).mockReturnValue('users');
        const spy = vi.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { users: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback and expect totalItems to be updated in the PaginationService when "refreshGridData" is called on the 2nd time', () => {
        const getDataNameSpy = vi.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName');
        (getDataNameSpy as Mock).mockReturnValue('users');
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const paginationSpy = vi.spyOn(paginationServiceStub, 'totalItems', 'set');
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
        const getDataNameSpy = vi.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName');
        (getDataNameSpy as Mock).mockReturnValue('users');
        const spy = vi.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { users: [{ firstName: 'John' }] } });

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi!.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method but return an empty dataset when dataset name does not match "getDatasetName"', () => {
        component.gridOptions.enablePagination = true;
        const getDataNameSpy = vi.spyOn(component.gridOptions.backendServiceApi!.service, 'getDatasetName');
        (getDataNameSpy as Mock).mockReturnValue('users');
        const spy = vi.spyOn(component, 'refreshGridData');

        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi!.internalPostProcess!({ data: { notUsers: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).not.toHaveBeenCalled();
        expect(component.dataset).toEqual([]);
      });

      it('should invoke "updateFilters" method with filters returned from "getColumnFilters" of the Filter Service when there is no Presets defined', () => {
        const mockColumnFilter = { name: { columnId: 'name', columnDef: { id: 'name', field: 'name', filter: { model: Filters.autocompleter } }, operator: 'EQ', searchTerms: ['john'] } };
        vi.spyOn(filterServiceStub, 'getColumnFilters').mockReturnValue(mockColumnFilter as unknown as ColumnFilters);
        const backendSpy = vi.spyOn(mockGraphqlService, 'updateFilters');
        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
        } as unknown as GridOption;

        component.gridOptions.presets = undefined;
        component.initialization(divContainer, slickEventHandler);

        expect(backendSpy).toHaveBeenCalledWith(mockColumnFilter as unknown as CurrentFilter[], false);
      });

      it('should override frozen grid options when "pinning" is defined in the "presets" property', () => {
        const pinningMock = { frozenBottom: false, frozenColumn: -1, frozenRow: -1 } as CurrentPinning;
        const gridOptionSetterSpy = vi.spyOn(component, 'gridOptions', 'set');

        component.gridOptions.presets = { pinning: pinningMock };
        component.initialization(divContainer, slickEventHandler);

        expect(gridOptionSetterSpy).toHaveBeenCalledWith({ ...component.gridOptions, ...pinningMock });
        expect(component.gridOptions).toEqual({ ...component.gridOptions, ...pinningMock });
      });

      it('should call the "updateFilters" method when filters are defined in the "presets" property', () => {
        const spy = vi.spyOn(mockGraphqlService, 'updateFilters');
        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
        } as unknown as GridOption;
        const mockFilters = [{ columnId: 'company', searchTerms: ['xyz'], operator: 'IN' }] as CurrentFilter[];
        component.gridOptions.presets = { filters: mockFilters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(mockFilters, true);
      });

      it('should call the "updateSorters" method when sorters are defined in the "presets" property with multi-column sort enabled', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const spy = vi.spyOn(mockGraphqlService, 'updateSorters');
        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
        } as unknown as GridOption;
        const mockSorters = [{ columnId: 'firstName', direction: 'asc' }, { columnId: 'lastName', direction: 'desc' }] as CurrentSorter[];

        component.gridOptions.presets = { sorters: mockSorters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(undefined, mockSorters);
      });

      it('should call the "updateSorters" method with ONLY 1 column sort when multi-column sort is disabled and user provided multiple sorters in the "presets" property', () => {
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        const spy = vi.spyOn(mockGraphqlService, 'updateSorters');
        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
        } as unknown as GridOption;
        const mockSorters = [{ columnId: 'firstName', direction: 'asc' }, { columnId: 'lastName', direction: 'desc' }] as CurrentSorter[];

        component.gridOptions.multiColumnSort = false;
        component.gridOptions.presets = { sorters: mockSorters };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(undefined, [mockSorters[0]]);
      });

      it('should call the "updatePagination" method when filters are defined in the "presets" property', () => {
        const spy = vi.spyOn(mockGraphqlService, 'updatePagination');
        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: vi.fn(),
          },
        } as unknown as GridOption;

        component.gridOptions.presets = { pagination: { pageNumber: 2, pageSize: 20 } };
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalledWith(2, 20);
      });

      it('should refresh the grid and change pagination options pagination when a preset for it is defined in grid options', () => {
        const expectedPageNumber = 3;
        const refreshSpy = vi.spyOn(component, 'refreshGridData');

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

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options with a Promise and Pagination enabled', async () => {
        const now = new Date();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const promise = new Promise(resolve => setTimeout(() => resolve(processResult), 1));
        const processSpy = vi.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        vi.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = vi.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(backendExecuteSpy).toHaveBeenCalledWith(expect.any(Date), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options with an Observable and Pagination enabled', () => {
        const now = new Date();
        const rxjsMock = new RxJsResourceStub();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const processSpy = vi.spyOn((component.gridOptions as GridOption).backendServiceApi as BackendServiceApi, 'process').mockReturnValue(of(processResult));
        vi.spyOn((component.gridOptions as GridOption).backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = vi.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.externalResources = [rxjsMock];
        component.registerExternalResources([rxjsMock], true);
        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        vi.advanceTimersByTime(5);
        expect(backendExecuteSpy).toHaveBeenCalledWith(expect.any(Date), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options without Pagination (when disabled)', async () => {
        const now = new Date();
        const query = `query { users { id,name,gender,company } }`;
        const processResult = {
          data: { users: [] },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const promise = new Promise(resolve => setTimeout(() => resolve(processResult), 1));
        const processSpy = vi.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        vi.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendExecuteSpy = vi.spyOn(backendUtilityServiceStub, 'executeBackendProcessesCallback');

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        vi.advanceTimersByTime(5);
        await new Promise(process.nextTick);

        expect(backendExecuteSpy).toHaveBeenCalledWith(expect.any(Date), processResult, component.gridOptions.backendServiceApi as BackendServiceApi, 0);
      });

      it('should throw an error when the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options', () => {
        const mockError = { error: '404' };
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const promise = new Promise((_resolve, reject) => setTimeout(() => reject(mockError), 1));
        const processSpy = vi.spyOn(component.gridOptions.backendServiceApi as BackendServiceApi, 'process').mockReturnValue(promise);
        vi.spyOn(component.gridOptions.backendServiceApi!.service, 'buildQuery').mockReturnValue(query);

        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        promise.catch((e) => {
          expect(e).toEqual(mockError);
        });
      });

      it('should throw an error when the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options from an Observable', () => {
        const mockError = { error: '404' };
        const rxjsMock = new RxJsResourceStub();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processSpy = vi.spyOn((component.gridOptions as GridOption).backendServiceApi as BackendServiceApi, 'process').mockReturnValue(throwError(mockError));
        vi.spyOn((component.gridOptions as GridOption).backendServiceApi!.service, 'buildQuery').mockReturnValue(query);
        const backendErrorSpy = vi.spyOn(backendUtilityServiceStub, 'onBackendError');

        component.gridOptions.externalResources = [rxjsMock];
        component.registerExternalResources([rxjsMock], true);
        component.gridOptions.backendServiceApi!.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer, slickEventHandler);

        expect(processSpy).toHaveBeenCalled();

        vi.advanceTimersByTime(5);
        expect(backendErrorSpy).toHaveBeenCalledWith(mockError, component.gridOptions.backendServiceApi);
      });

      it('should call "onScrollEnd" when defined and call backend util setInfiniteScrollBottomHit(true) when we still have more pages in the dataset', () => {
        const gotoSpy = vi.spyOn(component.paginationService, 'goToNextPage').mockResolvedValueOnce(true);
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi?.onScrollEnd!();

        expect(gotoSpy).toHaveBeenCalled();
        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(true);
        component.gridOptions.backendServiceApi!.service.options.infiniteScroll = false;

        vi.advanceTimersByTime(5);
        expect(component.backendUtilityService.setInfiniteScrollBottomHit).not.toHaveBeenCalledWith(false);
      });

      it('should execute original "postProcess" when calling the same method when Infinite Scroll is enabled', () => {
        const orgPostProcess = component.gridOptions.backendServiceApi!.postProcess;
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi?.postProcess!({ infiniteScrollBottomHit: true, query: '', value: [] });

        expect(orgPostProcess).toHaveBeenCalled();
      });

      it('should call "onScrollEnd" when defined and call backend util setInfiniteScrollBottomHit(false) when we no longer have more pages', async () => {
        const gotoSpy = vi.spyOn(component.paginationService, 'goToNextPage').mockResolvedValueOnce(false);
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        component.gridOptions.backendServiceApi?.onScrollEnd!();

        expect(gotoSpy).toHaveBeenCalled();
        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(true);
        component.gridOptions.backendServiceApi!.service.options.infiniteScroll = false;

        vi.advanceTimersByTime(0);
        await new Promise(process.nextTick);

        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(false);
      });

      it('should throw an error if we try to set a "presets.pagination" with Infinite Scroll', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockReturnValue();
        mockGraphqlService.options = { datasetName: 'users', infiniteScroll: true };
        const backendServiceApi = {
          service: mockGraphqlService,
          process: vi.fn(),
        };

        gridOptions = {
          enablePagination: true,
          backendServiceApi,
          presets: { pagination: { pageNumber: 2 } },
          pagination: { pageSizes: [10, 20], pageSize: 10 }
        } as unknown as GridOption;
        vi.spyOn(component.slickGrid!, 'getOptions').mockReturnValue(gridOptions);
        component.gridOptions = gridOptions;

        component.initialization(divContainer, slickEventHandler);
        component.refreshGridData([]);

        expect(consoleSpy).toHaveBeenCalledWith('[Slickgrid-Universal] `presets.pagination` is not supported with Infinite Scroll, reverting to first page.');
      });

      it('should execute onScrollEnd callback when SlickGrid onScroll is triggered with a "mousewheel" event', () => {
        vi.spyOn(component.paginationService, 'goToNextPage').mockResolvedValueOnce(false);
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        vi.spyOn(paginationServiceStub, 'totalItems', 'get').mockReturnValue(100);
        const mouseEvent = addVanillaEventPropagation(new Event('scroll'));
        mockGrid.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: mockGrid, triggeredBy: 'mousewheel' }, mouseEvent, mockGrid);

        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(true);
      });

      it('should execute onScrollEnd callback when SlickGrid onScroll is triggered with a "scroll" event', () => {
        vi.spyOn(component.paginationService, 'goToNextPage').mockResolvedValueOnce(false);
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        vi.spyOn(paginationServiceStub, 'totalItems', 'get').mockReturnValue(100);
        const scrollEvent = addVanillaEventPropagation(new Event('scroll'));
        mockGrid.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: mockGrid, triggeredBy: 'scroll' }, scrollEvent, mockGrid);

        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(true);
      });

      it('should NOT execute onScrollEnd callback when SlickGrid onScroll is triggered with an event that is NOT "mousewheel" neither "scroll"', () => {
        vi.spyOn(component.paginationService, 'goToNextPage').mockResolvedValueOnce(false);
        component.gridOptions.backendServiceApi!.service.options = { infiniteScroll: true };
        component.initialization(divContainer, slickEventHandler);
        vi.spyOn(paginationServiceStub, 'totalItems', 'get').mockReturnValue(100);
        const clickEvent = addVanillaEventPropagation(new Event('click'));
        mockGrid.onScroll.notify({ scrollHeight: 10, scrollTop: 10, scrollLeft: 15, grid: mockGrid, triggeredBy: 'scroll' }, clickEvent, mockGrid);

        expect(component.backendUtilityService.setInfiniteScrollBottomHit).toHaveBeenCalledWith(true);
      });
    });

    describe('bindDifferentHooks private method called by "attached"', () => {
      beforeEach(() => {
        component.columnDefinitions = [{ id: 'firstName', field: 'firstName' }];
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should call multiple translate methods when locale changes', () => {
        const transExtensionSpy = vi.spyOn(extensionServiceStub, 'translateAllExtensions');
        const transGroupingColSpanSpy = vi.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');
        const setHeaderRowSpy = vi.spyOn(mockGrid, 'setHeaderRowVisibility');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: false, enableDraggableGrouping: false, showCustomFooter: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', { language: 'fr' });

        vi.advanceTimersByTime(5);
        expect(setHeaderRowSpy).not.toHaveBeenCalled();
        expect(transGroupingColSpanSpy).not.toHaveBeenCalled();
        expect(transExtensionSpy).toHaveBeenCalled();
      });

      it('should call "setHeaderRowVisibility", "translateGroupingAndColSpan" and other methods when locale changes', () => {
        component.columnDefinitions = [{ id: 'firstName', field: 'firstName', filterable: true }];
        const transExtensionSpy = vi.spyOn(extensionServiceStub, 'translateAllExtensions');
        const transGroupingColSpanSpy = vi.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', {});

        vi.advanceTimersByTime(5);
        expect(transGroupingColSpanSpy).toHaveBeenCalled();
        expect(transExtensionSpy).toHaveBeenCalled();
      });

      it('should call "translateGroupingAndColSpan" translate methods when locale changes and Column Grouping PreHeader are enabled', () => {
        const groupColSpanSpy = vi.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        eventPubSubService.publish('onLanguageChange', {});

        vi.advanceTimersByTime(5);
        expect(groupColSpanSpy).toHaveBeenCalled();
      });

      it('should reflect columns in the grid', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCols = [{ id: 'firstName', field: 'firstName' }];
        const getAssocColSpy = vi.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue(mockCols);
        const setColSpy = vi.spyOn(mockGrid, 'setColumns');

        component.gridOptions = { presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra checkbox selection column in the grid when "enableCheckboxSelector" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_checkbox_selector', field: '_checkbox_selector', editor: undefined }, mockCol];
        const getAssocColSpy = vi.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = vi.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { enableCheckboxSelector: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra row detail column in the grid when "enableRowDetailView" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_detail_selector', field: '_detail_selector', editor: undefined }, mockCol];
        const getAssocColSpy = vi.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = vi.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { ...gridOptions, enableRowDetailView: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should reflect columns with an extra row move column in the grid when "enableRowMoveManager" is set', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCol = { id: 'firstName', field: 'firstName' };
        const mockCols = [{ id: '_move', field: '_move', editor: undefined }, mockCol];
        const getAssocColSpy = vi.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = vi.spyOn(mockGrid, 'setColumns');

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
          { id: '_move', field: '_move', editor: undefined },
          { id: '_checkbox_selector', field: '_checkbox_selector', editor: undefined },
          { id: '_detail_selector', field: '_detail_selector', editor: undefined },
          mockCol
        ];
        const getAssocColSpy = vi.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue([mockCol]);
        const setColSpy = vi.spyOn(mockGrid, 'setColumns');

        component.columnDefinitions = mockCols;
        component.gridOptions = { ...gridOptions, enableCheckboxSelector: true, enableRowDetailView: true, enableRowMoveManager: true, presets: { columns: mockColsPresets } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(getAssocColSpy).toHaveBeenCalledWith(mockGrid, mockColsPresets);
        expect(setColSpy).toHaveBeenCalledWith(mockCols);
      });

      it('should execute backend service "init" method when set', () => {
        const mockPagination = { pageNumber: 1, pageSizes: [10, 25, 50], pageSize: 10, totalItems: 100 };
        const mockGraphqlOptions = { datasetName: 'users', extraQueryArguments: [{ field: 'userId', value: 123 }] } as GraphqlServiceOption;
        const bindBackendSpy = vi.spyOn(sortServiceStub, 'bindBackendOnSort');
        const mockGraphqlService2 = { ...mockGraphqlService, init: vi.fn() } as unknown as GraphqlService;
        const initSpy = vi.spyOn(mockGraphqlService2, 'init');

        component.gridOptions = {
          // enablePagination: true,
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService2,
            options: mockGraphqlOptions,
            preProcess: () => vi.fn(),
            process: () => Promise.resolve({ data: { users: { nodes: [], totalCount: 100 } } }),
          } as GraphqlServiceApi,
          pagination: mockPagination,
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(initSpy).toHaveBeenCalledWith(mockGraphqlOptions, mockPagination, mockGrid, sharedService);
      });

      it('should call bind backend sorting when "enableSorting" is set', () => {
        const bindBackendSpy = vi.spyOn(sortServiceStub, 'bindBackendOnSort');

        component.gridOptions = {
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService,
            preProcess: () => vi.fn(),
            process: () => Promise.resolve('process resolved'),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should call bind local sorting when "enableSorting" is set and "useLocalSorting" is set as well', () => {
        const bindLocalSpy = vi.spyOn(sortServiceStub, 'bindLocalOnSort');

        component.gridOptions = {
          enableSorting: true,
          backendServiceApi: {
            service: mockGraphqlService,
            useLocalSorting: true,
            preProcess: () => vi.fn(),
            process: () => Promise.resolve('process resolved'),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should call bind backend filtering when "enableFiltering" is set', () => {
        const initSpy = vi.spyOn(filterServiceStub, 'init');
        const bindLocalSpy = vi.spyOn(filterServiceStub, 'bindLocalOnFilter');
        const populateSpy = vi.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).not.toHaveBeenCalled();
      });

      it('should call bind local filtering when "enableFiltering" is set and "useLocalFiltering" is set as well', () => {
        const bindLocalSpy = vi.spyOn(filterServiceStub, 'bindLocalOnFilter');

        component.gridOptions = {
          enableFiltering: true,
          backendServiceApi: {
            service: mockGraphqlService,
            useLocalFiltering: true,
            preProcess: () => vi.fn(),
            process: () => Promise.resolve('process resolved'),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should reflect column filters when "enableFiltering" is set', () => {
        const initSpy = vi.spyOn(filterServiceStub, 'init');
        const bindBackendSpy = vi.spyOn(filterServiceStub, 'bindBackendOnFilter');
        const populateSpy = vi.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = {
          enableFiltering: true,
          backendServiceApi: {
            service: mockGraphqlService,
            preProcess: () => vi.fn(),
            process: () => Promise.resolve('process resolved'),
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).not.toHaveBeenCalled();
      });

      it('should reflect column filters and populate filter search terms when "enableFiltering" is set and preset filters are defined', () => {
        const mockPresetFilters = [{ columnId: 'firstName', operator: 'IN', searchTerms: ['John', 'Jane'] }] as CurrentFilter[];
        const initSpy = vi.spyOn(filterServiceStub, 'init');
        const populateSpy = vi.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true, presets: { filters: mockPresetFilters } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).toHaveBeenCalledWith(mockPresetFilters);
      });

      it('should return null when "getItemMetadata" is called without a colspan callback defined', () => {
        const itemSpy = vi.spyOn(mockDataView, 'getItem');

        component.gridOptions = { colspanCallback: undefined } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).not.toHaveBeenCalled();
      });

      it('should execute colspan callback when defined in the grid options and "getItemMetadata" is called', () => {
        const mockCallback = vi.fn();
        const mockItem = { firstName: 'John', lastName: 'Doe' };
        const itemSpy = vi.spyOn(mockDataView, 'getItem').mockReturnValue(mockItem);

        component.gridOptions = { colspanCallback: mockCallback } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).toHaveBeenCalledWith(2);
        expect(mockCallback).toHaveBeenCalledWith(mockItem);
      });

      it('should update each row and re-render the grid when filtering and DataView "onRowsChanged" event is triggered', () => {
        const renderSpy = vi.spyOn(mockGrid, 'render');
        const updateRowSpy = vi.spyOn(mockGrid, 'updateRow');
        vi.spyOn(mockGrid, 'getRenderedRange').mockReturnValue({ bottom: 10, top: 0, leftPx: 0, rightPx: 890 });

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
        vi.clearAllMocks();
      });

      it('should show the header row when "showHeaderRow" is called with argument True', () => {
        const setHeaderRowSpy = vi.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = vi.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer, slickEventHandler);
        component.showHeaderRow(true);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(true);
        expect(setColumnSpy).toHaveBeenCalledTimes(1);
      });

      it('should show the header row when "showHeaderRow" is called with argument False', () => {
        const setHeaderRowSpy = vi.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = vi.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer, slickEventHandler);
        component.showHeaderRow(false);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(false);
        expect(setColumnSpy).not.toHaveBeenCalled();
      });
    });

    describe('pagination events', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should call trigger a gridStage change event when pagination change is triggered', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as Pagination;
        const pluginEaSpy = vi.spyOn(eventPubSubService, 'publish');
        vi.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

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
        const pluginEaSpy = vi.spyOn(eventPubSubService, 'publish');
        vi.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

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
        const pluginEaSpy = vi.spyOn(eventPubSubService, 'publish');
        const setRowSpy = vi.spyOn(mockGrid, 'setSelectedRows');
        vi.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

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
        const pluginEaSpy = vi.spyOn(eventPubSubService, 'publish');
        const setRowSpy = vi.spyOn(mockGrid, 'setSelectedRows');
        vi.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

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
      it('should display an Empty Warning Message when "enableEmptyDataWarningMessage" is enabled and the dataset is empty', () => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined }];
        const mockGridOptions = { enableTranslate: true, enableEmptyDataWarningMessage: true, };
        vi.spyOn(mockGrid, 'getOptions').mockReturnValue(mockGridOptions);
        vi.spyOn(mockGrid, 'getGridPosition').mockReturnValue({ top: 10, left: 20 } as any);

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        const emptySpy = vi.spyOn(component.slickEmptyWarning!, 'showEmptyDataMessage');
        component.columnDefinitions = mockColDefs;
        component.refreshGridData([]);
        mockDataView.onRowCountChanged.notify({ current: 0, previous: 0, dataView: mockDataView, itemCount: 0, callingOnRowsChanged: false });

        vi.advanceTimersByTime(5);
        expect(component.columnDefinitions).toEqual(mockColDefs);
        expect(component.gridOptions.enableEmptyDataWarningMessage).toBe(true);
        expect(component.slickEmptyWarning).toBeTruthy();
        expect(emptySpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('resizeColumnsByCellContent method', () => {
      it('should call "resizeColumnsByCellContent" when the DataView "onSetItemsCalled" event is triggered and "enableAutoResizeColumnsByCellContent" is set', () => {
        const resizeContentSpy = vi.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        vi.spyOn(mockDataView, 'getLength').mockReturnValue(1);

        component.gridOptions = { enablePagination: false, resizeByContentOnlyOnFirstLoad: false, showCustomFooter: true, autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 1 });

        expect(resizeContentSpy).toHaveBeenCalledWith(true);
      });

      it('should call "resizeColumnsByCellContent" when the DataView "onSetItemsCalled" event is triggered and "enableAutoResizeColumnsByCellContent" and "resizeColumnsByCellContent" are both set', () => {
        const resizeContentSpy = vi.spyOn(resizerServiceStub, 'resizeColumnsByCellContent');
        vi.spyOn(mockDataView, 'getLength').mockReturnValue(1);

        component.gridOptions = { enablePagination: false, resizeByContentOnlyOnFirstLoad: true, showCustomFooter: true, autoFitColumnsOnFirstLoad: false, enableAutoSizeColumns: false, enableAutoResizeColumnsByCellContent: true };
        component.initialization(divContainer, slickEventHandler);
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 1 });

        expect(resizeContentSpy).toHaveBeenCalledWith(false);
      });
    });

    describe('Custom Footer', () => {
      it('should have a Custom Footer when "showCustomFooter" is enabled and there are no Pagination used', () => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined }];
        const mockGridOptions = { enableTranslate: true, showCustomFooter: true, customFooterOptions: { hideRowSelectionCount: false, } } as GridOption;
        vi.spyOn(mockGrid, 'getOptions').mockReturnValue(mockGridOptions);

        translateService.use('fr');
        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        expect(component.columnDefinitions).toEqual(mockColDefs);
        expect(component.gridOptions.showCustomFooter).toBe(true);
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
      });

      it('should NOT have a Custom Footer when "showCustomFooter" is enabled WITH Pagination in use', () => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined }];

        component.gridOptions.enablePagination = true;
        component.gridOptions.showCustomFooter = true;
        component.initialization(divContainer, slickEventHandler);
        component.columnDefinitions = mockColDefs;

        vi.advanceTimersByTime(5);
        expect(component.columnDefinitions).toEqual(mockColDefs);
        expect(component.slickFooter).toBeUndefined();
      });

      it('should have custom footer with metrics when the DataView "onRowCountChanged" event is triggered', () => {
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const invalidateSpy = vi.spyOn(mockGrid, 'invalidate');
        const expectation = {
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          itemCount: 2,
          totalItemCount: 2
        };
        vi.spyOn(mockDataView, 'getItemCount').mockReturnValue(mockData.length);
        vi.spyOn(mockDataView, 'getFilteredItemCount').mockReturnValue(mockData.length);

        component.gridOptions = { enablePagination: false, showCustomFooter: true };
        component.initialization(divContainer, slickEventHandler);
        const footerSpy = vi.spyOn(component.slickFooter!, 'metrics', 'set');
        mockDataView.onRowCountChanged.notify({ current: 2, previous: 0, dataView: mockDataView, itemCount: 0, callingOnRowsChanged: false });

        expect(invalidateSpy).toHaveBeenCalled();
        expect(component.metrics).toEqual(expectation);
        expect(footerSpy).toHaveBeenCalledWith(expectation);
      });

      it('should have custom footer with metrics when the DataView "onSetItemsCalled" event is triggered', () => {
        const expectation = {
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          itemCount: 0,
          totalItemCount: 0
        };
        vi.spyOn(mockDataView, 'getFilteredItemCount').mockReturnValue(0);

        component.gridOptions = { enablePagination: false, showCustomFooter: true };
        component.initialization(divContainer, slickEventHandler);
        const footerSpy = vi.spyOn(component.slickFooter!, 'metrics', 'set');
        mockDataView.onSetItemsCalled.notify({ idProperty: 'id', itemCount: 0 });

        expect(component.metrics).toEqual(expectation);
        expect(footerSpy).toHaveBeenCalledWith(expectation);
      });
    });

    describe('loadRowSelectionPresetWhenExists method', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should call the "mapIdsToRows" from the DataView then "setSelectedRows" from the Grid when there are row selection presets with "dataContextIds" array set', () => {
        const selectedGridRows = [2];
        const selectedRowIds = [99];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const dataviewSpy = vi.spyOn(mockDataView, 'mapIdsToRows').mockReturnValue(selectedGridRows);
        const selectRowSpy = vi.spyOn(mockGrid, 'setSelectedRows');
        vi.spyOn(mockDataView, 'getLength').mockReturnValue(0);
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);

        component.gridOptions.enableCheckboxSelector = true;
        component.gridOptions.presets = { rowSelection: { dataContextIds: selectedRowIds } };
        component.isDatasetInitialized = false;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        vi.advanceTimersByTime(5);
        expect(dataviewSpy).toHaveBeenCalled();
        expect(selectRowSpy).toHaveBeenCalledWith(selectedGridRows);
      });

      it('should call the "setSelectedRows" from the Grid when there are row selection presets with "dataContextIds" array set', () => {
        const selectedGridRows = [22];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const selectRowSpy = vi.spyOn(mockGrid, 'setSelectedRows');
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        vi.spyOn(mockDataView, 'getLength').mockReturnValue(mockData.length);

        component.gridOptions.enableRowSelection = true;
        component.gridOptions.presets = { rowSelection: { gridRowIndexes: selectedGridRows } };
        component.dataset = mockData;
        component.isDatasetInitialized = false; // it won't call the preset unless we reset this flag
        component.initialization(divContainer, slickEventHandler);

        vi.advanceTimersByTime(5);
        expect(component.isDatasetInitialized).toBe(true);
        expect(selectRowSpy).toHaveBeenCalledWith(selectedGridRows);
      });

      it('should call the "setSelectedRows" and "setSelectedIds" when the Grid has Local Pagination and there are row selection presets with "dataContextIds" array set', () => {
        const selectedGridRows = [22];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const gridSelectedRowSpy = vi.spyOn(mockGrid, 'setSelectedRows');
        const dvSetSelectedIdSpy = vi.spyOn(mockDataView, 'setSelectedIds');
        vi.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true as any);
        vi.spyOn(mockDataView, 'getLength').mockReturnValue(mockData.length);

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
        vi.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should change "showPagination" flag when "onPaginationVisibilityChanged" from the Pagination Service is triggered', () => {
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = null as any;

        component.initialization(divContainer, slickEventHandler);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        const disposeSpy = vi.spyOn(component.slickPagination!, 'dispose');
        eventPubSubService.publish('onPaginationVisibilityChanged', { visible: false });

        expect(component.showPagination).toBeFalsy();
        expect(disposeSpy).toHaveBeenCalled();
      });

      it('should call the backend service API to refresh the dataset', () => {
        const backendRefreshSpy = vi.spyOn(backendUtilityServiceStub, 'refreshBackendDataset');
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = {
          service: mockGraphqlService as any,
          process: vi.fn(),
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
        vi.clearAllMocks();
      });

      it('should change flat dataset and expect "convertFlatParentChildToTreeDatasetAndSort" being called with other methods', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const treeConvertAndSortSpy = vi.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');

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

      it('should change flat dataset and expect "convertFlatParentChildToTreeDatasetAndSort" being called even without an initial sort defined', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const treeConvertAndSortSpy = vi.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.gridOptions = {
          enableTreeData: true, treeDataOptions: {
            columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files'
          }
        } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(refreshTreeSpy).toHaveBeenCalled();
        expect(treeConvertAndSortSpy).toHaveBeenCalled();
      });

      it('should change hierarchical dataset and expect processTreeDataInitialSort being called with other methods', () => {
        const mockHierarchical = [{ file: 'documents', files: [{ file: 'vacation.txt' }] }];
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const clearFilterSpy = vi.spyOn(filterServiceStub, 'clearFilters');
        const refreshFilterSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');
        const setItemsSpy = vi.spyOn(mockDataView, 'setItems');
        const processSpy = vi.spyOn(sortServiceStub, 'processTreeDataInitialSort');

        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file' } } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);
        component.datasetHierarchical = mockHierarchical;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(clearFilterSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        expect(setItemsSpy).toHaveBeenCalledWith([], 'id');

        vi.advanceTimersByTime(0);
        expect(refreshFilterSpy).toHaveBeenCalled();
      });

      it('should preset hierarchical dataset before the initialization and expect sortHierarchicalDataset to be called', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const clearFilterSpy = vi.spyOn(filterServiceStub, 'clearFilters');
        const setItemsSpy = vi.spyOn(mockDataView, 'setItems');
        const processSpy = vi.spyOn(sortServiceStub, 'processTreeDataInitialSort');
        const sortHierarchicalSpy = vi.spyOn(treeDataServiceStub, 'sortHierarchicalDataset').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });

        component.dispose();
        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file', initialSort: { columndId: 'file', direction: 'ASC' } } } as unknown as GridOption;
        component.datasetHierarchical = mockHierarchical;
        component.eventPubSubService = new EventPubSubService(divContainer);
        component.isDatasetHierarchicalInitialized = true;
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
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        vi.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');

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
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        vi.spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort').mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');

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
    vi.clearAllMocks();
    dataset = [];
    divContainer = document.createElement('div');
    cellDiv = document.createElement('div');
    divContainer.innerHTML = template;
    divContainer.appendChild(cellDiv);
    document.body.appendChild(divContainer);
    columnDefinitions = [{ id: 'name', field: 'name' }];
    gridOptions = {
      darkMode: true,
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
    vi.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
    hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
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
    vi.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
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
    expect(component.isGridInitialized).toBe(false);
    expect(component.isDatasetInitialized).toBe(false);
  });
});
