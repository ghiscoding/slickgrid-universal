import type { MetricTexts } from './metricTexts.interface';

export interface CustomFooterOption {
  /** Optionally provide some text to be displayed on the left side of the footer (in the "left-footer" css class) */
  leftFooterText?: string;

  /** CSS class used for the left container */
  leftContainerClass?: string;

  /** Date format used when showing the "Last Update" timestamp in the metrics section. */
  dateFormat?: string;

  /** Defaults to 25, height of the Custom Footer in pixels, it could be a number (25) or a string ("25px") but it has to be in pixels. It will be used by the auto-resizer calculations. */
  footerHeight?: number | string;

  /**
   * Defaults to false, which will hide the selected rows count on the bottom left of the footer.
   * NOTE: if users defined a `leftFooterText`, then the selected rows count will NOT show up.
   */
  hideRowSelectionCount?: boolean;

  /** Defaults to false, do we want to hide the last update timestamp (endTime)? */
  hideLastUpdateTimestamp?: boolean;

  /**
   * Defaults to false, do we want to hide the metrics (right section) when the footer is displayed?
   * That could be used when we want to display only the left section with custom text
   */
  hideMetrics?: boolean;

  /** Defaults to false, do we want to hide the total item count of the entire dataset (the count exclude any filtered data) */
  hideTotalItemCount?: boolean;

  /** Defaults to "|", separator between the timestamp and the total count */
  metricSeparator?: string;

  /** Text shown in the custom footer on the far right for the metrics */
  metricTexts?: MetricTexts;

  /** CSS class used for the right container */
  rightContainerClass?: string;

  /** Optionally provide some text to be displayed on the right side of the footer (in the "right-footer" css class) */
  rightFooterText?: string;
}
