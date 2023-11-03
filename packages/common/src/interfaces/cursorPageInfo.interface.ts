export interface CursorPageInfo {
  /** Do we have a next page from current cursor position? */
  hasNextPage: boolean;

  /** Do we have a previous page from current cursor position? */
  hasPreviousPage: boolean;

  /** What is the last cursor? */
  endCursor: string;

  /** What is the first cursor? */
  startCursor: string;
}
