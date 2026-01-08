import type { OperatorType } from '../enums/index.js';
import type { SearchTerm } from '../enums/searchTerm.type.js';

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
