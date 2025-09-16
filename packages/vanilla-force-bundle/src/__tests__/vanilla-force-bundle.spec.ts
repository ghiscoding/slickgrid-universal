import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  type HeaderGroupingService,
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

import { VanillaForceGridBundle } from '../vanilla-force-bundle.js';
import { TranslateServiceStub } from '../../../../test/translateServiceStub.js';
import { MockSlickEvent, MockSlickEventHandler } from '../../../../test/mockSlickEvent.js';
import { RxJsResourceStub } from '../../../../test/rxjsResourceStub.js';

vi.useFakeTimers();

// mocked modules
vi.mock('@slickgrid-universal/common', async (importOriginal) => ({
  ...((await importOriginal()) as any),
  applyHtmlToElement: (elm: HTMLElement, val: any) => {
    elm.innerHTML = `${val || ''}`;
  },
}));

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
Object.defineProperty(extensionServiceStub, 'extensionList', { get: vi.fn(() => {}), set: vi.fn(), configurable: true });

const mockExtensionUtility = {
  translateItems: vi.fn(),
} as unknown as ExtensionUtility;

const headerGroupingServiceStub = {
  init: vi.fn(),
  dispose: vi.fn(),
  translateHeaderGrouping: vi.fn(),
} as unknown as HeaderGroupingService;

const backendUtilityServiceStub = {
  addRxJsResource: vi.fn(),
  executeBackendProcessesCallback: vi.fn(),
  executeBackendCallback: vi.fn(),
  onBackendError: vi.fn(),
  refreshBackendDataset: vi.fn(),
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
  set: vi.fn(),
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
  autosizeColumns: vi.fn(),
  destroy: vi.fn(),
  init: vi.fn(),
  invalidate: vi.fn(),
  getActiveCellNode: vi.fn(),
  getColumns: vi.fn(),
  getCellEditor: vi.fn(),
  getEditorLock: () => mockGetEditorLock,
  getUID: () => 'slickgrid_12345',
  getContainerNode: vi.fn(),
  getFrozenColumnId: vi.fn(),
  getGridPosition: vi.fn(),
  getOptions: vi.fn(),
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
  onScroll: vi.fn(),
  onDataviewCreated: new MockSlickEvent(),
} as unknown as SlickGrid;

const mockSlickCustomTooltip = {
  init: vi.fn(),
} as unknown as SlickCustomTooltip;

vi.mock('@slickgrid-universal/custom-tooltip-plugin', () => ({
  SlickCustomTooltip: vi.fn().mockImplementation(function () {
    return mockSlickCustomTooltip;
  }),
}));

const mockTextExportService = {
  init: vi.fn(),
} as unknown as TextExportService;

vi.mock('@slickgrid-universal/text-export', () => ({
  TextExportService: vi.fn().mockImplementation(function () {
    return mockTextExportService;
  }),
}));

const template = `<div class="demo-container"><div class="grid1"></div></div>`;
const slickEventHandler = new MockSlickEventHandler() as unknown as SlickEventHandler;

vi.mock('@slickgrid-universal/common', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    autoAddEditorFormatterToColumnsWithEditor: vi.fn(),
    SlickGrid: vi.fn().mockImplementation(function () {
      return mockGrid;
    }),
    SlickEventHandler: vi.fn().mockImplementation(function () {
      return mockSlickEventHandler;
    }),
    SlickDataView: vi.fn().mockImplementation(function () {
      return mockDataView;
    }),
  };
});

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
  let dataset: any[] = [];

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
    vi.spyOn(mockGrid, 'getOptions').mockReturnValue(gridOptions);
    dataset = [];

    component = new VanillaForceGridBundle(divContainer, columnDefinitions, gridOptions, dataset, undefined, {
      backendUtilityService: backendUtilityServiceStub,
      collectionService: collectionServiceStub,
      eventPubSubService,
      extensionService: extensionServiceStub,
      extensionUtility: mockExtensionUtility,
      filterService: filterServiceStub,
      gridEventService: gridEventServiceStub,
      gridService: gridServiceStub,
      gridStateService: gridStateServiceStub,
      headerGroupingService: headerGroupingServiceStub,
      paginationService: paginationServiceStub,
      resizerService: resizerServiceStub,
      sharedService,
      sortService: sortServiceStub,
      treeDataService: treeDataServiceStub,
      translaterService: translateService as unknown as TranslaterService,
      universalContainerService: container,
    });
  });

  afterEach(() => {
    component?.dispose();
  });

  it('should make sure SlickVanillaGridBundle is defined', () => {
    expect(component).toBeTruthy();
    expect(component.isGridInitialized).toBeTruthy();
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

  describe('initialization method', () => {
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
        const mockData = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ];
        const mockGridOptions = { autoCommitEdit: false, autoResize: null as any };

        component.gridOptions = mockGridOptions;
        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        expect(component.gridOptions.autoCommitEdit).toEqual(false);
        expect(setOptionSpy).toHaveBeenCalledWith(mockGridOptions, false, true);
        expect(sharedOptionSpy).toHaveBeenCalledWith(mockGridOptions);
      });

      it('should merge grid options with global options and expect bottom padding to be calculated', () => {
        mockGrid.getOptions = () => null as any;
        const setOptionSpy = vi.spyOn(mockGrid, 'setOptions');
        const sharedOptionSpy = vi.spyOn(SharedService.prototype, 'gridOptions', 'set');
        const mockData = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ];
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

    describe('flag checks', () => {
      afterEach(() => {
        vi.clearAllMocks();
        // component.dispose();
        sharedService.slickGrid = mockGrid as unknown as SlickGrid;
      });

      it('should initialize HeaderGroupingService when "createPreHeaderPanel" grid option is enabled and "enableDraggableGrouping" is disabled', () => {
        const spy = vi.spyOn(headerGroupingServiceStub, 'init');

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

      it('should initialize SlickCompositeEditorComponent when "enableCompositeEditor" is set', () => {
        component.gridOptions = { enableCompositeEditor: true, useSalesforceDefaultGridOptions: true } as unknown as GridOption;
        component.initialization(divContainer, slickEventHandler);

        expect(component.slickCompositeEditor instanceof SlickCompositeEditorComponent).toBe(true);
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
        const backendUtilitySpy = vi.spyOn(backendUtilityServiceStub, 'addRxJsResource');
        const filterServiceSpy = vi.spyOn(filterServiceStub, 'addRxJsResource');
        const sortServiceSpy = vi.spyOn(sortServiceStub, 'addRxJsResource');
        const paginationServiceSpy = vi.spyOn(paginationServiceStub, 'addRxJsResource');

        component.gridOptions = { externalResources: [rxjsMock] } as unknown as GridOption;
        component.registerExternalResources([rxjsMock], true);
        component.initialization(divContainer, slickEventHandler);

        expect(backendUtilitySpy).toHaveBeenCalled();
        expect(filterServiceSpy).toHaveBeenCalled();
        expect(sortServiceSpy).toHaveBeenCalled();
        expect(paginationServiceSpy).toHaveBeenCalled();
        expect(component.registeredResources.length).toBe(5); // RxJsResourceStub, GridService, GridStateService, CustomTooltip, SlickEmptyCompositeEditorComponent
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

        const mockData = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ];
        vi.spyOn(mockDataView, 'getItems').mockReturnValueOnce(mockData);
        component.gridOptions = {
          enablePagination: true,
          presets: { pagination: { pageSize: 2, pageNumber: expectedPageNumber } },
        };
        component.paginationOptions = undefined;
        component.paginationOptions = { pageSize: 2, pageNumber: 2, pageSizes: [2, 10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        vi.runAllTimers();

        expect(component.paginationOptions!.pageSize).toBe(2);
        expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
        expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
      });

      it('should refresh a local grid defined and change pagination options pagination when a preset is defined in grid options and total rows is different when Filters are applied', () => {
        const expectedPageNumber = 3;
        const expectedTotalItems = 2;
        const refreshSpy = vi.spyOn(component, 'refreshGridData');
        const getPagingSpy = vi
          .spyOn(mockDataView, 'getPagingInfo')
          .mockReturnValue({ pageNum: 1, totalRows: expectedTotalItems, pageSize: 10, totalPages: 15, dataView: mockDataView });

        const mockData = [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
        ];
        component.gridOptions = {
          enableFiltering: true,
          enablePagination: true,
          presets: { pagination: { pageSize: 10, pageNumber: expectedPageNumber } },
        };
        component.paginationOptions = { pageSize: 10, pageNumber: 2, pageSizes: [10, 25, 50], totalItems: 100 };

        component.initialization(divContainer, slickEventHandler);
        component.dataset = mockData;

        vi.runAllTimers();

        expect(getPagingSpy).toHaveBeenCalled();
        expect(component.paginationOptions!.pageSize).toBe(10);
        expect(component.paginationOptions!.pageNumber).toBe(expectedPageNumber);
        expect(component.paginationOptions!.totalItems).toBe(expectedTotalItems);
        expect(refreshSpy).toHaveBeenCalledWith(mockData);
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

    describe('Tree Data View', () => {
      afterEach(() => {
        component.dispose();
        vi.clearAllMocks();
      });

      it('should change flat dataset and expect "convertFlatParentChildToTreeDatasetAndSort" being called with other methods', () => {
        const mockFlatDataset = [
          { id: 0, file: 'documents' },
          { id: 1, file: 'vacation.txt', parentId: 0 },
        ];
        const mockHierarchical = [{ id: 0, file: 'documents', files: [{ id: 1, file: 'vacation.txt' }] }];
        const hierarchicalSpy = vi.spyOn(SharedService.prototype, 'hierarchicalDataset', 'set');
        const treeConvertAndSortSpy = vi
          .spyOn(treeDataServiceStub, 'convertFlatParentChildToTreeDatasetAndSort')
          .mockReturnValue({ hierarchical: mockHierarchical as any[], flat: mockFlatDataset as any[] });
        const refreshTreeSpy = vi.spyOn(filterServiceStub, 'refreshTreeDataFilters');

        component.gridOptions = {
          enableTreeData: true,
          treeDataOptions: {
            columnId: 'file',
            parentPropName: 'parentId',
            childrenPropName: 'files',
            initialSort: { columndId: 'file', direction: 'ASC' },
          },
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
