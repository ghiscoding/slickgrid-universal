import type { ColumnReorderFunction } from '../enums/columnReorderFunction.type.js';
import type { GroupingGetterFunction } from './grouping.interface.js';

export interface DraggableGroupingOption {
  /** an extra CSS class to add to the delete button (default undefined), if deleteIconCssClass is undefined then slick-groupby-remove-icon class will be added */
  deleteIconCssClass?: string;

  /** option to specify set own placeholder note text */
  dropPlaceHolderText?: string;

  /** Defaults to "TEXT_DROP_COLUMN_HEADER_TO_GROUP_BY", translation key of the dropbox placeholder which shows in the pre-header when using the Draggable Grouping plugin. */
  dropPlaceHolderTextKey?: string;

  /** an extra CSS class to add to the grouping field hint  (default undefined) */
  groupIconCssClass?: string;

  /** Defaults to False, should we display a toggle all button (typically aligned on the left before any of the column group) */
  hideToggleAllButton?: boolean;

  /** Defaults to False, should we show the Sorting icons on each group by element? */
  hideGroupSortIcons?: boolean;

  /** optionally add an initial set of columns to group by */
  initialGroupBy?: Array<string | GroupingGetterFunction>;

  /** an extra CSS class to add to the sort ascending icon (default undefined), if sortAscIconCssClass is undefined then slick-groupby-sort-asc-icon class will be added */
  sortAscIconCssClass?: string;

  /** an extra CSS class to add to the sort descending icon (default undefined), if sortDescIconCssClass is undefined then slick-groupby-sort-desc-icon class will be added */
  sortDescIconCssClass?: string;

  /** Defaults to "Toggle all Groups", placeholder of the Toggle All button that can optionally show up in the pre-header row. */
  toggleAllPlaceholderText?: string;

  /** Defaults to "TOGGLE_ALL_GROUPS", translation key of the Toggle All button placeholder that can optionally show up in the pre-header row. */
  toggleAllPlaceholderTextKey?: string;

  /** Defaults to empty string, text to show in the Toggle All button that can optionally show up in the pre-header row. */
  toggleAllButtonText?: string;

  /** Defaults to "TOGGLE_ALL_GROUPS", translation key of text to show in the Toggle All button that can optionally show up in the pre-header row. */
  toggleAllButtonTextKey?: string;

  //
  // Methods
  // ---------

  /** provide option to clear grouping */
  clearDroppedGroups?: () => void;

  /** its function to setup draggable feature agains Header Column, should be passed on grid option. Also possible to pass custom function */
  getSetupColumnReorder?: ColumnReorderFunction;
}
