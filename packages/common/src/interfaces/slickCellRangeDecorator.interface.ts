import { SlickGrid } from './slickGrid.interface';
import { CellRange } from './cellRange.interface';

export interface SlickCellRangeDecorator {
  pluginName: 'CellRangeDecorator'

  /** Constructor of the CellRangeDecorator 3rd party plugin, it can optionally receive options */
  constructor: (grid: SlickGrid, options?: { cellDecorator?: any; selectionCss?: { [cssRule: string]: string | number | boolean; } }) => void;

  /** Show a cell range decoration. Displays an overlay on top of a given cell range. */
  show(cellRange: CellRange): HTMLElement;

  /** Hide any cell range decoration */
  hide(): void;
}
