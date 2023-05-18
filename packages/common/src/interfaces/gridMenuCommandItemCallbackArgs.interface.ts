import type { Column, SlickGrid } from '.';
import type { MenuCommandItem } from './menuCommandItem.interface';

export interface GridMenuCallbackArgs {
  grid: SlickGrid;
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
  grid: SlickGrid;

  /** all columns (including hidden ones) */
  allColumns: Column[],

  /** only visible columns (excluding hidden columns) */
  visibleColumns: Column[],
}
