import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { SlickEventHandler, type SlickDataView, type SlickEventData, type SlickGrid } from '../core/index.js';
import { type ToggleStateChangeType } from '../enums/index.js';
import type {
  Column,
  ColumnSort,
  GridOption,
  LAZY_TYPES,
  OnClickEventArgs,
  TreeDataOption,
  TreeToggledItem,
  TreeToggleStateChange,
} from '../interfaces/index.js';
import type { FilterService } from './filter.service.js';
import type { SharedService } from './shared.service.js';
import type { SortService } from './sort.service.js';
import {
  addTreeLevelAndAggregatorsByMutation,
  findItemInTreeStructure,
  getTreeDataOptionPropName,
  unflattenParentChildArrayToTree,
} from './utilities.js';

export class TreeDataService {
  protected _lastToggleStateChange!: Omit<TreeToggleStateChange, 'fromItemId'>;
  protected _currentToggledItems: TreeToggledItem[] = [];
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;
  protected _isLastFullToggleCollapsed = false;
  protected _isOneCpuCyclePassed = false;
  protected _isTreeDataEnabled = false;
  protected _subscriptions: EventSubscription[] = [];
  protected _timer?: any;
  protected _treeDataRecalcHandler: (() => void) | null = null;

  constructor(
    protected readonly pubSubService: BasePubSubService,
    protected readonly filterService: FilterService,
    protected readonly sharedService: SharedService,
    protected readonly sortService: SortService
  ) {
    this._eventHandler = new SlickEventHandler();
    setTimeout(() => (this._isOneCpuCyclePassed = true));
  }

  set currentToggledItems(newToggledItems: TreeToggledItem[]) {
    this._currentToggledItems = newToggledItems;
  }
  get dataset(): any[] {
    return this.dataView?.getItems();
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  get datasetIdPropName(): string {
    return this.gridOptions.datasetIdPropertyName || 'id';
  }

  get treeDataOptions(): TreeDataOption | undefined {
    return this.gridOptions.treeDataOptions;
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  init(grid: SlickGrid): void {
    this._grid = grid;
    this._isTreeDataEnabled = this.gridOptions?.enableTreeData ?? false;
    this._isLastFullToggleCollapsed = this.treeDataOptions?.initiallyCollapsed ?? false;
    this._currentToggledItems = this.gridOptions.presets?.treeData?.toggledItems ?? [];
    this._lastToggleStateChange = {
      type: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
      previousFullToggleType: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
      toggledItems: this._currentToggledItems,
    };

    // there's a few limitations with Tree Data, we'll just throw error when that happens
    if (this._isTreeDataEnabled) {
      if (this.gridOptions?.multiColumnSort) {
        throw new Error(
          '[Slickgrid-Universal] It looks like you are trying to use Tree Data with multi-column sorting, unfortunately it is not supported because of its complexity, you can disable it via "multiColumnSort: false" grid option and/or help in providing support for this feature.'
        );
      }

      if (!this.gridOptions?.enableFiltering) {
        throw new Error(
          '[Slickgrid-Universal] It looks like you are trying to use Tree Data without using the filtering option, unfortunately that is not possible with Tree Data since it relies heavily on the filters to expand/collapse the tree. You need to enable it via "enableFiltering: true"'
        );
      }

      if (this.gridOptions?.backendServiceApi || this.gridOptions?.enablePagination) {
        throw new Error(
          '[Slickgrid-Universal] It looks like you are trying to use Tree Data with Pagination and/or a Backend Service (OData, GraphQL) but unfortunately that is simply not supported because of its complexity.'
        );
      }

      if (!this.gridOptions.treeDataOptions || !this.gridOptions.treeDataOptions.columnId) {
        throw new Error(
          '[Slickgrid-Universal] When enabling tree data, you must also provide the "treeDataOption" property in your Grid Options with "childrenPropName" or "parentPropName" (depending if your array is hierarchical or flat) for the Tree Data to work properly.'
        );
      }
    }

    // initialize anything related to hierarchical tree (e.g. `initiallyCollapsed`)
    this.initHierarchicalTree();

    // subscribe to the SlickGrid event and call the backend execution
    this._eventHandler.subscribe(grid.onClick, this.handleOnCellClick.bind(this));

    // when "Clear all Sorting" is triggered by the Grid Menu, we'll resort with `initialSort` when defined (or else by 'id')
    this._subscriptions.push(this.pubSubService.subscribe('onGridMenuClearAllSorting', this.clearSorting.bind(this)));

    // when Tree Data totals auto-recalc feature is enabled, we will define its handler to do the recalc
    this._treeDataRecalcHandler = this.setAutoRecalcTotalsCallbackWhenFeatEnabled(this.gridOptions);

    this._eventHandler.subscribe(this.dataView.onRowCountChanged, () => {
      // call Tree Data recalc handler, inside a debounce, when defined but only when at least 1 CPU cycle is passed
      // we wait for 1 CPU cycle to make sure that we only run it after filtering and grid initialization of tree & grid is over
      if (typeof this._treeDataRecalcHandler === 'function' && this._isOneCpuCyclePassed) {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this._treeDataRecalcHandler?.(), this.treeDataOptions?.autoRecalcTotalsDebounce ?? 0);
      }
    });
  }

  /** init the hierarchical tree when necessary (e.g. `initiallyCollapsed` requires to collapse all items) */
  initHierarchicalTree(): void {
    if (this.gridOptions?.treeDataOptions?.initiallyCollapsed) {
      this.toggleAllHierarchicalTree(
        this.datasetHierarchical || [],
        true,
        getTreeDataOptionPropName(this.treeDataOptions, 'childrenPropName'),
        getTreeDataOptionPropName(this.treeDataOptions, 'collapsedPropName'),
        getTreeDataOptionPropName(this.treeDataOptions, 'lazyLoadingPropName')
      );
    }
  }

  /**
   * Apply different tree toggle state changes (to ALL rows, the entire dataset) by providing an array of parentIds that are designated as collapsed (or not).
   * User will have to provide an array of `parentId` and `isCollapsed` boolean and the code will only apply the ones that are tagged as collapsed, everything else will be expanded
   * @param {Array<TreeToggledItem>} treeToggledItems - array of parentId which are tagged as changed
   * @param {ToggleStateChangeType} previousFullToggleType - optionally provide the previous full toggle type ('full-expand' or 'full-collapse')
   * @param {Boolean} shouldPreProcessFullToggle - should we pre-process a full toggle on all items? defaults to True
   * @param {Boolean} shouldTriggerEvent - should we trigger a toggled item event? defaults to False
   */
  applyToggledItemStateChanges(
    treeToggledItems: TreeToggledItem[],
    previousFullToggleType?: Extract<ToggleStateChangeType, 'full-collapse' | 'full-expand'>,
    shouldPreProcessFullToggle = true,
    shouldTriggerEvent = false
  ): void {
    if (Array.isArray(treeToggledItems)) {
      const collapsedPropName = getTreeDataOptionPropName(this.treeDataOptions, 'collapsedPropName');
      const hasChildrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'hasChildrenPropName');

      // for the rows we identified as collapsed, we'll send them to the DataView with the new updated collapsed flag
      // and we'll refresh the DataView to see the collapsing applied in the grid
      this.dataView.beginUpdate(true);

      // we first need to put back the previous full toggle state (whether it was a full collapse or expand) by collapsing/expanding everything depending on the last toggled that was called `isLastFullToggleCollapsed`
      const previousFullToggle = previousFullToggleType ?? this._lastToggleStateChange.previousFullToggleType;
      const shouldCollapseAll = previousFullToggle === 'full-collapse';

      // when full toggle type is provided, we also need to update our internal reference of our current toggle state
      if (previousFullToggleType) {
        this._lastToggleStateChange.previousFullToggleType = previousFullToggleType;
      }

      // typically (optionally and defaults to true) if we want to reapply some toggled items we probably want to be in the full toggled state as it was at the start
      // collapse/expand from the last full toggle state, all the items which are parent items with children
      if (shouldPreProcessFullToggle) {
        (this.dataView.getItems() || []).forEach((item: any) => {
          if (item[hasChildrenPropName]) {
            item[collapsedPropName] = shouldCollapseAll;
          }
        });
      }

      // then we reapply only the ones that changed (provided as argument to the function)
      // we also don't need to call the DataView `endUpdate()`, for the transaction ending, because it will be called inside this other method
      this.dynamicallyToggleItemState(treeToggledItems, shouldTriggerEvent);
    }
  }

  /**
   * Dynamically toggle and change state of certain parent items by providing an array of parentIds that are designated as to be collapsed (or not).
   * User will have to provide an array of `parentId` and `isCollapsed` boolean, only the provided list of items will be toggled and nothing else.
   *
   * NOTE: the `applyToggledItemStateChanges()` method is very similar but on top of toggling the `treeToggledItems` it WILL ALSO collapse everything else.
   * @param {Array<TreeToggledItem>} treeToggledItems - array of parentId which are tagged as changed
   * @param {Boolean} shouldTriggerEvent - should we trigger a toggled item event? defaults to True
   */
  dynamicallyToggleItemState(treeToggledItems: TreeToggledItem[], shouldTriggerEvent = true): void {
    if (Array.isArray(treeToggledItems)) {
      // for the rows we identified as collapsed, we'll send them to the DataView with the new updated collapsed flag
      // and we'll refresh the DataView to see the collapsing applied in the grid
      this.dataView.beginUpdate(true);

      // then we reapply only the ones that changed (provided as argument to the function)
      treeToggledItems.forEach((collapsedItem) => {
        const item = this.dataView.getItemById(collapsedItem.itemId);
        this.updateToggledItem(item, collapsedItem.isCollapsed, true);

        if (shouldTriggerEvent) {
          const parentFoundIdx = this._currentToggledItems.findIndex((treeChange) => treeChange.itemId === collapsedItem.itemId);
          if (parentFoundIdx >= 0) {
            this._currentToggledItems[parentFoundIdx].isCollapsed = collapsedItem.isCollapsed;
          } else {
            this._currentToggledItems.push({ itemId: collapsedItem.itemId, isCollapsed: collapsedItem.isCollapsed });
          }

          this.pubSubService.publish('onTreeItemToggled', {
            ...this._lastToggleStateChange,
            fromItemId: collapsedItem.itemId,
            toggledItems: this._currentToggledItems,
            type: collapsedItem.isCollapsed ? 'toggle-collapse' : 'toggle-expand',
          } as TreeToggleStateChange);
        }
      });

      // close the update transaction & call a refresh which will trigger a re-render with filters applied (including expand/collapse)
      this.dataView.endUpdate();
      this.dataView.refresh();
    }
  }

  /**
   * Get the current toggle state that includes the type (toggle, full-expand, full-collapse) and toggled items (only applies when it's a parent toggle)
   * @returns {TreeToggleStateChange} treeDataToggledItems - items that were toggled (array of `parentId` and `isCollapsed` flag)
   */
  getCurrentToggleState(): Omit<TreeToggleStateChange, 'fromItemId'> {
    return this._lastToggleStateChange;
  }

  getInitialSort(columns: Column[], gridOptions: GridOption): ColumnSort {
    const treeDataOptions = gridOptions?.treeDataOptions;
    const initialColumnSorting = treeDataOptions?.initialSort ?? { columnId: treeDataOptions?.columnId ?? '', direction: 'ASC' };
    const initialSortColumn = columns.find((col) => col.id === initialColumnSorting.columnId);

    return {
      columnId: initialColumnSorting.columnId,
      sortAsc: initialColumnSorting?.direction?.toUpperCase() !== 'DESC',
      sortCol: initialSortColumn as Column,
    };
  }

  /**
   * Get the full item count of the Tree.
   * When an optional tree level is provided, it will return the count for only that dedicated level (for example providing 0 would return the item count of all parent items)
   * @param {Number} [treeLevel] - optional tree level to get item count from
   * @returns
   */
  getItemCount(treeLevel?: number): number {
    if (treeLevel !== undefined) {
      const levelPropName = getTreeDataOptionPropName(this.treeDataOptions, 'levelPropName');
      return this.dataView.getItems().filter((dataContext) => dataContext[levelPropName] === treeLevel).length;
    }
    return this.dataView.getItemCount();
  }

  /**
   * Get the current list of Tree Data item(s) that got toggled in the grid (basically the parents that the user clicked on the toggle icon to expand/collapse the child)
   * @returns {Array<TreeToggledItem>} treeDataToggledItems - items that were toggled (array of `parentId` and `isCollapsed` flag)
   */
  getToggledItems(): TreeToggledItem[] {
    return this._currentToggledItems;
  }

  /** Clear the sorting and set it back to initial sort */
  clearSorting(): void {
    const initialSort = this.getInitialSort(this.sharedService.columnDefinitions, this.sharedService.gridOptions);
    this.sortService.loadGridSorters([{ columnId: initialSort.columnId, direction: initialSort.sortAsc ? 'ASC' : 'DESC' }]);
  }

  /**
   * Takes a flat dataset, converts it into a hierarchical dataset, sort it by recursion and finally return back the final and sorted flat array.
   * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
   * @param {Array<Object>} flatDataset - parent/child flat dataset
   * @param {Column[]} columns - column definitions
   * @param {Object} gridOptions - grid options
   * @param {Array<ColumnSort>} [columnSorts] - optional sort columns
   * @returns {Array<Object>} - tree dataset
   */
  convertFlatParentChildToTreeDatasetAndSort<P>(
    flatDataset: P[],
    columns: Column[],
    gridOptions: GridOption,
    columnSorts?: ColumnSort[]
  ): { hierarchical: Array<P & { [childrenPropName: string]: P[] }>; flat: P[] } {
    // 1- convert the flat array into a hierarchical array
    const datasetHierarchical = this.convertFlatParentChildToTreeDataset(flatDataset, gridOptions);

    // 2- sort the hierarchical array recursively by an optional "initialSort" OR if nothing is provided we'll sort by the column defined as the Tree column
    // also note that multi-column is not currently supported with Tree Data and so we'll take only the first Sort column
    const columnSort = Array.isArray(columnSorts) && columnSorts.length ? columnSorts[0] : this.getInitialSort(columns, gridOptions);
    const datasetSortResult = this.sortService.sortHierarchicalDataset(datasetHierarchical, [columnSort], true);

    // and finally add the sorting icon (this has to be done manually in SlickGrid) to the column we used for the sorting
    this._grid?.setSortColumns([columnSort]);

    return datasetSortResult;
  }

  /**
   * Takes a flat dataset, converts it into a hierarchical dataset
   * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
   * @param {Array<Object>} flatDataset - parent/child flat dataset
   * @param {Object} gridOptions - grid options
   * @returns {Array<Object>} - tree dataset
   */
  convertFlatParentChildToTreeDataset<P, T extends P & { [childrenPropName: string]: P[] }>(
    flatDataset: P[],
    gridOptions: GridOption
  ): T[] {
    const treeDataOpt: TreeDataOption = gridOptions?.treeDataOptions ?? { columnId: 'id' };
    const treeDataOptions = {
      ...treeDataOpt,
      identifierPropName: treeDataOpt.identifierPropName ?? this.datasetIdPropName,
      initiallyCollapsed: this._isLastFullToggleCollapsed, // use the last full toggled flag so that if we replace the entire dataset we will still use the last toggled flag (this flag is also initialized with `initiallyCollapsed` when provided)
    };
    return unflattenParentChildArrayToTree(flatDataset, treeDataOptions);
  }

  /**
   * Dynamically enable (or disable) Tree Totals auto-recalc feature when Aggregators exists
   * @param {Boolean} [enableFeature=true]
   */
  enableAutoRecalcTotalsFeature(enableFeature = true): void {
    if (enableFeature && this._isTreeDataEnabled) {
      this._treeDataRecalcHandler = this.recalculateTreeTotals.bind(this, this.gridOptions);
    } else {
      this._treeDataRecalcHandler = null;
    }
  }

  /**
   * Recalculate all Tree Data totals, this requires Aggregators to be defined.
   * NOTE: this does **not** take the current filters in consideration
   * @param gridOptions
   */
  recalculateTreeTotals(gridOptions: GridOption): void {
    const treeDataOptions = gridOptions.treeDataOptions;
    const childrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'childrenPropName');
    const levelPropName = getTreeDataOptionPropName(this.treeDataOptions, 'levelPropName');

    if (treeDataOptions?.aggregators) {
      treeDataOptions.aggregators.forEach((aggregator) => {
        addTreeLevelAndAggregatorsByMutation(this.sharedService.hierarchicalDataset || [], {
          childrenPropName,
          levelPropName,
          aggregator,
        });
      });
      this._grid.invalidate();
    }
  }

  /**
   * Takes a hierarchical (tree) input array and sort it (if an `initialSort` exist, it will use that to sort)
   * Note: for perf reasons, it mutates the array by adding extra props like `treeLevel`
   * @param {Array<Object>} hierarchicalDataset - input hierarchical tree dataset
   * @param {ColumnSort | ColumnSort[]} [inputColumnSorts] - column sort(s)
   * @returns {Object} sort result object that includes both the flat & tree data arrays
   */
  sortHierarchicalDataset<T>(hierarchicalDataset: T[], inputColumnSorts?: ColumnSort | ColumnSort[]): { hierarchical: T[]; flat: any[] } {
    const columnSorts = inputColumnSorts ?? this.getInitialSort(this.sharedService.allColumns, this.gridOptions);
    const finalColumnSorts = Array.isArray(columnSorts) ? columnSorts : [columnSorts];
    return this.sortService.sortHierarchicalDataset(hierarchicalDataset, finalColumnSorts);
  }

  /**
   * Toggle the collapsed values of all parent items (the ones with children), we can optionally provide a flag to force a collapse or expand
   * @param {Boolean} collapsing - optionally force a collapse/expand (True => collapse all, False => expand all)
   * @param {Boolean} shouldTriggerEvent - defaults to true, should we trigger an event? For example, we could disable this to avoid a Grid State change event.
   * @returns {Promise<void>} - returns a void Promise, the reason we use a Promise is simply to make sure that when we add a spinner, it doesn't start/stop only at the end of the process
   */
  async toggleTreeDataCollapse(collapsing: boolean, shouldTriggerEvent = true): Promise<void> {
    if (this.gridOptions?.enableTreeData) {
      const collapsedPropName = getTreeDataOptionPropName(this.treeDataOptions, 'collapsedPropName');
      const childrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'childrenPropName');
      const hasChildrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'hasChildrenPropName');
      const lazyLoadingPropName = getTreeDataOptionPropName(this.treeDataOptions, 'lazyLoadingPropName');

      // emit an event when full toggle starts (useful to show a spinner)
      if (shouldTriggerEvent) {
        await this.pubSubService.publish('onTreeFullToggleStart', { collapsing });
      }

      // do a bulk change data update to toggle all necessary parents (the ones with children) to the new collapsed flag value
      this.dataView.beginUpdate(true);

      // collapse/expand all items in both hierarchical/flat datasets
      this.toggleAllHierarchicalTree(
        this.sharedService.hierarchicalDataset || [],
        collapsing,
        childrenPropName,
        collapsedPropName,
        lazyLoadingPropName
      );
      this.toggleAllFlatDataItems(collapsing, hasChildrenPropName, lazyLoadingPropName);

      this.dataView.endUpdate();
      this.dataView.refresh();
      this._isLastFullToggleCollapsed = collapsing;
    }

    const toggleType: ToggleStateChangeType = collapsing ? 'full-collapse' : 'full-expand';

    this._lastToggleStateChange = {
      type: toggleType,
      previousFullToggleType: toggleType,
      toggledItems: null,
    } as TreeToggleStateChange;

    // emit an event when full toggle ends
    if (shouldTriggerEvent) {
      this.pubSubService.publish('onTreeFullToggleEnd', this._lastToggleStateChange);
    }
  }

  // --
  // protected functions
  // ------------------

  // allow expand if it isn't using lazy loading OR it the lazy node was already loaded
  protected checkIsLazyParentLoaded(item: any, collapsing: boolean, lazyLoadingPropName: string): boolean {
    return collapsing || !this.treeDataOptions?.lazy || (!collapsing && !(this.treeDataOptions.lazy && !item[lazyLoadingPropName]));
  }

  protected handleOnCellClick(event: SlickEventData, args: OnClickEventArgs): void {
    if (event && args) {
      const targetElm: any = event.target || {};
      const collapsedPropName = getTreeDataOptionPropName(this.treeDataOptions, 'collapsedPropName');
      const childrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'childrenPropName');
      const hasChildrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'hasChildrenPropName');
      const lazyLoadingPropName = getTreeDataOptionPropName(this.treeDataOptions, 'lazyLoadingPropName');

      if (typeof targetElm?.className === 'string') {
        const hasToggleClass = targetElm.className.indexOf('toggle') >= 0 || false;
        if (hasToggleClass) {
          const item = this.dataView.getItem(args.row);
          if (item) {
            item[collapsedPropName] = !item[collapsedPropName]; // toggle the collapsed flag
            const isCollapsed = item[collapsedPropName];
            const itemId = item[this.datasetIdPropName];
            const parentFoundIdx = this._currentToggledItems.findIndex((treeChange) => treeChange.itemId === itemId);
            if (parentFoundIdx >= 0) {
              this._currentToggledItems[parentFoundIdx].isCollapsed = isCollapsed;
            } else {
              this._currentToggledItems.push({ itemId, isCollapsed });
            }

            this.dataView.updateItem(itemId, item);

            // since we always keep 2 arrays as reference (flat + hierarchical)
            // we also need to update the hierarchical array with the new toggle flag
            const searchTreePredicate = (treeItemToSearch: any) => treeItemToSearch[this.datasetIdPropName] === itemId;
            const treeItemFound = findItemInTreeStructure(
              this.sharedService.hierarchicalDataset || [],
              searchTreePredicate,
              childrenPropName
            );
            if (treeItemFound) {
              if (!this.treeDataOptions?.lazy) {
                treeItemFound[collapsedPropName] = isCollapsed;
              } else if (typeof this.treeDataOptions.onLazyLoad === 'function' && !isCollapsed) {
                // execute lazy fetch but only if there wasn't any "__lazyLoading" props on the item
                if (!treeItemFound?.[lazyLoadingPropName] || (treeItemFound[lazyLoadingPropName] as LAZY_TYPES) === 'load-fail') {
                  // 1. change execution to "loading" which is used to show a "loading" icon instead of the open toggle group icon
                  this.dataView?.updateItem(treeItemFound[this.datasetIdPropName], {
                    ...treeItemFound,
                    [lazyLoadingPropName]: 'loading' as LAZY_TYPES,
                    [collapsedPropName]: true, // keep parent collapse until fetch resolves
                    [hasChildrenPropName]: true,
                  });

                  // 2. execute end user lazy fetching of children items
                  //    the 2nd arg callback is the data resolver which we'll use to push the data to the node children prop
                  //    the 3rd arg callback is executed when lazy fetch fails
                  const previousFilters = this.filterService.getPreviousFilters();
                  this.treeDataOptions.onLazyLoad(
                    treeItemFound,
                    // 2.1 resolve callback (lazily fetch node children)
                    (data) => {
                      // time to expand the parent
                      treeItemFound[collapsedPropName] = false;

                      if (data.length) {
                        // we need to collapse all nodes of that new data tree for next lazy node to work
                        data.forEach((newItem) => {
                          if (newItem[childrenPropName]) {
                            newItem[collapsedPropName] = true;
                          }
                        });

                        // we got data, we need to resort hierarchical data then re-update the flat dataset
                        treeItemFound[childrenPropName] ??= [];
                        treeItemFound[childrenPropName].push(...data);
                        treeItemFound[lazyLoadingPropName] = 'done' as LAZY_TYPES;
                        const sortColumns = this.sortService.getCurrentColumnSorts();
                        const updatedCollection = this.sortService.sortHierarchicalDataset(
                          this.sharedService.hierarchicalDataset || [],
                          sortColumns
                        );
                        this.dataView?.setItems(updatedCollection.flat, this.datasetIdPropName);
                      } else {
                        // no data to push to children array, we can simply update the item to replace loading icon back to the toggle group icon
                        this.dataView?.updateItem(treeItemFound[this.datasetIdPropName], {
                          ...treeItemFound,
                          [lazyLoadingPropName]: 'done' as LAZY_TYPES,
                          [hasChildrenPropName]: true,
                        });
                      }

                      // if there's any filters prior to lazily open the tree node, we need to reapply them
                      // otherwise call the Tree Data refresh
                      if (previousFilters.length) {
                        this.filterService.updateFilters(previousFilters);
                      } else {
                        this.filterService.refreshTreeDataFilters();
                      }
                    },
                    // 2.2 reject failure callback (lazy fetch fails)
                    () => {
                      this.dataView?.updateItem(treeItemFound[this.datasetIdPropName], {
                        ...treeItemFound,
                        [lazyLoadingPropName]: 'load-fail' as LAZY_TYPES,
                        [hasChildrenPropName]: true,
                      });
                    }
                  );
                }
              }
            }

            // and finally we can invalidate the grid to re-render the UI
            this._grid.invalidate();

            this._lastToggleStateChange = {
              type: isCollapsed ? 'toggle-collapse' : 'toggle-expand',
              previousFullToggleType: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
              toggledItems: this._currentToggledItems,
            };
            this.pubSubService.publish('onTreeItemToggled', {
              ...this._lastToggleStateChange,
              fromItemId: itemId,
            } as TreeToggleStateChange);
          }
          event.stopImmediatePropagation();
        }
      }
    }
  }

  /**
   * Toggle an item in the flat dataset and update it in the grid.
   * NOTE: We should update the Tree Data collapse status (shouldUpdateTree=true) ONLY when toggling 1 item at a time,
   * however for toggle a batch (i.e. collapse all), we'll want to convert skip updating the tree but rather convert from flat to tree which is much quicker to execute.
   */
  protected updateToggledItem(item: any, isCollapsed: boolean, shouldUpdateTree: boolean): void {
    const childrenPropName = getTreeDataOptionPropName(this.treeDataOptions, 'childrenPropName');
    const collapsedPropName = getTreeDataOptionPropName(this.treeDataOptions, 'collapsedPropName');

    if (item) {
      // update the flat dataset item
      item[collapsedPropName] = isCollapsed;
      this.dataView.updateItem(item[this.datasetIdPropName], item);

      // also update the hierarchical tree item
      if (shouldUpdateTree) {
        const searchTreePredicate = (treeItemToSearch: any) => treeItemToSearch[this.datasetIdPropName] === item[this.datasetIdPropName];
        const treeItemFound = findItemInTreeStructure(this.sharedService.hierarchicalDataset || [], searchTreePredicate, childrenPropName);
        if (treeItemFound) {
          treeItemFound[collapsedPropName] = isCollapsed;
        }
      }
    }
  }

  /**
   * When using Tree Data with Aggregator and auto-recalc flag is enabled, we will define a callback handler
   * @return {Function | undefined} Tree Data totals recalculate callback when enabled
   */
  protected setAutoRecalcTotalsCallbackWhenFeatEnabled(gridOptions: GridOption): (() => void) | null {
    // when using Tree Data with Aggregators, we might need to auto-recalc when necessary flag is enabled
    if (
      gridOptions?.enableTreeData &&
      gridOptions?.treeDataOptions?.autoRecalcTotalsOnFilterChange &&
      gridOptions?.treeDataOptions?.aggregators
    ) {
      return this.recalculateTreeTotals.bind(this, gridOptions);
    }
    return null;
  }

  /**
   * Toggle all items of a hierarchical (tree) dataset, user must provide the children, collapsed & lazyCollapsing property names
   * NOTE: this does NOT change or update the flat dataset, it only changes the collapsed flag in the hierarchical tree only without updating the grid.
   */
  protected toggleAllHierarchicalTree(
    hierarchicalData: any[],
    collapsing: boolean,
    childrenPropName: string,
    collapsedPropName: string,
    lazyLoadingPropName: string
  ): void {
    hierarchicalData.forEach((item) => {
      if (childrenPropName in item && this.checkIsLazyParentLoaded(item, collapsing, lazyLoadingPropName)) {
        item[collapsedPropName] = collapsing;
        this.toggleAllHierarchicalTree(item[childrenPropName], collapsing, childrenPropName, collapsedPropName, lazyLoadingPropName);
      }
    });
  }

  /**
   * Toggle all items of a flat dataset, user must provide the hasChildrenPropName & lazyLoadingPropName property names
   * NOTE: this does NOT change or update the hierarchical dataset, it only changes the collapsed flag in the flat dataset only without updating the grid.
   */
  protected toggleAllFlatDataItems(collapsing: boolean, hasChildrenPropName: string, lazyLoadingPropName: string): void {
    // toggle the collapsed flag but only when it's a parent item with children
    const flatDataItems = this.dataView.getItems() || [];
    flatDataItems.forEach((item: any) => {
      if (item[hasChildrenPropName] && this.checkIsLazyParentLoaded(item, collapsing, lazyLoadingPropName)) {
        this.updateToggledItem(item, collapsing, false);
      }
    });
  }
}
