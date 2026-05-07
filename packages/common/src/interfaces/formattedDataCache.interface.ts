import type { SlickGrid } from '../core/slickGrid.js';
import type { Column } from './column.interface.js';

export interface OnFormattedDataCacheProgressEventArgs {
  rowsProcessed: number;
  totalRows: number;
  percentComplete: number;
  elapsedMs: number;
}

export interface OnFormattedDataCacheCompletedEventArgs {
  totalRows: number;
  totalFormattedCells: number;
  durationMs: number;
}

export interface FormattedDataCacheMetadata {
  isPopulating: boolean;
  lastProcessedRow: number;
  totalFormattedCells: number;
  cacheStartTime?: number;
}

/** Pre-computed per-batch context passed into populateSingleRowCache to avoid redundant method calls */
export interface ColumnCacheEntry {
  column: Column;
  colIdx: number;
  columnId: string;
  field?: Column['field'];
  formatter?: Column['formatter'];
  /** Consumer-specific export options used when computing export cache value for this column */
  exportOptions?: any;
  /** Strip HTML tags from the export string (only used for dualCacheColumns) */
  sanitizeDataExport: boolean;
}

export interface FormattedDataCacheColumnConfig {
  /** Set to true when this consumer needs an export cache entry for the provided column */
  shouldCacheExport: boolean;
  /** Consumer options object forwarded to formatter utility helpers */
  exportOptions?: any;
  /**
   * Set to true when export cache can reuse the column `formatter` output.
   * Set to false when export uses a custom export formatter or other non-cell path.
   */
  useCellFormatterForExport?: boolean;
  /** Strip HTML tags from the cached export string for this consumer/column */
  sanitizeDataExport?: boolean;
}

/** External planner callback used by SlickDataView to decide cache behavior per column. */
export type FormattedDataCachePlanner = (
  column: Column,
  gridOptions: ReturnType<SlickGrid['getOptions']>
) => FormattedDataCacheColumnConfig | undefined;

export interface RowCacheContext {
  grid: SlickGrid;
  /** Grid options hoisted once per batch — avoids getOptions() per row */
  gridOptions: ReturnType<SlickGrid['getOptions']>;
  /**
   * Columns needing export cache only: those with `exportCustomFormatter` (uses a different formatter
   * than the cell display) OR columns with `exportWithFormatter` but no cell `formatter`.
   */
  exportOnlyCacheColumns: ColumnCacheEntry[];
  /**
   * Columns where the same `formatter` serves both the export cache and the cell display cache.
   * The formatter is called ONCE per row and the result is post-processed for both caches,
   * avoiding the duplicate formatter invocation that `exportWithFormatterWhenDefined` would cause.
   */
  dualCacheColumns: ColumnCacheEntry[];
  /** Columns with a cell `formatter` that are NOT in the export cache. */
  cellOnlyColumns: ColumnCacheEntry[];
  /** Direct reference to the rows array — avoids getItem() overhead and its redundant group/totals checks */
  rows: any[];
  /** Cached idProperty string — avoids a prototype lookup per row */
  idProperty: string;
  /** False when no globalItemMetadataProvider / groupItemMetadataProvider is set — skips getItemMetadata() per row */
  hasMetadataProviders: boolean;
}
