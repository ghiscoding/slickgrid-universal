import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { deepCopy } from '@slickgrid-universal/utils';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, SlickEventData, type SlickDataView, type SlickGrid } from '../../core/index.js';
import { ExtensionUtility } from '../../extensions/extensionUtility.js';
import type { Column, ContextMenu, ElementPosition, Formatter, GridOption, MenuCommandItem, MenuOptionItem } from '../../interfaces/index.js';
import {
  BackendUtilityService,
  SharedService,
  type ExcelExportService,
  type PdfExportService,
  type TextExportService,
  type TreeDataService,
} from '../../services/index.js';
import { SlickContextMenu } from '../slickContextMenu.js';

const removeExtraSpaces = (text: string) => `${text}`.replace(/[\n\r]\s+/g, '');

const commandItemsMock = [
  { command: 'command2', title: 'Command 2', positionOrder: 62 },
  { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
  { divider: true, command: '', positionOrder: 63 },
  {
    command: 'delete-row',
    title: 'Delete Row',
    positionOrder: 64,
    iconCssClass: 'mdi mdi-close',
    cssClass: 'red',
    textCssClass: 'bold',
  },
  'divider',
  {
    command: 'sub-commands',
    title: 'Sub Commands',
    subMenuTitle: 'Sub Command Title',
    commandItems: [
      { command: 'command3', title: 'Command 3', positionOrder: 70 },
      { command: 'command4', title: 'Command 4', positionOrder: 71 },
      {
        command: 'more-sub-commands',
        title: 'More Sub Commands',
        subMenuTitle: 'Sub Command Title 2',
        subMenuTitleCssClass: 'color-warning',
        commandItems: [{ command: 'command5', title: 'Command 5', positionOrder: 72 }],
      },
    ],
  },
] as MenuCommandItem[];
const optionItemsMock = [
  { option: 'option2', title: 'Option 2', positionOrder: 62 },
  { option: 'option1', title: 'Option 1', cssClass: 'purple', positionOrder: 61 },
  { divider: true, option: '', positionOrder: 63 },
  {
    option: 'delete-row',
    title: 'Delete Row',
    positionOrder: 64,
    iconCssClass: 'mdi mdi-checked',
    cssClass: 'sky',
    textCssClass: 'underline',
  },
  'divider',
  {
    option: 'sub-options',
    title: 'Sub Options',
    subMenuTitle: 'Sub Option Title',
    subMenuTitleCssClass: 'bold italic',
    optionItems: [
      { option: 'option3', title: 'Option 3', positionOrder: 70 },
      { option: 'option4', title: 'Option 4', positionOrder: 71 },
    ],
  },
] as MenuOptionItem[];

const columnsMock: Column[] = [
  { id: 'firstName', field: 'firstName', name: 'First Name', width: 100 },
  { id: 'lastName', field: 'lastName', name: 'Last Name', width: 75, nameKey: 'LAST_NAME', sortable: true, filterable: true },
  { id: 'age', field: 'age', name: 'Age', width: 50 },
  { id: 'action', field: 'action', name: 'Action', width: 50 },
  { id: 'action2', field: 'action2', name: 'Action2', width: 50 },
];

const gridOptionsMock = {
  enableContextMenu: true,
  enableTranslate: true,
  backendServiceApi: {
    service: {
      buildQuery: vi.fn(),
    },
    internalPostProcess: vi.fn(),
    preProcess: vi.fn(),
    process: vi.fn(),
    postProcess: vi.fn(),
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
    onExtensionRegistered: vi.fn(),
    onCommand: () => {},
    onAfterMenuShow: () => {},
    onBeforeMenuShow: () => {},
    onBeforeMenuClose: () => {},
    onOptionSelected: () => {},
  },
} as unknown as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  autosizeColumns: vi.fn(),
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getContainerNode: vi.fn(),
  getDataItem: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  getGridPosition: vi.fn(),
  getOptions: () => gridOptionsMock,
  getUID: () => 'slickgrid12345',
  registerPlugin: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSortColumns: vi.fn(),
  sanitizeHtmlString: (str: string) => str,
  updateColumnHeader: vi.fn(),
  onClick: new SlickEvent(),
  onContextMenu: new SlickEvent(),
  onScroll: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

const dataViewStub = {
  collapseAllGroups: vi.fn(),
  expandAllGroups: vi.fn(),
  refresh: vi.fn(),
  getItems: vi.fn(),
  getGrouping: vi.fn(),
  setGrouping: vi.fn(),
  setItems: vi.fn(),
} as unknown as SlickDataView;

const excelExportServiceStub = {
  className: 'ExcelExportService',
  exportToExcel: vi.fn(),
} as unknown as ExcelExportService;

const pdfExportServiceStub = {
  className: 'PdfExportService',
  exportToPdf: vi.fn(),
} as unknown as PdfExportService;

const exportServiceStub = {
  className: 'TextExportService',
  exportToFile: vi.fn(),
} as unknown as TextExportService;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const treeDataServiceStub = {
  convertFlatParentChildToTreeDataset: vi.fn(),
  init: vi.fn(),
  convertFlatParentChildToTreeDatasetAndSort: vi.fn(),
  dispose: vi.fn(),
  handleOnCellClick: vi.fn(),
  toggleTreeDataCollapse: vi.fn(),
} as unknown as TreeDataService;

describe('ContextMenu Plugin', () => {
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let parentContainer: HTMLDivElement;
  let translateService: TranslateServiceStub;
  let plugin: SlickContextMenu;
  let sharedService: SharedService;
  const myUppercaseFormatter: Formatter = (_row, _cell, value) => (value !== undefined ? { text: String(value).toUpperCase() } : '');

  beforeEach(() => {
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    sharedService.dataView = dataViewStub;
    sharedService.slickGrid = gridStub;

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        readText: vi.fn(() => Promise.resolve('')),
        writeText: vi.fn(() => Promise.resolve()),
      },
      writable: true,
    });
    parentContainer = document.createElement('div');
    sharedService.gridContainerElement = parentContainer;
    vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    plugin = new SlickContextMenu(extensionUtility, pubSubServiceStub, sharedService, treeDataServiceStub);
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
      autoAdjustDrop: true, // dropup/dropdown
      autoAlignSide: true, // left/right
      autoAdjustDropOffset: 0,
      autoAlignSideOffset: 0,
      commandItems: [],
      hideMenuOnScroll: false,
      optionShownOverColumnIds: [],
      commandShownOverColumnIds: [],
      subMenuOpenByEvent: 'mouseover',
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
      eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      eventData.target = slickCellElm;
      sharedService.slickGrid = gridStub;

      gridOptionsMock.contextMenu!.commandItems = deepCopy(commandItemsMock);
      delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).action;
      delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride;
      delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride;
      contextMenuDiv = document.createElement('div');
      contextMenuDiv.className = 'slick-header-column';
      gridContainerDiv = document.createElement('div');
      gridContainerDiv.className = 'slickgrid-container';
      vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
      vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: 1 });
      vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 33 });
    });

    afterEach(() => {
      plugin.dispose();
      vi.clearAllMocks();
    });

    it('should open the Context Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
      const hideMenuSpy = vi.spyOn(plugin, 'hideMenu');
      const closeSpy = vi.spyOn(plugin, 'closeMenu');
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true });

      plugin.dispose();
      plugin.init();
      gridStub.onContextMenu.notify(null as any, eventData, gridStub);

      let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
      expect(contextMenuElm).toBeTruthy();

      // click inside menu shouldn't close it
      contextMenuElm!.dispatchEvent(new Event('mousedown', { bubbles: true }));
      expect(contextMenuElm).toBeTruthy();

      // click anywhere else should close it
      document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));
      contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

      expect(contextMenuElm).toBeNull();
      expect(closeSpy).toHaveBeenCalled();
      expect(hideMenuSpy).toHaveBeenCalled();
    });

    it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element when opening Context Menu', () => {
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, darkMode: true });
      const actionBtnElm = document.createElement('button');
      slickCellElm.appendChild(actionBtnElm);
      const eventDataCopy = deepCopy(eventData);
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      let contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      expect(contextMenuElm).toBeTruthy();
      expect(contextMenuElm.classList.contains('slick-dark-mode')).toBeTruthy();

      // cell click should close it
      gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);
      contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

      expect(contextMenuElm).toBeNull();
    });

    it('should "autoAlignSide" and expect menu to aligned left with a calculate offset when showing menu', () => {
      vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      plugin.dispose();
      plugin.init({ autoAdjustDrop: true, autoAlignSide: true, dropDirection: 'top', dropSide: 'left' });

      const actionBtnElm = document.createElement('button');
      slickCellElm.appendChild(actionBtnElm);
      const eventDataCopy = deepCopy(eventData);
      Object.defineProperty(actionBtnElm, 'clientWidth', { writable: true, configurable: true, value: 275 });
      Object.defineProperty(slickCellElm, 'clientWidth', { writable: true, configurable: true, value: 300 });
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
      Object.defineProperty(contextMenuElm, 'clientHeight', { writable: true, configurable: true, value: 300 });
      Object.defineProperty(plugin.menuElement, 'clientWidth', { writable: true, configurable: true, value: 350 });
      gridStub.onContextMenu.notify({ grid: gridStub }, eventDataCopy as any, gridStub);

      expect(contextMenuElm.classList.contains('dropup')).toBeTruthy();
      expect(contextMenuElm.classList.contains('dropleft')).toBeTruthy();
    });

    describe('with Command Items', () => {
      beforeEach(() => {
        sharedService.gridOptions.contextMenu!.commandTitle = '';
        gridOptionsMock.contextMenu!.hideCopyCellValueCommand = true;
        gridOptionsMock.contextMenu!.commandItems = deepCopy(commandItemsMock);
      });

      it('should not populate and automatically return when the Context Menu item "commandItems" array of the context menu is undefined', () => {
        plugin.dispose();
        plugin.init();
        gridOptionsMock.contextMenu!.commandItems = undefined as any;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(contextMenuElm.classList.contains('dropdown'));
        expect(contextMenuElm.classList.contains('dropright'));
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(document.body.querySelector('button.close')!.ariaLabel).toBe('Close'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(
          removeExtraSpaces(
            `<div class="slick-context-menu slick-menu-level-0 slickgrid12345 dropdown dropright" style="top: 0px; display: block; left: 0px;" aria-expanded="true">
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
          </div>
        </div>`
          )
        );
      });

      it('should NOT expect a Context Menu to be created the column is not found in "commandShownOverColumnIds"', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), commandShownOverColumnIds: ['Age'] });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => undefined as any;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelectorAll('.slick-menu-item')[1] as HTMLDivElement;
        const commandItemElm3 = commandListElm.querySelectorAll('.slick-menu-item')[2] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm3 = commandItemElm3.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm3 = commandItemElm3.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(5);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(commandItemElm2.classList.contains('slick-menu-item-divider')).toBeTruthy();
        expect(commandItemElm2.innerHTML).toBe('');
        expect(commandIconElm3.classList.contains('mdi-close')).toBeTruthy();
        expect(commandLabelElm3.textContent).toBe('Delete Row');
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Command 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(5);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).not.toBeTruthy();
      });

      it('should create a Context Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelectorAll('.slick-menu-item')[0] as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandItemElm1.classList.contains('orange')).toBeTruthy();
        expect(commandIconElm1.className).toBe('slick-menu-icon');
        expect(commandLabelElm1.textContent).toBe('Command 1');
        expect(document.body.innerHTML.includes('Command 2')).toBeTruthy();
      });

      it('should create a Context Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), maxHeight: 290 });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).disabled = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(contextMenuElm.style.maxHeight).toBe('290px');
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Context Menu and expect button to be disabled when command property is hidden', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), maxWidth: 310 });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).hidden = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(contextMenuElm.style.maxWidth).toBe('310px');
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.classList.contains('slick-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Context Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).iconCssClass = 'bold red';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandIconElm2.classList.contains('bold')).toBeTruthy();
        expect(commandIconElm2.classList.contains('red')).toBeTruthy();
      });

      it('should create a Context Menu item with a bullet character when "iconCssClass" is not provided', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).title = 'Help';
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).iconCssClass = undefined;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandIconElm2 = commandItemElm2.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Help');
        expect(commandIconElm2.textContent).toBe('◦');
      });

      it('should create a Context Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).title = 'Help';
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Help');
        expect(commandContentElm2.classList.contains('italic')).toBeTruthy();
        expect(commandContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Context Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).tooltip = 'some tooltip';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm2 = commandListElm.querySelector('[data-command="command2"]') as HTMLDivElement;
        const commandContentElm2 = commandItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandContentElm2.textContent).toBe('Command 2');
        expect(commandItemElm2.title).toBe('some tooltip');
      });

      it('should create a Context Menu item with a title for the command list when "commandTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ commandTitle: 'The Commands!', commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).title = 'Help';
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandListTitleElm.textContent).toBe('The Commands!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init({ commandTitleKey: 'COMMANDS', commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).command = 'help';
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).titleKey = 'HELP';
        translateService.use('fr');
        plugin.translateContextMenu();

        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm = commandListElm.querySelector('[data-command="help"]') as HTMLDivElement;
        const commandContentElm = commandItemElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandListTitleElm = commandListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandListTitleElm.textContent).toBe('Commandes');
        expect(commandContentElm.textContent).toBe('Aide');
      });

      it('should create a Context Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = vi.spyOn(plugin, 'closeMenu');

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
        const onBeforeSpy = vi.fn().mockReturnValue(false);
        const hideSpy = vi.spyOn(plugin, 'hideMenu');

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuClose: onBeforeSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);
        plugin.closeMenu(new Event('click') as any, {} as any);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(hideSpy).not.toHaveBeenCalled();
      });

      it('should not create a Context Menu element then call "closeMenu" and expect "hideMenu" to be called when "onBeforeMenuClose" returns true', () => {
        const onBeforeSpy = vi.fn().mockReturnValue(true);
        const hideSpy = vi.spyOn(plugin, 'hideMenu');

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
        const onBeforeSpy = vi.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuShow: onBeforeSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
        expect(onBeforeSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu element then call "closeMenu" and expect "hideMenu" NOT to be called when "onBeforeMenuShow" returns true', () => {
        const onBeforeSpy = vi.fn().mockReturnValue(true);
        const onAfterSpy = vi.fn().mockReturnValue(false);

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), onBeforeMenuClose: () => true, onBeforeMenuShow: onBeforeSpy, onAfterMenuShow: onAfterSpy });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onBeforeSpy).toHaveBeenCalled();
        expect(onAfterSpy).toHaveBeenCalled();
      });

      it('should create a Context Menu item with commands sub-menu items and expect sub-menu list to show in the DOM element when sub-menu is clicked', () => {
        const actionMock = vi.fn();
        const disposeSubMenuSpy = vi.spyOn(plugin, 'disposeSubMenus');
        vi.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).action = actionMock;
        plugin.addonOptions.subItemChevronClass = 'mdi mdi-chevron-right';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        let contextMenu1Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = contextMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const deleteRowCommandElm = commandList1Elm.querySelector('[data-command="delete-row"]') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subCommands1Elm!.dispatchEvent(new Event('click'));
        let contextMenu2Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        const commandList2Elm = contextMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
        const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

        subCommands2Elm!.dispatchEvent(new Event('mouseover')); // mouseover or click should work
        const contextMenu3Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-2') as HTMLDivElement;
        const commandList3Elm = contextMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
        const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandContentElm2.textContent).toBe('Sub Commands');
        expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
        expect(subMenuTitleElm.className).toBe('slick-menu-title color-warning');
        expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subCommand3Elm.textContent).toContain('Command 3');
        expect(subCommand5Elm.textContent).toContain('Command 5');

        // test clicking menu item click shouldn't close context menu
        const event = new Event('mousedown');
        Object.defineProperty(event, 'target', { writable: true, configurable: true, value: subCommands1Elm });
        document.body.dispatchEvent(event);
        contextMenu1Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        expect(contextMenu1Elm).toBeTruthy();

        // test clicking sub-menu click shouldn't close sub-menu
        const subCommandEvent = new Event('mousedown');
        Object.defineProperty(subCommandEvent, 'target', { writable: true, configurable: true, value: subCommands2Elm });
        document.body.dispatchEvent(subCommandEvent);
        contextMenu2Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        expect(contextMenu2Elm).toBeTruthy();

        // calling another command on parent menu should dispose sub-menus
        deleteRowCommandElm!.dispatchEvent(new Event('mouseover'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(4);
      });

      it('should create a Context Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = vi.fn();

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).action = actionMock;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]')!.dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the "onCommand" handler to be executed when defined', () => {
        const onCommandMock = vi.fn();

        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock) });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);
        plugin.addonOptions.onCommand = onCommandMock;

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        commandListElm.querySelector('[data-command="command2"]')!.dispatchEvent(new Event('click'));

        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onCommandMock).toHaveBeenCalled();
      });

      it('should not populate a Context Menu when "menuUsabilityOverride" is defined and returns False', () => {
        plugin.dispose();
        plugin.init({ commandItems: deepCopy(commandItemsMock), menuUsabilityOverride: () => false });
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        expect(plugin.menuElement).toBeFalsy();
      });
    });

    describe('with slot renderer', () => {
      beforeEach(() => {
        // Clean up any leftover state from previous tests
        delete gridOptionsMock.contextMenu!.defaultMenuItemRenderer;
        gridOptionsMock.contextMenu!.commandItems = [];
        gridOptionsMock.contextMenu!.hideCopyCellValueCommand = true;
      });

      it('should render menu item with slotRenderer returning HTMLElement', () => {
        const mockSlotRenderer = vi.fn((item: MenuCommandItem) => {
          const div = document.createElement('div');
          div.className = 'custom-slot-content';
          div.textContent = `Custom: ${item.title}`;
          return div;
        });

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const customSlotElm = commandListElm.querySelector('.custom-slot-content') as HTMLDivElement;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(customSlotElm).toBeTruthy();
        expect(customSlotElm.textContent).toBe('Custom: Test Command');
      });

      it('should render menu item with slotRenderer returning string', () => {
        const mockSlotRenderer = vi.fn((item: MenuCommandItem) => `<span class="custom-string">String: ${item.title}</span>`);

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const customSlotElm = commandListElm.querySelector('.custom-string') as HTMLDivElement;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(customSlotElm).toBeTruthy();
        expect(customSlotElm.textContent).toContain('String: Test Command');
      });

      it('should render menu item with defaultMenuItemRenderer when item has no slotRenderer', () => {
        const mockDefaultRenderer = vi.fn((item: MenuCommandItem) => {
          const div = document.createElement('div');
          div.className = 'default-renderer-content';
          div.textContent = `Default: ${item.title}`;
          return div;
        });

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'test-cmd', title: 'Test Command' }], defaultMenuItemRenderer: mockDefaultRenderer });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const defaultRendererElm = commandListElm.querySelector('.default-renderer-content') as HTMLDivElement;

        expect(mockDefaultRenderer).toHaveBeenCalled();
        expect(defaultRendererElm).toBeTruthy();
        expect(defaultRendererElm.textContent).toBe('Default: Test Command');
      });

      it('should prioritize item slotRenderer over defaultMenuItemRenderer', () => {
        const mockSlotRenderer = vi.fn((item: MenuCommandItem) => {
          const div = document.createElement('div');
          div.className = 'slot-prioritized';
          div.textContent = 'Slot renderer prioritized';
          return div;
        });
        const mockDefaultRenderer = vi.fn();

        plugin.dispose();
        plugin.init({
          commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }],
          defaultMenuItemRenderer: mockDefaultRenderer,
        });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const slotRendererElm = commandListElm.querySelector('.slot-prioritized') as HTMLDivElement;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(mockDefaultRenderer).not.toHaveBeenCalled();
        expect(slotRendererElm).toBeTruthy();
      });

      it('should pass correct arguments (item and args) to slotRenderer callback', () => {
        const mockSlotRenderer = vi.fn((item: MenuCommandItem, args: any) => {
          const div = document.createElement('div');
          div.className = 'renderer-args-test';
          div.textContent = `Item: ${item.command}, Grid: ${args?.grid ? 'present' : 'missing'}`;
          return div;
        });

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'test-cmd', title: 'Test Command with Args', slotRenderer: mockSlotRenderer }] });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        expect(mockSlotRenderer).toHaveBeenCalled();
        const callArgs = mockSlotRenderer.mock.calls[0];
        expect(callArgs[0].command).toBe('test-cmd');
        expect(callArgs[1]).toBeDefined();
        expect(callArgs[1].grid).toBe(gridStub);
      });

      it('should call slotRenderer with click event as third argument when menu item is clicked', () => {
        const mockSlotRenderer = vi.fn((item: MenuCommandItem, args: any, event?: Event) => {
          const div = document.createElement('div');
          div.className = 'click-test';
          return div;
        });

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const menuItemElm = commandListElm.querySelector('.slick-menu-item') as HTMLDivElement;

        // Click the menu item
        menuItemElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

        // Verify slotRenderer was called with the click event as the third argument
        expect(mockSlotRenderer).toHaveBeenCalledTimes(2); // once for render, once for click
        const clickCallArgs = mockSlotRenderer.mock.calls[1]; // second call is from click
        expect(clickCallArgs[2]).toBeDefined();
        expect(clickCallArgs[2]!.type).toBe('click');
      });

      it('should not trigger menu action when slotRenderer calls preventDefault on click event', () => {
        const mockAction = vi.fn();
        const mockSlotRenderer = vi.fn((item: MenuCommandItem, args: any, event?: Event) => {
          const div = document.createElement('div');
          div.className = 'prevent-default-test';
          const button = document.createElement('button');
          button.textContent = 'Interactive';
          button.onclick = (e) => {
            e.preventDefault(); // Prevent default action
          };
          div.appendChild(button);
          return div;
        });

        plugin.dispose();
        plugin.init({
          commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer, action: mockAction }],
        });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const menuItemElm = commandListElm.querySelector('.slick-menu-item') as HTMLDivElement;
        const buttonElm = menuItemElm.querySelector('button') as HTMLButtonElement;

        // Click the button inside the slotRenderer, which calls preventDefault
        buttonElm.click();

        // Verify the action callback was not called because preventDefault was called
        expect(mockAction).not.toHaveBeenCalled();
      });
    });

    describe('with Custom Commands List', () => {
      beforeEach(() => {
        slickCellElm = document.createElement('div');
        slickCellElm.className = 'slick-cell';
        eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
        eventData.target = slickCellElm;
        sharedService.slickGrid = gridStub;

        gridOptionsMock.contextMenu!.commandItems = deepCopy(commandItemsMock);
        delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).action;
        delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride;
        delete (gridOptionsMock.contextMenu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride;
        contextMenuDiv = document.createElement('div');
        contextMenuDiv.className = 'slick-header-column';
        gridContainerDiv = document.createElement('div');
        gridContainerDiv.className = 'slickgrid-container';
        vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
        vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
        vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 1, row: 1 });
        vi.spyOn(gridStub, 'getDataItem').mockReturnValue({ firstName: 'John', lastName: 'Doe', age: 33 });

        if (window.document) {
          window.document.createRange = () =>
            ({
              selectNodeContents: () => {},
              setStart: () => {},
              setEnd: () => {},
              commonAncestorContainer: { nodeName: 'BODY', ownerDocument: document },
            }) as any;

          window.getSelection = () =>
            ({
              removeAllRanges: () => {},
              addRange: () => {},
            }) as any;
        }
      });

      afterEach(() => {
        plugin.dispose();
        vi.clearAllMocks();
      });

      // -- Copy to Clipboard -- //
      it('should populate menuCommandItems with Copy cell action when "hideCopyCellValueCommand" is disabled', () => {
        const writeSpy = navigator.clipboard.writeText;
        gridOptionsMock.contextMenu!.hideCopyCellValueCommand = false;
        plugin.dispose();
        plugin.init({ commandItems: [], hideCopyCellValueCommand: false });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelector('.slick-menu-item') as HTMLDivElement;
        const commandLabelElm1 = commandItemElm1.querySelector('.slick-menu-content') as HTMLSpanElement;
        const commandIconElm1 = commandItemElm1.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(1);
        expect(commandItemElm1.classList.contains('slick-menu-item-disabled')).toBeFalsy();
        expect(commandIconElm1.classList.contains('mdi-content-copy')).toBeTruthy();
        expect(commandLabelElm1.textContent).toBe('Copy');

        commandItemElm1.dispatchEvent(new CustomEvent('click'));

        expect(writeSpy).toHaveBeenCalledWith('Doe');
      });

      it('should call "copyToClipboard", WITH export formatter, when the command triggered is "copy"', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          excelExportOptions: { exportWithFormatter: true },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', formatter: myUppercaseFormatter } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const writeSpy = navigator.clipboard.writeText;
        plugin.dispose();
        plugin.init({ commandItems: [] });
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John',
        });

        expect(writeSpy).toHaveBeenCalledWith('JOHN');
      });

      it('should call "copyToClipboard", with a number when the command triggered is "copy" and expect it to be copied without transformation', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          excelExportOptions: { exportWithFormatter: true },
        } as GridOption;
        const columnMock = { id: 'age', name: 'Age', field: 'age' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const writeSpy = navigator.clipboard.writeText;
        plugin.dispose();
        plugin.init({ commandItems: [] });
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 50,
        });

        expect(writeSpy).toHaveBeenCalledWith(50);
      });

      it('should call "copyToClipboard", with a number when the command triggered is "copy" and expect it to be copied without transformation', () =>
        new Promise((done: any) => {
          const consoleSpy = vi.spyOn(console, 'error').mockReturnValue();
          const copyGridOptionsMock = {
            ...gridOptionsMock,
            enableExcelExport: false,
            enableTextExport: false,
            excelExportOptions: { exportWithFormatter: true },
          } as GridOption;
          const columnMock = { id: 'age', name: 'Age', field: 'age' } as Column;
          const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
          vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
          vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
          (navigator.clipboard.writeText as Mock).mockRejectedValueOnce('clipboard error');
          plugin.dispose();
          plugin.init({ commandItems: [] });
          plugin.init({ commandItems: [] });

          const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
            (item: MenuCommandItem) => item.command === 'copy'
          ) as MenuCommandItem;
          menuItemCommand.action!(new CustomEvent('change'), {
            command: 'copy',
            cell: 2,
            row: 5,
            grid: gridStub,
            column: columnMock,
            dataContext: dataContextMock,
            item: menuItemCommand,
            value: 50,
          });

          setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              'Unable to read/write to clipboard. Please check your browser settings or permissions. Error: clipboard error'
            );
            done();
          });
        }));

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined when the command triggered is "copy"', () => {
        const firstNameColIdx = 0;
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        columnsMock[firstNameColIdx] = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        vi.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: firstNameColIdx, row: 1 });
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const writeSpy = navigator.clipboard.writeText;
        plugin.dispose();
        plugin.init({ commandItems: [], hideCopyCellValueCommand: false });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const commandListElm = contextMenuElm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const commandItemElm1 = commandListElm.querySelector('.slick-menu-item') as HTMLDivElement;

        expect(plugin.menuElement).toBeTruthy();
        expect(closeBtnElm).toBeTruthy();
        expect(commandListElm.querySelectorAll('.slick-menu-item').length).toBe(1);
        expect(commandItemElm1.classList.contains('slick-menu-item-disabled')).toBeFalsy();

        commandItemElm1.dispatchEvent(new CustomEvent('click'));
        expect(writeSpy).toHaveBeenCalledWith('Doe');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined when the command triggered is "copy"', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const writeSpy = navigator.clipboard.writeText;
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John',
        });

        expect(writeSpy).toHaveBeenCalledWith('Doe');
      });

      it('should call "copyToClipboard" and get the value even when there is a "queryFieldNameGetterFn" callback defined with dot notation the command triggered is "copy"', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: '\u034f\u034fJohn', lastName: '\u034f\u034f Doe', age: 50 } };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const writeSpy = navigator.clipboard.writeText;
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), {
          command: 'copy',
          cell: 2,
          row: 5,
          grid: gridStub,
          column: columnMock,
          dataContext: dataContextMock,
          item: menuItemCommand,
          value: 'John',
        });

        expect(writeSpy).toHaveBeenCalledWith('Doe');
      });

      it('should expect "itemUsabilityOverride" callback from the "copy" command to return True when a value to copy is found in the dataContext object', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: 'John', lastName: '·\u034f ⮞   Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: '', lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName' } as Column;
        const dataContextMock = { id: 123, lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'firstName', queryFieldNameGetterFn: () => 'lastName' } as Column;
        const dataContextMock = { id: 123, firstName: null, lastName: 'Doe', age: 50 };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: false },
        } as GridOption;
        const columnMock = { id: 'firstName', name: 'First Name', field: 'user.firstName', queryFieldNameGetterFn: () => 'user.lastName' } as Column;
        const dataContextMock = { id: 123, user: { firstName: null, lastName: 'Doe', age: 50 } };
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'copy'
        ) as MenuCommandItem;
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
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: true,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-excel'
        ) as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any)).toThrow(
          '[Slickgrid-Universal] You must register the ExcelExportService to properly use Export to Excel in the Context Menu.'
        );
      });

      // -- Export to PDF -- //
      it('should call "exportToPdf" and expect an error thrown when PdfExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enablePdfExport: true,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportPdfCommand: false },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-pdf'
        ) as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-pdf', cell: 0, row: 0 } as any)).toThrow(
          '[Slickgrid-Universal] You must register the PdfExportService to properly use Export to PDF in the Context Menu.'
        );
      });

      it('should call "exportToFile" with CSV and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: true,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-csv'
        ) as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-csv', cell: 0, row: 0 } as any)).toThrow(
          '[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.'
        );
      });

      it('should call "exportToFile" with Text Delimited and expect an error thrown when TextExportService is not registered prior to calling the method', () => {
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: true,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-text-delimited'
        ) as MenuCommandItem;
        expect(() => menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any)).toThrow(
          '[Slickgrid-Universal] You must register the TextExportService to properly use Export to File in the Context Menu.'
        );
      });

      it('should call "exportToExcel" when the command triggered is "export-excel"', () => {
        const excelExportSpy = vi.spyOn(excelExportServiceStub, 'exportToExcel');
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: true,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: false },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([excelExportServiceStub]);
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'export-excel' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-excel'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(excelExportSpy).toHaveBeenCalled();
      });

      it('should call "exportToPdf" when the command triggered is "export-pdf"', () => {
        const pdfExportSpy = vi.spyOn(pdfExportServiceStub, 'exportToPdf');
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enablePdfExport: true,
          enableTextExport: false,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: true, hideExportExcelCommand: true, hideExportPdfCommand: false },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([pdfExportServiceStub]);
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'export-pdf' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-pdf'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-pdf', cell: 0, row: 0 } as any);

        expect(pdfExportSpy).toHaveBeenCalled();
      });

      it('should call "exportToFile" with CSV set when the command triggered is "export-csv"', () => {
        const exportSpy = vi.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: true,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'export-csv' }], hideExportCsvCommand: false }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-csv'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: ',',
          format: 'csv',
        });
      });

      it('should call "exportToFile" with Text Delimited set when the command triggered is "export-text-delimited"', () => {
        const exportSpy = vi.spyOn(exportServiceStub, 'exportToFile');
        const copyGridOptionsMock = {
          ...gridOptionsMock,
          enableExcelExport: false,
          enableTextExport: true,
          contextMenu: { hideCopyCellValueCommand: true, hideExportCsvCommand: false, hideExportExcelCommand: true },
        } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(SharedService.prototype, 'externalRegisteredResources', 'get').mockReturnValue([exportServiceStub]);
        plugin.init({ commandItems: [{ command: 'export-text-delimited' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'export-text-delimited'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'export-excel', cell: 0, row: 0 } as any);

        expect(exportSpy).toHaveBeenCalledWith({
          delimiter: '\t',
          format: 'txt',
        });
      });

      it('should call "setGrouping" from the DataView when Grouping is enabled and the command triggered is "clear-grouping"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'clear-grouping' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'clear-grouping'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'clear-grouping', cell: 0, row: 0 } as any);

        expect(dataViewStub.setGrouping).toHaveBeenCalledWith([]);
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuClearGrouping');
      });

      it('should call "collapseAllGroups" from the DataView when Grouping is enabled and the command triggered is "collapse-all-groups"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'collapse-all-groups' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(dataViewStub.collapseAllGroups).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuCollapseAllGroups');
      });

      it('should call "collapseAllGroups" from the DataView when Tree Data is enabled and the command triggered is "collapse-all-groups"', () => {
        vi.spyOn(sharedService.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const treeDataSpy = vi.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideCollapseAllGroups: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });
        plugin.init();

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'collapse-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(true);
      });

      it('should call "expandAllGroups" from the DataView when Grouping is enabled and the command triggered is "expand-all-groups"', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        plugin.dispose();
        plugin.init({ commandItems: [{ command: 'expand-all-groups' }] }); // add fake command to test with .some()
        plugin.init(); // calling init the 2nd time will replace the previous line init+command

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(dataViewStub.expandAllGroups).toHaveBeenCalledWith();
        expect(pubSubSpy).toHaveBeenCalledWith('onContextMenuExpandAllGroups');
      });

      it('should call "expandAllGroups" from the DataView when Tree Data is enabled and the command triggered is "expand-all-groups"', () => {
        const treeDataSpy = vi.spyOn(treeDataServiceStub, 'toggleTreeDataCollapse');
        vi.spyOn(sharedService.dataView, 'getItems').mockReturnValueOnce(columnsMock);
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideExpandAllGroups: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuItemCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        menuItemCommand.action!(new CustomEvent('change'), { command: 'expand-all-groups', cell: 0, row: 0 } as any);

        expect(treeDataSpy).toHaveBeenCalledWith(false);
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return False when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = vi.spyOn(sharedService.dataView, 'getGrouping').mockReturnValue([]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'clear-grouping'
        ) as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);

        expect(isClearCommandUsable).toBe(false);
        expect(isCollapseCommandUsable).toBe(false);
        expect(isExpandCommandUsable).toBe(false);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Grouping command to return True when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableGrouping: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        const dataviewSpy = vi.spyOn(sharedService.dataView, 'getGrouping').mockReturnValue([{ collapsed: true }]);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuClearCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'clear-grouping'
        ) as MenuCommandItem;
        const isClearCommandUsable = menuClearCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);

        expect(isClearCommandUsable).toBe(true);
        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
        expect(dataviewSpy).toHaveBeenCalled();
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return Tree (collapse, expand) at all time even when there are NO Groups in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });

      it('should expect "itemUsabilityOverride" callback on all the Tree Data Grouping command to return True (collapse, expand) when there are Groups defined in the grid', () => {
        const copyGridOptionsMock = { ...gridOptionsMock, enableTreeData: true, contextMenu: { hideClearAllGrouping: false } } as GridOption;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(copyGridOptionsMock);
        vi.spyOn(gridStub, 'getOptions').mockReturnValue(copyGridOptionsMock);
        plugin.dispose();
        plugin.init({ commandItems: [] });

        const menuCollapseCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'collapse-all-groups'
        ) as MenuCommandItem;
        const isCollapseCommandUsable = menuCollapseCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);
        const menuExpandCommand = ((copyGridOptionsMock.contextMenu as ContextMenu).commandItems as MenuCommandItem[]).find(
          (item: MenuCommandItem) => item.command === 'expand-all-groups'
        ) as MenuCommandItem;
        const isExpandCommandUsable = menuExpandCommand.itemUsabilityOverride!({ cell: 2, row: 2, grid: gridStub } as any);

        expect(isCollapseCommandUsable).toBe(true);
        expect(isExpandCommandUsable).toBe(true);
      });
    });

    describe('with Options Items', () => {
      beforeEach(() => {
        gridOptionsMock.contextMenu!.hideCopyCellValueCommand = true;
        gridOptionsMock.contextMenu!.optionItems = undefined;
      });

      it('should not populate and automatically return when the Context Menu item "optionItems" array of the context menu is undefined', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), onAfterMenuShow: undefined });
        gridOptionsMock.contextMenu!.optionItems = undefined;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should create a Context Menu to be create and show up when item visibility & usability callbacks returns true', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(document.body.querySelector('button.close')!.ariaLabel).toBe('Close'); // JSDOM doesn't support ariaLabel, but we can test attribute this way
        expect(removeExtraSpaces(document.body.innerHTML)).toBe(
          removeExtraSpaces(
            `<div class="slick-context-menu slick-menu-level-0 slickgrid12345 dropdown dropright" style="top: 0px; display: block; left: 0px;" aria-expanded="true">
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
        </div>`
          )
        );
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of commands defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return undefined', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => undefined as any;
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => undefined as any;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
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

      it('should NOT expect a Context Menu to be created the column is not found in "commandShownOverColumnIds"', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), optionShownOverColumnIds: ['Age'] });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;

        expect(contextMenuElm).toBeNull();
      });

      it('should expect a Context Menu to be created when cell is clicked with a list of options defined but without "Option 1" when "itemVisibilityOverride" and "itemUsabilityOverride" return false', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => false;
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
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

      it('should create a Context Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemVisibilityOverride = () => true;
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).itemUsabilityOverride = () => false;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const closeBtnElm = contextMenuElm.querySelector('.close') as HTMLButtonElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
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

      it('should create a Context Menu and a 2nd item is "disabled" and expect button to be disabled', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).disabled = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-menu-item-disabled')).toBeTruthy();
      });

      it('should create a Context Menu and expect button to be disabled when option property is hidden', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).hidden = true;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.classList.contains('slick-menu-item-hidden')).toBeTruthy();
      });

      it('should create a Context Menu item with "iconCssClass" and expect extra css classes added to the icon element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).iconCssClass = 'underline sky';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionIconElm2 = optionItemElm2.querySelector('.slick-menu-icon') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionIconElm2.classList.contains('underline')).toBeTruthy();
        expect(optionIconElm2.classList.contains('sky')).toBeTruthy();
      });

      it('should create a Context Menu item with "textCssClass" and expect extra css classes added to the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).title = 'Help';
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Help');
        expect(optionContentElm2.classList.contains('italic')).toBeTruthy();
        expect(optionContentElm2.classList.contains('blue')).toBeTruthy();
      });

      it('should create a Context Menu item with "tooltip" and expect a title attribute to be added the item text DOM element', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).tooltip = 'some tooltip';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm2 = optionListElm.querySelector('[data-option="option2"]') as HTMLDivElement;
        const optionContentElm2 = optionItemElm2.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionChevronElm = optionListElm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionContentElm2.textContent).toBe('Option 2');
        expect(optionItemElm2.title).toBe('some tooltip');
        expect(optionChevronElm.textContent).toBe('⮞');
      });

      it('should create a Context Menu item with a title for the option list when "optionTitle" is provided', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        plugin.setOptions({ optionTitle: 'The Options!' });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).title = 'Help';
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).textCssClass = 'italic blue';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionListTitleElm.textContent).toBe('The Options!');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu as ContextMenu).optionTitleKey = 'OPTIONS_LIST';
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).option = 'none';
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).titleKey = 'NONE';
        translateService.use('fr');
        plugin.translateContextMenu();

        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const optionItemElm = optionListElm.querySelector('[data-option="none"]') as HTMLDivElement;
        const optionContentElm = optionItemElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionListTitleElm = optionListElm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionListTitleElm.textContent).toBe(`Liste d'options`);
        expect(optionContentElm.textContent).toBe(`Aucun`);
      });

      it('should create a Context Menu element and expect menu to hide when Close button is clicked', () => {
        const closeSpy = vi.spyOn(plugin, 'closeMenu');

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

      it('should create a Context Menu item with sub-menu items and expect sub-menu list to show in the DOM element when sub-menu is clicked', () => {
        const actionMock = vi.fn();
        vi.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).action = actionMock;
        plugin.addonOptions.subItemChevronClass = 'mdi mdi-chevron-right';
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenu1Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-0') as HTMLDivElement;
        const optionList1Elm = contextMenu1Elm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const subOptionsElm = optionList1Elm.querySelector('[data-option="sub-options"]') as HTMLDivElement;
        const optionContentElm2 = subOptionsElm.querySelector('.slick-menu-content') as HTMLDivElement;
        const optionChevronElm = optionList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subOptionsElm!.dispatchEvent(new Event('click'));
        subOptionsElm.dispatchEvent(new Event('mousedown'));
        const contextMenu2Elm = document.body.querySelector('.slick-context-menu.slickgrid12345.slick-menu-level-1') as HTMLDivElement;
        const optionList2Elm = contextMenu2Elm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        const subMenuTitleElm = optionList2Elm.querySelector('.slick-menu-title') as HTMLDivElement;
        const subOption3Elm = optionList2Elm.querySelector('[data-option="option3"]') as HTMLDivElement;

        expect(optionList1Elm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(optionList2Elm.querySelectorAll('.slick-menu-item').length).toBe(2);
        expect(optionContentElm2.textContent).toBe('Sub Options');
        expect(subMenuTitleElm.textContent).toBe('Sub Option Title');
        expect(subMenuTitleElm.className).toBe('slick-menu-title bold italic');
        expect(optionChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subOption3Elm.textContent).toContain('Option 3');

        document.body.dispatchEvent(new Event('mousedown'));
      });

      it('should create a Context Menu and expect the button click handler & "action" callback to be executed when defined', () => {
        const actionMock = vi.fn();
        vi.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        (gridOptionsMock.contextMenu!.optionItems![1] as MenuOptionItem).action = actionMock;
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(actionMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and expect the "onOptionSelected" handler to be executed when defined', () => {
        const onOptionSelectedMock = vi.fn();
        vi.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(true);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock), onOptionSelected: onOptionSelectedMock });
        // plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onOptionSelectedMock).toHaveBeenCalled();
      });

      it('should create a Context Menu and NOT expect the "onOptionSelected" handler to be executed when "commitCurrentEdit" returns false', () => {
        const onOptionSelectedMock = vi.fn();
        vi.spyOn(getEditorLockMock, 'commitCurrentEdit').mockReturnValue(false);

        plugin.dispose();
        plugin.init({ optionItems: deepCopy(optionItemsMock) });
        plugin.setOptions({ onOptionSelected: onOptionSelectedMock });
        gridStub.onContextMenu.notify({ grid: gridStub }, eventData, gridStub);

        const contextMenuElm = document.body.querySelector('.slick-context-menu.slickgrid12345') as HTMLDivElement;
        const optionListElm = contextMenuElm.querySelector('.slick-menu-option-list') as HTMLDivElement;
        optionListElm.querySelector('[data-option="option2"]')!.dispatchEvent(new Event('click'));

        expect(optionListElm.querySelectorAll('.slick-menu-item').length).toBe(6);
        expect(onOptionSelectedMock).not.toHaveBeenCalled();
      });
    });
  });
});
