import { SlickHeaderButtons } from '../extensions/slickHeaderButtons';
import { HeaderButtonOnCommandArgs } from './headerButtonOnCommandArgs.interface';
import { SlickEventData } from './slickEventData.interface';

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
