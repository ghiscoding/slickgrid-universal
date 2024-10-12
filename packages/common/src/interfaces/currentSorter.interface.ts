import type { SortDirection, SortDirectionString } from '../enums/index.js';

export interface CurrentSorter {
  /**
   * Column Id that is defined as a Column in the Columns Definition (column association is done through the "field" property).
   * It will also work with a field that is not defined in the Columns Definition, the only drawback is that it won't add the sort icon.
   * Please note that it will parse through "queryField" and/or "queryFieldSorter" if it is defined to find the targeted column.
   */
  columnId: string | number;

  /** Direction of the sort ASC/DESC */
  direction: SortDirection | SortDirectionString;
}
