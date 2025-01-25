import type { ResizerOption } from './resizerOption.interface.js';

export interface AutoResizeOption extends ResizerOption {
  /** defaults to true, should it try to auto-resize the grid height by the data length */
  autoHeight?: boolean;

  /** defaults to 100, what is the row count that we'll start recalculating the grid height by the dataset length */
  autoHeightRecalcRow?: number;

  /** defaults to 10ms, delay before triggering the auto-resize (only on 1st page load) */
  delay?: number;
}
