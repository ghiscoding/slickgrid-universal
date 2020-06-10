import {
  CellMenuOption,
  MenuCommandItemCallbackArgs,
  MenuOptionItemCallbackArgs,
  SlickCellMenu,
  SlickEventData,
  SlickGrid,
} from './index';

export interface CellMenu extends CellMenuOption {

  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickCellMenu) => void;

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: (e: SlickEventData, args: { cell: number; row: number; grid: SlickGrid; }) => void;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: (e: SlickEventData, args: { cell: number; row: number; grid: SlickGrid; }) => void;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose?: (e: SlickEventData, args: { cell: number; row: number; grid: SlickGrid; menu: HTMLElement; }) => void;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: (e: SlickEventData, args: MenuCommandItemCallbackArgs) => void;

  /** SlickGrid Event fired on menu option selected from the Option items list. */
  onOptionSelected?: (e: SlickEventData, args: MenuOptionItemCallbackArgs) => void;
}
