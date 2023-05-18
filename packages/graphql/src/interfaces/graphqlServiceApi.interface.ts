import type { BackendServiceApi, Observable } from '@slickgrid-universal/common';

import type { GraphqlResult } from './graphqlResult.interface';
import type { GraphqlPaginatedResult } from './graphqlPaginatedResult.interface';
import type { GraphqlServiceOption } from './graphqlServiceOption.interface';
import type { GraphqlService } from '../services/index';

export interface GraphqlServiceApi extends BackendServiceApi {
  /** Backend Service Options */
  options: GraphqlServiceOption;

  /** Backend Service instance (could be OData or GraphQL Service) */
  service: GraphqlService;

  /** On init (or on page load), what action to perform? */
  onInit?: (query: string) => Promise<GraphqlResult | GraphqlPaginatedResult> | Observable<GraphqlResult | GraphqlPaginatedResult>;

  /** On Processing, we get the query back from the service, and we need to provide a Promise/Observable. For example: this.http.get(myGraphqlUrl) */
  process: (query: string) => Promise<GraphqlResult | GraphqlPaginatedResult> | Observable<GraphqlResult | GraphqlPaginatedResult>;

  /** After executing the query, what action to perform? For example, stop the spinner */
  postProcess?: (response: GraphqlResult | GraphqlPaginatedResult) => void;

  /**
   * INTERNAL USAGE ONLY by Slickgrid-Universal
   * This internal process will be run just before postProcess and is meant to refresh the Dataset & Pagination after a GraphQL call
   */
  internalPostProcess?: (result: GraphqlResult | GraphqlPaginatedResult) => void;
}
