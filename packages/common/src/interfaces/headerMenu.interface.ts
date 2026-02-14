import type { SlickEventData, SlickGrid } from '../core/index.js';
import type { SlickHeaderMenu } from '../extensions/slickHeaderMenu.js';
import type { Column, HeaderMenuOption, MenuCommandItem, MenuCommandItemCallbackArgs } from './index.js';

export type BuiltInHeaderMenuCommand =
  | 'clear-filter'
  | 'clear-sort'
  | 'column-resize-by-content'
  | 'divider-1'
  | 'divider-2'
  | 'divider-3'
  | 'freeze-columns'
  | 'hide-column'
  | 'sort-asc'
  | 'sort-desc'
  | 'unfreeze-columns';

export interface HeaderMenuCommandItemCallbackArgs {
  /** Column definition */
  column: Column;

  /** Slick Grid object */
  grid: SlickGrid;

  /** html DOM element of the menu */
  menu: Array<MenuCommandItem | 'divider'>;
}

export interface HeaderMenu extends HeaderMenuOption {
  /** hide any built-in command from the header menu */
  hideCommands?: Array<BuiltInHeaderMenuCommand>;

  // --
  // Events
  // ------------

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickHeaderMenu) => void;

  /** Fired After the header menu shows up. */
  onAfterMenuShow?: (e: Event | SlickEventData, args: HeaderMenuCommandItemCallbackArgs) => boolean | void;

  /** Fired Before the header menu shows up. */
  onBeforeMenuShow?: (e: Event | SlickEventData, args: HeaderMenuCommandItemCallbackArgs) => boolean | void;

  /** Fired when a command is clicked */
  onCommand?: (e: Event | SlickEventData, args: MenuCommandItemCallbackArgs) => void;
}
