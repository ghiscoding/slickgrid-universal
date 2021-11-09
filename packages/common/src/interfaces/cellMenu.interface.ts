import {
  CellMenuOption,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItemCallbackArgs,
} from './index';
import { SlickCellMenu } from '../extensions/slickCellMenu';

export interface CellMenu extends CellMenuOption {

  // --
  // Events

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickCellMenu) => void;

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: (e: Event, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: (e: Event, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose?: (e: Event, args: MenuFromCellCallbackArgs) => boolean | void;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: (e: Event, args: MenuCommandItemCallbackArgs) => void;

  /** SlickGrid Event fired on menu option selected from the Option items list. */
  onOptionSelected?: (e: Event, args: MenuOptionItemCallbackArgs) => void;
}
