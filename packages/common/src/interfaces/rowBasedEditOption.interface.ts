import { OnEventArgs } from "./onEventArgs.interface";

export interface RowBasedEditOptions {
  /** the display name of the added actions column */
  actionsColumnLabel?: string;
  /** method called after row gets updated */
  onAfterRowUpdated?: (args: OnEventArgs) => void;
  /** whether multiple rows can be toggled into edit mode at the same itme (default: false) */
  allowMultipleRows?: boolean;
}