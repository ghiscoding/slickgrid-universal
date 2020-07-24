export interface ResizerOption {
  /** Defaults to 'window', which DOM element are we using to calculate the available size for the grid? */
  calculateAvailableSizeBy?: 'container' | 'window';

  /** bottom padding of the grid in pixels */
  bottomPadding?: number;

  /** Page Container selector, for example '.page-container' or '#page-container' */
  container?: string;

  /**
   * Grid Container selector, for example '.myGrid' or '#myGrid', typically contain the grid and/or a footer/pagination inside the same grid container
   * Optional but if it's provided then it will also be resized at the same size as the grid (useful when adding a custom footer/pagination)
   */
  gridContainer?: string;

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
