import type { GridOption } from './gridOption.interface.js';

/** Method that user can pass to override the default behavior or making every row a selectable row. */
export type SelectableOverrideCallback<T> = (
  /** Row position in the grid */
  row: number,

  /** Item data context object */
  dataContext: T,

  /** SlickGrid object */
  gridOptions: GridOption
) => boolean;
