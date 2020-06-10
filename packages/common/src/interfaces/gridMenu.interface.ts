import {
  Column,
  GridMenuOption,
  MenuCommandItemCallbackArgs,
  SlickGrid,
  SlickGridMenu,
  SlickEventData,
} from './index';

export interface GridMenu extends GridMenuOption {
  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickGridMenu) => void;

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: (e: SlickEventData, args: { grid: SlickGrid; menu: HTMLElement; columns: Column[] }) => void;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: (e: SlickEventData, args: { grid: SlickGrid; menu: HTMLElement; columns: Column[] }) => void;

  /** SlickGrid Event fired when any of the columns checkbox selection changes. */
  onColumnsChanged?: (e: SlickEventData, args: { grid: SlickGrid; allColumns: Column[]; columns: Column[]; }) => void;

  /** SlickGrid Event fired when the menu is closing. */
  onMenuClose?: (e: SlickEventData, args: { grid: SlickGrid; menu: HTMLElement; allColumns: Column[], visibleColumns: Column[] }) => void;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: (e: SlickEventData, args: MenuCommandItemCallbackArgs) => void;
}
