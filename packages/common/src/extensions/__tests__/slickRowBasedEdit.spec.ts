import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type {
  Column,
  EditCommand,
  GridOption,
  OnBeforeEditCellEventArgs,
  OnSetOptionsEventArgs,
  RowBasedEditOptions,
} from '../../interfaces/index.js';
import { SlickEvent, type SlickGrid } from '../../core/index.js';
import {
  BTN_ACTION_CANCEL,
  BTN_ACTION_DELETE,
  BTN_ACTION_EDIT,
  BTN_ACTION_UPDATE,
  ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS,
  SlickRowBasedEdit,
} from '../slickRowBasedEdit.js';
import { GridService } from '../../services/grid.service.js';
import { Editors } from '../../editors/editors.index.js';
import type { ExtensionUtility } from '../extensionUtility.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';

const addonOptions: RowBasedEditOptions = {
  actionsColumnLabel: 'MyActions',
  columnId: '_my_fancy_column_id',
  allowMultipleRows: false,
};

const mockColumns = [
  // The column definitions
  { name: 'Short', field: 'short', width: 100 },
  {
    name: 'Medium',
    field: 'medium',
    width: 100,
    editor: { model: Editors.text },
  },
  { name: 'Long', field: 'long', width: 100 },
  { name: 'Mixed', field: 'mixed', width: 100 },
  { name: 'Long header creates tooltip', field: 'header', width: 50 },
  {
    name: 'Long header with predefined tooltip',
    field: 'tooltipHeader',
    width: 50,
    toolTip: 'Already have a tooltip!',
  },
] as Column[];

const gridStubBlueprint = {
  getData: vi.fn().mockReturnValue({
    getItemMetadata: vi.fn(),
    getRowByItem: vi.fn(),
    getRowById: vi.fn(),
  }),
  setCellCssStyles: vi.fn(),
  removeCellCssStyles: vi.fn(),
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getOptions: vi.fn(),
  getViewport: vi.fn().mockReturnValue({ top: 0, bottom: 0 }),
  invalidateRows: vi.fn(),
  setOptions: vi.fn(),
  registerPlugin: vi.fn(),
  onSetOptions: new SlickEvent(),
  onBeforeEditCell: new SlickEvent(),
  getEditController: vi.fn().mockReturnValue({
    commitCurrentEdit: vi.fn(),
    cancelCurrentEdit: vi.fn(),
  }),
  getCellEditor: vi.fn().mockReturnValue({}),
  getActiveCell: vi.fn().mockReturnValue({ row: 0, cell: 0 }),
  setColumns: vi.fn().mockImplementation((columns) => {
    (gridStubBlueprint as any).columns = columns;
  }),
  invalidate: vi.fn(),
  render: vi.fn(),
  getColumns: vi.fn().mockImplementation(() => (gridStubBlueprint as any).columns || []),
} as unknown as SlickGrid;

const extensionUtilityStub = {

} as ExtensionUtility;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  subscribeEvent: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

type MockedSlickGrid = SlickGrid & {
  [K in keyof SlickGrid]: Mock;
};

describe('Row Based Edit Plugin', () => {
  let plugin: SlickRowBasedEdit;
  let gridStub: MockedSlickGrid;
  let gridService: GridService;

  beforeEach(() => {
    const _any = {} as any;
    gridStub = {
      ...(gridStubBlueprint as unknown as SlickGrid),
      columns: [...mockColumns],
    } as unknown as MockedSlickGrid;
    gridService = new GridService(_any, _any, _any, _any, _any, _any, _any);
    vi.spyOn(gridService, 'getAllColumnDefinitions').mockReturnValue(mockColumns);
    plugin = new SlickRowBasedEdit(extensionUtilityStub, pubSubServiceStub, addonOptions);
    (plugin as any)._eventHandler = {
      subscribe: vi.fn(),
      unsubscribeAll: vi.fn(),
    };

    // add a getter eventHandler to the gridStub
    Object.defineProperty(gridStub, 'eventHandler', {
      get: vi.fn(() => (plugin as any)._eventHandler),
      set: vi.fn(),
      enumerable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    plugin.destroy();
    plugin.dispose();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  const optionsMock = {
    autoEdit: true,
    editable: true,
    enableCellNavigation: true,
  } as GridOption;

  it('should only allow cell editing when the currently edited row is in edit mode', () => {
    const fakeItem = { id: 'test' };

    gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
    gridStub.getOptions.mockReturnValue(optionsMock);

    plugin.init(gridStub, gridService);

    const onBeforeEditCellHandler = (plugin.eventHandler.subscribe as Mock<any>).mock.calls[0][1] as (
      e: Event,
      args: OnBeforeEditCellEventArgs
    ) => boolean;
    expect(onBeforeEditCellHandler({} as Event, { item: fakeItem } as OnBeforeEditCellEventArgs)).toBe(false);

    plugin.rowBasedEditCommandHandler(fakeItem, {} as Column, {} as EditCommand);

    expect(onBeforeEditCellHandler({} as Event, { item: fakeItem } as OnBeforeEditCellEventArgs)).toBe(true);
  });

  it('should throw an error when "enableRowEdit" is set without "enableCellNavigation"', () => {
    gridStub.getOptions.mockReturnValue({});

    expect(() => plugin.init(gridStub, gridService)).toThrow(/(enableCellNavigation = true)/);
  });

  it('should throw an error when "enableRowEdit" is set without "editable"', () => {
    gridStub.getOptions.mockReturnValue({ enableCellNavigation: true });

    expect(() => plugin.init(gridStub, gridService)).toThrow(/(editable = true)/);
  });

  it('should warn the user when autoEdit is not set or false and turn it on', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockReturnValue();
    gridStub.getOptions.mockReturnValue({
      enableCellNavigation: true,
      editable: true,
      autoEdit: false,
    });

    plugin.init(gridStub, gridService);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"autoEdit"'));
  });

  it('should override any existing edit command handler to keep track of changes performed on individual rows', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);

    plugin.init(gridStub, gridService);

    expect(gridStub.setOptions).toHaveBeenCalledWith({
      editCommandHandler: expect.anything(),
    });
  });

  describe('when running the overriden edit command handler', () => {
    it('should run original command handler first when running override edit command handler', () => {
      const editCommandHandlerSpy = vi.fn();
      gridStub.getOptions.mockReturnValue({
        ...optionsMock,
        editCommandHandler: editCommandHandlerSpy,
      } as GridOption);

      plugin.init(gridStub, gridService);
      plugin.rowBasedEditCommandHandler({} as any, {} as Column, {} as EditCommand);
      expect(editCommandHandlerSpy).toHaveBeenCalled();
    });

    it('should early exit if no matching column found', () => {
      const editCommandHandlerSpy = vi.fn();
      gridStub.getOptions.mockReturnValue({
        ...optionsMock,
        editCommandHandler: editCommandHandlerSpy,
      } as GridOption);

      plugin.init(gridStub, gridService);
      gridStub.invalidate.mockReset();

      plugin.rowBasedEditCommandHandler(
        {} as any,
        undefined as unknown as Column,
        {
          prevSerializedValue: 'foo',
          serializedValue: 'bar',
          execute: () => { },
        } as EditCommand
      );

      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });

    it('should handle prev and current serialized values as arrays', () => {
      const editCommandHandlerSpy = vi.fn();
      gridStub.getOptions.mockReturnValue({
        ...optionsMock,
        editCommandHandler: editCommandHandlerSpy,
      } as GridOption);

      gridStub.getData().getRowById = () => 0;

      plugin.init(gridStub, gridService);
      gridStub.invalidate.mockReset();

      plugin.rowBasedEditCommandHandler(
        {} as any,
        undefined as unknown as Column,
        {
          prevSerializedValue: [],
          serializedValue: ['bar'],
          execute: () => { },
        } as EditCommand
      );

      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('when excel copy buffer is enabled', () => {
    const excelCopyBufferOptions = {
      ...optionsMock,
      enableExcelCopyBuffer: true,
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should override the enableExcelCopyBuffer's before paste cell handler if the plugin is turned on", () => {
      gridStub.getOptions.mockReturnValue(excelCopyBufferOptions);

      plugin.init(gridStub, gridService);

      expect(gridStub.setOptions).toHaveBeenCalledWith({
        excelCopyBufferOptions: {
          onBeforePasteCell: expect.anything(),
        },
      });
    });

    it('should early exit if any user defined rule returned with false', () => {
      gridStub.getOptions.mockReturnValue({
        ...excelCopyBufferOptions,
        excelCopyBufferOptions: { onBeforePasteCell: () => false },
      });

      plugin.init(gridStub, gridService);

      const call = gridStub.setOptions.mock.calls.find((c) => c[0].excelCopyBufferOptions)![0] as GridOption;

      const result = call.excelCopyBufferOptions!.onBeforePasteCell!.bind({
        existingBeforePasteCellHandler: () => false,
      })({} as any, {} as any);

      expect(result).toBe(false);
    });

    it('should allow paste if the row is currently in edit mode', () => {
      const fakeItem = { id: 'test' };
      gridStub.getOptions.mockReturnValue({
        ...excelCopyBufferOptions,
        excelCopyBufferOptions: { onBeforePasteCell: () => true },
      });

      plugin.init(gridStub, gridService);

      const call = gridStub.setOptions.mock.calls.find((c) => c[0].excelCopyBufferOptions)![0] as GridOption;

      gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
      plugin.rowBasedEditCommandHandler(fakeItem, { id: 'test-column' } as Column, {} as EditCommand);

      const result = call.excelCopyBufferOptions!.onBeforePasteCell!.bind({
        existingBeforePasteCellHandler: () => false,
      })({} as any, {} as any);

      expect(result).toBe(true);
    });

    it('should deny paste if both user rules and edit mode is false', () => {
      gridStub.getOptions.mockReturnValue({
        ...excelCopyBufferOptions,
        excelCopyBufferOptions: { onBeforePasteCell: () => true },
      });

      plugin.init(gridStub, gridService);

      const call = gridStub.setOptions.mock.calls.find((c) => c[0].excelCopyBufferOptions)![0] as GridOption;

      const result = call.excelCopyBufferOptions!.onBeforePasteCell!.bind({
        existingBeforePasteCellHandler: () => false,
      })({} as any, {} as any);

      expect(gridStub.getData).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  it('should override the getItemMetaData', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);

    gridStub.getData().getItemMetadata = 'TEST' as any;
    plugin.init(gridStub, gridService);

    expect(gridStub.getData().getItemMetadata).not.toBe('TEST');
  });

  it('should apply previous itemMetadata if available', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    const fakeItem = { id: 'test' };
    gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
    const previousGetItemMetadataSpy = vi.fn();
    gridStub.getData().getItemMetadata = previousGetItemMetadataSpy;
    plugin.init(gridStub, gridService);

    gridStub.getData().getItemMetadata(1);

    expect(previousGetItemMetadataSpy).toHaveBeenCalledWith(1);
  });

  it('should add the row highlight class if row is in editmode', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    const fakeItem = { id: 'test' };
    gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
    plugin.init(gridStub, gridService);

    plugin.rowBasedEditCommandHandler(fakeItem, {} as Column, {} as EditCommand);
    const meta = gridStub.getData().getItemMetadata(1);

    expect(meta?.cssClasses).toContain(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS);
  });

  it('should remove the highlight class if row no longer in editmode', () => {
    gridStub.getOptions.mockReturnValue({
      ...optionsMock,
      datasetIdPropertyName: 'id',
    });
    const fakeItem = { id: 'test' };
    gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
    gridStub.getData().getItemMetadata = () => ({
      cssClasses: ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS,
    });
    plugin.init(gridStub, gridService);

    const meta = gridStub.getData().getItemMetadata(1);

    expect(meta?.cssClasses).not.toContain(ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS);
  });

  it('should set up a otions updated listener', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    gridStub.onSetOptions = 'onSetOptions' as any;
    plugin.init(gridStub, gridService);

    const call = (plugin.eventHandler.subscribe as Mock<any>).mock.calls.find(
      (c) => c[0] === 'onSetOptions'
    )![1] as (_e: Event, args: OnSetOptionsEventArgs) => void;

    call(
      {} as Event,
      {
        optionsAfter: { rowBasedEditOptions: { foobar: true } },
      } as unknown as OnSetOptionsEventArgs
    );

    expect(plugin.addonOptions).toEqual(expect.objectContaining({ foobar: true }));
  });

  it('should remove all styles of rows on re-render and re-apply them', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    gridStub.getData().onRowsOrCountChanged = 'onRowsOrCountChanged' as any;
    plugin.init(gridStub, gridService);

    gridStub.getData.mockReturnValue({
      getItem: () => mockColumns[1],
      getRowById: () => 0,
    });

    plugin.rowBasedEditCommandHandler(mockColumns[1], { id: 'test-column' } as Column, {} as EditCommand);

    plugin.rowBasedEditCommandHandler(
      mockColumns[1],
      { id: 'test-column' } as Column,
      {
        prevSerializedValue: 'foo',
        serializedValue: 'bar',
        execute: () => { },
      } as EditCommand
    );

    const call = (plugin.eventHandler.subscribe as Mock<any>).mock.calls.find(
      (c) => c[0] === 'onRowsOrCountChanged'
    )![1] as () => void;

    call();

    expect(gridStub.removeCellCssStyles).toHaveBeenCalledTimes(1);
    expect(gridStub.setCellCssStyles).toHaveBeenCalledTimes(2);
  });

  it('should cleanup all handlers and pubsub when destroyed', () => {
    plugin.init(gridStub, gridService);
    plugin.destroy();

    expect(plugin.eventHandler.unsubscribeAll).toHaveBeenCalled();
    expect(pubSubServiceStub.unsubscribeAll).toHaveBeenCalled();
  });

  describe('when creating the plugin', () => {
    it('should merge default options with user provided options', () => {
      const options = { ...addonOptions, editable: false };
      const cols = [...mockColumns];
      plugin.create(cols, options);

      expect(plugin.addonOptions).toEqual(expect.objectContaining({ columnIndexPosition: -1 }));
    });

    it('should add a custom column formatter to the action column', () => {
      plugin.init(gridStub, gridService);
      const actionColumn = plugin.getColumnDefinition();

      const fragment = actionColumn.formatter?.(0, 0, undefined, {} as Column, 'test', gridStub);

      expect(fragment).toBeDefined();
      expect((fragment as DocumentFragment).hasChildNodes()).toBe(true);

      const actionBtns = (fragment as DocumentFragment).querySelectorAll('span.action-btns');
      expect(actionBtns.length).toBe(4);
    });

    it('should add the actions column at the end if columnIndexPosition not provided', () => {
      const options = { ...addonOptions, editable: false };

      const cols = [...mockColumns];
      plugin.create(cols, options);

      const actionColumn = plugin.getColumnDefinition();
      expect(cols.at(-1)?.name).toEqual(actionColumn.name);
    });

    [-1, 0, 2].forEach((position) => {
      it('should position the actions column at the ' + position + ' position provided via columnIndexPosition', () => {
        const options = {
          ...addonOptions,
          rowBasedEditOptions: { columnIndexPosition: position },
          editable: false,
        } as GridOption;

        const cols = [...mockColumns];
        plugin.create(cols, options);

        const actionColumn = plugin.getColumnDefinition();
        expect(cols.at(position)?.name).toEqual(actionColumn.name);
      });
    });

    [-10, 100, mockColumns.length].forEach((position) => {
      it('should position the columns at the start if position out of bounds: ' + position, () => {
        const options = {
          ...addonOptions,
          rowBasedEditOptions: { columnIndexPosition: position },
          editable: false,
        } as GridOption;

        const cols = [...mockColumns];
        plugin.create(cols, options);

        const actionColumn = plugin.getColumnDefinition();
        expect(cols.at(0)?.name).toEqual(actionColumn.name);
      });
    });

    it('should publish an onPluginColumnsChanged event when creating the plugin', () => {
      const spy = vi.spyOn(pubSubServiceStub, 'publish');
      const options = { ...addonOptions, editable: false };
      const cols = [...mockColumns];
      plugin.create(cols, options);

      expect(spy).toHaveBeenCalledWith('onPluginColumnsChanged', expect.anything());
    });
  });

  describe('the actions column', () => {
    function arrange(addonOptions?: RowBasedEditOptions) {
      const gridService = {
        deleteItem: vi.fn(),
        getAllColumnDefinitions: vi.fn().mockReturnValue(mockColumns),
      } as unknown as GridService;
      plugin = new SlickRowBasedEdit(extensionUtilityStub, pubSubServiceStub, addonOptions);
      (plugin as any)._eventHandler = {
        subscribe: vi.fn(),
        unsubscribeAll: vi.fn(),
      };
      plugin.init(gridStub, gridService);
      const actionColumn = plugin.getColumnDefinition();
      gridStub.getData.mockReturnValue({
        getRowByItem: () => 0,
        getRowById: () => 0,
      });

      const confirmSpy = vi.fn().mockReturnValue(false);
      window.confirm = confirmSpy;

      return {
        onCellClick: actionColumn.onCellClick!,
        gridService,
        confirmSpy,
      };
    }

    function createFakeEvent(classToAdd: string, simulateChildClick = false) {
      const fakeElement = document.createElement('span');

      if (simulateChildClick) {
        const fakeParent = document.createElement('div');
        fakeParent.classList.add(classToAdd);
        fakeParent.appendChild(fakeElement);
      } else {
        fakeElement.classList.add(classToAdd);
      }

      const event = { target: fakeElement } as unknown as Event;

      return event;
    }

    it('should have overrideable action column options', () => {
      arrange({
        actionColumnConfig: {
          width: 100,
          minWidth: 100,
          maxWidth: 100,
        },
      });

      expect(plugin.getColumnDefinition()).toEqual(
        expect.objectContaining({
          width: 100,
          minWidth: 100,
          maxWidth: 100,
        })
      );
    });

    it('should prompt before deletion if deleteButtonPrompt is defined and keep row if canceled', () => {
      const { onCellClick, gridService, confirmSpy } = arrange({
        actionButtons: { deleteButtonPrompt: 'TEST' },
      });
      const fakeItem = { id: 'test' };

      onCellClick(createFakeEvent(BTN_ACTION_DELETE), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(gridService.deleteItem).not.toHaveBeenCalled();
    });

    it('should exit editmode before deleting the item', () => {
      const { onCellClick, gridService } = arrange();
      const fakeItem = { id: 'test' };

      onCellClick(createFakeEvent(BTN_ACTION_DELETE), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridService.deleteItem).toHaveBeenCalled();
    });

    it('should enter editmode when clicking the edit button', () => {
      const { onCellClick } = arrange();
      const fakeItem = { id: 'test' };

      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_EDIT), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridStub.invalidate).toHaveBeenCalledTimes(1);
    });

    it('should call an optionally registered onBeforeEditMode callback clicking the edit button', () => {
      const spy = vi.fn();
      const { onCellClick } = arrange({ onBeforeEditMode: () => spy() });
      const fakeItem = { id: 'test' };

      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_EDIT), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should not enter editmode when not in allowMultipleRows mode and a previous row is already in editmode', () => {
      const { onCellClick } = arrange();
      const fakeItem = { id: 'test' };

      plugin.rowBasedEditCommandHandler(fakeItem, {} as Column, {} as EditCommand);
      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_EDIT), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });

    it('should prompt before updating if updateButtonPrompt is defined and edits happened and keep row in editmode', () => {
      const { onCellClick, confirmSpy } = arrange({
        actionButtons: { updateButtonPrompt: 'TEST' },
      });
      const fakeItem = { id: 'test' };

      plugin.rowBasedEditCommandHandler(
        fakeItem,
        {} as Column,
        {
          prevSerializedValue: 'foo',
          serializedValue: 'bar',
          execute: () => { },
        } as EditCommand
      );
      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_UPDATE), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });

    it('should call onBeforeRowUpdated and cancel if a non-true result is returned', () => {
      const { onCellClick } = arrange({
        onBeforeRowUpdated: () => Promise.resolve(false),
      });
      const fakeItem = { id: 'test' };

      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_UPDATE), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });

    it('should remove all cell css styles after updating', () => {
      const { onCellClick } = arrange();
      const fakeItem = { id: 'test' };

      gridStub.getColumns.mockReturnValue(mockColumns);
      gridStub.removeCellCssStyles.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_UPDATE), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridStub.removeCellCssStyles).toHaveBeenCalled();
    });

    it('should prompt before canceling if cancelButtonPrompt is defined and previous edits exist and keep row in editmode if canceled prompt', () => {
      const { onCellClick, confirmSpy } = arrange({
        actionButtons: { cancelButtonPrompt: 'TEST' },
      });
      const fakeItem = { id: 'test' };

      plugin.rowBasedEditCommandHandler(
        fakeItem,
        {} as Column,
        {
          prevSerializedValue: 'foo',
          serializedValue: 'bar',
          execute: () => { },
        } as EditCommand
      );
      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_CANCEL), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(gridStub.invalidate).not.toHaveBeenCalled();
    });

    it('should undo row edits', () => {
      const { onCellClick } = arrange();
      const fakeItem = { id: 'test' };
      const undoSpy = vi.fn();

      plugin.rowBasedEditCommandHandler(
        fakeItem,
        {} as Column,
        {
          prevSerializedValue: 'foo',
          serializedValue: 'bar',
          execute: () => { },
          undo: undoSpy,
        } as unknown as EditCommand
      );
      gridStub.invalidate.mockClear();
      onCellClick(createFakeEvent(BTN_ACTION_CANCEL, true), {
        row: 0,
        cell: 0,
        grid: gridStub,
        columnDef: {} as Column,
        dataContext: fakeItem,
        dataView: gridStub.getData(),
      });

      expect(gridStub.invalidate).toHaveBeenCalled();
    });

    it('should translate button titles to French when translation keys are provided with Translate Service available', () => {
      const translateService = new TranslateServiceStub();
      (extensionUtilityStub as any).translaterService = translateService;

      translateService.use('fr');

      gridStub.getOptions.mockReturnValue({
        ...optionsMock, rowBasedEditOptions: {
          actionButtons: {
            updateButtonTitleKey: 'UPDATE',
            editButtonTitleKey: 'EDIT',
            deleteButtonTitleKey: 'DELETE',
            cancelButtonTitleKey: 'CANCEL',
          }
        }
      });

      plugin.init(gridStub, gridService);
      plugin.translate();
      const actionColumn = plugin.getColumnDefinition();

      const fragment = actionColumn.formatter?.(0, 0, undefined, {} as Column, 'test', gridStub);
      const actionBtns = (fragment as DocumentFragment).querySelectorAll<HTMLSpanElement>('span.action-btns');
      expect(actionBtns[0].title).toBe('Éditer');
      expect(actionBtns[1].title).toBe('Effacer');
      expect(actionBtns[2].title).toBe('Mettre a jour');
      expect(actionBtns[3].title).toBe('Annuler');
      expect(actionBtns.length).toBe(4);

      expect(gridStub.setOptions).toHaveBeenCalledWith({
        editCommandHandler: expect.anything(),
      });
    });
  });
});
