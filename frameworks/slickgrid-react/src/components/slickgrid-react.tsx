import {
  autoAddEditorFormatterToColumnsWithEditor,
  BackendUtilityService,
  collectionObserver,
  CollectionService,
  emptyElement,
  EventNamingStyle,
  ExtensionService,
  ExtensionUtility,
  FilterFactory,
  FilterService,
  GridEventService,
  GridService,
  GridStateService,
  HeaderGroupingService,
  isColumnDateType,
  PaginationService,
  ResizerService,
  SharedService,
  SlickDataView,
  SlickEventHandler,
  SlickGrid,
  SlickgridConfig,
  SlickGroupItemMetadataProvider,
  SortService,
  TreeDataService,
  type AutocompleterEditor,
  type BackendService,
  type BackendServiceApi,
  type BackendServiceOption,
  type BasePaginationComponent,
  type Column,
  type DataViewOption,
  type EventSubscription,
  type ExtensionList,
  type ExternalResource,
  type Metrics,
  type Observable,
  type Pagination,
  type PaginationMetadata,
  type RxJsFacade,
  type SelectEditor,
} from '@slickgrid-universal/common';
import { SlickFooterComponent } from '@slickgrid-universal/custom-footer-component';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickPaginationComponent } from '@slickgrid-universal/pagination-component';
import { deepCopy, extend } from '@slickgrid-universal/utils';
import { dequal } from 'dequal/lite';
import React from 'react';
import type { Subscription } from 'rxjs';
import { I18nextContext } from '../contexts/i18nextContext.js';
import { GlobalGridOptions } from '../global-grid-options.js';
import type { GridOption, I18Next, SlickgridReactInstance } from '../models/index.js';
import { loadReactComponentDynamically } from '../services/reactUtils.js';
import { GlobalContainerService } from '../services/singletons.js';
import { TranslaterI18NextService } from '../services/translaterI18Next.service.js';
import { disposeAllSubscriptions } from '../services/utilities.js';
import type { SlickgridReactProps } from './slickgridReactProps.js';

const WARN_NO_PREPARSE_DATE_SIZE = 10000; // data size to warn user when pre-parse isn't enabled

interface State {
  _options: GridOption;
  paginationService: PaginationService;
  showPagination: boolean;
}

export class SlickgridReact<TData = any> extends React.Component<SlickgridReactProps, State> {
  // i18next has to be provided by the external user through our `I18nextProvider`
  static contextType = I18nextContext;
  declare context: React.ContextType<typeof I18nextContext>;
  protected _mounted = false;
  protected setStateValue(key: string, value: any, callback?: () => void): void {
    if ((this.state as any)?.[key] === value) {
      return;
    }

    if (!this._mounted) {
      this.state = this.state || {};
      (this.state as any)[key] = value;
      return;
    }

    this.setState(() => {
      const result: any = {};
      result[key] = value;
      return result;
    }, callback);
  }

  protected _columns: Column<TData>[] = [];
  protected _currentDatasetLength = 0;
  protected _dataset: any[] | null = null;
  protected _options: GridOption = {};
  protected _elm?: HTMLDivElement | null;
  protected _collectionObservers: Array<null | { disconnect: () => void }> = [];
  protected _eventHandler!: SlickEventHandler;
  protected _eventPubSubService!: EventPubSubService;
  protected _hideHeaderRowAfterPageLoad = false;
  protected _i18next: I18Next | null;
  protected _isAutosizeColsCalled = false;
  protected _isGridInitialized = false;
  protected _isDatasetInitialized = false;
  protected _isDatasetHierarchicalInitialized = false;
  protected _isPaginationInitialized = false;
  protected _isLocalGrid = true;
  protected _paginationOptions: Pagination | undefined;
  protected _registeredResources: ExternalResource[] = [];
  protected _scrollEndCalled = false;

  protected get options(): GridOption {
    return this._options || ({} as GridOption);
  }
  protected set options(options: GridOption) {
    let mergedOptions: GridOption;

    // if we already have grid options, when grid was already initialized, we'll merge with those options
    // else we'll merge with global grid options
    if (this.grid?.getOptions) {
      mergedOptions = extend<GridOption>(true, {} as GridOption, this.grid.getOptions() as GridOption, options as GridOption);
    } else {
      mergedOptions = this.mergeGridOptions(options);
    }
    if (this.sharedService?.gridOptions && this.grid?.setOptions) {
      this.sharedService.gridOptions = mergedOptions;
      this.grid.setOptions(mergedOptions, false, true); // make sure to supressColumnCheck (3rd arg) to avoid problem with changeColumnsArrangement() and custom grid view
      this.grid.reRenderColumns(true); // then call a re-render since we did supressColumnCheck on previous setOptions
    }
    this._options = mergedOptions;
  }

  groupItemMetadataProvider?: SlickGroupItemMetadataProvider;
  backendServiceApi: BackendServiceApi | undefined;
  metrics?: Metrics;
  showPagination = false;
  serviceList: any[] = [];
  subscriptions: Array<EventSubscription | Subscription> = [];

  // components
  slickEmptyWarning: SlickEmptyWarningComponent | undefined;
  slickFooter: SlickFooterComponent | undefined;
  slickPagination: BasePaginationComponent | undefined;

  // services
  backendUtilityService!: BackendUtilityService;
  collectionService: CollectionService;
  extensionService: ExtensionService;
  extensionUtility: ExtensionUtility;
  filterFactory!: FilterFactory;
  filterService: FilterService;
  gridEventService: GridEventService;
  gridService: GridService;
  gridStateService: GridStateService;
  groupingService!: HeaderGroupingService;
  headerGroupingService: HeaderGroupingService;
  resizerService!: ResizerService;
  rxjs?: RxJsFacade;
  sharedService: SharedService;
  sortService: SortService;
  treeDataService: TreeDataService;

  dataView!: SlickDataView<TData>;
  grid!: SlickGrid;
  totalItems = 0;

  extensions!: ExtensionList<any>;
  instances: SlickgridReactInstance | null = null;

  static defaultProps = {
    containerService: GlobalContainerService,
    translaterService: new TranslaterI18NextService(),
    gridId: '',
    dataset: [],
    columns: [],
    options: {},
  };

  get dataset(): any[] {
    return this.dataView?.getItems() || [];
  }
  set dataset(newDataset: any[]) {
    const prevDatasetLn = this._currentDatasetLength;
    const isDatasetEqual = dequal(newDataset, this.dataset || []);
    let data = this._options?.enableDeepCopyDatasetOnPageLoad ? deepCopy(newDataset) : newDataset;

    // when Tree Data is enabled and we don't yet have the hierarchical dataset filled, we can force a convert+sort of the array
    if (
      this.grid &&
      this.options?.enableTreeData &&
      Array.isArray(newDataset) &&
      (newDataset.length > 0 || newDataset.length !== prevDatasetLn || !isDatasetEqual)
    ) {
      this._isDatasetHierarchicalInitialized = false;
      data = this.sortTreeDataset(newDataset, !isDatasetEqual); // if dataset changed, then force a refresh anyway
    }

    this.refreshGridData(data || []);
    this._currentDatasetLength = (newDataset || []).length;

    // expand/autofit columns on first page load
    // we can assume that if the prevDataset was empty then we are on first load
    if (this.grid && this.options.autoFitColumnsOnFirstLoad && prevDatasetLn === 0 && !this._isAutosizeColsCalled) {
      this.grid.autosizeColumns();
      this._isAutosizeColsCalled = true;
    }
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  set datasetHierarchical(newHierarchicalDataset: any[] | undefined) {
    const isDatasetEqual = dequal(newHierarchicalDataset, this.sharedService?.hierarchicalDataset ?? []);
    const prevFlatDatasetLn = this._currentDatasetLength;
    if (this.sharedService) {
      this.sharedService.hierarchicalDataset = newHierarchicalDataset;
    }

    if (newHierarchicalDataset && this.props.columns && this.filterService?.clearFilters) {
      this.filterService.clearFilters();
    }

    // when a hierarchical dataset is set afterward, we can reset the flat dataset and call a tree data sort that will overwrite the flat dataset
    if (this.dataView && newHierarchicalDataset && this.grid && this.sortService?.processTreeDataInitialSort) {
      this.dataView.setItems([], this._options?.datasetIdPropertyName ?? 'id');
      this.sortService.processTreeDataInitialSort();
      this.treeDataService.initHierarchicalTree();

      // we also need to reset/refresh the Tree Data filters because if we inserted new item(s) then it might not show up without doing this refresh
      // however we need to queue our process until the flat dataset is ready, so we can queue a microtask to execute the DataView refresh only after everything is ready
      queueMicrotask(() => {
        const flatDatasetLn = this.dataView?.getItemCount() ?? 0;
        if (flatDatasetLn > 0 && (flatDatasetLn !== prevFlatDatasetLn || !isDatasetEqual)) {
          this.filterService.refreshTreeDataFilters();
        }
      });
    }

    this._isDatasetHierarchicalInitialized = true;
  }

  protected get paginationService(): PaginationService {
    return this.state?.paginationService;
  }
  protected set paginationService(value: PaginationService) {
    this.setStateValue('paginationService', value);
  }

  constructor(public readonly props: SlickgridReactProps) {
    super(props);
    const slickgridConfig = new SlickgridConfig();
    this._eventHandler = new SlickEventHandler();

    this.showPagination = false;

    // check if the user wants to hide the header row from the start
    // we only want to do this check once in the constructor
    this._hideHeaderRowAfterPageLoad = props.options?.showHeaderRow === false;

    this._options = this.mergeGridOptions(props.options || {});

    // initialize and assign all Service Dependencies
    this._eventPubSubService = new EventPubSubService();
    this._eventPubSubService.eventNamingStyle = EventNamingStyle.camelCase;

    this.backendUtilityService = new BackendUtilityService();
    this.gridEventService = new GridEventService();
    this.sharedService = new SharedService();
    this.collectionService = new CollectionService(this.props.translaterService);
    this.extensionUtility = new ExtensionUtility(this.sharedService, this.backendUtilityService, this.props.translaterService);
    this.filterFactory = new FilterFactory(slickgridConfig, this.props.translaterService, this.collectionService);
    this.filterService = new FilterService(
      this.filterFactory as any,
      this._eventPubSubService,
      this.sharedService,
      this.backendUtilityService
    );
    this.resizerService = new ResizerService(this._eventPubSubService);
    this.sortService = new SortService(this.collectionService, this.sharedService, this._eventPubSubService, this.backendUtilityService);
    this.treeDataService = new TreeDataService(this._eventPubSubService, this.filterService, this.sharedService, this.sortService);
    this.paginationService = new PaginationService(this._eventPubSubService, this.sharedService, this.backendUtilityService);

    this.extensionService = new ExtensionService(
      this.extensionUtility,
      this.filterService,
      this._eventPubSubService,
      this.sharedService,
      this.sortService,
      this.treeDataService,
      this.props.translaterService,
      () => this.gridService
    );

    this.gridStateService = new GridStateService(
      this.extensionService,
      this.filterService,
      this._eventPubSubService,
      this.sharedService,
      this.sortService,
      this.treeDataService
    );
    this.gridService = new GridService(
      this.gridStateService,
      this.filterService,
      this._eventPubSubService,
      this.paginationService,
      this.sharedService,
      this.sortService,
      this.treeDataService
    );
    this.headerGroupingService = new HeaderGroupingService(this.extensionUtility);

    this.serviceList = [
      this.extensionService,
      this.filterService,
      this.gridEventService,
      this.gridService,
      this.gridStateService,
      this.headerGroupingService,
      this.paginationService,
      this.resizerService,
      this.sortService,
      this.treeDataService,
    ];

    if (this.props.datasetHierarchical) {
      this.sharedService.hierarchicalDataset = this.props.datasetHierarchical || [];
    }

    // register all Service instances in the container
    this.props.containerService.registerInstance('PubSubService', this._eventPubSubService);
    this.props.containerService.registerInstance('EventPubSubService', this._eventPubSubService);
    this.props.containerService.registerInstance('ExtensionUtility', this.extensionUtility);
    this.props.containerService.registerInstance('FilterService', this.filterService);
    this.props.containerService.registerInstance('CollectionService', this.collectionService);
    this.props.containerService.registerInstance('ExtensionService', this.extensionService);
    this.props.containerService.registerInstance('GridEventService', this.gridEventService);
    this.props.containerService.registerInstance('GridService', this.gridService);
    this.props.containerService.registerInstance('GridStateService', this.gridStateService);
    this.props.containerService.registerInstance('HeaderGroupingService', this.headerGroupingService);
    this.props.containerService.registerInstance('PaginationService', this.paginationService);
    this.props.containerService.registerInstance('ResizerService', this.resizerService);
    this.props.containerService.registerInstance('SharedService', this.sharedService);
    this.props.containerService.registerInstance('SortService', this.sortService);
    this.props.containerService.registerInstance('TranslaterService', this.props.translaterService);
    this.props.containerService.registerInstance('TreeDataService', this.treeDataService);
  }

  get backendService(): BackendService | undefined {
    return this.options.backendServiceApi?.service;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get isDatasetInitialized(): boolean {
    return this._isDatasetInitialized;
  }
  set isDatasetInitialized(isInitialized: boolean) {
    this._isDatasetInitialized = isInitialized;
  }
  set isDatasetHierarchicalInitialized(isInitialized: boolean) {
    this._isDatasetHierarchicalInitialized = isInitialized;
  }

  get registeredResources(): ExternalResource[] {
    return this._registeredResources;
  }

  componentDidMount() {
    this._mounted = true;
    if (this._elm && this._eventPubSubService instanceof EventPubSubService) {
      this._eventPubSubService.elementSource = this._elm;

      // React doesn't play well with Custom Events & also the render is called after the constructor which brings a second problem
      // to fix both issues, we need to do the following:
      // loop through all component props and subscribe to the ones that startsWith "on", we'll assume that it's the custom events
      // we'll then call the assigned listener(s) when events are dispatching
      for (const prop in this.props) {
        if (prop.startsWith('on')) {
          const eventCallback: any = this.props[prop as keyof SlickgridReactProps];
          if (typeof eventCallback === 'function') {
            this.subscriptions.push(
              this._eventPubSubService.subscribe(prop, (data: unknown) => {
                const gridEventName = this._eventPubSubService.getEventNameByNamingConvention(prop, '');
                eventCallback.call(null, new CustomEvent(gridEventName, { detail: data }));
              })
            );
          }
        }
      }
    }

    // save resource refs to register before the grid options are merged and possibly deep copied
    // since a deep copy of grid options would lose original resource refs but we want to keep them as singleton
    this._registeredResources = this.options?.externalResources || [];

    this.initialization(this._eventHandler);
    this._isGridInitialized = true;

    // if we have a backendServiceApi and the enablePagination is undefined, we'll assume that we do want to see it, else get that defined value
    if (!this.hasBackendInfiniteScroll()) {
      this.options.enablePagination = !!(this.options.backendServiceApi && this.options.enablePagination === undefined
        ? true
        : this.options.enablePagination);
    }

    if (!this._isPaginationInitialized && !this.props.datasetHierarchical && this._options?.enablePagination && this._isLocalGrid) {
      this.showPagination = true;
      this.loadLocalGridPagination(this.dataset);
    }

    // recheck the empty warning message after grid is shown so that it works in every use case
    if (this._options?.enableEmptyDataWarningMessage) {
      const dataset = this.props.dataset || [];
      if (Array.isArray(dataset)) {
        const finalTotalCount = dataset.length;
        this.displayEmptyDataWarning(finalTotalCount < 1);
      }
    }

    // add dark mode CSS class when enabled
    if (this.options.darkMode) {
      this.setDarkMode(true);
    }

    this.suggestDateParsingWhenHelpful();
  }

  initialization(eventHandler: SlickEventHandler) {
    if (!this._columns) {
      throw new Error(
        'Using `<SlickgridReact>` requires `columns` and it seems that you might have forgot to provide this missing bindable model.'
      );
    }

    this._options.translater = this.props.translaterService;
    this._eventHandler = eventHandler;
    this._isAutosizeColsCalled = false;

    // when detecting a frozen grid, we'll automatically enable the mousewheel scroll handler so that we can scroll from both left/right frozen containers
    if (
      this._options &&
      ((this._options.frozenRow !== undefined && this._options.frozenRow >= 0) ||
        (this._options.frozenColumn !== undefined && this._options.frozenColumn >= 0)) &&
      this._options.enableMouseWheelScrollHandler === undefined
    ) {
      this._options.enableMouseWheelScrollHandler = true;
    }

    this._eventPubSubService.eventNamingStyle = this._options?.eventNamingStyle ?? EventNamingStyle.camelCase;
    this._eventPubSubService.publish(`onBeforeGridCreate`, true);

    // make sure the dataset is initialized (if not it will throw an error that it cannot getLength of null)
    this._dataset ||= this.props.dataset || [];
    this._currentDatasetLength = this._dataset.length;
    this._options = this.mergeGridOptions(this._options);
    this._paginationOptions = this._options?.pagination;
    this.backendServiceApi = this._options?.backendServiceApi;
    this._isLocalGrid = !this.backendServiceApi; // considered a local grid if it doesn't have a backend service set

    // inject the I18Next instance when translation is enabled
    if (this._options?.enableTranslate || this._options?.i18n) {
      const importErrorMsg =
        '[Slickgrid-React] Enabling translation requires you to install I18Next in your App and use `I18nextProvider` to provide it. ' +
        'Please make sure to first install it via "npm install i18next react-i18next" and then ' +
        'use `<I18nextProvider value={i18n}><App/></I18nextProvider>` in your main index.tsx file. ' +
        'Visit https://ghiscoding.gitbook.io/slickgrid-react/localization/localization for more info.';

      this._i18next = this.context; // Access the context directly
      if (this.props.translaterService && this._i18next) {
        this.props.translaterService.i18nInstance = this._i18next;
      } else {
        throw new Error(importErrorMsg);
      }
    }

    // unless specified, we'll create an internal postProcess callback (currently only available for GraphQL)
    if (this.options.backendServiceApi && !this.options.backendServiceApi?.disableInternalPostProcess) {
      this.createBackendApiInternalPostProcessCallback(this._options);
    }

    if (!this.props.customDataView) {
      const dataviewInlineFilters = (this._options.dataView && this._options.dataView.inlineFilters) || false;
      let dataViewOptions: Partial<DataViewOption> = { ...this._options.dataView, inlineFilters: dataviewInlineFilters };

      if (this._options.draggableGrouping || this._options.enableGrouping) {
        this.groupItemMetadataProvider = new SlickGroupItemMetadataProvider();
        this.sharedService.groupItemMetadataProvider = this.groupItemMetadataProvider;
        dataViewOptions = { ...dataViewOptions, groupItemMetadataProvider: this.groupItemMetadataProvider };
      }
      this.dataView = new SlickDataView<TData>(dataViewOptions as Partial<DataViewOption>, this._eventPubSubService);
      this._eventPubSubService.publish('onDataviewCreated', this.dataView);
    }

    // get any possible Services that user want to register which don't require SlickGrid to be instantiated
    // RxJS Resource is in this lot because it has to be registered before anything else and doesn't require SlickGrid to be initialized
    this.preRegisterResources();

    // prepare and load all SlickGrid editors, if an async editor is found then we'll also execute it.
    this._columns = this.loadSlickGridEditors(this.props.columns);

    // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
    if (this._options.autoAddCustomEditorFormatter) {
      autoAddEditorFormatterToColumnsWithEditor(this._columns, this._options.autoAddCustomEditorFormatter);
    }

    // save reference for all columns before they optionally become hidden/visible
    this.sharedService.allColumns = this._columns;
    this.sharedService.visibleColumns = this._columns;

    // after subscribing to potential columns changed, we are ready to create these optional extensions
    // when we did find some to create (RowMove, RowDetail, RowSelections), it will automatically modify column definitions (by previous subscribe)
    this.extensionService.createExtensionsBeforeGridCreation(this._columns, this._options);

    // if user entered some Pinning/Frozen "presets", we need to apply them in the grid options
    if (this.options.presets?.pinning) {
      this.options = { ...this.options, ...this.options.presets.pinning };
    }

    // build SlickGrid Grid, also user might optionally pass a custom dataview (e.g. remote model)
    this.grid = new SlickGrid(
      `#${this.props.gridId}`,
      this.props.customDataView || this.dataView,
      this._columns,
      this._options,
      this._eventPubSubService
    );
    this.sharedService.dataView = this.dataView;
    this.sharedService.slickGrid = this.grid;
    this.sharedService.gridContainerElement = this._elm as HTMLDivElement;
    if (this.groupItemMetadataProvider) {
      this.grid.registerPlugin(this.groupItemMetadataProvider); // register GroupItemMetadataProvider when Grouping is enabled
    }

    this.extensionService.bindDifferentExtensions();
    this.bindDifferentHooks(this.grid, this._options, this.dataView);

    // when it's a frozen grid, we need to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward
    this.sharedService.frozenVisibleColumnId = this.grid.getFrozenColumnId();

    // get any possible Services that user want to register
    this.registerResources();

    // initialize the SlickGrid grid
    this.grid.init();

    // initialized the resizer service only after SlickGrid is initialized
    // if we don't we end up binding our resize to a grid element that doesn't yet exist in the DOM and the resizer service will fail silently (because it has a try/catch that unbinds the resize without throwing back)
    const gridContainerElm = this._elm;
    if (gridContainerElm) {
      this.resizerService.init(this.grid, gridContainerElm);
    }

    // user could show a custom footer with the data metrics (dataset length and last updated timestamp)
    if (!this._options.enablePagination && this._options.showCustomFooter && this._options.customFooterOptions && gridContainerElm) {
      this.slickFooter = new SlickFooterComponent(
        this.grid,
        this._options.customFooterOptions,
        this._eventPubSubService,
        this.props.translaterService
      );
      this.slickFooter.renderFooter(gridContainerElm as HTMLDivElement);
    }

    if (!this.props.customDataView && this.dataView) {
      const initialDataset = this._options?.enableTreeData ? this.sortTreeDataset(this.props.dataset) : this.props.dataset;
      if (Array.isArray(initialDataset)) {
        this.dataView.setItems(initialDataset, this._options.datasetIdPropertyName ?? 'id');
      }

      // if you don't want the items that are not visible (due to being filtered out or being on a different page)
      // to stay selected, pass 'false' to the second arg
      if (this.grid?.getSelectionModel() && this._options?.dataView && this._options.dataView.hasOwnProperty('syncGridSelection')) {
        // if we are using a Backend Service, we will do an extra flag check, the reason is because it might have some unintended behaviors
        // with the BackendServiceApi because technically the data in the page changes the DataView on every page change.
        let preservedRowSelectionWithBackend = false;
        if (this._options.backendServiceApi && this._options.dataView.hasOwnProperty('syncGridSelectionWithBackendService')) {
          preservedRowSelectionWithBackend = this._options.dataView.syncGridSelectionWithBackendService as boolean;
        }

        const syncGridSelection = this._options.dataView.syncGridSelection;
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

      if (this._dataset.length > 0) {
        if (
          !this._isDatasetInitialized &&
          (this._options.enableCheckboxSelector || this._options.enableRowSelection || this._options.enableHybridSelection)
        ) {
          this.loadRowSelectionPresetWhenExists();
        }
        this.loadFilterPresetsWhenDatasetInitialized();
        this._isDatasetInitialized = true;
      }
    }

    // user might want to hide the header row on page load but still have `enableFiltering: true`
    // if that is the case, we need to hide the headerRow ONLY AFTER all filters got created & dataView exist
    if (this._hideHeaderRowAfterPageLoad) {
      this.showHeaderRow(false);
      this.sharedService.hideHeaderRowAfterPageLoad = this._hideHeaderRowAfterPageLoad;
    }

    // publish & dispatch certain events
    this._eventPubSubService.publish(`onGridCreated`, this.grid);

    // after the DataView is created & updated execute some processes & dispatch some events
    if (!this.props.customDataView) {
      this.executeAfterDataviewCreated(this.grid, this._options);
    }

    // bind resize ONLY after the dataView is ready
    this.bindResizeHook(this.grid, this._options);

    // bind the Backend Service API callback functions only after the grid is initialized
    // because the preProcess() and onInit() might get triggered
    if (this._options?.backendServiceApi) {
      this.bindBackendCallbackFunctions(this._options);
    }

    // create the React Grid Instance with reference to all Services
    const reactElementInstance: SlickgridReactInstance = {
      element: this._elm as HTMLDivElement,

      // Slick Grid & DataView objects
      dataView: this.dataView,
      slickGrid: this.grid,

      // public methods
      dispose: this.dispose.bind(this),

      // return all available Services (non-singleton)
      backendService: this.backendService,
      eventPubSubService: this._eventPubSubService,
      extensionService: this.extensionService,
      filterService: this.filterService,
      gridEventService: this.gridEventService,
      gridStateService: this.gridStateService,
      gridService: this.gridService,
      headerGroupingService: this.headerGroupingService,
      paginationService: this.paginationService,
      resizerService: this.resizerService,
      sortService: this.sortService,
      treeDataService: this.treeDataService,
    };

    // addons (SlickGrid extra plugins/controls)
    this.extensions = this.extensionService?.extensionList;

    // all instances (SlickGrid, DataView & all Services)
    this.instances = reactElementInstance;
    this.setStateValue('instances', reactElementInstance);
    this._eventPubSubService.publish('onReactGridCreated', reactElementInstance);

    // subscribe to column definitions assignment changes
    this.observeColumns();
  }

  componentWillUnmount(shouldEmptyDomElementContainer = false) {
    this._eventPubSubService.publish('onBeforeGridDestroy', this.grid);
    this._eventHandler?.unsubscribeAll();
    if (typeof this._i18next?.off === 'function') {
      this._i18next.off('languageChanged');
    }

    // we could optionally also empty the content of the grid container DOM element
    if (shouldEmptyDomElementContainer) {
      this.emptyGridContainerElm();
    }

    this._collectionObservers.forEach((obs) => obs?.disconnect());
    this._eventPubSubService.publish('onAfterGridDestroyed', true);

    // dispose of all Services
    this.serviceList.forEach((service: any) => {
      if (service?.dispose) {
        service.dispose();
      }
    });
    this.serviceList = [];

    // dispose backend service when defined and a dispose method exists
    this.backendService?.dispose?.();

    // dispose all registered external resources
    this.disposeExternalResources();

    // dispose the Components
    this.slickEmptyWarning?.dispose();
    this.slickFooter?.dispose();
    this.slickPagination?.dispose();

    if (this.dataView) {
      if (this.dataView.setItems) {
        this.dataView.setItems([]);
      }
      if (this.dataView.destroy) {
        this.dataView.destroy();
      }
    }
    if (this.grid?.destroy) {
      this.grid.destroy(shouldEmptyDomElementContainer);
    }

    // also dispose of all Subscriptions
    this.subscriptions = disposeAllSubscriptions(this.subscriptions);

    if (this.backendServiceApi) {
      for (const prop of Object.keys(this.backendServiceApi)) {
        (this.backendServiceApi as any)[prop] = null;
      }
      this.backendServiceApi = undefined;
    }
    for (const prop of Object.keys(this.props.columns)) {
      (this.props.columns as any)[prop] = null;
    }
    for (const prop of Object.keys(this.sharedService)) {
      (this.sharedService as any)[prop] = null;
    }
    this._dataset = null;
    this._columns = [];
  }

  emptyGridContainerElm() {
    const gridContainerId = this._options?.gridContainerId || 'grid1';
    const gridContainerElm = document.querySelector(`#${gridContainerId}`) as HTMLDivElement;
    emptyElement(gridContainerElm);
  }

  dispose(shouldEmptyDomElementContainer = false) {
    this.componentWillUnmount(shouldEmptyDomElementContainer);
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

  componentDidUpdate(prevProps: SlickgridReactProps) {
    // get the grid options (order of precedence is Global Options first, then user option which could overwrite the Global options)
    if (this.props.options !== prevProps.options) {
      this._options = { ...GlobalGridOptions, ...this._options };
    }

    if (this.props.columns !== prevProps.columns) {
      this._columns = this.props.columns;
      this.columnsChanged(this.props.columns);
    }

    if (this.props.dataset !== prevProps.dataset) {
      this.dataset = this.props.dataset || prevProps.dataset;
    }

    if (this.props.datasetHierarchical && this.props.datasetHierarchical !== prevProps.datasetHierarchical) {
      this.datasetHierarchical = this.props.datasetHierarchical;
    }
    this.suggestDateParsingWhenHelpful();
  }

  columnsChanged(columns?: Column[]) {
    if (columns) {
      this._columns = columns;
    }
    if (this._isGridInitialized) {
      this.updateColumnsList(this._columns);
    }
    if (this._columns.length > 0) {
      this.copyColumnWidthsReference(this._columns);
    }
  }

  /**
   * Define our internal Post Process callback, it will execute internally after we get back result from the Process backend call
   * Currently ONLY available with the GraphQL Backend Service.
   * The behavior is to refresh the Dataset & Pagination without requiring the user to create his own PostProcess every time
   */
  createBackendApiInternalPostProcessCallback(gridOptions: GridOption) {
    const backendApi = gridOptions?.backendServiceApi;
    if (backendApi?.service) {
      const backendApiService = backendApi.service;

      // internalPostProcess only works (for now) with a GraphQL Service, so make sure it is of that type
      if (typeof backendApiService.getDatasetName === 'function') {
        backendApi.internalPostProcess = (processResult: any) => {
          const datasetName =
            backendApi && backendApiService && typeof backendApiService.getDatasetName === 'function'
              ? backendApiService.getDatasetName()
              : '';
          if (processResult?.data[datasetName]) {
            const data = processResult.data[datasetName].hasOwnProperty('nodes')
              ? (processResult as any).data[datasetName].nodes
              : (processResult as any).data[datasetName];
            const totalCount = processResult.data[datasetName].hasOwnProperty('totalCount')
              ? (processResult as any).data[datasetName].totalCount
              : (processResult as any).data[datasetName].length;
            this.refreshGridData(data, totalCount || 0);
          }
        };
      }
    }
  }

  bindDifferentHooks(grid: SlickGrid, gridOptions: GridOption, dataView: SlickDataView) {
    // translate some of them on first load, then on each language change
    if (gridOptions.enableTranslate) {
      this.extensionService.translateAllExtensions();
    }

    // on locale change, we have to manually translate the Headers, GridMenu
    if (typeof this._i18next?.on === 'function') {
      this._i18next.on('languageChanged', (lang) => {
        // publish event of the same name that Slickgrid-Universal uses on a language change event
        this._eventPubSubService.publish('onLanguageChange');

        if (gridOptions.enableTranslate) {
          this.extensionService.translateAllExtensions(lang);
          if (
            (gridOptions.createPreHeaderPanel && gridOptions.createTopHeaderPanel) ||
            (gridOptions.createPreHeaderPanel && !gridOptions.enableDraggableGrouping)
          ) {
            this.headerGroupingService.translateHeaderGrouping();
          }
        }
      });
    }

    // if user set an onInit Backend, we'll run it right away (and if so, we also need to run preProcess, internalPostProcess & postProcess)
    if (gridOptions.backendServiceApi) {
      const backendApi = gridOptions.backendServiceApi;

      if (backendApi?.service?.init) {
        backendApi.service.init(backendApi.options, gridOptions.pagination, this.grid, this.sharedService);
      }
    }

    if (dataView && grid) {
      // on cell click, mainly used with the columnDef.action callback
      this.gridEventService.bindOnBeforeEditCell(grid);
      this.gridEventService.bindOnCellChange(grid);
      this.gridEventService.bindOnClick(grid);

      if (dataView && grid) {
        // bind external sorting (backend) when available or default onSort (dataView)
        if (gridOptions.enableSorting) {
          // bind external sorting (backend) unless specified to use the local one
          if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalSorting) {
            this.sortService.bindBackendOnSort(grid);
          } else {
            this.sortService.bindLocalOnSort(grid);
          }
        }

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

        // when column are reordered, we need to update the visibleColumn array
        this._eventHandler.subscribe(grid.onColumnsReordered, (_e, args) => {
          this.sharedService.hasColumnsReordered = true;
          this.sharedService.visibleColumns = args.impactedColumns;
        });

        this._eventHandler.subscribe(grid.onSetOptions, (_e, args) => {
          // add/remove dark mode CSS class when enabled
          if (args.optionsBefore.darkMode !== args.optionsAfter.darkMode && this.sharedService.gridContainerElement) {
            this.setDarkMode(args.optionsAfter.darkMode);
          }
        });

        // load any presets if any (after dataset is initialized)
        this.loadColumnPresetsWhenDatasetInitialized();
        this.loadFilterPresetsWhenDatasetInitialized();

        // When data changes in the DataView, we need to refresh the metrics and/or display a warning if the dataset is empty
        this._eventHandler.subscribe(dataView.onRowCountChanged, (_e, args) => {
          if (!gridOptions.enableRowDetailView || !Array.isArray(args.changedRows) || args.changedRows.length === args.itemCount) {
            grid.invalidate();
          } else {
            grid.invalidateRows(args.changedRows);
            grid.render();
          }
          this.handleOnItemCountChanged(dataView.getFilteredItemCount() || 0, dataView.getItemCount() || 0);
        });
        this._eventHandler.subscribe(dataView.onSetItemsCalled, (_e, args) => {
          this.sharedService.isItemsDateParsed = false;
          this.handleOnItemCountChanged(dataView.getFilteredItemCount() || 0, args.itemCount);

          // when user has resize by content enabled, we'll force a full width calculation since we change our entire dataset
          if (
            args.itemCount > 0 &&
            (this.options.autosizeColumnsByCellContentOnFirstLoad || this.options.enableAutoResizeColumnsByCellContent)
          ) {
            this.resizerService.resizeColumnsByCellContent(!this._options?.resizeByContentOnlyOnFirstLoad);
          }
        });

        if (gridOptions?.enableFiltering && !gridOptions.enableRowDetailView) {
          this._eventHandler.subscribe(dataView.onRowsChanged, (_e, { calledOnRowCountChanged, rows }) => {
            // filtering data with local dataset will not always show correctly unless we call this updateRow/render
            // also don't use "invalidateRows" since it destroys the entire row and as bad user experience when updating a row
            // see commit: https://github.com/ghiscoding/aurelia-slickgrid/commit/8c503a4d45fba11cbd8d8cc467fae8d177cc4f60
            if (!calledOnRowCountChanged && Array.isArray(rows)) {
              const ranges = grid.getRenderedRange();
              rows.filter((row) => row >= ranges.top && row <= ranges.bottom).forEach((row: number) => grid.updateRow(row));
              grid.render();
            }
          });
        }
      }
    }
  }

  bindBackendCallbackFunctions(gridOptions: GridOption) {
    const backendApi = gridOptions.backendServiceApi;
    const backendApiService = backendApi?.service;
    const serviceOptions: BackendServiceOption = backendApiService?.options || {};
    const isExecuteCommandOnInit = !serviceOptions
      ? false
      : serviceOptions && serviceOptions.hasOwnProperty('executeProcessCommandOnInit')
        ? serviceOptions['executeProcessCommandOnInit']
        : true;

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
          const sortColumns = this._options?.multiColumnSort ? gridOptions.presets.sorters : gridOptions.presets.sorters.slice(0, 1);
          backendApiService.updateSorters(undefined, sortColumns);
        }
        // Pagination "presets"
        if (backendApiService.updatePagination && gridOptions.presets.pagination && !this.hasBackendInfiniteScroll()) {
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
        const query = typeof backendApiService.buildQuery === 'function' ? backendApiService.buildQuery() : '';
        const process = isExecuteCommandOnInit ? (backendApi.process?.(query) ?? null) : (backendApi.onInit?.(query) ?? null);

        // wrap this inside a microtask to be executed at the end of the task and avoid timing issue since the gridOptions needs to be ready before running this onInit
        queueMicrotask(() => {
          const backendUtilityService = this.backendUtilityService as BackendUtilityService;

          // keep start time & end timestamps & return it after process execution
          const startTime = new Date();

          // run any pre-process, if defined, for example a spinner
          if (backendApi.preProcess) {
            backendApi.preProcess();
          }

          // the processes can be a Promise (like Http)
          const totalItems = this._options?.pagination?.totalItems ?? 0;
          if (process instanceof Promise) {
            process
              .then((processResult: any) =>
                backendUtilityService.executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems)
              )
              .catch((error) => backendUtilityService.onBackendError(error, backendApi));
          } else if (process && this.rxjs?.isObservable(process)) {
            this.subscriptions.push(
              (process as Observable<any>).subscribe(
                (processResult: any) =>
                  backendUtilityService.executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems),
                (error: any) => backendUtilityService.onBackendError(error, backendApi)
              )
            );
          }
        });
      }

      // when user enables Infinite Scroll
      if (backendApi.service.options?.infiniteScroll) {
        this.addBackendInfiniteScrollCallback();
      }
    }
  }

  protected addBackendInfiniteScrollCallback(): void {
    if (this.grid && this.options.backendServiceApi && this.hasBackendInfiniteScroll() && !this.options.backendServiceApi?.onScrollEnd) {
      const onScrollEnd = () => {
        this.backendUtilityService.setInfiniteScrollBottomHit(true);

        // even if we're not showing pagination, we still use pagination service behind the scene
        // to keep track of the scroll position and fetch next set of data (aka next page)
        // we also need a flag to know if we reached the of the dataset or not (no more pages)
        this.paginationService.goToNextPage().then((hasNext) => {
          if (!hasNext) {
            this.backendUtilityService.setInfiniteScrollBottomHit(false);
          }
        });
      };
      this.options.backendServiceApi.onScrollEnd = onScrollEnd;

      // subscribe to SlickGrid onScroll to determine when reaching the end of the scroll bottom position
      // run onScrollEnd() method when that happens
      this._eventHandler.subscribe(this.grid.onScroll, (_e, args) => {
        const viewportElm = args.grid.getViewportNode()!;
        if (
          ['mousewheel', 'scroll'].includes(args.triggeredBy || '') &&
          this.paginationService?.totalItems &&
          args.scrollTop > 0 &&
          Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
        ) {
          if (!this._scrollEndCalled) {
            onScrollEnd();
            this._scrollEndCalled = true;
          }
        }
      });

      // use postProcess to identify when scrollEnd process is finished to avoid calling the scrollEnd multiple times
      // we also need to keep a ref of the user's postProcess and call it after our own postProcess
      const orgPostProcess = this.options.backendServiceApi.postProcess;
      this.options.backendServiceApi.postProcess = (processResult: any) => {
        this._scrollEndCalled = false;
        if (orgPostProcess) {
          orgPostProcess(processResult);
        }
      };
    }
  }

  bindResizeHook(grid: SlickGrid, options: GridOption) {
    if (
      (options.autoFitColumnsOnFirstLoad && options.autosizeColumnsByCellContentOnFirstLoad) ||
      (options.enableAutoSizeColumns && options.enableAutoResizeColumnsByCellContent)
    ) {
      throw new Error(
        `[Slickgrid-React] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use. You can enable these 2 options ("autoFitColumnsOnFirstLoad" and "enableAutoSizeColumns") OR these other 2 options ("autosizeColumnsByCellContentOnFirstLoad" and "enableAutoResizeColumnsByCellContent").`
      );
    }

    // auto-resize grid on browser resize
    if (options.gridHeight || options.gridWidth) {
      this.resizerService.resizeGrid(0, { height: options.gridHeight, width: options.gridWidth });
    } else {
      this.resizerService.resizeGrid();
    }

    // expand/autofit columns on first page load
    if (
      grid &&
      options?.enableAutoResize &&
      options.autoFitColumnsOnFirstLoad &&
      options.enableAutoSizeColumns &&
      !this._isAutosizeColsCalled
    ) {
      grid.autosizeColumns();
      this._isAutosizeColsCalled = true;
    }
  }

  executeAfterDataviewCreated(_grid: SlickGrid, gridOptions: GridOption) {
    // if user entered some Sort "presets", we need to reflect them all in the DOM
    if (gridOptions.enableSorting) {
      if (gridOptions.presets && Array.isArray(gridOptions.presets.sorters)) {
        // when using multi-column sort, we can have multiple but on single sort then only grab the first sort provided
        const sortColumns = this._options?.multiColumnSort ? gridOptions.presets.sorters : gridOptions.presets.sorters.slice(0, 1);
        this.sortService.loadGridSorters(sortColumns);
      }
    }
  }

  /**
   * On a Pagination changed, we will trigger a Grid State changed with the new pagination info
   * Also if we use Row Selection or the Checkbox Selector with a Backend Service (Odata, GraphQL), we need to reset any selection
   */
  paginationChanged(pagination: PaginationMetadata) {
    const isSyncGridSelectionEnabled = this.gridStateService?.needToPreserveRowSelection() ?? false;
    if (
      this.grid &&
      !isSyncGridSelectionEnabled &&
      this.options?.backendServiceApi &&
      (this.options.enableRowSelection || this.options.enableHybridSelection || this.options.enableCheckboxSelector)
    ) {
      this.grid.setSelectedRows([]);
    }
    const { pageNumber, pageSize } = pagination;
    if (this.sharedService) {
      if (pageSize !== undefined && pageNumber !== undefined) {
        this.sharedService.currentPagination = { pageNumber, pageSize };
      }
    }
    this._eventPubSubService.publish('onGridStateChanged', {
      change: { newValues: { pageNumber, pageSize }, type: 'pagination' },
      gridState: this.gridStateService.getCurrentGridState(),
    });
  }

  paginationOptionsChanged(newPaginationOptions: Pagination) {
    if (newPaginationOptions && this._paginationOptions) {
      this._paginationOptions = { ...this._paginationOptions, ...newPaginationOptions };
    } else {
      this._paginationOptions = newPaginationOptions;
    }
    if (this._options) {
      this._options.pagination = this._paginationOptions;
      this.paginationService.updateTotalItems(newPaginationOptions?.totalItems ?? 0, true);
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
    if (this.grid && this._options) {
      if (this._options?.enablePagination && this._isLocalGrid) {
        this.showPagination = true;
        this.loadLocalGridPagination(dataset);
      }

      if (this._options?.enableEmptyDataWarningMessage && Array.isArray(dataset)) {
        const finalTotalCount = totalCount || dataset.length;
        this.displayEmptyDataWarning(finalTotalCount < 1);
      }

      if (Array.isArray(dataset) && this.grid && this.dataView?.setItems) {
        this.dataView.setItems(dataset, this._options.datasetIdPropertyName ?? 'id');
        if (!this._options.backendServiceApi && !this._options.enableTreeData) {
          this.dataView.reSort();
        }

        if (dataset.length > 0) {
          if (!this._isDatasetInitialized) {
            this.loadFilterPresetsWhenDatasetInitialized();

            if (this._options.enableCheckboxSelector) {
              this.loadRowSelectionPresetWhenExists();
            }
          }
          this._isDatasetInitialized = true;
        }

        // display the Pagination component only after calling this refresh data first, we call it here so that if we preset pagination page number it will be shown correctly
        this.showPagination = !!(
          this._options &&
          (this._options.enablePagination || (this._options.backendServiceApi && this._options.enablePagination === undefined))
        );
        if (this._paginationOptions && this._options?.pagination && this._options?.backendServiceApi) {
          const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this._options, this._paginationOptions);

          // when we have a totalCount use it, else we'll take it from the pagination object
          // only update the total items if it's different to avoid refreshing the UI
          const totalRecords = totalCount !== undefined ? totalCount : this._options?.pagination?.totalItems;
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
        if (this.grid && this._options.enableAutoResize) {
          const delay = this._options.autoResize && this._options.autoResize.delay;
          this.resizerService.resizeGrid(delay || 10);
        }
      }
    }
  }

  /**
   * Show the filter row displayed on first row, we can optionally pass false to hide it.
   * @param showing
   */
  showHeaderRow(showing = true) {
    this.grid.setHeaderRowVisibility(showing);
    if (showing === true && this._isGridInitialized) {
      this.grid.setColumns(this.props.columns);
    }
    return showing;
  }

  /**
   * Check if there's any Pagination Presets defined in the Grid Options,
   * if there are then load them in the paginationOptions object
   */
  protected setPaginationOptionsWhenPresetDefined(gridOptions: GridOption, paginationOptions: Pagination): Pagination {
    if (gridOptions.presets?.pagination && gridOptions.pagination) {
      if (this.hasBackendInfiniteScroll()) {
        console.warn('[Slickgrid-React] `presets.pagination` is not supported with Infinite Scroll, reverting to first page.');
      } else {
        paginationOptions.pageSize = gridOptions.presets.pagination.pageSize;
        paginationOptions.pageNumber = gridOptions.presets.pagination.pageNumber;
      }
    }
    return paginationOptions;
  }

  setDarkMode(dark = false) {
    this.sharedService.gridContainerElement?.classList.toggle('slick-dark-mode', dark);
  }

  /**
   * Dynamically change or update the column definitions list.
   * We will re-render the grid so that the new header and data shows up correctly.
   * If using i18n, we also need to trigger a re-translate of the column headers
   */
  updateColumnsList(newColumns: Column<TData>[]) {
    if (this.grid && this._options && Array.isArray(newColumns)) {
      // map the Editor model to editorClass and load editor collectionAsync
      newColumns = this.loadSlickGridEditors(newColumns);

      // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
      if (this._options.autoAddCustomEditorFormatter) {
        autoAddEditorFormatterToColumnsWithEditor(newColumns, this._options.autoAddCustomEditorFormatter);
      }

      if (this._options.enableTranslate) {
        this.extensionService.translateColumnHeaders(undefined, newColumns);
      } else {
        this.extensionService.renderColumnHeaders(newColumns, true);
      }

      if (this._options?.enableAutoSizeColumns) {
        this.grid.autosizeColumns();
      } else if (this._options?.enableAutoResizeColumnsByCellContent && this.resizerService?.resizeColumnsByCellContent) {
        this.resizerService.resizeColumnsByCellContent();
      }
    }
  }

  //
  // protected functions
  // ------------------

  /**
   * assignment changes are not triggering on the column definitions, for that
   * we can use our internal array observer for any changes done via (push, pop, shift, ...)
   */
  protected observeColumns(): void {
    this._collectionObservers.push(collectionObserver(this._columns, this.columnsChanged.bind(this)));
  }

  /**
   * Loop through all column definitions and copy the original optional `width` properties optionally provided by the user.
   * We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
   */
  protected copyColumnWidthsReference(columns: Column<TData>[]) {
    columns.forEach((col) => (col.originalWidth = col.width));
  }

  protected displayEmptyDataWarning(showWarning = true) {
    this.slickEmptyWarning?.showEmptyDataMessage(showWarning);
  }

  /** When data changes in the DataView, we'll refresh the metrics and/or display a warning if the dataset is empty */
  protected handleOnItemCountChanged(currentPageRowItemCount: number, totalItemCount: number) {
    this._currentDatasetLength = totalItemCount;
    this.metrics = {
      startTime: new Date(),
      endTime: new Date(),
      itemCount: currentPageRowItemCount,
      totalItemCount,
    };
    // if custom footer is enabled, then we'll update its metrics
    if (this.slickFooter) {
      this.slickFooter.metrics = this.metrics;
    }

    // when using local (in-memory) dataset, we'll display a warning message when filtered data is empty
    if (this._isLocalGrid && this._options?.enableEmptyDataWarningMessage) {
      this.displayEmptyDataWarning(currentPageRowItemCount === 0);
    }

    // when autoResize.autoHeight is enabled, we'll want to call a resize
    if (this._options.enableAutoResize && this.resizerService.isAutoHeightEnabled && currentPageRowItemCount > 0) {
      this.resizerService.resizeGrid();
    }
  }

  /** Initialize the Pagination Service once */
  protected initializePaginationService(paginationOptions: Pagination) {
    if (this.grid && this.options) {
      this.paginationService.totalItems = this.totalItems;
      this.paginationService.init(this.grid, paginationOptions, this.backendServiceApi);
      this.subscriptions.push(
        this._eventPubSubService.subscribe<PaginationMetadata>('onPaginationChanged', (paginationChanges) =>
          this.paginationChanged(paginationChanges)
        ),
        this._eventPubSubService.subscribe<PaginationMetadata>('onPaginationOptionsChanged', (paginationChanges) =>
          this.paginationOptionsChanged(paginationChanges)
        ),
        this._eventPubSubService.subscribe<{ visible: boolean }>('onPaginationVisibilityChanged', (visibility: { visible: boolean }) => {
          this.showPagination = visibility?.visible ?? false;
          if (this.options?.backendServiceApi) {
            this.backendUtilityService?.refreshBackendDataset(this.options);
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
  protected async renderPagination(showPagination = true) {
    if (this.grid && this._options?.enablePagination && !this._isPaginationInitialized && showPagination) {
      if (this.options.customPaginationComponent) {
        const paginationContainer = document.createElement('section');
        this._elm!.appendChild(paginationContainer);
        const { component } = await loadReactComponentDynamically<BasePaginationComponent>(
          this.options.customPaginationComponent,
          paginationContainer
        );
        this.slickPagination = component;
      } else {
        this.slickPagination = new SlickPaginationComponent();
      }

      if (this.slickPagination) {
        this.slickPagination.init(this.grid, this.paginationService, this._eventPubSubService, this.props.translaterService);
        this.slickPagination.renderPagination(this._elm as HTMLDivElement);
        this._isPaginationInitialized = true;
      }
    } else if (!showPagination) {
      this.slickPagination?.dispose();
      this._isPaginationInitialized = false;
    }
  }

  /** Load the Editor Collection asynchronously and replace the "collection" property when Promise resolves */
  protected loadEditorCollectionAsync(column: Column) {
    if (column?.editor) {
      const collectionAsync = column.editor.collectionAsync;
      column.editor.disabled = true; // disable the Editor DOM element, we'll re-enable it after receiving the collection with "updateEditorCollection()"

      if (collectionAsync instanceof Promise) {
        // wait for the "collectionAsync", once resolved we will save it into the "collection"
        // the collectionAsync can be of 3 types Fetch, Promise or RxJS when available
        collectionAsync.then((response: any | any[]) => {
          if (Array.isArray(response)) {
            this.updateEditorCollection(column, response); // from Promise
          } else if (response instanceof Response && typeof response.json === 'function') {
            if (response.bodyUsed) {
              console.warn(
                `[SlickGrid-React] The response body passed to collectionAsync was already read.` +
                  `Either pass the dataset from the Response or clone the response first using response.clone()`
              );
            } else {
              // from Fetch
              (response as Response).json().then((data) => this.updateEditorCollection(column, data));
            }
          } else if (response?.content) {
            this.updateEditorCollection(column, response.content); // from http-client
          }
        });
      } else if (this.rxjs?.isObservable(collectionAsync)) {
        // wrap this inside a microtask at the end of the task to avoid timing issue since updateEditorCollection requires to call SlickGrid getColumns() method after columns are available
        queueMicrotask(() => {
          this.subscriptions.push(
            (collectionAsync as Observable<any>).subscribe((resolvedCollection) => this.updateEditorCollection(column, resolvedCollection))
          );
        });
      }
    }
  }

  protected insertDynamicPresetColumns(columnId: string, gridPresetColumns: Column<TData>[]) {
    if (this._columns) {
      const columnPosition = this._columns.findIndex((c) => c.id === columnId);
      if (columnPosition >= 0) {
        const dynColumn = this._columns[columnPosition];
        if (dynColumn?.id === columnId && !gridPresetColumns.some((c) => c.id === columnId)) {
          columnPosition > 0 ? gridPresetColumns.splice(columnPosition, 0, dynColumn) : gridPresetColumns.unshift(dynColumn);
        }
      }
    }
  }

  /** Load any possible Columns Grid Presets */
  protected loadColumnPresetsWhenDatasetInitialized() {
    // if user entered some Columns "presets", we need to reflect them all in the grid
    if (this.grid && this.options.presets && Array.isArray(this.options.presets.columns) && this.options.presets.columns.length > 0) {
      const gridPresetColumns: Column<TData>[] = this.gridStateService.getAssociatedGridColumns(this.grid, this.options.presets.columns);
      if (gridPresetColumns && Array.isArray(gridPresetColumns) && gridPresetColumns.length > 0 && Array.isArray(this._columns)) {
        // make sure that the dynamic columns are included in presets (1.Row Move, 2. Row Selection, 3. Row Detail)
        if (this.options.enableRowMoveManager) {
          const rmmColId = this.options?.rowMoveManager?.columnId ?? '_move';
          this.insertDynamicPresetColumns(rmmColId, gridPresetColumns);
        }
        if (this.options.enableCheckboxSelector) {
          const chkColId = this.options?.checkboxSelector?.columnId ?? '_checkbox_selector';
          this.insertDynamicPresetColumns(chkColId, gridPresetColumns);
        }
        if (this.options.enableRowDetailView) {
          const rdvColId = this.options?.rowDetailView?.columnId ?? '_detail_selector';
          this.insertDynamicPresetColumns(rdvColId, gridPresetColumns);
        }

        // keep copy the original optional `width` properties optionally provided by the user.
        // We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
        gridPresetColumns.forEach((col) => (col.originalWidth = col.width));

        // finally set the new presets columns (including checkbox selector if need be)
        this.grid.setColumns(gridPresetColumns);
        this.sharedService.visibleColumns = gridPresetColumns;
      }
    }
  }

  /** Load any possible Filters Grid Presets */
  protected loadFilterPresetsWhenDatasetInitialized() {
    if (this._options && !this.props.customDataView) {
      // if user entered some Filter "presets", we need to reflect them all in the DOM
      if (
        this._options.presets &&
        (Array.isArray(this._options.presets.filters) || Array.isArray(this._options.presets?.treeData?.toggledItems))
      ) {
        this.filterService.populateColumnFilterSearchTermPresets(this._options.presets?.filters || []);
      }
    }
  }

  /**
   * local grid, check if we need to show the Pagination
   * if so then also check if there's any presets and finally initialize the PaginationService
   * a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
   */
  protected loadLocalGridPagination(dataset?: any[]) {
    if (this._options && this._paginationOptions) {
      this.totalItems = Array.isArray(dataset) ? dataset.length : 0;
      if (this._paginationOptions && this.dataView?.getPagingInfo) {
        const slickPagingInfo = this.dataView.getPagingInfo();
        if (slickPagingInfo?.hasOwnProperty('totalRows') && this._paginationOptions.totalItems !== slickPagingInfo.totalRows) {
          this.totalItems = slickPagingInfo.totalRows || 0;
        }
      }
      this._paginationOptions.totalItems = this.totalItems;
      const paginationOptions = this.setPaginationOptionsWhenPresetDefined(this._options, this._paginationOptions);
      this.initializePaginationService(paginationOptions);
    }
  }

  /** Load any Row Selections into the DataView that were presets by the user */
  protected loadRowSelectionPresetWhenExists() {
    // if user entered some Row Selections "presets"
    const presets = this._options?.presets;
    const enableRowSelection =
      this._options && (this._options.enableCheckboxSelector || this._options.enableRowSelection || this._options.enableHybridSelection);
    if (
      enableRowSelection &&
      this.grid?.getSelectionModel() &&
      presets?.rowSelection &&
      (Array.isArray(presets.rowSelection.gridRowIndexes) || Array.isArray(presets.rowSelection.dataContextIds))
    ) {
      let dataContextIds = presets.rowSelection.dataContextIds;
      let gridRowIndexes = presets.rowSelection.gridRowIndexes;

      // maps the IDs to the Grid Rows and vice versa, the "dataContextIds" has precedence over the other
      if (Array.isArray(dataContextIds) && dataContextIds.length > 0) {
        gridRowIndexes = this.dataView.mapIdsToRows(dataContextIds) || [];
      } else if (Array.isArray(gridRowIndexes) && gridRowIndexes.length > 0) {
        dataContextIds = this.dataView.mapRowsToIds(gridRowIndexes) || [];
      }

      // apply row selection when defined as grid presets
      if (this.grid && Array.isArray(gridRowIndexes)) {
        this.grid.setSelectedRows(gridRowIndexes);
        this.dataView!.setSelectedIds(dataContextIds || [], {
          isRowBeingAdded: true,
          shouldTriggerEvent: false, // do not trigger when presetting the grid
          applyRowSelectionToGrid: true,
        });
      }
    }
  }

  hasBackendInfiniteScroll(gridOptions?: GridOption): boolean {
    return !!(gridOptions || this.options).backendServiceApi?.service.options?.infiniteScroll;
  }

  protected mergeGridOptions(gridOptions: GridOption): GridOption {
    // use extend to deep merge & copy to avoid immutable properties being changed in GlobalGridOptions after a route change
    const options = extend(true, {}, GlobalGridOptions, gridOptions) as GridOption;

    options.gridId = this.props.gridId;
    options.gridContainerId = `slickGridContainer-${this.props.gridId}`;

    // also make sure to show the header row if user have enabled filtering
    if (options.enableFiltering && !options.showHeaderRow) {
      options.showHeaderRow = options.enableFiltering;
    }

    // using copy extend to do a deep clone has an unwanted side on objects and pageSizes but ES6 spread has other worst side effects
    // so we will just overwrite the pageSizes when needed, this is the only one causing issues so far.
    // On a deep extend, Object and Array are extended, but object wrappers on primitive types such as String, Boolean, and Number are not.
    if (
      options?.pagination &&
      (gridOptions.enablePagination || gridOptions.backendServiceApi) &&
      gridOptions.pagination &&
      Array.isArray(gridOptions.pagination.pageSizes)
    ) {
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

  /** Add a register a new external resource, user could also optional dispose all previous resources before pushing any new resources to the resources array list. */
  registerExternalResources(resources: ExternalResource[], disposePreviousResources = false) {
    if (disposePreviousResources) {
      this.disposeExternalResources();
    }
    resources.forEach((res) => this._registeredResources.push(res));
    this.initializeExternalResources(resources);
  }

  resetExternalResources() {
    this._registeredResources = [];
  }

  /** Pre-Register any Resource that don't require SlickGrid to be instantiated (for example RxJS Resource & RowDetail) */
  protected preRegisterResources() {
    this._registeredResources = this.options.externalResources || [];

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
        if (this.grid && typeof resource.init === 'function') {
          resource.init(this.grid, this.props.containerService);
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
    if (
      (this.options.createPreHeaderPanel && this.options.createTopHeaderPanel) ||
      (this.options.createPreHeaderPanel && !this.options.enableDraggableGrouping)
    ) {
      this._registeredResources.push(this.headerGroupingService);
    }

    // when using Tree Data View, register its Service
    if (this.options.enableTreeData) {
      this._registeredResources.push(this.treeDataService);
    }

    // when user enables translation, we need to translate Headers on first pass & subsequently in the bindDifferentHooks
    if (this.options.enableTranslate) {
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
    this.props.containerService.registerInstance('RxJsResource', this.rxjs);
  }

  /**
   * Takes a flat dataset with parent/child relationship, sort it (via its tree structure) and return the sorted flat array
   * @param {Array<Object>} flatDatasetInput - flat dataset input
   * @param {Boolean} forceGridRefresh - optionally force a full grid refresh
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
    } else if (this._options && Array.isArray(flatDatasetInput) && flatDatasetInput.length > 0) {
      // we need to first convert the flat dataset to a hierarchical dataset and then sort it
      // we'll also add props, by mutation, required by the TreeDataService on the flat array like `__hasChildren`, `parentId` and anything else to work properly
      sortedDatasetResult = this.treeDataService.convertFlatParentChildToTreeDatasetAndSort(flatDatasetInput, this._columns, this._options);
      this.sharedService.hierarchicalDataset = sortedDatasetResult.hierarchical;
      flatDatasetOutput = sortedDatasetResult.flat;
    }

    // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
    if (flatDatasetInput.length > 0 && (forceGridRefresh || flatDatasetInput.length !== prevDatasetLn)) {
      this.filterService.refreshTreeDataFilters(flatDatasetOutput);
    }

    return flatDatasetOutput;
  }

  /** Prepare and load all SlickGrid editors, if an async editor is found then we'll also execute it. */
  protected loadSlickGridEditors(columns: Column<TData>[]): Column<TData>[] {
    if (columns.some((col) => `${col?.id}`.includes('.'))) {
      console.warn(
        '[Slickgrid-React] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".'
      );
    }

    return columns.map((column: Column | any) => {
      if (column) {
        // on every Editor which have a "collection" or a "collectionAsync"
        if (column.editor?.collectionAsync) {
          this.loadEditorCollectionAsync(column);
        }
        return { ...column, editorClass: column.editor?.model };
      }
    });
  }

  protected suggestDateParsingWhenHelpful() {
    if (
      this.dataView?.getItemCount() > WARN_NO_PREPARSE_DATE_SIZE &&
      !this.options.silenceWarnings &&
      !this.options.preParseDateColumns &&
      this.grid.getColumns().some((c) => isColumnDateType(c.type))
    ) {
      console.warn(
        '[Slickgrid-React] For getting better perf, we suggest you enable the `preParseDateColumns` grid option, ' +
          'for more info visit => https://ghiscoding.gitbook.io/slickgrid-react/column-functionalities/sorting#pre-parse-date-columns-for-better-perf'
      );
    }
  }

  /**
   * When the Editor(s) has a "editor.collection" property, we'll load the async collection.
   * Since this is called after the async call resolves, the pointer will not be the same as the "column" argument passed.
   */
  protected updateEditorCollection<U extends TData = any>(column: Column<U>, newCollection: U[]) {
    if (this.grid && column.editor) {
      column.editor.collection = newCollection;
      column.editor.disabled = false;

      // get current Editor, remove it from the DOM then re-enable it and re-render it with the new collection.
      const currentEditor = this.grid.getCellEditor() as AutocompleterEditor | SelectEditor;
      if (currentEditor?.disable && currentEditor?.renderDomElement) {
        currentEditor.destroy();
        currentEditor.disable(false);
        currentEditor.renderDomElement(newCollection);
      }
    }
  }

  render() {
    return (
      <div
        id={`slickGridContainer-${this.props.gridId}`}
        className="grid-pane"
        ref={(elm) => {
          this._elm = elm as HTMLDivElement;
        }}
      >
        {/* <!-- Header slot if you need to create a complex custom header --> */}
        {this.props.header && <div className="header">{this.props.header}</div>}

        <div id={`${this.props.gridId}`} className="slickgrid-container"></div>

        {/* <!--Footer slot if you need to create a complex custom footer-- > */}
        {this.props.footer && <div className="footer">{this.props.footer}</div>}
      </div>
    );
  }
}
