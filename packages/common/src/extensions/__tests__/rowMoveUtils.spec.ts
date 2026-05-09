import { afterEach, describe, expect, it, vi } from 'vitest';
import { SlickEvent, type SlickGrid } from '../../core/index.js';
import { defaultOnBeforeMoveRows, defaultOnMoveRows } from '../rowMoveUtils.js';

const dataViewStub = {
  destroy: vi.fn(),
  addItem: vi.fn(),
  getItem: vi.fn(),
  getItems: vi.fn(),
  getIdxById: vi.fn(),
  getFilteredItems: vi.fn(),
  getItemCount: vi.fn(),
  setItems: vi.fn(),
  sort: vi.fn(),
} as unknown as SlickDataView;

const gridStub = {
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getData: () => dataViewStub,
  getOptions: vi.fn(),
  registerPlugin: vi.fn(),
  onHeaderMouseEnter: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
  invalidate: vi.fn(),
  resetActiveCell: vi.fn(),
  setItems: vi.fn(),
} as unknown as SlickGrid;

describe('rowMoveUtils', () => {
  describe('defaultOnBeforeMoveRows() method', () => {
    afterEach(() => {
      dataViewStub.getItemCount = vi.fn();
    });

    it('should return false when trying to move at same position', () => {
      vi.spyOn(dataViewStub, 'getItemCount').mockReturnValue(4);
      const output = defaultOnBeforeMoveRows(new CustomEvent('change'), { rows: [0, 1, 2, 3], insertBefore: 1, grid: gridStub });
      expect(output).toEqual(false);
    });

    it('should return true when trying to move at available spot', () => {
      vi.spyOn(dataViewStub, 'getItemCount').mockReturnValue(500);
      const output = defaultOnBeforeMoveRows(new CustomEvent('change'), { rows: [1], insertBefore: 3, grid: gridStub });
      expect(output).toEqual(true);
    });

    it('should return false when dataView.getItemCount() is undefined', () => {
      dataViewStub.getItemCount = undefined;
      const output = defaultOnBeforeMoveRows(new CustomEvent('change'), { rows: [1], insertBefore: 3, grid: gridStub });
      expect(output).toEqual(false);
    });
  });

  describe('defaultOnMoveRows() method', () => {
    afterEach(() => {
      dataViewStub.getItemCount = vi.fn();
    });

    it('should insert after x when getItem() returns item', () => {
      const setItemSpy = vi.spyOn(dataViewStub, 'setItems');
      const items = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Smith' },
        { id: 3, firstName: 'Bob' },
      ];
      vi.spyOn(dataViewStub, 'getItems').mockReturnValue(items);
      vi.spyOn(dataViewStub, 'getFilteredItems').mockReturnValue(items);
      vi.spyOn(dataViewStub, 'getItem').mockReturnValue(items[1]);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0).mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3);
      vi.spyOn(dataViewStub, 'getItemCount').mockReturnValue(items.length);
      defaultOnMoveRows(new CustomEvent('change'), { insertBefore: 2, rows: [0, 1, 2, 3], grid: gridStub });

      expect(setItemSpy).toHaveBeenCalledWith([
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Smith' },
        { id: 3, firstName: 'Bob' },
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ]);
    });

    it('should insert before x when getItem() returns null', () => {
      const setItemSpy = vi.spyOn(dataViewStub, 'setItems');
      const items = [
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Smith' },
        { id: 3, firstName: 'Bob' },
      ];
      vi.spyOn(dataViewStub, 'getItems').mockReturnValue(items);
      vi.spyOn(dataViewStub, 'getFilteredItems').mockReturnValue(items);
      vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null);
      vi.spyOn(dataViewStub, 'getIdxById').mockReturnValue(0).mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3);
      vi.spyOn(dataViewStub, 'getItemCount').mockReturnValue(items.length);
      defaultOnMoveRows(new CustomEvent('change'), { insertBefore: 2, rows: [0, 1, 2, 3], grid: gridStub });

      expect(setItemSpy).toHaveBeenCalledWith([
        { id: 1, firstName: 'Jane' },
        { id: 2, firstName: 'Smith' },
        { id: 3, firstName: 'Bob' },
        { id: 0, firstName: 'John' },
        { id: 1, firstName: 'Jane' },
      ]);
    });

    it('should return false when dataView.getItemCount() is undefined', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockReturnValue();
      dataViewStub.getItemCount = undefined;
      defaultOnMoveRows(new CustomEvent('change'), { rows: [1], insertBefore: 3, grid: gridStub });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Sorry `defaultOnMoveRows()` only works with SlickDataView');
    });
  });
});
