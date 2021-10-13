import { Observable, Subject } from '../services/rxjsFacade';
import { Column, Formatter, SlickGrid } from './index';

type PostProcessOutput<P> = P & { [asyncParamsPropName: string]: any; };
export type AsyncPostProcess<T = any> = (row: number, cell: number, value: any, columnDef: Column<T>, dataContext: T, grid?: SlickGrid) => Promise<PostProcessOutput<T>> | Observable<PostProcessOutput<T>> | Subject<PostProcessOutput<T>>;

export interface CustomTooltipOption<T = any> {
  /**
   * defaults to 25(px), left margin to display the arrow.
   * when a number is provided it will assume the value is in pixel,
   * or else we could also a string for example "50%" would show the arrow in the center.
   */
  arrowMarginLeft?: number | string;

  /** defaults to "__params", optionally change the property name that will be used to merge the data returned by the async method into the `dataContext` object */
  asyncParamsPropName?: string;

  /**
   * Async Post method returning a Promise, it must return an object with 1 or more properties
   * Note: internally the data that will automatically be merged into the `dataContext` object under the `__params` property so that you can use it in your `asyncPostFormatter` formatter.
   */
  asyncPostProcess?: AsyncPostProcess<T>;

  /** Formatter to execute once the async process is completed, to displayed the actual text result (used when dealing with an Async API to get data to display later in the tooltip) */
  asyncPostFormatter?: Formatter;

  /** defaults to False, should we hide the tooltip pointer arrow? */
  hideArrow?: boolean;

  /** defaults to "slick-custom-tooltip" */
  className?: string;

  /**
   * Formatter to execute for displaying the data that will show in the tooltip
   * NOTE: when using `asyncPostProcess`, this formatter will executed first and prior to actual the async process,
   * in other words you will want to use this formatter as a loading spinner formatter and the `asyncPostFormatter` as the final formatter.
   */
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