export interface CurrentColumn {
  /** Column id (in the column definitions) */
  columnId: string;

  /** Column CSS Class  */
  cssClass?: string;

  /** Header CSS Class  */
  headerCssClass?: string;

  /** Column width */
  width?: number;

  /** when enabled, the "hidden" column property will be included (defaults to false) */
  hidden?: boolean;
}
