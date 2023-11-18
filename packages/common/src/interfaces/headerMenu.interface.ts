import type { SlickHeaderMenu } from '../extensions/slickHeaderMenu';
import type {
  Column,
  HeaderMenuOption,
  MenuCommandItem,
  MenuCommandItemCallbackArgs,
} from './index';
import { SlickGrid } from '../core/index';

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
  onAfterMenuShow?: (e: Event, args: HeaderMenuCommandItemCallbackArgs) => boolean | void;

  /** Fired Before the header menu shows up. */
  onBeforeMenuShow?: (e: Event, args: HeaderMenuCommandItemCallbackArgs) => boolean | void;

  /** Fired when a command is clicked */
  onCommand?: (e: Event, args: MenuCommandItemCallbackArgs) => void;
}
