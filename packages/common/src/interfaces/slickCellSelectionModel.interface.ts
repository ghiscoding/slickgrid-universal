import { CellRange } from './cellRange.interface';
import { SlickEvent } from './slickEvent.interface';

export interface SlickCellSelectionModel {
  pluginName: 'CellSelectionModel',

  /** initialize the selection model */
  init(args: any): void;

  /** destroy the selection model */
  destroy(): void;

  /** Get selected ranges */
  getSelectedRanges(): CellRange[];

  /** Set a new selected ranges */
  setSelectedRanges(ranges: CellRange[]): void;

  // --
  // Events

  /** triggered when selected ranges changes */
  onSelectedRangesChanged: SlickEvent<{ ranges: CellRange[] }>;
}
