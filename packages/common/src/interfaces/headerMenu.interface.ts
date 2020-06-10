import {
  Column,
  HeaderMenuOption,
  MenuCommandItemCallbackArgs,
  SlickEventData,
  SlickGrid,
} from './index';
import { SlickHeaderMenu } from './slickHeaderMenu.interface';

export interface HeaderMenu extends HeaderMenuOption {
  // --
  // Events
  // ------------

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickHeaderMenu) => void;

  /** Fired After the header menu shows up. */
  onAfterMenuShow?: (e: SlickEventData, args: { grid: SlickGrid; column: Column; menu: HTMLElement; }) => void;

  /** Fired Before the header menu shows up. */
  onBeforeMenuShow?: (e: SlickEventData, args: { grid: SlickGrid; column: Column; menu: HTMLElement; }) => void;

  /** Fired when a command is clicked */
  onCommand?: (e: SlickEventData, args: MenuCommandItemCallbackArgs) => void;
}
