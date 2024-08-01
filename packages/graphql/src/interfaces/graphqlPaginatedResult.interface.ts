import type { Metrics, CursorPageInfo } from '@slickgrid-universal/common';

export interface GraphqlPaginatedResult {
  data: {
    [datasetName: string]: {
      /** result set of data objects (array of data) */
      nodes: any[];

      /** Total count of items in the table (needed for the Pagination to work) */
      totalCount: number;

      // ---
      // When using a Cursor, we'll also have `Edges` and `PageInfo` according to a cursor position

      /** Edges information of the current cursor */
      edges?: {
        /** Current cursor position */
        cursor: string;
      };

      /** Page information of the current cursor, do we have a next page and what is the end cursor? */
      pageInfo?: CursorPageInfo;
    };
  };

  /** when using Infinite Scroll, we'll want to know when we hit the bottom of the scroll to get next subset */
  infiniteScrollBottomHit?: boolean;

  /** Some metrics of the last executed query (startTime, endTime, executionTime, itemCount, totalItemCount) */
  metrics?: Metrics;
}
