export interface EditController {
  /** Commit Current Editor command */
  commitCurrentEdit: () => boolean;

  /** Cancel Current Editor command */
  cancelCurrentEdit: () => boolean;
}
