import { SlickEvent } from './slickEvent.interface';
import { SelectedRange } from './selectedRange.interface';

export interface CellSelectionModel {
  /** initialize the selection model */
  init(args: any): void;

  /** destroy the selection model */
  destroy(): void;

  /** Set a new selected ranges */
  getSelectedRanges(): SelectedRange[];

  /** Set a new selected ranges */
  setSelectedRanges(ranges: SelectedRange[]): void;

  // --
  // Events

  /** triggered when selected ranges changes */
  onSelectedRangesChanged: SlickEvent<{ ranges: SelectedRange[] }>;
}
