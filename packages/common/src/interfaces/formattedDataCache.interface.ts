export interface FormattedDataCacheProgressEventArgs {
  rowsProcessed: number;
  totalRows: number;
  percentComplete: number;
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
