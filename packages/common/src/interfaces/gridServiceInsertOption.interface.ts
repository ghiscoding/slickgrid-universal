export interface GridServiceInsertOption {
  /**
   * No Defaults, which position in the grid do we want to insert and show the new row (when defined it will insert at given grid position top/bottom).
   * When used in a regular grid, it will always insert on top of the grid unless defined otherwise, however in a Tree Data grid it will insert in defined parent group
   */
  position?: 'top' | 'bottom';

  /** Defaults to true, highlight the row(s) in the grid after insert */
  highlightRow?: boolean;

  /** Defaults to false, resort the grid after the insert */
  resortGrid?: boolean;

  /** Defaults to false, select the row(s) in the grid after insert */
  selectRow?: boolean;

  /** Defaults to false, should we skip error thrown? */
  skipError?: boolean;

  /** Defaults to true, after insert should we scroll to the inserted row position */
  scrollRowIntoView?: boolean;

  /** Defaults to true, trigger an onItemsAdded event after the insert */
  triggerEvent?: boolean;
}
