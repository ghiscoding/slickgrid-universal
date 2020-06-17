import 'slickgrid/lib/jquery.event.drag-2.3.0';
import 'slickgrid/lib/jquery.mousewheel';
import 'slickgrid/slick.core';
import 'slickgrid/slick.grid';
import 'slickgrid/slick.dataview';
import 'slickgrid/plugins/slick.resizer';
import {
  BackendServiceApi,
  Column,
  ColumnEditor,
  ExtensionName,
  EventNamingStyle,
  GlobalGridOptions,
  GridOption,
  Metrics,
  SlickDataView,
  SlickEventHandler,
  SlickGrid,
  SlickGroupItemMetadataProvider,
  SlickNamespace,
  TreeDataOption,

  // extensions
  AutoTooltipExtension,
  CheckboxSelectorExtension,
  CellExternalCopyManagerExtension,
  CellMenuExtension,
  ColumnPickerExtension,
  ContextMenuExtension,
  DraggableGroupingExtension,
  ExtensionUtility,
  GridMenuExtension,
  GroupItemMetaProviderExtension,
  HeaderMenuExtension,
  HeaderButtonExtension,
  RowSelectionExtension,
  SlickResizer,

  // services
  FilterFactory,
  CollectionService,
  ExtensionService,
  FilterService,
  GridEventService,
  GridService,
  GridStateService,
  GroupingAndColspanService,
  PaginationService,
  RowMoveManagerExtension,
  SharedService,
  SortService,
  SlickgridConfig,
  TreeDataService,

  convertParentChildArrayToHierarchicalView,
  GetSlickEventType,
} from '@slickgrid-universal/common';

import { FileExportService } from './services/fileExport.service';
import { TranslateService } from './services/translate.service';
import { EventPubSubService } from './services/eventPubSub.service';
import { FooterService } from './services/footer.service';
import { PaginationRenderer } from './pagination.renderer';
import { SalesforceGlobalGridOptions } from './salesforce-global-grid-options';

// using external non-typed js libraries
declare const Slick: SlickNamespace;
declare const $: any;
const DATAGRID_FOOTER_HEIGHT = 20;

export class VanillaGridBundle {
  private _columnDefinitions: Column[];
  private _gridOptions: GridOption;
  private _dataset: any[];
  private _gridContainerElm: Element;
  private _hideHeaderRowAfterPageLoad = false;
  private _isDatasetInitialized = false;
  private _isGridInitialized = false;
  private _isGridHavingFilters = false;
  private _isLocalGrid = true;
  private _eventHandler: SlickEventHandler = new Slick.EventHandler();
  private _eventPubSubService: EventPubSubService;
  private _slickgridInitialized = false;
  backendServiceApi: BackendServiceApi | undefined;
  dataView: SlickDataView;
  grid: SlickGrid;
  metrics: Metrics;
  customDataView = false;
  groupItemMetadataProvider: SlickGroupItemMetadataProvider;
  resizerPlugin: SlickResizer;

  // extensions
  extensionUtility: ExtensionUtility;
  autoTooltipExtension: AutoTooltipExtension;
  cellExternalCopyManagerExtension: CellExternalCopyManagerExtension;
  cellMenuExtension: CellMenuExtension;
  contextMenuExtension: ContextMenuExtension;
  columnPickerExtension: ColumnPickerExtension;
  checkboxExtension: CheckboxSelectorExtension;
  draggableGroupingExtension: DraggableGroupingExtension;
  gridMenuExtension: GridMenuExtension;
  groupItemMetaProviderExtension: GroupItemMetaProviderExtension;
  headerButtonExtension: HeaderButtonExtension;
  headerMenuExtension: HeaderMenuExtension;
  rowMoveManagerExtension: RowMoveManagerExtension;
  rowSelectionExtension: RowSelectionExtension;

  // services
  collectionService: CollectionService;
  extensionService: ExtensionService;
  filterService: FilterService;
  footerService: FooterService;
  gridEventService: GridEventService;
  gridService: GridService;
  gridStateService: GridStateService;
  groupingAndColspanService: GroupingAndColspanService;
  paginationService: PaginationService;
  sharedService: SharedService;
  sortService: SortService;
  translateService: TranslateService;
  treeDataService: TreeDataService;

  paginationRenderer: PaginationRenderer;
  gridClass: string;
  gridClassName: string;

  get columnDefinitions() {
    return this._columnDefinitions;
  }
  set columnDefinitions(columnDefinitions) {
    this._columnDefinitions = columnDefinitions;
    if (this._slickgridInitialized) {
      this.updateColumnDefinitionsList(this._columnDefinitions);
    }
  }

  get dataset(): any[] {
    return this._dataset;
  }
  set dataset(dataset: any[]) {
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions && this._gridOptions.enableDeepCopyDatasetOnPageLoad);
    const data = isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], dataset) : dataset;
    this._dataset = data || [];
    this.refreshGridData(this._dataset);
  }

  get datasetHierarchical(): any[] {
    return this.sharedService.hierarchicalDataset;
  }

  set datasetHierarchical(hierarchicalDataset: any[]) {
    this.sharedService.hierarchicalDataset = hierarchicalDataset;

    if (this.filterService && this.filterService.clearFilters) {
      this.filterService.clearFilters();
    }

    // when a hierarchical dataset is set afterward, we can reset the flat dataset and call a tree data sort that will overwrite the flat dataset
    if (this.sortService && this.sortService.processTreeDataInitialSort) {
      this.dataView.setItems([], this._gridOptions.datasetIdPropertyName);
      this.sortService.processTreeDataInitialSort();
    }
  }

  get gridOptions(): GridOption {
    return this._gridOptions;
  }

  set gridOptions(options: GridOption) {
    let mergedOptions: GridOption;

    // if we already have grid options, when grid was already initialized, we'll merge with those options
    // else we'll merge with global grid options
    if (this.grid && this.grid.getOptions) {
      mergedOptions = $.extend(true, {}, this.grid.getOptions(), options);
    } else {
      mergedOptions = this.mergeGridOptions(options);
    }
    if (this.sharedService?.gridOptions && this.grid && this.grid.setOptions) {
      this.sharedService.gridOptions = mergedOptions;
      this.grid.setOptions(mergedOptions);
    }
    this._gridOptions = mergedOptions;
  }

  constructor(gridContainerElm: Element, columnDefs?: Column[], options?: GridOption, dataset?: any[], hierarchicalDataset?: any[]) {
    // make sure that the grid container has the "slickgrid-container" css class exist since we use it for slickgrid styling
    gridContainerElm.classList.add('slickgrid-container');

    this._dataset = [];
    this._columnDefinitions = columnDefs || [];
    this._gridOptions = this.mergeGridOptions(options || {});
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions && this._gridOptions.enableDeepCopyDatasetOnPageLoad);
    this._eventPubSubService = new EventPubSubService(gridContainerElm);
    this._eventPubSubService.eventNamingStyle = this._gridOptions && this._gridOptions.eventNamingStyle || EventNamingStyle.camelCase;

    this.gridEventService = new GridEventService();
    const slickgridConfig = new SlickgridConfig();
    this.sharedService = new SharedService();
    this.translateService = new TranslateService();
    this.collectionService = new CollectionService(this.translateService);
    this.footerService = new FooterService(this.sharedService, this.translateService);
    const filterFactory = new FilterFactory(slickgridConfig, this.collectionService, this.translateService);
    this.filterService = new FilterService(filterFactory, this._eventPubSubService, this.sharedService);
    this.sortService = new SortService(this.sharedService, this._eventPubSubService);
    this.treeDataService = new TreeDataService(this.sharedService);
    this.extensionUtility = new ExtensionUtility(this.sharedService, this.translateService);
    this.autoTooltipExtension = new AutoTooltipExtension(this.extensionUtility, this.sharedService);
    this.cellExternalCopyManagerExtension = new CellExternalCopyManagerExtension(this.extensionUtility, this.sharedService);
    this.cellMenuExtension = new CellMenuExtension(this.extensionUtility, this.sharedService, this.translateService);
    this.contextMenuExtension = new ContextMenuExtension(this.extensionUtility, this.sharedService, this.translateService, this.treeDataService);
    this.columnPickerExtension = new ColumnPickerExtension(this.extensionUtility, this.sharedService);
    this.checkboxExtension = new CheckboxSelectorExtension(this.extensionUtility, this.sharedService);
    this.draggableGroupingExtension = new DraggableGroupingExtension(this.extensionUtility, this.sharedService);
    this.gridMenuExtension = new GridMenuExtension(this.extensionUtility, this.filterService, this.sharedService, this.sortService, this.translateService);
    this.groupItemMetaProviderExtension = new GroupItemMetaProviderExtension(this.sharedService);
    this.headerButtonExtension = new HeaderButtonExtension(this.extensionUtility, this.sharedService);
    this.headerMenuExtension = new HeaderMenuExtension(this.extensionUtility, this.filterService, this._eventPubSubService, this.sharedService, this.sortService, this.translateService);
    this.rowMoveManagerExtension = new RowMoveManagerExtension(this.extensionUtility, this.sharedService);
    this.rowSelectionExtension = new RowSelectionExtension(this.extensionUtility, this.sharedService);
    this.gridService = new GridService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService);
    this.gridStateService = new GridStateService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService);
    this.paginationService = new PaginationService(this._eventPubSubService, this.sharedService);
    this.extensionService = new ExtensionService(
      this.autoTooltipExtension,
      this.cellExternalCopyManagerExtension,
      this.cellMenuExtension,
      this.checkboxExtension,
      this.columnPickerExtension,
      this.contextMenuExtension,
      this.draggableGroupingExtension,
      this.gridMenuExtension,
      this.groupItemMetaProviderExtension,
      this.headerButtonExtension,
      this.headerMenuExtension,
      this.rowMoveManagerExtension,
      this.rowSelectionExtension,
      this.sharedService,
      this.translateService,
    );
    this.groupingAndColspanService = new GroupingAndColspanService(this.extensionUtility, this.extensionService);

    if (hierarchicalDataset) {
      this.sharedService.hierarchicalDataset = (isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], hierarchicalDataset) : hierarchicalDataset) || [];
    }
    this.initialization(gridContainerElm);
    if (!hierarchicalDataset) {
      this.dataset = dataset || [];
    }
    if (this.columnDefinitions.findIndex((col) => col.filterable) > -1) {
      this._isGridHavingFilters = true;
    }
  }

  dispose() {
    this._gridOptions = {};
    this.extensionService?.dispose();
    this.filterService?.dispose();
    this.gridEventService?.dispose();
    this.gridStateService?.dispose();
    this.groupingAndColspanService?.dispose();
    // this.paginationService?.dispose();
    // this.resizer?.dispose();
    this.sortService?.dispose();
    this.treeDataService?.dispose();

    this._eventHandler?.unsubscribeAll();
    this._eventPubSubService?.unsubscribeAll();
    this.grid?.destroy();
  }

  async initialization(gridContainerElm: Element) {
    // create the slickgrid container and add it to the user's grid container
    this._gridContainerElm = gridContainerElm;

    this._gridOptions = this.mergeGridOptions(this._gridOptions);
    this.backendServiceApi = this._gridOptions && this._gridOptions.backendServiceApi;
    this._isLocalGrid = !this.backendServiceApi; // considered a local grid if it doesn't have a backend service set
    this._eventPubSubService.eventNamingStyle = this._gridOptions && this._gridOptions.eventNamingStyle || EventNamingStyle.camelCase;
    this.sharedService.internalPubSubService = this._eventPubSubService;
    this._eventHandler = new Slick.EventHandler();
    const dataviewInlineFilters = this._gridOptions?.dataView?.inlineFilters ?? false;
    if (!this.customDataView) {
      if (this._gridOptions.draggableGrouping || this._gridOptions.enableGrouping) {
        this.extensionUtility.loadExtensionDynamically(ExtensionName.groupItemMetaProvider);
        this.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
        this.sharedService.groupItemMetadataProvider = this.groupItemMetadataProvider;
        this.dataView = new Slick.Data.DataView({ groupItemMetadataProvider: this.groupItemMetadataProvider, inlineFilters: dataviewInlineFilters });
      } else {
        this.dataView = new Slick.Data.DataView({ inlineFilters: dataviewInlineFilters });
      }
      this._eventPubSubService.publish('onDataviewCreated', this.dataView);
    }
    this.sharedService.allColumns = this._columnDefinitions;
    this.sharedService.visibleColumns = this._columnDefinitions;
    this.extensionService.createExtensionsBeforeGridCreation(this._columnDefinitions, this._gridOptions);

    this._columnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(this._columnDefinitions);
    this.grid = new Slick.Grid(gridContainerElm, this.dataView, this._columnDefinitions, this._gridOptions);
    this.sharedService.dataView = this.dataView;
    this.sharedService.grid = this.grid;

    this.extensionService.bindDifferentExtensions();
    this.bindDifferentHooks(this.grid, this._gridOptions, this.dataView);
    this._slickgridInitialized = true;

    // initialize the SlickGrid grid
    this.grid.init();

    // load the data in the DataView (unless it's a hierarchical dataset, if so it will be loaded after the initial tree sort)
    if (Array.isArray(this.dataset) && !this.datasetHierarchical) {
      this.dataView.setItems(this.dataset, this._gridOptions.datasetIdPropertyName);
    }

    if (this._gridOptions && this._gridOptions.enableTreeData) {
      if (!this._gridOptions.treeDataOptions || !this._gridOptions.treeDataOptions.columnId) {
        throw new Error('[Slickgrid-Universal] When enabling tree data, you must also provide the "treeDataOption" property in your Grid Options with "childrenPropName" or "parentPropName" (depending if your array is hierarchical or flat) for the Tree Data to work properly');
      }

      // anytime the flat dataset changes, we need to update our hierarchical dataset
      // this could be triggered by a DataView setItems or updateItem
      const onRowsChangedHandler = this.dataView.onRowsChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsChangedHandler>>).subscribe(onRowsChangedHandler, () => {
        const items = this.dataView.getItems();
        if (items.length > 0 && !this._isDatasetInitialized) {
          this.sharedService.hierarchicalDataset = this.treeDataSortComparer(items);
        }
      });
    }

    // if you don't want the items that are not visible (due to being filtered out or being on a different page)
    // to stay selected, pass 'false' to the second arg
    const selectionModel = this.grid && this.grid.getSelectionModel();
    if (selectionModel && this._gridOptions && this._gridOptions.dataView && this._gridOptions.dataView.hasOwnProperty('syncGridSelection')) {
      // if we are using a Backend Service, we will do an extra flag check, the reason is because it might have some unintended behaviors
      // with the BackendServiceApi because technically the data in the page changes the DataView on every page change.
      let preservedRowSelectionWithBackend = false;
      if (this._gridOptions.backendServiceApi && this._gridOptions.dataView.hasOwnProperty('syncGridSelectionWithBackendService')) {
        preservedRowSelectionWithBackend = this._gridOptions.dataView.syncGridSelectionWithBackendService as boolean;
      }

      const syncGridSelection = this._gridOptions.dataView.syncGridSelection;
      if (typeof syncGridSelection === 'boolean') {
        let preservedRowSelection = syncGridSelection;
        if (!this._isLocalGrid) {
          // when using BackendServiceApi, we'll be using the "syncGridSelectionWithBackendService" flag BUT "syncGridSelection" must also be set to True
          preservedRowSelection = syncGridSelection && preservedRowSelectionWithBackend;
        }
        this.dataView.syncGridSelection(this.grid, preservedRowSelection);
      } else if (typeof syncGridSelection === 'object') {
        this.dataView.syncGridSelection(this.grid, syncGridSelection.preserveHidden, syncGridSelection.preserveHiddenOnSelectionChange);
      }
    }

    this.grid.invalidate();

    if (this._dataset.length > 0) {
      // if (!this._isDatasetInitialized && (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)) {
      //   this.loadRowSelectionPresetWhenExists();
      // }
      this._isDatasetInitialized = true;
    }

    // user could show a custom footer with the data metrics (dataset length and last updated timestamp)
    const customFooterElm = this.footerService.optionallyShowCustomFooterWithMetrics(this.metrics);
    if (customFooterElm) {
      $(customFooterElm).appendTo($(this._gridContainerElm).parent());
    }

    // user could show pagination
    // if (this._gridOptions.enablePagination) {
    //   this.paginationRenderer = new PaginationRenderer();
    //   const paginationElm = this.paginationRenderer.renderPagination();
    //   if (paginationElm) {
    //     $(paginationElm).appendTo($(this._gridContainerElm).parent());
    //   }
    // }

    const fixedGridDimensions = (this._gridOptions?.gridHeight || this._gridOptions?.gridWidth) ? { height: this._gridOptions?.gridHeight, width: this._gridOptions?.gridWidth } : undefined;
    const autoResizeOptions = this._gridOptions?.autoResize ?? { bottomPadding: 0 };
    if (autoResizeOptions && autoResizeOptions.bottomPadding !== undefined) {
      autoResizeOptions.bottomPadding += this._gridOptions?.customFooterOptions?.footerHeight ?? DATAGRID_FOOTER_HEIGHT;
    }
    this.resizerPlugin = new Slick.Plugins.Resizer(autoResizeOptions, fixedGridDimensions);
    this.grid.registerPlugin<SlickResizer>(this.resizerPlugin);
    if (this._gridOptions.enableAutoResize) {
      await this.resizerPlugin.resizeGrid();
    }

    // user might want to hide the header row on page load but still have `enableFiltering: true`
    // if that is the case, we need to hide the headerRow ONLY AFTER all filters got created & dataView exist
    if (this._hideHeaderRowAfterPageLoad) {
      this.showHeaderRow(false);
      this.sharedService.hideHeaderRowAfterPageLoad = this._hideHeaderRowAfterPageLoad;
    }

    // on cell click, mainly used with the columnDef.action callback
    this.gridEventService.bindOnBeforeEditCell(this.grid, this.dataView);
    this.gridEventService.bindOnCellChange(this.grid, this.dataView);
    this.gridEventService.bindOnClick(this.grid, this.dataView);

    // get any possible Services that user want to register
    const registeringServices: any[] = this._gridOptions.registerExternalServices || [];

    // when using Salesforce, we want the Export to CSV always enabled without registering it
    if (this._gridOptions.enableExport && this._gridOptions.useSalesforceDefaultGridOptions) {
      const fileExportService = new FileExportService();
      registeringServices.push(fileExportService);
    }

    // at this point, we consider all the registered services as external services, anything else registered afterward aren't external
    if (Array.isArray(registeringServices)) {
      this.sharedService.externalRegisteredServices = registeringServices;
    }

    // push all other Services that we want to be registered
    registeringServices.push(this.gridService, this.gridStateService);

    // when using Grouping/DraggableGrouping/Colspan register its Service
    if (this._gridOptions.createPreHeaderPanel && !this._gridOptions.enableDraggableGrouping) {
      registeringServices.push(this.groupingAndColspanService);
    }

    // when using Tree Data View, register its Service
    if (this._gridOptions.enableTreeData) {
      registeringServices.push(this.treeDataService);
    }

    // bind & initialize all Services that were tagged as enable
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(registeringServices)) {
      for (const service of registeringServices) {
        if (typeof service.init === 'function') {
          service.init(this.grid, this.sharedService);
        }
      }
    }

    // Pagination Service
    // this.paginationService.init(this.grid)

    const slickerElementInstance = {
      // Slick Grid & DataView objects
      dataView: this.dataView,
      slickGrid: this.grid,

      // return all available Services (non-singleton)
      filterService: this.filterService,
      gridEventService: this.gridEventService,
      gridStateService: this.gridStateService,
      gridService: this.gridService,
      groupingService: this.groupingAndColspanService,
      extensionService: this.extensionService,
      extensionUtility: this.extensionUtility,
      paginationService: this.paginationService,
      sortService: this.sortService,
      treeDataService: this.treeDataService,
    };

    this._eventPubSubService.publish('onSlickerGridCreated', slickerElementInstance);
    this._isGridInitialized = true;
  }

  mergeGridOptions(gridOptions: GridOption) {
    const extraOptions = (gridOptions.useSalesforceDefaultGridOptions || (this._gridOptions && this._gridOptions.useSalesforceDefaultGridOptions)) ? SalesforceGlobalGridOptions : {};
    const options = $.extend(true, {}, GlobalGridOptions, extraOptions, gridOptions);

    // also make sure to show the header row if user have enabled filtering
    this._hideHeaderRowAfterPageLoad = (options.showHeaderRow === false);
    if (options.enableFiltering && !options.showHeaderRow) {
      options.showHeaderRow = options.enableFiltering;
    }

    // using jQuery extend to do a deep clone has an unwanted side on objects and pageSizes but ES6 spread has other worst side effects
    // so we will just overwrite the pageSizes when needed, this is the only one causing issues so far.
    // jQuery wrote this on their docs:: On a deep extend, Object and Array are extended, but object wrappers on primitive types such as String, Boolean, and Number are not.
    if (gridOptions.enablePagination && gridOptions.pagination && Array.isArray(gridOptions.pagination.pageSizes)) {
      options.pagination.pageSizes = gridOptions.pagination.pageSizes;
    }

    // when we use Pagination on Local Grid, it doesn't seem to work without enableFiltering
    // so we'll enable the filtering but we'll keep the header row hidden
    if (!options.enableFiltering && options.enablePagination && this._isLocalGrid) {
      options.enableFiltering = true;
      options.showHeaderRow = false;
      this._hideHeaderRowAfterPageLoad = true;
      if (this.sharedService) {
        this.sharedService.hideHeaderRowAfterPageLoad = true;
      }
    }

    return options;
  }

  bindDifferentHooks(grid: SlickGrid, gridOptions: GridOption, dataView: SlickDataView) {
    // bind external filter (backend) when available or default onFilter (dataView)
    if (gridOptions.enableFiltering && !this.customDataView) {
      this.filterService.init(grid);

      // if user entered some Filter "presets", we need to reflect them all in the DOM
      // if (gridOptions.presets && Array.isArray(gridOptions.presets.filters) && gridOptions.presets.filters.length > 0) {
      //   this.filterService.populateColumnFilterSearchTermPresets(gridOptions.presets.filters);
      // }
      // bind external filter (backend) unless specified to use the local one
      if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalFiltering) {
        this.filterService.bindBackendOnFilter(grid, dataView);
      } else {
        this.filterService.bindLocalOnFilter(grid, dataView);
      }
    }

    // bind external sorting (backend) when available or default onSort (dataView)
    if (gridOptions.enableSorting && !this.customDataView) {
      // bind external sorting (backend) unless specified to use the local one
      if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalSorting) {
        this.sortService.bindBackendOnSort(grid, dataView);
      } else {
        this.sortService.bindLocalOnSort(grid, dataView);
      }
    }

    if (dataView && grid) {
      // expose all Slick Grid Events through dispatch
      for (const prop in grid) {
        if (grid.hasOwnProperty(prop) && prop.startsWith('on')) {
          const gridEventHandler = grid[prop];
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof gridEventHandler>>).subscribe(gridEventHandler, (event, args) => {
            const gridEventName = this._eventPubSubService.getEventNameByNamingConvention(prop, this._gridOptions && this._gridOptions.defaultSlickgridEventPrefix || '');
            return this._eventPubSubService.dispatchCustomEvent(gridEventName, { eventData: event, args });
          });
        }
      }

      // expose all Slick DataView Events through dispatch
      for (const prop in dataView) {
        if (dataView.hasOwnProperty(prop) && prop.startsWith('on')) {
          const dataViewEventHandler = dataView[prop];
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof dataViewEventHandler>>).subscribe(dataViewEventHandler, (event, args) => {
            const dataViewEventName = this._eventPubSubService.getEventNameByNamingConvention(prop, this._gridOptions && this._gridOptions.defaultSlickgridEventPrefix || '');
            return this._eventPubSubService.dispatchCustomEvent(dataViewEventName, { eventData: event, args });
          });
        }
      }

      const onRowCountChangedHandler = dataView.onRowCountChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowCountChangedHandler>>).subscribe(onRowCountChangedHandler, (e, args) => {
        grid.invalidate();

        this.metrics = {
          startTime: new Date(),
          endTime: new Date(),
          itemCount: args && args.current || 0,
          totalItemCount: Array.isArray(this.dataset) ? this.dataset.length : 0
        };
        if (this.footerService.showCustomFooter) {
          const itemCountElm = document.querySelector<HTMLSpanElement>('.item-count');
          const totalCountElm = document.querySelector<HTMLSpanElement>('.total-count');
          if (itemCountElm) {
            itemCountElm.textContent = `${this.metrics.itemCount}`;
          }
          if (totalCountElm) {
            totalCountElm.textContent = `${this.metrics.totalItemCount}`;
          }
        }
      });

      // without this, filtering data with local dataset will not always show correctly
      // also don't use "invalidateRows" since it destroys the entire row and as bad user experience when updating a row
      // see commit: https://github.com/ghiscoding/slickgrid-universal/commit/bb62c0aa2314a5d61188ff005ccb564577f08805
      if (gridOptions && gridOptions.enableFiltering && !gridOptions.enableRowDetailView) {
        const onRowsChangedHandler = dataView.onRowsChanged;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsChangedHandler>>).subscribe(onRowsChangedHandler, (e, args) => {
          if (args && args.rows && Array.isArray(args.rows)) {
            args.rows.forEach((row) => grid.updateRow(row));
            grid.render();
          }
        });
      }
    }

    // does the user have a colspan callback?
    if (gridOptions?.colspanCallback && dataView?.getItem && dataView?.getItemMetadata) {
      dataView.getItemMetadata = (rowNumber: number) => {
        let callbackResult = null;
        if (gridOptions.colspanCallback && gridOptions.colspanCallback) {
          callbackResult = gridOptions.colspanCallback(dataView.getItem(rowNumber));
        }
        return callbackResult;
      };
    }
  }

  /**
   * When dataset changes, we need to refresh the entire grid UI & possibly resize it as well
   * @param dataset
   */
  refreshGridData(dataset: any[], totalCount?: number) {
    // local grid, check if we need to show the Pagination
    // if so then also check if there's any presets and finally initialize the PaginationService
    // a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
    // if (this._gridOptions && this._gridOptions.enablePagination && this._isLocalGrid) {
    //   this.showPagination = true;
    //   this.loadLocalGridPagination(dataset);
    // }

    if (Array.isArray(dataset) && this.grid && this.dataView && typeof this.dataView.setItems === 'function') {
      this.dataView.setItems(dataset, this._gridOptions.datasetIdPropertyName);
      if (!this._gridOptions.backendServiceApi) {
        this.dataView.reSort();
      }

      if (dataset.length > 0) {
        // if (!this._isDatasetInitialized && this._gridOptions.enableCheckboxSelector) {
        //   this.loadRowSelectionPresetWhenExists();
        // }
        this._isDatasetInitialized = true;

        // also update the hierarchical dataset
        if (dataset.length > 0 && this._gridOptions.treeDataOptions) {
          this.sharedService.hierarchicalDataset = this.treeDataSortComparer(dataset);
        }
      }

      if (dataset) {
        this.grid.invalidate();
      }

      // display the Pagination component only after calling this refresh data first, we call it here so that if we preset pagination page number it will be shown correctly
      // this.showPagination = (this._gridOptions && (this._gridOptions.enablePagination || (this._gridOptions.backendServiceApi && this._gridOptions.enablePagination === undefined))) ? true : false;

      // if (this._gridOptions && this._gridOptions.backendServiceApi && this._gridOptions.pagination && this.paginationOptions) {
      //   const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this._gridOptions, this.paginationOptions);

      //   // when we have a totalCount use it, else we'll take it from the pagination object
      //   // only update the total items if it's different to avoid refreshing the UI
      //   const totalRecords = (totalCount !== undefined) ? totalCount : (this._gridOptions && this._gridOptions.pagination && this._gridOptions.pagination.totalItems);
      //   if (totalRecords !== undefined && totalRecords !== this.totalItems) {
      //     this.totalItems = +totalRecords;
      //   }
      //   // initialize the Pagination Service with new pagination options (which might have presets)
      //   if (!this._isPaginationInitialized) {
      //     this.initializePaginationService(paginationOptions);
      //   } else {
      //     // update the pagination service with the new total
      //     this.paginationService.totalItems = this.totalItems;
      //   }
      // }

      // resize the grid inside a slight timeout, in case other DOM element changed prior to the resize (like a filter/pagination changed)
      if (this.grid && this._gridOptions.enableAutoResize) {
        const delay = this._gridOptions.autoResize && this._gridOptions.autoResize.delay;
        this.resizerPlugin.resizeGrid(delay || 10);
      }
    }
  }

  /**
   * Dynamically change or update the column definitions list.
   * We will re-render the grid so that the new header and data shows up correctly.
   * If using i18n, we also need to trigger a re-translate of the column headers
   */
  updateColumnDefinitionsList(newColumnDefinitions: Column[]) {
    // map/swap the internal library Editor to the SlickGrid Editor factory
    newColumnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(newColumnDefinitions);
    if (this._gridOptions.enableTranslate) {
      this.extensionService.translateColumnHeaders(false, newColumnDefinitions);
    } else {
      this.extensionService.renderColumnHeaders(newColumnDefinitions);
    }

    if (this._gridOptions && this._gridOptions.enableAutoSizeColumns) {
      this.grid.autosizeColumns();
    }
  }

  /**
   * Show the filter row displayed on first row, we can optionally pass false to hide it.
   * @param showing
   */
  showHeaderRow(showing = true) {
    this.grid.setHeaderRowVisibility(showing, false);
    if (showing === true && this._isGridInitialized) {
      this.grid.setColumns(this.columnDefinitions);
    }
    return showing;
  }


  /**
   * For convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
   * however "editor" is used internally by SlickGrid for it's own Editor Factory
   * so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
   * then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
   */
  swapInternalEditorToSlickGridFactoryEditor(columnDefinitions: Column[]) {
    return columnDefinitions.map((column: Column) => {
      // on every Editor that have a "collectionAsync", resolve the data and assign it to the "collection" property
      // if (column.editor && column.editor.collectionAsync) {
      // this.loadEditorCollectionAsync(column);
      // }
      const columnEditor = column.editor as ColumnEditor;

      return { ...column, editor: columnEditor?.model, internalColumnEditor: { ...columnEditor } };
    });
  }

  private treeDataSortComparer(flatDataset: any[]): any[] {
    const dataViewIdIdentifier = this._gridOptions?.datasetIdPropertyName ?? 'id';
    const treeDataOpt: TreeDataOption = this._gridOptions?.treeDataOptions ?? { columnId: '' };
    const treeDataOptions = { ...treeDataOpt, identifierPropName: treeDataOpt.identifierPropName ?? dataViewIdIdentifier };
    return convertParentChildArrayToHierarchicalView(flatDataset, treeDataOptions);
  }
}
