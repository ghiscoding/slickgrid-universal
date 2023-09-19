import type { Column, SlickGridUniversal } from './index';

export interface MenuCallbackArgs<T = any> {
  /** Cell or column index */
  cell?: number;

  /** Row index */
  row?: number;

  /** Reference to the grid. */
  grid: SlickGridUniversal;

  /** Cell Column definition */
  column: Column<T>;

  /** Cell Data Context(data object) */
  dataContext?: T;
}
