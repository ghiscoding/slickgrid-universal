import { Metrics } from '@slickgrid-universal/common';

export interface GraphqlResult {
  data: {
    [datasetName: string]: any[];
  };

  /** Some metrics of the last executed query (startTime, endTime, executionTime, itemCount, totalItemCount) */
  metrics?: Metrics;
}
