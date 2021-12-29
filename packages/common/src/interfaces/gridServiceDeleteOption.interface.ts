export interface GridServiceDeleteOption {
  /** Defaults to false, should we skip error thrown? */
  skipError?: boolean;

  /** Defaults to true, trigger an onItemDeleted event after the delete */
  triggerEvent?: boolean;
}
