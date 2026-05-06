import type { SlickGrid } from '../core/slickGrid';
import type { Column } from './column.interface';

export interface FormattedDataCacheProgressEventArgs {
  rowsProcessed: number;
  totalRows: number;
  percentComplete: number;
  elapsedMs: number;
}

export interface FormattedDataCacheCompletedEventArgs {
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
  /** Strip HTML tags from the export string (only used for dualCacheColumns) */
  sanitizeDataExport: boolean;
}

export interface RowCacheContext {
  grid: SlickGrid;
  /** Grid options hoisted once per batch — avoids getOptions() per row */
  gridOptions: ReturnType<SlickGrid['getOptions']>;
  exportOptions: any;
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
