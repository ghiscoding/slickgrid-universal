import type { Column } from '../../interfaces/index';
import { GridEventService } from '../gridEvent.service';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index';

const dataViewStub = {
  refresh: jest.fn(),
  sort: jest.fn(),
  reSort: jest.fn(),
} as unknown as SlickDataView;

const gridStub = {
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getData: () => dataViewStub,
  getDataItem: jest.fn(),
  getOptions: jest.fn(),
  setActiveCell: jest.fn(),
  setColumns: jest.fn(),
  setSortColumns: jest.fn(),
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
    jest.clearAllMocks();
  });

  describe('bindOnBeforeEditCell method', () => {
    let mockColumn;
    let mockRowData;

    beforeEach(() => {
      mockColumn = { id: 'firstName', field: 'firstName', onBeforeEditCell: jest.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, column: {} as Column, item: {} }, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onBeforeEditCell" callback method', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onBeforeEditCell');

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: 0, row: 0, grid: gridStub, column: {} as Column, item: {}, target: 'grid' }, new SlickEventData(), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.anything(), {
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
      mockColumn = { id: 'firstName', field: 'firstName', onCellChange: jest.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, item: {}, column: {} as Column }, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellChange" callback method', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellChange');

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: 0, row: 0, grid: gridStub, item: {}, column: {} as Column }, new SlickEventData(), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.anything(), {
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
      mockColumn = { id: 'firstName', field: 'firstName', onCellClick: jest.fn() } as Column;
      mockRowData = { firstName: 'John', lastName: 'Doe' };
    });

    it('should not do anything when no arguments are provided to the event', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnClick(gridStub);
      gridStub.onClick.notify(undefined as any, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, }, new SlickEventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellClick" callback method', () => {
      gridStub.getOptions = undefined as any;
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellClick');

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: 0, row: 0, grid: gridStub }, new SlickEventData(), gridStub);

      expect(spyGetCols).toHaveBeenCalled();
      expect(spyGetData).toHaveBeenCalled();
      expect(spyOnChange).toHaveBeenCalledWith(expect.anything(), {
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
      const spy = jest.spyOn(eventHandler, 'unsubscribeAll');

      service.dispose();

      expect(spy).toHaveBeenCalled();
    });
  });
});
