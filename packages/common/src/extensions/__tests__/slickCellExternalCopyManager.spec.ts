import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { SlickEvent, SlickEventData, SlickRange, type SlickDataView, type SlickGrid } from '../../core/index.js';
import type { InputEditor } from '../../editors/inputEditor.js';
import type { SelectionModel } from '../../enums/index.js';
import type { Column, EditCommand, GridOption, OnEventArgs } from '../../interfaces/index.js';
import { SlickCellExternalCopyManager } from '../slickCellExternalCopyManager.js';
import type { SlickHybridSelectionModel } from '../slickHybridSelectionModel.js';

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const mockGetSelectionModel = {
  getSelectedRanges: vi.fn(),
};
const returnValueStub = vi.fn();

const dataViewStub = {
  destroy: vi.fn(),
  addItem: vi.fn(),
  getItem: vi.fn(),
  getItems: vi.fn(),
  getItemCount: vi.fn(),
  setItems: vi.fn(),
} as unknown as SlickDataView;

const gridStub = {
  destroy: vi.fn(),
  getActiveCell: vi.fn(),
  getActiveCellNode: vi.fn(),
  getColumns: vi.fn().mockReturnValue([
    { id: 'firstName', field: 'firstName', name: 'First Name' },
    { id: 'lastName', field: 'lastName', name: 'Last Name' },
  ] as Column[]),
  getColumnByIdx: vi.fn(),
  getData: () => dataViewStub,
  getDataItem: vi.fn(),
  getDataLength: vi.fn(),
  hasDataView: () => true,
  getPubSubService: () => pubSubServiceStub,
  getEditorLock: () => ({
    isActive: () => false,
  }),
  getOptions: vi.fn(),
  focus: vi.fn(),
  getSelectionModel: () => mockGetSelectionModel,
  registerPlugin: vi.fn(),
  removeCellCssStyles: vi.fn(),
  setCellCssStyles: vi.fn(),
  setData: vi.fn(),
  setSelectionModel: vi.fn(),
  updateCell: vi.fn(),
  render: vi.fn(),
  triggerEvent: vi.fn().mockReturnValue({ getReturnValue: returnValueStub }),
  onCellChange: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onValidationError: new SlickEvent(),
} as unknown as SlickGrid;

const mockHybridSelectionModel = {
  constructor: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickHybridSelectionModel;

const mockTextEditor = {
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  applyValue: vi.fn(),
  loadValue: vi.fn(),
  serializeValue: vi.fn(),
  validate: vi.fn().mockReturnValue({ valid: true, msg: null }),
} as unknown as InputEditor;

const mockTextEditorImplementation = vi.fn().mockImplementation(function () {
  return mockTextEditor;
});

const Editors = {
  text: mockTextEditorImplementation,
};

describe('CellExternalCopyManager', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockReturnValue();
  const lastNameElm = document.createElement('div');
  lastNameElm.textContent = 'Last Name';
  const mockEventCallback = () => {};
  const mockColumns = [
    { id: 'firstName', field: 'firstName', name: 'First Name', editor: { model: Editors.text }, editorClass: Editors.text },
    { id: 'lastName', field: 'lastName', name: lastNameElm },
    { id: 'age', field: 'age', name: 'Age', editor: { model: Editors.text }, editorClass: Editors.text },
  ] as Column[];
  let plugin: SlickCellExternalCopyManager;
  const gridOptionsMock = {
    editable: true,
    enableCheckboxSelector: true,
    excelCopyBufferOptions: {
      onExtensionRegistered: vi.fn(),
      onCopyCells: mockEventCallback,
      onCopyCancelled: mockEventCallback,
      onPasteCells: mockEventCallback,
    },
  } as GridOption;

  beforeEach(() => {
    plugin = new SlickCellExternalCopyManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: {
          readText: vi.fn(() => Promise.resolve('')),
          writeText: vi.fn(() => Promise.resolve()),
        },
        writable: true,
      });
    });

    afterEach(() => {
      plugin.dispose();
      vi.clearAllMocks();
    });

    it('should throw an error initializing the plugin without a selection model', () =>
      new Promise((done: any) => {
        vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(null as any);
        try {
          plugin.init(gridStub);
        } catch (error: any) {
          expect(error.message).toBe(
            'Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new SlickHybridSelectionModel())'
          );
          done();
        }
      }));

    it('should focus on the grid after "onSelectedRangesChanged" is triggered', () => {
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockHybridSelectionModel as any);
      const gridFocusSpy = vi.spyOn(gridStub, 'focus');

      plugin.init(gridStub);
      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as unknown as SlickEventData;
      mockHybridSelectionModel.onSelectedRangesChanged.notify([new SlickRange(0, 0, 0, 0)], eventData, gridStub);

      expect(gridFocusSpy).toHaveBeenCalled();
    });

    it('should remove CSS styling when "clearCopySelection" is called', () => {
      const removeStyleSpy = vi.spyOn(gridStub, 'removeCellCssStyles');
      plugin.init(gridStub);
      plugin.clearCopySelection();
      expect(removeStyleSpy).toHaveBeenCalledWith('copy-manager');
    });

    it('should call "getHeaderValueForColumn" and expect the ouput to be what "headerColumnValueExtractor" returns when it is provided', () => {
      plugin.init(gridStub, { headerColumnValueExtractor: () => 'Full Name' });
      const output = plugin.getHeaderValueForColumn(mockColumns[0]);
      expect(output).toEqual('Full Name');
    });

    it('should call "getHeaderValueForColumn" and expect the column name property be returned when "headerColumnValueExtractor" is not provided', () => {
      plugin.init(gridStub);
      const output = plugin.getHeaderValueForColumn(mockColumns[0]);
      expect(output).toEqual('First Name');
    });

    it('should call "getDataItemValueForColumn" and expect the ouput to be what "dataItemColumnValueExtractor" returns when it is provided', () => {
      plugin.init(gridStub, { dataItemColumnValueExtractor: (item, col) => (col.field === 'firstName' ? 'Full Name' : 'Last Name') });
      const output = plugin.getDataItemValueForColumn({ firstName: 'John', lastName: 'Doe' }, mockColumns[0], 0, 0, new SlickEventData());
      expect(output).toEqual('Full Name');
    });

    it('should call "getDataItemValueForColumn" and expect the editor serialized value returned when an Editor is provided', () => {
      vi.spyOn(mockTextEditor, 'serializeValue').mockReturnValue('serialized output');
      plugin.init(gridStub);
      const output = plugin.getDataItemValueForColumn({ firstName: 'John', lastName: 'Doe' }, mockColumns[0], 0, 0, new SlickEventData());
      expect(output).toEqual('serialized output');
    });

    it('should call "getDataItemValueForColumn" and expect the column "field" value returned when there is no Editor provided', () => {
      plugin.init(gridStub);
      const output = plugin.getDataItemValueForColumn({ firstName: 'John', lastName: 'Doe' }, mockColumns[1], 0, 0, new SlickEventData());
      expect(output).toEqual('Doe');
    });

    it('should call "setDataItemValueForColumn" and expect the ouput to be what "dataItemColumnValueSetter" returns when it is provided', () => {
      plugin.init(gridStub, { dataItemColumnValueSetter: (item, col, val) => val });
      const output = plugin.setDataItemValueForColumn({ firstName: 'John', lastName: 'Doe' }, mockColumns[1], 'some value');
      expect(output).toEqual('some value');
    });

    it('should call "setDataItemValueForColumn" and expect the Editor load & apply value to be set when Editor is provided', () => {
      const applyValSpy = vi.spyOn(mockTextEditor, 'applyValue');
      const loadValSpy = vi.spyOn(mockTextEditor, 'loadValue');

      const mockItem = { firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.setDataItemValueForColumn(mockItem, mockColumns[0], 'some value');

      const expectedItem = { ...mockItem, firstName: 'some value' };
      expect(loadValSpy).toHaveBeenCalledWith(expectedItem);
      expect(applyValSpy).toHaveBeenCalledWith(mockItem, 'some value');
    });

    it('should call "setDataItemValueForColumn" and expect an onValidationError triggered if validation failed', () => {
      const validationResults = { valid: false, msg: 'foobar' };
      const applyValSpy = vi.spyOn(mockTextEditor, 'applyValue');
      const loadValSpy = vi.spyOn(mockTextEditor, 'loadValue');
      const validationSpy = vi.spyOn(mockTextEditor, 'validate').mockReturnValue(validationResults);
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockHybridSelectionModel as any);
      const notifySpy = vi.spyOn(gridStub.onValidationError, 'notify');
      const mockItem = { firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.setDataItemValueForColumn(mockItem, mockColumns[0], 'some value');

      const expectedItem = { ...mockItem, firstName: 'some value' };
      expect(loadValSpy).toHaveBeenCalledWith(expectedItem);
      expect(applyValSpy).toHaveBeenCalledWith(mockItem, 'some value');
      expect(validationSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalledWith(expect.objectContaining({ validationResults }));
    });

    it('should call "setDataItemValueForColumn" and expect item last name to change with new value when no Editor is provided', () => {
      const mockItem = { firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.setDataItemValueForColumn(mockItem, mockColumns[1], 'some value');

      expect(mockItem.lastName).toEqual('some value');
    });

    it('should set "includeHeaderWhenCopying" when its SETTER is called', () => {
      plugin.init(gridStub);
      plugin.setIncludeHeaderWhenCopying(true);
      expect(plugin.addonOptions.includeHeaderWhenCopying).toBeTruthy();
    });

    it('should call onBeforePasteCell with current row and column info', () => {
      const sutSpy = vi.fn();
      plugin.init(gridStub, { onBeforePasteCell: sutSpy });

      plugin.onBeforePasteCell.notify({
        row: 0,
        cell: 0,
        item: {
          firstName: 'John',
          lastName: 'Doe',
        },
        value: 'Foobar',
        columnDef: {} as Column,
      });

      expect(sutSpy).toHaveBeenCalled();
    });

    describe('keyDown handler', () => {
      beforeEach(() => {
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        vi.spyOn(gridStub, 'getColumnByIdx').mockReturnValue(mockColumns[0]);
        vi.spyOn(gridStub, 'getDataLength').mockReturnValue(2);
        vi.spyOn(gridStub, 'getData').mockReturnValue([
          { firstName: 'John', lastName: 'Doe', age: 30 },
          { firstName: 'Jane', lastName: 'Doe' },
        ] as any[]);
        vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' }).mockReturnValueOnce({ firstName: 'Jane', lastName: 'Doe' });
        vi.spyOn(gridStub, 'hasDataView').mockReturnValue(false);
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should Copy & Paste then clear selections', () =>
        new Promise((done: any) => {
          const mockOnCopyCancelled = vi.fn();
          const mockOnCopyInit = vi.fn();
          const mockOnCopyCells = vi.fn();
          const mockOnCopySuccess = vi.fn();

          const clearSpy = vi.spyOn(plugin, 'clearCopySelection');
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValue([new SlickRange(0, 1, 2, 2)]);

          plugin.init(gridStub, {
            clearCopySelectionDelay: 1,
            clipboardPasteDelay: 2,
            includeHeaderWhenCopying: true,
            onCopyCancelled: mockOnCopyCancelled,
            onCopyInit: mockOnCopyInit,
            onCopyCells: mockOnCopyCells,
            onCopySuccess: mockOnCopySuccess,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const keyDownEscEvent = new Event('keydown');
          Object.defineProperty(keyDownEscEvent, 'key', { writable: true, configurable: true, value: 'Escape' });
          Object.defineProperty(keyDownEscEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownEscEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownEscEvent, gridStub);

          expect(clearSpy).toHaveBeenCalled();
          expect(mockOnCopyInit).toHaveBeenCalled();
          expect(mockOnCopyCancelled).toHaveBeenCalledWith(expect.any(Object), { ranges: [new SlickRange(0, 1, 2, 2)] });
          expect(mockOnCopyCells).toHaveBeenCalledWith(expect.any(Object), { ranges: expect.any(Array) });

          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell');
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(clearSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should Copy, Paste and run Execute clip command', () =>
        new Promise((done: any) => {
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce(null as any);
          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('Doe\tserialized output');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
            expect(updateCellSpy).toHaveBeenCalledWith(1, 1);
            expect(onCellChangeSpy).toHaveBeenCalledWith({
              row: 1,
              cell: 0,
              item: { firstName: 'John', lastName: 'serialized output' },
              grid: gridStub,
              column: {},
            });
            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should not paste on cells where onBeforePasteCell handler returns false', () =>
        new Promise((done: any) => {
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce(null as any);

          // first one should be denied
          returnValueStub.mockReturnValueOnce(false);
          plugin.init(gridStub, {
            clipboardPasteDelay: 1,
            clearCopySelectionDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler,
            onBeforePasteCell: (e: SlickEventData, args: OnEventArgs) => args.cell > 0,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('Doe\tserialized output');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).not.toHaveBeenCalledWith(1, 0);
            expect(updateCellSpy).toHaveBeenCalledWith(1, 1);
            expect(onCellChangeSpy).toHaveBeenCalledWith({
              row: 1,
              cell: 1,
              item: { firstName: 'John', lastName: 'serialized output' },
              grid: gridStub,
              column: {},
            });
            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should Copy, Paste and run Execute clip command with only 1 cell to copy', () =>
        new Promise((done: any) => {
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };

          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('Smith');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).toHaveBeenCalledWith(0, 1);
            expect(updateCellSpy).toHaveBeenCalledWith(0, 2);
            expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Smith' }, grid: gridStub, column: {} });

            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            const updateCell2Spy = vi.spyOn(gridStub, 'updateCell');
            const setDataItemValSpy = vi.spyOn(plugin, 'setDataItemValueForColumn');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            expect(updateCell2Spy).toHaveBeenCalled();
            expect(onCellChangeSpy).toHaveBeenCalled();
            // expect(onCellChange2Spy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Smith' }, grid: gridStub, column: {} });
            expect(setDataItemValSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should remove quotes on multiline content pastes', () =>
        new Promise((done: any) => {
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };

          plugin.init(gridStub, {
            clipboardPasteDelay: 1,
            clearCopySelectionDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler,
            removeDoubleQuotesOnPaste: true,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('Smith');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).toHaveBeenCalledWith(0, 1);
            expect(updateCellSpy).toHaveBeenCalledWith(0, 2);
            expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Smith' }, grid: gridStub, column: {} });

            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            const updateCell2Spy = vi.spyOn(gridStub, 'updateCell');
            vi.spyOn(gridStub.onCellChange, 'notify');
            const setDataItemValSpy = vi.spyOn(plugin, 'setDataItemValueForColumn');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            expect(updateCell2Spy).toHaveBeenCalled();
            expect(onCellChangeSpy).toHaveBeenCalled();
            // expect(onCellChange2Spy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Smith' }, grid: gridStub, column: {} });
            expect(setDataItemValSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should replace newlines with configured characters for multiline content', () =>
        new Promise((done: any) => {
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };

          plugin.init(gridStub, {
            clipboardPasteDelay: 1,
            clearCopySelectionDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler,
            replaceNewlinesWith: '🥳',
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`"Smith\nDoe"`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).toHaveBeenCalledWith(0, 1);
            expect(updateCellSpy).toHaveBeenCalledWith(0, 2);
            expect(onCellChangeSpy).toHaveBeenCalledWith({
              row: 1,
              cell: 2,
              item: { firstName: 'John', lastName: '"Smith🥳Doe"' },
              grid: gridStub,
              column: {},
            });

            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            const updateCell2Spy = vi.spyOn(gridStub, 'updateCell');
            vi.spyOn(gridStub.onCellChange, 'notify');
            const setDataItemValSpy = vi.spyOn(plugin, 'setDataItemValueForColumn');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            expect(updateCell2Spy).toHaveBeenCalled();
            expect(onCellChangeSpy).toHaveBeenCalled();
            // expect(onCellChange2Spy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Smith' }, grid: gridStub, column: {} });
            expect(setDataItemValSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should Copy, Paste but not execute run clipCommandHandler when defined', () =>
        new Promise((done: any) => {
          const mockClipboardCommandHandler = vi.fn();
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 2, 2)])
            .mockReturnValueOnce(null as any);

          plugin.init(gridStub, {
            clearCopySelectionDelay: 1,
            clipboardPasteDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler: mockClipboardCommandHandler,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`Doe\tserialized output`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(mockClipboardCommandHandler).toHaveBeenCalled();
            done();
          });
        }));

      it('should Copy, Paste without completing it because it does not know where to paste it', () =>
        new Promise((done: any) => {
          const mockClipboardCommandHandler = vi.fn();
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 2, 2)])
            .mockReturnValueOnce(null as any);

          plugin.init(gridStub, {
            clearCopySelectionDelay: 1,
            clipboardPasteDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler: mockClipboardCommandHandler,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(null);
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`Doe\tserialized output`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(mockClipboardCommandHandler).not.toHaveBeenCalled();
            done();
          });
        }));

      it('should Copy, Paste and run Execute clip command', () =>
        new Promise((done: any) => {
          let nextAddNewRowId = 0;
          const mockNewRowCreator = vi.fn((count: number) => {
            for (let i = 0; i < count; i++) {
              gridStub.getData<any[]>().push({
                id: nextAddNewRowId--,
              });
            }
          });
          const mockOnPasteCells = vi.fn();
          const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 2, 2)])
            .mockReturnValueOnce(null as any);

          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };
          plugin.init(gridStub, {
            clearCopySelectionDelay: 1,
            clipboardPasteDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler,
            newRowCreator: mockNewRowCreator,
            onPasteCells: mockOnPasteCells,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 3 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`Doe\tserialized output`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(mockNewRowCreator).toHaveBeenCalled();
            expect(getDataItemSpy).toHaveBeenCalled();

            clipCommand.undo();

            expect(mockOnPasteCells).toHaveBeenCalledWith(new SlickEventData(), { ranges: [{ fromCell: 0, fromRow: 3, toCell: 1, toRow: 3 }] });
            done();
          });
        }));

      it('should warn if no new rows have been added via newRowCreator', () =>
        new Promise((done: any) => {
          const mockNewRowCreator = vi.fn((_count: number) => {
            // user forgot to add rows
          });
          const mockOnPasteCells = vi.fn();
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 2, 2)])
            .mockReturnValueOnce(null as any);
          const clipboardCommandHandler = (cmd: EditCommand) => {
            cmd.execute();
          };
          const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
          plugin.init(gridStub, {
            clearCopySelectionDelay: 1,
            clipboardPasteDelay: 1,
            includeHeaderWhenCopying: true,
            clipboardCommandHandler,
            newRowCreator: mockNewRowCreator,
            onPasteCells: mockOnPasteCells,
          });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 3 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`Doe\tserialized output`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(mockNewRowCreator).toHaveBeenCalled();
            expect(getDataItemSpy).toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('newRowCreator'));
            done();
          });
        }));

      it('should copy selection but skip hidden column and then use window.clipboard when exist and Paste is performed', () =>
        new Promise((done: any) => {
          let clipCommand: EditCommand;
          const clipboardCommandHandler = (cmd: EditCommand) => {
            clipCommand = cmd;
            cmd.execute();
          };
          const mockColumns = [
            { id: 'firstName', field: 'firstName', name: 'First Name', editor: { model: Editors.text }, editorClass: Editors.text },
            { id: 'lastName', field: 'lastName', name: lastNameElm, hidden: true },
            { id: 'age', field: 'age', name: 'Age', editor: { model: Editors.text }, editorClass: Editors.text },
            { id: 'gender', field: 'gender', name: 'Gender' },
          ] as Column[];
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce(null as any);
          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
          const onCellChangeSpy = vi.spyOn(gridStub.onCellChange, 'notify');
          const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce(`Doe\tserialized output`);
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(getActiveCellSpy).toHaveBeenCalled();
            expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
            expect(updateCellSpy).not.toHaveBeenCalledWith(1, 1);
            expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Doe' }, grid: gridStub, column: {} });
            const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
            clipCommand.undo();
            expect(getDataItemSpy).toHaveBeenCalled();
            done();
          });
        }));

      it('should not throw when pasting multiple rows with a hidden column that inflates destW across row iterations', () =>
        new Promise((done: any) => {
          // Paste 2 rows x 2 cells into a 3-column grid where column[1] is hidden.
          // destW starts at 2. On row y=0, the hidden col at destx=1 inflates destW to 3.
          // On row y=1 the loop starts with destW=3, hits hidden col again (destW→4),
          // then destx=3 → columns[3] === undefined → break is hit.
          //
          // y=0:
          // | x | destx | column    | hidden | action                   |
          // |---|-------|-----------|--------|--------------------------|
          // | 0 |   0   | firstName |        | paste "John"             |
          // | 1 |   1   | lastName  |  true  | destW++ (2→3), xOffset++ |
          // | 2 |   2   | age       |        | paste "30"               |
          //
          // y=1 (destW is now 3, not reset between rows):
          // | x | destx | column    | hidden | action                           |
          // |---|-------|-----------|--------|----------------------------------|
          // | 0 |   0   | firstName |        | paste "Jane"                     |
          // | 1 |   1   | lastName  |  true  | destW++ (3→4), xOffset++         |
          // | 2 |   2   | age       |        | paste "25"                       |
          // | 3 |   3   | (none)    |        | columns[3] === undefined → break |
          const hiddenColsMockColumns = [
            { id: 'firstName', field: 'firstName', name: 'First Name' },
            { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
            { id: 'age', field: 'age', name: 'Age' },
          ] as Column[];
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(hiddenColsMockColumns);
          vi.spyOn(gridStub, 'getDataLength').mockReturnValue(3);
          vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', age: 30 });
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce(null as any);

          const clipboardCommandHandler = (cmd: any) => cmd.execute();
          const setSelectedRangesSpy = vi.spyOn(mockHybridSelectionModel, 'setSelectedRanges');
          vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockHybridSelectionModel as any);

          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, clipboardCommandHandler });

          vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 0 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });

          // 2 rows x 2 visible cells; the hidden col between them inflates destW each row, pushing destx out of bounds on row 2
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('John\t30\r\nJane\t25');
          expect(() => gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub)).not.toThrow();

          setTimeout(() => {
            // 2 rows pasted, visible columns are 0 (firstName) and 2 (age)
            expect(setSelectedRangesSpy).toHaveBeenCalledWith([new SlickRange(0, 0, 1, 2)]);
            done();
          });
        }));

      it('should set correct bRange toCell (lastDestX) when hidden column sits between pasted columns on execute', () =>
        new Promise((done: any) => {
          const hiddenColsMockColumns = [
            { id: 'firstName', field: 'firstName', name: 'First Name' },
            { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
            { id: 'age', field: 'age', name: 'Age' },
            { id: 'gender', field: 'gender', name: 'Gender' },
          ] as Column[];
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(hiddenColsMockColumns);
          vi.spyOn(gridStub, 'getDataLength').mockReturnValue(2);
          vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', age: 30 });
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce(null as any);

          const clipboardCommandHandler = (cmd: any) => cmd.execute();
          const setSelectedRangesSpy = vi.spyOn(mockHybridSelectionModel, 'setSelectedRanges');
          vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockHybridSelectionModel as any);

          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, clipboardCommandHandler });

          vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 0 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });

          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('John\t30');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(setSelectedRangesSpy).toHaveBeenCalledWith([new SlickRange(0, 0, 0, 2)]);
            done();
          });
        }));

      it('should set correct bRange toCell (lastDestX) on undo when hidden column sits between pasted columns', () =>
        new Promise((done: any) => {
          const hiddenColsMockColumns = [
            { id: 'firstName', field: 'firstName', name: 'First Name' },
            { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
            { id: 'age', field: 'age', name: 'Age' },
          ] as Column[];
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(hiddenColsMockColumns);
          vi.spyOn(gridStub, 'getDataLength').mockReturnValue(2);
          vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', age: 30 });
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce(null as any);

          let clipCommand: any;
          const clipboardCommandHandler = (cmd: any) => {
            clipCommand = cmd;
            cmd.execute();
          };
          const setSelectedRangesSpy = vi.spyOn(mockHybridSelectionModel, 'setSelectedRanges');
          vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockHybridSelectionModel as any);
          const onPasteCellsSpy = vi.fn();

          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, clipboardCommandHandler, onPasteCells: onPasteCellsSpy });

          vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 0 });
          const keyDownCtrlPasteEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
          (navigator.clipboard.readText as Mock).mockResolvedValueOnce('John\t30');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            setSelectedRangesSpy.mockClear();
            onPasteCellsSpy.mockClear();

            clipCommand.undo();

            const expectedRange = new SlickRange(0, 0, 0, 2);
            expect(setSelectedRangesSpy).toHaveBeenCalledWith([expectedRange]);
            expect(onPasteCellsSpy).toHaveBeenCalledWith(expect.any(Object), { ranges: [expectedRange] });
            done();
          });
        }));

      it('should show a console error when navigator.clipboard fails', () =>
        new Promise((done: any) => {
          const consoleSpy = vi.spyOn(console, 'error').mockReturnValue();
          const mockColumns = [
            { id: 'firstName', field: 'firstName', name: 'First Name', editor: { model: Editors.text }, editorClass: Editors.text },
            { id: 'lastName', field: 'lastName', name: lastNameElm, hidden: true },
            { id: 'age', field: 'age', name: 'Age', editor: { model: Editors.text }, editorClass: Editors.text },
            { id: 'gender', field: 'gender', name: 'Gender' },
          ] as Column[];
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
            .mockReturnValueOnce([new SlickRange(0, 1, 1, 2)])
            .mockReturnValueOnce(null as any);
          plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true });

          const keyDownCtrlCopyEvent = new Event('keydown');
          Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
          (navigator.clipboard.writeText as Mock).mockRejectedValueOnce('clipboard error');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

          const keyDownCtrlPasteEvent = new Event('keydown');
          vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
          Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
          Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
          (navigator.clipboard.readText as Mock).mockRejectedValueOnce('clipboard error');
          gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

          setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledTimes(2);
            expect(consoleSpy).toHaveBeenCalledWith(
              'Unable to read/write to clipboard. Please check your browser settings or permissions. Error: clipboard error'
            );
            done();
          });
        }));

      it('should restore individual cell values on undo for multi-cell paste (oneCellToMultiple)', () => {
        plugin.init(gridStub, {});

        const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        getDataItemSpy
          .mockReturnValueOnce({ firstName: 'John', lastName: 'Doe' })
          .mockReturnValueOnce({ firstName: 'Jane', lastName: 'Smith' })
          .mockReturnValueOnce({ firstName: 'Bob', lastName: 'Johnson' });

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });

        // Manually construct the clip command to test undo behavior
        const clipCommand2 = {
          isClipboardCommand: true,
          destH: 3,
          destW: 1,
          h: 1,
          w: 1,
          maxDestY: 10,
          maxDestX: 10,
          oldValues: [[{ firstName: 'John', lastName: 'Doe' }], [{ firstName: 'Jane', lastName: 'Smith' }], [{ firstName: 'Bob', lastName: 'Johnson' }]],
          setDataItemValueForColumn: (dt: any, col: Column, value: any) => {
            dt[col.field] = value;
          },
          execute: () => {},
        } as any;

        clipCommand2.undo = function () {
          const columns = gridStub.getColumns();
          for (let y = 0; y < clipCommand2.destH; y++) {
            let xOffset = 0;
            for (let x = 0; x < clipCommand2.destW; x++) {
              const desty = 1 + y;
              const destx = 0 + x;
              const column = columns[destx];

              if (column.hidden) {
                xOffset++;
                continue;
              }

              if (desty < clipCommand2.maxDestY && destx < clipCommand2.maxDestX) {
                const dt = gridStub.getDataItem(desty);
                clipCommand2.setDataItemValueForColumn(dt, column, clipCommand2.oldValues[y][x - xOffset]);
                gridStub.updateCell(desty, destx);
              }
            }
          }
        };

        // Execute undo
        clipCommand2.undo();

        // Verify each cell was restored with its individual old value, not all with oldValues[0][0]
        expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(2, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(3, 0);
      });

      it('should restore individual cell values on undo for multi-cell paste with hidden columns', () => {
        const hiddenColsMockColumns = [
          { id: 'firstName', field: 'firstName', name: 'First Name' },
          { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
          { id: 'age', field: 'age', name: 'Age' },
        ] as Column[];

        plugin.init(gridStub, {});

        const updateCellSpy = vi.spyOn(gridStub, 'updateCell');
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        getDataItemSpy.mockReturnValueOnce({ firstName: 'John', age: 30 }).mockReturnValueOnce({ firstName: 'Jane', age: 25 });

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(hiddenColsMockColumns);
        vi.spyOn(gridStub, 'getActiveCell').mockReturnValue({ cell: 0, row: 1 });

        // Manually construct the clip command with hidden column to test xOffset tracking in undo
        const clipCommand2 = {
          isClipboardCommand: true,
          destH: 2,
          destW: 3, // 3 because: col0 (firstName) + col1 (hidden) + col2 (age)
          h: 1,
          w: 1,
          maxDestY: 10,
          maxDestX: 10,
          // oldValues[y][x-xOffset]: oldValues should have 2 items per row (for visible cols 0 and 2)
          oldValues: [
            [
              { firstName: 'John', age: 30 },
              { firstName: 'John', age: 30 },
            ],
            [
              { firstName: 'Jane', age: 25 },
              { firstName: 'Jane', age: 25 },
            ],
          ],
          setDataItemValueForColumn: (dt: any, col: Column, value: any) => {
            dt[col.field] = value;
          },
          execute: () => {},
        } as any;

        clipCommand2.undo = function () {
          const columns = gridStub.getColumns();
          for (let y = 0; y < clipCommand2.destH; y++) {
            let xOffset = 0;
            for (let x = 0; x < clipCommand2.destW; x++) {
              const desty = 1 + y;
              const destx = 0 + x;
              const column = columns[destx];

              if (column.hidden) {
                xOffset++;
                continue;
              }

              if (desty < clipCommand2.maxDestY && destx < clipCommand2.maxDestX) {
                const dt = gridStub.getDataItem(desty);
                clipCommand2.setDataItemValueForColumn(dt, column, clipCommand2.oldValues[y][x - xOffset]);
                gridStub.updateCell(desty, destx);
              }
            }
          }
        };

        // Execute undo with hidden column handling
        clipCommand2.undo();

        // Verify cells were updated (hidden column should be skipped, xOffset properly tracked)
        expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(1, 2);
        expect(updateCellSpy).toHaveBeenCalledWith(2, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(2, 2);
      });
    });
  });
});
