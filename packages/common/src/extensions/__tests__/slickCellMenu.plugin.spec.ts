import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { deepCopy } from '@slickgrid-universal/utils';

import type { CellMenu, Column, ElementPosition, GridOption, MenuCommandItem, MenuOptionItem } from '../../interfaces/index';
import { SlickCellMenu } from '../slickCellMenu';
import { BackendUtilityService, SharedService, } from '../../services';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { SlickEvent, SlickEventData, SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

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
    maxWidth: 'none',
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
  onClick: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

const commandItemsMock = [
  { command: 'command2', title: 'Command 2', positionOrder: 62, },
  { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
  { divider: true, command: '', positionOrder: 63 },
  {
    command: 'delete-row', title: 'Delete Row', positionOrder: 64,
    iconCssClass: 'mdi mdi-close', cssClass: 'red', textCssClass: 'bold',
  },
  'divider',
  {
    command: 'sub-commands', title: 'Sub Commands', subMenuTitle: 'Sub Command Title', commandItems: [
      { command: 'command3', title: 'Command 3', positionOrder: 70, },
      { command: 'command4', title: 'Command 4', positionOrder: 71, },
      {
        command: 'more-sub-commands', title: 'More Sub Commands', subMenuTitle: 'Sub Command Title 2', subMenuTitleCssClass: 'color-warning', commandItems: [
          { command: 'command5', title: 'Command 5', positionOrder: 72, },
        ]
      }
    ]
  },
  {
    command: 'sub-commands2', title: 'Sub Commands 2', commandItems: [
      { command: 'command33', title: 'Command 33', positionOrder: 70, },
    ]
  }
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
  {
    option: 'sub-options', title: 'Sub Options', subMenuTitle: 'Sub Title', optionItems: [
      { option: 'option3', title: 'Option 3', positionOrder: 70, },
      { option: 'option4', title: 'Option 4', positionOrder: 71, },
    ]
  }
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

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init();

    expect(plugin.addonOptions).toEqual({
      autoAdjustDrop: true,     // dropup/dropdown
      autoAlignSide: true,      // left/right
      autoAdjustDropOffset: 0,
      autoAlignSideOffset: 0,
      hideMenuOnScroll: true,
      subMenuOpenByEvent: 'mouseover'
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
      eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      eventData.target = slickCellElm;

      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      columnsMock[3].cellMenu!.commandItems = deepCopy(commandItemsMock);
      delete (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).action;
      delete (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride;
      delete (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride;
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
      gridStub.onClick.notify(null as any, eventData, gridStub);

      let cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
      expect(cellMenuElm).toBeTruthy();

      // click inside menu shouldn't close it
      cellMenuElm!.dispatchEvent(new Event('mousedown', { bubbles: true }));
      expect(cellMenuElm).toBeTruthy();

      // click anywhere else should close it
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
        (columnsMock[3].cellMenu!.commandItems) = undefined as any;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
      });

      it('should create a Cell Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(cellMenuElm.classList.contains('dropdown'));
        expect(cellMenuElm.classList.contains('dropright'));
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(document.body.querySelector('button.close')!.ariaLabel).toBe('Close'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div class="slick-cell-menu slick-menu-level-0 slickgrid12345 dropdown dropleft" style="display: block; top: 0px; left: 0px;" aria-expanded="true">
            <div class="slick-menu-command-list" role="menu">
              <div class="slick-command-header no-title with-close">
                <button aria-label="Close" class="close" type="button" data-dismiss="slick-menu">×</button>
              </div>
              <li class="slick-menu-item orange" role="menuitem" data-command="command1">
                <div class="slick-menu-icon">◦</div>
                <span class="slick-menu-content">Command 1</span>
              </li>
              <li class="slick-menu-item" role="menuitem" data-command="command2">
                <div class="slick-menu-icon">◦</div>
                <span class="slick-menu-content">Command 2</span>
              </li>
              <li class="slick-menu-item slick-menu-item-divider" role="menuitem"></li>
              <li class="slick-menu-item red" role="menuitem" data-command="delete-row">
                <div class="slick-menu-icon mdi mdi-close"></div>
                <span class="slick-menu-content bold">Delete Row</span>
              </li>
              <li class="slick-menu-item slick-menu-item-divider" role="menuitem"></li>
              <li class="slick-menu-item slick-submenu-item" role="menuitem" data-command="sub-commands">
                <div class="slick-menu-icon"></div>
                <span class="slick-menu-content">Sub Commands</span>
                <span class="sub-item-chevron">⮞</span>
              </li>
              <li class="slick-menu-item slick-submenu-item" role="menuitem" data-command="sub-commands2">
                <div class="slick-menu-icon"></div>
                <span class="slick-menu-content">Sub Commands 2</span>
                <span class="sub-item-chevron">⮞</span>
              </li>
          </div>
        </div>`));
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => undefined as any;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelectorAll('.slick-menu-item')[1] as HTMLDivElement;
        const commandItemElm3 = commandListElm.querySelectorAll('.slick-menu-item')[2] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm3 = commandItemElm3.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm3 = commandItemElm3.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(commandItemElm2.classList.contains('slick-menu-item-divider')).toBeTruthy();
        expect(commandItemElm2.innerHTML).toBe('');
        expect(commandIconElm3.classList.contains('mdi-close')).toBeTruthy();
        expect(commandLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init({ maxHeight: 290, width: 400 });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(cellMenuElm.style.maxHeight).toBe('290px');
        expect(cellMenuElm.style.width).toBe('400px');
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).not.toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ maxWidth: 310, width: 'auto' });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(cellMenuElm.style.maxWidth).toBe('310px');
        expect(cellMenuElm.style.width).toBe('auto');
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).disabled = true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Cell Menu and expect button to be disabled when command property is hidden', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).hidden = true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Cell Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).iconCssClass = 'bold red';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.classList.contains('bold')).toBeTruthy();
        expect(commandIconElm2.classList.contains('red')).toBeTruthy();
      });

      it('should create a Cell Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).title = 'Help';
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandContentElm2.textContent).toBe('Help');
        expect(commandContentElm2.classList.contains('italic')).toBeTruthy();
        expect(commandContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Cell Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).tooltip = 'some tooltip';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.title).toBe('some tooltip');
      });

      it('should create a Cell Menu item with a title for the command list when "commandTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ commandTitle: 'The Commands!' });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).title = 'Help';
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandListTitleElm.textContent).toBe('The Commands!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu! as CellMenu).commandTitleKey = 'COMMANDS';
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).command = 'help';
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).titleKey = 'HELP';
        translateService.use('fr');
        plugin.translateCellMenu();

        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm = commandListElm.querySelector('[data-command="help"]') as HTMLDivElement;
        const commandContentElm = commandItemElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
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
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
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
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(onAfterSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu item with commands sub-menu items and expect sub-menu list to show in the DOM element aligned left when sub-menu is clicked', () => {
        const actionMock = jest.fn();
        const disposeSubMenuSpy = jest.spyOn(plugin, 'disposeSubMenus');
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), dropSide: 'left' });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).action = actionMock;
        plugin.addonOptions.subItemChevronClass = 'mdi mdi-chevron-right';
        plugin.addonOptions.autoAdjustDropOffset = -780;
        plugin.addonOptions.dropSide = 'left';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenu1Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = cellMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subCommands1Elm!.dispatchEvent(new Event('mouseover')); // mouseover or click should work
        const cellMenu2Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        const commandList2Elm = cellMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
        const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

        subCommands2Elm!.dispatchEvent(new Event('click'));
        const cellMenu3Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-2') as HTMLDivElement;
        const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
        const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandContentElm2.textContent).toBe('Sub Commands');
        expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
        expect(subMenuTitleElm.className).toBe('slick-menu-title color-warning');
        expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subCommand3Elm.textContent).toContain('Command 3');
        expect(subCommand5Elm.textContent).toContain('Command 5');
        expect(cellMenu1Elm.classList.contains('dropleft'));

        // return Cell Menu menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
        subCommands1Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(3);
        const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands2"]') as HTMLDivElement;
        subCommands12Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(4);
        expect(disposeSubMenuSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu item with commands sub-menu items and expect sub-menu list to show in the DOM element align right when sub-menu is clicked', () => {
        const actionMock = jest.fn();
        const disposeSubMenuSpy = jest.spyOn(plugin, 'disposeSubMenus');
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).action = actionMock;
        plugin.addonOptions.subItemChevronClass = 'mdi mdi-chevron-right';
        plugin.addonOptions.autoAdjustDropOffset = -780;
        plugin.addonOptions.dropSide = 'right';
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenu1Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = cellMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subCommands1Elm!.dispatchEvent(new Event('click'));
        const cellMenu2Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        const commandList2Elm = cellMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
        const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

        subCommands2Elm!.dispatchEvent(new Event('click'));
        const cellMenu3Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-2') as HTMLDivElement;
        const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
        const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandContentElm2.textContent).toBe('Sub Commands');
        expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
        expect(subMenuTitleElm.className).toBe('slick-menu-title color-warning');
        expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subCommand3Elm.textContent).toContain('Command 3');
        expect(subCommand5Elm.textContent).toContain('Command 5');
        expect(cellMenu1Elm.classList.contains('dropright'));

        // return menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
        subCommands1Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(3);
        const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands2"]') as HTMLDivElement;
        subCommands12Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(4);
        expect(disposeSubMenuSpy).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();

        plugin.dispose();
        plugin.init();
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).action = actionMock;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]')!.dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Cell Menu and expect the "onCommand" handler to be executed when defined', () => {
        const onCommandMock = jest.fn();

        plugin.dispose();
        plugin.init();
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);
        plugin.addonOptions.onCommand = onCommandMock;

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = cellMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]')!.dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(7);
        expect(onCommandMock).toHaveBeenCalled();
      });

      it('should not populate a Cell Menu when "menuUsabilityOverride" is defined and returns False', () => {
        plugin.dispose();
        plugin.init({ menuUsabilityOverride: () => false });
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (columnsMock[3].cellMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 3, row: 1, grid: gridStub }, eventData, gridStub);

        expect(plugin.menuElement).toBeFalsy();
      });
    });

    describe('with Options Items', () => {
      beforeEach(() => {
        columnsMock[4].cellMenu!.optionItems = deepCopy(optionItemsMock);
        delete (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride;
        delete (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride;
        jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 4, row: 1 });
      });

      it('should not populate and automatically return when the Cell Menu item "optionItems" array of the cell menu is undefined', () => {
        plugin.dispose();
        plugin.init({ onAfterMenuShow: undefined });
        (columnsMock[4].cellMenu!.optionItems) = undefined;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;

        expect(cellMenuElm).toBeNull();
      });

      it('should create a Cell Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(document.body.querySelector('button.close')!.ariaLabel).toBe('Close'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(removeExtraSpaces(
          `<div class="slick-cell-menu slick-menu-level-0 slickgrid12345 dropdown dropright" style="display: block; top: 0px; left: 0px;" aria-expanded="true">
            <div class="slick-menu-option-list" role="menu">
              <div class="slick-option-header no-title with-close">
                <button aria-label="Close" class="close" type="button" data-dismiss="slick-menu">×</button>
              </div>
              <li class="slick-menu-item purple" role="menuitem" data-option="option1">
                <div class="slick-menu-icon">◦</div>
                <span class="slick-menu-content">Option 1</span>
              </li>
              <li class="slick-menu-item" role="menuitem" data-option="option2">
                <div class="slick-menu-icon">◦</div>
                <span class="slick-menu-content">Option 2</span>
              </li>
              <li class="slick-menu-item slick-menu-item-divider" role="menuitem"></li>
              <li class="slick-menu-item sky" role="menuitem" data-option="delete-row">
                <div class="slick-menu-icon mdi mdi-checked"></div>
                <span class="slick-menu-content underline">Delete Row</span>
              </li>
              <li class="slick-menu-item slick-menu-item-divider" role="menuitem"></li>
              <li class="slick-menu-item slick-submenu-item" role="menuitem" data-option="sub-options">
                <div class="slick-menu-icon"></div>
                <span class="slick-menu-content">Sub Options</span>
                <span class="sub-item-chevron">⮞</span>
              </li>
          </div>
        </div>`));
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of commands defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => undefined as any;
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => undefined as any;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelectorAll('.slick-menu-item')[1] as HTMLDivElement;
        const optionItemElm3 = optionListElm.querySelectorAll('.slick-menu-item')[2] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;
        const optionLabelElm3 = optionItemElm3.querySelector('.slick-menu-content') as HTMLSpanElement;
        const optionIconElm3 = optionItemElm3.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(5);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(optionItemElm2.classList.contains('slick-menu-item-divider')).toBeTruthy();
        expect(optionItemElm2.innerHTML).toBe('');
        expect(optionIconElm3.classList.contains('mdi-checked')).toBeTruthy();
        expect(optionLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Cell Menu to be created when cell is clicked with a list of options defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => false;
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(5);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).not.toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = cellMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm1 = optionListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const optionLabelElm1 = optionItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const optionIconElm1 = optionItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionItemElm1.classList.contains('purple')).toBeTruthy();
        expect(optionIconElm1.className).toBe('slick-menu-icon');
        expect(optionLabelElm1.textContent).toBe('Option 1');
        expect(document.body.innerHTML.includes('Option 2')).toBeTruthy();
      });

      it('should create a Cell Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).disabled = true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Cell Menu and expect button to be disabled when option property is hidden', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).hidden = true;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Cell Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).iconCssClass = 'underline sky';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.classList.contains('underline')).toBeTruthy();
        expect(optionIconElm2.classList.contains('sky')).toBeTruthy();
      });

      it('should create a Cell Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).title = 'Help';
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Help');
        expect(optionContentElm2.classList.contains('italic')).toBeTruthy();
        expect(optionContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Cell Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).tooltip = 'some tooltip';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionChevronElm = optionListElm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.title).toBe('some tooltip');
        expect(optionChevronElm.className).toBe('sub-item-chevron');
        expect(optionChevronElm.textContent).toBe('⮞');
      });

      it('should create a Cell Menu item with a title for the option list when "optionTitle" is provided', () => {
        plugin.dispose();
        plugin.init();
        plugin.setOptions({ optionTitle: 'The Options!' });
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).title = 'Help';
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionListTitleElm.textContent).toBe('The Options!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu as CellMenu).optionTitleKey = 'OPTIONS_LIST';
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).option = 'none';
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).titleKey = 'NONE';
        translateService.use('fr');
        plugin.translateCellMenu();

        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm = optionListElm.querySelector('[data-option="none"]') as HTMLDivElement;
        const optionContentElm = optionItemElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
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

      it('should create a Cell Menu item with options sub-menu items and expect sub-menu list to show in the DOM element when sub-menu is clicked', () => {
        const actionMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).action = actionMock;
        plugin.addonOptions.subItemChevronClass = 'mdi mdi-chevron-right';
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenu1Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        const optionList1Elm = cellMenu1Elm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const subOptionsElm = optionList1Elm.querySelector('[data-option="sub-options"]') as HTMLDivElement;
        const optionContentElm2 = subOptionsElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionChevronElm = optionList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subOptionsElm!.dispatchEvent(new Event('click'));
        const cellMenu2Elm = document.body.querySelector('.slick-cell-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        const optionList2Elm = cellMenu2Elm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const subOption3Elm = optionList2Elm.querySelector('[data-option="option3"]') as HTMLDivElement;

        expect(optionList1Elm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionList2Elm.querySelectorAll('.slick-menu-item').length).toBe(2);
        expect(optionContentElm2.textContent).toBe('Sub Options');
        expect(optionChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subOption3Elm.textContent).toContain('Option 3');
      });

      it('should create a Cell Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = jest.fn();
        jest.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init();
        (columnsMock[4].cellMenu!.optionItems![1] as MenuOptionItem).action = actionMock;
        gridStub.onClick.notify({ cell: 4, row: 1, grid: gridStub }, eventData, gridStub);

        const cellMenuElm = document.body.querySelector('.slick-cell-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
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
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
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
        const optionListElm = cellMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onOptionSelectedMock).not.toHaveBeenCalled();
      });
    });
  });
});