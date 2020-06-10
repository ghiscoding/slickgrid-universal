import { CellRange } from './cellRange.interface';
import { SlickEvent } from './slickEvent.interface';

export type RowSelectionModelOption = {
  /** do we want to select the active row? */
  selectActiveRow?: boolean;
};

export interface SlickRowSelectionModel {
  pluginName: 'RowSelectionModel',

  /** Constructor of the 3rd party plugin, user can optionally pass some options to the plugin */
  constructor: (options?: RowSelectionModelOption) => void;

  /** initialize the selection model */
  init(args: any): void;

  /** destroy the selection model */
  destroy(): void;

  /** Get selected row positions in the grid */
  getSelectedRows(): number[];

  /** Set new selected rows in the grid */
  setSelectedRows(selectedRows: number[]): void;

  /** Get selected rows range */
  getSelectedRanges(): CellRange[];

  /** Set a new selected ranges */
  setSelectedRanges(ranges: CellRange[]): void;

  // --
  // Events

  /** triggered when selected ranges changes */
  onSelectedRangesChanged: SlickEvent<{ ranges: CellRange[] }>;
}
