import type { Column, GridOption } from './index.js';
import type { SlickColumnPicker } from '../extensions/slickColumnPicker.js';
import type { SlickGrid } from '../core/index.js';

export interface ColumnPicker extends ColumnPickerOption {
  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickColumnPicker) => void;

  /** SlickGrid Event fired when any of the columns checkbox selection changes. */
  onColumnsChanged?: (e: Event, args: OnColumnsChangedArgs) => void;
}

export interface ColumnPickerOption {
  /** Defaults to "Columns" which is the title that shows up over the columns */
  columnTitle?: string;

  /** Same as "columnTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  columnTitleKey?: string;

  /** Defaults to false, which will sort the columns by name */
  columnSortByName?: boolean;

  /** Defaults to "Force fit columns" which is 1 of the last 2 checkbox title shown at the end of the picker list */
  forceFitTitle?: string;

  /** Same as "forceFitTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  forceFitTitleKey?: string;

  /** Defaults to True, show/hide 1 of the last 2 checkbox at the end of the picker list */
  hideForceFitButton?: boolean;

  /** Defaults to True, show/hide 1 of the last 2 checkbox at the end of the picker list */
  hideSyncResizeButton?: boolean;

  /**
   * Defaults to available space at the bottom, Grid Menu minimum height.
   * Can be a number or a string, if a number is provided it will add the `px` suffix for pixels, or if a string is passed it will use it as is.
   */
  maxHeight?: number | string;

  /**
   * Defaults to 200(px), Grid Menu minimum height.
   * Can be a number or a string, if a number is provided it will add the `px` suffix for pixels, or if a string is passed it will use it as is.
   */
  minHeight?: number | string;

  /** Defaults to "Synchronous resize" which is 1 of the last 2 checkbox title shown at the end of the picker list */
  syncResizeTitle?: string;

  /** Same as "syncResizeTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  syncResizeTitleKey?: string;

  /** Callback method to override the column name output used by the ColumnPicker/GridMenu. */
  headerColumnValueExtractor?: (column: Column, gridOptions?: GridOption) => string | HTMLElement | DocumentFragment;
}

export interface OnColumnsChangedArgs {
  /** column definition id */
  columnId: number | string;

  /** last command, are we showing or not the column? */
  showing: boolean;

  /** slick grid object */
  grid: SlickGrid;

  /** list of all column definitions (visible & hidden) */
  allColumns: Column[];

  /** list of all column definitions (visible & hidden) */
  columns: Column[];

  /** list of visible column definitions */
  visibleColumns: Column[];
}
