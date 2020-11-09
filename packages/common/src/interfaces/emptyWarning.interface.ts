export interface EmptyWarning {
  /** Empty data warning message, defaults to "No data to display." */
  message: string;

  /** Empty data warning message translation key, defaults to "EMPTY_DATA_WARNING_MESSAGE" */
  messageKey?: string;

  /** DOM Element class name, defaults to "empty-data-warning" */
  class?: string;

  /** Top margin position, number in pixel, of where the warning message will be displayed, default calculation is (header title row + filter row + 5px) */
  marginTop?: number;

  /** Left margin position, number in pixel, of where the warning message will be displayed, defaults to 10px */
  marginLeft?: number;
}
