import {
  Column,
  RowMoveManagerOption,
  SlickEvent,
  SlickGrid,
} from './index';

/** A plugin that allows to move/reorganize some rows with drag & drop */
export interface SlickRowMoveManager {
  pluginName: 'RowMoveManager',

  /** Constructor of the 3rd party plugin, user can optionally pass some options to the plugin */
  constructor: (options?: RowMoveManagerOption) => void;

  /** initialize the 3rd party plugin */
  init(grid: SlickGrid): void;

  /** destroy the 3rd party plugin */
  destroy(): void;

  /** Getter of the grid Column Definition for the checkbox selector column */
  getColumnDefinition(): Column;

  /**
   * Change Row Move Manager options
   * @options An object with configuration options.
   */
  setOptions(options: RowMoveManagerOption): void;

  /** Override the logic for showing (or not) the move icon (use case example: only every 2nd row is moveable) */
  usabilityOverride?: (row: number, dataContext: any, grid: SlickGrid) => boolean;

  // --
  // Events

  /** triggered before rows are being moved */
  onBeforeMoveRows: SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number; }>;

  /** triggered when rows are being moved */
  onMoveRows: SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number; }>;
}
