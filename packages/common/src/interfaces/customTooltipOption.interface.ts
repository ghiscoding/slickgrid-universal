import { Column, Formatter, SlickGrid } from './index';

export interface CustomTooltipOption {
  /**
   * defaults to 25(px), left margin to display the arrow.
   * when a number is provided it will assume the value is in pixel,
   * or else we could also a string for example "50%" would show the arrow in the center.
   */
  arrowMarginLeft?: number | string;

  /** defaults to False, should we hide the tooltip pointer arrow? */
  hideArrow?: boolean;

  /** defaults to "slick-custom-tooltip" */
  className?: string;

  /** Formatter to execute for display the data that will show */
  formatter: Formatter;

  /** defaults to 0, optional left offset, it must be a positive/negative number (in pixel) that will be added to the offset position calculation of the tooltip container. */
  offsetLeft?: number;

  /** defaults to 0, optional top offset, it must be a positive/negative number (in pixel) that will be added to the offset position calculation of the tooltip container. */
  offsetTop?: number;

  // --
  // callback functions
  // -------------------

  // --
  // Methods

  /** Callback method that user can override the default behavior of showing the tooltip. If it returns False, then the tooltip won't show */
  usabilityOverride?: (args: { cell: number; row: number; column: Column; dataContext: any; grid: SlickGrid; }) => boolean;
}