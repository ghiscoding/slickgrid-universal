import { Constants } from '../constants';
import { ToggleStateChangeType, ToggleStateChangeTypeString } from '../enums/index';
import {
  Column,
  ColumnSort,
  EventSubscription,
  GetSlickEventType,
  GridOption,
  OnClickEventArgs,
  SlickDataView,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  TreeDataOption,
  TreeToggledItem,
  TreeToggleStateChange,
} from '../interfaces/index';
import { findItemInTreeStructure, unflattenParentChildArrayToTree } from './utilities';
import { PubSubService } from './pubSub.service';
import { SharedService } from './shared.service';
import { SortService } from './sort.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class TreeDataService {
  protected _isLastFullToggleCollapsed = false;
  protected _lastToggleStateChange!: Omit<TreeToggleStateChange, 'fromItemId'>;
  protected _currentToggledItems: TreeToggledItem[] = [];
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;
  protected _subscriptions: EventSubscription[] = [];

  constructor(protected readonly pubSubService: PubSubService, protected readonly sharedService: SharedService, protected readonly sortService: SortService) {
    this._eventHandler = new Slick.EventHandler();
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
    return this._grid?.getData?.() ?? {} as SlickDataView;
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions?.() ?? {};
  }

  get treeDataOptions(): TreeDataOption {
    return this.gridOptions.treeDataOptions as TreeDataOption;
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._isLastFullToggleCollapsed = this.gridOptions?.treeDataOptions?.initiallyCollapsed ?? false;
    this._currentToggledItems = this.gridOptions.presets?.treeData?.toggledItems ?? [];
    this._lastToggleStateChange = {
      type: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
      previousFullToggleType: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
      toggledItems: this._currentToggledItems
    };

    // there's a few limitations with Tree Data, we'll just throw error when that happens
    if (this.gridOptions?.enableTreeData) {
      if (this.gridOptions?.multiColumnSort) {
        throw new Error('[Slickgrid-Universal] It looks like you are trying to use Tree Data with multi-column sorting, unfortunately it is not supported because of its complexity, you can disable it via "multiColumnSort: false" grid option and/or help in providing support for this feature.');
      }

      if (!this.gridOptions?.enableFiltering) {
        throw new Error('[Slickgrid-Universal] It looks like you are trying to use Tree Data without using the filtering option, unfortunately that is not possible with Tree Data since it relies heavily on the filters to expand/collapse the tree. You need to enable it via "enableFiltering: true"');
      }

      if (this.gridOptions?.backendServiceApi || this.gridOptions?.enablePagination) {
        throw new Error('[Slickgrid-Universal] It looks like you are trying to use Tree Data with Pagination and/or a Backend Service (OData, GraphQL) but unfortunately that is simply not supported because of its complexity.');
      }

      if (!this.gridOptions.treeDataOptions || !this.gridOptions.treeDataOptions.columnId) {
        throw new Error('[Slickgrid-Universal] When enabling tree data, you must also provide the "treeDataOption" property in your Grid Options with "childrenPropName" or "parentPropName" (depending if your array is hierarchical or flat) for the Tree Data to work properly.');
      }
    }

    // subscribe to the SlickGrid event and call the backend execution
    const onClickHandler = grid.onClick;
    if (onClickHandler) {
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onClickHandler>>).subscribe(onClickHandler, this.handleOnCellClick.bind(this));
    }

    // when "Clear all Sorting" is triggered by the Grid Menu, we'll resort with `initialSort` when defined (or else by 'id')
    this._subscriptions.push(
      this.pubSubService.subscribe('onGridMenuClearAllSorting', this.clearSorting.bind(this))
    );
  }

  /**
   * Apply different tree toggle state changes (to ALL rows, the entire dataset) by providing an array of parentIds that are designated as collapsed (or not).
   * User will have to provide an array of `parentId` and `isCollapsed` boolean and the code will only apply the ones that are tagged as collapsed, everything else will be expanded
   * @param {Array<TreeToggledItem>} treeToggledItems - array of parentId which are tagged as changed
   * @param {ToggleStateChangeType} previousFullToggleType - optionally provide the previous full toggle type ('full-expand' or 'full-collapse')
   * @param {Boolean} shouldPreProcessFullToggle - should we pre-process a full toggle on all items? defaults to True
   * @param {Boolean} shouldTriggerEvent - should we trigger a toggled item event? defaults to False
   */
  applyToggledItemStateChanges(treeToggledItems: TreeToggledItem[], previousFullToggleType?: Extract<ToggleStateChangeType, 'full-collapse' | 'full-expand'> | Extract<ToggleStateChangeTypeString, 'full-collapse' | 'full-expand'>, shouldPreProcessFullToggle = true, shouldTriggerEvent = false) {
    if (Array.isArray(treeToggledItems)) {
      const collapsedPropName = this.getTreeDataOptionPropName('collapsedPropName');
      const hasChildrenPropName = this.getTreeDataOptionPropName('hasChildrenPropName');

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
  dynamicallyToggleItemState(treeToggledItems: TreeToggledItem[], shouldTriggerEvent = true) {
    if (Array.isArray(treeToggledItems)) {
      // for the rows we identified as collapsed, we'll send them to the DataView with the new updated collapsed flag
      // and we'll refresh the DataView to see the collapsing applied in the grid
      this.dataView.beginUpdate(true);

      // then we reapply only the ones that changed (provided as argument to the function)
      for (const collapsedItem of treeToggledItems) {
        const item = this.dataView.getItemById(collapsedItem.itemId);
        this.updateToggledItem(item, collapsedItem.isCollapsed);

        if (shouldTriggerEvent) {
          const parentFoundIdx = this._currentToggledItems.findIndex(treeChange => treeChange.itemId === collapsedItem.itemId);
          if (parentFoundIdx >= 0) {
            this._currentToggledItems[parentFoundIdx].isCollapsed = collapsedItem.isCollapsed;
          } else {
            this._currentToggledItems.push({ itemId: collapsedItem.itemId, isCollapsed: collapsedItem.isCollapsed });
          }

          this.pubSubService.publish('onTreeItemToggled', {
            ...this._lastToggleStateChange,
            fromItemId: collapsedItem.itemId,
            toggledItems: this._currentToggledItems,
            type: collapsedItem.isCollapsed ? ToggleStateChangeType.toggleCollapse : ToggleStateChangeType.toggleExpand
          } as TreeToggleStateChange);
        }
      }

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

  getInitialSort(columnDefinitions: Column[], gridOptions: GridOption): ColumnSort {
    const treeDataOptions = gridOptions?.treeDataOptions;
    const initialColumnSorting = treeDataOptions?.initialSort ?? { columnId: treeDataOptions?.columnId ?? '', direction: 'ASC' };
    const initialSortColumn = columnDefinitions.find(col => col.id === initialColumnSorting.columnId);

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
  getItemCount(treeLevel?: number) {
    if (treeLevel !== undefined) {
      const levelPropName = this.getTreeDataOptionPropName('levelPropName');
      return this.dataView.getItems().filter(dataContext => dataContext[levelPropName] === treeLevel).length;
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

  /** Find the associated property name from the Tree Data option when found or return a default property name that we defined internally */
  getTreeDataOptionPropName(optionName: keyof TreeDataOption): string {
    let propName = '';
    switch (optionName) {
      case 'childrenPropName':
        propName = this.treeDataOptions?.childrenPropName ?? Constants.treeDataProperties.CHILDREN_PROP;
        break;
      case 'collapsedPropName':
        propName = this.treeDataOptions?.collapsedPropName ?? Constants.treeDataProperties.COLLAPSED_PROP;
        break;
      case 'hasChildrenPropName':
        propName = this.treeDataOptions?.hasChildrenPropName ?? Constants.treeDataProperties.HAS_CHILDREN_PROP;
        break;
      case 'identifierPropName':
        propName = this.treeDataOptions?.identifierPropName ?? this.gridOptions?.datasetIdPropertyName ?? 'id';
        break;
      case 'levelPropName':
        propName = this.treeDataOptions?.levelPropName ?? Constants.treeDataProperties.TREE_LEVEL_PROP;
        break;
      case 'parentPropName':
        propName = this.treeDataOptions?.parentPropName ?? Constants.treeDataProperties.PARENT_PROP;
        break;
    }
    return propName;
  }

  /** Clear the sorting and set it back to initial sort */
  clearSorting() {
    const initialSort = this.getInitialSort(this.sharedService.columnDefinitions, this.sharedService.gridOptions);
    this.sortService.loadGridSorters([{ columnId: initialSort.columnId, direction: initialSort.sortAsc ? 'ASC' : 'DESC' }]);
  }

  /**
   * Takes a flat dataset, converts it into a hierarchical dataset, sort it by recursion and finally return back the final and sorted flat array
   * @param {Array<Object>} flatDataset - parent/child flat dataset
   * @param {Object} gridOptions - grid options
   * @returns {Array<Object>} - tree dataset
   */
  convertFlatParentChildToTreeDatasetAndSort<P, T extends P & { [childrenPropName: string]: T[] }>(flatDataset: P[], columnDefinitions: Column[], gridOptions: GridOption) {
    // 1- convert the flat array into a hierarchical array
    const datasetHierarchical = this.convertFlatParentChildToTreeDataset(flatDataset, gridOptions);

    // 2- sort the hierarchical array recursively by an optional "initialSort" OR if nothing is provided we'll sort by the column defined as the Tree column
    // also note that multi-column is not currently supported with Tree Data
    const columnSort = this.getInitialSort(columnDefinitions, gridOptions);
    const datasetSortResult = this.sortService.sortHierarchicalDataset(datasetHierarchical, [columnSort], true);

    // and finally add the sorting icon (this has to be done manually in SlickGrid) to the column we used for the sorting
    this._grid?.setSortColumns([columnSort]);

    return datasetSortResult;
  }

  /**
   * Takes a flat dataset, converts it into a hierarchical dataset
   * @param {Array<Object>} flatDataset - parent/child flat dataset
   * @param {Object} gridOptions - grid options
   * @returns {Array<Object>} - tree dataset
   */
  convertFlatParentChildToTreeDataset<P, T extends P & { [childrenPropName: string]: P[] }>(flatDataset: P[], gridOptions: GridOption): T[] {
    const dataViewIdIdentifier = gridOptions?.datasetIdPropertyName ?? 'id';
    const treeDataOpt: TreeDataOption = gridOptions?.treeDataOptions ?? { columnId: 'id' };
    const treeDataOptions = {
      ...treeDataOpt,
      identifierPropName: treeDataOpt.identifierPropName ?? dataViewIdIdentifier,
      initiallyCollapsed: this._isLastFullToggleCollapsed, // use the last full toggled flag so that if we replace the entire dataset we will still use the last toggled flag (this flag is also initialized with `initiallyCollapsed` when provided)
    };
    return unflattenParentChildArrayToTree(flatDataset, treeDataOptions);
  }

  /**
   * Takes a hierarchical (tree) input array and sort it (if an `initialSort` exist, it will use that to sort)
   * @param {Array<Object>} hierarchicalDataset - inpu
   * @returns {Object} sort result object that includes both the flat & tree data arrays
   */
  sortHierarchicalDataset<T>(hierarchicalDataset: T[], inputColumnSorts?: ColumnSort | ColumnSort[]) {
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
      const hasChildrenPropName = this.getTreeDataOptionPropName('hasChildrenPropName');

      // emit an event when full toggle starts (useful to show a spinner)
      if (shouldTriggerEvent) {
        await this.pubSubService.publish('onTreeFullToggleStart', { collapsing });
      }

      // do a bulk change data update to toggle all necessary parents (the ones with children) to the new collapsed flag value
      this.dataView.beginUpdate(true);

      // toggle the collapsed flag but only when it's a parent item with children
      (this.dataView.getItems() || []).forEach((item: any) => {
        if (item[hasChildrenPropName]) {
          this.updateToggledItem(item, collapsing);
        }
      });

      this.dataView.endUpdate();
      this.dataView.refresh();
      this._isLastFullToggleCollapsed = collapsing;
    }

    const toggleType = collapsing ? ToggleStateChangeType.fullCollapse : ToggleStateChangeType.fullExpand;

    this._lastToggleStateChange = {
      type: toggleType,
      previousFullToggleType: toggleType,
      toggledItems: null
    } as TreeToggleStateChange;

    // emit an event when full toggle ends
    if (shouldTriggerEvent) {
      this.pubSubService.publish('onTreeFullToggleEnd', this._lastToggleStateChange);
    }
  }

  // --
  // protected functions
  // ------------------

  protected handleOnCellClick(event: SlickEventData, args: OnClickEventArgs) {
    if (event && args) {
      const targetElm: any = event.target || {};
      const idPropName = this.gridOptions.datasetIdPropertyName ?? 'id';
      const collapsedPropName = this.getTreeDataOptionPropName('collapsedPropName');
      const childrenPropName = this.getTreeDataOptionPropName('childrenPropName');

      if (targetElm?.className) {
        const hasToggleClass = targetElm.className.indexOf('toggle') >= 0 || false;
        if (hasToggleClass) {
          const item = this.dataView.getItem(args.row);
          if (item) {
            item[collapsedPropName] = !item[collapsedPropName]; // toggle the collapsed flag
            const isCollapsed = item[collapsedPropName];
            const itemId = item[idPropName];
            const parentFoundIdx = this._currentToggledItems.findIndex(treeChange => treeChange.itemId === itemId);
            if (parentFoundIdx >= 0) {
              this._currentToggledItems[parentFoundIdx].isCollapsed = isCollapsed;
            } else {
              this._currentToggledItems.push({ itemId, isCollapsed });
            }

            this.dataView.updateItem(itemId, item);

            // since we always keep 2 arrays as reference (flat + hierarchical)
            // we also need to update the hierarchical array with the new toggle flag
            const searchTreePredicate = (treeItemToSearch: any) => treeItemToSearch[idPropName] === itemId;
            const treeItemFound = findItemInTreeStructure(this.sharedService.hierarchicalDataset || [], searchTreePredicate, childrenPropName);
            if (treeItemFound) {
              treeItemFound[collapsedPropName] = isCollapsed;
            }

            // and finally we can invalidate the grid to re-render the UI
            this._grid.invalidate();

            this._lastToggleStateChange = {
              type: isCollapsed ? ToggleStateChangeType.toggleCollapse : ToggleStateChangeType.toggleExpand,
              previousFullToggleType: this._isLastFullToggleCollapsed ? 'full-collapse' : 'full-expand',
              toggledItems: this._currentToggledItems
            };
            this.pubSubService.publish('onTreeItemToggled', { ...this._lastToggleStateChange, fromItemId: itemId } as TreeToggleStateChange);
          }
          event.stopImmediatePropagation();
        }
      }
    }
  }

  protected updateToggledItem(item: any, isCollapsed: boolean) {
    const dataViewIdIdentifier = this.gridOptions?.datasetIdPropertyName ?? 'id';
    const childrenPropName = this.getTreeDataOptionPropName('childrenPropName');
    const collapsedPropName = this.getTreeDataOptionPropName('collapsedPropName');

    if (item) {
      // update the flat dataset item
      item[collapsedPropName] = isCollapsed;
      this.dataView.updateItem(item[dataViewIdIdentifier], item);

      // also update the hierarchical tree item
      const searchTreePredicate = (treeItemToSearch: any) => treeItemToSearch[dataViewIdIdentifier] === item[dataViewIdIdentifier];
      const treeItemFound = findItemInTreeStructure(this.sharedService.hierarchicalDataset || [], searchTreePredicate, childrenPropName);
      if (treeItemFound) {
        treeItemFound[collapsedPropName] = isCollapsed;
      }
    }
  }
}
