import type { SlickGrid } from '../core/index.js';
import type { Column, GridMenuCommandItemCallbackArgs, HeaderMenuCommandItemCallbackArgs, MenuFromCellCallbackArgs } from './index.js';

export interface MenuOption<T extends MenuFromCellCallbackArgs | GridMenuCommandItemCallbackArgs | HeaderMenuCommandItemCallbackArgs> {
  // --
  // Methods

  /**
   * Default slot renderer for all menu items.
   * This will be used as the default renderer for all items unless overridden by an individual item's `slotRenderer`.
   * The renderer receives both the menu item and args for full context access.
   *
   * @param item - The menu item object (`MenuCommandItem` or `MenuOptionItem`)
   * @param args - The callback args providing access to grid, column, dataContext, etc.
   * @returns Either an HTML string or an HTMLElement
   *
   * @example
   * // Return HTML string
   * defaultItemRenderer: (item, args) => `<div>${item.title}</div>`
   *
   * // Return HTMLElement (e.g. Cell or Context Menu)
   * defaultItemRenderer: (item, args) => {
   *   const div = document.createElement('div');
   *   div.textContent = `${item.title} (Row ${args.dataContext.id})`;
   *   return div;
   * }
   */
  defaultItemRenderer?: (item: any, args: T) => string | HTMLElement;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  menuUsabilityOverride?: (args: { grid: SlickGrid; column: Column; menu: HTMLElement }) => boolean;
}
