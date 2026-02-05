import type { BackendServiceApi, Observable } from '@slickgrid-universal/common';
import type { GraphqlService } from '../services/index.js';
import type { GraphqlPaginatedResult } from './graphqlPaginatedResult.interface.js';
import type { GraphqlResult } from './graphqlResult.interface.js';
import type { GraphqlServiceOption } from './graphqlServiceOption.interface.js';

export interface GraphqlServiceApi<T = any> extends BackendServiceApi {
  /** Backend Service Options */
  options: GraphqlServiceOption;

  /** Backend Service instance (could be OData or GraphQL Service) */
  service: GraphqlService;

  /** On init (or on page load), what action to perform? */
  onInit?: (
    query: string
  ) => Promise<GraphqlResult<T> | GraphqlPaginatedResult<T>> | Observable<GraphqlResult<T> | GraphqlPaginatedResult<T>>;

  /** On Processing, we get the query back from the service, and we need to provide a Promise/Observable. For example: this.http.get(myGraphqlUrl) */
  process: (
    query: string
  ) => Promise<GraphqlResult<T> | GraphqlPaginatedResult<T>> | Observable<GraphqlResult<T> | GraphqlPaginatedResult<T>>;

  /** After executing the query, what action to perform? For example, stop the spinner */
  postProcess?: (response: GraphqlResult<T> | GraphqlPaginatedResult<T>) => void;

  /**
   * INTERNAL USAGE ONLY by Slickgrid-Universal
   * This internal process will be run just before postProcess and is meant to refresh the Dataset & Pagination after a GraphQL call
   */
  internalPostProcess?: (result: GraphqlResult<T> | GraphqlPaginatedResult<T>) => void;
}
