import type { InfiniteScrollOption, SortDirection } from '@slickgrid-universal/common';

export type IdentifierEscapeStyle = 'doubleQuote' | 'backtick' | 'bracket';

export interface SqlServiceOption {
  /** Name of the SQL table to query (required) */
  tableName: string;
  /** Optional: dataset/schema/database name for multi-database support */
  datasetName?: string;
  /**
   * Controls how SQL identifiers (table/schema) are escaped in generated queries.
   * - 'doubleQuote': "identifier" (PostgreSQL, ANSI SQL, default)
   * - 'backtick': `identifier` (MySQL)
   * - 'bracket': [identifier] (MSSQL)
   */
  identifierEscapeStyle?: IdentifierEscapeStyle;
  /** Filtering options for WHERE clause */
  filteringOptions?: SqlFilteringOption[];
  /** Sorting options for ORDER BY clause */
  sortingOptions?: SqlSortingOption[];
  /** Pagination options (pageNumber, pageSize) */
  paginationOptions?: SqlPaginationOption;
  /** Any extra query arguments (for advanced use) */
  extraQueryArguments?: SqlQueryArgument[];
  /** Enable infinite scroll mode (disables LIMIT/OFFSET pagination) */
  infiniteScroll?: boolean | InfiniteScrollOption;

  /**
   * Name of the total count column returned by the SQL query (default: 'totalCount').
   * Use this to avoid conflicts or customize the count field name in the result set.
   */
  totalCountField?: string;

  /**
   * When false, searchTerms may be manipulated to be functional with certain filters eg: string only filters.
   * When true, JSON.stringify is used on the searchTerms and used in the query "as-is". It is then the responsibility of the developer to sanitise the `searchTerms` property if necessary.
   */
  useVerbatimSearchTerms?: boolean;
}

export interface SqlFilteringOption {
  field: string;
  operator: string;
  value: any;
  type?: string;
}

export interface SqlSortingOption {
  field: string;
  direction: SortDirection;
}

export interface SqlPaginationOption {
  pageNumber: number;
  pageSize: number;
}

export interface SqlQueryArgument {
  field: string;
  value: any;
}
