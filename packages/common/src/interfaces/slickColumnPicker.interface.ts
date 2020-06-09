import {
  Column,
  ColumnPickerOption,
  SlickEvent,
  SlickGrid,
} from './index';

/** A control to add a Column Picker (right+click on any column header to reveal the column picker) */
export interface SlickColumnPicker {
  /** Constructor of the SlickGrid 3rd party control, it can optionally receive options */
  constructor: (columns: Column[], grid: SlickGrid, options?: ColumnPickerOption) => void;

  /** Initialize the SlickGrid 3rd party control */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party control */
  destroy(): void;

  /** Get all columns (includes visible and hidden columns) */
  getAllColumns(): Column[];

  /** Get only the visible columns */
  getVisibleColumns(): Column[];

  /** Update the Titles of each sections (command, customTitle, ...) with provided new titles */
  updateAllTitles(options: ColumnPickerOption): void;

  // --
  // Events

  /** SlickGrid Event fired when any of the columns checkbox selection changes. */
  onColumnsChanged: SlickEvent<{ allColumns: Column[], columns: Column[], grid: SlickGrid }>;
}
