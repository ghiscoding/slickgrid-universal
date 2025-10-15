import type { FieldType, OperatorString, OperatorType } from '../enums/index.js';
import type { SearchTerm } from '../enums/searchTerm.type.js';
import type { Column } from './index.js';

export interface SearchColumnFilter {
  /** Column definition Id */
  columnId: string | number;

  /** Column definition */
  columnDef: Column;

  /**
   * Parsed Search Terms is similar to SearchTerms but is already parsed in the correct format,
   * for example on a date field the searchTerms might be in string format but their respective parsedSearchTerms will be of type Date
   */
  parsedSearchTerms?: SearchTerm | SearchTerm[];

  /** Search Terms to preload (collection), please note it is better to use the "presets" grid option which is more powerful. */
  searchTerms: SearchTerm[];

  /** Operator to use when filtering (>, >=, EQ, IN, ...) */
  operator?: OperatorType | OperatorString;

  /**
   * Useful when you want to display a certain field to the UI, but you want to use another field to query when Filtering/Sorting.
   * Please note that it has higher precendence over the "field" property.
   */
  queryField?: string;

  /** Last search input character when it is identified as "*" representing startsWith */
  searchInputLastChar?: string;

  /** What is the Field Type that can be used by the Filter (as precedence over the "type" defined in the column definition) */
  type: (typeof FieldType)[keyof typeof FieldType];

  /** DOM target element selector from which the filter was triggered from. */
  targetSelector?: string;
}
