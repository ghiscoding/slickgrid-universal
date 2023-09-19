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

  /** Menu/sub-menu level, parent menu is always defined as 0 and sub-menus are at level 1 or higher */
  level?: number;
}
