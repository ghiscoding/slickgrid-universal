import type {
  // services
  BackendUtilityService,
  CollectionService,
  Column,
  ExtensionService,
  ExtensionUtility,
  FilterService,
  GridEventService,
  GridOption,
  GridService,
  GridStateService,
  HeaderGroupingService,
  PaginationService,
  ResizerService,
  RxJsFacade,
  SharedService,
  SortService,
  TranslaterService,
  TreeDataService,
} from '@slickgrid-universal/common';
import { getIconSetOptions, GlobalGridOptions } from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import type { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { extend } from '@slickgrid-universal/utils';
import { SlickVanillaGridBundle, type UniversalContainerService } from '@slickgrid-universal/vanilla-bundle';
import { SalesforceGlobalGridOptions } from './salesforce-global-grid-options.js';

export class VanillaForceGridBundle extends SlickVanillaGridBundle {
  slickCompositeEditor: SlickCompositeEditorComponent | undefined;

  /**
   * Salesforce Slicker Grid Bundle constructor
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
      backendUtilityService?: BackendUtilityService;
      collectionService?: CollectionService;
      eventPubSubService?: EventPubSubService;
      extensionService?: ExtensionService;
      extensionUtility?: ExtensionUtility;
      filterService?: FilterService;
      gridEventService?: GridEventService;
      gridService?: GridService;
      gridStateService?: GridStateService;
      headerGroupingService?: HeaderGroupingService;
      paginationService?: PaginationService;
      resizerService?: ResizerService;
      rxjs?: RxJsFacade;
      sharedService?: SharedService;
      sortService?: SortService;
      treeDataService?: TreeDataService;
      translaterService?: TranslaterService;
      universalContainerService?: UniversalContainerService;
    }
  ) {
    super(gridParentContainerElm, columnDefs, options, dataset, hierarchicalDataset, services);
  }

  mergeGridOptions(gridOptions: GridOption): GridOption {
    const extraOptions =
      gridOptions.useSalesforceDefaultGridOptions || this._gridOptions?.useSalesforceDefaultGridOptions ? SalesforceGlobalGridOptions : {};
    const options = extend(
      true,
      {},
      getIconSetOptions(gridOptions.iconSet ?? GlobalGridOptions.iconSet),
      GlobalGridOptions,
      extraOptions,
      gridOptions
    );

    // Command visibility and export menu format lists replace defaults instead of merging array entries by index.
    for (const menu of ['gridMenu', 'contextMenu', 'headerMenu'] as const) {
      const commands = gridOptions[menu]?.hideCommands;
      if (commands && options[menu]) {
        Object.assign(options[menu], { hideCommands: [...commands] });
      }
    }
    const menuFormats = gridOptions.textExportOptions?.menuFormats;
    if (menuFormats && options.textExportOptions) {
      options.textExportOptions.menuFormats = [...menuFormats];
    }

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

  // --
  // protected functions
  // ------------------

  protected registerResources(): void {
    // when using Salesforce, we want the Export to CSV always enabled without registering it
    if (this.options.enableTextExport) {
      this._registeredResources.push(new TextExportService());
    }
    if (this.options.enableExcelExport) {
      this._registeredResources.push(new ExcelExportService());
    }
    this._registeredResources.push(new SlickCustomTooltip());

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

    // also initialize (render) the pagination component when using the salesforce default options
    // however before adding a new instance, just make sure there isn't one that might have been loaded by calling "registerExternalResources"
    if (this.options.enableCompositeEditor) {
      if (!this._registeredResources.some((resource) => resource instanceof SlickCompositeEditorComponent)) {
        this.slickCompositeEditor = new SlickCompositeEditorComponent();
        this._registeredResources.push(this.slickCompositeEditor);
      }
    }

    // bind & initialize all Components/Services that were tagged as enabled
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(this._registeredResources)) {
      for (const resource of this._registeredResources) {
        this.autoEnableInitializedResources(resource);
      }
    }
  }
}
