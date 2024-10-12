import type { GridSize, ResizerOption } from './index.js';
import type { SlickEvent, SlickEventData, SlickGrid } from '../core/index.js';

/**
 * A Resizer plugin that can be used to auto-resize a grid and/or resize with fixed dimensions.
 * When fixed height is defined, it will auto-resize only the width and vice versa with the width defined.
 * You can also choose to use the flag `enableAutoSizeColumns` if you want to the plugin to
 * automatically call the grid `autosizeColumns()` method after each resize.
 *
 * There is now also a second grid option `enableAutoResizeColumnsByCellContent` (instead of `autosizeColumns`) that you could use,
 * it's however optional and not enabled by default since there are performance impact to using this option (it needs to loop through your dataset to evaluate sizes).
 */
export interface SlickResizer {
  pluginName: 'Resizer';

  /** Constructor of the 3rd party plugin, user can optionally pass some options to the plugin */
  constructor: (options?: ResizerOption, fixedGridDimensions?: GridSize) => void;

  /** initialize the 3rd party plugin */
  init(grid: SlickGrid): void;

  /** destroy the 3rd party plugin */
  destroy(): void;

  /**
   * Bind an auto resize trigger on the datagrid, if that is enable then it will resize itself to the available space
   * Options: we could also provide a % factor to resize on each height/width independently
   */
  bindAutoResizeDataGrid(newSizes: GridSize): void;

  /**
   * Return the last resize dimensions used by the service
   * @return {object} last dimensions (height: number, width: number)
   */
  getLastResizeDimensions(): GridSize;

  /**
   * Provide the possibility to pause the resizer for some time, until user decides to re-enabled it later if he wish to.
   * @param {boolean} isResizePaused are we pausing the resizer?
   */
  pauseResizer(isResizePaused: boolean): void;

  /**
   * Resize the datagrid to fit the browser height & width.
   * @param {number} delay to wait before resizing, defaults to 0 (in milliseconds)
   * @param {object} newSizes can optionally be passed (height: number, width: number)
   * @param {object} event that triggered the resize, defaults to null
   * @return If the browser supports it, we can return a Promise that would resolve with the new dimensions
   */
  resizeGrid(delay?: number, newSizes?: GridSize, event?: SlickEventData): Promise<GridSize>;

  // --
  // Events

  /** triggered before rows are being moved */
  onGridAfterResize: SlickEvent<{ grid: SlickGrid; dimensions: GridSize; }>;

  /** triggered when rows are being moved */
  onGridBeforeResize: SlickEvent<{ grid: SlickGrid; }>;
}
