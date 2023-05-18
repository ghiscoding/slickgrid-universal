import type { GridMenuCallbackArgs, GridMenuCommandItemCallbackArgs } from './gridMenuCommandItemCallbackArgs.interface';
import type { MenuCommandItem } from './menuCommandItem.interface';

export interface GridMenuItem extends MenuCommandItem<GridMenuCommandItemCallbackArgs, GridMenuCallbackArgs> {
  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: Event, callbackArgs: GridMenuCommandItemCallbackArgs) => void;

  /** Callback method that user can override the default behavior of showing/hiding an item from the list. */
  itemVisibilityOverride?: (args: GridMenuCallbackArgs) => boolean;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  itemUsabilityOverride?: (args: GridMenuCallbackArgs) => boolean;
}
