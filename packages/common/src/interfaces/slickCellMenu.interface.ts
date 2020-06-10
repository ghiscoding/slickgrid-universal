import {
  CellMenuOption,
  MenuCommandItemCallbackArgs,
  MenuOptionItemCallbackArgs,
  SlickEvent,
  SlickGrid,
} from './index';

/**
 * A plugin to add Menu on a Cell click (click on the cell that has the cellMenu object defined)
 * The "cellMenu" is defined in a Column Definition object
 * Similar to the ContextMenu plugin (could be used in combo),
 * except that it subscribes to the cell "onClick" event (regular mouse click or touch).
 *
 * A general use of this plugin is for an Action Dropdown Menu to do certain things on the row that was clicked
 * You can use it to change the cell data property through a list of Options AND/OR through a list of Commands.
 */
export interface SlickCellMenu {
  pluginName: 'CellMenu';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: CellMenuOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /** Close (hide) the cell menu */
  closeMenu(): void;

  /**
   * Change Cell Menu options
   * @options An object with configuration options.
   */
  setOptions(options: CellMenuOption): void;

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
