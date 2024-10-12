import type { GraphqlFilteringOption } from './graphqlFilteringOption.interface.js';
import type { GraphqlSortingOption } from './graphqlSortingOption.interface.js';

export interface GraphqlDatasetFilter {
  first?: number;
  last?: number;
  offset?: number;
  after?: string;
  before?: string;
  locale?: string;
  filterBy?: GraphqlFilteringOption[];
  orderBy?: GraphqlSortingOption[];
}
