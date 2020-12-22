import { GridOption, SlickGrid, SlickNamespace, SlickRowSelectionModel } from '../../interfaces/index';
import { RowSelectionExtension } from '../rowSelectionExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  setSelectionModel: jest.fn(),
} as unknown as SlickGrid;

const mockAddon = jest.fn().mockImplementation(() => ({
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn()
}));

describe('rowSelectionExtension', () => {
  jest.mock('slickgrid/plugins/slick.rowselectionmodel', () => mockAddon);
  Slick.RowSelectionModel = mockAddon;

  let extension: RowSelectionExtension;
  let extensionUtility: ExtensionUtility;
  let sharedService: SharedService;
  let translateService: TranslateServiceStub;
  const gridOptionsMock = { enableRowSelection: true } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, translateService);
    extension = new RowSelectionExtension(sharedService);
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
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSelectionModel');

      const instance = extension.register() as SlickRowSelectionModel;
      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(mockAddon).toHaveBeenCalledWith(undefined);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should dispose of the addon', () => {
      const instance = extension.register() as SlickRowSelectionModel;
      const destroySpy = jest.spyOn(instance, 'destroy');

      extension.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should provide addon options and expect them to be called in the addon constructor', () => {
      const optionMock = { selectActiveRow: true };
      const addonOptions = { ...gridOptionsMock, rowSelectionOptions: optionMock };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(addonOptions);

      extension.register();

      expect(mockAddon).toHaveBeenCalledWith(optionMock);
    });
  });
});
