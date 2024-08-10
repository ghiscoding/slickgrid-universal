import 'jest-extended';

import {
  type BackendUtilityService,
  type Column,
  type CollectionService,
  type ExtensionService,
  type ExtensionUtility,
  type FilterService,
  type GridEventService,
  type GridOption,
  type GridService,
  type GridStateService,
  type GroupingAndColspanService,
  type OnRowCountChangedEventArgs,
  type OnRowsChangedEventArgs,
  type OnSetItemsCalledEventArgs,
  type PaginationService,
  type ResizerService,
  SharedService,
  type SlickDataView,
  type SlickEditorLock,
  type SlickEventHandler,
  type SlickGrid,
  type SortService,
  type TreeDataService,
  type TranslaterService,
} from '@slickgrid-universal/common';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { TextExportService } from '@slickgrid-universal/text-export';
import { UniversalContainerService } from '@slickgrid-universal/vanilla-bundle';

import { VanillaForceGridBundle } from '../vanilla-force-bundle';
import { TranslateServiceStub } from '../../../../test/translateServiceStub';
import { MockSlickEvent, MockSlickEventHandler } from '../../../../test/mockSlickEvent';
import { RxJsResourceStub } from '../../../../test/rxjsResourceStub';

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
  onSetOptions: new MockSlickEvent(),
  onRendered: jest.fn(),
  onScroll: jest.fn(),
  onDataviewCreated: new MockSlickEvent(),
} as unknown as SlickGrid;

const mockSlickCustomTooltip = {
  init: jest.fn(),
} as unknown as SlickCustomTooltip;

jest.mock('@slickgrid-universal/custom-tooltip-plugin', () => ({
  SlickCustomTooltip: jest.fn().mockImplementation(() => mockSlickCustomTooltip),
}));

const mockTextExportService = {
  init: jest.fn(),
} as unknown as TextExportService;

jest.mock('@slickgrid-universal/text-export', () => ({
  TextExportService: jest.fn().mockImplementation(() => mockTextExportService),
}));

const template = `<div class="demo-container"><div class="grid1"></div></div>`;
const slickEventHandler = new MockSlickEventHandler() as unknown as SlickEventHandler;

jest.mock('@slickgrid-universal/common', () => ({
  ...(jest.requireActual('@slickgrid-universal/common') as any),
  autoAddEditorFormatterToColumnsWithEditor: jest.fn(),
  SlickGrid: jest.fn().mockImplementation(() => mockGrid),
  SlickEventHandler: jest.fn().mockImplementation(() => mockSlickEventHandler),
  SlickDataView: jest.fn().mockImplementation(() => mockDataView),
}));

describe('Vanilla-Force-Grid-Bundle Component instantiated via Constructor', () => {
  let component: VanillaForceGridBundle;
  let divContainer: HTMLDivElement;
  let cellDiv: HTMLDivElement;
  let columnDefinitions: Column[];
  let gridOptions: GridOption;
  let sharedService: SharedService;
  let eventPubSubService: EventPubSubService;
  let translateService: TranslateServiceStub;
  const container = new UniversalContainerService();
  let dataset = [];

  beforeEach(() => {
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

    component = new VanillaForceGridBundle(
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

  describe('initialization method', () => {
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

    describe('flag checks', () => {
      afterEach(() => {
        jest.clearAllMocks();
        // component.dispose();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should initialize groupingAndColspanService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is disabled', () => {
        const spy = jest.spyOn(groupingAndColspanServiceStub, 'init');

        component.gridOptions = { createPreHeaderPanel: true, enableDraggableGrouping: false } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        // @ts-ignore
        expect(spy).toHaveBeenCalledWith(mockGrid, container);
      });

      it('should call "translateColumnHeaders" from ExtensionService when "enableTranslate" is set', () => {
        const spy = jest.spyOn(extensionServiceStub, 'translateColumnHeaders');

        component.gridOptions = { enableTranslate: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(spy).toHaveBeenCalled();
      });

      it('should initialize SlickCompositeEditorComponent when "enableCompositeEditor" is set', () => {
        component.gridOptions = { enableCompositeEditor: true, useSalesforceDefaultGridOptions: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(component.slickCompositeEditor instanceof SlickCompositeEditorComponent).toBeTrue();
      });

      it('should initialize ExportService when "enableTextExport" is set when using Salesforce', () => {
        component.gridOptions = { enableTextExport: true, useSalesforceDefaultGridOptions: true } as unknown as GridOption;
        component.resetExternalResources();
        component.initialization(divContainer, slickEventHandler);

        expect(TextExportService).toHaveBeenCalled();
        expect(SlickCustomTooltip).toHaveBeenCalled();
        expect(component.registeredResources.length).toBe(6); // ExcelExportService, TextExportService, SlickCustomTooltip, GridService, GridStateService, SlickEmptyCompositeEditorComponent
      });

      it('should add RxJS resource to all necessary Services when RxJS external resource is registered', () => {
        const rxjsMock = new RxJsResourceStub();
        const backendUtilitySpy = jest.spyOn(backendUtilityServiceStub, 'addRxJsResource');
        const filterServiceSpy = jest.spyOn(filterServiceStub, 'addRxJsResource');
        const sortServiceSpy = jest.spyOn(sortServiceStub, 'addRxJsResource');
        const paginationServiceSpy = jest.spyOn(paginationServiceStub, 'addRxJsResource');

        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.registerExternalResources([rxjsMock], true);
        component.initialization(divContainer, slickEventHandler);

        expect(backendUtilitySpy).toHaveBeenCalled();
        expect(filterServiceSpy).toHaveBeenCalled();
        expect(sortServiceSpy).toHaveBeenCalled();
        expect(paginationServiceSpy).toHaveBeenCalled();
        expect(component.registeredResources.length).toBe(5); // RxJsResourceStub, GridService, GridStateService, CustomTooltip, SlickEmptyCompositeEditorComponent
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
        jest.spyOn(mockDataView, 'getItems').mockReturnValueOnce(mockData);
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

    describe('Tree Data View', () => {
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
    });
  });
});
