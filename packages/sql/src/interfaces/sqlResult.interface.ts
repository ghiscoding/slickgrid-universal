import type { Metrics } from '@slickgrid-universal/common';

export interface SqlResult<T = any> {
  data: T[];
  metrics?: Metrics;
}
