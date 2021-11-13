import { DelimiterType, FileType } from '../../enums/index';
import { ContextMenu, Column, ElementPosition, GridOption, MenuCommandItem, MenuOptionItem, SlickDataView, SlickGrid, SlickNamespace, } from '../../interfaces/index';
import { BackendUtilityService, deepCopy, ExcelExportService, PubSubService, SharedService, TextExportService, TreeDataService, } from '../../services/index';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { Formatters } from '../../formatters';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickContextMenu } from '../slickContextMenu';

declare const Slick: SlickNamespace;

const removeExtraSpaces = (textS) => `${textS}`.replace(/[\n\r]\s+/g, '');

const commandItemsMock = [
  { command: 'command2', title: 'Command 2', positionOrder: 62, },
  { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
  { divider: true, command: '', positionOrder: 63 },
  {
    command: 'delete-row', title: 'Delete Row', positionOrder: 64,
    iconCssClass: 'mdi mdi-close', cssClass: 'red', textCssClass: 'bold',
  },
  'divider',
] as MenuCommandItem[];
const optionItemsMock = [
  { option: 'option2', title: 'Option 2', positionOrder: 62, },
  { option: 'option1', title: 'Option 1', cssClass: 'purple', positionOrder: 61 },
  { divider: true, option: '', positionOrder: 63 },
  {
    option: 'delete-row', title: 'Delete Row', positionOrder: 64,
    iconCssClass: 'mdi mdi-checked', cssClass: 'sky', textCssClass: 'underline',
  },
  'divider',
] as MenuOptionItem[];

const columnsMock: Column[] = [
  { id: 'firstName', field: 'firstName', name: 'First Name', width: 100, },
  { id: 'lastName', field: 'lastName', name: 'Last Name', width: 75, nameKey: 'LAST_NAME', sortable: true, filterable: true },
  { id: 'age', field: 'age', name: 'Age', width: 50, },
  { id: 'action', field: 'action', name: 'Action', width: 50, },
  { id: 'action2', field: 'action2', name: 'Action2', width: 50, },
];

const gridOptionsMock = {
  enableContextMenu: true,
  enableTranslate: true,
  backendServiceApi: {
    service: {
      buildQuery: jest.fn(),
    },
    internalPostProcess: jest.fn(),
    preProcess: jest.fn(),
    process: jest.fn(),
    postProcess: jest.fn(),
  },
  contextMenu: {
    autoAdjustDrop: true,
    autoAlignSide: true,
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideCopyCellValueCommand: true,
    hideMenuOnScroll: true,
    maxHeight: 'none',
    width: 175,
    commandItems: [],
    optionItems: [],
    onExtensionRegistered: jest.fn(),
    onCommand: () => { },
    onAfterMenuShow: () => { },
    onBeforeMenuShow: () => { },
    onBeforeMenuClose: () => { },
    onOptionSelected: () => { },
  },
} as unknown as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  autosizeColumns: jest.fn(),
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getContainerNode: jest.fn(),
  getDataItem: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getGridPosition: jest.fn(),
  getOptions: () => gridOptionsMock,
  getUID: () => 'slickgrid12345',
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
  updateColumnHeader: jest.fn(),
  onClick: new Slick.Event(),
  onContextMenu: new Slick.Event(),
  onScroll: new Slick.Event(),
  onSort: new Slick.Event(),
} as unknown as SlickGrid;

const dataViewStub = {
  collapseAllGroups: jest.fn(),
  expandAllGroups: jest.fn(),
  refresh: jest.fn(),
  getItems: jest.fn(),
  getGrouping: jest.fn(),
  setGrouping: jest.fn(),
  setItems: jest.fn(),
} as unknown as SlickDataView;

const excelExportServiceStub = {
  className: 'ExcelExportService',
  exportToExcel: jest.fn(),
} as unknown as ExcelExportService;

const exportServiceStub = {
  className: 'TextExportService',
  exportToFile: jest.fn(),
} as unknown as TextExportService;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

const treeDataServiceStub = {
  convertFlatParentChildToTreeDataset: jest.fn(),
  init: jest.fn(),
  convertFlatParentChildToTreeDatasetAndSort: jest.fn(),
  dispose: jest.fn(),
  handleOnCellClick: jest.fn(),
  toggleTreeDataCollapse: jest.fn(),
} as unknown as TreeDataService;

describe('ContextMenu Plugin', () => {
  const consoleWarnSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let plugin: SlickContextMenu;
  let sharedService: SharedService;

  beforeEach(() => {
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    plugin = new SlickContextMenu(extensionUtility, pubSubServiceStub, sharedService, treeDataServiceStub);
  });

  afterEach(() => {
    plugin?.dispose();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should dispose of the addon', () => {
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    plugin.destroy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init();

    expect(plugin.addonOptions).toEqual({
      autoAdjustDrop: true,     // dropup/dropdown
      autoAlignSide: true,      // left/right
      autoAdjustDropOffset: 0,
      autoAlignSideOffset: 0,
      commandItems: [],
      hideMenuOnScroll: false,
      maxHeight: 'none',
      width: 'auto',
      optionShownOverColumnIds: [],
      commandShownOverColumnIds: [],
    });
  });

  it('should be able to change Context Menu options', () => {
    plugin.init();
    plugin.addonOptions = {
      commandTitle: 'test',
      autoAdjustDrop: true,
    };

    expect(plugin.addonOptions).toEqual({
      commandTitle: 'test',
      autoAdjustDrop: true,
    });
  });

  describe('plugins - Context Menu', () => {
    let gridContainerDiv: HTMLDivElement;
    let contextMenuDiv: HTMLDivElement;
    let eventData: any;
    let slickCellElm: HTMLDivElement;

    beforeEach(() => {
      slickCellElm = document.createElement('div');
      slickCellElm.className = 'slick-cell';
      eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      eventData.target = slickCellElm;

      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      gridOptionsMock.contextMenu.commandItems = deepCopy(commandItemsMock);
      delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).action;
      delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride;
      delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride;
      contextMenuDiv = document.createElement('div');
      contextMenuDiv.className = 'slick-header-column';
      gridContainerDiv = document.createElement('div');
      gridContainerDiv.className = 'slickgrid-container';
      jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
      jest.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: 1 });
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 33 });
    });

    afterEach(() => {
      plugin.dispose();
      jest.clearAllMocks();
    });

    it('should open the Context Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
      const hideMenuSpy = jest.spyOn(plugin, 'hideMenu');
      const closeSpy = jest.spyOn(plugin, 'closeMenu');
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true, });

      plugin.dispose();
      plugin.init();
      gridStub.onContextMenu.notify(null, eventData, gridStub);

      let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
      expect(contextMenuElm).toBeTruthy();

      document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));
      contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

      expect(contextMenuElm).toBeNull();
      expect(closeSpy).toHaveBeenCalled();
      expect(hideMenuSpy).toHaveBeenCalled();
    });

    it('should "autoAlignSide" and expect menu to aligned left with a calculate offset when showing menu', () => {
      jest.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      plugin.dispose();
      plugin.init({ autoAdjustDrop: true, autoAlignSide: true, dropDirection: 'top', dropSide: 'left' });

      const actionBtnElm = document.createElement('button');
      slickCellElm.appendChild(actionBtnElm);
      const eventDataCopy = deepCopy(eventData);
      Object.defineProperty(actionBtnElm, 'clientWidth', { writable: true, configurable: true, value: 275 });
      Object.defineProperty(slickCellElm, 'clientWidth', { writable: true, configurable: true, value: 300 });
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
      Object.defineProperty(contextMenuElm, 'clientHeight', { writable: true, configurable: true, value: 300 });
      Object.defineProperty(plugin.menuElement, 'clientWidth', { writable: true, configurable: true, value: 350 });
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      expect(contextMenuElm.classList.contains('dropup')).toBeTruthy();
      expect(contextMenuElm.classList.contains('dropleft')).toBeTruthy();
    });

    describe('with Command Items', () => {
      beforeEach(() => {
        gridOptionsMock.contextMenu.hideCopyCellValueCommand = true;
        gridOptionsMock.contextMenu.commandItems = deepCopy(commandItemsMock);
      });

      it('should not populate and automatically return when the Context Menu item "commandItems" array of the context menu is undefined', () => {
        plugin.dispose();
        plugin.init();
        (gridOptionsMock.contextMenu.commandItems) = undefined as any;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;

        expect(contextMenuElm.classList.contains('dropdown'));
        expect(contextMenuElm.classList.contains('dropright'));
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div style="display: block; width: auto; max-height: none; top: 0px; left: 0px;" class="slick-context-menu slickgrid12345 dropdown dropright" aria-expanded="true">
            <button class="close" type="button" data-dismiss="slick-context-menu" aria-label="Close">
              <span class="close" aria-hidden="true">×</span>
            </button>
            <div class="slick-context-menu-command-list">
              <li class="slick-context-menu-item orange" data-command="command1">
                <div class="slick-context-menu-icon"></div>
                <span class="slick-context-menu-content">Command 1</span>
              </li>
              <li class="slick-context-menu-item" data-command="command2">
                <div class="slick-context-menu-icon"></div>
                <span class="slick-context-menu-content">Command 2</span>
              </li>
              <li class="slick-context-menu-item slick-context-menu-item-divider"></li>
              <li class="slick-context-menu-item red" data-command="delete-row">
                <div class="slick-context-menu-icon mdi mdi-close"></div>
                <span class="slick-context-menu-content bold">Delete Row</span>
              </li>
              <li class="slick-context-menu-item slick-context-menu-item-divider"></li>
          </div>
        </div>`));
      });

      it('should NOT expect a Context Menu to be created the column is not found in "commandShownOverColumnIds"', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), commandShownOverColumnIds: ['Age'] });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => undefined;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => undefined;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelectorAll('.slick-context-menu-item')[1] as HTMLDivElement;
        const commandItemElm3 = commandListElm.querySelectorAll('.slick-context-menu-item')[2] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;
        const commandLabelElm3 = commandItemElm3.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const commandIconElm3 = commandItemElm3.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(4);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-context-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(commandItemElm2.classList.contains('slick-context-menu-item-divider')).toBeTruthy();
        expect(commandItemElm2.innerHTML).toBe('');
        expect(commandIconElm3.classList.contains('mdi-close')).toBeTruthy();
        expect(commandLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => false;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(4);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-context-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).not.toBeTruthy();
      });

      it('should create a Context Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-context-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).toBeTruthy();
      });

      it('should create a Context Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).disabled = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-context-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Context Menu and expect button to be disabled when command property is hidden', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).hidden = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-context-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Context Menu with an icon having a background image when property "iconImage" is filled', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).iconImage = '/images/some-image.png';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.style.backgroundImage).toBe('url(/images/some-image.png)');
        expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "iconImage" property of a Context Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
      });

      it('should create a Context Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).iconCssClass = 'bold red';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.classList.contains('bold')).toBeTruthy();
        expect(commandIconElm2.classList.contains('red')).toBeTruthy();
      });

      it('should create a Context Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).title = 'Help';
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Help');
        expect(commandContentElm2.classList.contains('italic')).toBeTruthy();
        expect(commandContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Context Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).tooltip = 'some tooltip';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.title).toBe('some tooltip');
      });

      it('should create a Context Menu item with a title for the command list when "commandTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ commandTitle: 'The Commands!', commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).title = 'Help';
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandListTitleElm.textContent).toBe('The Commands!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init({ commandTitleKey: 'COMMANDS', commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).command = 'help';
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).titleKey = 'HELP';
        translateService.use('fr');
        plugin.translateContextMenu();

        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm = commandListElm.querySelector('[data-command="help"]') as HTMLDivElement;
        const commandContentElm = commandItemElm.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(commandListTitleElm.textContent).toBe('Commandes');
        expect(commandContentElm.textContent).toBe('Aide');
      });

      it('should create a Context Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = jest.spyOn(plugin, 'closeMenu');

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        closeBtnElm.dispatchEvent(new Event('click'));
        contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
        expect(closeBtnElm).toBeTruthy();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuClose" returns false', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(false);
        const hideSpy = jest.spyOn(plugin, 'hideMenu');

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuClose: onBeforeSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);
        plugin.closeMenu(new Event('click') as any, {} as any);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(hideSpy).not.toHaveBeenCalled();
      });

      it('should not create a Context Menu element then call "closeMenu" and expect "hideMenu" to be called when "onBeforeMenuClose" returns true', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(true);
        const hideSpy = jest.spyOn(plugin, 'hideMenu');

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuClose: onBeforeSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);
        plugin.closeMenu(new Event('click') as any, {} as any);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(hideSpy).toHaveBeenCalled();
      });

      it('should NOT create a Context Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuShow" returns false', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuShow: onBeforeSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
        expect(onBeforeSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuShow" returns true', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(true);
        const onAfterSpy = jest.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuClose: () => true, onBeforeMenuShow: onBeforeSpy, onAfterMenuShow: onAfterSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(onAfterSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).action = actionMock;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]').dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the "onCommand" handler to be executed when defined', () => {
        const onCommandMock = jest.fn();

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);
        plugin.addonOptions.onCommand = onCommandMock;

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]').dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(onCommandMock).toHaveBeenCalled();
      });

      it('should not populate a Context Menu when "menuUsabilityOverride" is defined and returns False', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), menuUsabilityOverride: () => false });
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        expect(plugin.menuElement).toBeFalsy();
      });
    });

    describe('with Custom Commands List', () => {
      beforeEach(() => {
        slickCellElm = document.createElement('div');
        slickCellElm.className = 'slick-cell';
        eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
        eventData.target = slickCellElm;

        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        gridOptionsMock.contextMenu.commandItems = deepCopy(commandItemsMock);
        delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).action;
        delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride;
        delete (gridOptionsMock.contextMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride;
        contextMenuDiv = document.createElement('div');
        contextMenuDiv.className = 'slick-header-column';
        gridContainerDiv = document.createElement('div');
        gridContainerDiv.className = 'slickgrid-container';
        jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
        jest.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
        jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: 1 });
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 33 });

        if (window.document) {
          window.document.createRange = () => ({
            selectNodeContents: () => { },
            setStart: () => { },
            setEnd: () => { },
            commonAncestorContainer: { nodeName: 'BODY', ownerDocument: document },
          } as any);

          window.document.execCommand = () => (true);

          window.getSelection = () => ({
            removeAllRanges: () => { },
            addRange: () => { },
          } as any);
        }
      });

      afterEach(() => {
        plugin.dispose();
        jest.clearAllMocks();
      });

      // -- Copy to Clipboard -- //
      it('should populate menuCommandItems with Copy cell action when "hideCopyCellValueCommand" is disabled', () => {
        const execSpy = jest.spyOn(window.document, 'execCommand');
        gridOptionsMock.contextMenu.hideCopyCellValueCommand = false;
        plugin.dispose();
        plugin.init({ commandItems: [], hideCopyCellValueCommand: false });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelector('.slick-context-menu-item') as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(1);
        expect(commandItemElm1.classList.contains('slick-context-menu-item-disabled')).toBeFalsy();
        expect(commandIconElm1.classList.contains('fa-clone')).toBeTruthy();
        expect(commandLabelElm1.textContent).toBe('Copy');

        commandItemElm1.dispatchEvent(new CustomEvent('click'));

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should call "copyToClipboard", WITH export formatter, when the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, exportOptions: { exportWithFormatter: true } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', formatter: Formatters.uppercase } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        plugin.dispose();
        plugin.init({ commandItems: [] });
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'JOHN');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined when the command triggered is "copy"', () => {
        const firstNameColIdx = 0;
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        columnsMock[firstNameColIdx] = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: firstNameColIdx, row: 1 });
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        plugin.dispose();
        plugin.init({ commandItems: [], hideCopyCellValueCommand: false });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-context-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelector('.slick-context-menu-item') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-context-menu-item').length).toBe(1);
        expect(commandItemElm1.classList.contains('slick-context-menu-item-disabled')).toBeFalsy();

        commandItemElm1.dispatchEvent(new CustomEvent('click'));
        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined when the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined with dot notation the command triggered is "copy"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: '\u034f\u034fJohn', lastName: '\u034f\u034f Doe', age: 50 } };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const execSpy = jest.spyOn(window.document, 'execCommand');
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John'
        });

        expect(execSpy).toHaveBeenCalledWith('copy', false, 'Doe');
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when a value to copy is found in the dataContext object', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: '·\u034f ⮞   Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when a value to copy is an empty string', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: '', lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when a value to copy is null', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return False when the dataContext object does not contain the field property specified', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(false);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when there is a "queryFieldNameGetterFn" which itself returns a value', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when there is a "queryFieldNameGetterFn" and a dot notation field which does return a value', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: false } } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'user.firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: null, lastName: 'Doe', age: 50 } };
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'copy') as MenuCommandItem;
        const isCommandUsable = menuItemCommand.itemUsabilityOverride!({
          cell: 2,
          row: 2,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
        });

        expect(isCommandUsable).toBe(true);
      });

      // -- Export to CSV -- //
      it('should call "exportToExcel" and expect an error thrown when ExcelExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-excel') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Context Menu.');
      });

      it('should call "exportToFile" with CSV and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-csv') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.');
      });

      it('should call "exportToFile" with Text Delimited and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-text-delimited') as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any))
          .toThrow('[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.');
      });

      it('should call "exportToExcel" when the command triggered is "export-excel"', () => {
        const excelExportSpy = jest.spyOn(excelExportServiceStub, 'exportToExcel');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: true, enableTextExport: false, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([excelExportServiceStub]);
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'export-excel' }] });// add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-excel') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(excelExportSpy).toHaveBeenCalled();
      });

      it('should call "exportToFile" with CSV set when the command triggered is "export-csv"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'export-csv' }], hideExportCsvCommand: false });// add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-csv') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.comma,
          format: FileType.csv,
        });
      });

      it('should call "exportToFile" with Text Delimited set when the command triggered is "export-text-delimited"', () => {
        const exportSpy = jest.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = { ...gridOptionsMock, enableExcelExport: false, enableTextExport: true, contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        jest.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        plugin.init({ commandItems: [{ command: 'export-text-delimited' }] });// add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'export-text-delimited') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: DelimiterType.tab,
          format: FileType.txt,
        });
      });

      it('should call "setGrouping" from the DataView when Grouping is enabled and the command triggered is "clear-grouping"', () => {
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'setGrouping');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'clear-grouping' }] });// add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'clear-grouping', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith([]);
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuClearGrouping');
      });

      it('should call "collapseAllGroups" from the DataView when Grouping is enabled and the command triggered is "collapse-all-groups"', () => {
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'collapseAllGroups');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'collapse-all-groups' }] });// add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuCollapseAllGroups');
      });

      it('should call "collapseAllGroups" from the DataView when Tree Data is enabled and the command triggered is "collapse-all-groups"', () => {
        jest.spyOn(SharedService.prototype.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const treeDataSpy = jest.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });
        plugin.init();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(true);
      });

      it('should call "expandAllGroups" from the DataView when Grouping is enabled and the command triggered is "expand-all-groups"', () => {
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'expandAllGroups');
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'expand-all-groups' }] }); // add fake command to test with .some()
        plugin.init();// calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(dataviewSpy).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuExpandAllGroups');
      });

      it('should call "expandAllGroups" from the DataView when Tree Data is enabled and the command triggered is "expand-all-groups"', () => {
        const treeDataSpy = jest.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        jest.spyOn(SharedService.prototype.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(false);
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return False when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'getGrouping').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isClearCommandUsable).toBe(false);
        expect(isCollapseCommandUsable).toBe(false);
        expect(isExpandCommandUsable).toBe(false);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return True when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = jest.spyOn(SharedService.prototype.dataView, 'getGrouping').mockReturnValue([{ collapsed: true }]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'clear-grouping') as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isClearCommandUsable).toBe(true);
        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return Tree (collapse, expand) at all time even when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return True (collapse, expand) when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'collapse-all-groups') as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find((item: MenuCommandItem) => item.command === 'expand-all-groups') as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub, } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });
    });

    describe('with Options Items', () => {
      beforeEach(() => {
        gridOptionsMock.contextMenu.hideCopyCellValueCommand = true;
        gridOptionsMock.contextMenu.optionItems = undefined;
      });

      it('should not populate and automatically return when the Context Menu item "optionItems" array of the context menu is undefined', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), onAfterMenuShow: undefined });
        (gridOptionsMock.contextMenu.optionItems) = undefined;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should create a Context Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div style="display: block; width: auto; max-height: none; top: 0px; left: 0px;" class="slick-context-menu slickgrid12345 dropdown dropright" aria-expanded="true">
            <button class="close" type="button" data-dismiss="slick-context-menu" aria-label="Close">
              <span class="close" aria-hidden="true">×</span>
            </button>
            <div class="slick-context-menu-option-list">
              <li class="slick-context-menu-item purple" data-option="option1">
                <div class="slick-context-menu-icon"></div>
                <span class="slick-context-menu-content">Option 1</span>
              </li>
              <li class="slick-context-menu-item" data-option="option2">
                <div class="slick-context-menu-icon"></div>
                <span class="slick-context-menu-content">Option 2</span>
              </li>
              <li class="slick-context-menu-item slick-context-menu-item-divider"></li>
              <li class="slick-context-menu-item sky" data-option="delete-row">
                <div class="slick-context-menu-icon mdi mdi-checked"></div>
                <span class="slick-context-menu-content underline">Delete Row</span>
              </li>
              <li class="slick-context-menu-item slick-context-menu-item-divider"></li>
          </div>
        </div>`));
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => undefined;
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => undefined;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelectorAll('.slick-context-menu-item')[1] as HTMLDivElement;
        const optionItemElm3 = optionListElm.querySelectorAll('.slick-context-menu-item')[2] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;
        const optionLabelElm3 = optionItemElm3.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const optionIconElm3 = optionItemElm3.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(4);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-context-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(optionItemElm2.classList.contains('slick-context-menu-item-divider')).toBeTruthy();
        expect(optionItemElm2.innerHTML).toBe('');
        expect(optionIconElm3.classList.contains('mdi-checked')).toBeTruthy();
        expect(optionLabelElm3.textContent).toBe('Delete Row');
      });

      it('should NOT expect a Context Menu to be created the column is not found in "commandShownOverColumnIds"', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), optionShownOverColumnIds: ['Age'] });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of options defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => false;
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(4);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-context-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).not.toBeTruthy();
      });

      it('should create a Context Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-context-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-context-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-context-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).toBeTruthy();
      });

      it('should create a Context Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).disabled = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-context-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Context Menu and expect button to be disabled when option property is hidden', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).hidden = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-context-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Context Menu with an icon having a background image when property "iconImage" is filled', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).iconImage = '/images/some-image.png';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.style.backgroundImage).toBe('url(/images/some-image.png)');
        expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "iconImage" property of a Context Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
      });

      it('should create a Context Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).iconCssClass = 'underline sky';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-context-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.classList.contains('underline')).toBeTruthy();
        expect(optionIconElm2.classList.contains('sky')).toBeTruthy();
      });

      it('should create a Context Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).title = 'Help';
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Help');
        expect(optionContentElm2.classList.contains('italic')).toBeTruthy();
        expect(optionContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Context Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).tooltip = 'some tooltip';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-context-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.title).toBe('some tooltip');
      });

      it('should create a Context Menu item with a title for the option list when "optionTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        plugin.setOptions({ optionTitle: 'The Options!' });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).title = 'Help';
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionListTitleElm.textContent).toBe('The Options!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu as ContextMenu).optionTitleKey = 'OPTIONS_LIST';
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).option = 'none';
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).titleKey = 'NONE';
        translateService.use('fr');
        plugin.translateContextMenu();

        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        const optionItemElm = optionListElm.querySelector('[data-option="none"]') as HTMLDivElement;
        const optionContentElm = optionItemElm.querySelector('.slick-context-menu-content') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(optionListTitleElm.textContent).toBe(`Liste d'options`);
        expect(optionContentElm.textContent).toBe(`Aucun`);
      });

      it('should create a Context Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = jest.spyOn(plugin, 'closeMenu');

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        closeBtnElm.dispatchEvent(new Event('click'));
        contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
        expect(closeBtnElm).toBeTruthy();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu.optionItems[1] as MenuOptionItem).action = actionMock;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the "onOptionSelected" handler to be executed when defined', () => {
        const onOptionSelectedMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), onOptionSelected: onOptionSelectedMock });
        // plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(onOptionSelectedMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and NOT expect the "onOptionSelected" handler to be executed when "commitCurrentEdit" returns false', () => {
        const onOptionSelectedMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(false);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-context-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-context-menu-item').length).toBe(5);
        expect(onOptionSelectedMock).not.toHaveBeenCalled();
      });
    });
  });
});