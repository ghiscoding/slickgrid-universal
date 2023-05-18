import type { BackendServiceApi } from '@slickgrid-universal/common';
import type { OdataOption } from './odataOption.interface';
import type { GridOdataService } from '../services/index';

export interface OdataServiceApi extends BackendServiceApi {
  /** Backend Service Options */
  options?: Partial<OdataOption>;

  /** Backend Service instance (could be OData or GraphQL Service) */
  service: GridOdataService;
}
