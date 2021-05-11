import { Column, ColumnSort, GetSlickEventType, GridOption, OnClickEventArgs, SlickDataView, SlickEventData, SlickEventHandler, SlickGrid, SlickNamespace, TreeDataOption, } from '../interfaces/index';
import { unflattenParentChildArrayToTree } from './utilities';
import { PubSubService } from './pubSub.service';
import { SharedService } from './shared.service';
import { SortService } from './sort.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class TreeDataService {
  private _grid!: SlickGrid;
  private _eventHandler: SlickEventHandler;

  constructor(private pubSubService: PubSubService, private sharedService: SharedService, private sortService: SortService) {
    this._eventHandler = new Slick.EventHandler();
  }

  get dataset(): any[] {
    return this.dataView?.getItems();
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return (this._grid?.getData && this._grid.getData()) as SlickDataView;
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions() || {};
  }

  dispose() {
    // unsubscribe all SlickGrid events
    if (this._eventHandler?.unsubscribeAll) {
      this._eventHandler.unsubscribeAll();
    }
  }

  init(grid: SlickGrid) {
    this._grid = grid;

    // there's a few limitations with Tree Data, we'll just throw error when that happens
    if (this.gridOptions?.enableTreeData) {
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
    const datasetSortResult = this.sortService.sortHierarchicalDataset(datasetHierarchical, [columnSort]);

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
    const treeDataOptions = { ...treeDataOpt, identifierPropName: treeDataOpt.identifierPropName ?? dataViewIdIdentifier };
    return unflattenParentChildArrayToTree(flatDataset, treeDataOptions);
  }

  handleOnCellClick(event: SlickEventData, args: OnClickEventArgs) {
    if (event && args) {
      const targetElm: any = event.target || {};
      const treeDataOptions = this.gridOptions.treeDataOptions;
      const collapsedPropName = treeDataOptions && treeDataOptions.collapsedPropName || '__collapsed';
      const idPropName = this.gridOptions.datasetIdPropertyName ?? 'id';

      if (targetElm && targetElm.className) {
        const hasToggleClass = targetElm.className.indexOf('toggle') >= 0 || false;
        if (hasToggleClass) {
          const item = this.dataView.getItem(args.row);
          if (item) {
            item[collapsedPropName] = !item[collapsedPropName] ? true : false;
            this.dataView.updateItem(item[idPropName], item);
            this._grid.invalidate();
          }
          event.stopImmediatePropagation();
        }
      }
    }
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

  toggleTreeDataCollapse(collapsing: boolean) {
    // emit an event when filters are all cleared
    this.pubSubService.publish('onBeforeToggleTreeCollapse', { collapsing });

    if (this.gridOptions) {
      const treeDataOptions = this.gridOptions.treeDataOptions;

      if (this.gridOptions.enableTreeData) {
        const items: any[] = this.dataView.getItems() || [];
        const collapsedPropName = treeDataOptions && treeDataOptions.collapsedPropName || '__collapsed';
        items.forEach((item: any) => item[collapsedPropName] = collapsing);
        this.dataView.setItems(items);
        this._grid.invalidate();
      }
    }

    this.pubSubService.publish('onToggleTreeCollapsed', { collapsing });
  }
}
