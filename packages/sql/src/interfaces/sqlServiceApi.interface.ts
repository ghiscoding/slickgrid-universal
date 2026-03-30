import type { BackendServiceApi, Observable } from '@slickgrid-universal/common';
import type { SqlService } from '../services/sql.service.js';
import type { SqlResult } from './sqlResult.interface.js';
import type { SqlServiceOption } from './sqlServiceOption.interface.js';

export interface SqlServiceApi<T = any> extends BackendServiceApi {
  /** Backend Service Options */
  options: SqlServiceOption;

  /** Backend Service instance */
  service: SqlService;

  /** On init (or on page load), what action to perform? */
  onInit?: (query: string) => Promise<SqlResult<T>> | Observable<SqlResult<T>>;

  /** On Processing, we get the query back from the service, and we need to provide a Promise/Observable. For example: this.http.get(mySqlUrl) */
  process: (query: string) => Promise<SqlResult<T>> | Observable<SqlResult<T>>;

  /** After executing the query, what action to perform? For example, stop the spinner */
  postProcess?: (response: SqlResult<T>) => void;

  /**
   * INTERNAL USAGE ONLY by Slickgrid-Universal
   * This internal process will be run just before postProcess and is meant to refresh the Dataset & Pagination after a SQL call
   */
  internalPostProcess?: (result: SqlResult<T>) => void;
}
