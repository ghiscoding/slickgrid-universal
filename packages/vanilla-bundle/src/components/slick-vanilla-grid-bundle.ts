import { dequal } from 'dequal/lite';
import 'flatpickr/dist/l10n/fr';
import type {
  BackendServiceApi,
  BackendServiceOption,
  Column,
  DataViewOption,
  ExtensionList,
  ExternalResource,
  GridOption,
  Metrics,
  Pagination,
  SelectEditor,
  ServicePagination,
  Subscription,
  RxJsFacade,
} from '@slickgrid-universal/common';

import {
  autoAddEditorFormatterToColumnsWithEditor,
  type AutocompleterEditor,
  GlobalGridOptions,
  GridStateType,
  SlickGroupItemMetadataProvider,

  // services
  BackendUtilityService,
  CollectionService,
  ExtensionService,
  ExtensionUtility,
  FilterFactory,
  FilterService,
  GridEventService,
  GridService,
  GridStateService,
  GroupingAndColspanService,
  type Observable,
  PaginationService,
  ResizerService,
  SharedService,
  SortService,
  SlickgridConfig,
  type TranslaterService,
  TreeDataService,

  // utilities
  deepCopy,
  emptyElement,
  unsubscribeAll,
  SlickEventHandler,
  SlickDataView,
  SlickGrid
} from '@slickgrid-universal/common';
import { EventNamingStyle, EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { SlickFooterComponent } from '@slickgrid-universal/custom-footer-component';
import { SlickPaginationComponent } from '@slickgrid-universal/pagination-component';
import { extend } from '@slickgrid-universal/utils';

import { type SlickerGridInstance } from '../interfaces/slickerGridInstance.interface';
import { UniversalContainerService } from '../services/universalContainer.service';

export class SlickVanillaGridBundle<TData = any> {
  protected _currentDatasetLength = 0;
  protected _eventPubSubService!: EventPubSubService;
  protected _darkMode = false;
  protected _columnDefinitions?: Column<TData>[];
  protected _gridOptions?: GridOption;
  protected _gridContainerElm!: HTMLElement;
  protected _gridParentContainerElm!: HTMLElement;
  protected _hideHeaderRowAfterPageLoad = false;
  protected _isAutosizeColsCalled = false;
  protected _isDatasetInitialized = false;
  protected _isDatasetHierarchicalInitialized = false;
  protected _isGridInitialized = false;
  protected _isLocalGrid = true;
  protected _isPaginationInitialized = false;
  protected _eventHandler!: SlickEventHandler;
  protected _extensions: ExtensionList<any> | undefined;
  protected _paginationOptions: Pagination | undefined;
  protected _registeredResources: ExternalResource[] = [];
  protected _slickgridInitialized = false;
  protected _slickerGridInstances: SlickerGridInstance | undefined;
  backendServiceApi: BackendServiceApi | undefined;
  dataView?: SlickDataView<TData>;
  slickGrid?: SlickGrid;
  metrics?: Metrics;
  customDataView = false;
  paginationData?: {
    gridOptions: GridOption;
    paginationService: PaginationService;
  };
  totalItems = 0;
  groupItemMetadataProvider?: SlickGroupItemMetadataProvider;
  resizerService!: ResizerService;
  subscriptions: Subscription[] = [];
  showPagination = false;

  // extensions
  extensionUtility!: ExtensionUtility;

  // services
  backendUtilityService!: BackendUtilityService;
  collectionService!: CollectionService;
  extensionService!: ExtensionService;
  filterFactory!: FilterFactory;
  filterService!: FilterService;
  gridClass!: string;
  gridClassName!: string;
  gridEventService!: GridEventService;
  gridService!: GridService;
  gridStateService!: GridStateService;
  groupingService!: GroupingAndColspanService;
  paginationService!: PaginationService;
  rxjs?: RxJsFacade;
  sharedService!: SharedService;
  sortService!: SortService;
  translaterService: TranslaterService | undefined;
  treeDataService!: TreeDataService;
  universalContainerService!: UniversalContainerService;

  // components
  slickEmptyWarning: SlickEmptyWarningComponent | undefined;
  slickFooter: SlickFooterComponent | undefined;
  slickPagination: SlickPaginationComponent | undefined;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get columnDefinitions(): Column<TData>[] {
    return this._columnDefinitions || [];
  }
  set columnDefinitions(columnDefinitions: Column<TData>[]) {
    this._columnDefinitions = columnDefinitions;
    if (this._slickgridInitialized) {
      this.updateColumnDefinitionsList(this._columnDefinitions);
    }
    if (columnDefinitions.length > 0) {
      this.copyColumnWidthsReference(columnDefinitions);
    }
  }

  get dataset(): TData[] {
    return this.dataView?.getItems() || [];
  }
  set dataset(newDataset: TData[]) {
    const prevDatasetLn = this._currentDatasetLength;
    const isDatasetEqual = dequal(newDataset, this.dataset || []);
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions?.enableDeepCopyDatasetOnPageLoad);
    let data = isDeepCopyDataOnPageLoadEnabled ? deepCopy(newDataset || []) : newDataset;

    // when Tree Data is enabled and we don't yet have the hierarchical dataset filled, we can force a convert+sort of the array
    if (this.slickGrid && this.gridOptions?.enableTreeData && Array.isArray(newDataset) && (newDataset.length > 0 || newDataset.length !== prevDatasetLn || !isDatasetEqual)) {
      this._isDatasetHierarchicalInitialized = false;
      data = this.sortTreeDataset(newDataset, !isDatasetEqual); // if dataset changed, then force a refresh anyway
    }

    this.refreshGridData(data || []);
    this._currentDatasetLength = (newDataset || []).length;

    // expand/autofit columns on first page load
    // we can assume that if the prevDataset was empty then we are on first load
    if (this.slickGrid && this.gridOptions.autoFitColumnsOnFirstLoad && prevDatasetLn === 0 && !this._isAutosizeColsCalled) {
      this.slickGrid.autosizeColumns();
      this._isAutosizeColsCalled = true;
    }
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  set datasetHierarchical(newHierarchicalDataset: any[] | undefined) {
    const isDatasetEqual = dequal(newHierarchicalDataset, this.sharedService.hierarchicalDataset || []);
    const prevFlatDatasetLn = this._currentDatasetLength;
    this.sharedService.hierarchicalDataset = newHierarchicalDataset;

    if (newHierarchicalDataset && this.columnDefinitions && this.filterService?.clearFilters) {
      this.filterService.clearFilters();
    }

    // when a hierarchical dataset is set afterward, we can reset the flat dataset and call a tree data sort that will overwrite the flat dataset
    if (this.dataView && newHierarchicalDataset && this.slickGrid && this.sortService?.processTreeDataInitialSort) {
      this.sortService.processTreeDataInitialSort();

      // we also need to reset/refresh the Tree Data filters because if we inserted new item(s) then it might not show up without doing this refresh
      // however we need 1 cpu cycle before having the DataView refreshed, so we need to wrap this check in a setTimeout
      setTimeout(() => {
        const flatDatasetLn = this.dataView?.getItemCount() ?? 0;
        if (flatDatasetLn > 0 && (flatDatasetLn !== prevFlatDatasetLn || !isDatasetEqual)) {
          this.filterService.refreshTreeDataFilters();
        }
      });
    }

    this._isDatasetHierarchicalInitialized = true;
  }

  set eventPubSubService(pubSub: EventPubSubService) {
    this._eventPubSubService = pubSub;
  }

  set isDatasetHierarchicalInitialized(isInitialized: boolean) {
    this._isDatasetHierarchicalInitialized = isInitialized;
  }

  get gridOptions(): GridOption {
    return this._gridOptions || {} as GridOption;
  }

  set gridOptions(options: GridOption) {
    let mergedOptions: GridOption;

    // if we already have grid options, when grid was already initialized, we'll merge with those options
    // else we'll merge with global grid options
    if (this.slickGrid?.getOptions) {
      mergedOptions = (extend<GridOption>(true, {} as GridOption, this.slickGrid.getOptions() as GridOption, options)) as GridOption;
    } else {
      mergedOptions = this.mergeGridOptions(options);
    }

    if (this.sharedService?.gridOptions && this.slickGrid?.setOptions) {
      this.sharedService.gridOptions = mergedOptions;
      this.slickGrid.setOptions(mergedOptions as any, false, true); // make sure to supressColumnCheck (3rd arg) to avoid problem with changeColumnsArrangement() and custom grid view
      this.slickGrid.reRenderColumns(true); // then call a re-render since we did supressColumnCheck on previous setOptions
    }

    // add/remove dark mode CSS class to parent container
    this.setDarkMode(options.darkMode);

    this._gridOptions = mergedOptions;
  }

  get paginationOptions(): Pagination | undefined {
    return this._paginationOptions;
  }
  set paginationOptions(newPaginationOptions: Pagination | undefined) {
    if (newPaginationOptions && this._paginationOptions) {
      this._paginationOptions = { ...this._paginationOptions, ...newPaginationOptions };
    } else {
      this._paginationOptions = newPaginationOptions;
    }
    this.gridOptions.pagination = this._paginationOptions;
    this.paginationService.updateTotalItems(newPaginationOptions?.totalItems ?? 0, true);
  }

  get isDatasetInitialized(): boolean {
    return this._isDatasetInitialized;
  }
  set isDatasetInitialized(isInitialized: boolean) {
    this._isDatasetInitialized = isInitialized;
  }
  get isGridInitialized(): boolean {
    return this._isGridInitialized;
  }

  get instances(): SlickerGridInstance | undefined {
    return this._slickerGridInstances;
  }

  get extensions(): ExtensionList<any> | undefined {
    return this._extensions;
  }

  get registeredResources(): any[] {
    return this._registeredResources;
  }

  /**
   * Slicker Grid Bundle constructor
   * @param {Object} gridParentContainerElm - div HTML DOM element container
   * @param {Array<Column>} columnDefs - Column Definitions
   * @param {Object} options - Grid Options
   * @param {Array<Object>} dataset - Dataset
   * @param {Array<Object>} hierarchicalDataset - Hierarchical Dataset
   * @param {Object} services - Typically only used for Unit Testing when we want to pass Mocked/Stub Services
   */
  constructor(
    gridParentContainerElm: HTMLElement,
    columnDefs?: Column<TData>[],
    options?: Partial<GridOption>,
    dataset?: TData[],
    hierarchicalDataset?: any[],
    services?: {
      backendUtilityService?: BackendUtilityService,
      collectionService?: CollectionService,
      eventPubSubService?: EventPubSubService,
      extensionService?: ExtensionService,
      extensionUtility?: ExtensionUtility,
      filterService?: FilterService,
      gridEventService?: GridEventService,
      gridService?: GridService,
      gridStateService?: GridStateService,
      groupingAndColspanService?: GroupingAndColspanService,
      paginationService?: PaginationService,
      resizerService?: ResizerService,
      rxjs?: RxJsFacade,
      sharedService?: SharedService,
      sortService?: SortService,
      treeDataService?: TreeDataService,
      translaterService?: TranslaterService,
      universalContainerService?: UniversalContainerService,
    }
  ) {
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

    // check if the user wants to hide the header row from the start
    // we only want to do this check once in the constructor
    this._hideHeaderRowAfterPageLoad = (options?.showHeaderRow === false);

    this._columnDefinitions = columnDefs || [];
    if (this._columnDefinitions.length > 0) {
      this.copyColumnWidthsReference(this._columnDefinitions);
    }

    // save resource refs to register before the grid options are merged and possibly deep copied
    // since a deep copy of grid options would lose original resource refs but we want to keep them as singleton
    this._registeredResources = options?.externalResources || [];

    this._gridOptions = this.mergeGridOptions(options || {});
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions?.enableDeepCopyDatasetOnPageLoad);

    // add dark mode CSS class when enabled
    if (this._gridOptions.darkMode) {
      this.setDarkMode(true);
    }

    this.universalContainerService = services?.universalContainerService ?? new UniversalContainerService();

    // if user is providing a Translate Service, it has to be passed under the "translater" grid option
    this.translaterService = services?.translaterService ?? this._gridOptions?.translater;

    // initialize and assign all Service Dependencies
    this._eventPubSubService = services?.eventPubSubService ?? new EventPubSubService(gridParentContainerElm);
    this._eventPubSubService.eventNamingStyle = this._gridOptions?.eventNamingStyle ?? EventNamingStyle.camelCase;

    const slickgridConfig = new SlickgridConfig();
    this.backendUtilityService = services?.backendUtilityService ?? new BackendUtilityService();
    this.gridEventService = services?.gridEventService ?? new GridEventService();
    this.sharedService = services?.sharedService ?? new SharedService();
    this.collectionService = services?.collectionService ?? new CollectionService(this.translaterService);
    this.extensionUtility = services?.extensionUtility ?? new ExtensionUtility(this.sharedService, this.backendUtilityService, this.translaterService);
    this.filterFactory = new FilterFactory(slickgridConfig, this.translaterService, this.collectionService);
    this.filterService = services?.filterService ?? new FilterService(this.filterFactory, this._eventPubSubService, this.sharedService, this.backendUtilityService);
    this.resizerService = services?.resizerService ?? new ResizerService(this._eventPubSubService);
    this.sortService = services?.sortService ?? new SortService(this.sharedService, this._eventPubSubService, this.backendUtilityService);
    this.treeDataService = services?.treeDataService ?? new TreeDataService(this._eventPubSubService, this.sharedService, this.sortService);
    this.paginationService = services?.paginationService ?? new PaginationService(this._eventPubSubService, this.sharedService, this.backendUtilityService);

    this.extensionService = services?.extensionService ?? new ExtensionService(
      this.extensionUtility,
      this.filterService,
      this._eventPubSubService,
      this.sharedService,
      this.sortService,
      this.treeDataService,
      this.translaterService,
      () => this.gridService
    );

    this.gridStateService = services?.gridStateService ?? new GridStateService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService, this.treeDataService);
    this.gridService = services?.gridService ?? new GridService(this.gridStateService, this.filterService, this._eventPubSubService, this.paginationService, this.sharedService, this.sortService, this.treeDataService);
    this.groupingService = services?.groupingAndColspanService ?? new GroupingAndColspanService(this.extensionUtility, this._eventPubSubService);

    if (hierarchicalDataset) {
      this.sharedService.hierarchicalDataset = (isDeepCopyDataOnPageLoadEnabled ? deepCopy(hierarchicalDataset || []) : hierarchicalDataset) || [];
    }
    const eventHandler = new SlickEventHandler();

    // register all service instances in the container
    this.universalContainerService.registerInstance('PubSubService', this._eventPubSubService); // external resources require this one registration (ExcelExport, TextExport)
    this.universalContainerService.registerInstance('EventPubSubService', this._eventPubSubService);
    this.universalContainerService.registerInstance('ExtensionUtility', this.extensionUtility);
    this.universalContainerService.registerInstance('FilterService', this.filterService);
    this.universalContainerService.registerInstance('CollectionService', this.collectionService);
    this.universalContainerService.registerInstance('ExtensionService', this.extensionService);
    this.universalContainerService.registerInstance('GridEventService', this.gridEventService);
    this.universalContainerService.registerInstance('GridService', this.gridService);
    this.universalContainerService.registerInstance('GridStateService', this.gridStateService);
    this.universalContainerService.registerInstance('GroupingAndColspanService', this.groupingService);
    this.universalContainerService.registerInstance('PaginationService', this.paginationService);
    this.universalContainerService.registerInstance('ResizerService', this.resizerService);
    this.universalContainerService.registerInstance('SharedService', this.sharedService);
    this.universalContainerService.registerInstance('SortService', this.sortService);
    this.universalContainerService.registerInstance('TranslaterService', this.translaterService);
    this.universalContainerService.registerInstance('TreeDataService', this.treeDataService);

    this.initialization(this._gridContainerElm, eventHandler, dataset);
  }

  emptyGridContainerElm() {
    const gridContainerId = this.gridOptions?.gridContainerId ?? 'grid1';
    const gridContainerElm = document.querySelector(`#${gridContainerId}`);
    emptyElement(gridContainerElm);
  }

  /** Dispose of the Component */
  dispose(shouldEmptyDomElementContainer = false) {
    this._eventPubSubService?.publish('onBeforeGridDestroy', this.slickGrid);
    this._eventHandler?.unsubscribeAll();
    this._eventPubSubService?.publish('onAfterGridDestroyed', true);

    // dispose the Services
    this.extensionService?.dispose();
    this.filterService?.dispose();
    this.gridEventService?.dispose();
    this.gridService?.dispose();
    this.gridStateService?.dispose();
    this.groupingService?.dispose();
    this.paginationService?.dispose();
    this.resizerService?.dispose();
    this.sortService?.dispose();
    this.treeDataService?.dispose();
    this.universalContainerService?.dispose();

    // dispose all registered external resources
    this.disposeExternalResources();

    // dispose the Components
    this.slickFooter?.dispose();
    this.slickEmptyWarning?.dispose();
    this.slickPagination?.dispose();

    unsubscribeAll(this.subscriptions);
    this._eventPubSubService?.unsubscribeAll();
    this.dataView?.setItems([]);
    if (typeof this.dataView?.destroy === 'function') {
      this.dataView?.destroy();
    }
    this.slickGrid?.destroy(true);
    this.slickGrid = null as any;

    emptyElement(this._gridContainerElm);
    emptyElement(this._gridParentContainerElm);
    this._gridContainerElm?.remove();
    this._gridParentContainerElm?.remove();

    if (this.backendServiceApi) {
      for (const prop of Object.keys(this.backendServiceApi)) {
        this.backendServiceApi[prop as keyof BackendServiceApi] = null;
      }
      this.backendServiceApi = undefined;
    }
    for (const prop of Object.keys(this.columnDefinitions)) {
      (this.columnDefinitions as any)[prop] = null;
    }
    for (const prop of Object.keys(this.sharedService)) {
      (this.sharedService as any)[prop] = null;
    }
    this.datasetHierarchical = undefined;
    this._columnDefinitions = [];

    // we could optionally also empty the content of the grid container DOM element
    if (shouldEmptyDomElementContainer) {
      this.emptyGridContainerElm();
    }
    this._eventPubSubService?.dispose();
    this._slickerGridInstances = null as any;
  }

  disposeExternalResources() {
    if (Array.isArray(this._registeredResources)) {
      while (this._registeredResources.length > 0) {
        const res = this._registeredResources.pop();
        if (res?.dispose) {
          res.dispose();
        }
      }
    }
    this._registeredResources = [];
  }

  initialization(gridContainerElm: HTMLElement, eventHandler: SlickEventHandler, inputDataset?: TData[]) {
    // when detecting a frozen grid, we'll automatically enable the mousewheel scroll handler so that we can scroll from both left/right frozen containers
    if (this.gridOptions && ((this.gridOptions.frozenRow !== undefined && this.gridOptions.frozenRow >= 0) || this.gridOptions.frozenColumn !== undefined && this.gridOptions.frozenColumn >= 0) && this.gridOptions.enableMouseWheelScrollHandler === undefined) {
      this.gridOptions.enableMouseWheelScrollHandler = true;
    }

    // create the slickgrid container and add it to the user's grid container
    this._gridContainerElm = gridContainerElm;
    this._eventPubSubService.publish('onBeforeGridCreate', true);

    this._isAutosizeColsCalled = false;
    this._eventHandler = eventHandler;
    this._gridOptions = this.mergeGridOptions(this._gridOptions || {} as GridOption);
    this.backendServiceApi = this._gridOptions?.backendServiceApi;
    this._isLocalGrid = !this.backendServiceApi; // considered a local grid if it doesn't have a backend service set
    this._eventPubSubService.eventNamingStyle = this._gridOptions?.eventNamingStyle ?? EventNamingStyle.camelCase;
    this._paginationOptions = this.gridOptions?.pagination;

    this.createBackendApiInternalPostProcessCallback(this._gridOptions);

    if (!this.customDataView) {
      const dataviewInlineFilters = this._gridOptions?.dataView?.inlineFilters ?? false;
      let dataViewOptions: Partial<DataViewOption> = { ...this._gridOptions.dataView, inlineFilters: dataviewInlineFilters };

      if (this.gridOptions.draggableGrouping || this.gridOptions.enableGrouping) {
        this.groupItemMetadataProvider = new SlickGroupItemMetadataProvider();
        this.sharedService.groupItemMetadataProvider = this.groupItemMetadataProvider;
        dataViewOptions = { ...dataViewOptions, groupItemMetadataProvider: this.groupItemMetadataProvider };
      }
      this.dataView = new SlickDataView<TData>(dataViewOptions, this._eventPubSubService);
      this._eventPubSubService.publish('onDataviewCreated', this.dataView);
    }

    // get any possible Services that user want to register which don't require SlickGrid to be instantiated
    // RxJS Resource is in this lot because it has to be registered before anything else and doesn't require SlickGrid to be initialized
    this.preRegisterResources();

    // for convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
    // however "editor" is used internally by SlickGrid for it's own Editor Factory
    // so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
    // then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
    this._columnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(this._columnDefinitions || []);

    // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
    if (this._gridOptions?.autoAddCustomEditorFormatter) {
      autoAddEditorFormatterToColumnsWithEditor(this._columnDefinitions, this._gridOptions.autoAddCustomEditorFormatter);
    }

    // save reference for all columns before they optionally become hidden/visible
    this.sharedService.allColumns = this._columnDefinitions;
    this.sharedService.visibleColumns = this._columnDefinitions;

    // TODO: revisit later, this is conflicting with Grid State & Presets
    // before certain extentions/plugins potentially adds extra columns not created by the user itself (RowMove, RowDetail, RowSelections)
    // we'll subscribe to the event and push back the change to the user so they always use full column defs array including extra cols
    // this.subscriptions.push(
    //   this._eventPubSubService.subscribe<{ columns: Column[]; pluginName: string }>('onPluginColumnsChanged', data => {
    //     this._columnDefinitions = this.columnDefinitions = data.columns;
    //   })
    // );

    // after subscribing to potential columns changed, we are ready to create these optional extensions
    // when we did find some to create (RowMove, RowDetail, RowSelections), it will automatically modify column definitions (by previous subscribe)
    this.extensionService.createExtensionsBeforeGridCreation(this._columnDefinitions, this._gridOptions);

    // if user entered some Pinning/Frozen "presets", we need to apply them in the grid options
    if (this.gridOptions.presets?.pinning) {
      this.gridOptions = { ...this.gridOptions, ...this.gridOptions.presets.pinning };
    }

    this.slickGrid = new SlickGrid<TData, Column<TData>, GridOption<Column<TData>>>(gridContainerElm, this.dataView as SlickDataView<TData>, this._columnDefinitions, this._gridOptions, this._eventPubSubService);
    this.sharedService.dataView = this.dataView as SlickDataView;
    this.sharedService.slickGrid = this.slickGrid as SlickGrid;
    this.sharedService.gridContainerElement = this._gridContainerElm;
    if (this.groupItemMetadataProvider) {
      this.slickGrid.registerPlugin(this.groupItemMetadataProvider); // register GroupItemMetadataProvider when Grouping is enabled
    }

    this.extensionService.bindDifferentExtensions();
    this.bindDifferentHooks(this.slickGrid, this._gridOptions, this.dataView as SlickDataView);
    this._slickgridInitialized = true;

    // when it's a frozen grid, we need to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward
    const frozenColumnIndex = this._gridOptions?.frozenColumn ?? -1;
    if (frozenColumnIndex >= 0 && frozenColumnIndex <= this._columnDefinitions.length && this._columnDefinitions.length > 0) {
      this.sharedService.frozenVisibleColumnId = this._columnDefinitions[frozenColumnIndex]?.id ?? '';
    }

    // get any possible Services that user want to register
    this.registerResources();

    // initialize the SlickGrid grid
    this.slickGrid.init();

    // initialized the resizer service only after SlickGrid is initialized
    // if we don't we end up binding our resize to a grid element that doesn't yet exist in the DOM and the resizer service will fail silently (because it has a try/catch that unbinds the resize without throwing back)
    this.resizerService.init(this.slickGrid, this._gridParentContainerElm);

    // user could show a custom footer with the data metrics (dataset length and last updated timestamp)
    if (!this.gridOptions.enablePagination && this.gridOptions.showCustomFooter && this.gridOptions.customFooterOptions) {
      this.slickFooter = new SlickFooterComponent(this.slickGrid, this.gridOptions.customFooterOptions, this._eventPubSubService, this.translaterService);
      this.slickFooter.renderFooter(this._gridParentContainerElm);
    }

    // load the data in the DataView (unless it's a hierarchical dataset, if so it will be loaded after the initial tree sort)
    if (this.dataView) {
      inputDataset = inputDataset || [];
      const initialDataset = this.gridOptions?.enableTreeData ? this.sortTreeDataset(inputDataset) : inputDataset;
      this.dataView.beginUpdate();
      this.dataView.setItems(initialDataset, this._gridOptions.datasetIdPropertyName);
      this._currentDatasetLength = inputDataset.length;
      this.dataView.endUpdate();
    }

    // if you don't want the items that are not visible (due to being filtered out or being on a different page)
    // to stay selected, pass 'false' to the second arg
    if (this.slickGrid?.getSelectionModel() && this._gridOptions?.dataView?.hasOwnProperty('syncGridSelection')) {
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
        this.dataView?.syncGridSelection(this.slickGrid, preservedRowSelection);
      } else if (typeof syncGridSelection === 'object') {
        this.dataView?.syncGridSelection(this.slickGrid, syncGridSelection.preserveHidden, syncGridSelection.preserveHiddenOnSelectionChange);
      }
    }

    if ((this.dataView?.getLength() ?? 0) > 0) {
      if (!this._isDatasetInitialized && (this._gridOptions.enableCheckboxSelector || this._gridOptions.enableRowSelection)) {
        this.loadRowSelectionPresetWhenExists();
      }
      this.loadFilterPresetsWhenDatasetInitialized();
      this._isDatasetInitialized = true;
    } else {
      this.displayEmptyDataWarning(true);
    }

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

    // bind the Backend Service API callback functions only after the grid is initialized
    // because the preProcess() and onInit() might get triggered
    if (this.gridOptions?.backendServiceApi) {
      this.bindBackendCallbackFunctions(this.gridOptions);
    }

    // publish & dispatch certain events
    this._eventPubSubService.publish('onGridCreated', this.slickGrid);

    // after the DataView is created & updated execute some processes & dispatch some events
    if (!this.customDataView) {
      this.executeAfterDataviewCreated(this.gridOptions);
    }

    // bind resize ONLY after the dataView is ready
    this.bindResizeHook(this.slickGrid, this.gridOptions);

    // local grid, check if we need to show the Pagination
    // if so then also check if there's any presets and finally initialize the PaginationService
    // a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
    if (this.gridOptions?.enablePagination && this._isLocalGrid) {
      this.showPagination = true;
      this.loadLocalGridPagination(this.dataset);
    }

    // once the grid is created, we'll return its instance (we do this to return Transient Services from DI)
    this._slickerGridInstances = {
      // Slick Grid & DataView objects
      dataView: this.dataView as SlickDataView,
      slickGrid: this.slickGrid,

      // public methods
      dispose: this.dispose.bind(this),

      // return all available Services (non-singleton)
      backendService: this.gridOptions?.backendServiceApi?.service,
      eventPubSubService: this._eventPubSubService,
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
    const options = extend<GridOption>(true, {}, GlobalGridOptions, gridOptions);

    // also make sure to show the header row if user have enabled filtering
    if (options.enableFiltering && !options.showHeaderRow) {
      options.showHeaderRow = options.enableFiltering;
    }

    // using copy extend to do a deep clone has an unwanted side on objects and pageSizes but ES6 spread has other worst side effects
    // so we will just overwrite the pageSizes when needed, this is the only one causing issues so far.
    // On a deep extend, Object and Array are extended, but object wrappers on primitive types such as String, Boolean, and Number are not.
    if (options?.pagination && (gridOptions.enablePagination || gridOptions.backendServiceApi) && gridOptions.pagination && Array.isArray(gridOptions.pagination.pageSizes)) {
      options.pagination.pageSizes = gridOptions.pagination.pageSizes;
    }

    // when we use Pagination on Local Grid, it doesn't seem to work without enableFiltering
    // so we'll enable the filtering but we'll keep the header row hidden
    if (this.sharedService && !options.enableFiltering && options.enablePagination && this._isLocalGrid) {
      options.enableFiltering = true;
      options.showHeaderRow = false;
      this._hideHeaderRowAfterPageLoad = true;
      this.sharedService.hideHeaderRowAfterPageLoad = true;
    }

    return options;
  }

  /**
   * Define our internal Post Process callback, it will execute internally after we get back result from the Process backend call
   * For now, this is GraphQL Service ONLY feature and it will basically
   * refresh the Dataset & Pagination without having the user to create his own PostProcess every time
   */
  createBackendApiInternalPostProcessCallback(gridOptions?: GridOption) {
    const backendApi = gridOptions?.backendServiceApi;
    if (backendApi?.service) {
      const backendApiService = backendApi.service;

      // internalPostProcess only works (for now) with a GraphQL Service, so make sure it is of that type
      if (/* backendApiService instanceof GraphqlService || */ typeof backendApiService.getDatasetName === 'function') {
        backendApi.internalPostProcess = (processResult: any) => {
          const datasetName = (backendApi && backendApiService && typeof backendApiService.getDatasetName === 'function') ? backendApiService.getDatasetName() : '';
          if (processResult && processResult.data && processResult.data[datasetName]) {
            const data = processResult.data[datasetName].hasOwnProperty('nodes') ? (processResult as any).data[datasetName].nodes : (processResult as any).data[datasetName];
            const totalCount = processResult.data[datasetName].hasOwnProperty('totalCount') ? (processResult as any).data[datasetName].totalCount : (processResult as any).data[datasetName].length;
            this.refreshGridData(data, totalCount || 0);
          }
        };
      }
    }
  }

  bindDifferentHooks(grid: SlickGrid, gridOptions: GridOption, dataView: SlickDataView<TData>) {
    // if user is providing a Translate Service, we need to add our PubSub Service (but only after creating all dependencies)
    // so that we can later subscribe to the "onLanguageChange" event and translate any texts whenever that get triggered
    if (gridOptions.enableTranslate && this.translaterService?.addPubSubMessaging) {
      this.translaterService.addPubSubMessaging(this._eventPubSubService);
    }

    // translate them all on first load, then on each language change
    if (gridOptions.enableTranslate) {
      this.extensionService.translateAllExtensions();
    }

    // on locale change, we have to manually translate the Headers, GridMenu
    this.subscriptions.push(
      this._eventPubSubService.subscribe('onLanguageChange', (args: { language: string; }) => {
        if (gridOptions.enableTranslate) {
          this.extensionService.translateAllExtensions(args.language);
          if (gridOptions.createPreHeaderPanel && !gridOptions.enableDraggableGrouping) {
            this.groupingService.translateGroupingAndColSpan();
          }
        }
      })
    );

    // if user set an onInit Backend, we'll run it right away (and if so, we also need to run preProcess, internalPostProcess & postProcess)
    if (gridOptions.backendServiceApi) {
      const backendApi = gridOptions.backendServiceApi;

      if (backendApi?.service?.init) {
        backendApi.service.init(backendApi.options, gridOptions.pagination, this.slickGrid, this.sharedService);
      }
    }

    if (dataView && grid) {
      // after all events are exposed
      // we can bind external filter (backend) when available or default onFilter (dataView)
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

      // When data changes in the DataView, we need to refresh the metrics and/or display a warning if the dataset is empty
      this._eventHandler.subscribe(dataView.onRowCountChanged, () => {
        grid.invalidate();
        this.handleOnItemCountChanged(this.dataView?.getFilteredItemCount() || 0, this.dataView?.getItemCount() ?? 0);
      });
      this._eventHandler.subscribe(dataView.onSetItemsCalled, (_e, args) => {
        this.handleOnItemCountChanged(this.dataView?.getFilteredItemCount() || 0, args.itemCount);

        // when user has resize by content enabled, we'll force a full width calculation since we change our entire dataset
        if (args.itemCount > 0 && (this.gridOptions.autosizeColumnsByCellContentOnFirstLoad || this.gridOptions.enableAutoResizeColumnsByCellContent)) {
          this.resizerService.resizeColumnsByCellContent(!this.gridOptions?.resizeByContentOnlyOnFirstLoad);
        }
      });

      // when filtering data with local dataset, we need to update each row else it will not always show correctly in the UI
      // also don't use "invalidateRows" since it destroys the entire row and as bad user experience when updating a row
      if (gridOptions?.enableFiltering && !gridOptions.enableRowDetailView) {
        this._eventHandler.subscribe(dataView.onRowsChanged, (_e, args) => {
          if (args?.rows && Array.isArray(args.rows)) {
            args.rows.forEach((row: number) => grid.updateRow(row));
            grid.render();
          }
        });
      }

      // when column are reordered, we need to update the visibleColumn array
      this._eventHandler.subscribe(grid.onColumnsReordered, (_e, args) => {
        this.sharedService.hasColumnsReordered = true;
        this.sharedService.visibleColumns = args.impactedColumns;
      });

      this._eventHandler.subscribe(grid.onSetOptions, (_e, args) => {
        // add/remove dark mode CSS class when enabled
        if (args.optionsBefore.darkMode !== args.optionsAfter.darkMode) {
          this.setDarkMode(args.optionsAfter.darkMode);
        }
      });

      // load any presets if any (after dataset is initialized)
      this.loadColumnPresetsWhenDatasetInitialized();
      this.loadFilterPresetsWhenDatasetInitialized();
    }

    // did the user add a colspan callback? If so, hook it into the DataView getItemMetadata
    if (gridOptions?.colspanCallback && dataView?.getItem && dataView?.getItemMetadata) {
      dataView.getItemMetadata = (rowNumber: number) => {
        let callbackResult = null;
        if (gridOptions.colspanCallback) {
          callbackResult = gridOptions.colspanCallback(dataView.getItem(rowNumber));
        }
        return callbackResult;
      };
    }
  }

  bindBackendCallbackFunctions(gridOptions: GridOption) {
    const backendApi = gridOptions.backendServiceApi;
    const backendApiService = backendApi?.service;
    const serviceOptions: BackendServiceOption = backendApiService?.options ?? {};
    const isExecuteCommandOnInit = (!serviceOptions) ? false : ((serviceOptions?.hasOwnProperty('executeProcessCommandOnInit')) ? serviceOptions['executeProcessCommandOnInit'] : true);

    if (backendApiService) {
      // update backend filters (if need be) BEFORE the query runs (via the onInit command a few lines below)
      // if user entered some any "presets", we need to reflect them all in the grid
      if (gridOptions?.presets) {
        // Filters "presets"
        if (backendApiService.updateFilters && Array.isArray(gridOptions.presets.filters) && gridOptions.presets.filters.length > 0) {
          backendApiService.updateFilters(gridOptions.presets.filters, true);
        }
        // Sorters "presets"
        if (backendApiService.updateSorters && Array.isArray(gridOptions.presets.sorters) && gridOptions.presets.sorters.length > 0) {
          // when using multi-column sort, we can have multiple but on single sort then only grab the first sort provided
          const sortColumns = this._gridOptions?.multiColumnSort ? gridOptions.presets.sorters : gridOptions.presets.sorters.slice(0, 1);
          backendApiService.updateSorters(undefined, sortColumns);
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
        const process = isExecuteCommandOnInit ? (backendApi.process?.(query) ?? null) : (backendApi.onInit?.(query) ?? null);

        // wrap this inside a setTimeout to avoid timing issue since the gridOptions needs to be ready before running this onInit
        setTimeout(() => {
          const backendUtilityService = this.backendUtilityService as BackendUtilityService;
          // keep start time & end timestamps & return it after process execution
          const startTime = new Date();

          // run any pre-process, if defined, for example a spinner
          if (backendApi.preProcess) {
            backendApi.preProcess();
          }

          // the processes can be a Promise (like Http)
          const totalItems = this.gridOptions?.pagination?.totalItems ?? 0;
          if (process instanceof Promise) {
            process
              .then((processResult: any) => backendUtilityService.executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems))
              .catch((error) => backendUtilityService.onBackendError(error, backendApi));
          } else if (process && this.rxjs?.isObservable(process)) {
            this.subscriptions.push(
              (process as Observable<any>).subscribe(
                (processResult: any) => backendUtilityService.executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems),
                (error: any) => backendUtilityService.onBackendError(error, backendApi)
              )
            );
          }
        });
      }
    }
  }

  bindResizeHook(grid: SlickGrid, options: GridOption) {
    if ((options.autoFitColumnsOnFirstLoad && options.autosizeColumnsByCellContentOnFirstLoad) || (options.enableAutoSizeColumns && options.enableAutoResizeColumnsByCellContent)) {
      throw new Error(`[Slickgrid-Universal] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use. You can enable these 2 options ("autoFitColumnsOnFirstLoad" and "enableAutoSizeColumns") OR these other 2 options ("autosizeColumnsByCellContentOnFirstLoad" and "enableAutoResizeColumnsByCellContent").`);
    }

    // auto-resize grid on browser resize (optionally provide grid height or width)
    if (options.gridHeight || options.gridWidth) {
      this.resizerService.resizeGrid(0, { height: options.gridHeight, width: options.gridWidth });
    } else {
      this.resizerService.resizeGrid();
    }

    // expand/autofit columns on first page load
    if (grid && options?.enableAutoResize && options.autoFitColumnsOnFirstLoad && options.enableAutoSizeColumns && !this._isAutosizeColsCalled) {
      grid.autosizeColumns();
      this._isAutosizeColsCalled = true;
    }
  }

  executeAfterDataviewCreated(gridOptions: GridOption) {
    // if user entered some Sort "presets", we need to reflect them all in the DOM
    if (gridOptions.enableSorting) {
      if (gridOptions.presets && Array.isArray(gridOptions.presets.sorters)) {
        // when using multi-column sort, we can have multiple but on single sort then only grab the first sort provided
        const sortColumns = this._gridOptions?.multiColumnSort ? gridOptions.presets.sorters : gridOptions.presets.sorters.slice(0, 1);
        this.sortService.loadGridSorters(sortColumns);
      }
    }
  }

  /**
   * On a Pagination changed, we will trigger a Grid State changed with the new pagination info
   * Also if we use Row Selection or the Checkbox Selector with a Backend Service (Odata, GraphQL), we need to reset any selection
   */
  paginationChanged(pagination: ServicePagination) {
    const isSyncGridSelectionEnabled = this.gridStateService?.needToPreserveRowSelection() ?? false;
    if (this.slickGrid && !isSyncGridSelectionEnabled && this._gridOptions?.backendServiceApi && (this.gridOptions.enableRowSelection || this.gridOptions.enableCheckboxSelector)) {
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
  refreshGridData(dataset: TData[], totalCount?: number) {
    // local grid, check if we need to show the Pagination
    // if so then also check if there's any presets and finally initialize the PaginationService
    // a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
    if (this.slickGrid && this._gridOptions) {
      if (this._gridOptions.enableEmptyDataWarningMessage && Array.isArray(dataset)) {
        const finalTotalCount = totalCount || dataset.length;
        this.displayEmptyDataWarning(finalTotalCount < 1);
      }

      if (Array.isArray(dataset) && this.slickGrid && this.dataView?.setItems) {
        this.dataView.setItems(dataset, this._gridOptions.datasetIdPropertyName);
        if (!this._gridOptions.backendServiceApi && !this._gridOptions.enableTreeData) {
          this.dataView.reSort();
        }

        if (dataset.length > 0) {
          if (!this._isDatasetInitialized) {
            this.loadFilterPresetsWhenDatasetInitialized();

            if (this._gridOptions.enableCheckboxSelector) {
              this.loadRowSelectionPresetWhenExists();
            }
          }
          this._isDatasetInitialized = true;
        }

        if (dataset) {
          this.slickGrid.invalidate();
        }

        // display the Pagination component only after calling this refresh data first, we call it here so that if we preset pagination page number it will be shown correctly
        this.showPagination = (this._gridOptions && (this._gridOptions.enablePagination || (this._gridOptions.backendServiceApi && this._gridOptions.enablePagination === undefined))) ? true : false;

        if (this._paginationOptions && this._gridOptions?.pagination && this._gridOptions?.backendServiceApi) {
          const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this._gridOptions, this._paginationOptions);

          // when we have a totalCount use it, else we'll take it from the pagination object
          // only update the total items if it's different to avoid refreshing the UI
          const totalRecords = (totalCount !== undefined) ? totalCount : (this._gridOptions?.pagination?.totalItems);
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
  }

  /**
   * Dynamically change or update the column definitions list.
   * We will re-render the grid so that the new header and data shows up correctly.
   * If using translater, we also need to trigger a re-translate of the column headers
   */
  updateColumnDefinitionsList(newColumnDefinitions: Column<TData>[]) {
    if (this.slickGrid && this._gridOptions && Array.isArray(newColumnDefinitions)) {
      // map/swap the internal library Editor to the SlickGrid Editor factory
      newColumnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(newColumnDefinitions);

      // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
      if (this._gridOptions.autoAddCustomEditorFormatter) {
        autoAddEditorFormatterToColumnsWithEditor(newColumnDefinitions, this._gridOptions.autoAddCustomEditorFormatter);
      }

      if (this._gridOptions.enableTranslate) {
        this.extensionService.translateColumnHeaders(undefined, newColumnDefinitions);
      } else {
        this.extensionService.renderColumnHeaders(newColumnDefinitions, true);
      }

      if (this.slickGrid && this._gridOptions?.enableAutoSizeColumns) {
        this.slickGrid.autosizeColumns();
      } else if (this._gridOptions?.enableAutoResizeColumnsByCellContent && this.resizerService?.resizeColumnsByCellContent) {
        this.resizerService.resizeColumnsByCellContent();
      }
    }
  }

  /**
   * Show the filter row displayed on first row, we can optionally pass false to hide it.
   * @param showing
   */
  showHeaderRow(showing = true) {
    this.slickGrid?.setHeaderRowVisibility(showing);
    if (this.slickGrid && showing === true && this._isGridInitialized) {
      this.slickGrid.setColumns(this.columnDefinitions);
    }
    return showing;
  }

  setData(data: TData[], shouldAutosizeColumns = false) {
    if (shouldAutosizeColumns) {
      this._isAutosizeColsCalled = false;
      this._currentDatasetLength = 0;
    }
    this.dataset = data || [];
  }

  /**
   * Check if there's any Pagination Presets defined in the Grid Options,
   * if there are then load them in the paginationOptions object
   */
  setPaginationOptionsWhenPresetDefined(gridOptions: GridOption, paginationOptions: Pagination): Pagination {
    if (gridOptions.presets?.pagination && paginationOptions && !this._isPaginationInitialized) {
      paginationOptions.pageSize = gridOptions.presets.pagination.pageSize;
      paginationOptions.pageNumber = gridOptions.presets.pagination.pageNumber;
    }
    return paginationOptions;
  }

  setDarkMode(dark = false) {
    if (dark) {
      this._gridParentContainerElm.classList.add('slick-dark-mode');
    } else {
      this._gridParentContainerElm.classList.remove('slick-dark-mode');
    }
  }

  // --
  // protected functions
  // ------------------

  /**
   * Loop through all column definitions and copy the original optional `width` properties optionally provided by the user.
   * We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
   */
  protected copyColumnWidthsReference(columnDefinitions: Column<TData>[]) {
    columnDefinitions.forEach(col => col.originalWidth = col.width);
  }

  protected displayEmptyDataWarning(showWarning = true) {
    if (this.gridOptions.enableEmptyDataWarningMessage) {
      this.slickEmptyWarning?.showEmptyDataMessage(showWarning);
    }
  }

  /** When data changes in the DataView, we'll refresh the metrics and/or display a warning if the dataset is empty */
  protected handleOnItemCountChanged(currentPageRowItemCount: number, totalItemCount: number) {
    this._currentDatasetLength = totalItemCount;
    this.metrics = {
      startTime: new Date(),
      endTime: new Date(),
      itemCount: currentPageRowItemCount,
      totalItemCount
    };
    // if custom footer is enabled, then we'll update its metrics
    if (this.slickFooter) {
      this.slickFooter.metrics = this.metrics;
    }

    // when using local (in-memory) dataset, we'll display a warning message when filtered data is empty
    if (this._isLocalGrid && this._gridOptions?.enableEmptyDataWarningMessage) {
      this.displayEmptyDataWarning(currentPageRowItemCount === 0);
    }
  }

  /** Initialize the Pagination Service once */
  protected initializePaginationService(paginationOptions: Pagination) {
    if (this.slickGrid && this.gridOptions) {
      this.paginationData = {
        gridOptions: this.gridOptions,
        paginationService: this.paginationService,
      };
      this.paginationService.totalItems = this.totalItems;
      this.paginationService.init(this.slickGrid, paginationOptions, this.backendServiceApi);
      this.subscriptions.push(
        this._eventPubSubService.subscribe<ServicePagination>('onPaginationChanged', paginationChanges => this.paginationChanged(paginationChanges)),
        this._eventPubSubService.subscribe<{ visible: boolean; }>('onPaginationVisibilityChanged', visibility => {
          this.showPagination = visibility?.visible ?? false;
          if (this.gridOptions?.backendServiceApi) {
            this.backendUtilityService?.refreshBackendDataset(this.gridOptions);
          }
          this.renderPagination(this.showPagination);
        })
      );

      // also initialize (render) the pagination component
      this.renderPagination();
      this._isPaginationInitialized = true;
    }
  }

  /**
   * Render (or dispose) the Pagination Component, user can optionally provide False (to not show it) which will in term dispose of the Pagination,
   * also while disposing we can choose to omit the disposable of the Pagination Service (if we are simply toggling the Pagination, we want to keep the Service alive)
   * @param {Boolean} showPagination - show (new render) or not (dispose) the Pagination
   * @param {Boolean} shouldDisposePaginationService - when disposing the Pagination, do we also want to dispose of the Pagination Service? (defaults to True)
   */
  protected renderPagination(showPagination = true) {
    if (this._gridOptions?.enablePagination && !this._isPaginationInitialized && showPagination) {
      this.slickPagination = new SlickPaginationComponent(this.paginationService, this._eventPubSubService, this.sharedService, this.translaterService);
      this.slickPagination.renderPagination(this._gridParentContainerElm);
      this._isPaginationInitialized = true;
    } else if (!showPagination) {
      if (this.slickPagination) {
        this.slickPagination.dispose();
      }
      this._isPaginationInitialized = false;
    }
  }

  /** Load the Editor Collection asynchronously and replace the "collection" property when Promise resolves */
  protected loadEditorCollectionAsync(column: Column<TData>) {
    if (column?.editor) {
      const collectionAsync = column.editor.collectionAsync;
      column.editor.disabled = true; // disable the Editor DOM element, we'll re-enable it after receiving the collection with "updateEditorCollection()"

      if (collectionAsync instanceof Promise) {
        // wait for the "collectionAsync", once resolved we will save it into the "collection"
        // the collectionAsync can be of 3 types HttpClient, HttpFetch or a Promise
        collectionAsync.then((response: any | any[]) => {
          if (Array.isArray(response)) {
            this.updateEditorCollection(column, response); // from Promise
          } else if (response?.status >= 200 && response.status < 300 && typeof response.json === 'function') {
            if (response.bodyUsed) {
              console.warn(`[SlickGrid-Universal] The response body passed to collectionAsync was already read.`
                + `Either pass the dataset from the Response or clone the response first using response.clone()`);
            } else {
              // from Fetch
              (response as Response).json().then(data => this.updateEditorCollection(column, data));
            }
          } else if (response?.content) {
            this.updateEditorCollection(column, response['content']); // from http-client
          }
        });
      } else if (this.rxjs?.isObservable(collectionAsync)) {
        // wrap this inside a setTimeout to avoid timing issue since updateEditorCollection requires to call SlickGrid getColumns() method
        setTimeout(() => {
          this.subscriptions.push(
            (collectionAsync as Observable<any>).subscribe((resolvedCollection) => this.updateEditorCollection(column, resolvedCollection))
          );
        });
      }
    }
  }

  protected insertDynamicPresetColumns(columnId: string, gridPresetColumns: Column<TData>[]) {
    if (this._columnDefinitions) {
      const columnPosition = this._columnDefinitions.findIndex(c => c.id === columnId);
      if (columnPosition >= 0) {
        const dynColumn = this._columnDefinitions[columnPosition];
        if (dynColumn?.id === columnId && !gridPresetColumns.some(c => c.id === columnId)) {
          columnPosition > 0
            ? gridPresetColumns.splice(columnPosition, 0, dynColumn)
            : gridPresetColumns.unshift(dynColumn);
        }
      }
    }
  }

  /** Load any possible Columns Grid Presets */
  protected loadColumnPresetsWhenDatasetInitialized() {
    // if user entered some Columns "presets", we need to reflect them all in the grid
    if (this.slickGrid && this.gridOptions.presets && Array.isArray(this.gridOptions.presets.columns) && this.gridOptions.presets.columns.length > 0) {
      const gridPresetColumns: Column<TData>[] = this.gridStateService.getAssociatedGridColumns(this.slickGrid, this.gridOptions.presets.columns);
      if (gridPresetColumns && Array.isArray(gridPresetColumns) && gridPresetColumns.length > 0 && Array.isArray(this._columnDefinitions)) {
        // make sure that the dynamic columns are included in presets (1.Row Move, 2. Row Selection, 3. Row Detail)
        if (this.gridOptions.enableRowMoveManager) {
          const rmmColId = this.gridOptions?.rowMoveManager?.columnId ?? '_move';
          this.insertDynamicPresetColumns(rmmColId, gridPresetColumns);
        }
        if (this.gridOptions.enableCheckboxSelector) {
          const chkColId = this.gridOptions?.checkboxSelector?.columnId ?? '_checkbox_selector';
          this.insertDynamicPresetColumns(chkColId, gridPresetColumns);
        }
        if (this.gridOptions.enableRowDetailView) {
          const rdvColId = this.gridOptions?.rowDetailView?.columnId ?? '_detail_selector';
          this.insertDynamicPresetColumns(rdvColId, gridPresetColumns);
        }

        // keep copy the original optional `width` properties optionally provided by the user.
        // We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
        gridPresetColumns.forEach(col => col.originalWidth = col.width);

        // finally set the new presets columns (including checkbox selector if need be)
        this.slickGrid.setColumns(gridPresetColumns);
        this.sharedService.visibleColumns = gridPresetColumns;
      }
    }
  }

  /** Load any possible Filters Grid Presets */
  protected loadFilterPresetsWhenDatasetInitialized() {
    if (this.gridOptions && !this.customDataView) {
      // if user entered some Filter "presets", we need to reflect them all in the DOM
      // also note that a presets of Tree Data Toggling will also call this method because Tree Data toggling does work with data filtering
      // (collapsing a parent will basically use Filter for hidding (aka collapsing) away the child underneat it)
      if (this.gridOptions.presets && (Array.isArray(this.gridOptions.presets.filters) || Array.isArray(this.gridOptions.presets?.treeData?.toggledItems))) {
        this.filterService.populateColumnFilterSearchTermPresets(this.gridOptions.presets?.filters || []);
      }
    }
  }

  /**
   * local grid, check if we need to show the Pagination
   * if so then also check if there's any presets and finally initialize the PaginationService
   * a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
   */
  protected loadLocalGridPagination(dataset?: TData[]) {
    if (this.gridOptions && this._paginationOptions) {
      this.totalItems = Array.isArray(dataset) ? dataset.length : 0;
      if (this._paginationOptions && this.dataView?.getPagingInfo) {
        const slickPagingInfo = this.dataView.getPagingInfo();
        if (slickPagingInfo?.hasOwnProperty('totalRows') && this._paginationOptions.totalItems !== slickPagingInfo.totalRows) {
          this.totalItems = slickPagingInfo?.totalRows || 0;
        }
      }
      this._paginationOptions.totalItems = this.totalItems;
      const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this.gridOptions, this._paginationOptions);
      this.initializePaginationService(paginationOptions);
    }
  }

  /** Load any Row Selections into the DataView that were presets by the user */
  protected loadRowSelectionPresetWhenExists() {
    // if user entered some Row Selections "presets"
    const presets = this.gridOptions?.presets;
    const selectionModel = this.slickGrid?.getSelectionModel();
    const enableRowSelection = this.gridOptions && (this.gridOptions.enableCheckboxSelector || this.gridOptions.enableRowSelection);
    if (this.slickGrid && this.dataView && enableRowSelection && selectionModel && presets?.rowSelection && (Array.isArray(presets.rowSelection.gridRowIndexes) || Array.isArray(presets.rowSelection.dataContextIds))) {
      let dataContextIds = presets.rowSelection.dataContextIds;
      let gridRowIndexes = presets.rowSelection.gridRowIndexes;

      // maps the IDs to the Grid Rows and vice versa, the "dataContextIds" has precedence over the other
      if (Array.isArray(dataContextIds) && dataContextIds.length > 0) {
        gridRowIndexes = this.dataView.mapIdsToRows(dataContextIds) || [];
      } else if (Array.isArray(gridRowIndexes) && gridRowIndexes.length > 0) {
        dataContextIds = this.dataView.mapRowsToIds(gridRowIndexes) || [];
      }

      // apply row selection when defined as grid presets
      if (this.slickGrid && Array.isArray(gridRowIndexes)) {
        this.slickGrid.setSelectedRows(gridRowIndexes);
        this.dataView!.setSelectedIds(dataContextIds || [], {
          isRowBeingAdded: true,
          shouldTriggerEvent: false, // do not trigger when presetting the grid
          applyRowSelectionToGrid: true
        });
      }
    }
  }

  /** Add a register a new external resource, user could also optional dispose all previous resources before pushing any new resources to the resources array list. */
  registerExternalResources(resources: ExternalResource[], disposePreviousResources = false) {
    if (disposePreviousResources) {
      this.disposeExternalResources();
    }
    resources.forEach(res => this._registeredResources.push(res));
    this.initializeExternalResources(resources);
  }

  resetExternalResources() {
    this._registeredResources = [];
  }

  /** Pre-Register any Resource that don't require SlickGrid to be instantiated (for example RxJS Resource) */
  protected preRegisterResources() {
    // bind & initialize all Components/Services that were tagged as enabled
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(this._registeredResources)) {
      for (const resource of this._registeredResources) {
        if (resource?.className === 'RxJsResource') {
          this.registerRxJsResource(resource as RxJsFacade);
        }
      }
    }
  }

  protected initializeExternalResources(resources: ExternalResource[]) {
    if (Array.isArray(resources)) {
      for (const resource of resources) {
        if (this.slickGrid && typeof resource.init === 'function') {
          resource.init(this.slickGrid, this.universalContainerService);
        }
      }
    }
  }

  protected registerResources() {
    // at this point, we consider all the registered services as external services, anything else registered afterward aren't external
    if (Array.isArray(this._registeredResources)) {
      this.sharedService.externalRegisteredResources = this._registeredResources;
    }

    // push all other Services that we want to be registered
    this._registeredResources.push(this.gridService, this.gridStateService);

    // when using Grouping/DraggableGrouping/Colspan register its Service
    if (this.gridOptions.createPreHeaderPanel && !this.gridOptions.enableDraggableGrouping) {
      this._registeredResources.push(this.groupingService);
    }

    // when using Tree Data View, register its Service
    if (this.gridOptions.enableTreeData) {
      this._registeredResources.push(this.treeDataService);
    }

    // when user enables translation, we need to translate Headers on first pass & subsequently in the bindDifferentHooks
    if (this.gridOptions.enableTranslate) {
      this.extensionService.translateColumnHeaders();
    }

    // also initialize (render) the empty warning component
    this.slickEmptyWarning = new SlickEmptyWarningComponent();
    this._registeredResources.push(this.slickEmptyWarning);

    // bind & initialize all Components/Services that were tagged as enabled
    // register all services by executing their init method and providing them with the Grid object
    this.initializeExternalResources(this._registeredResources);
  }

  /** Register the RxJS Resource in all necessary services which uses */
  protected registerRxJsResource(resource: RxJsFacade) {
    this.rxjs = resource;
    this.backendUtilityService.addRxJsResource(this.rxjs);
    this.filterFactory.addRxJsResource(this.rxjs);
    this.filterService.addRxJsResource(this.rxjs);
    this.sortService.addRxJsResource(this.rxjs);
    this.paginationService.addRxJsResource(this.rxjs);
    this.universalContainerService.registerInstance('RxJsFacade', this.rxjs);
    this.universalContainerService.registerInstance('RxJsResource', this.rxjs);
  }

  /**
   * Takes a flat dataset with parent/child relationship, sort it (via its tree structure) and return the sorted flat array
   * @returns {Array<Object>} sort flat parent/child dataset
   */
  protected sortTreeDataset<U>(flatDatasetInput: U[], forceGridRefresh = false): U[] {
    const prevDatasetLn = this._currentDatasetLength;
    let sortedDatasetResult;
    let flatDatasetOutput: any[] = [];

    // if the hierarchical dataset was already initialized then no need to re-convert it, we can use it directly from the shared service ref
    if (this._isDatasetHierarchicalInitialized && this.datasetHierarchical) {
      sortedDatasetResult = this.treeDataService.sortHierarchicalDataset(this.datasetHierarchical);
      flatDatasetOutput = sortedDatasetResult.flat;
    } else if (Array.isArray(flatDatasetInput) && flatDatasetInput.length > 0) {
      if (this.gridOptions?.treeDataOptions?.initialSort) {
        // else we need to first convert the flat dataset to a hierarchical dataset and then sort
        sortedDatasetResult = this.treeDataService.convertFlatParentChildToTreeDatasetAndSort(flatDatasetInput, this._columnDefinitions || [], this.gridOptions);
        this.sharedService.hierarchicalDataset = sortedDatasetResult.hierarchical;
        flatDatasetOutput = sortedDatasetResult.flat;
      } else {
        // else we assume that the user provided an array that is already sorted (user's responsability)
        // and so we can simply convert the array to a tree structure and we're done, no need to sort
        this.sharedService.hierarchicalDataset = this.treeDataService.convertFlatParentChildToTreeDataset(flatDatasetInput, this.gridOptions);
        flatDatasetOutput = flatDatasetInput || [];
      }
    }

    // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
    if (flatDatasetInput.length > 0 && (forceGridRefresh || flatDatasetInput.length !== prevDatasetLn)) {
      this.filterService.refreshTreeDataFilters(flatDatasetOutput);
    }

    return flatDatasetOutput;
  }

  /**
   * For convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
   * however "editor" is used internally by SlickGrid for it's own Editor Factory
   * so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
   * then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
   */
  protected swapInternalEditorToSlickGridFactoryEditor(columnDefinitions: Column<TData>[]): Column<TData>[] {
    const columns = Array.isArray(columnDefinitions) ? columnDefinitions : [];

    if (columns.some(col => `${col.id}`.includes('.'))) {
      console.error('[Slickgrid-Universal] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".');
    }

    return columns.map((column) => {
      // on every Editor that have a "collectionAsync", resolve the data and assign it to the "collection" property
      if (column.editor?.collectionAsync) {
        this.loadEditorCollectionAsync(column);
      }

      // @deprecated `internalColumnEditor`, if there's already an internalColumnEditor we'll use it, else it would be inside the editor
      const columnEditor = column.internalColumnEditor || column.editor;

      return { ...column, editorClass: columnEditor?.model, internalColumnEditor: { ...columnEditor } };
    });
  }

  /**
   * Update the "internalColumnEditor.collection" property.
   * Since this is called after the async call resolves, the pointer will not be the same as the "column" argument passed.
   * Once we found the new pointer, we will reassign the "editor" and "collection" to the "internalColumnEditor" so it has newest collection
   */
  protected updateEditorCollection<U extends TData = any>(column: Column<U>, newCollection: U[]) {
    if (this.slickGrid && column.editor) {
      column.editor.collection = newCollection;
      column.editor.disabled = false;

      // find the new column reference pointer & re-assign the new editor to the internalColumnEditor
      if (Array.isArray(this.columnDefinitions)) {
        const columnRef = this.columnDefinitions.find((col: Column) => col.id === column.id);
        if (columnRef) {
          columnRef.internalColumnEditor = column.editor;
        }
      }

      // get current Editor, remove it from the DOm then re-enable it and re-render it with the new collection.
      const currentEditor = this.slickGrid.getCellEditor() as AutocompleterEditor | SelectEditor;
      if (currentEditor?.disable && currentEditor?.renderDomElement) {
        if (typeof currentEditor.destroy === 'function') {
          currentEditor.destroy();
        }
        currentEditor.disable(false);
        currentEditor.renderDomElement(newCollection);
      }
    }
  }
}
