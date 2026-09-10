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

  /** Defaults to "Pin Through Here (left)" */
  pinningColumnsLeftCommand?: string;

  /** Defaults to "Pin Through Here (right)" */
  pinningColumnsRightCommand?: string;

  /** @deprecated Use `pinningColumnsLeftCommand` instead. */
  pinningColumnsCommand?: string;

  /** Defaults to "Column Pinning" for the pinning submenu. */
  pinColumnCommand?: string;

  /** Defaults to "Pin Left" */
  pinLeftCommand?: string;

  /** Defaults to "Pin Right" */
  pinRightCommand?: string;

  /** @deprecated Retained for compatibility; use the PIN_COLUMNS_LEFT/PIN_COLUMNS_RIGHT locale keys. */
  pinningColumnsCommandKey?: string;

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

  /** Defaults to "Unpin All Columns" */
  unpinningColumnsCommand?: string;

  /** Label for the unpin-column command. */
  unpinColumnCommand?: string;

  /** Defaults to "UNPIN_COLUMNS" translation key */
  unpinningColumnsCommandKey?: string;
}
