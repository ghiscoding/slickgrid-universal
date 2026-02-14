import type { SlickEventData } from '../core/slickCore.js';
import type { SlickContextMenu } from '../extensions/slickContextMenu.js';
import type { ContextMenuOption, MenuCommandItemCallbackArgs, MenuFromCellCallbackArgs, MenuOptionItemCallbackArgs } from './index.js';

export type BuiltInContextMenuCommand =
  | 'clear-grouping'
  | 'collapse-all-groups'
  | 'copy'
  | 'divider-1'
  | 'expand-all-groups'
  | 'export-csv'
  | 'export-excel'
  | 'export-pdf'
  | 'export-text-delimited';

export interface ContextMenu extends ContextMenuOption {
  // --
  // Events

  /** hide any built-in command from the context menu */
  hideCommands?: Array<BuiltInContextMenuCommand>;

  /** Fired after extension (control) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickContextMenu) => void;

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
