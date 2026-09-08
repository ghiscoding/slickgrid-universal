export type DockingSide = 'left' | 'right';

export type DockingOverflowStrategy = 'conveyor' | 'clamp' | 'priority';

/** A column boundary or explicit column references used by the pinning option. */
export type ColumnPinningReferences = number | Array<number | string>;

/**
 * Column references used inside the unified `GridOption.pinning` option and
 * grid-state presets. This is the nested value shape, not a separate
 * `pinnedColumns` grid option.
 */
export interface PinnedColumns {
  /**
   * Columns pinned to the left edge. A number is an inclusive zero-based last
   * index (the same meaning as legacy `frozenColumn`). Arrays support ids,
   * indexes, and non-contiguous pinning.
   */
  left?: ColumnPinningReferences;

  /**
   * Columns pinned to the right edge. A number is a count from the trailing
   * edge (`0` means none); arrays support ids, indexes, and non-contiguous
   * pinning.
   */
  right?: ColumnPinningReferences;
}

export interface PinnedRows {
  /** Stable row ids (or row indexes) permanently docked to the top edge. */
  top?: Array<number | string>;

  /** Stable row ids (or row indexes) permanently docked to the bottom edge. */
  bottom?: Array<number | string>;
}

/** Permanent pinning for both grid axes. */
export interface PinningOption {
  /** Permanently docked columns. */
  columns?: PinnedColumns;

  /** Permanently docked rows. */
  rows?: PinnedRows;
}

export interface StickyRows {
  /** Stable row ids (or row indexes) that dock to the top after scrolling past them. */
  top?: Array<number | string>;

  /** Stable row ids (or row indexes) that dock to the bottom after scrolling back above them. */
  bottom?: Array<number | string>;

  /** Stable row ids (or row indexes) that dock to the closest edge after normal scrolling would clip them. */
  both?: Array<number | string>;
}

export interface DockingOption {
  /** Maximum viewport width that left and right docked columns may occupy. Defaults to 60. */
  maxColumnViewportWidthPercent?: number;

  /** Maximum viewport height that top and bottom docked rows may occupy. Defaults to 60. */
  maxRowViewportHeightPercent?: number;

  /** How sticky candidates are reduced when their pixel budget is exhausted. Defaults to `conveyor`. */
  overflowStrategy?: DockingOverflowStrategy;

  /** Pixel hysteresis used before changing a sticky item's docked state. Defaults to 2. */
  stickyHysteresis?: number;
}
