import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type {
  Column,
  EditCommand,
  GridOption,
  OnBeforeEditCellEventArgs,
  OnSetOptionsEventArgs,
  RowBasedEditOptions,
} from '../../interfaces/index';
import { SlickEvent, SlickGrid } from '../../core/index';
import {
  BTN_ACTION_CANCEL,
  BTN_ACTION_DELETE,
  BTN_ACTION_EDIT,
  BTN_ACTION_UPDATE,
  ROW_BASED_EDIT_ROW_HIGHLIGHT_CLASS,
  SlickRowBasedEdit,
} from '../slickRowBasedEdit';
import { GridService } from '../../services';
import { Editors } from '../../editors';

let addonOptions: RowBasedEditOptions = {
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
  getData: jest.fn().mockReturnValue({
    getItemMetadata: jest.fn(),
    getRowByItem: jest.fn(),
  }),
  setCellCssStyles: jest.fn(),
  removeCellCssStyles: jest.fn(),
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getOptions: jest.fn(),
  setOptions: jest.fn(),
  registerPlugin: jest.fn(),
  onSetOptions: new SlickEvent(),
  onBeforeEditCell: new SlickEvent(),
  setColumns: jest.fn().mockImplementation((columns) => {
    (gridStubBlueprint as any).columns = columns;
  }),
  invalidate: jest.fn(),
  render: jest.fn(),
  getColumns: jest
    .fn()
    .mockImplementation(() => (gridStubBlueprint as any).columns || []),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  subscribeEvent: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

type MockedSlickGrid = SlickGrid & {
  [K in keyof SlickGrid]: jest.Mock<any, any>;
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
    jest
      .spyOn(gridService, 'getAllColumnDefinitions')
      .mockReturnValue(mockColumns);
    plugin = new SlickRowBasedEdit(pubSubServiceStub, addonOptions);
    (plugin as any)._eventHandler = {
      subscribe: jest.fn(),
      unsubscribeAll: jest.fn(),
    };

    // add a getter eventHandler to the gridStub
    Object.defineProperty(gridStub, 'eventHandler', {
      get: jest.fn(() => (plugin as any)._eventHandler),
      set: jest.fn(),
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

    const onBeforeEditCellHandler = (
      plugin.eventHandler.subscribe as jest.Mock<any, any>
    ).mock.calls[0][1] as (
      e: Event,
      args: OnBeforeEditCellEventArgs
    ) => boolean;
    expect(
      onBeforeEditCellHandler(
        {} as Event,
        { item: fakeItem } as OnBeforeEditCellEventArgs
      )
    ).toBe(false);

    plugin.rowBasedEditCommandHandler(
      fakeItem,
      {} as Column,
      {} as EditCommand
    );

    expect(
      onBeforeEditCellHandler(
        {} as Event,
        { item: fakeItem } as OnBeforeEditCellEventArgs
      )
    ).toBe(true);
  });

  it('should throw an error when "enableRowEdit" is set without "enableCellNavigation"', () => {
    gridStub.getOptions.mockReturnValue({});

    expect(() => plugin.init(gridStub, gridService)).toThrow(
      /(enableCellNavigation = true)/
    );
  });

  it('should throw an error when "enableRowEdit" is set without "editable"', () => {
    gridStub.getOptions.mockReturnValue({ enableCellNavigation: true });

    expect(() => plugin.init(gridStub, gridService)).toThrow(
      /(editable = true)/
    );
  });

  it('should warn the user when autoEdit is not set or false and turn it on', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    gridStub.getOptions.mockReturnValue({
      enableCellNavigation: true,
      editable: true,
      autoEdit: false,
    });

    plugin.init(gridStub, gridService);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"autoEdit"')
    );
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
      const editCommandHandlerSpy = jest.fn();
      gridStub.getOptions.mockReturnValue({
        ...optionsMock,
        editCommandHandler: editCommandHandlerSpy,
      } as GridOption);

      plugin.init(gridStub, gridService);
      plugin.rowBasedEditCommandHandler(
        {} as any,
        {} as Column,
        {} as EditCommand
      );
      expect(editCommandHandlerSpy).toHaveBeenCalled();
    });

    it('should early exit if no matching column found', () => {
      const editCommandHandlerSpy = jest.fn();
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
          execute: () => {},
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
      jest.clearAllMocks();
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

      const call = gridStub.setOptions.mock.calls.find(
        (c) => c[0].excelCopyBufferOptions
      )[0] as GridOption;

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

      const call = gridStub.setOptions.mock.calls.find(
        (c) => c[0].excelCopyBufferOptions
      )[0] as GridOption;

      gridStub.getData.mockReturnValue({ getItem: () => fakeItem });
      plugin.rowBasedEditCommandHandler(
        fakeItem,
        { id: 'test-column' } as Column,
        {} as EditCommand
      );

      const result = call.excelCopyBufferOptions!.onBeforePasteCell!.bind({
        existingBeforePasteCellHandler: () => false,
      })({} as any, {} as any);

      expect(result).toBe(true);
    });

    it('should deny paste if both user rule and edit mode is false', () => {
      gridStub.getOptions.mockReturnValue({
        ...excelCopyBufferOptions,
        excelCopyBufferOptions: { onBeforePasteCell: () => true },
      });

      plugin.init(gridStub, gridService);

      const call = gridStub.setOptions.mock.calls.find(
        (c) => c[0].excelCopyBufferOptions
      )[0] as GridOption;

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
    const previousGetItemMetadataSpy = jest.fn();
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

    plugin.rowBasedEditCommandHandler(
      fakeItem,
      {} as Column,
      {} as EditCommand
    );
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

    const call = (
      plugin.eventHandler.subscribe as jest.Mock<any, any>
    ).mock.calls.find((c) => c[0] === 'onSetOptions')[1] as (
      _e: Event,
      args: OnSetOptionsEventArgs
    ) => void;

    call(
      {} as Event,
      {
        optionsAfter: { rowBasedEditOptions: { foobar: true } },
      } as unknown as OnSetOptionsEventArgs
    );

    expect(plugin.addonOptions).toEqual(
      expect.objectContaining({ foobar: true })
    );
  });

  it('should remove all stlyes of rows on re-render re-renderers and re-apply them', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    gridStub.getData().onRowsOrCountChanged = 'onRowsOrCountChanged' as any;
    plugin.init(gridStub, gridService);

    gridStub.getData.mockReturnValue({
      getItem: () => mockColumns[1],
      getRowById: () => 0,
    });

    plugin.rowBasedEditCommandHandler(
      mockColumns[1],
      { id: 'test-column' } as Column,
      {} as EditCommand
    );

    plugin.rowBasedEditCommandHandler(
      mockColumns[1],
      { id: 'test-column' } as Column,
      {
        prevSerializedValue: 'foo',
        serializedValue: 'bar',
        execute: () => {},
      } as EditCommand
    );

    const call = (
      plugin.eventHandler.subscribe as jest.Mock<any, any>
    ).mock.calls.find((c) => c[0] === 'onRowsOrCountChanged')[1] as () => void;

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

      expect(plugin.addonOptions).toEqual(
        expect.objectContaining({ columnIndexPosition: -1 })
      );
    });

    it('should add a custom column formatter to the action column', () => {
      plugin.init(gridStub, gridService);
      const actionColumn = plugin.getColumnDefinition();

      const fragment = actionColumn.formatter?.(
        0,
        0,
        undefined,
        {} as Column,
        'test',
        gridStub
      );

      expect(fragment).toBeDefined();
      expect((fragment as DocumentFragment).hasChildNodes()).toBe(true);

      const actionBtns = (fragment as DocumentFragment).querySelectorAll(
        'span.action-btns'
      );
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
      it(
        'should position the actions column at the ' +
          position +
          ' position provided via columnIndexPosition',
        () => {
          const options = {
            ...addonOptions,
            rowBasedEditOptions: { columnIndexPosition: position },
            editable: false,
          } as GridOption;

          const cols = [...mockColumns];
          plugin.create(cols, options);

          const actionColumn = plugin.getColumnDefinition();
          expect(cols.at(position)?.name).toEqual(actionColumn.name);
        }
      );
    });

    [-10, 100, mockColumns.length].forEach((position) => {
      it(
        'should position the columns at the start if position out of bounds: ' +
          position,
        () => {
          const options = {
            ...addonOptions,
            rowBasedEditOptions: { columnIndexPosition: position },
            editable: false,
          } as GridOption;

          const cols = [...mockColumns];
          plugin.create(cols, options);

          const actionColumn = plugin.getColumnDefinition();
          expect(cols.at(0)?.name).toEqual(actionColumn.name);
        }
      );
    });

    it('should publish an onPluginColumnsChanged event when creating the plugin', () => {
      const spy = jest.spyOn(pubSubServiceStub, 'publish');
      const options = { ...addonOptions, editable: false };
      const cols = [...mockColumns];
      plugin.create(cols, options);

      expect(spy).toHaveBeenCalledWith(
        'onPluginColumnsChanged',
        expect.anything()
      );
    });
  });

  describe('the actions column', () => {
    function arrange(addonOptions?: RowBasedEditOptions) {
      const gridService = {
        deleteItem: jest.fn(),
        getAllColumnDefinitions: jest.fn().mockReturnValue(mockColumns),
      } as unknown as GridService;
      plugin = new SlickRowBasedEdit(pubSubServiceStub, addonOptions);
      (plugin as any)._eventHandler = {
        subscribe: jest.fn(),
        unsubscribeAll: jest.fn(),
      };
      plugin.init(gridStub, gridService);
      const actionColumn = plugin.getColumnDefinition();
      gridStub.getData.mockReturnValue({
        getRowByItem: () => 0,
        getRowById: () => 0,
      });

      const confirmSpy = jest.fn().mockReturnValue(false);
      window.confirm = confirmSpy;

      return {
        onCellClick: actionColumn.onCellClick!,
        gridService,
        confirmSpy,
      };
    }

    function createFakeEvent(classToAdd: string) {
      const fakeElement = document.createElement('span');
      fakeElement.classList.add(classToAdd);
      const event = { target: fakeElement } as unknown as Event;

      return event;
    }

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

    it('should not enter editmode when not in allowMultipleRows mode and a previous row is already in editmode', () => {
      const { onCellClick } = arrange();
      const fakeItem = { id: 'test' };

      plugin.rowBasedEditCommandHandler(
        fakeItem,
        {} as Column,
        {} as EditCommand
      );
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
          execute: () => {},
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
          execute: () => {},
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
      const { onCellClick, confirmSpy } = arrange();
      const fakeItem = { id: 'test' };
      const undoSpy = jest.fn();

      plugin.rowBasedEditCommandHandler(
        fakeItem,
        {} as Column,
        {
          prevSerializedValue: 'foo',
          serializedValue: 'bar',
          execute: () => {},
          undo: undoSpy
        } as unknown as EditCommand
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

      expect(gridStub.invalidate).toHaveBeenCalled();
    });
  });
});
