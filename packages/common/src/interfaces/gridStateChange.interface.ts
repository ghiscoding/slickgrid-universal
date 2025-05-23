import type { GridStateType, GridStateTypeString } from '../enums/index.js';
import type {
  CurrentColumn,
  CurrentFilter,
  CurrentPagination,
  CurrentPinning,
  CurrentRowSelection,
  CurrentSorter,
  GridState,
  TreeToggleStateChange,
} from './index.js';

export interface GridStateChange {
  /** Last Grid State Change that was triggered (only 1 type of change at a time) */
  change?: {
    /** Grid State change, the values of the new change */
    newValues:
      | CurrentColumn[]
      | CurrentFilter[]
      | CurrentSorter[]
      | CurrentPagination
      | CurrentPinning
      | CurrentRowSelection
      | Partial<TreeToggleStateChange>;

    /** The Grid State Type of change that was made (filter/sorter/...) */
    type: GridStateType | GridStateTypeString;
  };

  /** Current Grid State, that will include all of the current states (columns/filters/sorters) and some optional ones (pagination/rowSelection) */
  gridState?: GridState;
}
