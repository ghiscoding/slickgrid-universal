import type { Column, GridMenuOption, GridMenuCommandItemCallbackArgs } from './index.js';
import type { SlickGridMenu } from '../extensions/slickGridMenu.js';
import type { SlickGrid } from '../core/index.js';

export interface GridMenu extends GridMenuOption {
  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickGridMenu) => void;

  /** Callback fired After the menu is shown. */
  onAfterMenuShow?: (e: Event, args: GridMenuEventWithElementCallbackArgs) => boolean | void;

  /** Callback fired Before the menu is shown. */
  onBeforeMenuShow?: (e: Event, args: GridMenuEventWithElementCallbackArgs) => boolean | void;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose?: (e: Event, args: GridMenuEventWithElementCallbackArgs) => boolean | void;

  /** Callback fired when any of the columns checkbox selection changes. */
  onColumnsChanged?: (e: Event, args: onGridMenuColumnsChangedCallbackArgs) => void;

  /** Callback fired when the menu is closing. */
  onMenuClose?: (e: Event, args: GridMenuEventWithElementCallbackArgs) => boolean | void;

  /** Callback fired on menu option clicked from the Command items list */
  onCommand?: (e: Event, args: GridMenuCommandItemCallbackArgs) => void;
}

export interface GridMenuEventBaseCallbackArgs {
  /** list of all column definitions (visible & hidden) */
  allColumns: Column[];

  /** list of visible column definitions */
  visibleColumns: Column[];

  /** slick grid object */
  grid: SlickGrid;
}

export interface GridMenuEventWithElementCallbackArgs extends GridMenuEventBaseCallbackArgs {
  /** html DOM element of the menu */
  menu: HTMLElement;

  /** menu/sub-menu level */
  level?: number;
}

export interface onGridMenuColumnsChangedCallbackArgs extends GridMenuEventBaseCallbackArgs {
  /** column definition id */
  columnId: string;

  /** last command, are we showing or not the column? */
  showing: boolean;
}
