import 'jest-extended';
import {
  Column,
  CollectionService,
  CurrentFilter,
  CurrentPagination,
  CurrentSorter,
  Editors,
  ExtensionList,
  ExtensionService,
  ExtensionUtility,
  Filters,
  FilterService,
  GridEventService,
  GridOption,
  GridService,
  GridState,
  GridStateService,
  GridStateType,
  GroupingAndColspanService,
  Pagination,
  PaginationService,
  ServicePagination,
  SharedService,
  SlickDraggableGrouping,
  SlickPluginList,
  SlickGrid,
  SortService,
  TreeDataService,
  TranslaterService,
} from '@slickgrid-universal/common';
import { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, GraphqlServiceOption } from '@slickgrid-universal/graphql';
import * as utilities from '@slickgrid-universal/common/dist/commonjs/services/backend-utilities';

import { SlickVanillaGridBundle, SlickVanillaGridBundleInitializer } from '../slick-vanilla-grid-bundle';
import { EventPubSubService } from '../../services/eventPubSub.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { HttpStub } from '../../../../../test/httpClientStub';
import { FileExportService } from '../../services/fileExport.service';
jest.mock('../../services/fileExport.service');

const mockExecuteBackendProcess = jest.fn();
const mockRefreshBackendDataset = jest.fn();
const mockBackendError = jest.fn();

// @ts-ignore
utilities.executeBackendProcessesCallback = mockExecuteBackendProcess;

// @ts-ignore
utilities.refreshBackendDataset = mockRefreshBackendDataset;

// @ts-ignore
utilities.onBackendError = mockBackendError;

declare const Slick: any;
jest.mock('flatpickr', () => { });

const extensionServiceStub = {
  bindDifferentExtensions: jest.fn(),
  createExtensionsBeforeGridCreation: jest.fn(),
  dispose: jest.fn(),
  renderColumnHeaders: jest.fn(),
  translateCellMenu: jest.fn(),
  translateColumnHeaders: jest.fn(),
  translateColumnPicker: jest.fn(),
  translateContextMenu: jest.fn(),
  translateGridMenu: jest.fn(),
  translateHeaderMenu: jest.fn(),
} as unknown as ExtensionService;
Object.defineProperty(extensionServiceStub, 'extensionList', { get: jest.fn(() => { }), set: jest.fn(), configurable: true });

const mockExtensionUtility = {
  loadExtensionDynamically: jest.fn(),
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

const collectionServiceStub = {
  filterCollection: jest.fn(),
  singleFilterCollection: jest.fn(),
  sortCollection: jest.fn(),
} as unknown as CollectionService;

const filterServiceStub = {
  clearFilters: jest.fn(),
  dispose: jest.fn(),
  init: jest.fn(),
  bindBackendOnFilter: jest.fn(),
  bindLocalOnFilter: jest.fn(),
  bindLocalOnSort: jest.fn(),
  bindBackendOnSort: jest.fn(),
  populateColumnFilterSearchTermPresets: jest.fn(),
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
  init: jest.fn(),
  dispose: jest.fn(),
  getFullPagination: jest.fn(),
  updateTotalItems: jest.fn(),
} as unknown as PaginationService;

Object.defineProperty(paginationServiceStub, 'totalItems', {
  get: jest.fn(() => 0),
  set: jest.fn()
});

const sortServiceStub = {
  bindBackendOnSort: jest.fn(),
  bindLocalOnSort: jest.fn(),
  dispose: jest.fn(),
  loadGridSorters: jest.fn(),
  processTreeDataInitialSort: jest.fn(),
} as unknown as SortService;

const treeDataServiceStub = {
  init: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

const mockGroupItemMetaProvider = {
  init: jest.fn(),
  destroy: jest.fn(),
  defaultGroupCellFormatter: jest.fn(),
  defaultTotalsCellFormatter: jest.fn(),
  handleGridClick: jest.fn(),
  handleGridKeyDown: jest.fn(),
  getGroupRowMetadata: jest.fn(),
  getTotalsRowMetadata: jest.fn(),
};

const mockDataView = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  beginUpdate: jest.fn(),
  endUpdate: jest.fn(),
  getItem: jest.fn(),
  getItems: jest.fn(),
  getItemMetadata: jest.fn(),
  getPagingInfo: jest.fn(),
  mapIdsToRows: jest.fn(),
  mapRowsToIds: jest.fn(),
  onSetItemsCalled: jest.fn(),
  onRowsChanged: new Slick.Event(),
  onRowCountChanged: new Slick.Event(),
  reSort: jest.fn(),
  setItems: jest.fn(),
  syncGridSelection: jest.fn(),
};

const mockDraggableGroupingExtension = {
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
};

const mockSlickCore = {
  handlers: [],
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
};

const mockGetEditorLock = {
  isActive: () => true,
  commitCurrentEdit: jest.fn(),
};

const mockGrid = {
  autosizeColumns: jest.fn(),
  destroy: jest.fn(),
  init: jest.fn(),
  invalidate: jest.fn(),
  getActiveCellNode: jest.fn(),
  getColumns: jest.fn(),
  getEditorLock: () => mockGetEditorLock,
  getUID: () => 'slickgrid_12345',
  getContainerNode: jest.fn(),
  getOptions: jest.fn(),
  getSelectionModel: jest.fn(),
  getScrollbarDimensions: jest.fn(),
  render: jest.fn(),
  registerPlugin: jest.fn(),
  resizeCanvas: jest.fn(),
  setColumns: jest.fn(),
  setHeaderRowVisibility: jest.fn(),
  setOptions: jest.fn(),
  setSelectedRows: jest.fn(),
  onRendered: jest.fn(),
  onScroll: jest.fn(),
  onDataviewCreated: new Slick.Event(),
};

const mockSlickCoreImplementation = jest.fn().mockImplementation(() => mockSlickCore);
const mockDataViewImplementation = jest.fn().mockImplementation(() => mockDataView);
const mockGroupItemMetaProviderImplementation = jest.fn().mockImplementation(() => mockGroupItemMetaProvider);
const mockGridImplementation = jest.fn().mockImplementation(() => mockGrid);
const mockDraggableGroupingImplementation = jest.fn().mockImplementation(() => mockDraggableGroupingExtension);


describe('Slick-Vanilla-Grid-Bundle Component instantiated via Constructor', () => {
  jest.mock('slickgrid/slick.core', () => mockSlickCoreImplementation);
  jest.mock('slickgrid/slick.grid', () => mockGridImplementation);
  jest.mock('slickgrid/plugins/slick.draggablegrouping', () => mockDraggableGroupingImplementation);
  Slick.Grid = mockGridImplementation;
  Slick.EventHandler = mockSlickCoreImplementation;
  Slick.Data = { DataView: mockDataViewImplementation, GroupItemMetadataProvider: mockGroupItemMetaProviderImplementation };
  Slick.DraggableGrouping = mockDraggableGroupingImplementation;

  let component: SlickVanillaGridBundle;
  let divContainer: HTMLDivElement;
  let cellDiv: HTMLDivElement;
  let columnDefinitions: Column[];
  let gridOptions: GridOption;
  let sharedService: SharedService;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  const http = new HttpStub();

  const template = `
  <div class="demo-container">
    <div class="grid1 grid-pane">
      <div class="slickgrid-container slickgrid_12345">
        <div class="slick-pane slick-pane-header slick-pane-left" style="width: 100%;"></div>
      </div>
    </div>
  </div>`;

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
    } as GridOption;
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    eventPubSubService = new EventPubSubService(divContainer);
    jest.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);

    component = new SlickVanillaGridBundleInitializer(
      collectionServiceStub,
      eventPubSubService,
      extensionServiceStub,
      mockExtensionUtility,
      filterServiceStub,
      gridEventServiceStub,
      gridServiceStub,
      gridStateServiceStub,
      groupingAndColspanServiceStub,
      paginationServiceStub,
      sharedService,
      sortServiceStub,
      treeDataServiceStub,
      translateService as unknown as TranslaterService,
      divContainer,
      columnDefinitions,
      gridOptions,
      [],
    );
  });

  afterEach(() => {
    component?.dispose();
  });

  it('should make sure SlickVanillaGridBundle is defined', () => {
    expect(component).toBeTruthy();
  });

  it('should create a grid and expect multiple Event Aggregator being called', () => {
    const pubSubSpy = jest.spyOn(eventPubSubService, 'publish');

    component.initialization(divContainer);
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

  describe('initialization method', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('columns definitions changed', () => {
      it('should expect "translateColumnHeaders" being called when "enableTranslate" is set', () => {
        const translateSpy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const updateSpy = jest.spyOn(component, 'updateColumnDefinitionsList');
        const eventSpy = jest.spyOn(eventPubSubService, 'publish');
        const addPubSubSpy = jest.spyOn(component.translaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.columnDefinitions = mockColDefs;
        component.gridOptions = { enableTranslate: true };
        component.initialization(divContainer);

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
        const addPubSubSpy = jest.spyOn(component.translaterService, 'addPubSubMessaging');
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.columnDefinitions = mockColDefs;
        component.gridOptions = { enableTranslate: false };
        component.initialization(divContainer);

        expect(translateSpy).not.toHaveBeenCalled();
        expect(autosizeSpy).toHaveBeenCalled();
        expect(addPubSubSpy).not.toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledTimes(4);
        expect(updateSpy).toHaveBeenCalledWith(mockColDefs);
        expect(renderSpy).toHaveBeenCalledWith(mockColDefs, true);
      });
    });

    describe('dataset changed', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should expect "autosizeColumns" being called when "autoFitColumnsOnFirstLoad" is set and we are on first page load', () => {
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];

        component.gridOptions = { autoFitColumnsOnFirstLoad: true };
        component.initialization(divContainer);
        component.dataset = mockData;

        expect(autosizeSpy).toHaveBeenCalledTimes(3); // 1x by datasetChanged and 2x by bindResizeHook
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should expect "autosizeColumns" NOT being called when "autoFitColumnsOnFirstLoad" is not set and we are on first page load', () => {
        const autosizeSpy = jest.spyOn(mockGrid, 'autosizeColumns');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];

        component.gridOptions = { autoFitColumnsOnFirstLoad: false };
        component.initialization(divContainer);
        component.dataset = mockData;

        expect(autosizeSpy).not.toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
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
        mockGrid.getOptions = null;
        const setOptionSpy = jest.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];

        component.gridOptions = { autoCommitEdit: false, autoResize: null };
        component.initialization(divContainer);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        // expect(component.gridOptions.autoResize.bottomPadding).toEqual(50 + DATAGRID_FOOTER_HEIGHT); // calculated by the lib
        expect(setOptionSpy).toBeCalledWith(component.gridOptions);
        expect(sharedOptionSpy).toBeCalledWith(component.gridOptions);
      });

      it('should merge grid options with global options and expect bottom padding to be calculated', () => {
        mockGrid.getOptions = null;
        const setOptionSpy = jest.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = jest.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];

        component.gridOptions = { autoCommitEdit: false, autoResize: null };
        component.initialization(divContainer);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        expect(setOptionSpy).toBeCalledWith(component.gridOptions);
        expect(sharedOptionSpy).toBeCalledWith(component.gridOptions);
      });

      it('should merge paginationOptions when some already exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [] };
        const paginationSrvSpy = jest.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual({ ...mockPagination, totalItems: 0 });
        expect(paginationSrvSpy).toHaveBeenCalledWith(0);
      });

      it('should set brand new paginationOptions when none previously exist', () => {
        const mockPagination = { pageSize: 2, pageSizes: [], totalItems: 1 };
        const paginationSrvSpy = jest.spyOn(paginationServiceStub, 'updateTotalItems');

        component.paginationOptions = undefined;
        component.paginationOptions = mockPagination;

        expect(component.paginationOptions).toEqual(mockPagination);
        expect(paginationSrvSpy).toHaveBeenCalledWith(1);
      });
    });

    describe('with editors', () => {
      it('should be able to load async editors with a regular Promise', (done) => {
        const mockCollection = ['male', 'female'];
        const promise = new Promise(resolve => resolve(mockCollection));
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];
        const getColSpy = jest.spyOn(mockGrid, 'getColumns').mockReturnValue(mockColDefs);

        component.columnDefinitions = mockColDefs;
        // component.initialization(divContainer);

        setTimeout(() => {
          expect(getColSpy).toHaveBeenCalled();
          expect(component.columnDefinitions[0].editor).toBeTruthy();
          expect(component.columnDefinitions[0].editor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.model).toEqual(Editors.text);
          done();
        });
      });

      it('should be able to load async editors with as a Promise with content to simulate http-client', (done) => {
        const mockCollection = ['male', 'female'];
        const promise = new Promise(resolve => resolve({ content: mockCollection }));
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync: promise } }] as Column[];
        const getColSpy = jest.spyOn(mockGrid, 'getColumns').mockReturnValue(mockColDefs);

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(getColSpy).toHaveBeenCalled();
          expect(component.columnDefinitions[0].editor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.model).toEqual(Editors.text);
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
        const collectionAsync = http.fetch('/api', { method: 'GET' });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync } }] as Column[];
        const getColSpy = jest.spyOn(mockGrid, 'getColumns').mockReturnValue(mockColDefs);

        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(getColSpy).toHaveBeenCalled();
          expect(component.columnDefinitions[0].editor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.collection).toEqual(mockCollection);
          expect(component.columnDefinitions[0].internalColumnEditor.model).toEqual(Editors.text);
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
        const collectionAsync = http.fetch('invalid-url', { method: 'GET' });
        const mockColDefs = [{ id: 'gender', field: 'gender', editor: { model: Editors.text, collectionAsync } }] as Column[];
        jest.spyOn(mockGrid, 'getColumns').mockReturnValue(mockColDefs);
        component.columnDefinitions = mockColDefs;

        component.initialization(divContainer);

        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(expect.toInclude('[SlickGrid-Universal] The response body passed to collectionAsync was already read.'));
          done();
        });
      });
    });

    describe('use grouping', () => {
      it('should load groupItemMetaProvider to the DataView when using "draggableGrouping" feature', () => {
        const extensionSpy = jest.spyOn(mockExtensionUtility, 'loadExtensionDynamically');
        const dataviewSpy = jest.spyOn(mockDataViewImplementation.prototype, 'constructor');
        const groupMetaSpy = jest.spyOn(mockGroupItemMetaProviderImplementation.prototype, 'constructor');
        const sharedMetaSpy = jest.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');
        jest.spyOn(extensionServiceStub, 'extensionList', 'get').mockReturnValue({ draggableGrouping: { pluginName: 'DraggableGrouping' } } as unknown as ExtensionList<any, any>);

        component.gridOptions = { draggableGrouping: {} };
        component.initialization(divContainer);
        const extensions = component.extensions;

        expect(Object.keys(extensions).length).toBe(1);
        expect(extensionSpy).toHaveBeenCalledWith('groupItemMetaProvider');
        expect(dataviewSpy).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() });
        expect(groupMetaSpy).toHaveBeenCalledWith();
        expect(sharedMetaSpy).toHaveBeenCalledWith(mockGroupItemMetaProvider);

        component.dispose();
      });

      it('should load groupItemMetaProvider to the DataView when using "enableGrouping" feature', () => {
        const extensionSpy = jest.spyOn(mockExtensionUtility, 'loadExtensionDynamically');
        const dataviewSpy = jest.spyOn(mockDataViewImplementation.prototype, 'constructor');
        const groupMetaSpy = jest.spyOn(mockGroupItemMetaProviderImplementation.prototype, 'constructor');
        const sharedMetaSpy = jest.spyOn(SharedService.prototype, 'groupItemMetadataProvider', 'set');

        component.gridOptions = { enableGrouping: true };
        component.initialization(divContainer);

        expect(extensionSpy).toHaveBeenCalledWith('groupItemMetaProvider');
        expect(dataviewSpy).toHaveBeenCalledWith({ inlineFilters: false, groupItemMetadataProvider: expect.anything() });
        expect(groupMetaSpy).toHaveBeenCalledWith();
        expect(sharedMetaSpy).toHaveBeenCalledWith(mockGroupItemMetaProvider);

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

        component.initialization(divContainer);

        expect(spy).toHaveBeenNthCalledWith(2, 'onDataviewCreated', expect.any(Object));
      });

      it('should call the "executeAfterDataviewCreated" and "loadGridSorters" methods and Sorter Presets are provided in the Grid Options', () => {
        const globalEaSpy = jest.spyOn(eventPubSubService, 'publish');
        const sortSpy = jest.spyOn(sortServiceStub, 'loadGridSorters');

        component.gridOptions = { presets: { sorters: [{ columnId: 'field1', direction: 'DESC' }] } } as GridOption;
        component.initialization(divContainer);

        expect(globalEaSpy).toHaveBeenNthCalledWith(3, 'onGridCreated', expect.any(Object));
        expect(sortSpy).toHaveBeenCalled();
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as True when the "dataView.syncGridSelection" grid option is enabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: true }, enableRowSelection: true } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with 2nd argument as False when the "dataView.syncGridSelection" grid option is disabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = { dataView: { syncGridSelection: false }, enableRowSelection: true } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with 3 arguments when the "dataView" grid option is provided as an object', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          dataView: { syncGridSelection: { preserveHidden: true, preserveHiddenOnSelectionChange: false } },
          enableRowSelection: true
        } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true, false);
      });

      it('should call the DataView "syncGridSelection" method when using BackendServiceApi and "syncGridSelectionWithBackendService" when the "dataView.syncGridSelection" grid option is enabled as well', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, true);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" BUT the "dataView.syncGridSelection" grid option is disabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: false, syncGridSelectionWithBackendService: true },
          enableRowSelection: true
        } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });

      it('should call the DataView "syncGridSelection" method with false as 2nd argument when using BackendServiceApi and "syncGridSelectionWithBackendService" disabled and the "dataView.syncGridSelection" grid option is enabled', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const syncSpy = jest.spyOn(mockDataView, 'syncGridSelection');

        component.gridOptions = {
          backendServiceApi: {
            service: mockGraphqlService,
            process: jest.fn(),
          },
          dataView: { syncGridSelection: true, syncGridSelectionWithBackendService: false },
          enableRowSelection: true
        } as GridOption;
        component.initialization(divContainer);

        expect(syncSpy).toHaveBeenCalledWith(component.slickGrid, false);
      });
    });

    describe('flag checks', () => {
      afterEach(() => {
        jest.clearAllMocks();
        component.dispose();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should call "showHeaderRow" method with false when its flag is disabled', () => {
        const gridSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');

        component.gridOptions = { showHeaderRow: false } as GridOption;
        component.initialization(divContainer);

        expect(gridSpy).toHaveBeenCalledWith(false, false);
      });

      it('should initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is disabled', () => {
        const spy = jest.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: false } as GridOption;
        component.initialization(divContainer);

        expect(spy).toHaveBeenCalledWith(mockGrid, sharedService);
      });

      it('should not initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is also enabled', () => {
        const spy = jest.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: true } as GridOption;
        component.initialization(divContainer);

        expect(spy).not.toHaveBeenCalled();
      });

      it('should call "translateColumnHeaders" from ExtensionService when "enableTranslate" is set', () => {
        const spy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');

        component.gridOptions = { enableTranslate: true } as GridOption;
        component.initialization(divContainer);

        expect(spy).toHaveBeenCalled();
      });

      it('should initialize ExportService when "enableExport" is set when using Salesforce', () => {
        component.gridOptions = { enableExport: true, useSalesforceDefaultGridOptions: true } as GridOption;
        component.initialization(divContainer);

        expect(FileExportService).toHaveBeenCalled();
        expect(component.registeredServices.length).toBe(3); // FileExportService, GridService, GridStateService
        expect(component.registeredServices[0] instanceof FileExportService).toBeTrue();
      });

      it('should destroy customElement and its DOM element when requested', () => {
        const spy = jest.spyOn(component, 'destroyGridContainerElm');

        component.initialization(divContainer);
        component.dispose(true);

        expect(spy).toHaveBeenCalledWith();
      });

      it('should bind local filter when "enableFiltering" is set', () => {
        const bindLocalSpy = jest.spyOn(filterServiceStub, 'bindLocalOnFilter');

        component.gridOptions = { enableFiltering: true } as GridOption;
        component.initialization(divContainer);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should bind local sort when "enableSorting" is set', () => {
        const bindLocalSpy = jest.spyOn(sortServiceStub, 'bindLocalOnSort');

        component.gridOptions = { enableSorting: true } as GridOption;
        component.initialization(divContainer);

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

        component.initialization(divContainer);
        component.dataset = mockData;

        setTimeout(() => {
          expect(component.paginationOptions.pageSize).toBe(2);
          expect(component.paginationOptions.pageNumber).toBe(expectedPageNumber);
          expect(component.paginationOptions.totalItems).toBe(expectedTotalItems);
          expect(refreshSpy).toHaveBeenCalledWith(mockData);
          done();
        });
      });

      it('should refresh a local grid defined and change pagination options pagination when a preset is defined in grid options and total rows is different when Filters are applied', (done) => {
        const expectedPageNumber = 3;
        const expectedTotalItems = 15;
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const getPagingSpy = jest.spyOn(mockDataView, 'getPagingInfo').mockReturnValue({ pageNum: 1, totalRows: expectedTotalItems });

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions = {
          enableFiltering: true,
          enablePagination: true,
          presets: { pagination: { pageSize: 10, pageNumber: expectedPageNumber } }
        };
        component.paginationOptions = { pageSize: 10, pageNumber: 2, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer);
        component.dataset = mockData;

        setTimeout(() => {
          expect(getPagingSpy).toHaveBeenCalled();
          expect(component.paginationOptions.pageSize).toBe(10);
          expect(component.paginationOptions.pageNumber).toBe(expectedPageNumber);
          expect(component.paginationOptions.totalItems).toBe(expectedTotalItems);
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
            service: mockGraphqlService,
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

        component.initialization(divContainer);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method that was created by "createBackendApiInternalPostProcessCallback" with Pagination', () => {
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer);
        component.gridOptions.backendServiceApi.internalPostProcess({ data: { users: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback and expect totalItems to be updated in the PaginationService when "refreshGridData" is called on the 2nd time', () => {
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'getDatasetName').mockReturnValue('users');
        const refreshSpy = jest.spyOn(component, 'refreshGridData');
        const paginationSpy = jest.spyOn(paginationServiceStub, 'totalItems', 'set');
        const mockDataset = [{ firstName: 'John' }, { firstName: 'Jane' }];

        component.initialization(divContainer);
        component.gridOptions.backendServiceApi.internalPostProcess({ data: { users: { nodes: mockDataset, totalCount: mockDataset.length } } } as GraphqlPaginatedResult);
        component.refreshGridData(mockDataset, 1);
        component.refreshGridData(mockDataset, 1);

        expect(refreshSpy).toHaveBeenCalledTimes(3);
        expect(paginationSpy).toHaveBeenCalledWith(2);
        expect(component.gridOptions.backendServiceApi.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method that was created by "createBackendApiInternalPostProcessCallback" without Pagination (when disabled)', () => {
        component.gridOptions.enablePagination = false;
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer);
        component.gridOptions.backendServiceApi.internalPostProcess({ data: { users: [{ firstName: 'John' }] } });

        expect(spy).toHaveBeenCalled();
        expect(component.gridOptions.backendServiceApi.internalPostProcess).toEqual(expect.any(Function));
      });

      it('should execute the "internalPostProcess" callback method but return an empty dataset when dataset name does not match "getDatasetName"', () => {
        component.gridOptions.enablePagination = true;
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'getDatasetName').mockReturnValue('users');
        const spy = jest.spyOn(component, 'refreshGridData');

        component.initialization(divContainer);
        component.gridOptions.backendServiceApi.internalPostProcess({ data: { notUsers: { nodes: [{ firstName: 'John' }], totalCount: 2 } } } as GraphqlPaginatedResult);

        expect(spy).not.toHaveBeenCalled();
        expect(component.dataset).toEqual([]);
      });

      it('should invoke "updateFilters" method with filters returned from "getColumnFilters" of the Filter Service when there is no Presets defined', () => {
        const mockColumnFilter = { name: { columnId: 'name', columnDef: { id: 'name', field: 'name', filter: { model: Filters.autoComplete } }, operator: 'EQ', searchTerms: ['john'] } };
        // @ts-ignore
        jest.spyOn(filterServiceStub, 'getColumnFilters').mockReturnValue(mockColumnFilter);
        const backendSpy = jest.spyOn(mockGraphqlService, 'updateFilters');

        component.gridOptions.presets = undefined;
        component.initialization(divContainer);

        expect(backendSpy).toHaveBeenCalledWith(mockColumnFilter, false);
      });

      it('should call the "updateFilters" method when filters are defined in the "presets" property', () => {
        const spy = jest.spyOn(mockGraphqlService, 'updateFilters');
        const mockFilters = [{ columnId: 'company', searchTerms: ['xyz'], operator: 'IN' }] as CurrentFilter[];
        component.gridOptions.presets = { filters: mockFilters };
        component.initialization(divContainer);

        expect(spy).toHaveBeenCalledWith(mockFilters, true);
      });

      it('should call the "updateSorters" method when filters are defined in the "presets" property', () => {
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);
        const spy = jest.spyOn(mockGraphqlService, 'updateSorters');
        const mockSorters = [{ columnId: 'name', direction: 'asc' }] as CurrentSorter[];
        component.gridOptions.presets = { sorters: mockSorters };
        component.initialization(divContainer);

        expect(spy).toHaveBeenCalledWith(undefined, mockSorters);
      });

      it('should call the "updatePagination" method when filters are defined in the "presets" property', () => {
        const spy = jest.spyOn(mockGraphqlService, 'updatePagination');

        component.gridOptions.presets = { pagination: { pageNumber: 2, pageSize: 20 } };
        component.initialization(divContainer);

        expect(spy).toHaveBeenCalledWith(2, 20);
      });

      it('should refresh the grid and change pagination options pagination when a preset for it is defined in grid options', () => {
        const expectedPageNumber = 3;
        const refreshSpy = jest.spyOn(component, 'refreshGridData');

        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        component.gridOptions.enablePagination = true;
        component.gridOptions.presets = { pagination: { pageSize: 10, pageNumber: expectedPageNumber } };
        component.paginationOptions = { pageSize: 10, pageNumber: 1, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer);
        component.dataset = mockData;

        expect(component.paginationOptions.pageSize).toBe(10);
        expect(component.paginationOptions.pageNumber).toBe(expectedPageNumber);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should execute the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options with Pagination enabled', (done) => {
        const now = new Date();
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const processResult = {
          data: { users: { nodes: [] }, pageInfo: { hasNextPage: true }, totalCount: 0 },
          metrics: { startTime: now, endTime: now, executionTime: 0, totalItemCount: 0 }
        };
        const promise = new Promise(resolve => setTimeout(() => resolve(processResult), 1));
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'buildQuery').mockReturnValue(query);

        component.gridOptions.backendServiceApi.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(mockExecuteBackendProcess).toHaveBeenCalledWith(expect.toBeDate(), processResult, component.gridOptions.backendServiceApi, 0);
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
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'buildQuery').mockReturnValue(query);

        component.gridOptions.backendServiceApi.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer);

        expect(processSpy).toHaveBeenCalled();

        setTimeout(() => {
          expect(mockExecuteBackendProcess).toHaveBeenCalledWith(expect.toBeDate(), processResult, component.gridOptions.backendServiceApi, 0);
          done();
        }, 5);
      });

      it('should throw an error when the process method on initialization when "executeProcessCommandOnInit" is set as a backend service options', (done) => {
        const mockError = { error: '404' };
        const query = `query { users (first:20,offset:0) { totalCount, nodes { id,name,gender,company } } }`;
        const promise = new Promise((_resolve, reject) => setTimeout(() => reject(mockError), 1));
        const processSpy = jest.spyOn(component.gridOptions.backendServiceApi, 'process').mockReturnValue(promise);
        jest.spyOn(component.gridOptions.backendServiceApi.service, 'buildQuery').mockReturnValue(query);

        component.gridOptions.backendServiceApi.service.options = { executeProcessCommandOnInit: true };
        component.initialization(divContainer);

        expect(processSpy).toHaveBeenCalled();

        promise.catch((e) => {
          expect(e).toEqual(mockError);
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
        const transCellMenuSpy = jest.spyOn(extensionServiceStub, 'translateCellMenu');
        const transColHeaderSpy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const transColPickerSpy = jest.spyOn(extensionServiceStub, 'translateColumnPicker');
        const transContextMenuSpy = jest.spyOn(extensionServiceStub, 'translateContextMenu');
        const transGridMenuSpy = jest.spyOn(extensionServiceStub, 'translateGridMenu');
        const transHeaderMenuSpy = jest.spyOn(extensionServiceStub, 'translateHeaderMenu');
        const transGroupingColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: false, enableDraggableGrouping: false } as GridOption;
        component.initialization(divContainer);

        eventPubSubService.publish('onLanguageChange', { language: 'fr' });

        setTimeout(() => {
          expect(setHeaderRowSpy).not.toHaveBeenCalled();
          expect(transGroupingColSpanSpy).not.toHaveBeenCalled();
          expect(transCellMenuSpy).toHaveBeenCalled();
          expect(transColHeaderSpy).toHaveBeenCalled();
          expect(transColPickerSpy).toHaveBeenCalled();
          expect(transContextMenuSpy).toHaveBeenCalled();
          expect(transGridMenuSpy).toHaveBeenCalled();
          expect(transHeaderMenuSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should call "setHeaderRowVisibility", "translateGroupingAndColSpan" and other methods when locale changes', (done) => {
        component.columnDefinitions = [{ id: 'firstName', field: 'firstName', filterable: true }];
        const transCellMenuSpy = jest.spyOn(extensionServiceStub, 'translateCellMenu');
        const transColHeaderSpy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');
        const transColPickerSpy = jest.spyOn(extensionServiceStub, 'translateColumnPicker');
        const transContextMenuSpy = jest.spyOn(extensionServiceStub, 'translateContextMenu');
        const transGridMenuSpy = jest.spyOn(extensionServiceStub, 'translateGridMenu');
        const transHeaderMenuSpy = jest.spyOn(extensionServiceStub, 'translateHeaderMenu');
        const transGroupingColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as GridOption;
        component.initialization(divContainer);

        eventPubSubService.publish('onLanguageChange', {});

        setTimeout(() => {
          expect(transGroupingColSpanSpy).toHaveBeenCalled();
          expect(transCellMenuSpy).toHaveBeenCalled();
          expect(transColHeaderSpy).toHaveBeenCalled();
          expect(transColPickerSpy).toHaveBeenCalled();
          expect(transContextMenuSpy).toHaveBeenCalled();
          expect(transGridMenuSpy).toHaveBeenCalled();
          expect(transHeaderMenuSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should call "translateGroupingAndColSpan" translate methods when locale changes and Column Grouping PreHeader are enabled', (done) => {
        const groupColSpanSpy = jest.spyOn(groupingAndColspanServiceStub, 'translateGroupingAndColSpan');

        component.gridOptions = { enableTranslate: true, createPreHeaderPanel: true, enableDraggableGrouping: false } as GridOption;
        component.initialization(divContainer);

        eventPubSubService.publish('onLanguageChange', {});

        setTimeout(() => {
          expect(groupColSpanSpy).toHaveBeenCalled();
          done();
        });
      });

      it('should trigger a DOM element dispatch event when a SlickGrid onX event is triggered', () => {
        const eventSpy = jest.spyOn(divContainer, 'dispatchEvent');
        const gridElm = divContainer.querySelector('div.grid1');
        const mockEvent = () => 'blah';

        component.initialization(divContainer);
        // @ts-ignore
        const handlerSpy = jest.spyOn(component.eventHandler, 'subscribe').mockReturnValueOnce('onRendered', mockEvent);
        mockEvent();
        mockGrid.onRendered();
        mockGrid.onScroll();

        gridElm.dispatchEvent(new CustomEvent('onRendered'));
        expect(eventSpy).toHaveBeenCalledWith(new CustomEvent('onRendered', expect.anything()));
        expect(handlerSpy).toHaveBeenCalled();
      });

      it('should reflect columns in the grid', () => {
        const mockColsPresets = [{ columnId: 'firstName', width: 100 }];
        const mockCols = [{ id: 'firstName', field: 'firstName' }];
        const getAssocColSpy = jest.spyOn(gridStateServiceStub, 'getAssociatedGridColumns').mockReturnValue(mockCols);
        const setColSpy = jest.spyOn(mockGrid, 'setColumns');

        component.gridOptions = { presets: { columns: mockColsPresets } } as GridOption;
        component.initialization(divContainer);

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
        component.gridOptions = { enableCheckboxSelector: true, presets: { columns: mockColsPresets } } as GridOption;
        component.initialization(divContainer);

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
        } as GridOption;
        component.initialization(divContainer);

        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(initSpy).toHaveBeenCalledWith(mockGraphqlOptions, mockPagination, mockGrid);
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
        } as GridOption;
        component.initialization(divContainer);

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
        } as GridOption;
        component.initialization(divContainer);

        expect(bindLocalSpy).toHaveBeenCalledWith(mockGrid);
      });

      it('should call bind backend filtering when "enableFiltering" is set', () => {
        const initSpy = jest.spyOn(filterServiceStub, 'init');
        const bindLocalSpy = jest.spyOn(filterServiceStub, 'bindLocalOnFilter');
        const populateSpy = jest.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true } as GridOption;
        component.initialization(divContainer);

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
        } as GridOption;
        component.initialization(divContainer);

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
        } as GridOption;
        component.initialization(divContainer);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(bindBackendSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).not.toHaveBeenCalled();
      });

      it('should reflect column filters and populate filter search terms when "enableFiltering" is set and preset filters are defined', () => {
        const mockPresetFilters = [{ columnId: 'firstName', operator: 'IN', searchTerms: ['John', 'Jane'] }] as CurrentFilter[];
        const initSpy = jest.spyOn(filterServiceStub, 'init');
        const populateSpy = jest.spyOn(filterServiceStub, 'populateColumnFilterSearchTermPresets');

        component.gridOptions = { enableFiltering: true, presets: { filters: mockPresetFilters } } as GridOption;
        component.initialization(divContainer);

        expect(initSpy).toHaveBeenCalledWith(mockGrid);
        expect(populateSpy).toHaveBeenCalledWith(mockPresetFilters);
      });

      it('should return null when "getItemMetadata" is called without a colspan callback defined', () => {
        const itemSpy = jest.spyOn(mockDataView, 'getItem');

        component.gridOptions = { colspanCallback: undefined } as GridOption;
        component.initialization(divContainer);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).not.toHaveBeenCalled();
      });

      it('should execute colspan callback when defined in the grid options and "getItemMetadata" is called', () => {
        const mockCallback = jest.fn();
        const mockItem = { firstName: 'John', lastName: 'Doe' };
        const itemSpy = jest.spyOn(mockDataView, 'getItem').mockReturnValue(mockItem);

        component.gridOptions = { colspanCallback: mockCallback } as GridOption;
        component.initialization(divContainer);
        mockDataView.getItemMetadata(2);

        expect(itemSpy).toHaveBeenCalledWith(2);
        expect(mockCallback).toHaveBeenCalledWith(mockItem);
      });
    });

    describe('setHeaderRowVisibility grid method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should show the header row when "showHeaderRow" is called with argument True', () => {
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = jest.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer);
        component.showHeaderRow(true);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(true, false);
        expect(setColumnSpy).toHaveBeenCalledTimes(1);
      });

      it('should show the header row when "showHeaderRow" is called with argument False', () => {
        const setHeaderRowSpy = jest.spyOn(mockGrid, 'setHeaderRowVisibility');
        const setColumnSpy = jest.spyOn(mockGrid, 'setColumns');

        component.initialization(divContainer);
        component.showHeaderRow(false);

        expect(setHeaderRowSpy).toHaveBeenCalledWith(false, false);
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

        component.initialization(divContainer);
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
        component.initialization(divContainer);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        eventPubSubService.publish('onPaginationChanged', mockServicePagination);

        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });

      it('should call trigger a gridStage change and reset selected rows when pagination change is triggered and "enableRowSelection" is set', () => {
        const mockPagination = { pageNumber: 2, pageSize: 20 } as Pagination;
        const pluginEaSpy = jest.spyOn(eventPubSubService, 'publish');
        const setRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(gridStateServiceStub, 'getCurrentGridState').mockReturnValue({ columns: [], pagination: mockPagination } as GridState);

        component.gridOptions = { enableRowSelection: true } as GridOption;
        component.initialization(divContainer);
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

        component.gridOptions = { enableCheckboxSelector: true } as GridOption;
        component.initialization(divContainer);
        component.paginationChanged(mockPagination);

        expect(setRowSpy).toHaveBeenCalledWith([]);
        expect(pluginEaSpy).toHaveBeenCalledWith('onGridStateChanged', {
          change: { newValues: mockPagination, type: GridStateType.pagination },
          gridState: { columns: [], pagination: mockPagination }
        });
      });
    });

    describe('Custom Footer', () => {
      it('should have a Custom Footer when "showCustomFooter" is enabled and there are no Pagination used', (done) => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];
        const mockGridOptions = { enableTranslate: true, showCustomFooter: true, };
        jest.spyOn(mockGrid, 'getOptions').mockReturnValue(mockGridOptions);

        translateService.use('fr');
        component.gridOptions = mockGridOptions;
        component.initialization(divContainer);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.gridOptions.showCustomFooter).toBeTrue();
          expect(component.gridOptions.customFooterOptions).toEqual({
            dateFormat: 'YYYY-MM-DD, hh:mm a',
            hideLastUpdateTimestamp: true,
            hideTotalItemCount: false,
            footerHeight: 25,
            leftContainerClass: 'col-xs-12 col-sm-5',
            metricSeparator: '|',
            metricTexts: {
              items: 'éléments',
              itemsKey: 'ITEMS',
              of: 'de',
              ofKey: 'OF',
            },
            rightContainerClass: 'col-xs-6 col-sm-7',
          });
          done();
        });
      });

      it('should have a Custom Footer and custom texts when "showCustomFooter" is enabled with different metricTexts defined', (done) => {
        const mockColDefs = [{ id: 'name', field: 'name', editor: undefined, internalColumnEditor: {} }];

        component.gridOptions.enableTranslate = false;
        component.gridOptions.showCustomFooter = true;
        component.gridOptions.customFooterOptions = {
          metricTexts: {
            items: 'some items',
            lastUpdate: 'some last update',
            of: 'some of'
          }
        };
        component.initialization(divContainer);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.gridOptions.showCustomFooter).toBeTrue();
          expect(component.gridOptions.customFooterOptions).toEqual({
            dateFormat: 'YYYY-MM-DD, hh:mm a',
            hideLastUpdateTimestamp: true,
            hideTotalItemCount: false,
            footerHeight: 25,
            leftContainerClass: 'col-xs-12 col-sm-5',
            metricSeparator: '|',
            metricTexts: {
              items: 'some items',
              itemsKey: 'ITEMS',
              lastUpdate: 'some last update',
              of: 'some of',
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
        component.initialization(divContainer);
        component.columnDefinitions = mockColDefs;

        setTimeout(() => {
          expect(component.columnDefinitions).toEqual(mockColDefs);
          expect(component.slickFooter).toBeUndefined();
          done();
        });
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
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);

        component.gridOptions.enableCheckboxSelector = true;
        component.gridOptions.presets = { rowSelection: { dataContextIds: selectedRowIds } };
        component.initialization(divContainer);
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
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);

        component.gridOptions.enableRowSelection = true;
        component.gridOptions.presets = { rowSelection: { gridRowIndexes: selectedGridRows } };
        component.dataset = mockData;
        component.isDatasetInitialized = false; // it won't call the preset unless we reset this flag
        component.initialization(divContainer);

        setTimeout(() => {
          expect(component.isDatasetInitialized).toBe(true);
          expect(selectRowSpy).toHaveBeenCalledWith(selectedGridRows);
          done();
        });
      });

      it('should NOT call the "setSelectedRows" when the Grid has Local Pagination and there are row selection presets with "dataContextIds" array set', (done) => {
        const selectedGridRows = [22];
        const mockData = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
        const selectRowSpy = jest.spyOn(mockGrid, 'setSelectedRows');
        jest.spyOn(mockGrid, 'getSelectionModel').mockReturnValue(true);

        component.gridOptions = {
          enableRowSelection: true,
          enablePagination: true,
          backendServiceApi: null,
          presets: { rowSelection: { dataContextIds: selectedGridRows } }
        };
        component.dataset = mockData;
        component.isDatasetInitialized = false; // it won't call the preset unless we reset this flag
        component.initialization(divContainer);

        setTimeout(() => {
          expect(component.isDatasetInitialized).toBe(true);
          expect(selectRowSpy).not.toHaveBeenCalled();
          done();
        }, 2);
      });
    });

    describe('onPaginationVisibilityChanged event', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should change "showPagination" flag when "onPaginationVisibilityChanged" from the Pagination Service is triggered', (done) => {
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = null;

        component.initialization(divContainer);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        eventPubSubService.publish('onPaginationVisibilityChanged', { visible: false });

        setTimeout(() => {
          expect(component.showPagination).toBeFalsy();
          done();
        });
      });

      it('should call the backend service API to refresh the dataset', (done) => {
        component.gridOptions.enablePagination = true;
        component.gridOptions.backendServiceApi = {
          service: mockGraphqlService,
          process: jest.fn(),
        };

        component.initialization(divContainer);
        component.refreshGridData([{ firstName: 'John', lastName: 'Doe' }]);
        eventPubSubService.publish('onPaginationVisibilityChanged', { visible: false });

        setTimeout(() => {
          expect(mockRefreshBackendDataset).toHaveBeenCalled();
          expect(component.showPagination).toBeFalsy();
          done();
        });
      });
    });

    describe('Tree Data View', () => {
      it('should throw an error when enableTreeData is enabled without passing a "columnId"', (done) => {
        try {
          component.gridOptions = { enableTreeData: true, treeDataOptions: {} } as GridOption;
          component.initialization(divContainer);

        } catch (e) {
          expect(e.toString()).toContain('[Slickgrid-Universal] When enabling tree data, you must also provide the "treeDataOption" property in your Grid Options with "childrenPropName" or "parentPropName"');
          component.dispose();
          done();
        }
      });

      it('should change flat dataset and expect  being called with other methods', () => {
        const mockFlatDataset = [{ id: 0, file: 'documents' }, { id: 1, file: 'vacation.txt', parentId: 0 }];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');

        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file', parentPropName: 'parentId', childrenPropName: 'files' } } as GridOption;
        component.initialization(divContainer);
        component.dataset = mockFlatDataset;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
      });

      it('should change hierarchical dataset and expect processTreeDataInitialSort being called with other methods', () => {
        const mockHierarchical = [{ file: 'documents', files: [{ file: 'vacation.txt' }] }];
        const hierarchicalSpy = jest.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const clearFilterSpy = jest.spyOn(filterServiceStub, 'clearFilters');
        const setItemsSpy = jest.spyOn(mockDataView, 'setItems');
        const processSpy = jest.spyOn(sortServiceStub, 'processTreeDataInitialSort');

        component.gridOptions = { enableTreeData: true, treeDataOptions: { columnId: 'file' } } as GridOption;
        component.initialization(divContainer);
        component.datasetHierarchical = mockHierarchical;

        expect(hierarchicalSpy).toHaveBeenCalledWith(mockHierarchical);
        expect(clearFilterSpy).toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
        expect(setItemsSpy).toHaveBeenCalledWith([], 'id');
      });
    });
  });
});
