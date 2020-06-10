import {
  Column,
  HeaderMenuOption,
  MenuCommandItemCallbackArgs,
  SlickEvent,
  SlickGrid,
} from './index';

/** A plugin to add drop-down menus to column headers. */
export interface SlickHeaderMenu {
  pluginName: 'HeaderMenu';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: HeaderMenuOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /**
   * Change Header Menu options
   * @options An object with configuration options.
   */
  setOptions(options: HeaderMenuOption): void;

  // --
  // Events

  /** Fired After the header menu shows up. */
  onAfterMenuShow?: SlickEvent<{ grid: SlickGrid; column: Column; menu: HTMLElement; }>;

  /** Fired Before the header menu shows up. */
  onBeforeMenuShow?: SlickEvent<{ grid: SlickGrid; column: Column; menu: HTMLElement; }>;

  /** Fired when a command is clicked */
  onCommand?: SlickEvent<MenuCommandItemCallbackArgs>;
}
