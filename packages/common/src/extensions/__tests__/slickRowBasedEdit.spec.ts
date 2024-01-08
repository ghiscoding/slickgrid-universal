import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type {
  Column,
  EditCommand,
  GridOption,
  OnBeforeEditCellEventArgs,
  RowBasedEditOptions,
} from '../../interfaces/index';
import { SlickEvent, SlickGrid } from '../../core/index';
import { SlickRowBasedEdit } from '../slickRowBasedEdit';
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
    jest
      .spyOn(gridService, 'getAllColumnDefinitions')
      .mockReturnValue(mockColumns);

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
      jest
        .spyOn(gridService, 'getAllColumnDefinitions')
        .mockReturnValue(mockColumns);
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

      jest
        .spyOn(gridService, 'getAllColumnDefinitions')
        .mockReturnValue(mockColumns);

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

  it('should all row re-renderers', () => {
    gridStub.getOptions.mockReturnValue(optionsMock);
    gridStub.getData().onRowsOrCountChanged = 'onRowsOrCountChanged' as any;
    plugin.init(gridStub, gridService);

    gridStub.getData.mockReturnValue({
      getItem: () => mockColumns[1],
      getRowById: () => 0
    });

    jest
      .spyOn(gridService, 'getAllColumnDefinitions')
      .mockReturnValue(mockColumns);

    plugin.rowBasedEditCommandHandler(
      mockColumns[1],
      { id: 'test-column' } as Column,
      {} as EditCommand
    );

    plugin.rowBasedEditCommandHandler(
      mockColumns[1],
      { id: 'test-column' } as Column,
      { prevSerializedValue: 'foo', serializedValue: 'bar', execute: () => {} } as EditCommand
    );

    const call = (
      plugin.eventHandler.subscribe as jest.Mock<any, any>
    ).mock.calls.find((c) => c[0] === 'onRowsOrCountChanged')[1] as () => void;

    call();

    expect(gridStub.removeCellCssStyles).toHaveBeenCalledTimes(1);
  });
});
