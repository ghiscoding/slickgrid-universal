import {
  BackendServiceOption,
  ColumnFilters,
  CurrentFilter,
  CurrentPagination,
  CurrentSorter,
  FilterChangedArgs,
  MultiColumnSort,
  Pagination,
  PaginationChangedArgs,
  SingleColumnSort,
} from './index';

export interface BackendService {
  /** Backend Service options */
  options?: BackendServiceOption;

  /** Build and the return the backend service query string */
  buildQuery: (serviceOptions?: BackendServiceOption) => string;

  /** Clear all sorts */
  clearFilters?: () => void;

  /** Clear all sorts */
  clearSorters?: () => void;

  /** initialize the backend service with certain options */
  init?: (serviceOptions?: BackendServiceOption, pagination?: Pagination, grid?: any) => void;

  /** Get the dataset name */
  getDatasetName?: () => string;

  /** Get the Filters that are currently used by the grid */
  getCurrentFilters?: () => ColumnFilters | CurrentFilter[];

  /** Get the Pagination that is currently used by the grid */
  getCurrentPagination?: () => CurrentPagination | null;

  /** Get the Sorters that are currently used by the grid */
  getCurrentSorters?: () => CurrentSorter[];

  /** Reset the pagination options */
  resetPaginationOptions: () => void;

  /** Update the Filters options with a set of new options */
  updateFilters?: (columnFilters: ColumnFilters | CurrentFilter[], isUpdatedByPresetOrDynamically: boolean) => void;

  /** Update the Pagination component with it's new page number and size */
  updatePagination?: (newPage: number, pageSize: number) => void;

  /** Update the Sorters options with a set of new options */
  updateSorters?: (sortColumns?: Array<SingleColumnSort>, presetSorters?: CurrentSorter[]) => void;

  /** Update the backend service options */
  updateOptions: (serviceOptions?: Partial<BackendServiceOption>) => void;

  // --
  // Events / Methods
  // -----------------

  /** Execute when any of the filters changed */
  processOnFilterChanged: (event: Event | KeyboardEvent | undefined, args: FilterChangedArgs) => string;

  /** Execute when the pagination changed */
  processOnPaginationChanged: (event: Event | undefined, args: PaginationChangedArgs) => string;

  /** Execute when any of the sorters changed */
  processOnSortChanged: (event: Event | undefined, args: SingleColumnSort | MultiColumnSort) => string;
}
