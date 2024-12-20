import type { Column, Formatter, GroupTotalsFormatter } from './index.js';

/**
 * Provides a powerful way to specify additional informations of data item that can be used customize the grid appearance
 * and handling of a particular data item. The method should return `null` when the item requires no special handling,
 * or an object following the ItemMetadata interface
 */
export interface ItemMetadata {
  // properties describing metadata related to the item (e.g. grid row) itself

  /** One or more (space-separated) CSS classes that will be added to the entire row. */
  cssClasses?: string;

  /** Whether or not any cells in the row can be set as "active". */
  focusable?: boolean;

  /** A custom group formatter. */
  formatter?: GroupTotalsFormatter | Formatter;

  /** Whether or not a row or any cells in it can be selected. */
  selectable?: boolean;

  /** column-level metadata */
  columns?: {
    // properties describing metadata related to individual columns
    [colIdOrIdx in string | number]: Pick<Column, 'colspan' | 'editorClass' | 'focusable' | 'formatter' | 'selectable'>;
  };
}
