export interface GridServiceDeleteOption {
  /** Defaults to false, should we skip error thrown? */
  skipError?: boolean;

  /** Defaults to true, trigger an onItemsDeleted event after the delete */
  triggerEvent?: boolean;
}
