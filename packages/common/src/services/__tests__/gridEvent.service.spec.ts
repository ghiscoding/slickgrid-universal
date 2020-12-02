import { GridEventService } from '../gridEvent.service';
import { Column, SlickDataView, SlickGrid, SlickNamespace } from '../../interfaces/index';

declare const Slick: SlickNamespace;

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
  onBeforeEditCell: new Slick.Event(),
  onCellChange: new Slick.Event(),
  onClick: new Slick.Event(),
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
      gridStub.onBeforeEditCell.notify(undefined as any, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, column: {} as Column, item: {} }, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onBeforeEditCell" callback method', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onBeforeEditCell');

      service.bindOnBeforeEditCell(gridStub);
      gridStub.onBeforeEditCell.notify({ cell: 0, row: 0, grid: gridStub, column: {} as Column, item: {} }, new Slick.EventData(), gridStub);

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
      gridStub.onCellChange.notify(undefined as any, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, item: {}, column: {} as Column }, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellChange" callback method', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellChange');

      service.bindOnCellChange(gridStub);
      gridStub.onCellChange.notify({ cell: 0, row: 0, grid: gridStub, item: {}, column: {} as Column }, new Slick.EventData(), gridStub);

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
      gridStub.onClick.notify(undefined as any, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should not do anything when "cell" property is missing', () => {
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: undefined as any, row: undefined as any, grid: gridStub, }, new Slick.EventData(), gridStub);

      expect(spyGetCols).not.toHaveBeenCalled();
    });

    it('should execute the column "onCellClick" callback method', () => {
      gridStub.getOptions = undefined as any;
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellClick');

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: 0, row: 0, grid: gridStub }, new Slick.EventData(), gridStub);

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

    it('should execute the column "onCellClick" callback method and "setActiveCell" cell navigation is enabled but column is not editable', () => {
      gridStub.getOptions = jest.fn();
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableCellNavigation: true, editable: false });
      const spyActive = jest.spyOn(gridStub, 'setActiveCell');
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellClick');

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: 0, row: 0, grid: gridStub }, new Slick.EventData(), gridStub);

      expect(spyActive).toHaveBeenCalled();
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

    it('should execute the column "onCellClick" callback method and "setActiveCell" when cell is editable and autoCommitEdit', () => {
      gridStub.getOptions = jest.fn();
      jest.spyOn(gridStub, 'getOptions').mockReturnValue({ enableCellNavigation: true, editable: true, autoCommitEdit: true });
      const spyActive = jest.spyOn(gridStub, 'setActiveCell');
      const spyGetCols = jest.spyOn(gridStub, 'getColumns').mockReturnValue([mockColumn]);
      const spyGetData = jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockRowData);
      const spyOnChange = jest.spyOn(mockColumn, 'onCellClick');

      service.bindOnClick(gridStub);
      gridStub.onClick.notify({ cell: 0, row: 0, grid: gridStub }, new Slick.EventData(), gridStub);

      expect(spyActive).toHaveBeenCalled();
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
