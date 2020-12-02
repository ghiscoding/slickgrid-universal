import { Metrics } from '@slickgrid-universal/common';

export interface GraphqlResult<T = any> {
  data: {
    [datasetName: string]: T[];
  };

  /** Some metrics of the last executed query (startTime, endTime, executionTime, itemCount, totalItemCount) */
  metrics?: Metrics;
}
