import type {
  Column,
  GridOption,
  // services
  BackendUtilityService,
  CollectionService,
  ExtensionService,
  ExtensionUtility,
  FilterService,
  GridEventService,
  GridService,
  GridStateService,
  GroupingAndColspanService,
  PaginationService,
  ResizerService,
  RxJsFacade,
  SharedService,
  SortService,
  TranslaterService,
  TreeDataService,
} from '@slickgrid-universal/common';
import { GlobalGridOptions } from '@slickgrid-universal/common';
import type { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { TextExportService } from '@slickgrid-universal/text-export';
import { extend } from '@slickgrid-universal/utils';
import { SlickVanillaGridBundle, type UniversalContainerService } from '@slickgrid-universal/vanilla-bundle';

import { SalesforceGlobalGridOptions } from './salesforce-global-grid-options';

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
    super(gridParentContainerElm, columnDefs, options, dataset, hierarchicalDataset, services);
  }

  mergeGridOptions(gridOptions: GridOption) {
    const extraOptions = (gridOptions.useSalesforceDefaultGridOptions || (this._gridOptions?.useSalesforceDefaultGridOptions)) ? SalesforceGlobalGridOptions : {};
    const options = extend(true, {}, GlobalGridOptions, extraOptions, gridOptions);

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

  protected registerResources() {
    // when using Salesforce, we want the Export to CSV always enabled without registering it
    if (this.gridOptions.enableTextExport) {
      this._registeredResources.push(new TextExportService());
    }
    if (this.gridOptions.enableTextExport) {
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
    if (this.gridOptions.createPreHeaderPanel) {
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
    if (this.gridOptions.enableCompositeEditor) {
      if (!this._registeredResources.some((resource => resource instanceof SlickCompositeEditorComponent))) {
        this.slickCompositeEditor = new SlickCompositeEditorComponent();
        this._registeredResources.push(this.slickCompositeEditor);
      }
    }

    // bind & initialize all Components/Services that were tagged as enabled
    // register all services by executing their init method and providing them with the Grid object
    if (Array.isArray(this._registeredResources)) {
      for (const resource of this._registeredResources) {
        if (this.slickGrid && typeof resource.init === 'function') {
          resource.init(this.slickGrid, this.universalContainerService);
        }
      }
    }
  }
}
