import { ColumnReorderFunction } from '../enums/columnReorderFunction.type';
import { GroupingGetterFunction } from './grouping.interface';

export interface DraggableGroupingOption {
  /** an extra CSS class to add to the delete button (default undefined), if deleteIconCssClass && deleteIconImage undefined then slick-groupby-remove-image class will be added */
  deleteIconCssClass?: string;

  /** a url to the delete button image (default undefined) */
  deleteIconImage?: string;

  /** option to specify set own placeholder note text */
  dropPlaceHolderText?: string;

  /** an extra CSS class to add to the grouping field hint  (default undefined) */
  groupIconCssClass?: string;

  /** a url to the grouping field hint image (default undefined) */
  groupIconImage?: string;

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
