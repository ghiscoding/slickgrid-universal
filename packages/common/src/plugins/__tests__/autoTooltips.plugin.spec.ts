import { GridOption, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { SharedService } from '../../services/shared.service';
import { AutoTooltipsPlugin } from '../autoTooltips.plugin';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  onHeaderMouseEnter: new Slick.Event(),
  onMouseEnter: new Slick.Event(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn()
}));

describe('AutoTooltip Plugin', () => {
  jest.mock('slickgrid/plugins/slick.autotooltips', () => mockAddon);
  Slick.AutoTooltips = mockAddon;

  let plugin: AutoTooltipsPlugin;
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
    plugin = new AutoTooltipsPlugin();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init(gridStub);

    expect(plugin.options).toEqual({
      enableForCells: true,
      enableForHeaderCells: false,
      maxToolTipLength: undefined,
      replaceExisting: true
    });
  });

  // describe('registered addon', () => {
  //   beforeEach(() => {
  //     jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
  //     jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
  //   });

  //   it('should ', () => {

  //   });
  // });
});
