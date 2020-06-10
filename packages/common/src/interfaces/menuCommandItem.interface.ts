import { MenuItem } from './menuItem.interface';
import { MenuCommandItemCallbackArgs } from './menuCommandItemCallbackArgs.interface';
import { SlickEventData } from './slickEventData.interface';

export interface MenuCommandItem extends MenuItem {
  /** A command identifier to be passed to the onCommand event callback handler (when using "commandItems"). */
  command: string;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: SlickEventData | Event, callbackArgs: MenuCommandItemCallbackArgs) => void;
}
