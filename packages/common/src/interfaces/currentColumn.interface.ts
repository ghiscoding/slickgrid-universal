import type { DockingSide } from './docking.interface.js';

export interface CurrentColumn {
  /** Column id (in the column definitions) */
  columnId: string;

  /** Column CSS Class  */
  cssClass?: string;

  /** Header CSS Class  */
  headerCssClass?: string;

  /** Column width */
  width?: number;

  /** Permanent pinning side for this column; `null` explicitly restores it to the center. */
  pinning?: DockingSide | null;

  /** when enabled, the "hidden" column property will be included (defaults to false) */
  hidden?: boolean;
}
