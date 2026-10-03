import type { DockingSide, PinningOption } from './docking.interface.js';
import type { OperatorType, SearchTerm } from '../enums/index.js';

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

export interface CurrentFilter {
  /**
   * Column Id that must be defined as a Column and exists in the Columns Definition array (column association is done through the "field" property).
   * Please note that it will parse through "queryField" if it is defined to find the targeted column.
   */
  columnId: string;

  /** Filter operator or use default operator when not provided */
  operator?: OperatorType;

  /** Filter search terms */
  searchTerms?: SearchTerm[];

  /** Target element selector from which the filter was triggered from. */
  targetSelector?: string;

  /**
   * When false, searchTerms may be manipulated to be functional with certain filters eg: string only filters.
   * When true, JSON.stringify is used on the searchTerms and used in the query "as-is". It is then the responsibility of the developer to sanitise the `searchTerms` property if necessary.
   */
  verbatimSearchTerms?: boolean;
}

export interface CurrentPagination {
  /** Grid page number */
  pageNumber: number;

  /** Grid page size */
  pageSize: number;
}

/** Current permanent pinning state used by GridState presets and change events. */
export interface CurrentPinning extends PinningOption {}