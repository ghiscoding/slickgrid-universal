import { SlickHeaderButtons } from '../plugins';
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

  /**
   * defaults to false, since the default is right floating, we create the buttons in reverse order
   * but if we align to left via CSS we might want to inverse the order
   */
  inverseOrder?: boolean;
}
