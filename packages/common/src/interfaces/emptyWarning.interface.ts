export interface EmptyWarning {
  /** Empty data warning message, defaults to "No data to display." */
  message: string | HTMLElement | DocumentFragment;

  /** Empty data warning message translation key, defaults to "EMPTY_DATA_WARNING_MESSAGE" */
  messageKey?: string;

  /** DOM Element class name, defaults to "empty-data-warning" */
  className?: string;

  /** Defaults to "40%", what is the margin-left CSS style to use for a regular grid. */
  leftViewportMarginLeft?: number | string;

  /** Defaults to "10px", what is the margin-left CSS style to use for a pinned grid. */
  pinnedLeftViewportMarginLeft?: number | string;

  /** Defaults to "40%", what is the margin-left CSS style to use for a regular grid. */
  rightViewportMarginLeft?: number | string;

  /** Defaults to "10px", what is the margin-left CSS style to use for a pinned grid. */
  pinnedRightViewportMarginLeft?: number | string;
}
