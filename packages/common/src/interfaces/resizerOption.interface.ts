export interface ResizerOption {
  /** Defaults to 'window', which DOM element are we using to calculate the available size for the grid? */
  calculateAvailableSizeBy?: 'container' | 'window';

  /** bottom padding of the grid in pixels */
  bottomPadding?: number;

  /** container selector, for example '.myGrid' or '#myGrid' */
  container?: string;

  /** maximum height (pixels) of the grid */
  maxHeight?: number;

  /** minimum height (pixels) of the grid */
  minHeight?: number;

  /** maximum width (pixels) of the grid */
  maxWidth?: number;

  /** minimum width (pixels) of the grid */
  minWidth?: number;

  /** padding on the right side of the grid (pixels) */
  rightPadding?: number;
}
