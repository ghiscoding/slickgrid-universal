import { SortDirection, SortDirectionString } from '@slickgrid-universal/common';

export interface OdataSortingOption {
  field: string;
  direction: SortDirection | SortDirectionString;
}
