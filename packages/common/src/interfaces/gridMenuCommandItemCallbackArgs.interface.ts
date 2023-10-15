import type { Column, SlickGridModel } from './index';
import type { MenuCommandItem } from './menuCommandItem.interface';

export interface GridMenuCallbackArgs {
  grid: SlickGridModel;
  menu: any;
  columns: Column[];
  visibleColumns: Column[]
}

export interface GridMenuCommandItemCallbackArgs {
  /** A command identifier returned by the onCommand (or action) event callback handler. */
  command: string;

  /** Menu item selected */
  item: MenuCommandItem;

  /** Slick Grid object */
  grid: SlickGridModel;

  /** all columns (including hidden ones) */
  allColumns: Column[],

  /** only visible columns (excluding hidden columns) */
  visibleColumns: Column[],
}
