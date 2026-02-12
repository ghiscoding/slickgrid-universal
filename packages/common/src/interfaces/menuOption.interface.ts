import type {
  GridMenuCommandItemCallbackArgs,
  GridMenuItem,
  HeaderMenuCommandItemCallbackArgs,
  MenuCommandItem,
  MenuFromCellCallbackArgs,
} from './index.js';

export interface MenuOption<T extends MenuFromCellCallbackArgs | GridMenuCommandItemCallbackArgs | HeaderMenuCommandItemCallbackArgs> {
  // --
  // Methods

  /**
   * Command builder, this function is executed after `commandItems: []` and is also the last call before rendering in the DOM.
   * You would typically use this **instead** of the `commandItems: []`, since you can use this callback to filter/sort the final commands.
   *
   * // for example, you can spread the built-in commands with your own commands
   * gridOptions: {
   *   contextMenu: {
   *     commandListBuilder: (builtInItems) => {
   *       return [
   *         ...builtInItems,
   *         {
   *           command: 'delete-row',
   *           title: 'Delete Row',
   *           iconCssClass: 'mdi mdi-delete text-danger',
   *           action: () => alert('Delete row'),
   *         }
   *       ];
   *     }
   *   }
   * }
   */
  commandListBuilder?: (
    builtInItems: Array<MenuCommandItem | GridMenuItem | 'divider'>
  ) => Array<MenuCommandItem | GridMenuItem | 'divider'>;

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
   * defaultItemRenderer: (cmdItem, args) => `<div>${cmdItem.title}</div>`
   *
   * // Return HTMLElement (e.g. Cell or Context Menu)
   * defaultItemRenderer: (cmdItem, args) => {
   *   const div = document.createElement('div');
   *   div.textContent = `${cmdItem.title} (Row ${args.dataContext.id})`;
   *   return div;
   * }
   */
  defaultItemRenderer?: (cmdItem: any, args: T) => string | HTMLElement;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  menuUsabilityOverride?: (args: T) => boolean;
}
