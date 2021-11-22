import { ColumnReorderFunction } from '../enums/columnReorderFunction.type';
import { GroupingGetterFunction } from './grouping.interface';

export interface DraggableGroupingOption {
  /** an extra CSS class to add to the delete button (default undefined), if deleteIconCssClass is undefined then slick-groupby-remove-image class will be added */
  deleteIconCssClass?: string;

  /**
   * @deprecated @use `deleteIconCssClass`
   *  a url to the delete button image (default undefined)
   */
  deleteIconImage?: string;

  /** option to specify set own placeholder note text */
  dropPlaceHolderText?: string;

  /** Defaults to "TEXT_DROP_COLUMN_HEADER_TO_GROUP_BY", translation key of the dropbox placeholder which shows in the pre-header when using the Draggable Grouping plugin. */
  dropPlaceHolderTextKey?: string;

  /** an extra CSS class to add to the grouping field hint  (default undefined) */
  groupIconCssClass?: string;

  /**
   * @deprecated @use `groupIconCssClass`
   *  a url to the grouping field hint image (default undefined)
   */
  groupIconImage?: string;

  /** Defaults to False, should we display a toggle all button (typically aligned on the left before any of the column group) */
  hideToggleAllButton?: boolean;

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
  /** provide option to set default grouping on loading */
  setDroppedGroups?: (groupingInfo: Array<string | GroupingGetterFunction> | string) => void;

  /** provide option to clear grouping */
  clearDroppedGroups?: () => void;

  /** its function to setup draggable feature agains Header Column, should be passed on grid option. Also possible to pass custom function */
  getSetupColumnReorder?: ColumnReorderFunction;
}
