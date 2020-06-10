import {
  CheckboxSelectorOption,
  Column,
  SlickGrid,
} from './index';

/**
 * A plugin to select row(s) via checkboxes typically shown as the 1st column in the grid.
 * The plugin keeps tracks of the selected row position in the grid.
 * Note that the selected row(s) are kept via their row position in the grid not by their Ids,
 * however if user uses the SlickGrid DataView and wants to keep their position by their Ids then he could enable the "syncGridSelection".
 */
export interface SlickCheckboxSelectColumn<T = any> {
  pluginName: 'CheckboxSelectColumn';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: CheckboxSelectorOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /** De-select an array of rows */
  deSelectRows(rowArray: number[]): void;

  /** De-select an array of rows */
  selectRows(rowArray: number[]): void;

  /** Getter of the grid Column Definition for the checkbox selector column */
  getColumnDefinition(): Column;

  /** Getter of the grid options */
  getOptions(): CheckboxSelectorOption;

  /**
   * Method that user can pass to override the default behavior or making every row a selectable row.
   * In order word, user can choose which rows to be selectable or not by providing his own logic.
   * @param overrideFn: override function callback
   */
  selectableOverride(overrideFn: SelectableOverrideCallback<T>): void;

  /**
   * Change plugin options
   * @options An object with configuration options.
   */
  setOptions(options: CheckboxSelectorOption): void;
}

/** Method that user can pass to override the default behavior or making every row a selectable row. */
export type SelectableOverrideCallback<T> = (
  /** Row position in the grid */
  row: number,

  /** Item data context object */
  dataContext: T,

  /** SlickGrid object */
  grid: SlickGrid
) => boolean;
