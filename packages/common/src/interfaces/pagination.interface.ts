export interface Pagination {
  /**
   * Defaults to "width: calc(100% - ${gridOptions.autoResize.rightPadding}px)", CSS width of the Pagination element.
   * The width is calculated by taking in consideration "autoResize.rightPadding" that might optionally be provided in the grid options
   *
   * IMPORTANT NOTE:
   * This property is already used by the "width" calculation, which is the default CSS styling (width: calc(100% - {rightPadding})),
   * If you want to use it for something else than the width then make sure to also include the width calculation inside that text styling
   */
  cssText?: string;

  /** Current page number that we are we currently displaying. */
  pageNumber?: number;

  /** The available page sizes */
  pageSizes: number[];

  /** Current page size chosen */
  pageSize: number;

  /** The full total count of items for the entire dataset */
  totalItems?: number;
}
