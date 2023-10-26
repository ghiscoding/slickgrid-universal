import type { MenuItem } from './menuItem.interface';
import type { MenuOptionItemCallbackArgs } from './menuOptionItemCallbackArgs.interface';

export interface MenuOptionItem extends MenuItem {
  /** An option returned by the onOptionSelected (or action) event callback handler. */
  option: number | string | null | undefined;

  /** Array of Option Items (title, command, disabled, ...) */
  optionItems?: Array<MenuOptionItem | 'divider'>;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: Event, callbackArgs: MenuOptionItemCallbackArgs) => void;
}
