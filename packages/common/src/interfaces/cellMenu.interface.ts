import type {
  CellMenuOption,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItemCallbackArgs,
} from './index.js';
import type { SlickCellMenu } from '../extensions/slickCellMenu.js';
import type { SlickEventData } from '../core/slickCore.js';

export interface CellMenu extends CellMenuOption {
  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickCellMenu) => void;

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: (e: Event | SlickEventData, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: (e: Event | SlickEventData, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose?: (e: Event | SlickEventData, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: (e: Event | SlickEventData, args: MenuCommandItemCallbackArgs) => void;

  /** SlickGrid Event fired on menu option selected from the Option items list. */
  onOptionSelected?: (e: Event | SlickEventData, args: MenuOptionItemCallbackArgs) => void;
}
