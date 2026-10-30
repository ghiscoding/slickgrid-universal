export interface ResizeByContentOption {
  /** defaults to false, if a column `width` is provided (or was previously calculated) should we recalculate it or not when resizing by cell content? */
  alwaysRecalculateColumnWidth?: boolean;

  /**
   * Cell padding width (including borders) to add to the calculation when resizing columns by their cell text content.
   * When not provided, it will be read from the `.slick-cell` CSS (padding-left/right & border-left/right widths).
   */
  cellPaddingWidthInPx?: number;

  /** Defaults to 0, extra padding width to add to the calculation of a column that has an Editor when the grid is editable. */
  formatterPaddingWidthInPx?: number;

  /**
   * Defaults to false, should we also include the column header title width (incl. sort & header menu icons) when resizing columns by their cell content?
   * When enabled, a column will never become narrower than its header title.
   */
  includeHeaderWidth?: boolean;

  /**
   * Defaults to 1000, maximum count of rows to inspect when calculating all column widths by their cell content.
   * When the dataset is larger, the rows are sampled evenly across the whole dataset (instead of only reading the first rows).
   */
  sampleSize?: number;

  /**
   * Defaults to 5000, maximum count of rows to inspect when resizing a single column by its content
   * (via the header menu "Resize by Content" command and/or double-click on the column resize handle).
   */
  singleColumnSampleSize?: number;
}
