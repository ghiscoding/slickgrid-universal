export interface GridServiceUpdateOption {
  /** Defaults to true, highlight the row(s) in the grid after update */
  highlightRow?: boolean;

  /** Defaults to false, select the row(s) in the grid after update */
  selectRow?: boolean;

  /** Defaults to false, scroll to the row so that it shows up in the Viewport (UI) */
  scrollRowIntoView?: boolean;

  /** Defaults to false, should we skip error thrown? */
  skipError?: boolean;

  /** Defaults to true, trigger an onItemsUpdated event after the update */
  triggerEvent?: boolean;
}
