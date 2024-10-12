import type { PaginationChangedArgs } from './paginationChangedArgs.interface.js';

export interface PaginationCursorChangedArgs extends PaginationChangedArgs {
  /** Start our page After cursor X */
  after?: string;

  /** Start our page Before cursor X */
  before?: string;

  /** Get first X number of objects */
  first?: number;

  /** Get last X number of objects */
  last?: number;
}
