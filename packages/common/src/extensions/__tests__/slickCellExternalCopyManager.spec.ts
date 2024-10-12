import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SelectionModel } from '../../enums/index.js';
import type { Column, GridOption, OnEventArgs, } from '../../interfaces/index.js';
import type { SlickCellSelectionModel } from '../slickCellSelectionModel.js';
import { SlickCellExternalCopyManager } from '../slickCellExternalCopyManager.js';
import type { InputEditor } from '../../editors/inputEditor.js';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid, SlickRange } from '../../core/index.js';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

vi.useFakeTimers();

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
    { id: 'firstName', field: 'firstName', name: 'First Name', },
    { id: 'lastName', field: 'lastName', name: 'Last Name' },
  ] as Column[]),
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

const mockCellSelectionModel = {
  constructor: vi.fn(),
  init: vi.fn(),
  dispose: vi.fn(),
  getSelectedRanges: vi.fn(),
  setSelectedRanges: vi.fn(),
  getSelectedRows: vi.fn(),
  setSelectedRows: vi.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickCellSelectionModel;

const mockTextEditor = {
  constructor: vi.fn(),
  init: vi.fn(),
  destroy: vi.fn(),
  applyValue: vi.fn(),
  loadValue: vi.fn(),
  serializeValue: vi.fn(),
  validate: vi.fn().mockReturnValue({ valid: true, msg: null }),
} as unknown as InputEditor;

const mockTextEditorImplementation = vi.fn().mockImplementation(() => mockTextEditor);

const Editors = {
  text: mockTextEditorImplementation
};

describe('CellExternalCopyManager', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockReturnValue();
  const lastNameElm = document.createElement('div');
  lastNameElm.textContent = 'Last Name';
  const mockEventCallback = () => { };
  const mockColumns = [
    { id: 'firstName', field: 'firstName', name: 'First Name', editor: { model: Editors.text }, editorClass: Editors.text },
    { id: 'lastName', field: 'lastName', name: lastNameElm, },
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
    }
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
    });

    afterEach(() => {
      plugin.dispose();
      vi.clearAllMocks();
    });

    it('should throw an error initializing the plugin without a selection model', () => new Promise((done: any) => {
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(null as any);
      try {
        plugin.init(gridStub);
      } catch (error) {
        expect(error.message).toBe('Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new SlickCellSelectionModel())');
        done();
      }
    }));

    it('should focus on the grid after "onSelectedRangesChanged" is triggered', () => {
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockCellSelectionModel as any);
      const gridFocusSpy = vi.spyOn(gridStub, 'focus');

      plugin.init(gridStub);
      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as unknown as SlickEventData;
      mockCellSelectionModel.onSelectedRangesChanged.notify([new SlickRange(0, 0, 0, 0)], eventData, gridStub);

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
      plugin.init(gridStub, { dataItemColumnValueExtractor: (item, col) => col.field === 'firstName' ? 'Full Name' : 'Last Name' });
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

      expect(loadValSpy).toHaveBeenCalledWith(mockItem);
      expect(applyValSpy).toHaveBeenCalledWith(mockItem, 'some value');
    });

    it('should call "setDataItemValueForColumn" and expect an onValidationError triggered if validation failed', () => {
      const validationResults = { valid: false, msg: 'foobar' };
      const applyValSpy = vi.spyOn(mockTextEditor, 'applyValue');
      const loadValSpy = vi.spyOn(mockTextEditor, 'loadValue');
      const validationSpy = vi.spyOn(mockTextEditor, 'validate').mockReturnValue(validationResults);
      vi.spyOn(gridStub, 'getSelectionModel').mockReturnValue(mockCellSelectionModel as any);
      const notifySpy = vi.spyOn(gridStub.onValidationError, 'notify');
      const mockItem = { firstName: 'John', lastName: 'Doe' };
      plugin.init(gridStub);
      plugin.setDataItemValueForColumn(mockItem, mockColumns[0], 'some value');

      expect(loadValSpy).toHaveBeenCalledWith(mockItem);
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
          lastName: 'Doe'
        },
        value: 'Foobar', columnDef: {} as Column
      });

      expect(sutSpy).toHaveBeenCalled();
    });

    describe('keyDown handler', () => {
      beforeEach(() => {
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        vi.spyOn(gridStub, 'getDataLength').mockReturnValue(2);
        vi.spyOn(gridStub, 'getData').mockReturnValue([{ firstName: 'John', lastName: 'Doe', age: 30 }, { firstName: 'Jane', lastName: 'Doe' }]);
        vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' }).mockReturnValueOnce({ firstName: 'Jane', lastName: 'Doe' });
        vi.spyOn(gridStub, 'hasDataView').mockReturnValue(false);
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should Copy & Paste then clear selections', () => {
        const mockOnCopyCancelled = vi.fn();
        const mockOnCopyInit = vi.fn();
        const mockOnCopyCells = vi.fn();
        const mockOnCopySuccess = vi.fn();

        const clearSpy = vi.spyOn(plugin, 'clearCopySelection');
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValue([new SlickRange(0, 1, 2, 2)]);

        plugin.init(gridStub, { clearCopySelectionDelay: 1, clipboardPasteDelay: 2, includeHeaderWhenCopying: true, onCopyCancelled: mockOnCopyCancelled, onCopyInit: mockOnCopyInit, onCopyCells: mockOnCopyCells, onCopySuccess: mockOnCopySuccess });

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

        vi.advanceTimersByTime(2);
        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
      });

      it('should copy selection and use window.clipboard when exist and Paste is performed', () => {
        const mockOnCopyInit = vi.fn();
        const mockOnCopyCells = vi.fn();
        const mockSetData = vi.fn();
        const mockClipboard = () => ({ setData: mockSetData });
        Object.defineProperty(window, 'clipboardData', { writable: true, configurable: true, value: mockClipboard() });
        const clearSpy = vi.spyOn(plugin, 'clearCopySelection');
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValue([new SlickRange(0, 1, 1, 2)]);

        plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, onCopyInit: mockOnCopyInit, onCopyCells: mockOnCopyCells });

        const keyDownCtrlCopyEvent = new Event('keydown');
        Object.defineProperty(keyDownCtrlCopyEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
        Object.defineProperty(keyDownCtrlCopyEvent, 'key', { writable: true, configurable: true, value: 'c' });
        Object.defineProperty(keyDownCtrlCopyEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
        Object.defineProperty(keyDownCtrlCopyEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlCopyEvent, gridStub);

        expect(clearSpy).toHaveBeenCalled();
        expect(mockOnCopyInit).toHaveBeenCalled();
        expect(mockSetData).toHaveBeenCalledWith('Text', expect.any(String));
        expect(mockSetData).toHaveBeenCalledWith('Text', expect.stringContaining(`Last Name\tAge`));
        expect(mockSetData).toHaveBeenCalledWith('Text', expect.stringContaining(`Doe\tserialized output`));

        const getActiveCellSpy = vi.spyOn(gridStub, 'getActiveCell');
        const keyDownCtrlPasteEvent = new Event('keydown');
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        Object.defineProperty(keyDownCtrlPasteEvent, 'ctrlKey', { writable: true, configurable: true, value: true });
        Object.defineProperty(keyDownCtrlPasteEvent, 'key', { writable: true, configurable: true, value: 'v' });
        Object.defineProperty(keyDownCtrlPasteEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
        Object.defineProperty(keyDownCtrlPasteEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);

        vi.advanceTimersByTime(2);
        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(clearSpy).toHaveBeenCalled();
      });

      it('should Copy, Paste and run Execute clip command', () => {
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce(null as any);
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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(1, 1);
        expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 0, item: { firstName: 'John', lastName: 'serialized output' }, grid: gridStub, column: {} });
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        clipCommand.undo();
        expect(getDataItemSpy).toHaveBeenCalled();
      });

      it('should not paste on cells where onBeforePasteCell handler returns false', () => {
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce(null as any);

        // first one should be denied
        returnValueStub.mockReturnValueOnce(false);
        plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler, onBeforePasteCell: (e: SlickEventData, args: OnEventArgs) => args.cell > 0 });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(updateCellSpy).not.toHaveBeenCalledWith(1, 0);
        expect(updateCellSpy).toHaveBeenCalledWith(1, 1);
        expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 1, item: { firstName: 'John', lastName: 'serialized output' }, grid: gridStub, column: {} });
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        clipCommand.undo();
        expect(getDataItemSpy).toHaveBeenCalled();
      });

      it('should Copy, Paste and run Execute clip command with only 1 cell to copy', () => {
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Smith`;

        vi.advanceTimersByTime(2);

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
      });

      it('should remove quotes on multiline content pastes', () => {
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };

        plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler, removeDoubleQuotesOnPaste: true });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `"Smith"`;

        vi.advanceTimersByTime(2);

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
      });

      it('should replace newlines with configured characters for multiline content', () => {
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]);
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };

        plugin.init(gridStub, { clipboardPasteDelay: 1, clearCopySelectionDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler, replaceNewlinesWith: '🥳' });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `"Smith\nDoe"`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(updateCellSpy).toHaveBeenCalledWith(0, 1);
        expect(updateCellSpy).toHaveBeenCalledWith(0, 2);
        expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: '"Smith🥳Doe"' }, grid: gridStub, column: {} });

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
      });

      it('should Copy, Paste but not execute run clipCommandHandler when defined', () => {
        const mockClipboardCommandHandler = vi.fn();
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 2, 2)]).mockReturnValueOnce(null as any);

        plugin.init(gridStub, { clearCopySelectionDelay: 1, clipboardPasteDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler: mockClipboardCommandHandler });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(mockClipboardCommandHandler).toHaveBeenCalled();
      });

      it('should Copy, Paste without completing it because it does not know where to paste it', () => {
        const mockClipboardCommandHandler = vi.fn();
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 2, 2)]).mockReturnValueOnce(null as any);

        plugin.init(gridStub, { clearCopySelectionDelay: 1, clipboardPasteDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler: mockClipboardCommandHandler });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(mockClipboardCommandHandler).not.toHaveBeenCalled();
      });

      it('should Copy, Paste and run Execute clip command', () => {
        let nextAddNewRowId = 0;
        const mockNewRowCreator = vi.fn((count: number) => {
          for (let i = 0; i < count; i++) {
            gridStub.getData<any[]>().push({
              id: nextAddNewRowId--
            });
          }
        });
        const mockOnPasteCells = vi.fn();
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges')
          .mockReturnValueOnce([new SlickRange(0, 1, 2, 2)])
          .mockReturnValueOnce(null as any);

        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };
        plugin.init(gridStub, { clearCopySelectionDelay: 1, clipboardPasteDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler, newRowCreator: mockNewRowCreator, onPasteCells: mockOnPasteCells });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(mockNewRowCreator).toHaveBeenCalled();
        expect(getDataItemSpy).toHaveBeenCalled();

        clipCommand.undo();

        expect(mockOnPasteCells).toHaveBeenCalledWith(new SlickEventData(), { ranges: [{ fromCell: 0, fromRow: 3, toCell: 1, toRow: 3 }] });
      });

      it('should warn if no new rows have been added via newRowCreator', () => {
        const mockNewRowCreator = vi.fn((_count: number) => {
          // user forgot to add rows
        });
        const mockOnPasteCells = vi.fn();
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 2, 2)]).mockReturnValueOnce(null as any);
        const clipboardCommandHandler = (cmd) => {
          cmd.execute();
        };
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        plugin.init(gridStub, { clearCopySelectionDelay: 1, clipboardPasteDelay: 1, includeHeaderWhenCopying: true, clipboardCommandHandler, newRowCreator: mockNewRowCreator, onPasteCells: mockOnPasteCells });

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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(mockNewRowCreator).toHaveBeenCalled();
        expect(getDataItemSpy).toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('newRowCreator'));
      });

      it('should copy selection but skip hidden column and then use window.clipboard when exist and Paste is performed', () => {
        let clipCommand;
        const clipboardCommandHandler = (cmd) => {
          clipCommand = cmd;
          cmd.execute();
        };
        const mockColumns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', editor: { model: Editors.text }, editorClass: Editors.text },
          { id: 'lastName', field: 'lastName', name: lastNameElm, hidden: true, },
          { id: 'age', field: 'age', name: 'Age', editor: { model: Editors.text }, editorClass: Editors.text },
          { id: 'gender', field: 'gender', name: 'Gender' },
        ] as Column[];
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        vi.spyOn(gridStub.getSelectionModel() as SelectionModel, 'getSelectedRanges').mockReturnValueOnce([new SlickRange(0, 1, 1, 2)]).mockReturnValueOnce(null as any);
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
        gridStub.onKeyDown.notify({ cell: 0, row: 0, grid: gridStub }, keyDownCtrlPasteEvent, gridStub);
        document.querySelector('textarea')!.value = `Doe\tserialized output`;

        vi.advanceTimersByTime(2);

        expect(getActiveCellSpy).toHaveBeenCalled();
        expect(updateCellSpy).toHaveBeenCalledWith(1, 0);
        expect(updateCellSpy).not.toHaveBeenCalledWith(1, 1);
        expect(onCellChangeSpy).toHaveBeenCalledWith({ row: 1, cell: 2, item: { firstName: 'John', lastName: 'Doe' }, grid: gridStub, column: {} });
        const getDataItemSpy = vi.spyOn(gridStub, 'getDataItem');
        clipCommand.undo();
        expect(getDataItemSpy).toHaveBeenCalled();
      });
    });
  });
});