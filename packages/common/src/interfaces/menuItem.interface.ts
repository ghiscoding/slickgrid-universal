import type { MenuCallbackArgs } from './menuCallbackArgs.interface.js';

export interface MenuItem<O = MenuCallbackArgs> {
  /** A CSS class to be added to the menu item container. */
  cssClass?: string;

  /** Defaults to false, whether the item/command is disabled. */
  disabled?: boolean;

  /** Defaults to false, whether the command is actually a divider (separator). */
  divider?: boolean | string;

  /** Defaults to false, whether the item/command is hidden. */
  hidden?: boolean;

  /** CSS class to be added to the menu item icon. */
  iconCssClass?: string;

  /** position order in the list, a lower number will make it on top of the list. Internal commands starts at 50. */
  positionOrder?: number;

  /** Optional sub-menu title that will shows up when sub-menu commmands/options list is opened */
  subMenuTitle?: string;

  /** Same as "subMenuTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  subMenuTitleKey?: string;

  /** Optional sub-menu title CSS class to use with `subMenuTitle` */
  subMenuTitleCssClass?: string;

  /** CSS class to be added to the menu item text. */
  textCssClass?: string;

  /** internal usage only, keeps a reference to the original title when optionally provided by the external user */
  _orgTitle?: string;

  /** Menu item text to show in the list. */
  title?: string;

  /** Same as "title", except that it's a translation key which can be used on page load and/or when switching locale */
  titleKey?: string;

  /** Item tooltip to show while hovering the command. */
  tooltip?: string;

  // --
  // action/override callbacks

  /** Callback method that user can override the default behavior of showing/hiding an item from the list. */
  itemVisibilityOverride?: (args: O) => boolean;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  itemUsabilityOverride?: (args: O) => boolean;
}
