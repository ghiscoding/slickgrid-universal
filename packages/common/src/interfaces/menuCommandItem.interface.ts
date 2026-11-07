import type { MenuCallbackArgs, MenuCommandItemCallbackArgs, MenuItem } from './index.js';

export interface MenuCommandItem<A = MenuCommandItemCallbackArgs, R = MenuCallbackArgs> extends MenuItem<R> {
  /** A command identifier to be passed to the onCommand event callback handler (when using "commandItems"). */
  command: string;

  /** Array of Command Items (title, command, disabled, ...) */
  commandItems?: Array<MenuCommandItem | MenuDivider>;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: any, callbackArgs: A) => void;
}

/** A menu separator, provided as an object or the string 'divider'. */
export type MenuDivider<R = MenuCallbackArgs> = MenuDividerItem<R> | 'divider';

/** An object menu separator that does not require a command identifier. */
export interface MenuDividerItem<R = MenuCallbackArgs> extends MenuItem<R> {
  divider: true;
  command?: string;

  /** Dividers cannot execute actions. */
  action?: never;
}
