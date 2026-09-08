import type { Column, DockingOption, DockingSide, PinnedRows, StickyRows } from '../interfaces/index.js';

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

const DEFAULT_OPTIONS: Required<DockingOption> = {
  maxColumnViewportWidthPercent: 60,
  maxRowViewportHeightPercent: 60,
  overflowStrategy: 'conveyor',
  stickyHysteresis: 2,
};

/**
 * Resolves permanent pinning and scroll-activated stickiness into the same three-band model.
 * It is deliberately DOM-free so the virtual renderer only has to react when band membership changes.
 */
export class DockingController<C extends Column = Column> {
  protected columnRevision = 0;
  protected rowRevision = 0;
  protected lastColumnSignature = '';
  protected lastRowSignature = '';
  protected options: Required<DockingOption> = { ...DEFAULT_OPTIONS };
  protected fullySeenColumns: Set<number> = new Set<number>();
  protected fullySeenRows: Set<number | string> = new Set<number | string>();

  constructor(options?: DockingOption) {
    this.setOptions(options);
  }

  setOptions(options?: DockingOption): void {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  reset(): void {
    this.fullySeenColumns.clear();
    this.fullySeenRows.clear();
    this.lastColumnSignature = '';
    this.lastRowSignature = '';
  }

  resolveColumns(columns: C[], scrollLeft: number, viewportWidth: number, leadingSide: DockingSide = 'left'): ColumnDockingLayout {
    const permanentLeft: DockedColumn[] = [];
    const permanentRight: DockedColumn[] = [];
    const center: DockedColumn[] = [];
    const stickyLeft: DockedColumn[] = [];
    const stickyRight: DockedColumn[] = [];
    let leftWidth = 0;
    let rightWidth = 0;
    let naturalCenterWidth = 0;

    columns.forEach((column, index) => {
      if (!column || column.hidden) {
        return;
      }
      const width = column.width || 0;
      if (column.pinned === 'left') {
        permanentLeft.push({ band: 'left', index, naturalOffset: leftWidth, offset: leftWidth, sticky: false, width });
        leftWidth += width;
      } else if (column.pinned === 'right') {
        permanentRight.push({ band: 'right', index, naturalOffset: rightWidth, offset: rightWidth, sticky: false, width });
        rightWidth += width;
      } else {
        center.push({ band: 'center', index, naturalOffset: naturalCenterWidth, offset: naturalCenterWidth, sticky: false, width });
        naturalCenterWidth += width;
      }
    });

    const leftBaseWidth = leftWidth;
    const rightBaseWidth = rightWidth;

    const centerViewportWidth = Math.max(0, viewportWidth - leftWidth - rightWidth);
    const visibleStart = scrollLeft;
    const visibleEnd = scrollLeft + centerViewportWidth;
    const hysteresis = this.options.stickyHysteresis;

    // First record which candidates have actually been visible. A sticky item
    // must not materialize merely because the user jumped across it.
    center.forEach((entry) => {
      const sticky = columns[entry.index].sticky;
      if (!sticky) {
        return;
      }
      const end = entry.offset + entry.width;
      if (entry.offset >= visibleStart && end <= visibleEnd) {
        this.fullySeenColumns.add(entry.index);
      }
      // On the initial leftmost view, two-sided sticky columns that are
      // beyond the right edge should still be available to dock there. Without
      // this seed, Q3/Q4/YTD remain in the center until the user scrolls right
      // once and returns to the starting position.
      if (scrollLeft === 0) {
        this.fullySeenColumns.add(entry.index);
      }
      if (!this.fullySeenColumns.has(entry.index)) {
        return;
      }
      const side = sticky === true ? leadingSide : sticky;
      if (side === 'left' || side === 'both') {
        stickyLeft.push({ ...entry, band: 'left', sticky: true });
      }
      if (side === 'right' || side === 'both') {
        stickyRight.push({ ...entry, band: 'right', sticky: true });
      }
    });

    // A candidate should dock when it reaches the *occupied* sticky edge, not
    // only when it reaches the bare viewport edge. For example, after Account
    // is sticky, Q1 must dock as soon as it would move underneath Account;
    // waiting for Q1 to reach x=0 incorrectly lets April/May pass first.
    const activeLeft: DockedColumn[] = [];
    let occupiedLeftWidth = 0;
    for (const entry of stickyLeft) {
      if (entry.naturalOffset < visibleStart + occupiedLeftWidth - hysteresis) {
        activeLeft.push(entry);
        occupiedLeftWidth += entry.width;
      }
    }

    // Right stickies use the symmetrical occupied edge. This matters when
    // several report-total columns dock on the trailing edge together.
    const activeRight: DockedColumn[] = [];
    let occupiedRightWidth = 0;
    for (let index = stickyRight.length - 1; index >= 0; index--) {
      const entry = stickyRight[index];
      if (entry.naturalOffset + entry.width > visibleEnd - occupiedRightWidth + hysteresis) {
        activeRight.unshift(entry);
        occupiedRightWidth += entry.width;
      }
    }

    // A two-sided candidate can only occupy one band. This is uncommon for a
    // normal-width cell, but can happen with a narrow viewport or an oversized
    // column. Keep it at the edge it is closest to instead of rendering it
    // twice.
    const activeLeftByIndex = new Map(activeLeft.map((entry) => [entry.index, entry]));
    const activeRightByIndex = new Map(activeRight.map((entry) => [entry.index, entry]));
    for (const [index, leftEntry] of activeLeftByIndex) {
      const rightEntry = activeRightByIndex.get(index);
      if (!rightEntry) {
        continue;
      }
      const leftDistance = Math.abs(leftEntry.naturalOffset - visibleStart);
      const rightDistance = Math.abs(visibleEnd - (rightEntry.naturalOffset + rightEntry.width));
      if (leftDistance <= rightDistance) {
        activeRight.splice(
          activeRight.findIndex((entry) => entry.index === index),
          1
        );
      } else {
        activeLeft.splice(
          activeLeft.findIndex((entry) => entry.index === index),
          1
        );
      }
    }

    const maxDockedWidth = (viewportWidth * this.options.maxColumnViewportWidthPercent) / 100;
    const availableStickyWidth = Math.max(0, maxDockedWidth - leftWidth - rightWidth);
    const selectedLeft = this.applyBudget(activeLeft, availableStickyWidth, (item) => item.width, 'left');
    const selectedLeftWidth = selectedLeft.reduce((total, item) => total + item.width, 0);
    const selectedRight = this.applyBudget(activeRight, availableStickyWidth - selectedLeftWidth, (item) => item.width, 'right');

    selectedLeft.forEach((entry) => {
      entry.offset = leftWidth;
      leftWidth += entry.width;
    });
    const selectedRightWidth = selectedRight.reduce((total, item) => total + item.width, 0);
    let stickyRightOffset = 0;
    selectedRight.forEach((entry) => {
      entry.offset = stickyRightOffset;
      stickyRightOffset += entry.width;
    });
    permanentRight.forEach((entry) => (entry.offset += selectedRightWidth));
    rightWidth += selectedRightWidth;

    const stickyIndexes = new Set([...selectedLeft, ...selectedRight].map((item) => item.index));
    // The middle band is a real per-row region, not the original full-width
    // canvas with sticky cells painted over it. Rebase its visible columns so
    // a column moved to either side does not leave a blank hole (or hide the
    // following month below a right-docked quarter).
    let visibleCenterWidth = 0;
    const visibleCenter = center
      .filter((item) => !stickyIndexes.has(item.index))
      .map((item) => {
        const compactedItem = { ...item, offset: visibleCenterWidth };
        visibleCenterWidth += item.width;
        return compactedItem;
      });
    const left = permanentLeft.concat(selectedLeft);
    const right = selectedRight.concat(permanentRight);
    const signature = `${left.map((item) => item.index).join(',')}|${right.map((item) => item.index).join(',')}`;
    if (signature !== this.lastColumnSignature) {
      this.lastColumnSignature = signature;
      this.columnRevision++;
    }

    return {
      center: visibleCenter,
      centerWidth: visibleCenterWidth,
      contentWidth: leftBaseWidth + naturalCenterWidth + rightBaseWidth,
      left,
      leftBaseWidth,
      leftWidth,
      revision: this.columnRevision,
      right,
      rightBaseWidth,
      rightWidth,
    };
  }

  resolveRows(
    rows: DockingRow[],
    scrollTop: number,
    viewportHeight: number,
    permanentRows?: PinnedRows,
    stickyRows?: StickyRows
  ): RowDockingLayout {
    const topIds = new Set(permanentRows?.top || []);
    const bottomIds = new Set(permanentRows?.bottom || []);
    const stickyTopIds = new Set(stickyRows?.top || []);
    const stickyBottomIds = new Set(stickyRows?.bottom || []);
    const stickyBothIds = new Set(stickyRows?.both || []);
    const top: DockedRow[] = [];
    const center: DockedRow[] = [];
    const bottom: DockedRow[] = [];
    const stickyTop: DockedRow[] = [];
    const stickyBottom: DockedRow[] = [];
    const stickyBottomCandidates: DockedRow[] = [];
    let topHeight = 0;
    let bottomHeight = 0;

    rows.forEach((row) => {
      if (topIds.has(row.id) || topIds.has(row.index)) {
        top.push({ ...row, band: 'top', offset: topHeight, sticky: false });
        topHeight += row.height;
      } else if (bottomIds.has(row.id) || bottomIds.has(row.index)) {
        bottom.push({ ...row, band: 'bottom', offset: bottomHeight, sticky: false });
        bottomHeight += row.height;
      } else {
        center.push({ ...row, band: 'center', offset: row.top, sticky: false });
      }
    });

    const visibleBottom = scrollTop + Math.max(0, viewportHeight - topHeight - bottomHeight);
    center.forEach((row) => {
      const isStickyBoth = stickyBothIds.has(row.id) || stickyBothIds.has(row.index);
      const isStickyTop = isStickyBoth || stickyTopIds.has(row.id) || stickyTopIds.has(row.index);
      const isStickyBottom = isStickyBoth || stickyBottomIds.has(row.id) || stickyBottomIds.has(row.index);
      if (!isStickyTop && !isStickyBottom) {
        return;
      }
      if (row.top >= scrollTop && row.top + row.height <= visibleBottom) {
        this.fullySeenRows.add(row.id);
      }
      // Match the initial sticky-column behavior: at the top of the grid,
      // configured sticky rows are eligible immediately so a report summary
      // below the first rendered rows can dock at its nearest edge without a
      // preliminary scroll-through.
      if (scrollTop === 0) {
        this.fullySeenRows.add(row.id);
      }
      if (!this.fullySeenRows.has(row.id)) {
        return;
      }
      // Unlike columns, rows must transfer at the exact physical boundary. A
      // pixel hysteresis creates a visible vertical jump when the row moves
      // from its natural position into the docked overlay.
      if (isStickyTop && row.top < scrollTop) {
        stickyTop.push({ ...row, band: 'top', offset: 0, sticky: true });
      }
      if (isStickyBottom) {
        stickyBottomCandidates.push({ ...row, band: 'bottom', offset: 0, sticky: true });
      }
    });
    stickyTop.sort((a, b) => a.top - b.top);
    // Resolve from the viewport's lower edge upward. Each selected sticky row
    // consumes lower-edge space, so the preceding candidate activates when it
    // reaches that row rather than a full row-height too late.
    stickyBottomCandidates.sort((a, b) => b.top - a.top);
    let stickyBottomHeight = bottomHeight;
    for (const row of stickyBottomCandidates) {
      const availableBottom = visibleBottom - stickyBottomHeight;
      if (row.top + row.height > availableBottom) {
        stickyBottom.push(row);
        stickyBottomHeight += row.height;
      }
    }
    stickyBottom.sort((a, b) => a.top - b.top);

    // A two-sided row can only use one band. This only occurs when a row is
    // taller than the available scrollable viewport, but resolving it here
    // keeps the row model symmetric with two-sided sticky columns.
    const stickyTopByIndex = new Map(stickyTop.map((row) => [row.index, row]));
    const stickyBottomByIndex = new Map(stickyBottom.map((row) => [row.index, row]));
    for (const [index, topRow] of stickyTopByIndex) {
      const bottomRow = stickyBottomByIndex.get(index);
      if (!bottomRow) {
        continue;
      }
      const topDistance = Math.abs(topRow.top - scrollTop);
      const bottomDistance = Math.abs(visibleBottom - (bottomRow.top + bottomRow.height));
      if (topDistance <= bottomDistance) {
        stickyBottom.splice(
          stickyBottom.findIndex((row) => row.index === index),
          1
        );
      } else {
        stickyTop.splice(
          stickyTop.findIndex((row) => row.index === index),
          1
        );
      }
    }

    const maxDockedHeight = (viewportHeight * this.options.maxRowViewportHeightPercent) / 100;
    const selectedStickyTop = this.applyBudget(
      stickyTop,
      Math.max(0, maxDockedHeight - topHeight - bottomHeight),
      (row) => row.height,
      'top'
    );
    selectedStickyTop.forEach((row) => {
      row.offset = topHeight;
      topHeight += row.height;
    });
    const selectedStickyBottom = this.applyBudget(
      stickyBottom,
      Math.max(0, maxDockedHeight - topHeight - bottomHeight),
      (row) => row.height,
      'bottom'
    );
    selectedStickyBottom.forEach((row) => {
      row.offset = bottomHeight;
      bottomHeight += row.height;
    });
    const stickyIndexes = new Set([...selectedStickyTop, ...selectedStickyBottom].map((row) => row.index));
    const visibleCenter = center.filter((row) => !stickyIndexes.has(row.index));
    top.push(...selectedStickyTop);
    bottom.push(...selectedStickyBottom);
    const signature = `${top.map((row) => row.id).join(',')}|${bottom.map((row) => row.id).join(',')}`;
    if (signature !== this.lastRowSignature) {
      this.lastRowSignature = signature;
      this.rowRevision++;
    }

    return { bottom, bottomHeight, center: visibleCenter, revision: this.rowRevision, top, topHeight };
  }

  protected applyBudget<T>(items: T[], budget: number, sizeOf: (item: T) => number, _edge: DockingSide | 'top' | 'bottom'): T[] {
    if (budget <= 0 || items.length === 0) {
      return [];
    }
    const candidates = this.options.overflowStrategy === 'conveyor' ? [...items].reverse() : items;
    const selected: T[] = [];
    let used = 0;
    for (const item of candidates) {
      const size = sizeOf(item);
      if (used + size <= budget || (this.options.overflowStrategy === 'clamp' && selected.length === 0)) {
        selected.push(item);
        used += size;
      } else if (this.options.overflowStrategy === 'priority') {
        break;
      }
    }
    return this.options.overflowStrategy === 'conveyor' ? selected.reverse() : selected;
  }
}
