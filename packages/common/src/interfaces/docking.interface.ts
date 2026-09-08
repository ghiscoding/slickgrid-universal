export type DockingSide = 'left' | 'right';

export type DockingOverflowStrategy = 'conveyor' | 'clamp' | 'priority';

/** An edge boundary/count or explicit column indexes and ids used by pinning. */
export type ColumnPinningReferences = number | Array<number | string>;

/**
 * Column references used inside the unified `GridOption.pinning` option and
 * grid-state presets. This is the nested value shape, not a separate
 * `pinnedColumns` grid option.
 */
export interface PinnedColumns {
  /**
   * Column indexes or ids to pin to the left edge.
   * A number is an inclusive zero-based boundary (`2` pins indexes `0`, `1`, and `2`).
   * An array accepts zero-based indexes and/or stable column ids for non-contiguous pinning.
   */
  left?: ColumnPinningReferences;

  /**
   * Column indexes or ids to pin to the right edge.
   * A number is a count from the trailing edge (`1` pins the last column position; `0` pins none).
   * An array accepts zero-based indexes and/or stable column ids for non-contiguous pinning.
   */
  right?: ColumnPinningReferences;
}

export interface PinnedRows {
  /** Row indexes or stable row ids to pin permanently to the top edge. */
  top?: Array<number | string>;

  /** Row indexes or stable row ids to pin permanently to the bottom edge. */
  bottom?: Array<number | string>;
}

/** Permanent pinning for both grid axes. */
export interface PinningOption {
  /** Configuration for columns pinned permanently to the left or right edge. */
  columns?: PinnedColumns;

  /** Configuration for rows pinned permanently to the top or bottom edge. */
  rows?: PinnedRows;
}

export interface StickyRows {
  /** Row indexes or stable row ids that dock to the top after scrolling past them. */
  top?: Array<number | string>;

  /** Row indexes or stable row ids that dock to the bottom after scrolling back above them. */
  bottom?: Array<number | string>;

  /** Row indexes or stable row ids that dock to the nearest edge when normal scrolling would clip them. */
  both?: Array<number | string>;
}

export interface DockingOption {
  /** Maximum percentage of the viewport width that left and right docked columns may occupy. Defaults to 60. */
  maxColumnViewportWidthPercent?: number;

  /** Maximum percentage of the viewport height that top and bottom docked rows may occupy. Defaults to 60. */
  maxRowViewportHeightPercent?: number;

  /** How sticky candidates are reduced when their pixel budget is exhausted. Defaults to `conveyor`. */
  overflowStrategy?: DockingOverflowStrategy;

  /** Pixel hysteresis used before changing a sticky item's docked state. Defaults to 2. */
  stickyHysteresis?: number;
}

export type ColumnDockingBand = 'left' | 'center' | 'right';
export type RowDockingBand = 'top' | 'center' | 'bottom';

export interface DockedColumn {
  band: ColumnDockingBand;
  index: number;
  naturalOffset: number;
  offset: number;
  sticky: boolean;
  width: number;
}

export interface ColumnDockingLayout {
  center: DockedColumn[];
  centerWidth: number;
  contentWidth: number;
  left: DockedColumn[];
  leftBaseWidth: number;
  leftWidth: number;
  revision: number;
  right: DockedColumn[];
  rightBaseWidth: number;
  rightWidth: number;
}

export interface DockingRow {
  height: number;
  id: number | string;
  index: number;
  top: number;
}

export interface DockedRow extends DockingRow {
  band: RowDockingBand;
  offset: number;
  sticky: boolean;
}

export interface RowDockingLayout {
  bottom: DockedRow[];
  bottomHeight: number;
  center: DockedRow[];
  revision: number;
  top: DockedRow[];
  topHeight: number;
}
