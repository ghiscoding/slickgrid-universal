import { GroupItemMetaProviderExtension } from '../groupItemMetaProviderExtension';
import { SharedService } from '../../services/shared.service';
import { SlickGrid } from '../../interfaces/slickGrid.interface';
import { SlickGroupItemMetadataProvider, SlickNamespace } from '../../interfaces/index';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn()
}));

jest.mock('slickgrid/slick.groupitemmetadataprovider', () => mockAddon);
Slick.Data.GroupItemMetadataProvider = mockAddon;

describe('groupItemMetaProviderExtension', () => {
  let extension: GroupItemMetaProviderExtension;
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
    sharedService.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
    extension = new GroupItemMetaProviderExtension(sharedService);
  });

  it('should return null when either the grid object or the grid options is missing', () => {
    const output = extension.register();
    expect(output).toBeNull();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    });

    it('should register the addon', () => {
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');

      const instance = extension.register();
      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(sharedService.groupItemMetadataProvider).toEqual(instance);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should dispose of the addon', () => {
      const instance = extension.register() as SlickGroupItemMetadataProvider;
      const destroySpy = jest.spyOn(instance, 'destroy');

      extension.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
