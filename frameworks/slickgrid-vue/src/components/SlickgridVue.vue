<script setup lang="ts">
import {
  autoAddEditorFormatterToColumnsWithEditor,
  type AutocompleterEditor,
  type BackendServiceApi,
  type BackendServiceOption,
  BackendUtilityService,
  type BasePaginationComponent,
  type BasePaginationModel,
  collectionObserver,
  CollectionService,
  type Column,
  type DataViewOption,
  emptyElement,
  EventNamingStyle,
  type EventSubscription,
  type ExtensionList,
  ExtensionName,
  ExtensionService,
  ExtensionUtility,
  type ExternalResource,
  FilterFactory,
  FilterService,
  GridEventService,
  GridService,
  GridStateService,
  GridStateType,
  HeaderGroupingService,
  isColumnDateType,
  type Metrics,
  type Observable,
  type Pagination,
  type PaginationMetadata,
  PaginationService,
  ResizerService,
  type RxJsFacade,
  type SelectEditor,
  SharedService,
  SlickDataView,
  SlickEventHandler,
  SlickGrid,
  SlickgridConfig,
  SlickGroupItemMetadataProvider,
  SortService,
  TreeDataService,
} from '@slickgrid-universal/common';
import { SlickFooterComponent } from '@slickgrid-universal/custom-footer-component';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickPaginationComponent } from '@slickgrid-universal/pagination-component';
import { extend } from '@slickgrid-universal/utils';
import { dequal } from 'dequal/lite';
import { type i18n } from 'i18next';
import {
  type ComponentPublicInstance,
  computed,
  createApp,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  watch,
} from 'vue';

import { SlickRowDetailView } from '../extensions/slickRowDetailView.js';
import { GlobalGridOptions } from '../global-grid-options.js';
import type { GridOption, SlickgridVueInstance } from '../models/index.js';
import { ContainerService, disposeAllSubscriptions } from '../services/index.js';
import { TranslaterI18NextService } from '../services/translaterI18Next.service.js';
import type { SlickgridVueProps } from './slickgridVueProps.interface.js';

const WARN_NO_PREPARSE_DATE_SIZE = 10000; // data size to warn user when pre-parsing isn't enabled

const attrs = useAttrs();

// props
const props = withDefaults(defineProps<SlickgridVueProps>(), {
  gridId: 'myGrid',
});

// refs
const elm = ref<HTMLDivElement>();
const svExtensions = ref<ExtensionList<any>>();
const svInstances = ref<SlickgridVueInstance | null>(null);
const _gridOptions = ref<GridOption>({});
const totalItems = ref(0);

// computed values
const gridContainerId = computed(() => `slickGridContainer-${props.gridId}`);
const backendService = computed(() => gridOptionsModel.value?.backendServiceApi?.service);

let currentDatasetLength = 0;
let dataview: SlickDataView<any> | null = null;
let grid: SlickGrid;
let collectionObservers: Array<null | { disconnect: () => void }> = [];
let groupItemMetadataProvider: SlickGroupItemMetadataProvider | undefined;
let hideHeaderRowAfterPageLoad = false;
let i18next: i18n | null;
let isAutosizeColsCalled = false;
let isGridInitialized = false;
let isDatasetInitialized = false;
let isDatasetHierarchicalInitialized = false;
let isPaginationInitialized = false;
let isLocalGrid = true;
let metrics: Metrics | undefined;
let registeredResources: ExternalResource[] = [];
let scrollEndCalled = false;
let showPagination = false;
let subscriptions: Array<EventSubscription> = [];

// components / plugins
let slickEmptyWarning: SlickEmptyWarningComponent | undefined;
let slickFooter: SlickFooterComponent | undefined;
let slickPagination: BasePaginationComponent | undefined;
let slickRowDetailView: SlickRowDetailView | undefined;

// initialize and assign all Service Dependencies
let backendServiceApi: BackendServiceApi | undefined;
let rxjs: RxJsFacade | undefined;
const slickgridConfig = new SlickgridConfig();
const eventHandler = new SlickEventHandler();
const eventPubSubService = new EventPubSubService();
eventPubSubService.eventNamingStyle = EventNamingStyle.camelCaseWithExtraOnPrefix;

const containerService = new ContainerService();
const translaterService = new TranslaterI18NextService();
const backendUtilityService = new BackendUtilityService();
const gridEventService = new GridEventService();
const sharedService = new SharedService();
const collectionService = new CollectionService(translaterService);
const extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translaterService);
const filterFactory = new FilterFactory(slickgridConfig, translaterService, collectionService);
const filterService = new FilterService(filterFactory as any, eventPubSubService, sharedService, backendUtilityService);
const resizerService = new ResizerService(eventPubSubService);
const sortService = new SortService(collectionService, sharedService, eventPubSubService, backendUtilityService);
const treeDataService = new TreeDataService(eventPubSubService, sharedService, sortService);
const paginationService = new PaginationService(eventPubSubService, sharedService, backendUtilityService);
const extensionService: ExtensionService = new ExtensionService(
  extensionUtility,
  filterService,
  eventPubSubService,
  sharedService,
  sortService,
  treeDataService,
  translaterService,
  () => gridService
);
const gridStateService = new GridStateService(
  extensionService,
  filterService,
  eventPubSubService,
  sharedService,
  sortService,
  treeDataService
);
const gridService = new GridService(
  gridStateService,
  filterService,
  eventPubSubService,
  paginationService,
  sharedService,
  sortService,
  treeDataService
);
const headerGroupingService = new HeaderGroupingService(extensionUtility);

let serviceList = [
  extensionService,
  filterService,
  gridEventService,
  gridService,
  gridStateService,
  headerGroupingService,
  paginationService,
  resizerService,
  sortService,
  treeDataService,
];

// register all Service instances in the container
containerService.registerInstance('PubSubService', eventPubSubService);
containerService.registerInstance('EventPubSubService', eventPubSubService);
containerService.registerInstance('ExtensionUtility', extensionUtility);
containerService.registerInstance('FilterService', filterService);
containerService.registerInstance('CollectionService', collectionService);
containerService.registerInstance('ExtensionService', extensionService);
containerService.registerInstance('GridEventService', gridEventService);
containerService.registerInstance('GridService', gridService);
containerService.registerInstance('GridStateService', gridStateService);
containerService.registerInstance('HeaderGroupingService', headerGroupingService);
containerService.registerInstance('PaginationService', paginationService);
containerService.registerInstance('ResizerService', resizerService);
containerService.registerInstance('SharedService', sharedService);
containerService.registerInstance('SortService', sortService);
containerService.registerInstance('TranslaterService', translaterService);
containerService.registerInstance('TreeDataService', treeDataService);

const gridOptionsModel = defineModel<GridOption>('options', { required: true });
_gridOptions.value = { ...GlobalGridOptions, ...gridOptionsModel.value };

const _paginationOptions = ref<Pagination | undefined>();
const paginationModel = defineModel<Pagination>('pagination');
watch(paginationModel, (newPaginationOptions) => paginationOptionsChanged(newPaginationOptions!));

const _columnDefinitions = ref<Column[]>();
const columnDefinitionsModel = defineModel<Column[]>('columns', { required: true, default: [] });
watch(columnDefinitionsModel, (columnDefinitions) => columnDefinitionsChanged(columnDefinitions), { immediate: true });

const dataModel = defineModel<any[]>('data', { required: false }); // technically true but user could use datasetHierarchical instead
watch(
  dataModel,
  (newDataset: any[]) => {
    const prevDatasetLn = currentDatasetLength;
    const isDatasetEqual = dequal(newDataset, dataModel.value || []);
    const isDeepCopyDataOnPageLoadEnabled = !!_gridOptions.value?.enableDeepCopyDatasetOnPageLoad;
    let data = isDeepCopyDataOnPageLoadEnabled ? extend(true, [], newDataset) : newDataset;

    // when Tree Data is enabled and we don't yet have the hierarchical dataset filled, we can force a convert+sort of the array
    if (
      grid &&
      _gridOptions.value?.enableTreeData &&
      Array.isArray(newDataset) &&
      (newDataset.length > 0 || newDataset.length !== prevDatasetLn || !isDatasetEqual)
    ) {
      isDatasetHierarchicalInitialized = false;
      data = sortTreeDataset(newDataset, !isDatasetEqual); // if dataset changed, then force a refresh anyway
    }

    refreshGridData(data || []);
    currentDatasetLength = (newDataset || []).length;

    // expand/autofit columns on first page load
    // we can assume that if the prevDataset was empty then we are on first load
    if (grid && _gridOptions.value?.autoFitColumnsOnFirstLoad && prevDatasetLn === 0 && !isAutosizeColsCalled) {
      grid.autosizeColumns();
      isAutosizeColsCalled = true;
    }
  },
  { immediate: true }
);

const dataHierarchicalModel = defineModel<any[]>('hierarchical', { required: false }); // technically true but user could use datasetHierarchical instead
watch(
  dataHierarchicalModel,
  (newHierarchicalDataset: any[] | undefined) => {
    const isDatasetEqual = dequal(newHierarchicalDataset, sharedService?.hierarchicalDataset ?? []);
    const prevFlatDatasetLn = currentDatasetLength;
    if (sharedService) {
      sharedService.hierarchicalDataset = newHierarchicalDataset;
    }

    if (newHierarchicalDataset && _columnDefinitions.value && filterService?.clearFilters) {
      filterService.clearFilters();
    }

    // when a hierarchical dataset is set afterward, we can reset the flat dataset and call a tree data sort that will overwrite the flat dataset
    if (dataview && newHierarchicalDataset && grid && sortService?.processTreeDataInitialSort) {
      dataview.setItems([], _gridOptions.value?.datasetIdPropertyName ?? 'id');
      sortService.processTreeDataInitialSort();

      // we also need to reset/refresh the Tree Data filters because if we inserted new item(s) then it might not show up without doing this refresh
      // however we need to queue our process until the flat dataset is ready, so we can queue a microtask to execute the DataView refresh only after everything is ready
      queueMicrotask(() => {
        const flatDatasetLn = dataview?.getItemCount() || 0;
        if (flatDatasetLn > 0 && (flatDatasetLn !== prevFlatDatasetLn || !isDatasetEqual)) {
          filterService.refreshTreeDataFilters();
        }
      });
      isDatasetHierarchicalInitialized = true;
    }
  },
  { immediate: true }
);

// check if the user wants to hide the header row from the start
// we only want to do this check once in the constructor
hideHeaderRowAfterPageLoad = _gridOptions.value?.showHeaderRow === false;

onBeforeUnmount(() => {
  disposing();
});

onMounted(() => {
  if (!_gridOptions.value || !columnDefinitionsModel.value) {
    throw new Error(
      'Using `<Slickgrid-Vue>` requires `v-model:options` and `v-model:columns` props, it seems that you might have forgot to provide them since at least of them is undefined.'
    );
  }

  if (elm.value && eventPubSubService instanceof EventPubSubService) {
    eventPubSubService.elementSource = elm.value;

    // Vue doesn't play well with subscribing to native Custom Events & also the render is called after the constructor which brings a second problem
    // to fix both issues, we need to do the following:
    // 1. loop through all component props and subscribe to the ones that startsWith "on", we'll assume that it's the custom events
    // 2. then call the assigned listener(s) when events are dispatched
    for (const attr in { ...attrs, ...props }) {
      if (attr.startsWith('onOn')) {
        const eventCallback = attrs[attr as keyof SlickgridVueProps] || props[attr as keyof SlickgridVueProps];
        if (typeof eventCallback === 'function') {
          const singlePrefixEventName = attr.replace(/^onOn/, 'on');
          subscriptions.push(
            eventPubSubService.subscribe(singlePrefixEventName, (data: unknown) => {
              const gridEventName = eventPubSubService.getEventNameByNamingConvention(singlePrefixEventName, '');
              typeof eventCallback === 'function' && eventCallback.call(null, new CustomEvent(gridEventName, { detail: data }));
            })
          );
        }
      }
    }
  }

  initialization();
  isGridInitialized = true;

  // if we have a backendServiceApi and the enablePagination is undefined, we'll assume that we do want to see it, else get that defined value
  if (!hasBackendInfiniteScroll()) {
    _gridOptions.value.enablePagination = !!(_gridOptions.value.backendServiceApi &&
    _gridOptions.value.enablePagination === undefined
      ? true
      : _gridOptions.value.enablePagination);
  }

  if (!isPaginationInitialized && !dataHierarchicalModel.value && _gridOptions.value?.enablePagination && isLocalGrid) {
    showPagination = true;
    loadLocalGridPagination(dataModel.value);
  }

  // recheck the empty warning message after grid is shown so that it works in every use case
  if (_gridOptions.value?.enableEmptyDataWarningMessage) {
    const data = dataModel.value || [];
    if (Array.isArray(data)) {
      const finalTotalCount = data.length;
      displayEmptyDataWarning(finalTotalCount < 1);
    }
  }
  // add dark mode CSS class when enabled
  if (_gridOptions.value.darkMode) {
    setDarkMode(true);
  }

  // keep ref of hierarchical dataset when initialized
  if (dataHierarchicalModel.value) {
    sharedService.hierarchicalDataset = dataHierarchicalModel.value || [];
  }

  suggestDateParsingWhenHelpful();

  // subscribe to column definitions assignment changes
  observeColumnDefinitions();
});

function columnDefinitionsChanged(columnDefinitions?: Column[]) {
  if (columnDefinitions) {
    _columnDefinitions.value = columnDefinitions;
  }
  if (isGridInitialized) {
    updateColumnDefinitionsList(_columnDefinitions.value!);
  }
  if (_columnDefinitions.value!.length > 0) {
    copyColumnWidthsReference(_columnDefinitions.value!);
  }
}

function initialization() {
  if (!_gridOptions.value || !columnDefinitionsModel.value) {
    throw new Error(
      'Using `<Slickgrid-Vue>` requires `v-model:columns="columnDefinitions"` and `v-model:options="gridOptions.value"`, it seems that you might have forgot to provide them since at least of them is undefined.'
    );
  }

  _gridOptions.value.translater = translaterService;
  isAutosizeColsCalled = false;

  // when detecting a frozen grid, we'll automatically enable the mousewheel scroll handler so that we can scroll from both left/right frozen containers
  if (
    _gridOptions.value &&
    ((_gridOptions.value.frozenRow !== undefined && _gridOptions.value.frozenRow >= 0) ||
      (_gridOptions.value.frozenColumn !== undefined && _gridOptions.value.frozenColumn >= 0)) &&
    _gridOptions.value.enableMouseWheelScrollHandler === undefined
  ) {
    _gridOptions.value.enableMouseWheelScrollHandler = true;
  }

  eventPubSubService.eventNamingStyle = _gridOptions.value?.eventNamingStyle ?? EventNamingStyle.camelCaseWithExtraOnPrefix;
  eventPubSubService.publish('onBeforeGridCreate', true);

  // make sure the dataset is initialized (if not it will throw an error that it cannot getLength of null)
  // dataset.value = dataset.value || dataModel.value || [];
  currentDatasetLength = dataModel.value?.length || 0;
  _gridOptions.value = mergeGridOptions(_gridOptions.value as GridOption);
  _paginationOptions.value = _gridOptions.value?.pagination;
  backendServiceApi = _gridOptions.value?.backendServiceApi;
  isLocalGrid = !backendServiceApi; // considered a local grid if it doesn't have a backend service set

  // inject the I18Next instance when translation is enabled
  if (_gridOptions.value?.enableTranslate || _gridOptions.value?.i18n) {
    i18next = inject<i18n | null>('i18next', null);
    if (i18next) {
      translaterService.i18nInstance = i18next;
    } else {
      throw new Error(
        "[Slickgrid-Vue] Enabling translation requires you to provide I18Next in your App, for example: `provide('i18next', useTranslation().i18next)`."
      );
    }
  }

  // unless specified, we'll create an internal postProcess callback (currently only available for GraphQL)
  if (_gridOptions.value?.backendServiceApi && !_gridOptions.value.backendServiceApi?.disableInternalPostProcess) {
    createBackendApiInternalPostProcessCallback(_gridOptions.value as GridOption);
  }

  const dataviewInlineFilters = (_gridOptions.value?.dataView && _gridOptions.value.dataView.inlineFilters) || false;
  let dataViewOptions: Partial<DataViewOption> = { inlineFilters: dataviewInlineFilters };

  if (_gridOptions.value?.draggableGrouping || _gridOptions.value?.enableGrouping) {
    groupItemMetadataProvider = new SlickGroupItemMetadataProvider();
    sharedService.groupItemMetadataProvider = groupItemMetadataProvider;
    dataViewOptions = { ...dataViewOptions, groupItemMetadataProvider: groupItemMetadataProvider };
  }
  dataview = new SlickDataView<any>(dataViewOptions, eventPubSubService);
  eventPubSubService.publish('onDataviewCreated', dataview);

  // get any possible Services that user want to register which don't require SlickGrid to be instantiated
  // RxJS Resource is in this lot because it has to be registered before anything else and doesn't require SlickGrid to be initialized
  preRegisterResources();

  // prepare and load all SlickGrid editors, if an async editor is found then we'll also execute it.
  // Wrap each editor class in the Factory resolver so consumers of this library.
  // Vue will allow slickgrid to pass its arguments to the editors constructor last
  // when slickgrid creates the editor
  _columnDefinitions.value = loadSlickGridEditors(columnDefinitionsModel.value || []);

  // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
  if (_gridOptions.value?.autoAddCustomEditorFormatter) {
    autoAddEditorFormatterToColumnsWithEditor(_columnDefinitions.value, _gridOptions.value?.autoAddCustomEditorFormatter);
  }

  // save reference for all columns before they optionally become hidden/visible
  sharedService.allColumns = _columnDefinitions.value;
  sharedService.visibleColumns = _columnDefinitions.value;

  // TODO: revisit later, this conflicts with Grid State (Example 15)
  // before certain extentions/plugins potentially adds extra columns not created by the user itself (RowMove, RowDetail, RowSelections)
  // we'll subscribe to the event and push back the change to the user so they always use full column defs array including extra cols
  // subscriptions.push(
  //   _eventPubSubService.subscribe<{ columns: Column<any>[]; grid: SlickGrid }>('onPluginColumnsChanged', data => {
  //     columnDefinitions = data.columns;
  //     columnDefinitionsChanged();
  //   })
  // );

  // after subscribing to potential columns changed, we are ready to create these optional extensions
  // when we did find some to create (RowMove, RowDetail, RowSelections), it will automatically modify column definitions (by previous subscribe)
  extensionService.createExtensionsBeforeGridCreation(_columnDefinitions.value, _gridOptions.value as GridOption);

  // if user entered some Pinning/Frozen "presets", we need to apply them in the grid options
  if (_gridOptions.value?.presets?.pinning) {
    _gridOptions.value = { ..._gridOptions.value, ..._gridOptions.value.presets.pinning };
  }

  // build SlickGrid Grid, also user might optionally pass a custom dataview (e.g. remote model)
  grid = new SlickGrid<any, Column<any>, GridOption<Column<any>>>(
    `#${props.gridId}`,
    dataview,
    _columnDefinitions.value,
    _gridOptions.value as GridOption,
    eventPubSubService
  );
  sharedService.dataView = dataview;
  sharedService.slickGrid = grid;
  sharedService.gridContainerElement = elm.value as HTMLDivElement;
  if (groupItemMetadataProvider) {
    grid.registerPlugin(groupItemMetadataProvider); // register GroupItemMetadataProvider when Grouping is enabled
  }

  extensionService.bindDifferentExtensions();
  bindDifferentHooks(grid, _gridOptions.value as GridOption, dataview);

  // when it's a frozen grid, we need to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward
  const frozenColumnIndex = _gridOptions.value?.frozenColumn ?? -1;
  if (frozenColumnIndex >= 0 && frozenColumnIndex <= _columnDefinitions.value.length && _columnDefinitions.value.length > 0) {
    sharedService.frozenVisibleColumnId = _columnDefinitions.value[frozenColumnIndex]?.id ?? '';
  }

  // get any possible Services that user want to register
  registerResources();

  // initialize the SlickGrid grid
  grid.init();

  // initialized the resizer service only after SlickGrid is initialized
  // if we don't we end up binding our resize to a grid element that doesn't yet exist in the DOM and the resizer service will fail silently (because it has a try/catch that unbinds the resize without throwing back)
  const gridContainerElm = elm.value;
  if (gridContainerElm) {
    resizerService.init(grid, gridContainerElm);
  }

  // user could show a custom footer with the data metrics (dataset length and last updated timestamp)
  if (
    !_gridOptions.value?.enablePagination &&
    _gridOptions.value?.showCustomFooter &&
    _gridOptions.value?.customFooterOptions &&
    gridContainerElm
  ) {
    slickFooter = new SlickFooterComponent(grid, _gridOptions.value?.customFooterOptions, eventPubSubService, translaterService);
    slickFooter.renderFooter(gridContainerElm as HTMLDivElement);
  }

  if (dataview) {
    // load the data in the DataView (unless it's a hierarchical dataset, if so it will be loaded after the initial tree sort)
    const initialDataset = _gridOptions.value?.enableTreeData ? sortTreeDataset(dataModel.value || []) : dataModel.value;
    if (Array.isArray(initialDataset)) {
      dataview.setItems(initialDataset, _gridOptions.value.datasetIdPropertyName ?? 'id');
    }

    // if you don't want the items that are not visible (due to being filtered out or being on a different page)
    // to stay selected, pass 'false' to the second arg
    if (grid?.getSelectionModel() && _gridOptions.value?.dataView && 'syncGridSelection' in _gridOptions.value.dataView) {
      // if we are using a Backend Service, we will do an extra flag check, the reason is because it might have some unintended behaviors
      // with the BackendServiceApi because technically the data in the page changes the DataView on every page change.
      let preservedRowSelectionWithBackend = false;
      if (_gridOptions.value.backendServiceApi && 'syncGridSelectionWithBackendService' in _gridOptions.value.dataView) {
        preservedRowSelectionWithBackend = _gridOptions.value.dataView.syncGridSelectionWithBackendService as boolean;
      }

      const syncGridSelection = _gridOptions.value.dataView.syncGridSelection;
      if (typeof syncGridSelection === 'boolean') {
        let preservedRowSelection = syncGridSelection;
        if (!isLocalGrid) {
          // when using BackendServiceApi, we'll be using the "syncGridSelectionWithBackendService" flag BUT "syncGridSelection" must also be set to True
          preservedRowSelection = syncGridSelection && preservedRowSelectionWithBackend;
        }
        dataview.syncGridSelection(grid, preservedRowSelection);
      } else if (typeof syncGridSelection === 'object') {
        dataview.syncGridSelection(grid, syncGridSelection.preserveHidden, syncGridSelection.preserveHiddenOnSelectionChange);
      }
    }

    if (dataModel.value?.length || 0 > 0) {
      if (!isDatasetInitialized && (_gridOptions.value.enableCheckboxSelector || _gridOptions.value.enableRowSelection)) {
        loadRowSelectionPresetWhenExists();
      }
      loadFilterPresetsWhenDatasetInitialized();
      isDatasetInitialized = true;
    }
  }

  // user might want to hide the header row on page load but still have `enableFiltering: true`
  // if that is the case, we need to hide the headerRow ONLY AFTER all filters got created & dataView exist
  if (hideHeaderRowAfterPageLoad) {
    showHeaderRow(false);
    sharedService.hideHeaderRowAfterPageLoad = hideHeaderRowAfterPageLoad;
  }

  // publish & dispatch certain events
  eventPubSubService.publish('onGridCreated', grid);

  // after the DataView is created & updated execute some processes & dispatch some events
  executeAfterDataviewCreated(grid, _gridOptions.value as GridOption);

  // bind resize ONLY after the dataView is ready
  bindResizeHook(grid, _gridOptions.value as GridOption);

  // bind the Backend Service API callback functions only after the grid is initialized
  // because the preProcess() and onInit() might get triggered
  if (_gridOptions.value?.backendServiceApi) {
    bindBackendCallbackFunctions(_gridOptions.value as GridOption);
  }

  // create the Vue Grid Instance with reference to all Services
  const vueElementInstance: SlickgridVueInstance = {
    element: elm.value as HTMLDivElement,

    // Slick Grid & DataView objects
    dataView: dataview,
    slickGrid: grid,

    // public methods
    dispose: disposeInstance,

    // return all available Services (non-singleton)
    backendService: backendService.value,
    eventPubSubService: eventPubSubService,
    filterService: filterService,
    gridEventService: gridEventService,
    gridStateService: gridStateService,
    gridService: gridService,
    groupingService: headerGroupingService,
    headerGroupingService: headerGroupingService,
    extensionService: extensionService,
    paginationComponent: slickPagination,
    paginationService: paginationService,
    resizerService: resizerService,
    sortService: sortService,
    treeDataService: treeDataService,
  };

  // addons (SlickGrid extra plugins/controls)
  svExtensions.value = extensionService?.extensionList;

  // all instances (SlickGrid, DataView & all Services)
  svInstances.value = vueElementInstance;
  eventPubSubService.publish('onVueGridCreated', vueElementInstance);
}

function disposing(shouldEmptyDomElementContainer = false) {
  eventPubSubService.publish('onBeforeGridDestroy', grid);
  eventHandler?.unsubscribeAll();
  if (typeof i18next?.off === 'function') {
    i18next?.off('languageChanged');
  }

  // we could optionally also empty the content of the grid container DOM element
  if (shouldEmptyDomElementContainer) {
    emptyGridContainerElm();
  }
  collectionObservers.forEach((obs) => obs?.disconnect());
  eventPubSubService.publish('onAfterGridDestroyed', true);

  // dispose of all Services
  serviceList.forEach((service: any) => {
    if (service?.dispose) {
      service.dispose();
    }
  });
  serviceList = [];

  // dispose backend service when defined and a dispose method exists
  backendService.value?.dispose?.();

  // dispose all registered external resources
  disposeExternalResources();

  // dispose the Components
  slickEmptyWarning?.dispose();
  slickFooter?.dispose();
  slickPagination?.dispose();

  if (dataview) {
    if (dataview.setItems) {
      dataview.setItems([]);
    }
    if (dataview.destroy) {
      dataview.destroy();
    }
  }
  if (grid?.destroy) {
    grid.destroy(shouldEmptyDomElementContainer);
  }

  // also dispose of all Subscriptions
  subscriptions = disposeAllSubscriptions(subscriptions);

  if (backendServiceApi) {
    for (const prop of Object.keys(backendServiceApi)) {
      (backendServiceApi as any)[prop] = null;
    }
    backendServiceApi = undefined;
  }
  for (const prop of Object.keys(columnDefinitionsModel.value)) {
    (columnDefinitionsModel.value as any)[prop] = null;
  }
  for (const prop of Object.keys(sharedService)) {
    (sharedService as any)[prop] = null;
  }
}

/** Do not rename to `dispose` as it's an Vue hook */
function disposeInstance(shouldEmptyDomElementContainer = false) {
  disposing(shouldEmptyDomElementContainer);
}

function disposeExternalResources() {
  if (Array.isArray(registeredResources)) {
    while (registeredResources.length > 0) {
      const res = registeredResources.pop();
      if (res?.dispose) {
        res.dispose();
      }
    }
  }
  registeredResources = [];
}

function emptyGridContainerElm() {
  const gridContainerId = _gridOptions.value?.gridContainerId ?? 'grid1';
  const gridContainerElm = document.querySelector(`#${gridContainerId}`) as HTMLDivElement;
  emptyElement(gridContainerElm);
}

/**
 * Define our internal Post Process callback, it will execute internally after we get back result from the Process backend call
 * Currently ONLY available with the GraphQL Backend Service.
 * The behavior is to refresh the Dataset & Pagination without requiring the user to create his own PostProcess every time
 */
function createBackendApiInternalPostProcessCallback(gridOptions: GridOption) {
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
          const data =
            'nodes' in processResult.data[datasetName]
              ? (processResult as any).data[datasetName].nodes
              : (processResult as any).data[datasetName];
          const totalCount =
            'totalCount' in processResult.data[datasetName]
              ? (processResult as any).data[datasetName].totalCount
              : (processResult as any).data[datasetName].length;
          refreshGridData(data, totalCount || 0);
        }
      };
    }
  }
}

function bindDifferentHooks(grid: SlickGrid, gridOptions: GridOption, dataView: SlickDataView<any>) {
  // translate some of them on first load, then on each language change
  if (gridOptions.enableTranslate) {
    extensionService.translateAllExtensions();
  }

  // on locale change, we have to manually translate the Headers, GridMenu
  if (typeof i18next?.on === 'function') {
    i18next?.on('languageChanged', (lang: string) => {
      // publish event of the same name that Slickgrid-Universal uses on a language change event
      eventPubSubService.publish('onLanguageChange');

      if (gridOptions.enableTranslate) {
        extensionService.translateAllExtensions(lang);
        if (
          (gridOptions.createPreHeaderPanel && gridOptions.createTopHeaderPanel) ||
          (gridOptions.createPreHeaderPanel && !gridOptions.enableDraggableGrouping)
        ) {
          headerGroupingService.translateHeaderGrouping();
        }
      }
    });
  }

  // if user set an onInit Backend, we'll run it right away (and if so, we also need to run preProcess, internalPostProcess & postProcess)
  if (gridOptions.backendServiceApi) {
    const backendApi = gridOptions.backendServiceApi;

    if (backendApi?.service?.init) {
      backendApi.service.init(backendApi.options, gridOptions.pagination, grid, sharedService);
    }
  }

  if (dataView && grid) {
    // on cell click, mainly used with the columnDef.action callback
    gridEventService.bindOnBeforeEditCell(grid);
    gridEventService.bindOnCellChange(grid);
    gridEventService.bindOnClick(grid);

    if (dataView && grid) {
      // bind external sorting (backend) when available or default onSort (dataView)
      if (gridOptions.enableSorting) {
        // bind external sorting (backend) unless specified to use the local one
        if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalSorting) {
          sortService.bindBackendOnSort(grid);
        } else {
          sortService.bindLocalOnSort(grid);
        }
      }

      // bind external filter (backend) when available or default onFilter (dataView)
      if (gridOptions.enableFiltering) {
        filterService.init(grid);

        // bind external filter (backend) unless specified to use the local one
        if (gridOptions.backendServiceApi && !gridOptions.backendServiceApi.useLocalFiltering) {
          filterService.bindBackendOnFilter(grid);
        } else {
          filterService.bindLocalOnFilter(grid);
        }
      }

      // when column are reordered, we need to update the visibleColumn array
      eventHandler.subscribe(grid.onColumnsReordered, (_e, args) => {
        sharedService.hasColumnsReordered = true;
        sharedService.visibleColumns = args.impactedColumns;
      });

      eventHandler.subscribe(grid.onSetOptions, (_e, args) => {
        // add/remove dark mode CSS class when enabled
        if (args.optionsBefore.darkMode !== args.optionsAfter.darkMode && sharedService.gridContainerElement) {
          setDarkMode(args.optionsAfter.darkMode);
        }
      });

      // load any presets if any (after dataset is initialized)
      loadColumnPresetsWhenDatasetInitialized();
      loadFilterPresetsWhenDatasetInitialized();

      // When data changes in the DataView, we need to refresh the metrics and/or display a warning if the dataset is empty
      eventHandler.subscribe(dataView.onRowCountChanged, () => {
        grid.invalidate();
        handleOnItemCountChanged(dataView.getFilteredItemCount() || 0, dataView.getItemCount() || 0);
      });
      eventHandler.subscribe(dataView.onSetItemsCalled, (_e, args) => {
        sharedService.isItemsDateParsed = false;
        handleOnItemCountChanged(dataView.getFilteredItemCount() || 0, args.itemCount);

        // when user has resize by content enabled, we'll force a full width calculation since we change our entire dataset
        if (
          args.itemCount > 0 &&
          (gridOptions.autosizeColumnsByCellContentOnFirstLoad || gridOptions.enableAutoResizeColumnsByCellContent)
        ) {
          resizerService.resizeColumnsByCellContent(!gridOptions?.resizeByContentOnlyOnFirstLoad);
        }
      });

      if (gridOptions?.enableFiltering && !gridOptions.enableRowDetailView) {
        eventHandler.subscribe(dataView.onRowsChanged, (_e, { calledOnRowCountChanged, rows }) => {
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

function bindBackendCallbackFunctions(gridOptions: GridOption) {
  const backendApi = gridOptions.backendServiceApi;
  const backendApiService = backendApi?.service;
  const serviceOptions: BackendServiceOption = backendApiService?.options || {};
  const isExecuteCommandOnInit = !serviceOptions
    ? false
    : serviceOptions && 'executeProcessCommandOnInit' in serviceOptions
      ? serviceOptions['executeProcessCommandOnInit']
      : true;

  if (backendApiService) {
    // update backend filters (if need be) BEFORE the query runs (via the onInit command a few lines below)
    // if user entered some any "presets", we need to reflect them all in the grid
    if (gridOptions?.presets) {
      // Filters "presets"
      if (
        backendApiService.updateFilters &&
        Array.isArray(gridOptions.presets.filters) &&
        gridOptions.presets.filters.length > 0
      ) {
        backendApiService.updateFilters(gridOptions.presets.filters, true);
      }
      // Sorters "presets"
      if (
        backendApiService.updateSorters &&
        Array.isArray(gridOptions.presets.sorters) &&
        gridOptions.presets.sorters.length > 0
      ) {
        // when using multi-column sort, we can have multiple but on single sort then only grab the first sort provided
        const sortColumns = _gridOptions.value?.multiColumnSort
          ? gridOptions.presets.sorters
          : gridOptions.presets.sorters.slice(0, 1);
        backendApiService.updateSorters(undefined, sortColumns);
      }
      // Pagination "presets"
      if (backendApiService.updatePagination && gridOptions.presets.pagination && !hasBackendInfiniteScroll()) {
        const { pageNumber, pageSize } = gridOptions.presets.pagination;
        backendApiService.updatePagination(pageNumber, pageSize);
      }
    } else {
      const columnFilters = filterService.getColumnFilters();
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
        // keep start time & end timestamps & return it after process execution
        const startTime = new Date();

        // run any pre-process, if defined, for example a spinner
        if (backendApi.preProcess) {
          backendApi.preProcess();
        }

        // the processes can be a Promise (like Http)
        const totalItems = _gridOptions.value?.pagination?.totalItems ?? 0;
        if (process instanceof Promise) {
          process
            .then((processResult: any) =>
              backendUtilityService.executeBackendProcessesCallback(startTime, processResult, backendApi, totalItems)
            )
            .catch((error) => backendUtilityService.onBackendError(error, backendApi));
        } else if (process && rxjs?.isObservable(process)) {
          subscriptions.push(
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
      addBackendInfiniteScrollCallback();
    }
  }
}

function addBackendInfiniteScrollCallback(): void {
  if (
    grid &&
    _gridOptions.value.backendServiceApi &&
    hasBackendInfiniteScroll() &&
    !_gridOptions.value.backendServiceApi?.onScrollEnd
  ) {
    const onScrollEnd = () => {
      backendUtilityService.setInfiniteScrollBottomHit(true);

      // even if we're not showing pagination, we still use pagination service behind the scene
      // to keep track of the scroll position and fetch next set of data (aka next page)
      // we also need a flag to know if we reached the of the dataset or not (no more pages)
      paginationService.goToNextPage().then((hasNext) => {
        if (!hasNext) {
          backendUtilityService.setInfiniteScrollBottomHit(false);
        }
      });
    };
    _gridOptions.value.backendServiceApi.onScrollEnd = onScrollEnd;

    // subscribe to SlickGrid onScroll to determine when reaching the end of the scroll bottom position
    // run onScrollEnd() method when that happens
    eventHandler.subscribe(grid.onScroll, (_e, args) => {
      const viewportElm = args.grid.getViewportNode()!;
      if (
        ['mousewheel', 'scroll'].includes(args.triggeredBy || '') &&
        paginationService?.totalItems &&
        args.scrollTop > 0 &&
        Math.ceil(viewportElm.offsetHeight + args.scrollTop) >= args.scrollHeight
      ) {
        if (!scrollEndCalled) {
          onScrollEnd();
          scrollEndCalled = true;
        }
      }
    });

    // use postProcess to identify when scrollEnd process is finished to avoid calling the scrollEnd multiple times
    // we also need to keep a ref of the user's postProcess and call it after our own postProcess
    const orgPostProcess = _gridOptions.value.backendServiceApi.postProcess;
    _gridOptions.value.backendServiceApi.postProcess = (processResult: any) => {
      scrollEndCalled = false;
      if (orgPostProcess) {
        orgPostProcess(processResult);
      }
    };
  }
}

function bindResizeHook(grid: SlickGrid, options: GridOption) {
  if (
    (options.autoFitColumnsOnFirstLoad && options.autosizeColumnsByCellContentOnFirstLoad) ||
    (options.enableAutoSizeColumns && options.enableAutoResizeColumnsByCellContent)
  ) {
    throw new Error(
      `[Slickgrid-Vue] You cannot enable both autosize/fit viewport & resize by content, you must choose which resize technique to use. You can enable these 2 options ("autoFitColumnsOnFirstLoad" and "enableAutoSizeColumns") OR these other 2 options ("autosizeColumnsByCellContentOnFirstLoad" and "enableAutoResizeColumnsByCellContent").`
    );
  }

  // auto-resize grid on browser resize
  if (options.gridHeight || options.gridWidth) {
    resizerService.resizeGrid(0, { height: options.gridHeight, width: options.gridWidth });
  } else {
    resizerService.resizeGrid();
  }

  // expand/autofit columns on first page load
  if (
    grid &&
    options?.enableAutoResize &&
    options.autoFitColumnsOnFirstLoad &&
    options.enableAutoSizeColumns &&
    !isAutosizeColsCalled
  ) {
    grid.autosizeColumns();
    isAutosizeColsCalled = true;
  }
}

function executeAfterDataviewCreated(_grid: SlickGrid, gridOptions: GridOption) {
  // if user entered some Sort "presets", we need to reflect them all in the DOM
  if (gridOptions.enableSorting) {
    if (gridOptions.presets && Array.isArray(gridOptions.presets.sorters)) {
      // when using multi-column sort, we can have multiple but on single sort then only grab the first sort provided
      const sortColumns = _gridOptions.value.multiColumnSort
        ? gridOptions.presets.sorters
        : gridOptions.presets.sorters.slice(0, 1);
      sortService.loadGridSorters(sortColumns);
    }
  }
}

/**
 * On a Pagination changed, we will trigger a Grid State changed with the new pagination info
 * Also if we use Row Selection or the Checkbox Selector with a Backend Service (Odata, GraphQL), we need to reset any selection
 */
function paginationChanged(pagination: PaginationMetadata) {
  const isSyncGridSelectionEnabled = gridStateService?.needToPreserveRowSelection() ?? false;
  if (
    grid &&
    !isSyncGridSelectionEnabled &&
    _gridOptions.value?.backendServiceApi &&
    (_gridOptions.value.enableRowSelection || _gridOptions.value.enableCheckboxSelector)
  ) {
    grid.setSelectedRows([]);
  }
  const { pageNumber, pageSize } = pagination;
  if (sharedService) {
    if (pageSize !== undefined && pageNumber !== undefined) {
      sharedService.currentPagination = { pageNumber, pageSize };
    }
  }
  eventPubSubService.publish('onGridStateChanged', {
    change: { newValues: { pageNumber, pageSize }, type: GridStateType.pagination },
    gridState: gridStateService.getCurrentGridState(),
  });
}

function paginationOptionsChanged(newPaginationOptions: Pagination) {
  if (newPaginationOptions && _paginationOptions.value) {
    _paginationOptions.value = { ..._paginationOptions.value, ...newPaginationOptions };
  } else {
    _paginationOptions.value = newPaginationOptions;
  }
  if (_gridOptions.value) {
    _gridOptions.value.pagination = _paginationOptions.value;
    paginationService.updateTotalItems(newPaginationOptions?.totalItems ?? 0, true);
  }
}

/**
 * When dataset changes, we need to refresh the entire grid UI & possibly resize it as well
 * @param dataset
 */
function refreshGridData(dataset: any[], totalCount?: number) {
  // local grid, check if we need to show the Pagination
  // if so then also check if there's any presets and finally initialize the PaginationService
  // a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
  if (_gridOptions.value?.enablePagination && isLocalGrid) {
    showPagination = true;
    loadLocalGridPagination(dataset);
  }

  if (_gridOptions.value?.enableEmptyDataWarningMessage && Array.isArray(dataset)) {
    const finalTotalCount = totalCount || dataset.length;
    displayEmptyDataWarning(finalTotalCount < 1);
  }

  if (Array.isArray(dataset) && grid && dataview?.setItems) {
    dataview.setItems(dataset, _gridOptions.value.datasetIdPropertyName ?? 'id');
    if (!_gridOptions.value.backendServiceApi && !_gridOptions.value.enableTreeData) {
      dataview.reSort();
    }

    if (dataset.length > 0) {
      if (!isDatasetInitialized) {
        loadFilterPresetsWhenDatasetInitialized();

        if (_gridOptions.value.enableCheckboxSelector) {
          loadRowSelectionPresetWhenExists();
        }
      }
      isDatasetInitialized = true;
    }

    if (dataset) {
      grid.invalidate();
    }

    // display the Pagination component only after calling this refresh data first, we call it here so that if we preset pagination page number it will be shown correctly
    showPagination = !!(
      _gridOptions.value &&
      (_gridOptions.value.enablePagination ||
        (_gridOptions.value.backendServiceApi && _gridOptions.value.enablePagination === undefined))
    );

    if (_paginationOptions.value && _gridOptions.value?.pagination && _gridOptions.value?.backendServiceApi) {
      const paginationOptions = setPaginationOptionsWhenPresetDefined(
        _gridOptions.value as GridOption,
        _paginationOptions.value as Pagination
      );
      // when we have a totalCount use it, else we'll take it from the pagination object
      // only update the total items if it's different to avoid refreshing the UI
      const totalRecords = totalCount !== undefined ? totalCount : _gridOptions.value?.pagination?.totalItems;
      if (totalRecords !== undefined && totalRecords !== totalItems.value) {
        totalItems.value = +totalRecords;
      }

      // initialize the Pagination Service with new pagination options (which might have presets)
      if (!isPaginationInitialized) {
        initializePaginationService(paginationOptions);
      } else {
        // update the pagination service with the new total
        paginationService.updateTotalItems(totalItems.value);
      }
    }

    // resize the grid inside a slight timeout, in case other DOM element changed prior to the resize (like a filter/pagination changed)
    if (grid && _gridOptions.value.enableAutoResize) {
      const delay = _gridOptions.value.autoResize && _gridOptions.value.autoResize.delay;
      resizerService.resizeGrid(delay || 10);
    }
  }
}

/**
 * Show the filter row displayed on first row, we can optionally pass false to hide it.
 * @param showing
 */
function showHeaderRow(showing = true) {
  grid?.setHeaderRowVisibility(showing);
  if (showing === true && isGridInitialized) {
    grid?.setColumns(columnDefinitionsModel.value);
  }
  return showing;
}

/**
 * Check if there's any Pagination Presets defined in the Grid Options,
 * if there are then load them in the paginationOptions object
 */
function setPaginationOptionsWhenPresetDefined(gridOptions: GridOption, paginationOptions: Pagination): Pagination {
  if (gridOptions.presets?.pagination && gridOptions.pagination) {
    if (hasBackendInfiniteScroll()) {
      console.warn('[Slickgrid-Vue] `presets.pagination` is not supported with Infinite Scroll, reverting to first page.');
    } else {
      paginationOptions.pageSize = gridOptions.presets.pagination.pageSize;
      paginationOptions.pageNumber = gridOptions.presets.pagination.pageNumber;
    }
  }
  return paginationOptions;
}

function setDarkMode(dark = false) {
  if (dark) {
    sharedService.gridContainerElement?.classList.add('slick-dark-mode');
  } else {
    sharedService.gridContainerElement?.classList.remove('slick-dark-mode');
  }
}

/**
 * Dynamically change or update the column definitions list.
 * We will re-render the grid so that the new header and data shows up correctly.
 * If using i18n, we also need to trigger a re-translate of the column headers
 */
function updateColumnDefinitionsList(newColumnDefinitions: Column<any>[]) {
  if (newColumnDefinitions) {
    // map the Editor model to editorClass and load editor collectionAsync
    newColumnDefinitions = loadSlickGridEditors(newColumnDefinitions);

    // if the user wants to automatically add a Custom Editor Formatter, we need to call the auto add function again
    if (_gridOptions.value.autoAddCustomEditorFormatter) {
      autoAddEditorFormatterToColumnsWithEditor(newColumnDefinitions, _gridOptions.value.autoAddCustomEditorFormatter);
    }

    if (_gridOptions.value.enableTranslate) {
      extensionService.translateColumnHeaders(undefined, newColumnDefinitions);
    } else {
      extensionService.renderColumnHeaders(newColumnDefinitions, true);
    }

    if (_gridOptions.value?.enableAutoSizeColumns) {
      grid?.autosizeColumns();
    } else if (_gridOptions.value?.enableAutoResizeColumnsByCellContent && resizerService?.resizeColumnsByCellContent) {
      resizerService.resizeColumnsByCellContent();
    }
  }
}

/**
 * assignment changes are not triggering on the column definitions, for that
 * we can use our internal array observer for any changes done via (push, pop, shift, ...)
 */
function observeColumnDefinitions() {
  collectionObservers.push(collectionObserver(columnDefinitionsModel.value, columnDefinitionsChanged));
}

/**
 * Loop through all column definitions and copy the original optional `width` properties optionally provided by the user.
 * We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
 */
function copyColumnWidthsReference(columnDefinitions: Column<any>[]) {
  columnDefinitions.forEach((col) => (col.originalWidth = col.width));
}

function displayEmptyDataWarning(showWarning = true) {
  slickEmptyWarning?.showEmptyDataMessage(showWarning);
}

/** When data changes in the DataView, we'll refresh the metrics and/or display a warning if the dataset is empty */
function handleOnItemCountChanged(currentPageRowItemCount: number, totalItemCount: number) {
  currentDatasetLength = totalItemCount;
  metrics = {
    startTime: new Date(),
    endTime: new Date(),
    itemCount: currentPageRowItemCount,
    totalItemCount,
  };
  // if custom footer is enabled, then we'll update its metrics
  if (slickFooter) {
    slickFooter.metrics = metrics;
  }

  // when using local (in-memory) dataset, we'll display a warning message when filtered data is empty
  if (isLocalGrid && _gridOptions.value?.enableEmptyDataWarningMessage) {
    displayEmptyDataWarning(currentPageRowItemCount === 0);
  }
}

/** Initialize the Pagination Service once */
function initializePaginationService(paginationOptions: Pagination) {
  if (_gridOptions.value) {
    paginationService.totalItems = totalItems.value;
    paginationService.init(grid!, paginationOptions, backendServiceApi);
    subscriptions.push(
      eventPubSubService.subscribe('onPaginationChanged', (paginationChanges: PaginationMetadata) =>
        paginationChanged(paginationChanges)
      ),
      eventPubSubService.subscribe('onPaginationVisibilityChanged', (visibility: { visible: boolean }) => {
        showPagination = visibility?.visible ?? false;
        if (_gridOptions.value?.backendServiceApi) {
          backendUtilityService?.refreshBackendDataset(_gridOptions.value as GridOption);
        }
        renderPagination(showPagination);
      })
    );

    // also initialize (render) the pagination component
    renderPagination();
    isPaginationInitialized = true;
  }
}

/** Load the Editor Collection asynchronously and replace the "collection" property when Promise resolves */
function loadEditorCollectionAsync(column: Column) {
  if (column?.editor) {
    const collectionAsync = column.editor.collectionAsync;
    column.editor.disabled = true; // disable the Editor DOM element, we'll re-enable it after receiving the collection with "updateEditorCollection()"

    if (collectionAsync instanceof Promise) {
      // wait for the "collectionAsync", once resolved we will save it into the "collection"
      // the collectionAsync can be of 3 types HttpClient, HttpFetch or a Promise
      collectionAsync.then((response: any | any[]) => {
        if (Array.isArray(response)) {
          updateEditorCollection(column, response); // from Promise
        } else if (response instanceof Response && typeof response.json === 'function') {
          if (response.bodyUsed) {
            console.warn(
              `[SlickGrid-Vue] The response body passed to collectionAsync was already read. ` +
                `Either pass the dataset from the Response or clone the response first using response.clone()`
            );
          } else {
            // from Fetch
            (response as Response).json().then((data) => updateEditorCollection(column, data));
          }
        } else if (response?.content) {
          updateEditorCollection(column, response.content); // from http-client
        }
      });
    } else if (rxjs?.isObservable(collectionAsync)) {
      // wrap this inside a microtask at the end of the task to avoid timing issue since updateEditorCollection requires to call SlickGrid getColumns() method after columns are available
      queueMicrotask(() => {
        subscriptions.push(
          (collectionAsync as Observable<any>).subscribe((resolvedCollection) =>
            updateEditorCollection(column, resolvedCollection)
          )
        );
      });
    }
  }
}

function insertDynamicPresetColumns(columnId: string, gridPresetColumns: Column<any>[]) {
  if (_columnDefinitions.value) {
    const columnPosition = _columnDefinitions.value.findIndex((c) => c.id === columnId);
    if (columnPosition >= 0) {
      const dynColumn = _columnDefinitions.value[columnPosition];
      if (dynColumn?.id === columnId && !gridPresetColumns.some((c) => c.id === columnId)) {
        columnPosition > 0 ? gridPresetColumns.splice(columnPosition, 0, dynColumn) : gridPresetColumns.unshift(dynColumn);
      }
    }
  }
}

/** Load any possible Columns Grid Presets */
function loadColumnPresetsWhenDatasetInitialized() {
  // if user entered some Columns "presets", we need to reflect them all in the grid
  if (
    _gridOptions.value.presets &&
    Array.isArray(_gridOptions.value.presets.columns) &&
    _gridOptions.value.presets.columns.length > 0
  ) {
    const gridPresetColumns: Column<any>[] = gridStateService.getAssociatedGridColumns(grid!, _gridOptions.value.presets.columns);
    if (
      gridPresetColumns &&
      Array.isArray(gridPresetColumns) &&
      gridPresetColumns.length > 0 &&
      Array.isArray(_columnDefinitions.value)
    ) {
      // make sure that the dynamic columns are included in presets (1.Row Move, 2. Row Selection, 3. Row Detail)
      if (_gridOptions.value.enableRowMoveManager) {
        const rmmColId = _gridOptions.value?.rowMoveManager?.columnId ?? '_move';
        insertDynamicPresetColumns(rmmColId, gridPresetColumns);
      }
      if (_gridOptions.value.enableCheckboxSelector) {
        const chkColId = _gridOptions.value?.checkboxSelector?.columnId ?? '_checkbox_selector';
        insertDynamicPresetColumns(chkColId, gridPresetColumns);
      }
      if (_gridOptions.value.enableRowDetailView) {
        const rdvColId = _gridOptions.value?.rowDetailView?.columnId ?? '_detail_selector';
        insertDynamicPresetColumns(rdvColId, gridPresetColumns);
      }

      // keep copy the original optional `width` properties optionally provided by the user.
      // We will use this when doing a resize by cell content, if user provided a `width` it won't override it.
      gridPresetColumns.forEach((col) => (col.originalWidth = col.width));

      // finally set the new presets columns (including checkbox selector if need be)
      grid?.setColumns(gridPresetColumns);
      sharedService.visibleColumns = gridPresetColumns;
    }
  }
}

/** Load any possible Filters Grid Presets */
function loadFilterPresetsWhenDatasetInitialized() {
  if (_gridOptions.value) {
    // if user entered some Filter "presets", we need to reflect them all in the DOM
    // also note that a presets of Tree Data Toggling will also call this method because Tree Data toggling does work with data filtering
    // (collapsing a parent will basically use Filter for hidding (aka collapsing) away the child underneat it)
    if (
      _gridOptions.value.presets &&
      (Array.isArray(_gridOptions.value.presets.filters) || Array.isArray(_gridOptions.value.presets?.treeData?.toggledItems))
    ) {
      filterService.populateColumnFilterSearchTermPresets(_gridOptions.value.presets?.filters || []);
    }
  }
}

/**
 * local grid, check if we need to show the Pagination
 * if so then also check if there's any presets and finally initialize the PaginationService
 * a local grid with Pagination presets will potentially have a different total of items, we'll need to get it from the DataView and update our total
 */
function loadLocalGridPagination(dataset?: any[]) {
  if (_gridOptions.value && _paginationOptions.value) {
    totalItems.value = Array.isArray(dataset) ? dataset.length : 0;
    if (_paginationOptions.value && dataview?.getPagingInfo) {
      const slickPagingInfo = dataview.getPagingInfo();
      if ('totalRows' in slickPagingInfo && _paginationOptions.value.totalItems !== slickPagingInfo.totalRows) {
        totalItems.value = slickPagingInfo.totalRows || 0;
      }
    }
    _paginationOptions.value.totalItems = totalItems.value;
    const paginationOptions = setPaginationOptionsWhenPresetDefined(_gridOptions.value as GridOption, _paginationOptions.value);
    initializePaginationService(paginationOptions);
  }
}

/** Load any Row Selections into the DataView that were presets by the user */
function loadRowSelectionPresetWhenExists() {
  // if user entered some Row Selections "presets"
  const presets = _gridOptions.value?.presets;
  const enableRowSelection =
    _gridOptions.value && (_gridOptions.value.enableCheckboxSelector || _gridOptions.value.enableRowSelection);
  if (
    enableRowSelection &&
    grid?.getSelectionModel() &&
    presets?.rowSelection &&
    (Array.isArray(presets.rowSelection.gridRowIndexes) || Array.isArray(presets.rowSelection.dataContextIds))
  ) {
    let dataContextIds = presets.rowSelection.dataContextIds;
    let gridRowIndexes = presets.rowSelection.gridRowIndexes;

    // maps the IDs to the Grid Rows and vice versa, the "dataContextIds" has precedence over the other
    if (Array.isArray(dataContextIds) && dataContextIds.length > 0) {
      gridRowIndexes = dataview?.mapIdsToRows(dataContextIds) || [];
    } else if (Array.isArray(gridRowIndexes) && gridRowIndexes.length > 0) {
      dataContextIds = dataview?.mapRowsToIds(gridRowIndexes) || [];
    }

    // apply row selection when defined as grid presets
    if (grid && Array.isArray(gridRowIndexes)) {
      grid.setSelectedRows(gridRowIndexes);
      dataview!.setSelectedIds(dataContextIds || [], {
        isRowBeingAdded: true,
        shouldTriggerEvent: false, // do not trigger when presetting the grid
        applyRowSelectionToGrid: true,
      });
    }
  }
}

function hasBackendInfiniteScroll(gridOptions?: GridOption): boolean {
  return !!(gridOptions || _gridOptions.value).backendServiceApi?.service.options?.infiniteScroll;
}

function mergeGridOptions(gridOptions: GridOption): GridOption {
  gridOptions.gridId = props.gridId;
  gridOptions.gridContainerId = `slickGridContainer-${props.gridId}`;

  // use extend to deep merge & copy to avoid immutable properties being changed in GlobalGridOptions after a route change
  const options = extend(true, {}, GlobalGridOptions, gridOptions) as GridOption;

  // if we have a backendServiceApi and the enablePagination is undefined, we'll assume that we do want to see it, else get that defined value
  if (!hasBackendInfiniteScroll(gridOptions)) {
    gridOptions.enablePagination = !!(gridOptions.backendServiceApi && gridOptions.enablePagination === undefined
      ? true
      : gridOptions.enablePagination);
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

  // also make sure to show the header row if user have enabled filtering
  hideHeaderRowAfterPageLoad = options.showHeaderRow === false;
  if (options.enableFiltering && !options.showHeaderRow) {
    options.showHeaderRow = options.enableFiltering;
  }

  // when we use Pagination on Local Grid, it doesn't seem to work without enableFiltering
  // so we'll enable the filtering but we'll keep the header row hidden
  if (options && !options.enableFiltering && options.enablePagination && isLocalGrid) {
    options.enableFiltering = true;
    options.showHeaderRow = false;
    hideHeaderRowAfterPageLoad = true;
    if (sharedService) {
      sharedService.hideHeaderRowAfterPageLoad = true;
    }
  }

  return options;
}

function initializeExternalResources(resources: ExternalResource[]) {
  if (Array.isArray(resources)) {
    for (const resource of resources) {
      if (grid && typeof resource.init === 'function') {
        resource.init(grid, containerService);
      }
    }
  }
}

/** Pre-Register any Resource that don't require SlickGrid to be instantiated (for example RxJS Resource & RowDetail) */
function preRegisterResources() {
  registeredResources = _gridOptions.value?.externalResources || [];

  // bind & initialize all Components/Services that were tagged as enabled
  // register all services by executing their init method and providing them with the Grid object
  if (Array.isArray(registeredResources)) {
    for (const resource of registeredResources) {
      if (resource?.className === 'RxJsResource') {
        registerRxJsResource(resource as RxJsFacade);
      }
    }
  }

  if (_gridOptions.value.enableRowDetailView && !registeredResources.some((r) => r instanceof SlickRowDetailView)) {
    slickRowDetailView = new SlickRowDetailView(eventPubSubService);
    slickRowDetailView.create(_columnDefinitions.value!, _gridOptions.value as GridOption);
    extensionService.addExtensionToList(ExtensionName.rowDetailView, {
      name: ExtensionName.rowDetailView,
      instance: slickRowDetailView,
    });
  }
}

function registerResources() {
  // at this point, we consider all the registered services as external services, anything else registered afterward aren't external
  if (Array.isArray(registeredResources)) {
    sharedService.externalRegisteredResources = registeredResources;
  }

  // push all other Services that we want to be registered
  if (!registeredResources.some((r) => r instanceof GridService)) {
    registeredResources.push(gridService);
  }
  if (!registeredResources.some((r) => r instanceof GridStateService)) {
    registeredResources.push(gridStateService);
  }

  // when using Grouping/DraggableGrouping/Colspan register its Service
  if (
    ((_gridOptions.value.createPreHeaderPanel && _gridOptions.value.createTopHeaderPanel) ||
      (_gridOptions.value.createPreHeaderPanel && !_gridOptions.value.enableDraggableGrouping)) &&
    !registeredResources.some((r) => r instanceof HeaderGroupingService)
  ) {
    registeredResources.push(headerGroupingService);
  }

  // when using Tree Data View, register its Service
  if (_gridOptions.value.enableTreeData && !registeredResources.some((r) => r instanceof TreeDataService)) {
    registeredResources.push(treeDataService);
  }

  // when user enables translation, we need to translate Headers on first pass & subsequently in the bindDifferentHooks
  if (_gridOptions.value.enableTranslate) {
    extensionService.translateColumnHeaders();
  }

  // also initialize (render) the empty warning component
  if (!registeredResources.some((r) => r instanceof SlickEmptyWarningComponent)) {
    slickEmptyWarning = new SlickEmptyWarningComponent();
    registeredResources.push(slickEmptyWarning);
  }

  // bind & initialize all Components/Services that were tagged as enabled
  // register all services by executing their init method and providing them with the Grid object
  initializeExternalResources(registeredResources);

  // initialize RowDetail separately since we already added it to the ExtensionList via `addExtensionToList()` but not in external resources,
  // because we don't want to dispose the extension/resource more than once (because externalResources/extensionList are both looping through their list to dispose of them)
  if (_gridOptions.value.enableRowDetailView && slickRowDetailView) {
    slickRowDetailView.init(grid);
  }
}

/** Register the RxJS Resource in all necessary services which uses */
function registerRxJsResource(resource: RxJsFacade) {
  rxjs = resource;
  backendUtilityService.addRxJsResource(rxjs);
  filterFactory.addRxJsResource(rxjs);
  filterService.addRxJsResource(rxjs);
  sortService.addRxJsResource(rxjs);
  paginationService.addRxJsResource(rxjs);
  containerService.registerInstance('RxJsResource', rxjs);
}

/**
 * Render (or dispose) the Pagination Component, user can optionally provide False (to not show it) which will in term dispose of the Pagination,
 * also while disposing we can choose to omit the disposable of the Pagination Service (if we are simply toggling the Pagination, we want to keep the Service alive)
 * @param {Boolean} showPagination - show (new render) or not (dispose) the Pagination
 * @param {Boolean} shouldDisposePaginationService - when disposing the Pagination, do we also want to dispose of the Pagination Service? (defaults to True)
 */
async function renderPagination(showPagination = true) {
  if (grid && _gridOptions.value?.enablePagination && !isPaginationInitialized && showPagination) {
    if (_gridOptions.value.customPaginationComponent) {
      const paginationContainer = document.createElement('section');
      const instance = createApp(_gridOptions.value.customPaginationComponent).mount(
        paginationContainer
      ) as ComponentPublicInstance<BasePaginationModel>;
      elm.value!.appendChild(instance.$el);
      slickPagination = instance;
    } else {
      slickPagination = new SlickPaginationComponent();
    }

    // wait a cycle to make sure the pager ref is instanciated
    nextTick(() => {
      if (slickPagination) {
        slickPagination.init(grid, paginationService, eventPubSubService, translaterService);
        slickPagination.renderPagination(elm.value as HTMLDivElement);
        isPaginationInitialized = true;
      }
    });
  } else if (!showPagination) {
    slickPagination?.dispose();
    isPaginationInitialized = false;
  }
}

/**
 * Takes a flat dataset with parent/child relationship, sort it (via its tree structure) and return the sorted flat array
 * @param {Array<Object>} flatDatasetInput - flat dataset input
 * @param {Boolean} forceGridRefresh - optionally force a full grid refresh
 * @returns {Array<Object>} sort flat parent/child dataset
 */
function sortTreeDataset<T>(flatDatasetInput: T[], forceGridRefresh = false): T[] {
  const prevDatasetLn = currentDatasetLength;
  let sortedDatasetResult;
  let flatDatasetOutput: any[] = [];

  // if the hierarchical dataset was already initialized then no need to re-convert it, we can use it directly from the shared service ref
  if (isDatasetHierarchicalInitialized && dataHierarchicalModel.value) {
    sortedDatasetResult = treeDataService.sortHierarchicalDataset(dataHierarchicalModel.value);
    flatDatasetOutput = sortedDatasetResult.flat;
  } else if (Array.isArray(flatDatasetInput) && flatDatasetInput.length > 0) {
    // we need to first convert the flat dataset to a hierarchical dataset and then sort it
    // we'll also add props, by mutation, required by the TreeDataService on the flat array like `__hasChildren`, `parentId` and anything else to work properly
    sortedDatasetResult = treeDataService.convertFlatParentChildToTreeDatasetAndSort(
      flatDatasetInput,
      _columnDefinitions.value || [],
      _gridOptions.value as GridOption
    );
    sharedService.hierarchicalDataset = sortedDatasetResult.hierarchical;
    flatDatasetOutput = sortedDatasetResult.flat;
  }

  // if we add/remove item(s) from the dataset, we need to also refresh our tree data filters
  if (flatDatasetInput.length > 0 && (forceGridRefresh || flatDatasetInput.length !== prevDatasetLn)) {
    filterService.refreshTreeDataFilters(flatDatasetOutput);
  }

  return flatDatasetOutput;
}

/** Prepare and load all SlickGrid editors, if an async editor is found then we'll also execute it. */
function loadSlickGridEditors(columnDefinitions: Column<any>[]): Column<any>[] {
  if (columnDefinitions.some((col) => `${col.id}`.includes('.'))) {
    console.error(
      '[Slickgrid-Vue] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".'
    );
  }

  return columnDefinitions.map((column: Column | any) => {
    // on every Editor which have a "collection" or a "collectionAsync"
    if (column.editor?.collectionAsync) {
      loadEditorCollectionAsync(column);
    }

    return { ...column, editorClass: column.editor?.model };
  });
}

function suggestDateParsingWhenHelpful() {
  if (
    dataview!.getItemCount() > WARN_NO_PREPARSE_DATE_SIZE &&
    !_gridOptions.value.silenceWarnings &&
    !_gridOptions.value.preParseDateColumns &&
    grid?.getColumns().some((c) => isColumnDateType(c.type))
  ) {
    console.warn(
      '[Slickgrid-Universal] For getting better perf, we suggest you enable the `preParseDateColumns` grid option, ' +
        'for more info visit => https://ghiscoding.gitbook.io/slickgrid-vue/column-functionalities/sorting#pre-parse-date-columns-for-better-perf'
    );
  }
}

/**
 * When the Editor(s) has a "editor.collection" property, we'll load the async collection.
 * Since this is called after the async call resolves, the pointer will not be the same as the "column" argument passed.
 */
function updateEditorCollection<T = any>(column: Column<T>, newCollection: T[]) {
  if (grid && column.editor) {
    column.editor.collection = newCollection;
    column.editor.disabled = false;

    // get current Editor, remove it from the DOM then re-enable it and re-render it with the new collection.
    const currentEditor = grid.getCellEditor() as AutocompleterEditor | SelectEditor;
    if (currentEditor?.disable && currentEditor?.renderDomElement) {
      currentEditor.destroy();
      currentEditor.disable(false);
      currentEditor.renderDomElement(newCollection);
    }
  }
}
</script>

<template>
  <div :id="gridContainerId" ref="elm" class="grid-pane">
    <!-- Header slot if you need to create a complex custom header -->
    <slot name="header"></slot>

    <div :id="gridId" class="slickgrid-container"></div>

    <!-- Footer slot if you need to create a complex custom footer -->
    <slot name="footer"></slot>
  </div>
</template>
