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
  // Slot support for custom content injection (cross-framework compatible)

  /**
   * Slot renderer callback for the entire menu item.
   * @param item - The menu item object
   * @param args - The callback args providing access to grid, column, dataContext, etc.
   * @param event - Optional DOM event (passed during click handling) that allows the renderer to call stopPropagation()
   * @returns Either an HTML string or an HTMLElement
   *
   * @example
   * // Return HTML string
   * slotRenderer: (item, args) => `<div>${item.title}</div>`
   *
   * // Return HTMLElement with event listeners
   * slotRenderer: (item, args) => {
   *   const div = document.createElement('div');
   *   div.textContent = `${item.title} (Row ${args.dataContext.id})`;
   *   div.addEventListener('click', () => console.log('clicked'));
   *   return div;
   * }
   */
  slotRenderer?: (item: any, args: O, event?: Event) => string | HTMLElement;

  // --
  // action/override callbacks

  /** Callback method that user can override the default behavior of showing/hiding an item from the list. */
  itemVisibilityOverride?: (args: O) => boolean;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  itemUsabilityOverride?: (args: O) => boolean;
}
