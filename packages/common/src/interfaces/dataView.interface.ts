import { Grouping } from './grouping.interface';
import { SlickEvent } from './slickEvent.interface';

export interface PagingInfo {
  pageSize: number;
  pageNum: number;
  totalRows?: number;
  totalPages?: number;
  dataView?: DataView;
}

export interface DataView {
  // --
  // Available Methods

  /** Begin Data Update Transaction */
  beginUpdate: () => void;

  /** End Data Update Transaction */
  endUpdate: () => void;

  setRefreshHints: (hints: any) => void;

  /** Set extra Filter arguments which will be used by the Filter method */
  setFilterArgs: (args: any) => void;

  /** Update a specific Index */
  updateIdxById: (startingIndex: number) => void;

  /** Get all Dataset Items */
  getItems: () => any[];

  /** Get the DataView Id property name to use (defaults to "Id" but could be customized to something else when instantiating the DataView) */
  getIdPropertyName: () => string;

  /** Set the Items with a new Dataset and optionally pass a different Id property name */
  setItems: (data: any[], objectIdProperty?: string) => void;

  /** Get Paging Options */
  getPagingInfo: () => PagingInfo;

  /** Set Paging Options */
  setPagingOptions: (args: PagingInfo) => void;

  /** Sort Method to use by the DataView */
  // eslint-disable-next-line @typescript-eslint/ban-types
  sort: (comparer: Function, ascending?: boolean) => void;

  /**
   * Provides a workaround for the extremely slow sorting in IE.
   * Does a [lexicographic] sort on a give column by temporarily overriding Object.prototype.toString
   * to return the value of that field and then doing a native Array.sort().
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  fastSort: (field: string | Function, ascending: boolean) => void;

  /** Re-Sort the dataset */
  reSort: () => void;

  /** Get only the dataset filtered items */
  getFilteredItems: () => any[];

  /** Get current Filter used:  by the DataView */
  getFilter: () => any;

  /** Set a Filter that:  will be used by the DataView */
  // eslint-disable-next-line @typescript-eslint/ban-types
  setFilter: (filterFn: Function) => void;

  /** Get current Grouping info */
  getGrouping: () => Grouping[];

  /** Set some Grouping */
  setGrouping: (groupingInfo: Grouping | Grouping[]) => void;

  /** Get an item in the dataset by its row index */
  getItemByIdx: (idx: number) => number;

  /** Get row index in the dataset by its Id */
  getIdxById: (id: string | number) => number;

  /** Get row number of an item in the dataset */
  getRowByItem: (item: any) => number;

  /** Get row number of an item in the dataset by its Id */
  getRowById: (id: string | number) => number;

  /** Get an item in the dataset by its Id */
  getItemById: (id: string | number) => any;

  /** From the items array provided, return the mapped rows */
  mapItemsToRows: (items: any[]) => any[];

  /** From the Ids array provided, return the mapped rows */
  mapIdsToRows: (ids: Array<number | string>) => Array<number>;

  /** From the rows array provided, return the mapped Ids */
  mapRowsToIds: (rows: Array<number>) => Array<number | string>;

  /** Update an item in the dataset by its Id */
  updateItem: (id: string | number, item: any) => void;

  /** Insert an item to the dataset before a specific index */
  insertItem: (insertBefore: number, item: any) => void;

  /** Add an item to the dataset */
  addItem: (item: any) => void;

  /** Delete an item from the dataset */
  deleteItem: (id: string | number) => void;

  /** Add an item in a sorted dataset (a Sort function must be defined) */
  sortedAddItem: (item: any) => void;

  /** Update an item in a sorted dataset (a Sort function must be defined) */
  sortedUpdateItem: (id: string | number, item: number) => void;

  /** Get the sorted index of the item to search */
  sortedIndex: (searchItem: any) => number;

  /** Get dataset length */
  getLength: () => number;

  /** Get dataset item at specific index */
  getItem: (index: number) => any;

  /** Get item metadata at specific index */
  getItemMetadata: (index: number) => any;

  /** Expand or Collapse all Groups */
  expandCollapseAllGroups: (level: number, collapse: boolean) => void;

  /** Collapse all Groups, optionally pass a level number to only collapse that level */
  collapseAllGroups: (level?: number) => void;

  /** Expand all Groups, optionally pass a level number to only expand that level */
  expandAllGroups: (level?: number) => void;

  /** Expand or Collapse a specific Group by its grouping key */
  expandCollapseGroup: (level: number, groupingKey: string | number, collapse: boolean) => void;

  /**
   * Collapse a Group by passing either a Slick.Group's "groupingKey" property, or a
   * variable argument list of grouping values denoting a unique path to the row.
   * For example, calling collapseGroup('high', '10%') will collapse the '10%' subgroup of the 'high' group.
   */
  collapseGroup: (...args: any) => void;

  /**
   * Expand a Group by passing either a Slick.Group's "groupingKey" property, or a
   * variable argument list of grouping values denoting a unique path to the row.
   * For example, calling collapseGroup('high', '10%') will collapse the '10%' subgroup of the 'high' group.
   */
  expandGroup: (...args: any) => void;

  /** Get current Grouping groups */
  getGroups: () => any[];

  /** Refresh the DataView */
  refresh: () => void;

  /**
   * Wires the grid and the DataView together to keep row selection tied to item ids.
   * This is useful since, without it, the grid only knows about rows, so if the items
   * move around, the same rows stay selected instead of the selection moving along
   * with the items.
   *
   * NOTE:  This doesn't work with cell selection model.
   *
   * @param grid {Slick.Grid} The grid to sync selection with.
   * @param preserveHidden {Boolean} Whether to keep selected items that go out of the
   *     view due to them getting filtered out.
   * @param preserveHiddenOnSelectionChange {Boolean} Whether to keep selected items
   *     that are currently out of the view (see preserveHidden) as selected when selection
   *     changes.
   * @return {Slick.Event} An event that notifies when an internal list of selected row ids
   *     changes.  This is useful since, in combination with the above two options, it allows
   *     access to the full list selected row ids, and not just the ones visible to the grid.
   */
  syncGridSelection: (grid: any, preserveHidden: boolean, preserveHiddenOnSelectionChange?: boolean) => SlickEvent;

  syncGridCellCssStyles: (grid: any, key: string) => void;

  // --
  // Available Events

  /** Event triggered when "setItems" function is called */
  onSetItemsCalled: SlickEvent;

  /** Event triggered when the dataset row count changes */
  onRowCountChanged: SlickEvent;

  /** Event triggered when any of the row got changed */
  onRowsChanged: SlickEvent;

  /** Event triggered when the  dataset row count changes OR any of the row got changed */
  onRowsOrCountChanged: SlickEvent;

  /** Event triggered when before Paging Info got changed */
  onBeforePagingInfoChanged: SlickEvent;

  /** Event triggered while Paging Info is getting changed */
  onPagingInfoChanged: SlickEvent;

  /** Event triggered while Grouping is Expanding */
  onGroupExpanded: SlickEvent;

  /** Event triggered while Grouping is Collapsing */
  onGroupCollapsed: SlickEvent;
}
