import {
  Column,
  GridMenuOption,
  GridOption,
  MenuCommandItemCallbackArgs,
  SlickEvent,
  SlickGrid,
} from './index';
import { SlickEventData } from './slickEventData.interface';

/** A control to add a Column Picker (right+click on any column header to reveal the column picker) */
export interface SlickGridMenu {
  /** Constructor of the SlickGrid 3rd party control, it can optionally receive options */
  constructor: (columns: Column[], grid: SlickGrid, options?: GridOption) => void;

  /** Initialize the SlickGrid 3rd party control */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party control, deletes the DOM element & unsubsribes all events */
  destroy(): void;

  /** Delete the menu DOM element but without unsubscribing any events */
  deleteMenu(): void;

  /** Delete and then Recreate the Grid Menu (for example when we switch from regular to a frozen grid) */
  recreateGridMenu(): void;

  /** Get all columns (includes visible and hidden columns) */
  getAllColumns(): Column[];

  /** Get only the visible columns */
  getVisibleColumns(): Column[];

  /**
   * Change Grid Menu options
   * @options An object with configuration options.
   */
  setOptions(options: GridMenuOption): void;

  /** Execute show grid menu */
  showGridMenu(e: SlickEventData): void;

  /** Update the Titles of each sections (command, customTitle, ...) with provided new titles */
  updateAllTitles(options: GridMenuOption): void;


  // --
  // Events

  /** SlickGrid Event fired After the menu is shown. */
  onAfterMenuShow?: SlickEvent<{
    /** Slick Grid object */
    grid: SlickGrid;

    /** Grid Menu DOM element */
    menu: HTMLElement;

    /** only visible columns (excluding hidden columns) */
    columns: Column[]
  }>;

  /** SlickGrid Event fired Before the menu is shown. */
  onBeforeMenuShow?: SlickEvent<{
    /** Slick Grid object */
    grid: SlickGrid;

    /** Grid Menu DOM element */
    menu: HTMLElement;

    /** only visible columns (excluding hidden columns) */
    columns: Column[]
  }>;

  /** SlickGrid Event fired when any of the columns checkbox selection changes. */
  onColumnsChanged?: SlickEvent<{
    /** columnId that triggered the picker column change */
    columnId: string,

    /** is the column showing or hiding? */
    showing: boolean,

    /** all columns (including hidden ones) */
    allColumns: Column[],

    /** only visible columns (excluding hidden columns) */
    columns: Column[],

    /** Slick Grid object */
    grid: SlickGrid;
  }>;

  /** SlickGrid Event fired when the menu is closing. */
  onMenuClose?: SlickEvent<{
    /** Slick Grid object */
    grid: SlickGrid;

    /** Grid Menu DOM element */
    menu: HTMLElement;

    /** all columns (including hidden ones) */
    allColumns: Column[];

    /** only visible columns (excluding hidden columns) */
    visibleColumns: Column[]
  }>;

  /** SlickGrid Event fired on menu option clicked from the Command items list */
  onCommand?: SlickEvent<MenuCommandItemCallbackArgs>;
}
