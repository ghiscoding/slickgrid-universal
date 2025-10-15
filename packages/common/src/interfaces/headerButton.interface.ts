import type { SlickEventData } from '../core/index.js';
import type { SlickHeaderButtons } from '../extensions/slickHeaderButtons.js';
import type { HeaderButtonOnCommandArgs } from './headerButtonOnCommandArgs.interface.js';

export interface HeaderButton extends HeaderButtonOption {
  // --
  // Events
  // ------------

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickHeaderButtons) => void;

  /** Fired when a command is clicked */
  onCommand?: (e: SlickEventData, args: HeaderButtonOnCommandArgs) => void;
}

export interface HeaderButtonOption {
  /** an extra CSS class to add to the menu button */
  buttonCssClass?: string;
}
