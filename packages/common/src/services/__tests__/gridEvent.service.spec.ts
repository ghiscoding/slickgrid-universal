import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { GridEventService } from '../gridEvent.service.js';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index.js';

const dataViewStub = {
  refresh: vi.fn(),
  sort: vi.fn(),
  reSort: vi.fn(),
} as unknown as SlickDataView;

const gridStub = {
  getColumnIndex: vi.fn(),
  getColumns: vi.fn(),
  getData: () => dataViewStub,
  getDataItem: vi.fn(),
  getOptions: vi.fn(),
  setActiveCell: vi.fn(),
  setColumns: vi.fn(),
  setSortColumns: vi.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCellChange: new SlickEvent(),
  onClick: new SlickEvent(),
} as unknown as SlickGrid;

describe('GridEventService', () => {
  let service: GridEventService;

  beforeEach(() => {
    service = new GridEventService();
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  describe('bindOnBeforeEditCell method', () => {
    let mockColumn;
    let mockRowData;

    beforeEach(() => {
      mockColumn = { id: 'firstName', field: 'firstName', onBeforeEditCell: vi.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, column: {} as Column, item: {} }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onBeforeEditCell" callback method', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = vi.spyOn(mockColumn, 'onBeforeEditCell');

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: 0, row: 0, grid: gridStub, column: {} as Column, item: {}, target: 'grid' }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.any(Event), {
        row: 0,
        cell: 0,
        dataView: dataViewStub,
        grid: gridStub,
        columnDef: mockColumn,
        dataContext: mockRowData
      });
    });
  });

  describe('bindOnCellChange method', () => {
    let mockColumn;
    let mockRowData;

    beforeEach(() => {
      mockColumn = { id: 'firstName', field: 'firstName', onCellChange: vi.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, item: {}, column: {} as Column }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellChange" callback method', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = vi.spyOn(mockColumn, 'onCellChange');

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: 0, row: 0, grid: gridStub, item: {}, column: {} as Column }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.any(Event), {
        row: 0,
        cell: 0,
        dataView: dataViewStub,
        grid: gridStub,
        columnDef: mockColumn,
        dataContext: mockRowData
      });
    });
  });

  describe('bindOnClick method', () => {
    let mockColumn;
    let mockRowData;

    beforeEach(() => {
      mockColumn = { id: 'firstName', field: 'firstName', onCellClick: vi.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnClick(gridStub);
      gridStub.onClick.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellClick" callback method', () => {
      gridStub.getOptions = undefined as any;
      const spyGetCols = vi.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = vi.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = vi.spyOn(mockColumn, 'onCellClick');

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: 0, row: 0, grid: gridStub }, new SlickEventData(new Event('click')), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.any(Event), {
        row: 0,
        cell: 0,
        dataView: dataViewStub,
        grid: gridStub,
        columnDef: mockColumn,
        dataContext: mockRowData
      });
    });
  });

  describe('dispose method', () => {
    it('should unsubscribe all event from the event handler', () => {
      const eventHandler = service.eventHandler;
      const spy = vi.spyOn(eventHandler, 'unsubscribeAll');

      service.dispose();

      expect(spy).toHaveBeenCalled();
    });
  });
});
