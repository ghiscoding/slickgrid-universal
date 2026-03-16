import type { MenuItem } from './menuItem.interface.js';
import type { MenuOptionItemCallbackArgs } from './menuOptionItemCallbackArgs.interface.js';

/** @deprecated @use `MenuCommandItem` */
export interface MenuOptionItem extends MenuItem {
  /** @deprecated @use `commandItems` An option returned by the onOptionSelected (or action) event callback handler. */
  option: number | string | boolean | null | undefined;

  /** @deprecated @use `commandItems` Array of Option Items (title, command, disabled, ...) */
  optionItems?: Array<MenuOptionItem | 'divider'>;

  // --
  // action/override callbacks

  /** @deprecated @use `commandItems` Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: Event, callbackArgs: MenuOptionItemCallbackArgs) => void;
}
