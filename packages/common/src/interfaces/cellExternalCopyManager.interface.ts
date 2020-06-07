import { CellRange } from './cellRange.interface';
import { ExcelCopyBufferOption } from './excelCopyBufferOption.interface';
import { SlickEventData } from './slickEventData.interface';
import { SlickEvent } from './slickEvent.interface';
import { SlickGrid } from './slickGrid.interface';

export interface CellExternalCopyManager<T = any> {
  pluginName: 'CellExternalCopyManager';

  /** Constructor of the CellExternalCopyManager 3rd party plugin, it can optionally receive options */
  constructor: (options: ExcelCopyBufferOption<T>) => void;

  /** Initialize the CellExternalCopyManager 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the CellExternalCopyManager 3rd party plugin */
  destroy(): void;

  /** Clear the copy selection */
  clearCopySelection(): void;

  /** Callback method to handle key down event */
  handleKeyDown(event: SlickEventData, args: any): boolean;

  /** Should we include grid column header when copying? */
  setIncludeHeaderWhenCopying(includeHeaderWhenCopying: boolean): void;

  // --
  // Events

  /** Triggered after we copy a range of cells selection */
  onCopyCells: SlickEvent<{ ranges: CellRange[] }>;

  /** Triggered after we cancelled a copy range of cells selection */
  onCopyCancelled: SlickEvent<{ ranges: CellRange[] }>;

  /** Triggered after we paster a range of cells selection */
  onPasteCells: SlickEvent<{ ranges: CellRange[] }>;
}
