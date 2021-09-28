import { DraggableGrouping, GridOption, SlickDraggableGrouping, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { DraggableGroupingExtension } from '../draggableGroupingExtension';
import { ExtensionUtility } from '../extensionUtility';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { PubSubService } from '../../services/pubSub.service';

declare const Slick: SlickNamespace;

const gridStub = {
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
} as unknown as SlickGrid;

const fnCallbacks = {};
const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: (eventName, fn) => fnCallbacks[eventName as string] = fn,
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;
jest.mock('../../services/pubSub.service', () => ({
  PubSubService: () => pubSubServiceStub
}));

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  clearDroppedGroups: jest.fn(),
  onGroupChanged: new Slick.Event(),
}));

describe('draggableGroupingExtension', () => {
  jest.mock('slickgrid/plugins/slick.draggablegrouping', () => mockAddon);
  Slick.DraggableGrouping = mockAddon;

  let extensionUtility: ExtensionUtility;
  let sharedService: SharedService;
  let extension: DraggableGroupingExtension;
  let translateService: TranslateServiceStub;
  const gridOptionsMock = {
    enableDraggableGrouping: true,
    draggableGrouping: {
      deleteIconCssClass: 'class',
      dropPlaceHolderText: 'test',
      groupIconCssClass: 'group-class',
      onExtensionRegistered: jest.fn(),
      onGroupChanged: () => { },
    }
  } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, translateService);
    extension = new DraggableGroupingExtension(extensionUtility, pubSubServiceStub, sharedService);
  });

  it('should return null after calling "create" method when the grid options is missing', () => {
    const output = extension.create(null as any);
    expect(output).toBeNull();
  });

  it('should return null after calling "register" method when either the grid object or the grid options is missing', () => {
    const output = extension.register();
    expect(output).toBeNull();
  });

  describe('registered addon', () => {
    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    });

    it('should register the addon', () => {
      const onRegisteredSpy = jest.spyOn(SharedService.prototype.gridOptions.draggableGrouping as DraggableGrouping, 'onExtensionRegistered');
      const pluginSpy = jest.spyOn(SharedService.prototype.slickGrid, 'registerPlugin');

      const instance = extension.create(gridOptionsMock) as SlickDraggableGrouping;
      const addon = extension.register();

      const addonInstance = extension.getAddonInstance();

      expect(instance).toBeTruthy();
      expect(instance).toEqual(addonInstance);
      expect(addon).not.toBeNull();
      expect(mockAddon).toHaveBeenCalledWith({
        deleteIconCssClass: 'class',
        dropPlaceHolderText: 'test',
        groupIconCssClass: 'group-class',
        onExtensionRegistered: expect.anything(),
        onGroupChanged: expect.anything(),
      });
      expect(onRegisteredSpy).toHaveBeenCalledWith(instance);
      expect(pluginSpy).toHaveBeenCalledWith(instance);
    });

    it('should dispose of the addon', () => {
      const instance = extension.create(gridOptionsMock) as SlickDraggableGrouping;
      const destroySpy = jest.spyOn(instance, 'destroy');

      extension.dispose();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should provide addon options and expect them to be called in the addon constructor', () => {
      const optionMock = {
        deleteIconCssClass: 'different-class',
        dropPlaceHolderText: 'different-test',
        groupIconCssClass: 'different-group-class',
      };
      const addonOptions = { ...gridOptionsMock, draggableGrouping: optionMock };
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(addonOptions);

      extension.create(addonOptions);
      extension.register();

      expect(mockAddon).toHaveBeenCalledWith(optionMock);
    });

    it('should call internal event handler subscribe and expect the "onGroupChanged" option to be called when addon notify is called', () => {
      const handlerSpy = jest.spyOn(extension.eventHandler, 'subscribe');
      const onColumnSpy = jest.spyOn(SharedService.prototype.gridOptions.draggableGrouping as DraggableGrouping, 'onGroupChanged');

      const instance = extension.create(gridOptionsMock) as SlickDraggableGrouping;
      extension.register();
      instance.onGroupChanged.notify({ caller: 'clear-all', groupColumns: [] }, new Slick.EventData(), gridStub);

      expect(handlerSpy).toHaveBeenCalledWith(
        { notify: expect.anything(), subscribe: expect.anything(), unsubscribe: expect.anything(), },
        expect.anything()
      );
      expect(onColumnSpy).toHaveBeenCalledWith(expect.anything(), { caller: 'clear-all', groupColumns: [] });
    });

    it('should expect that it call the Draggable Grouping "clearDroppedGroups" when Context Menu subscribed event triggers a clear grouping', () => {
      extension.create(gridOptionsMock) as SlickDraggableGrouping;
      const addon = extension.register();
      const clearSpy = jest.spyOn(addon, 'clearDroppedGroups');

      fnCallbacks['onContextMenuClearGrouping'](true);

      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
