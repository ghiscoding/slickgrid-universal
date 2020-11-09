import { SlickCellRangeDecorator, SlickGrid, SlickRange } from './index';
import { CellRange } from './cellRange.interface';
import { SlickEvent } from './slickEvent.interface';

export interface SlickCellRangeSelector {
  pluginName: 'CellRangeSelector'

  /** Constructor of the CellRangeSelector 3rd party plugin, it can optionally receive options */
  constructor: (options?: { cellDecorator?: SlickCellRangeDecorator; selectionCss?: { [cssRule: string]: string | number | boolean; } }) => void;

  /** Initialize the CellRangeSelector 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the CellRangeSelector 3rd party plugin */
  destroy(): void;

  /** Get cell range decorator object */
  getCellDecorator(): SlickCellRangeDecorator;

  /** Get current cell range */
  getCurrentRange(): CellRange;

  // --
  // Events

  /** Triggered just before a cell range selection happens */
  onBeforeCellRangeSelected: SlickEvent<{ cell: { row: number; cell: number; } }>;

  /** Triggered after a cell range selection happened */
  onCellRangeSelected: SlickEvent<{ range: SlickRange }>;
}
