import {
  ContextMenuOption,
  MenuCommandItemCallbackArgs,
  MenuOptionItemCallbackArgs,
  SlickEvent,
  SlickGrid,
} from './index';

/**
 * A plugin to add Context Menu (mouse right+click), it subscribes to the cell "onContextMenu" event.
 * The "contextMenu" is defined in the Grid Options object
 * You can use it to change a data property (only 1) through a list of Options AND/OR through a list of Commands.
 * A good example of a Command would be an Export to CSV, that can be run from anywhere in the grid by doing a mouse right+click
 */
export interface SlickContextMenu {
  pluginName: 'ContextMenu';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: ContextMenuOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /** Close (hide) the context menu */
  closeMenu(): void;

  /**
   * Change Context Menu options
   * @options An object with configuration options.
   */
  setOptions(options: ContextMenuOption): void;

  // --
  // Events

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow: SlickEvent<{ cell: number; row: number; grid: SlickGrid; }>;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow: SlickEvent<{ cell: number; row: number; grid: SlickGrid; }>;

  /** SlickGrid Event fired when the menu is closing. */
  onBeforeMenuClose: SlickEvent<{ cell: number; row: number; grid: SlickGrid; menu: HTMLElement; }>;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand: SlickEvent<MenuCommandItemCallbackArgs>;

  /** SlickGrid Event fired on menu option selected from the Option items list. */
  onOptionSelected: SlickEvent<MenuOptionItemCallbackArgs>;
}
