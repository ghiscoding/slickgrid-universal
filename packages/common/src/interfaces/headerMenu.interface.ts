import type { SlickHeaderMenu } from '../extensions/slickHeaderMenu.js';
import type {
  Column,
  HeaderMenuOption,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
} from './index.js';
import type { SlickGrid, SlickEventData } from '../core/index.js';

export interface HeaderMenuCommandItemCallbackArgs {
  /** Column definition */
  column: Column;

  /** Slick Grid object */
  grid: SlickGrid;

  /** html DOM element of the menu */
  menu: Array<MenuCommandItem | 'divider'>;
}

export interface HeaderMenu extends HeaderMenuOption {
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
