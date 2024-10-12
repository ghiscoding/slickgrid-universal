import type { MenuCallbackArgs, MenuCommandItemCallbackArgs, MenuItem } from './index.js';

export interface MenuCommandItem<A = MenuCommandItemCallbackArgs, R = MenuCallbackArgs> extends MenuItem<R> {
  /** A command identifier to be passed to the onCommand event callback handler (when using "commandItems"). */
  command: string;

  /** Array of Command Items (title, command, disabled, ...) */
  commandItems?: Array<MenuCommandItem | 'divider'>;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: any, callbackArgs: A) => void;
}
