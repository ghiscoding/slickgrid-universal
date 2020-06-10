import {
  CellRange,
  ExcelCopyBufferOption,
  SlickEvent,
  SlickEventData,
  SlickGrid
} from './index';

export interface SlickCellExternalCopyManager<T = any> {
  pluginName: 'CellExternalCopyManager';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: ExcelCopyBufferOption<T>) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
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
