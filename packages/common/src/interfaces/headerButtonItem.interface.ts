import type { Column } from './index';
import type { SlickGrid } from '../core/index';

export interface HeaderButtonItem {
  /** A command identifier to be passed to the onCommand event handlers. */
  command?: string;

  /** CSS class to add to the button. */
  cssClass?: string;

  /** Defaults to false, whether the item/command is disabled. */
  disabled?: boolean;

  /** Button click handler. */
  handler?: (e: Event) => void;

  /** Only show the button on hover. */
  showOnHover?: boolean;

  /** Button tooltip. */
  tooltip?: string;

  // --
  // action/override callbacks

  /** Optionally define a callback function that gets executed when item is chosen (and/or use the onCommand event) */
  action?: (event: Event, callbackArgs: { command: string; button: any; column: Column; grid: SlickGrid; }) => void;

  /** Callback method that user can override the default behavior of showing/hiding an item from the list. */
  itemVisibilityOverride?: (args: { node: any; column: Column; grid: SlickGrid; }) => boolean;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  itemUsabilityOverride?: (args: { node: any; column: Column; grid: SlickGrid; }) => boolean;
}
