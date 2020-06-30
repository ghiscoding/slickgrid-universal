import { SortDirection, SortDirectionString } from '@slickgrid-universal/common';

export interface GraphqlSortingOption {
  field: string;
  direction: SortDirection | SortDirectionString;
}
