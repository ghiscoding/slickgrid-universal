import type { BackendServiceOption } from '@slickgrid-universal/common';

import type { GraphqlFilteringOption } from './graphqlFilteringOption.interface';
import type { GraphqlSortingOption } from './graphqlSortingOption.interface';
import type { GraphqlCursorPaginationOption } from './graphqlCursorPaginationOption.interface';
import type { GraphqlPaginationOption } from './graphqlPaginationOption.interface';
import type { QueryArgument } from './queryArgument.interface';

export interface GraphqlServiceOption extends BackendServiceOption {
  /**
   * When using Translation, we probably want to add locale as a query parameter for the filterBy/orderBy to work
   * ex.: users(first: 10, offset: 0, locale: "en-CA", filterBy: [{field: name, operator: EQ, value:"John"}]) { }
   */
  addLocaleIntoQuery?: boolean;

  /** What is the dataset, this is required for the GraphQL query to be built */
  datasetName: string;

  /** Used for defining the operation name when building the GraphQL query */
  operationName?: string;

  /**
   * Extra query arguments that be passed in addition to the default query arguments
   * For example in GraphQL, if we want to pass "userId" and we want the query to look like
   * users (first: 20, offset: 10, userId: 123) { ... }
   */
  extraQueryArguments?: QueryArgument[];

  /** array of Filtering Options, ex.: { field: name, operator: EQ, value: "John" }  */
  filteringOptions?: GraphqlFilteringOption[];

  /** What are the pagination options? ex.: (first, last, offset) */
  paginationOptions?: GraphqlPaginationOption | GraphqlCursorPaginationOption;

  /** array of Filtering Options, ex.: { field: name, direction: DESC }  */
  sortingOptions?: GraphqlSortingOption[];

  /**
   * Do we want to keep double quotes on field arguments of filterBy/sortBy (field: "name" instead of field: name)
   * ex.: { field: "name", operator: EQ, value: "John" }
   */
  keepArgumentFieldDoubleQuotes?: boolean;

  /** Use Pagination Cursor in the GraphQL Server */
  useCursor?: boolean;

  /**
   * When false, searchTerms may be manipulated to be functional with certain filters eg: string only filters.
   * When true, JSON.stringify is used on the searchTerms and used in the query "as-is". It is then the responsibility of the developer to sanitise the `searchTerms` property if necessary.
   */
  useVerbatimSearchTerms?: boolean;
}
