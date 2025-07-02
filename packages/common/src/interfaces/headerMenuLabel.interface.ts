export interface HeaderMenuLabel {
  /** Defaults to "Remove Filter" */
  clearFilterCommand?: string;

  /** Defaults to "REMOVE_FILTER" translation key */
  clearFilterCommandKey?: string;

  /** Defaults to "Remove Sort" */
  clearSortCommand?: string;

  /** Defaults to "REMOVE_SORT" translation key */
  clearSortCommandKey?: string;

  /** Defaults to "Column Resize by Content" */
  columnResizeByContentCommand?: string;

  /** Defaults to "COLUMN_RESIZE_BY_CONTENT" translation key */
  columnResizeByContentCommandKey?: string;

  /** Defaults to "Filter Shortcuts" */
  filterShortcutsCommand?: string;

  /** Defaults to "FILTER_SHORTCUTS" translation key */
  filterShortcutsCommandKey?: string;

  /** Defaults to "Freeze Columns" */
  freezeColumnsCommand?: string;

  /** Defaults to "FREEZE_COLUMNS" translation key */
  freezeColumnsCommandKey?: string;

  /** Defaults to "Hide Column" */
  hideColumnCommand?: string;

  /** Defaults to "HIDE_COLUMN" translation key */
  hideColumnCommandKey?: string;

  /** Defaults to "Sort Ascending" */
  sortAscCommand?: string;

  /** Defaults to "SORT_ASCENDING" translation key */
  sortAscCommandKey?: string;

  /** Defaults to "Sort Descending" */
  sortDescCommand?: string;

  /** Defaults to "SORT_DESCENDING" translation key */
  sortDescCommandKey?: string;
}
