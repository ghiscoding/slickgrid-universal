import { SlickGrid } from './slickGrid.interface';

export interface RowMoveManagerOption {
  /** Defaults to false, option to cancel editing while dragging a row */
  cancelEditOnDrag?: boolean;

  /**  A CSS class to be added to the menu item container. */
  cssClass?: string;

  /**  Column definition id(defaults to "_move") */
  columnId?: string;

  /**
 * Defaults to 0, the column index position in the grid by default it will show as the first column (index 0).
 * Also note that the index position might vary if you use other extensions, after each extension is created,
 * it will add an offset to take into consideration (1.CheckboxSelector, 2.RowDetail, 3.RowMove)
 */
  columnIndexPosition?: number;

  /**  Defaults to False, do we want to disable the row selection?  */
  disableRowSelection?: boolean;

  /**  Defaults to False, do we want a single row move? Setting this to false means that 1 or more rows can be selected to move together.  */
  singleRowMove?: boolean;

  /**  Width of the column in pixels (must be a number) */
  width?: number;

  /** Override the logic for showing (or not) the move icon (use case example: only every 2nd row is moveable) */
  usabilityOverride?: (row: number, dataContext: any, grid: SlickGrid) => boolean;
}
