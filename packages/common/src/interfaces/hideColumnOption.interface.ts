export interface HideColumnOption {
  /** Defaults to true, do we want to call `grid.setColumns()` */
  applySetColumns?: boolean;

  /** Defaults to true, do we want to auto-resize (by calling `grid.autosizeColumns()`) the columns in the grid after hidding the column(s)? */
  autoResizeColumns?: boolean;

  /** Defaults to false, do we want to hide the column name from the column picker after hidding the column from the grid? */
  hideFromColumnPicker?: boolean;

  /** Defaults to false, do we want to hide the column name from the grid menu after hidding the column from the grid? */
  hideFromGridMenu?: boolean;

  /** Defaults to true, do we want to trigger an event "onHideColumns" after hidding the column(s)? */
  triggerEvent?: boolean;
}

export interface ShowColumnOption {
  /** Defaults to true, do we want to auto-resize (by calling `grid.autosizeColumns()`) the columns in the grid after hidding the column(s)? */
  autoResizeColumns?: boolean;

  /** Defaults to true, do we want to trigger an event "onShowColumns" after showing the column(s)? */
  triggerEvent?: boolean;
}
