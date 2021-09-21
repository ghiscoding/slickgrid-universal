export interface ResizerOption {
  /** Defaults to false, do we want to apply the resized dimentions to the grid container as well? */
  applyResizeToContainer?: boolean;

  /**
   * Defaults to 'window', which DOM element are we using to calculate the available size for the grid?
   * When {@link useResizeObserver}=true the {@link container} is used and this option is ignored.
   */
  calculateAvailableSizeBy?: 'container' | 'window';

  /** bottom padding of the grid in pixels */
  bottomPadding?: number;

  /**
   * Page Container. Either selector (for example '.page-container' or '#page-container'), or an HTMLElement.
   * Basically what element in the page will be used to calculate the available space.
   */
  container?: string | HTMLElement;

  /**
   * Grid Container selector, for example '.myGrid' or '#myGrid', this is provided by the lib internally.
   *
   * Optional but when provided it will be resized with same size as the grid (typically a container holding the grid and extra custom footer/pagination)
   * This is useful when you want the footer/pagination to be exactly the same width as the grid (this lib takes care of it internally)
   */
  gridContainer?: string | HTMLElement;

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

  /**
   * Use a [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to detect resizes on the {@link container} element instead of window resize events.
   *
   * Remarks:
   * * Requires {@link container} to be set.
   *
   * * ResizeObserver is not supported on older browsers like Internet Explorer. If you need the support you need to install a
   * polyfill like [resize-observer-polyfill](https://www.npmjs.com/package/resize-observer-polyfill) yourself.
   *
   * * If you get 'ResizeObserver loop limit exceeded' errors in automated tests take a look
   * [here](https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded).
   */
  useResizeObserver?: boolean;
}
