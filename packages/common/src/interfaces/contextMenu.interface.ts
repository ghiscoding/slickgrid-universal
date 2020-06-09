import {
  ContextMenuOption,
  MenuCommandItemCallbackArgs,
  MenuOptionItemCallbackArgs,
  SlickContextMenu,
  SlickGrid,
} from './index';

export interface ContextMenu extends ContextMenuOption {
  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickContextMenu) => void;

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: (e: Event, args: { cell: number; row: number; grid: SlickGrid; }) => void;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: (e: Event, args: { cell: number; row: number; grid: SlickGrid; }) => void;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose?: (e: Event, args: { cell: number; row: number; grid: SlickGrid; menu: HTMLElement; }) => void;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: (e: Event, args: MenuCommandItemCallbackArgs) => void;

  /** SlickGrid Event fired on menu option selected from the Option items list. */
  onOptionSelected?: (e: Event, args: MenuOptionItemCallbackArgs) => void;
}
