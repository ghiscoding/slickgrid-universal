import { describe, expect, it } from 'vitest';
import type { Column } from '../../interfaces/index.js';
import { DockingController, type DockingRow } from '../dockingController.js';

const column = (id: string, width: number, options: Partial<Column> = {}): Column => ({ id, field: id, width, ...options });

const row = (id: number | string, index: number, top: number, height: number): DockingRow => ({ id, index, top, height });

describe('DockingController', () => {
  it('resolves permanent columns, skips hidden columns, and tracks revisions', () => {
    const controller = new DockingController();
    const layout = controller.resolveColumns(
      [column('left', 10, { pinned: 'left' }), column('hidden', 20, { hidden: true }), column('center', 30), column('right', 15, { pinned: 'right' })],
      0,
      100
    );

    expect(layout.left.map((item) => item.index)).toEqual([0]);
    expect(layout.center.map((item) => item.index)).toEqual([2]);
    expect(layout.right.map((item) => item.index)).toEqual([3]);
    expect(layout.leftWidth).toBe(10);
    expect(layout.rightWidth).toBe(15);
    expect(layout.contentWidth).toBe(55);
    expect(layout.revision).toBe(1);

    const unchanged = controller.resolveColumns(
      [column('left', 10, { pinned: 'left' }), column('center', 30), column('right', 15, { pinned: 'right' })],
      0,
      100
    );
    expect(unchanged.revision).toBe(2);
    controller.reset();
    expect(controller.resolveColumns([column('left', 10, { pinned: 'left' })], 0, 100).revision).toBe(3);
  });

  it('resolves sticky columns after they are seen and avoids materializing jumped-over candidates', () => {
    const columns = [column('left-sticky', 10, { sticky: 'left' }), column('middle', 10), column('right-sticky', 20, { sticky: 'right' })];
    const controller = new DockingController({ maxColumnViewportWidthPercent: 200, stickyHysteresis: 2 });

    expect(controller.resolveColumns(columns, 100, 20).left).toHaveLength(0);
    expect(controller.resolveColumns(columns, 0, 20).left).toHaveLength(0);
    const layout = controller.resolveColumns(columns, 15, 20);

    expect(layout.left.map((item) => item.index)).toEqual([0]);
    expect(layout.right.map((item) => item.index)).toEqual([2]);
    expect(layout.left[0].sticky).toBe(true);
    expect(layout.right[0].sticky).toBe(true);
  });

  it('resolves two-sided sticky columns at their closest edge and applies overflow budgets', () => {
    const controller = new DockingController({ maxColumnViewportWidthPercent: 20, overflowStrategy: 'conveyor' });
    const columns = [column('both', 40, { sticky: 'both' }), column('left-2', 15, { sticky: 'left' }), column('left-3', 15, { sticky: 'left' })];
    controller.resolveColumns(columns, 0, 50);
    const layout = controller.resolveColumns(columns, 20, 50);

    expect(layout.left.every((item) => item.sticky)).toBe(true);
    expect(layout.right.every((item) => item.sticky)).toBe(true);
    expect(layout.leftWidth + layout.rightWidth).toBeLessThanOrEqual(10);

    const leftPreferredController = new DockingController({ maxColumnViewportWidthPercent: 200 });
    const oversized = [column('both', 100, { sticky: 'both' })];
    leftPreferredController.resolveColumns(oversized, 0, 50);
    const leftPreferred = leftPreferredController.resolveColumns(oversized, 25, 50);
    expect(leftPreferred.left.map((item) => item.index)).toEqual([0]);
    expect(leftPreferred.right).toEqual([]);

    const rightPreferredController = new DockingController({ maxColumnViewportWidthPercent: 200 });
    rightPreferredController.resolveColumns(oversized, 0, 50);
    const rightPreferred = rightPreferredController.resolveColumns(oversized, 30, 50);
    expect(rightPreferred.left).toEqual([]);
    expect(rightPreferred.right.map((item) => item.index)).toEqual([0]);
  });

  it('supports clamp and priority overflow strategies', () => {
    const columns = [column('sticky-a', 30, { sticky: 'left' }), column('sticky-b', 30, { sticky: 'left' })];
    const clampController = new DockingController({ maxColumnViewportWidthPercent: 10, overflowStrategy: 'clamp' });
    clampController.resolveColumns(columns, 0, 100);
    const clamped = clampController.resolveColumns(columns, 90, 100);
    expect(clamped.left.length).toBe(1);

    const priorityController = new DockingController({ maxColumnViewportWidthPercent: 50, overflowStrategy: 'priority' });
    priorityController.resolveColumns(columns, 0, 100);
    const prioritized = priorityController.resolveColumns(columns, 90, 100);
    expect(prioritized.left.length).toBe(1);
  });

  it('resolves permanent and sticky rows, including both-sided candidates', () => {
    const controller = new DockingController({ maxRowViewportHeightPercent: 100, stickyHysteresis: 2 });
    const rows = [row('top', 0, 0, 10), row('sticky-top', 1, 10, 10), row('center', 2, 20, 10), row('sticky-bottom', 3, 30, 10), row('bottom', 4, 40, 10)];
    const initial = controller.resolveRows(rows, 0, 40, { top: ['top'], bottom: ['bottom'] }, { top: ['sticky-top'], bottom: ['sticky-bottom'] });
    expect(initial.top.map((item) => item.id)).toEqual(['top']);
    expect(initial.bottom.map((item) => item.id)).toEqual(['bottom', 'sticky-bottom']);
    expect(initial.center.map((item) => item.id)).toEqual(['sticky-top', 'center']);

    const scrolled = controller.resolveRows(rows, 25, 40, { top: ['top'], bottom: ['bottom'] }, { top: ['sticky-top'], bottom: ['sticky-bottom'] });
    expect(scrolled.top.map((item) => item.id)).toContain('sticky-top');
    expect(scrolled.bottom.map((item) => item.id)).toContain('sticky-bottom');
  });

  it('does not materialize a jumped-over sticky row and applies row budgets', () => {
    const controller = new DockingController({ maxRowViewportHeightPercent: 10, overflowStrategy: 'priority' });
    const rows = [row(1, 0, 0, 20), row(2, 1, 20, 20)];
    expect(controller.resolveRows(rows, 100, 100, undefined, { top: [1], bottom: [2] }).top).toHaveLength(0);
    const layout = controller.resolveRows(rows, 0, 100, undefined, { top: [1], bottom: [2] });
    expect(layout.top.length + layout.bottom.length).toBeLessThanOrEqual(1);
  });

  it('chooses the closest edge when a sticky row is configured for both sides', () => {
    const rows = [row('both', 0, 10, 30)];
    const topController = new DockingController({ maxRowViewportHeightPercent: 200 });
    topController.resolveRows(rows, 0, 100, undefined, { both: ['both'] });
    const topPreferred = topController.resolveRows(rows, 11, 20, undefined, { both: ['both'] });
    expect(topPreferred.top.map((item) => item.id)).toEqual(['both']);
    expect(topPreferred.bottom).toEqual([]);

    const bottomController = new DockingController({ maxRowViewportHeightPercent: 200 });
    bottomController.resolveRows(rows, 0, 100, undefined, { both: ['both'] });
    const bottomPreferred = bottomController.resolveRows(rows, 20, 19, undefined, { both: ['both'] });
    expect(bottomPreferred.bottom.map((item) => item.id)).toEqual(['both']);
    expect(bottomPreferred.top).toEqual([]);
  });

  it('resolves multiple bottom candidates from the lower viewport edge', () => {
    const controller = new DockingController({ maxRowViewportHeightPercent: 200 });
    const topRows = [row('top-a', 0, 0, 5), row('top-b', 1, 5, 5)];
    controller.resolveRows(topRows, 0, 100, undefined, { top: ['top-a', 'top-b'] });
    expect(controller.resolveRows(topRows, 10, 20, undefined, { top: ['top-a', 'top-b'] }).top).toHaveLength(2);

    const rows = [row('bottom-a', 0, 35, 20), row('bottom-b', 1, 55, 20)];
    controller.resolveRows(rows, 0, 100, undefined, { bottom: ['bottom-a', 'bottom-b'] });
    const layout = controller.resolveRows(rows, 11, 20, undefined, { bottom: ['bottom-a', 'bottom-b'] });

    expect(layout.bottom.map((item) => item.id)).toEqual(['bottom-a', 'bottom-b']);
    expect(layout.bottom.every((item) => item.sticky)).toBe(true);
  });

  it('covers the budget edge cases', () => {
    const controller = new DockingController();
    const applyBudget = (controller as any).applyBudget.bind(controller);
    expect(applyBudget([], 10, () => 1, 'left')).toEqual([]);
    expect(applyBudget([1], 0, () => 1, 'left')).toEqual([]);
    expect(applyBudget([1, 2, 3], 2, (item: number) => item, 'left')).toEqual([2]);
    controller.setOptions({ overflowStrategy: 'clamp' });
    expect(applyBudget([3], 2, (item: number) => item, 'left')).toEqual([3]);
    controller.setOptions({ overflowStrategy: 'priority' });
    expect(applyBudget([1, 2], 3, (item: number) => item, 'left')).toEqual([1, 2]);
  });
});
