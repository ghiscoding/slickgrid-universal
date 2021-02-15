import 'flatpickr/dist/l10n/fr';
import 'slickgrid/lib/jquery.event.drag-2.3.0';
import 'slickgrid/lib/jquery.mousewheel';
import 'slickgrid/slick.core';
import 'slickgrid/slick.grid';
import 'slickgrid/slick.dataview';
import 'slickgrid/slick.groupitemmetadataprovider';
import 'slickgrid/plugins/slick.resizer';
import {
  AutoCompleteEditor,
  BackendServiceApi,
  Column,
  ColumnEditor,
  DataViewOption,
  ExtensionList,
  ExternalResource,
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
  SelectEditor,
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
  RowDetailViewExtension,
  RowSelectionExtension,

  // services
  CollectionService,
  ExtensionService,
  FilterFactory,
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
  emptyElement,
  GetSlickEventType,
} from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';

import { EventPubSubService } from '../services/eventPubSub.service';
import { TextExportService } from '../services/textExport.service';
import { ResizerService } from '../services/resizer.service';
import { SalesforceGlobalGridOptions } from '../salesforce-global-grid-options';
import { SlickFooterComponent } from './slick-footer.component';
import { SlickPaginationComponent } from './slick-pagination.component';
import { SlickerGridInstance } from '../interfaces/slickerGridInstance.interface';
import { UniversalContainerService } from '../services/universalContainer.service';
import { autoAddEditorFormatterToColumnsWithEditor } from './slick-vanilla-utilities';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class SlickVanillaGridBundle {
  protected _eventPubSubService: EventPubSubService;
  private _columnDefinitions: Column[];
  private _gridOptions: GridOption;
  private _gridContainerElm: HTMLElement;
  private _gridParentContainerElm: HTMLElement;
  private _hideHeaderRowAfterPageLoad = false;
  private _isDatasetInitialized = false;
  private _isGridInitialized = false;
  private _isLocalGrid = true;
  private _isPaginationInitialized = false;
  private _eventHandler: SlickEventHandler;
  private _extensions: ExtensionList<any, any> | undefined;
  private _paginationOptions: Pagination | undefined;
  private _registeredResources: ExternalResource[] = [];
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
  universalContainerService: UniversalContainerService;

  slickCompositeEditor: SlickCompositeEditorComponent | undefined;
  slickEmptyWarning: SlickEmptyWarningComponent | undefined;
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
    return this.dataView?.getItems() ?? [];
  }
  set dataset(newDataset: any[]) {
    const prevDatasetLn = this.dataView.getLength();
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions?.enableDeepCopyDatasetOnPageLoad);
    const data = isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], newDataset) : newDataset;
    this.refreshGridData(data || []);

    // expand/autofit columns on first page load
    // we can assume that if the prevDataset was empty then we are on first load
    if (this.gridOptions.autoFitColumnsOnFirstLoad && prevDatasetLn === 0) {
      this.slickGrid.autosizeColumns();
    }
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  set datasetHierarchical(newHierarchicalDataset: any[] | undefined) {
    this.sharedService.hierarchicalDataset = newHierarchicalDataset;

    if (newHierarchicalDataset && this.columnDefinitions && this.filterService && this.filterService.clearFilters) {
      this.filterService.clearFilters();
    }

    // when a hierarchical dataset is set afterward, we can reset the flat dataset and call a tree data sort that will overwrite the flat dataset
    if (newHierarchicalDataset && this.sortService && this.sortService.processTreeDataInitialSort) {
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

  get extensions(): ExtensionList<any, any> | undefined {
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
    columnDefs?: Column[],
    options?: GridOption,
    dataset?: any[],
    hierarchicalDataset?: any[],
    services?: {
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
    this._gridOptions = this.mergeGridOptions(options || {});
    const isDeepCopyDataOnPageLoadEnabled = !!(this._gridOptions?.enableDeepCopyDatasetOnPageLoad);

    this.universalContainerService = services?.universalContainerService ?? new UniversalContainerService();

    // if user is providing a Translate Service, it has to be passed under the "translater" grid option
    this.translaterService = services?.translaterService ?? this._gridOptions.translater;

    // initialize and assign all Service Dependencies
    this._eventPubSubService = services?.eventPubSubService ?? new EventPubSubService(gridParentContainerElm);
    this._eventPubSubService.eventNamingStyle = this._gridOptions?.eventNamingStyle ?? EventNamingStyle.camelCase;

    this.gridEventService = services?.gridEventService ?? new GridEventService();
    const slickgridConfig = new SlickgridConfig();
    this.sharedService = services?.sharedService ?? new SharedService();
    this.collectionService = services?.collectionService ?? new CollectionService(this.translaterService);
    this.extensionUtility = services?.extensionUtility ?? new ExtensionUtility(this.sharedService, this.translaterService);
    const filterFactory = new FilterFactory(slickgridConfig, this.translaterService, this.collectionService);
    this.filterService = services?.filterService ?? new FilterService(filterFactory, this._eventPubSubService, this.sharedService);
    this.resizerService = services?.resizerService ?? new ResizerService(this._eventPubSubService);
    this.sortService = services?.sortService ?? new SortService(this.sharedService, this._eventPubSubService);
    this.treeDataService = services?.treeDataService ?? new TreeDataService(this.sharedService);
    this.paginationService = services?.paginationService ?? new PaginationService(this._eventPubSubService, this.sharedService);

    // extensions
    const autoTooltipExtension = new AutoTooltipExtension(this.sharedService);
    const cellExternalCopyManagerExtension = new CellExternalCopyManagerExtension(this.extensionUtility, this.sharedService);
    const cellMenuExtension = new CellMenuExtension(this.extensionUtility, this.sharedService, this.translaterService);
    const contextMenuExtension = new ContextMenuExtension(this.extensionUtility, this.sharedService, this.treeDataService, this.translaterService);
    const columnPickerExtension = new ColumnPickerExtension(this.extensionUtility, this.sharedService);
    const checkboxExtension = new CheckboxSelectorExtension(this.sharedService);
    const draggableGroupingExtension = new DraggableGroupingExtension(this.extensionUtility, this.sharedService);
    const gridMenuExtension = new GridMenuExtension(this.extensionUtility, this.filterService, this.sharedService, this.sortService, this.translaterService);
    const groupItemMetaProviderExtension = new GroupItemMetaProviderExtension(this.sharedService);
    const headerButtonExtension = new HeaderButtonExtension(this.extensionUtility, this.sharedService);
    const headerMenuExtension = new HeaderMenuExtension(this.extensionUtility, this.filterService, this._eventPubSubService, this.sharedService, this.sortService, this.translaterService);
    const rowDetailViewExtension = new RowDetailViewExtension();
    const rowMoveManagerExtension = new RowMoveManagerExtension(this.sharedService);
    const rowSelectionExtension = new RowSelectionExtension(this.sharedService);

    this.extensionService = services?.extensionService ?? new ExtensionService(
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
      rowDetailViewExtension,
      rowMoveManagerExtension,
      rowSelectionExtension,
      this.sharedService,
      this.translaterService,
    );

    this.gridStateService = services?.gridStateService ?? new GridStateService(this.extensionService, this.filterService, this._eventPubSubService, this.sharedService, this.sortService);
    this.gridService = services?.gridService ?? new GridService(this.extensionService, this.gridStateService, this.filterService, this._eventPubSubService, this.paginationService, this.sharedService, this.sortService);

    this.groupingService = services?.groupingAndColspanService ?? new GroupingAndColspanService(this.extensionUtility, this.extensionService, this._eventPubSubService);

    if (hierarchicalDataset) {
      this.sharedService.hierarchicalDataset = (isDeepCopyDataOnPageLoadEnabled ? $.extend(true, [], hierarchicalDataset) : hierarchicalDataset) || [];
    }
    const eventHandler = new Slick.EventHandler();

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

    this.initialization(this._gridContainerElm, eventHandler);
    if (!hierarchicalDataset && !this.gridOptions.backendServiceApi) {
      this.dataset = dataset || [];
    }
  }

  emptyGridContainerElm() {
    const gridContainerId = this.gridOptions && this.gridOptions.gridContainerId || 'grid1';
    $(gridContainerId).empty();
  }

  /** Dispose of the Component */
  dispose(shouldEmptyDomElementContainer = false) {
    this._eventPubSubService.publish('onBeforeGridDestroy', this.slickGrid);
    this._eventHandler?.unsubscribeAll();
    this._eventPubSubService.publish('onAfterGridDestroyed', true);

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

    // dispose all registered external resources
    if (Array.isArray(this._registeredResources)) {
      while (this._registeredResources.length > 0) {
        const resource = this._registeredResources.pop();
        if (resource?.dispose) {
          resource.dispose();
        }
      }
      this._registeredResources = [];
    }

    // dispose the Components
    this.slickFooter?.dispose();
    this.slickPagination?.dispose();

    this._eventPubSubService?.unsubscribeAll();
    this.dataView?.setItems([]);
    if (this.dataView?.destroy) {
      this.dataView?.destroy();
    }
    this.slickGrid?.destroy(true);

    emptyElement(this._gridContainerElm);
    emptyElement(this._gridParentContainerElm);

    if (this.backendServiceApi) {
      for (const prop of Object.keys(this.backendServiceApi)) {
        this.backendServiceApi[prop] = null;
      }
      this.backendServiceApi = undefined;
    }
    for (const prop of Object.keys(this.columnDefinitions)) {
      this.columnDefinitions[prop] = null;
    }
    for (const prop of Object.keys(this.sharedService)) {
      this.sharedService[prop] = null;
    }
    this.datasetHierarchical = undefined;
    this._columnDefinitions = [];

    // we could optionally also empty the content of the grid container DOM element
    if (shouldEmptyDomElementContainer) {
      this.emptyGridContainerElm();
    }
  }

  initialization(gridContainerElm: HTMLElement, eventHandler: SlickEventHandler) {
    // when detecting a frozen grid, we'll automatically enable the mousewheel scroll handler so that we can scroll from both left/right frozen containers
    if (this.gridOptions && ((this.gridOptions.frozenRow !== undefined && this.gridOptions.frozenRow >= 0) || this.gridOptions.frozenColumn !== undefined && this.gridOptions.frozenColumn >= 0) && this.gridOptions.enableMouseWheelScrollHandler === undefined) {
      this.gridOptions.enableMouseWheelScrollHandler = true;
    }

    // create the slickgrid container and add it to the user's grid container
    this._gridContainerElm = gridContainerElm;
    this._eventPubSubService.publish('onBeforeGridCreate', true);

    this._eventHandler = eventHandler;
    this._gridOptions = this.mergeGridOptions(this._gridOptions);
    this.backendServiceApi = this._gridOptions?.backendServiceApi;
    this._isLocalGrid = !this.backendServiceApi; // considered a local grid if it doesn't have a backend service set
    this._eventPubSubService.eventNamingStyle = this._gridOptions?.eventNamingStyle ?? EventNamingStyle.camelCase;
    this._paginationOptions = this.gridOptions?.pagination;

    this.createBackendApiInternalPostProcessCallback(this._gridOptions);

    if (!this.customDataView) {
      const dataviewInlineFilters = this._gridOptions?.dataView?.inlineFilters ?? false;
      let dataViewOptions: DataViewOption = { inlineFilters: dataviewInlineFilters };

      if (this.gridOptions.draggableGrouping || this.gridOptions.enableGrouping) {
        this.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
        this.sharedService.groupItemMetadataProvider = this.groupItemMetadataProvider;
        dataViewOptions = { ...dataViewOptions, groupItemMetadataProvider: this.groupItemMetadataProvider };
      }
      this.dataView = new Slick.Data.DataView(dataViewOptions);
      this._eventPubSubService.publish('onDataviewCreated', this.dataView);
    }

    // for convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
    // however "editor" is used internally by SlickGrid for it's own Editor Factory
    // so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
    // then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
    this._columnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(this._columnDefinitions);

    // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
    if (this._gridOptions.autoAddCustomEditorFormatter) {
      autoAddEditorFormatterToColumnsWithEditor(this._columnDefinitions, this._gridOptions.autoAddCustomEditorFormatter);
    }

    // save reference for all columns before they optionally become hidden/visible
    this.sharedService.allColumns = this._columnDefinitions;
    this.sharedService.visibleColumns = this._columnDefinitions;
    this.extensionService.createExtensionsBeforeGridCreation(this._columnDefinitions, this._gridOptions);

    this.slickGrid = new Slick.Grid(gridContainerElm, this.dataView, this._columnDefinitions, this._gridOptions);
    this.sharedService.dataView = this.dataView;
    this.sharedService.slickGrid = this.slickGrid;

    this.extensionService.bindDifferentExtensions();
    this.bindDifferentHooks(this.slickGrid, this._gridOptions, this.dataView);
    this._slickgridInitialized = true;

    // when it's a frozen grid, we need to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward
    const frozenColumnIndex = this._gridOptions?.frozenColumn ?? -1;
    if (frozenColumnIndex >= 0 && frozenColumnIndex <= this._columnDefinitions.length && this._columnDefinitions.length > 0) {
      this.sharedService.frozenVisibleColumnId = this._columnDefinitions[frozenColumnIndex]?.id ?? '';
    }

    // initialize the SlickGrid grid
    this.slickGrid.init();

    // load the data in the DataView (unless it's a hierarchical dataset, if so it will be loaded after the initial tree sort)
    if (Array.isArray(this.dataset) && !this.datasetHierarchical) {
      this.dataView.setItems(this.dataset, this._gridOptions.datasetIdPropertyName);
    }

    if (this._gridOptions?.enableTreeData) {
      // Tree Data with Pagiantion is not supported, throw an error when user tries to do that
      if (this.gridOptions.enablePagination) {
        throw new Error('[Slickgrid-Universal] It looks like you are trying to use Tree Data with Pagination but unfortunately that is simply not supported because of its complexity.');
      }

      if (!this._gridOptions.treeDataOptions || !this._gridOptions.treeDataOptions.columnId) {
        throw new Error('[Slickgrid-Universal] When enabling tree data, you must also provide the "treeDataOption" property in your Grid Options with "childrenPropName" or "parentPropName" (depending if your array is hierarchical or flat) for the Tree Data to work properly');
      }

      // anytime the flat dataset changes, we need to update our hierarchical dataset
      // this could be triggered by a DataView setItems or updateItem
      const onRowsChangedHandler = this.dataView.onRowsChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsChangedHandler>>).subscribe(onRowsChangedHandler, () => {
        const items = this.dataView.getItems();
        if (Array.isArray(items) && items.length > 0 && !this._isDatasetInitialized) {
          this.sharedService.hierarchicalDataset = this.treeDataSortComparer(items);
        }
      });
    }

    // if you don't want the items that are not visible (due to being filtered out or being on a different page)
    // to stay selected, pass 'false' to the second arg
    const selectionModel = this.slickGrid?.getSelectionModel?.();
    if (selectionModel && this._gridOptions?.dataView && this._gridOptions.dataView.hasOwnProperty('syncGridSelection')) {
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

    if (this.dataView.getLength() > 0) {
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
    this._registeredResources = this.gridOptions.registerExternalResources || [];

    // when using Salesforce, we want the Export to CSV always enabled without registering it
    if (this.gridOptions.enableTextExport && this.gridOptions.useSalesforceDefaultGridOptions) {
      const textExportService = new TextExportService();
      this._registeredResources.push(textExportService);
    }

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

    // also initialize (render) the pagination component when using the salesforce default options
    // however before adding a new instance, just make sure there isn't one that might have been loaded by calling "registerExternalResources"
    if (this.gridOptions.enableCompositeEditor && this.gridOptions.useSalesforceDefaultGridOptions) {
      if (!this._registeredResources.some((resource => resource instanceof SlickCompositeEditorComponent))) {
        this.slickCompositeEditor = new SlickCompositeEditorComponent();
        this._registeredResources.push(this.slickCompositeEditor);
      }
    }

    // bind the Backend Service API callback functions only after the grid is initialized
    // because the preProcess() and onInit() might get triggered
    if (this.gridOptions?.backendServiceApi) {
      this.bindBackendCallbackFunctions(this.gridOptions);
    }

    // bind & initialize all Components/Services that were tagged as enabled
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(this._registeredResources)) {
      for (const resource of this._registeredResources) {
        if (typeof resource.init === 'function') {
          resource.init(this.slickGrid, this.universalContainerService);
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
      backendService: this.gridOptions?.backendServiceApi?.service,
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

  /**
   * Define our internal Post Process callback, it will execute internally after we get back result from the Process backend call
   * For now, this is GraphQL Service ONLY feature and it will basically
   * refresh the Dataset & Pagination without having the user to create his own PostProcess every time
   */
  createBackendApiInternalPostProcessCallback(gridOptions: GridOption) {
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

      if (backendApi?.service?.init) {
        backendApi.service.init(backendApi.options, gridOptions.pagination, this.slickGrid);
      }
    }

    if (dataView && grid) {
      // expose all Slick Grid Events through dispatch
      for (const prop in grid) {
        if (grid.hasOwnProperty(prop) && prop.startsWith('on')) {
          const gridEventHandler = grid[prop];
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof gridEventHandler>>).subscribe(gridEventHandler, (event, args) => {
            const gridEventName = this._eventPubSubService.getEventNameByNamingConvention(prop, this._gridOptions?.defaultSlickgridEventPrefix || '');
            return this._eventPubSubService.dispatchCustomEvent(gridEventName, { eventData: event, args });
          });
        }
      }

      // expose all Slick DataView Events through dispatch
      for (const prop in dataView) {
        if (dataView.hasOwnProperty(prop) && prop.startsWith('on')) {
          const dataViewEventHandler = dataView[prop];
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof dataViewEventHandler>>).subscribe(dataViewEventHandler, (event, args) => {
            const dataViewEventName = this._eventPubSubService.getEventNameByNamingConvention(prop, this._gridOptions?.defaultSlickgridEventPrefix || '');
            return this._eventPubSubService.dispatchCustomEvent(dataViewEventName, { eventData: event, args });
          });
        }
      }

      // When data changes in the DataView, we need to refresh the metrics and/or display a warning if the dataset is empty
      const onRowsOrCountChangedHandler = dataView.onRowsOrCountChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsOrCountChangedHandler>>).subscribe(onRowsOrCountChangedHandler, (_e, args) => {
        grid.invalidate();
        this.handleOnItemCountChanged(args.currentRowCount || 0);
      });

      // when filtering data with local dataset, we need to update each row else it will not always show correctly in the UI
      // also don't use "invalidateRows" since it destroys the entire row and as bad user experience when updating a row
      if (gridOptions && gridOptions.enableFiltering && !gridOptions.enableRowDetailView) {
        const onRowsChangedHandler = dataView.onRowsChanged;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onRowsChangedHandler>>).subscribe(onRowsChangedHandler, (_e, args) => {
          if (args?.rows && Array.isArray(args.rows)) {
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
        const process = isExecuteCommandOnInit ? (backendApi.process?.(query) ?? null) : (backendApi.onInit?.(query) ?? null);

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
    if (grid && options?.enableAutoResize) {
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
    const isSyncGridSelectionEnabled = this.gridStateService?.needToPreserveRowSelection() ?? false;
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
    if (this._gridOptions.enablePagination && this._isLocalGrid) {
      this.showPagination = true;
      this.loadLocalGridPagination(dataset);
    }

    if (this._gridOptions.enableEmptyDataWarningMessage && Array.isArray(dataset)) {
      const finalTotalCount = totalCount || dataset.length;
      this.displayEmptyDataWarning(finalTotalCount < 1);
    }

    if (Array.isArray(dataset) && this.slickGrid && this.dataView && typeof this.dataView.setItems === 'function') {
      this.dataView.setItems(dataset, this._gridOptions.datasetIdPropertyName);
      if (!this._gridOptions.backendServiceApi) {
        this.dataView.reSort();
      }

      if (dataset.length > 0) {
        if (!this._isDatasetInitialized) {
          this.loadPresetsWhenDatasetInitialized();

          if (this._gridOptions.enableCheckboxSelector) {
            this.loadRowSelectionPresetWhenExists();
          }
        }
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

  /**
   * Dynamically change or update the column definitions list.
   * We will re-render the grid so that the new header and data shows up correctly.
   * If using translater, we also need to trigger a re-translate of the column headers
   */
  updateColumnDefinitionsList(newColumnDefinitions: Column[]) {
    // map/swap the internal library Editor to the SlickGrid Editor factory
    newColumnDefinitions = this.swapInternalEditorToSlickGridFactoryEditor(newColumnDefinitions);

    // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
    if (this._gridOptions.autoAddCustomEditorFormatter) {
      autoAddEditorFormatterToColumnsWithEditor(newColumnDefinitions, this._gridOptions.autoAddCustomEditorFormatter);
    }

    if (this._gridOptions.enableTranslate) {
      this.extensionService.translateColumnHeaders(false, newColumnDefinitions);
    } else {
      this.extensionService.renderColumnHeaders(newColumnDefinitions, true);
    }

    if (this._gridOptions?.enableAutoSizeColumns) {
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
    if (gridOptions.presets?.pagination && gridOptions.pagination) {
      paginationOptions.pageSize = gridOptions.presets.pagination.pageSize;
      paginationOptions.pageNumber = gridOptions.presets.pagination.pageNumber;
    }
    return paginationOptions;
  }

  // --
  // private functions
  // ------------------

  private displayEmptyDataWarning(showWarning = true) {
    this.slickEmptyWarning?.showEmptyDataMessage(showWarning);
  }

  /** When data changes in the DataView, we'll refresh the metrics and/or display a warning if the dataset is empty */
  private handleOnItemCountChanged(itemCount: number) {
    this.metrics = {
      startTime: new Date(),
      endTime: new Date(),
      itemCount,
      totalItemCount: this.dataView?.getItemCount() || 0
    };

    // if custom footer is enabled, then we'll update its metrics
    if (this.slickFooter) {
      this.slickFooter.metrics = this.metrics;
    }

    // when using local (in-memory) dataset, we'll display a warning message when filtered data is empty
    if (this._isLocalGrid && this._gridOptions.enableEmptyDataWarningMessage) {
      this.displayEmptyDataWarning(itemCount === 0);
    }
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
          if (this.gridOptions?.backendServiceApi) {
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
    const collectionAsync = (column?.editor as ColumnEditor).collectionAsync;
    (column?.editor as ColumnEditor).disabled = true; // disable the Editor DOM element, we'll re-enable it after receiving the collection with "updateEditorCollection()"

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
  private loadRowSelectionPresetWhenExists() {
    // if user entered some Row Selections "presets"
    const presets = this.gridOptions?.presets;
    const selectionModel = this.slickGrid?.getSelectionModel?.();
    const enableRowSelection = this.gridOptions && (this.gridOptions.enableCheckboxSelector || this.gridOptions.enableRowSelection);
    if (enableRowSelection && selectionModel && presets?.rowSelection && (Array.isArray(presets.rowSelection.gridRowIndexes) || Array.isArray(presets.rowSelection.dataContextIds))) {
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
    const columns = Array.isArray(columnDefinitions) ? columnDefinitions : [];

    if (columns.some(col => `${col.id}`.includes('.'))) {
      console.error('[Slickgrid-Universal] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".');
    }

    return columns.map((column: Column) => {
      // on every Editor that have a "collectionAsync", resolve the data and assign it to the "collection" property
      if (column.editor?.collectionAsync) {
        this.loadEditorCollectionAsync(column);
      }

      // if there's already an internalColumnEditor we'll use it, else it would be inside the editor
      const columnEditor = column.internalColumnEditor || column.editor as ColumnEditor;

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
    (column.editor as ColumnEditor).disabled = false;

    // find the new column reference pointer & re-assign the new editor to the internalColumnEditor
    const columns = this.slickGrid.getColumns();
    if (Array.isArray(columns)) {
      const columnRef = columns.find((col: Column) => col.id === column.id);
      if (columnRef) {
        columnRef.internalColumnEditor = column.editor as ColumnEditor;
      }
    }

    // get current Editor, remove it from the DOm then re-enable it and re-render it with the new collection.
    const currentEditor = this.slickGrid.getCellEditor() as AutoCompleteEditor | SelectEditor;
    if (currentEditor?.disable && currentEditor?.renderDomElement) {
      currentEditor.destroy();
      currentEditor.disable(false);
      currentEditor.renderDomElement(newCollection);
    }
  }
}
