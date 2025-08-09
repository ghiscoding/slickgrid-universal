/** @deprecated @use grid state type as string instead (ie: `GridStateType.columns` => 'columns', `GridStateType.rowSelection` => 'rowSelection') */
export enum GridStateType {
  columns = 'columns',
  filter = 'filter',
  pagination = 'pagination',
  pinning = 'pinning',
  rowSelection = 'rowSelection',
  sorter = 'sorter',
  treeData = 'treeData',
}

/** GridState properties */
export type GridStateTypeString =
  /** List of Current Visible Columns in the grid, including these props (`columnId`, `cssClass`, `headerCssClass`, `width`) */
  | 'columns'
  /** List of Current Filters including these props (`columnId`, `operator`, `searchTerms`, `targetSelector`, `verbatimSearchTerms`) */
  | 'filter'
  /** List of Current Grouping column IDs. NOTE: Grid Presets for Grouping is only available when using `DraggableGrouping` */
  | 'grouping'
  /** List of Current Pagination including these props (`pageNumber`, `pageSize`) */
  | 'pagination'
  /** List of Current Pinning including these props (`frozenBottom`, `frozenColumn`, `frozenRow`) */
  | 'pinning'
  /** List of Current Row Selections including these props (`gridRowIndexes`, `dataContextIds`, `filteredDataContextIds`) */
  | 'rowSelection'
  /** List of Current Sorted Columns including these props (`columnId`, `direction`) */
  | 'sorter'
  /** List of Current Sorted Columns including these props (`type`, `toggledItems`, `previousFullToggleType`) */
  | 'treeData';
