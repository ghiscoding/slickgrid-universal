import type { SlickCellRangeSelector } from '../extensions/slickCellRangeSelector.js';
import type { OnActiveCellChangedEventArgs, SelectionModel, SlickGrid } from '../index.js';

export declare type RowSelectOverride = (data: OnActiveCellChangedEventArgs, selectionModel: SelectionModel, grid: SlickGrid) => boolean;

export type CellSelectionMode = 'SEL' | 'REP';

export type SelectionType =
  /** multiple cell selection */
  | 'cell'
  /** multiple row selection */
  | 'row'
  /** mixed cell/row selection */
  | 'mixed';

export interface HybridSelectionModelOption {
  /** defaults to True, do we want to select the active cell? */
  selectActiveCell?: boolean;

  /** defaults to True, should the currently-active row be automatically selected during navigation? */
  selectActiveRow?: boolean;

  /** cell range selector */
  cellRangeSelector?: SlickCellRangeSelector;

  /** Defaults to False, should we select when dragging? */
  dragToSelect?: boolean;

  /** Defaults to False, should Ctrl/Cmd interactions add or toggle multiple cell or row selection ranges? */
  enableMultiSelection?: boolean;

  /**
   * Defaults to True, controls the visibility of the Excel-style cell selection drag handle.
   * Set to `false` to disable the handle, or to `'hover'` to show it only while hovering the selected cell.
   */
  showDragHandle?: boolean | 'hover';

  /** Defaults to True, should we auto-scroll when dragging a row */
  autoScrollWhenDrag?: boolean;

  /** Row Selection on RowMoveManage column */
  handleRowMoveManagerColumn?: boolean;

  /** Row Selection on these columns */
  rowSelectColumnIds?: string[];

  /** function to toggle Row Selection Models */
  rowSelectOverride?: RowSelectOverride | undefined;

  /** use a specifc selection type, defaults to 'row' when `enableCheckboxSelector` is enabled or 'mixed' when not */
  selectionType?: SelectionType;
}
