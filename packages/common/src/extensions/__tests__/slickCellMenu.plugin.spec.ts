import { CellMenu, Column, ElementPosition, GridOption, MenuCommandItem, MenuOptionItem, SlickDataView, SlickGrid, SlickNamespace, } from '../../interfaces/index';
import { SlickCellMenu } from '../slickCellMenu';
import { BackendUtilityService, deepCopy, PubSubService, SharedService, } from '../../services';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;

const removeExtraSpaces = (textS) => `${textS}`.replace(/[\n\r]\s+/g, '');

const gridOptionsMock = {
  enableAutoSizeColumns: true,
  enableColumnResizeOnDoubleClick: true,
  enableCellMenu: true,
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
  cellMenu: {
    autoAdjustDrop: true,
    autoAlignSide: true,
    autoAdjustDropOffset: 0,
    autoAlignSideOffset: 0,
    hideMenuOnScroll: true,
    maxHeight: 'none',
    width: 175,
    onExtensionRegistered: jest.fn(),
    onCommand: () => { },
    onAfterMenuShow: () => { },
    onBeforeMenuShow: () => { },
    onBeforeMenuClose: () => { },
    onOptionSelected: () => { },
  },
  multiColumnSort: true,
  pagination: {
    totalItems: 0
  },
  showHeaderRow: false,
  showTopPanel: false,
  showPreHeaderPanel: false
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
  onScroll: new Slick.Event(),
  onSort: new Slick.Event(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

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
const cellMenuMockWithCommands = { commandItems: deepCopy(commandItemsMock) } as CellMenu;
const cellMenuMockWithOptions = { optionItems: deepCopy(optionItemsMock) } as CellMenu;

const columnsMock: Column[] = [
  { id: 'firstName', field: 'firstName', name: 'First Name', width: 100, },
  { id: 'lastName', field: 'lastName', name: 'Last Name', width: 75, nameKey: 'LAST_NAME', sortable: true, filterable: true },
  { id: 'age', field: 'age', name: 'Age', width: 50, },
  { id: 'action', field: 'action', name: 'Action', width: 50, cellMenu: cellMenuMockWithCommands, },
  { id: 'action2', field: 'action2', name: 'Action2', width: 50, cellMenu: cellMenuMockWithOptions, },
];

describe('CellMenu Plugin', () => {
  const consoleWarnSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let plugin: SlickCellMenu;
  let sharedService: SharedService;

  beforeEach(() => {
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    jest.spyOn(SharedService.prototype, 'allColumns', 'get').mockReturnValue(columnsMock);
    jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 2));
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    plugin = new SlickCellMenu(extensionUtility, pubSubServiceStub, sharedService);
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
      hideMenuOnScroll: true,
      maxHeight: 'none',
      width: 'auto',
    });
  });

  it('should be able to change Cell Menu options', () => {
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

  describe('plugins - Cell Menu', () => {
    let gridContainerDiv: HTMLDivElement;
    let cellMenuDiv: HTMLDivElement;
    let eventData: any;
    let slickCellElm: HTMLDivElement;

    beforeEach(() => {
      slickCellElm = document.createElement('div');
      slickCellElm.className = 'slick-cell';
      eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      eventData.target = slickCellElm;

      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      columnsMock[3].cellMenu.commandItems = deepCopy(commandItemsMock);
      delete (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).action;
      delete (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride;
      delete (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride;
      cellMenuDiv = document.createElement('div');
      cellMenuDiv.className = 'slick-header-column';
      gridContainerDiv = document.createElement('div');
      gridContainerDiv.className = 'slickgrid-container';
      jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
      jest.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 3, row: 1 });
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 33 });
    });

    afterEach(() => {
      plugin.dispose();
      jest.clearAllMocks();
    });

    it('should open the Cell Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
      const hideMenuSpy = jest.spyOn(plugin, 'hideMenu');
      const closeSpy = jest.spyOn(plugin, 'closeMenu');
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true, });

      plugin.dispose();
      plugin.init();
      gridStub.onClick.notify(null, eventData, gridStub);

      let cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
      expect(cellMenuElm).toBeTruthy();

      document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));
      cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

      expect(cellMenuElm).toBeNull();
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
      gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventDataCopy as any, gridStub);

      let cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
      Object.defineProperty(cellMenuElm, 'clientHeight', { writable: true, configurable: true, value: 300 });
      Object.defineProperty(plugin.menuElement, 'clientWidth', { writable: true, configurable: true, value: 350 });
      gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventDataCopy as any, gridStub);

      expect(cellMenuElm.classList.contains('dropup')).toBeTruthy();
      expect(cellMenuElm.classList.contains('dropleft')).toBeTruthy();
    });

    describe('with Command Items', () => {
      it('should not populate and automatically return when the Cell Menu item "commandItems" array of the cell menu is undefined', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems) = undefined as any;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
      });

      it('should create a Cell Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;

        expect(cellMenuElm.classList.contains('dropdown'));
        expect(cellMenuElm.classList.contains('dropright'));
        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div style="display: block; width: auto; max-height: none; top: 0px; left: 0px;" class="slick-cell-menu slickgrid12345 dropdown dropright" aria-expanded="true">
            <button class="close" type="button" data-dismiss="slick-cell-menu" aria-label="Close">
              <span class="close" aria-hidden="true">×</span>
            </button>
            <div class="slick-cell-menu-command-list">
              <li class="slick-cell-menu-item orange" data-command="command1">
                <div class="slick-cell-menu-icon"></div>
                <span class="slick-cell-menu-content">Command 1</span>
              </li>
              <li class="slick-cell-menu-item" data-command="command2">
                <div class="slick-cell-menu-icon"></div>
                <span class="slick-cell-menu-content">Command 2</span>
              </li>
              <li class="slick-cell-menu-item slick-cell-menu-item-divider"></li>
              <li class="slick-cell-menu-item red" data-command="delete-row">
                <div class="slick-cell-menu-icon mdi mdi-close"></div>
                <span class="slick-cell-menu-content bold">Delete Row</span>
              </li>
              <li class="slick-cell-menu-item slick-cell-menu-item-divider"></li>
          </div>
        </div>`));
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => undefined;
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => undefined;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelectorAll('.slick-cell-menu-item')[1] as HTMLDivElement;
        const commandItemElm3 = commandListElm.querySelectorAll('.slick-cell-menu-item')[2] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;
        const commandLabelElm3 = commandItemElm3.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const commandIconElm3 = commandItemElm3.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(4);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-cell-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(commandItemElm2.classList.contains('slick-cell-menu-item-divider')).toBeTruthy();
        expect(commandItemElm2.innerHTML).toBe('');
        expect(commandIconElm3.classList.contains('mdi-close')).toBeTruthy();
        expect(commandLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => false;
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(4);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-cell-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).not.toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-cell-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).disabled = true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-cell-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Cell Menu and expect button to be disabled when command property is hidden', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).hidden = true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-cell-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Cell Menu with an icon having a background image when property "iconImage" is filled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).iconImage = '/images/some-image.png';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.style.backgroundImage).toBe('url(/images/some-image.png)');
        expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "iconImage" property of a Cell Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
      });

      it('should create a Cell Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).iconCssClass = 'bold red';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.classList.contains('bold')).toBeTruthy();
        expect(commandIconElm2.classList.contains('red')).toBeTruthy();
      });

      it('should create a Cell Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).title = 'Help';
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Help');
        expect(commandContentElm2.classList.contains('italic')).toBeTruthy();
        expect(commandContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Cell Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).tooltip = 'some tooltip';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.title).toBe('some tooltip');
      });

      it('should create a Cell Menu item with a title for the command list when "commandTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ commandTitle: 'The Commands!' });
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).title = 'Help';
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandListTitleElm.textContent).toBe('The Commands!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu as CellMenu).commandTitleKey = 'COMMANDS';
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).command = 'help';
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).titleKey = 'HELP';
        translateService.use('fr');
        plugin.translateCellMenu();

        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        const commandItemElm = commandListElm.querySelector('[data-command="help"]') as HTMLDivElement;
        const commandContentElm = commandItemElm.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(commandListTitleElm.textContent).toBe('Commandes');
        expect(commandContentElm.textContent).toBe('Aide');
      });

      it('should create a Cell Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = jest.spyOn(plugin, 'closeMenu');

        plugin.dispose();
        plugin.init();
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        let cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        closeBtnElm.dispatchEvent(new Event('click'));
        cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
        expect(closeBtnElm).toBeTruthy();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuClose" returns false', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(false);
        const hideSpy = jest.spyOn(plugin, 'hideMenu');

        plugin.dispose();
        plugin.init({ onBeforeMenuClose: onBeforeSpy });
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);
        plugin.closeMenu(new Event('click') as any, {} as any);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(hideSpy).not.toHaveBeenCalled();
      });

      it('should not create a Cell Menu element then call "closeMenu" and expect "hideMenu" to be called when "onBeforeMenuClose" returns true', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(true);
        const hideSpy = jest.spyOn(plugin, 'hideMenu');

        plugin.dispose();
        plugin.init({ onBeforeMenuClose: onBeforeSpy });
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);
        plugin.closeMenu(new Event('click') as any, {} as any);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(hideSpy).toHaveBeenCalled();
      });

      it('should NOT create a Cell Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuShow" returns false', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ onBeforeMenuShow: onBeforeSpy });
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
        expect(onBeforeSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuShow" returns true', () => {
        const onBeforeSpy = jest.fn().mockReturnValue(true);
        const onAfterSpy = jest.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ onBeforeMenuClose: () => true, onBeforeMenuShow: onBeforeSpy, onAfterMenuShow: onAfterSpy });
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(onAfterSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();

        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).action = actionMock;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]').dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the "onCommand" handler to be executed when defined', () => {
        const onCommandMock = jest.fn();

        plugin.dispose();
        plugin.init();
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);
        plugin.addonOptions.onCommand = onCommandMock;

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-cell-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]').dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(onCommandMock).toHaveBeenCalled();
      });

      it('should not populate a Cell Menu when "menuUsabilityOverride" is defined and returns False', () => {
        plugin.dispose();
        plugin.init({ menuUsabilityOverride: () => false });
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu.commandItems[1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        expect(plugin.menuElement).toBeFalsy();
      });
    });

    describe('with Options Items', () => {
      beforeEach(() => {
        columnsMock[4].cellMenu.optionItems = deepCopy(optionItemsMock);
        delete (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride;
        delete (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride;
        jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 4, row: 1 });
      });

      it('should not populate and automatically return when the Cell Menu item "optionItems" array of the cell menu is undefined', () => {
        plugin.dispose();
        plugin.init({ onAfterMenuShow: undefined });
        (columnsMock[4].cellMenu.optionItems) = undefined;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
      });

      it('should create a Cell Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div style="display: block; width: auto; max-height: none; top: 0px; left: 0px;" class="slick-cell-menu slickgrid12345 dropdown dropright" aria-expanded="true">
            <button class="close" type="button" data-dismiss="slick-cell-menu" aria-label="Close">
              <span class="close" aria-hidden="true">×</span>
            </button>
            <div class="slick-cell-menu-option-list">
              <li class="slick-cell-menu-item purple" data-option="option1">
                <div class="slick-cell-menu-icon"></div>
                <span class="slick-cell-menu-content">Option 1</span>
              </li>
              <li class="slick-cell-menu-item" data-option="option2">
                <div class="slick-cell-menu-icon"></div>
                <span class="slick-cell-menu-content">Option 2</span>
              </li>
              <li class="slick-cell-menu-item slick-cell-menu-item-divider"></li>
              <li class="slick-cell-menu-item sky" data-option="delete-row">
                <div class="slick-cell-menu-icon mdi mdi-checked"></div>
                <span class="slick-cell-menu-content underline">Delete Row</span>
              </li>
              <li class="slick-cell-menu-item slick-cell-menu-item-divider"></li>
          </div>
        </div>`));
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => undefined;
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => undefined;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelectorAll('.slick-cell-menu-item')[1] as HTMLDivElement;
        const optionItemElm3 = optionListElm.querySelectorAll('.slick-cell-menu-item')[2] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;
        const optionLabelElm3 = optionItemElm3.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const optionIconElm3 = optionItemElm3.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(4);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-cell-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(optionItemElm2.classList.contains('slick-cell-menu-item-divider')).toBeTruthy();
        expect(optionItemElm2.innerHTML).toBe('');
        expect(optionIconElm3.classList.contains('mdi-checked')).toBeTruthy();
        expect(optionLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of options defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => false;
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(4);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-cell-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).not.toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-cell-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-cell-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-cell-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).disabled = true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-cell-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Cell Menu and expect button to be disabled when option property is hidden', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).hidden = true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-cell-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Cell Menu with an icon having a background image when property "iconImage" is filled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).iconImage = '/images/some-image.png';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.style.backgroundImage).toBe('url(/images/some-image.png)');
        expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "iconImage" property of a Cell Menu item is now deprecated and will be removed in future version, consider using "iconCssClass" instead.');
      });

      it('should create a Cell Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).iconCssClass = 'underline sky';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-cell-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.classList.contains('underline')).toBeTruthy();
        expect(optionIconElm2.classList.contains('sky')).toBeTruthy();
      });

      it('should create a Cell Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).title = 'Help';
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Help');
        expect(optionContentElm2.classList.contains('italic')).toBeTruthy();
        expect(optionContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Cell Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).tooltip = 'some tooltip';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-cell-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.title).toBe('some tooltip');
      });

      it('should create a Cell Menu item with a title for the option list when "optionTitle" is provided', () => {
        plugin.dispose();
        plugin.init();
        plugin.setOptions({ optionTitle: 'The Options!' });
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).title = 'Help';
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionListTitleElm.textContent).toBe('The Options!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu as CellMenu).optionTitleKey = 'OPTIONS_LIST';
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).option = 'none';
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).titleKey = 'NONE';
        translateService.use('fr');
        plugin.translateCellMenu();

        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        const optionItemElm = optionListElm.querySelector('[data-option="none"]') as HTMLDivElement;
        const optionContentElm = optionItemElm.querySelector('.slick-cell-menu-content') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(optionListTitleElm.textContent).toBe(`Liste d'options`);
        expect(optionContentElm.textContent).toBe(`Aucun`);
      });

      it('should create a Cell Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = jest.spyOn(plugin, 'closeMenu');

        plugin.dispose();
        plugin.init();
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        let cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        closeBtnElm.dispatchEvent(new Event('click'));
        cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
        expect(closeBtnElm).toBeTruthy();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu.optionItems[1] as MenuOptionItem).action = actionMock;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the "onOptionSelected" handler to be executed when defined', () => {
        const onOptionSelectedMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ onOptionSelected: onOptionSelectedMock });
        // plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(onOptionSelectedMock).toHaveBeenCalled();
      });

      it('should create a Cell Menu and NOT expect the "onOptionSelected" handler to be executed when "commitCurrentEdit" returns false', () => {
        const onOptionSelectedMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(false);

        plugin.dispose();
        plugin.init();
        plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-cell-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]').dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-cell-menu-item').length).toBe(5);
        expect(onOptionSelectedMock).not.toHaveBeenCalled();
      });
    });
  });
});