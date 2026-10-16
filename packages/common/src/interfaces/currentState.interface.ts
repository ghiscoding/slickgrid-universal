import type { OperatorType, SearchTerm } from '../enums/index.js';
import type { PinningOption } from './docking.interface.js';

/** Saved column layout. Permanent pinning is stored separately in GridState.pinning. */
export interface CurrentColumn {
  /** Column id (in the column definitions) */
  columnId: string;

  /** Column CSS Class  */
  cssClass?: string;

  /** Header CSS Class  */
  headerCssClass?: string;

  /** Column width */
  width?: number;

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

/**
 * Permanent pinning used by Grid State, presets, and change events.
 * Serialized state always includes all four side arrays: column IDs are strings, and row
 * references retain their configured index or ID form. The inherited PinningOption shape
 * also accepts numeric column boundaries/counts and index arrays when configuring presets.
 */
export interface CurrentPinning extends PinningOption {}
