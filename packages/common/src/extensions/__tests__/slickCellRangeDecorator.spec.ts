import 'jest-extended';

import type { GridOption } from '../../interfaces/index';
import { SlickCellRangeDecorator } from '../slickCellRangeDecorator';
import { SlickGrid } from '../../core';

jest.mock('flatpickr', () => { });

const gridStub = {
  getActiveCell: jest.fn(),
  getActiveCanvasNode: jest.fn(),
  getCellNodeBox: jest.fn(),
} as unknown as SlickGrid;

describe('CellRangeDecorator Plugin', () => {
  const mockEventCallback = () => { };
  let plugin: SlickCellRangeDecorator;
  const gridOptionsMock = {
    editable: true,
    enableCheckboxSelector: true,
    excelCopyBufferOptions: {
      onExtensionRegistered: jest.fn(),
      onCopyCells: mockEventCallback,
      onCopyCancelled: mockEventCallback,
      onPasteCells: mockEventCallback,
    }
  } as GridOption;

  beforeEach(() => {
    plugin = new SlickCellRangeDecorator(gridStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.addonOptions).toEqual({
      selectionCssClass: 'slick-range-decorator',
      selectionCss: {
        border: '2px dashed red',
        zIndex: '9999',
      },
      offset: { top: -1, left: -1, height: -2, width: -2 },
    })
  });

  it('should dispose of the addon', () => {
    plugin.init();
    const disposeSpy = jest.spyOn(plugin, 'destroy');
    const hideSpy = jest.spyOn(plugin, 'hide');

    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
    expect(hideSpy).toHaveBeenCalled();
  });

  it('should Show range when called and not return any new position when getCellNodeBox returns null', () => {
    const divContainer = document.createElement('div');
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divContainer);

    plugin = new SlickCellRangeDecorator(gridStub, { offset: { top: 20, left: 5, width: 12, height: 33 } });
    plugin.show({ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 });

    expect(plugin.addonElement!.style.top).toEqual('');
    expect(plugin.addonElement!.style.left).toEqual('');
    expect(plugin.addonElement!.style.height).toEqual('');
    expect(plugin.addonElement!.style.width).toEqual('');
  });

  it('should Show range when called and calculate new position when getCellNodeBox returns a cell position', () => {
    const divContainer = document.createElement('div');
    jest.spyOn(gridStub, 'getActiveCanvasNode').mockReturnValue(divContainer);
    jest.spyOn(gridStub, 'getCellNodeBox').mockReturnValue({ top: 25, left: 26, right: 27, bottom: 12 });

    plugin = new SlickCellRangeDecorator(gridStub, { offset: { top: 20, left: 5, width: 12, height: 33 } });
    plugin.show({ fromCell: 1, fromRow: 2, toCell: 3, toRow: 4 });

    expect(plugin.addonElement!.style.top).toEqual('45px');    // 25 + 20px
    expect(plugin.addonElement!.style.left).toEqual('31px');   // 26 + 5px
    expect(plugin.addonElement!.style.height).toEqual('20px'); // 12 - 25 + 33px
    expect(plugin.addonElement!.style.width).toEqual('13px');  // 27 - 26 + 12px
  });
});