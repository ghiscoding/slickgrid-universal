import { GridOption, SlickAutoTooltips, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { AutoTooltipExtension } from '../autoTooltipExtension';
import { SharedService } from '../../services/shared.service';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn()
}));

describe('autoTooltipExtension', () => {
  jest.mock('slickgrid/plugins/slick.autotooltips', () => mockAddon);
  Slick.AutoTooltips = mockAddon;

  let extension: AutoTooltipExtension;
  let sharedService: SharedService;
  const gridOptionsMock = { enableAutoTooltip: true } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    extension = new AutoTooltipExtension(sharedService);
  });

  it('should return null when either the grid object or the grid options is missing', () => {
    const output = extension.register();
    expect(output).toBeNull();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    });

    it('should register the addon', () => {
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');

      const instance = extension.register();
      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(mockAddon).toHaveBeenCalledWith(undefined);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should dispose of the addon', () => {
      const instance = extension.register() as SlickAutoTooltips;
      const destroySpy = jest.spyOn(instance, 'destroy');

      extension.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should provide addon options and expect them to be called in the addon constructor', () => {
      const optionMock = { enableForCells: true, enableForHeaderCells: false, maxToolTipLength: 12 };
      const addonOptions = { ...gridOptionsMock, autoTooltipOptions: optionMock };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(addonOptions);

      extension.register();

      expect(mockAddon).toHaveBeenCalledWith(optionMock);
    });
  });
});
