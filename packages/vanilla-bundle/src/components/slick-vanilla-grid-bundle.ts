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
  ExtensionList,
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
  executeBackendProcessesCallback,
  GridStateType,
  BackendServiceOption,
  onBackendError,
  refreshBackendDataset,
  Pagination,
  ServicePagination,
  Subscription,

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
  TranslaterService,
  TreeDataService,

  // utilities
  convertParentChildArrayToHierarchicalView,
  GetSlickEventType,
} from '@slickgrid-universal/common';

import { EventPubSubService } from '../services/eventPubSub.service';
import { FileExportService } from '../services/fileExport.service';
import { ResizerService } from '../services/resizer.service';
import { SalesforceGlobalGridOptions } from '../salesforce-global-grid-options';
import { SlickFooterComponent } from './slick-footer';
import { SlickPaginationComponent } from './slick-pagination';
import { SlickerGridInstance } from '../interfaces/slickerGridInstance.interface';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class SlickVanillaGridBundle {
  protected _eventPubSubService: EventPubSubService;
  private _columnDefinitions: Column[];
  private _gridOptions: GridOption;
  private _dataset: any[];
  private _gridContainerElm: HTMLElement;
  private _gridParentContainerElm: HTMLElement;
  private _hideHeaderRowAfterPageLoad = false;
  private _isDatasetInitialized = false;
  private _isGridInitialized = false;
  private _isLocalGrid = true;
  private _isPaginationInitialized = false;
  private _eventHandler: SlickEventHandler = new Slick.EventHandler();
  private _extensions: ExtensionList<any, any> | undefined;
  private _paginationOptions: Pagination | undefined;
  private _registeredServices: any[] = [];
  private _slickgridInitialized = false;
  private _slickerGridInstances: SlickerGridInstance | undefined;
  backendServiceApi: BackendServiceApi | undefined;
  dataView: SlickDataView;
  slickGrid: SlickGrid;
  metrics: Metrics;
  customDataView = false;
  paginationData: {
    gridOptions: GridOption;
    paginationService: PaginationService;
  };
  totalItems = 0;
  groupItemMetadataProvider: SlickGroupItemMetadataProvider;
  resizerService: ResizerService;
  subscriptions: Subscription[] = [];
  showPagination = false;

  // extensions
  extensionUtility: ExtensionUtility;

  // services
  collectionService: CollectionService;
  extensionService: ExtensionService;
  filterService: FilterService;
  gridEventService: GridEventService;
  gridService: GridService;
  gridStateService: GridStateService;
  groupingService: GroupingAndColspanService;
  paginationService: PaginationService;
  sharedService: SharedService;
  sortService: SortService;
  translaterService: TranslaterService | undefined;
  treeDataService: TreeDataService;

  slickFooter: SlickFooterComponent | undefined;
  slickPagination: SlickPaginationComponent | undefined;
  gridClass: string;
  gridClassName: string;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

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
  set dataset(newDataset: any[]) {
    const prevDatasetLn = Array.isArray(this._dataset) ? this._dataset.length : 0;
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions && this._gridOptions.enableDeepCopyDatasetOnPageLoad);
    const data = isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], newDataset) : newDataset;
    this._dataset = data || [];
    this.refreshGridData(this._dataset);

    // expand/autofit columns on first page load
    // we can assume that if the prevDataset was empty then we are on first load
    if (this.gridOptions.autoFitColumnsOnFirstLoad && prevDatasetLn === 0) {
      this.slickGrid.autosizeColumns();
    }
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
    if (this.slickGrid?.getOptions) {
      mergedOptions = $.extend(true, {}, this.slickGrid.getOptions(), options);
    } else {
      mergedOptions = this.mergeGridOptions(options);
    }
    if (this.sharedService?.gridOptions && this.slickGrid?.setOptions) {
      this.sharedService.gridOptions = mergedOptions;
      this.slickGrid.setOptions(mergedOptions);
    }
    this._gridOptions = mergedOptions;
  }

  get paginationOptions(): Pagination | undefined {
    return this._paginationOptions;
  }
  set paginationOptions(options: Pagination | undefined) {
    if (options && this._paginationOptions) {
      this._paginationOptions = { ...this._paginationOptions, ...options };
    } else {
      this._paginationOptions = options;
    }
    this.gridOptions.pagination = options;
    this.paginationService.updateTotalItems(options?.totalItems || 0);
  }

  get isDatasetInitialized(): boolean {
    return this._isDatasetInitialized;
  }
  set isDatasetInitialized(isInitialized: boolean) {
    this._isDatasetInitialized = isInitialized;
  }

  get instances(): SlickerGridInstance | undefined {
    return this._slickerGridInstances;
  }

  get extensions(): ExtensionList<any, any> | undefined {
    return this._extensions;
  }

  get registeredServices(): any[] {
    return this._registeredServices;
  }

  constructor(gridParentContainerElm: HTMLElement, columnDefs?: Column[], options?: GridOption, dataset?: any[], hierarchicalDataset?: any[]) {
    // make sure that the grid container doesn't already have the "slickgrid-container" css class
    // if it does then we won't create yet another grid, just stop there
    if (gridParentContainerElm.querySelectorAll('.slickgrid-container').length !== 0) {
      return;
    }

    gridParentContainerElm.classList.add('grid-pane');
    this._gridParentContainerElm = gridParentContainerElm as HTMLDivElement;
    this._gridContainerElm = document.createElement('div') as HTMLDivElement;
    this._gridContainerElm.classList.add('slickgrid-container');
    gridParentContainerElm.appendChild(this._gridContainerElm);

    this._dataset = [];
    this._columnDefinitions = columnDefs || [];
    this._gridOptions = this.mergeGridOptions(options || {});
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions && this._gridOptions.enableDeepCopyDatasetOnPageLoad);

    // if user is providing a Translate Service, it has to be passed under the "i18n" grid option
    this.translaterService = this._gridOptions.i18n;

    // initialize and assign all Service Dependencies
    this._eventPubSubService = new EventPubSubService(gridParentContainerElm);
    this._eventPubSubService.eventNamingStyle = this._gridOptions && this._gridOptions.eventNamingStyle || EventNamingStyle.camelCase;

    this.gridEventService = new GridEventService();
    const slickgridConfig = new SlickgridConfig();
    this.sharedService = new SharedService();
    this.collectionService = new CollectionService(this.translaterService);
    this.extensionUtility = new ExtensionUtility(this.sharedService, this.translaterService);
    const filterFactory = new FilterFactory(slickgridConfig, this.collectionService, this.translaterService);
    this.filterService = new FilterService(filterFactory, this._eventPubSubService, this.sharedService);
    this.sortService = new SortService(this.sharedService, this._eventPubSubService);
    this.treeDataService = new TreeDataService(this.sharedService);
    this.gridService = new GridService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService);
    this.gridStateService = new GridStateService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService);
    this.paginationService = new PaginationService(this._eventPubSubService, this.sharedService);

    // extensions
    const autoTooltipExtension = new AutoTooltipExtension(this.extensionUtility, this.sharedService);
    const cellExternalCopyManagerExtension = new CellExternalCopyManagerExtension(this.extensionUtility, this.sharedService);
    const cellMenuExtension = new CellMenuExtension(this.extensionUtility, this.sharedService, this.translaterService);
    const contextMenuExtension = new ContextMenuExtension(this.extensionUtility, this.sharedService, this.treeDataService, this.translaterService);
    const columnPickerExtension = new ColumnPickerExtension(this.extensionUtility, this.sharedService);
    const checkboxExtension = new CheckboxSelectorExtension(this.extensionUtility, this.sharedService);
    const draggableGroupingExtension = new DraggableGroupingExtension(this.extensionUtility, this.sharedService);
    const gridMenuExtension = new GridMenuExtension(this.extensionUtility, this.filterService, this.sharedService, this.sortService, this.translaterService);
    const groupItemMetaProviderExtension = new GroupItemMetaProviderExtension(this.sharedService);
    const headerButtonExtension = new HeaderButtonExtension(this.extensionUtility, this.sharedService);
    const headerMenuExtension = new HeaderMenuExtension(this.extensionUtility, this.filterService, this._eventPubSubService, this.sharedService, this.sortService, this.translaterService);
    const rowMoveManagerExtension = new RowMoveManagerExtension(this.extensionUtility, this.sharedService);
    const rowSelectionExtension = new RowSelectionExtension(this.extensionUtility, this.sharedService);

    this.extensionService = new ExtensionService(
      autoTooltipExtension,
      cellExternalCopyManagerExtension,
      cellMenuExtension,
      checkboxExtension,
      columnPickerExtension,
      contextMenuExtension,
      draggableGroupingExtension,
      gridMenuExtension,
      groupItemMetaProviderExtension,
      headerButtonExtension,
      headerMenuExtension,
      rowMoveManagerExtension,
      rowSelectionExtension,
      this.sharedService,
      this.translaterService,
    );
    this.groupingService = new GroupingAndColspanService(this.extensionUtility, this.extensionService);

    if (hierarchicalDataset) {
      this.sharedService.hierarchicalDataset = (isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], hierarchicalDataset) : hierarchicalDataset) || [];
    }
    this.initialization(this._gridContainerElm);
    if (!hierarchicalDataset && !this.gridOptions.backendServiceApi) {
      this.dataset = dataset || [];
    }
  }

  destroyGridContainerElm() {
    const gridContainerId = this.gridOptions && this.gridOptions.gridContainerId || 'grid1';
    $(gridContainerId).empty();
  }

  /** Dispose of the Component */
  dispose(shouldEmptyDomElementContainer = false) {
    this._eventPubSubService.publish('onBeforeGridDestroy', this.slickGrid);
    this._eventHandler?.unsubscribeAll();
    this.slickGrid?.destroy();
    this._gridOptions = {};
    this._eventPubSubService.publish('onAfterGridDestroyed', true);

    // we could optionally also empty the content of the grid container DOM element
    if (shouldEmptyDomElementContainer) {
      this.destroyGridContainerElm();
    }

    this.extensionService?.dispose();
    this.filterService?.dispose();
    this.gridEventService?.dispose();
    this.gridStateService?.dispose();
    this.groupingService?.dispose();
    this.paginationService?.dispose();
    this.resizerService?.dispose();
    this.sortService?.dispose();
    this.treeDataService?.dispose();

    this._eventPubSubService?.unsubscribeAll();
  }

  initialization(gridContainerElm: HTMLElement) {
    // create the slickgrid container and add it to the user's grid container
    this._gridContainerElm = gridContainerElm;
    this._eventPubSubService.publish('onBeforeGridCreate', true);

    this._gridOptions = this.mergeGridOptions(this._gridOptions);
    this.backendServiceApi = this._gridOptions && this._gridOptions.backendServiceApi;
    this._isLocalGrid = !this.backendServiceApi; // considered a local grid if it doesn't have a backend service set
    this._eventPubSubService.eventNamingStyle = this._gridOptions && this._gridOptions.eventNamingStyle || EventNamingStyle.camelCase;
    this.sharedService.internalPubSubService = this._eventPubSubService;
    this._eventHandler = new Slick.EventHandler();
    const dataviewInlineFilters = this._gridOptions?.dataView?.inlineFilters ?? false;
    this._paginationOptions = this.gridOptions?.pagination;

    this.createBackendApiInternalPostProcessCallback(this._gridOptions);

    if (!this.customDataView) {
      if (this.gridOptions.draggableGrouping || this.gridOptions.enableGrouping) {
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
    this.slickGrid = new Slick.Grid(gridContainerElm, this.dataView, this._columnDefinitions, this._gridOptions);
    this.sharedService.dataView = this.dataView;
    this.sharedService.slickGrid = this.slickGrid;

    this.extensionService.bindDifferentExtensions();
    this.bindDifferentHooks(this.slickGrid, this._gridOptions, this.dataView);
    this._slickgridInitialized = true;

    // initialize the SlickGrid grid
    this.slickGrid.init();

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
    const selectionModel = this.slickGrid && this.slickGrid.getSelectionModel();
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
        this.dataView.syncGridSelection(this.slickGrid, preservedRowSelection);
      } else if (typeof syncGridSelection === 'object') {
        this.dataView.syncGridSelection(this.slickGrid, syncGridSelection.preserveHidden, syncGridSelection.preserveHiddenOnSelectionChange);
      }
    }

    this.slickGrid.invalidate();

    if (this._dataset.length > 0) {
      if (!this._isDatasetInitialized && (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)) {
        this.loadRowSelectionPresetWhenExists();
      }
      this.loadPresetsWhenDatasetInitialized();
      this._isDatasetInitialized = true;
    }

    // user could show a custom footer with the data metrics (dataset length and last updated timestamp)
    if (!this.gridOptions.enablePagination && this.gridOptions.showCustomFooter && this.gridOptions.customFooterOptions) {
      this.slickFooter = new SlickFooterComponent(this.slickGrid, this.gridOptions.customFooterOptions, this.translaterService);
      this.slickFooter.renderFooter(this._gridParentContainerElm);
    }

    // load the resizer service
    this.resizerService = new ResizerService(this._eventPubSubService);
    this.resizerService.init(this.slickGrid, this._gridParentContainerElm);

    // user might want to hide the header row on page load but still have `enableFiltering: true`
    // if that is the case, we need to hide the headerRow ONLY AFTER all filters got created & dataView exist
    if (this._hideHeaderRowAfterPageLoad) {
      this.showHeaderRow(false);
      this.sharedService.hideHeaderRowAfterPageLoad = this._hideHeaderRowAfterPageLoad;
    }

    // on cell click, mainly used with the columnDef.action callback
    this.gridEventService.bindOnBeforeEditCell(this.slickGrid);
    this.gridEventService.bindOnCellChange(this.slickGrid);
    this.gridEventService.bindOnClick(this.slickGrid);

    // get any possible Services that user want to register
    this._registeredServices = this.gridOptions.registerExternalServices || [];

    // when using Salesforce, we want the Export to CSV always enabled without registering it
    if (this.gridOptions.enableExport && this.gridOptions.useSalesforceDefaultGridOptions) {
      const fileExportService = new FileExportService();
      this._registeredServices.push(fileExportService);
    }

    // at this point, we consider all the registered services as external services, anything else registered afterward aren't external
    if (Array.isArray(this._registeredServices)) {
      this.sharedService.externalRegisteredServices = this._registeredServices;
    }

    // push all other Services that we want to be registered
    this._registeredServices.push(this.gridService, this.gridStateService);

    // when using Grouping/DraggableGrouping/Colspan register its Service
    if (this.gridOptions.createPreHeaderPanel && !this.gridOptions.enableDraggableGrouping) {
      this._registeredServices.push(this.groupingService);
    }

    if (this.gridOptions.enableTreeData) {
      // when using Tree Data View, register its Service
      this._registeredServices.push(this.treeDataService);
    }

    // when user enables translation, we need to translate Headers on first pass & subsequently in the bindDifferentHooks
    if (this.gridOptions.enableTranslate) {
      this.extensionService.translateColumnHeaders();
    }

    // bind the Backend Service API callback functions only after the grid is initialized
    // because the preProcess() and onInit() might get triggered
    if (this.gridOptions && this.gridOptions.backendServiceApi) {
      this.bindBackendCallbackFunctions(this.gridOptions);
    }

    // bind & initialize all Services that were tagged as enable
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(this._registeredServices)) {
      for (const service of this._registeredServices) {
        if (typeof service.init === 'function') {
          service.init(this.slickGrid, this.sharedService);
        }
      }
    }

    // publish & dispatch certain events
    this._eventPubSubService.publish('onGridCreated', this.slickGrid);

    // after the DataView is created & updated execute some processes & dispatch some events
    if (!this.customDataView) {
      this.executeAfterDataviewCreated(this.gridOptions);
    }

    // bind resize ONLY after the dataView is ready
    this.bindResizeHook(this.slickGrid, this.gridOptions);

    // once the grid is created, we'll return its instance (we do this to return Transient Services from DI)
    this._slickerGridInstances = {
      // Slick Grid & DataView objects
      dataView: this.dataView,
      slickGrid: this.slickGrid,

      // public methods
      dispose: this.dispose.bind(this),

      // return all available Services (non-singleton)
      backendService: this.gridOptions && this.gridOptions.backendServiceApi && this.gridOptions.backendServiceApi.service,
      filterService: this.filterService,
      gridEventService: this.gridEventService,
      gridStateService: this.gridStateService,
      gridService: this.gridService,
      groupingService: this.groupingService,
      extensionService: this.extensionService,
      extensionUtility: this.extensionUtility,
      paginationService: this.paginationService,
      resizerService: this.resizerService,
      sortService: this.sortService,
      treeDataService: this.treeDataService,
    };

    // addons (SlickGrid extra plugins/controls)
    this._extensions = this.extensionService?.extensionList;

    // all instances (SlickGrid, DataView & all Services)
    this._eventPubSubService.publish('onSlickerGridCreated', this.instances);
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
    if (options?.pagination && (gridOptions.enablePagination || gridOptions.backendServiceApi) && gridOptions.pagination && Array.isArray(gridOptions.pagination.pageSizes)) {
      options.pagination.pageSizes = gridOptions.pagination.pageSizes;
    }

    // when we use Pagination on Local Grid, it doesn't seem to work without enableFiltering
    // so we'll enable the filtering but we'll keep the header row hidden
    if (options && !options.enableFiltering && options.enablePagination && this._isLocalGrid) {
      options.enableFiltering = true;
      options.showHeaderRow = false;
      this._hideHeaderRowAfterPageLoad = true;
      if (this.sharedService) {
        this.sharedService.hideHeaderRowAfterPageLoad = true;
      }
    }

    return options;
  }

  /**
   * Define our internal Post Process callback, it will execute internally after we get back result from the Process backend call
   * For now, this is GraphQL Service ONLY feature and it will basically
   * refresh the Dataset & Pagination without having the user to create his own PostProcess every time
   */
  createBackendApiInternalPostProcessCallback(gridOptions: GridOption) {
    const backendApi = gridOptions && gridOptions.backendServiceApi;
    if (backendApi && backendApi.service) {
      const backendApiService = backendApi.service;

      // internalPostProcess only works (for now) with a GraphQL Service, so make sure it is of that type
      if (/* backendApiService instanceof GraphqlService || */ typeof backendApiService.getDatasetName === 'function') {
        backendApi.internalPostProcess = (processResult: any) => {
          this._dataset = [];
          const datasetName = (backendApi && backendApiService && typeof backendApiService.getDatasetName === 'function') ? backendApiService.getDatasetName() : '';
          if (processResult && processResult.data && processResult.data[datasetName]) {
            this._dataset = processResult.data[datasetName].hasOwnProperty('nodes') ? (processResult as any).data[datasetName].nodes : (processResult as any).data[datasetName];
            const totalCount = processResult.data[datasetName].hasOwnProperty('totalCount') ? (processResult as any).data[datasetName].totalCount : (processResult as any).data[datasetName].length;
            this.refreshGridData(this._dataset, totalCount || 0);
          }
        };
      }
    }
  }

  bindDifferentHooks(grid: SlickGrid, gridOptions: GridOption, dataView: SlickDataView) {
    // if user is providing a Translate Service, we need to add our PubSub Service (but only after creating all dependencies)
    // so that we can later subscribe to the "onLanguageChange" event and translate any texts whenever that get triggered
    if (gridOptions.enableTranslate && this.translaterService?.addPubSubMessaging) {
      this.translaterService.addPubSubMessaging(this._eventPubSubService);
    }

    // translate some of them on first load, then on each language change
    if (gridOptions.enableTranslate) {
      this.translateColumnHeaderTitleKeys();
      this.translateColumnGroupKeys();
      this.translateCustomFooterTexts();
    }

    // on locale change, we have to manually translate the Headers, GridMenu
    this.subscriptions.push(
      this._eventPubSubService.subscribe('onLanguageChange', () => {
        if (gridOptions.enableTranslate) {
          this.extensionService.translateCellMenu();
          this.extensionService.translateColumnHeaders();
          this.extensionService.translateColumnPicker();
          this.extensionService.translateContextMenu();
          this.extensionService.translateGridMenu();
          this.extensionService.translateHeaderMenu();
          this.translateCustomFooterTexts();
          this.translateColumnHeaderTitleKeys();
          this.translateColumnGroupKeys();
          if (gridOptions.createPreHeaderPanel && !gridOptions.enableDraggableGrouping) {
            this.groupingService.translateGroupingAndColSpan();
          }
        }
      })
    );

    if (!this.customDataView) {
      // bind external filter (backend) when available or default onFilter (dataView)
      if (gridOptions.enableFiltering) {
        this.filterService.init(grid);

        // bind external filter (backend) unless specified to use the local one
        if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalFiltering) {
          this.filterService.bindBackendOnFilter(grid);
        } else {
          this.filterService.bindLocalOnFilter(grid);
        }
      }

      // bind external sorting (backend) when available or default onSort (dataView)
      if (gridOptions.enableSorting) {
        // bind external sorting (backend) unless specified to use the local one
        if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalSorting) {
          this.sortService.bindBackendOnSort(grid);
        } else {
          this.sortService.bindLocalOnSort(grid);
        }
      }

      // load any presets if any (after dataset is initialized)
      this.loadPresetsWhenDatasetInitialized();
    }


    // if user set an onInit Backend, we'll run it right away (and if so, we also need to run preProcess, internalPostProcess & postProcess)
    if (gridOptions.backendServiceApi) {
      const backendApi = gridOptions.backendServiceApi;

      if (backendApi && backendApi.service && backendApi.service.init) {
        backendApi.service.init(backendApi.options, gridOptions.pagination, this.slickGrid);
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

        // if custom footer is enabled, then we'll update its metrics
        if (this.slickFooter) {
          this.slickFooter.metrics = this.metrics;
        }
      });

      // without this, filtering data with local dataset will not always show correctly
      // also don't use "invalidateRows" since it destroys the entire row and as bad user experience when updating a row
      if (gridOptions && gridOptions.enableFiltering && !gridOptions.enableRowDetailView) {
        const onRowsChangedHandler = dataView.onRowsChanged;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsChangedHandler>>).subscribe(onRowsChangedHandler, (_e, args) => {
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

  bindBackendCallbackFunctions(gridOptions: GridOption) {
    const backendApi = gridOptions.backendServiceApi;
    const backendApiService = backendApi && backendApi.service;
    const serviceOptions: BackendServiceOption = backendApiService && backendApiService.options || {};
    const isExecuteCommandOnInit = (!serviceOptions) ? false : ((serviceOptions && serviceOptions.hasOwnProperty('executeProcessCommandOnInit')) ? serviceOptions['executeProcessCommandOnInit'] : true);

    if (backendApiService) {
      // update backend filters (if need be) BEFORE the query runs (via the onInit command a few lines below)
      // if user entered some any "presets", we need to reflect them all in the grid
      if (gridOptions && gridOptions.presets) {
        // Filters "presets"
        if (backendApiService.updateFilters && Array.isArray(gridOptions.presets.filters) && gridOptions.presets.filters.length > 0) {
          backendApiService.updateFilters(gridOptions.presets.filters, true);
        }
        // Sorters "presets"
        if (backendApiService.updateSorters && Array.isArray(gridOptions.presets.sorters) && gridOptions.presets.sorters.length > 0) {
          backendApiService.updateSorters(undefined, gridOptions.presets.sorters);
        }
        // Pagination "presets"
        if (backendApiService.updatePagination && gridOptions.presets.pagination) {
          const { pageNumber, pageSize } = gridOptions.presets.pagination;
          backendApiService.updatePagination(pageNumber, pageSize);
        }
      } else {
        const columnFilters = this.filterService.getColumnFilters();
        if (columnFilters && backendApiService.updateFilters) {
          backendApiService.updateFilters(columnFilters, false);
        }
      }

      // execute onInit command when necessary
      if (backendApi && backendApiService && (backendApi.onInit || isExecuteCommandOnInit)) {
        const query = (typeof backendApiService.buildQuery === 'function') ? backendApiService.buildQuery() : '';
        const process = (isExecuteCommandOnInit) ? (backendApi.process && backendApi.process(query) || null) : (backendApi.onInit && backendApi.onInit(query) || null);

        // wrap this inside a setTimeout to avoid timing issue since the gridOptions needs to be ready before running this onInit
        setTimeout(() => {
          // keep start time & end timestamps & return it after process execution
          const startTime = new Date();

          // run any pre-process, if defined, for example a spinner
          if (backendApi.preProcess) {
            backendApi.preProcess();
          }

          // the processes can be a Promise (like Http)
          if (process instanceof Promise && process.then) {
            const totalItems = this.gridOptions && this.gridOptions.pagination && this.gridOptions.pagination.totalItems || 0;
            process
              .then((processResult: any) => executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems))
              .catch((error) => onBackendError(error, backendApi));
          }
        });
      }
    }
  }

  bindResizeHook(grid: SlickGrid, options: GridOption) {
    // expand/autofit columns on first page load
    if (grid && options.autoFitColumnsOnFirstLoad && options.enableAutoSizeColumns && typeof grid.autosizeColumns === 'function') {
      this.slickGrid.autosizeColumns();
    }

    // auto-resize grid on browser resize (optionally provide grid height or width)
    if (options.gridHeight || options.gridWidth) {
      this.resizerService.resizeGrid(0, { height: options.gridHeight, width: options.gridWidth });
    } else {
      this.resizerService.resizeGrid();
    }
    if (grid && options && options.enableAutoResize) {
      // this.resizerPlugin.bindAutoResizeDataGrid({ height: options.gridHeight, width: options.gridWidth });
      if (options.autoFitColumnsOnFirstLoad && options.enableAutoSizeColumns && typeof grid.autosizeColumns === 'function') {
        grid.autosizeColumns();
      }
    }
  }

  executeAfterDataviewCreated(gridOptions: GridOption) {
    // if user entered some Sort "presets", we need to reflect them all in the DOM
    if (gridOptions.enableSorting) {
      if (gridOptions.presets && Array.isArray(gridOptions.presets.sorters) && gridOptions.presets.sorters.length > 0) {
        this.sortService.loadGridSorters(gridOptions.presets.sorters);
      }
    }
  }

  /**
   * On a Pagination changed, we will trigger a Grid State changed with the new pagination info
   * Also if we use Row Selection or the Checkbox Selector, we need to reset any selection
   */
  paginationChanged(pagination: ServicePagination) {
    const isSyncGridSelectionEnabled = this.gridStateService && this.gridStateService.needToPreserveRowSelection() || false;
    if (!isSyncGridSelectionEnabled && (this.gridOptions.enableRowSelection || this.gridOptions.enableCheckboxSelector)) {
      this.slickGrid.setSelectedRows([]);
    }
    const { pageNumber, pageSize } = pagination;
    if (this.sharedService) {
      if (pageSize !== undefined && pageNumber !== undefined) {
        this.sharedService.currentPagination = { pageNumber, pageSize };
      }
    }
    this._eventPubSubService.publish('onGridStateChanged', {
      change: { newValues: { pageNumber, pageSize }, type: GridStateType.pagination },
      gridState: this.gridStateService.getCurrentGridState()
    });
  }

  /**
   * When dataset changes, we need to refresh the entire grid UI & possibly resize it as well
   * @param dataset
   */
  refreshGridData(dataset: any[], totalCount?: number) {
    // local grid, check if we need to show the Pagination
    // if so then also check if there's any presets and finally initialize the PaginationService
    // a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
    if (this._gridOptions && this._gridOptions.enablePagination && this._isLocalGrid) {
      this.showPagination = true;
      this.loadLocalGridPagination(dataset);
    }

    if (Array.isArray(dataset) && this.slickGrid && this.dataView && typeof this.dataView.setItems === 'function') {
      this.dataView.setItems(dataset, this._gridOptions.datasetIdPropertyName);
      if (!this._gridOptions.backendServiceApi) {
        this.dataView.reSort();
      }

      if (dataset.length > 0) {
        if (!this._isDatasetInitialized && this._gridOptions.enableCheckboxSelector) {
          this.loadRowSelectionPresetWhenExists();
        }
        this.loadPresetsWhenDatasetInitialized();
        this._isDatasetInitialized = true;

        // also update the hierarchical dataset
        if (dataset.length > 0 && this._gridOptions.treeDataOptions) {
          this.sharedService.hierarchicalDataset = this.treeDataSortComparer(dataset);
        }
      }

      if (dataset) {
        this.slickGrid.invalidate();
      }

      // display the Pagination component only after calling this refresh data first, we call it here so that if we preset pagination page number it will be shown correctly
      this.showPagination = (this._gridOptions && (this._gridOptions.enablePagination || (this._gridOptions.backendServiceApi && this._gridOptions.enablePagination === undefined))) ? true : false;

      if (this._gridOptions && this._gridOptions.backendServiceApi && this._gridOptions.pagination && this._paginationOptions) {
        const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this._gridOptions, this._paginationOptions);

        // when we have a totalCount use it, else we'll take it from the pagination object
        // only update the total items if it's different to avoid refreshing the UI
        const totalRecords = (totalCount !== undefined) ? totalCount : (this._gridOptions && this._gridOptions.pagination && this._gridOptions.pagination.totalItems);
        if (totalRecords !== undefined && totalRecords !== this.totalItems) {
          this.totalItems = +totalRecords;
        }
        // initialize the Pagination Service with new pagination options (which might have presets)
        if (!this._isPaginationInitialized) {
          this.initializePaginationService(paginationOptions);
        } else {
          // update the pagination service with the new total
          this.paginationService.updateTotalItems(this.totalItems);
        }
      }

      // resize the grid inside a slight timeout, in case other DOM element changed prior to the resize (like a filter/pagination changed)
      if (this.slickGrid && this._gridOptions.enableAutoResize) {
        const delay = this._gridOptions.autoResize && this._gridOptions.autoResize.delay;
        this.resizerService.resizeGrid(delay || 10);
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
      this.extensionService.renderColumnHeaders(newColumnDefinitions, true);
    }

    if (this._gridOptions && this._gridOptions.enableAutoSizeColumns) {
      this.slickGrid.autosizeColumns();
    }
  }

  /**
   * Show the filter row displayed on first row, we can optionally pass false to hide it.
   * @param showing
   */
  showHeaderRow(showing = true) {
    this.slickGrid.setHeaderRowVisibility(showing, false);
    if (showing === true && this._isGridInitialized) {
      this.slickGrid.setColumns(this.columnDefinitions);
    }
    return showing;
  }

  /**
   * Check if there's any Pagination Presets defined in the Grid Options,
   * if there are then load them in the paginationOptions object
   */
  setPaginationOptionsWhenPresetDefined(gridOptions: GridOption, paginationOptions: Pagination): Pagination {
    if (gridOptions.presets && gridOptions.presets.pagination && gridOptions.pagination) {
      paginationOptions.pageSize = gridOptions.presets.pagination.pageSize;
      paginationOptions.pageNumber = gridOptions.presets.pagination.pageNumber;
    }
    return paginationOptions;
  }

  /** Initialize the Pagination Service once */
  private initializePaginationService(paginationOptions: Pagination) {
    if (this.gridOptions) {
      this.paginationData = {
        gridOptions: this.gridOptions,
        paginationService: this.paginationService,
      };
      this.paginationService.totalItems = this.totalItems;
      this.paginationService.init(this.slickGrid, paginationOptions, this.backendServiceApi);
      this.subscriptions.push(
        this._eventPubSubService.subscribe('onPaginationChanged', (paginationChanges: ServicePagination) => this.paginationChanged(paginationChanges)),
        this._eventPubSubService.subscribe('onPaginationVisibilityChanged', (visibility: { visible: boolean }) => {
          this.showPagination = visibility?.visible ?? false;
          if (this.gridOptions && this.gridOptions.backendServiceApi) {
            refreshBackendDataset();
          }
        })
      );

      // also initialize (render) the pagination component
      if (this._gridOptions.enablePagination && !this._isPaginationInitialized) {
        this.slickPagination = new SlickPaginationComponent(this.paginationService, this._eventPubSubService, this.sharedService, this.translaterService);
        this.slickPagination.renderPagination(this._gridParentContainerElm);
      }

      this._isPaginationInitialized = true;
    }
  }

  /** Load the Editor Collection asynchronously and replace the "collection" property when Promise resolves */
  private loadEditorCollectionAsync(column: Column) {
    const collectionAsync = column && column.editor && (column.editor as ColumnEditor).collectionAsync;
    if (collectionAsync) {
      // wait for the "collectionAsync", once resolved we will save it into the "collection"
      // the collectionAsync can be of 3 types HttpClient, HttpFetch or a Promise
      collectionAsync.then((response: any | any[]) => {
        if (Array.isArray(response)) {
          this.updateEditorCollection(column, response); // from Promise
        } else if (response instanceof Response && typeof response.json === 'function') {
          if (response.bodyUsed) {
            console.warn(`[SlickGrid-Universal] The response body passed to collectionAsync was already read.`
              + `Either pass the dataset from the Response or clone the response first using response.clone()`);
          } else {
            // from Fetch
            (response as Response).json().then(data => this.updateEditorCollection(column, data));
          }
        } else if (response && response['content']) {
          this.updateEditorCollection(column, response['content']); // from http-client
        }
      });
    }
  }

  /** Load any possible Grid Presets (columns, filters) */
  private loadPresetsWhenDatasetInitialized() {
    if (this.gridOptions && !this.customDataView) {
      // if user entered some Filter "presets", we need to reflect them all in the DOM
      if (this.gridOptions.presets && Array.isArray(this.gridOptions.presets.filters) && this.gridOptions.presets.filters.length > 0) {
        this.filterService.populateColumnFilterSearchTermPresets(this.gridOptions.presets.filters);
      }

      // if user entered some Columns "presets", we need to reflect them all in the grid
      if (this.gridOptions.presets && Array.isArray(this.gridOptions.presets.columns) && this.gridOptions.presets.columns.length > 0) {
        const gridColumns: Column[] = this.gridStateService.getAssociatedGridColumns(this.slickGrid, this.gridOptions.presets.columns);
        if (gridColumns && Array.isArray(gridColumns) && gridColumns.length > 0) {
          // make sure that the checkbox selector is also visible if it is enabled
          if (this.gridOptions.enableCheckboxSelector) {
            const checkboxColumn = (Array.isArray(this._columnDefinitions) && this._columnDefinitions.length > 0) ? this._columnDefinitions[0] : null;
            if (checkboxColumn && checkboxColumn.id === '_checkbox_selector' && gridColumns[0].id !== '_checkbox_selector') {
              gridColumns.unshift(checkboxColumn);
            }
          }

          // finally set the new presets columns (including checkbox selector if need be)
          this.slickGrid.setColumns(gridColumns);
        }
      }
    }
  }

  /**
   * local grid, check if we need to show the Pagination
   * if so then also check if there's any presets and finally initialize the PaginationService
   * a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
   */
  private loadLocalGridPagination(dataset?: any[]) {
    if (this.gridOptions && this._paginationOptions) {
      this.totalItems = Array.isArray(dataset) ? dataset.length : 0;
      if (this._paginationOptions && this.dataView && this.dataView.getPagingInfo) {
        const slickPagingInfo = this.dataView.getPagingInfo();
        if (slickPagingInfo && slickPagingInfo.hasOwnProperty('totalRows') && this._paginationOptions.totalItems !== slickPagingInfo.totalRows) {
          this.totalItems = slickPagingInfo?.totalRows || 0;
        }
      }
      this._paginationOptions.totalItems = this.totalItems;
      const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this.gridOptions, this._paginationOptions);
      this.initializePaginationService(paginationOptions);
    }
  }

  /** Load any Row Selections into the DataView that were presets by the user */
  private loadRowSelectionPresetWhenExists() {
    // if user entered some Row Selections "presets"
    const presets = this.gridOptions && this.gridOptions.presets;
    const selectionModel = this.slickGrid && this.slickGrid.getSelectionModel();
    const enableRowSelection = this.gridOptions && (this.gridOptions.enableCheckboxSelector || this.gridOptions.enableRowSelection);
    if (enableRowSelection && selectionModel && presets && presets.rowSelection && (Array.isArray(presets.rowSelection.gridRowIndexes) || Array.isArray(presets.rowSelection.dataContextIds))) {
      let dataContextIds = presets.rowSelection.dataContextIds;
      let gridRowIndexes = presets.rowSelection.gridRowIndexes;

      // maps the IDs to the Grid Rows and vice versa, the "dataContextIds" has precedence over the other
      if (Array.isArray(dataContextIds) && dataContextIds.length > 0) {
        gridRowIndexes = this.dataView.mapIdsToRows(dataContextIds) || [];
      } else if (Array.isArray(gridRowIndexes) && gridRowIndexes.length > 0) {
        dataContextIds = this.dataView.mapRowsToIds(gridRowIndexes) || [];
      }
      this.gridStateService.selectedRowDataContextIds = dataContextIds;

      // change the selected rows except UNLESS it's a Local Grid with Pagination
      // local Pagination uses the DataView and that also trigger a change/refresh
      // and we don't want to trigger 2 Grid State changes just 1
      if ((this._isLocalGrid && !this.gridOptions.enablePagination) || !this._isLocalGrid) {
        setTimeout(() => {
          if (this.slickGrid && Array.isArray(gridRowIndexes)) {
            this.slickGrid.setSelectedRows(gridRowIndexes);
          }
        });
      }
    }
  }

  /**
   * For convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
   * however "editor" is used internally by SlickGrid for it's own Editor Factory
   * so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
   * then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
   */
  private swapInternalEditorToSlickGridFactoryEditor(columnDefinitions: Column[]) {
    return columnDefinitions.map((column: Column) => {
      // on every Editor that have a "collectionAsync", resolve the data and assign it to the "collection" property
      if (column.editor?.collectionAsync) {
        this.loadEditorCollectionAsync(column);
      }
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

  /** Translate all Custom Footer Texts (footer with metrics) */
  private translateCustomFooterTexts() {
    if (this.translaterService?.translate) {
      const customFooterOptions = this.gridOptions && this.gridOptions.customFooterOptions || {};
      customFooterOptions.metricTexts = customFooterOptions.metricTexts || {};
      for (const propName of Object.keys(customFooterOptions.metricTexts)) {
        if (propName.lastIndexOf('Key') > 0) {
          const propNameWithoutKey = propName.substring(0, propName.lastIndexOf('Key'));
          customFooterOptions.metricTexts[propNameWithoutKey] = this.translaterService.translate(customFooterOptions.metricTexts[propName] || ' ');
        }
      }
    }
  }

  /** translate all columns (including hidden columns) */
  private translateColumnHeaderTitleKeys() {
    this.extensionUtility.translateItems(this.sharedService.allColumns, 'nameKey', 'name');
  }

  /** translate all column groups (including hidden columns) */
  private translateColumnGroupKeys() {
    this.extensionUtility.translateItems(this.sharedService.allColumns, 'columnGroupKey', 'columnGroup');
  }

  /**
   * Update the "internalColumnEditor.collection" property.
   * Since this is called after the async call resolves, the pointer will not be the same as the "column" argument passed.
   * Once we found the new pointer, we will reassign the "editor" and "collection" to the "internalColumnEditor" so it has newest collection
   */
  private updateEditorCollection<T = any>(column: Column<T>, newCollection: T[]) {
    (column.editor as ColumnEditor).collection = newCollection;

    // find the new column reference pointer & reassign the new editor to the internalColumnEditor
    const columns = this.slickGrid.getColumns();
    if (Array.isArray(columns)) {
      const columnRef = columns.find((col: Column) => col.id === column.id);
      if (columnRef) {
        columnRef.internalColumnEditor = column.editor as ColumnEditor;
      }
    }
  }
}

/** This class is only for unit testing purposes */
export class SlickVanillaGridBundleInitializer extends SlickVanillaGridBundle {
  constructor(
    collectionService: CollectionService,
    eventPubSubService: EventPubSubService,
    extensionService: ExtensionService,
    extensionUtility: ExtensionUtility,
    filterService: FilterService,
    gridEventService: GridEventService,
    gridService: GridService,
    gridStateService: GridStateService,
    groupingAndColspanService: GroupingAndColspanService,
    paginationService: PaginationService,
    sharedService: SharedService,
    sortService: SortService,
    treeDataService: TreeDataService,
    translateService: TranslaterService,
    gridParentContainerElm: HTMLElement,
    columnDefs?: Column[],
    options?: GridOption,
    dataset?: any[],
    hierarchicalDataset?: any[],
  ) {
    super(gridParentContainerElm, columnDefs, options, dataset, hierarchicalDataset);
    this.collectionService = collectionService;
    this._eventPubSubService = eventPubSubService;
    this.extensionService = extensionService;
    this.extensionUtility = extensionUtility;
    this.filterService = filterService;
    this.gridEventService = gridEventService;
    this.gridService = gridService;
    this.gridStateService = gridStateService;
    this.groupingService = groupingAndColspanService;
    this.paginationService = paginationService;
    this.sharedService = sharedService;
    this.sortService = sortService;
    this.treeDataService = treeDataService;
    this.translaterService = translateService;
  }
}
