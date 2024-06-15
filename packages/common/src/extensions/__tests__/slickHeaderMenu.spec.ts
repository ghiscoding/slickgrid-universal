import { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { Column, ColumnSort, ElementPosition, Filter, GridOption, HeaderButtonsOrMenu, HeaderMenuItems, MenuCommandItem } from '../../interfaces/index';
import { SlickHeaderMenu } from '../slickHeaderMenu';
import { BackendUtilityService, FilterService, SharedService, SortService } from '../../services';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

const removeExtraSpaces = (textS) => `${textS}`.replace(/[\n\r]\s+/g, '');

const mockEventCallback = () => { };
const gridOptionsMock = {
  enableAutoSizeColumns: true,
  enableColumnResizeOnDoubleClick: true,
  enableHeaderMenu: true,
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
  headerMenu: {
    buttonCssClass: 'mdi mdi-chevron-down',
    hideFreezeColumnsCommand: false,
    hideColumnResizeByContentCommand: false,
    hideForceFitButton: false,
    hideSyncResizeButton: true,
    onExtensionRegistered: jest.fn(),
    onCommand: mockEventCallback,
  },
  multiColumnSort: true,
  pagination: {
    totalItems: 0
  },
  showHeaderRow: false,
  showTopPanel: false,
  showPreHeaderPanel: false
} as unknown as GridOption;

const gridStub = {
  autosizeColumns: jest.fn(),
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getContainerNode: jest.fn(),
  getGridPosition: () => ({ width: 10, left: 0 }),
  getUID: () => 'slickgrid12345',
  getOptions: () => gridOptionsMock,
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
  updateColumnHeader: jest.fn(),
  onBeforeSetColumns: new SlickEvent(),
  onBeforeHeaderCellDestroy: new SlickEvent(),
  onClick: new SlickEvent(),
  onHeaderCellRendered: new SlickEvent(),
  onHeaderMouseEnter: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const filterServiceStub = {
  clearFilterByColumnId: jest.fn(),
  clearFilters: jest.fn(),
  getFiltersMetadata: jest.fn(),
} as unknown as FilterService;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  subscribeEvent: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as BasePubSubService;

const sortServiceStub = {
  clearSortByColumnId: jest.fn(),
  clearSorting: jest.fn(),
  emitSortChanged: jest.fn(),
  getCurrentColumnSorts: jest.fn(),
  onBackendSortChanged: jest.fn(),
  onLocalSortChanged: jest.fn(),
} as unknown as SortService;

const headerMock = {
  menu: {
    commandItems: [
      {
        cssClass: 'mdi mdi-lightbulb-outline',
        command: 'show-positive-numbers',
      },
      {
        cssClass: 'mdi mdi-lightbulb-on',
        command: 'show-negative-numbers',
        tooltip: 'Highlight negative numbers.',
      }
    ]
  } as HeaderMenuItems
} as HeaderButtonsOrMenu;

const columnsMock: Column[] = [
  { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: headerMock, },
  { id: 'field2', field: 'field2', name: 'Field 2', width: 75, nameKey: 'TITLE', sortable: true, filterable: true },
  { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
];

describe('HeaderMenu Plugin', () => {
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let plugin: SlickHeaderMenu;
  let sharedService: SharedService;

  beforeEach(() => {
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock.slice(0, 2));
    plugin = new SlickHeaderMenu(extensionUtility, filterServiceStub, pubSubServiceStub, sharedService, sortServiceStub);
  });

  afterEach(() => {
    plugin.dispose();
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init();

    expect(plugin.addonOptions).toEqual({
      autoAlign: true,
      autoAlignOffset: 0,
      buttonCssClass: null,
      buttonImage: null,
      hideColumnHideCommand: false,
      hideSortCommands: false,
      minWidth: 100,
      title: '',
      subMenuOpenByEvent: 'mouseover'
    });
  });

  it('should be able to change Header Menu options', () => {
    plugin.init();
    plugin.addonOptions = {
      buttonCssClass: 'some-class'
    };

    expect(plugin.addonOptions).toEqual({
      buttonCssClass: 'some-class',
    });
  });

  describe('plugins - Header Menu', () => {
    let gridContainerDiv: HTMLDivElement;
    let headerDiv: HTMLDivElement;
    let headersDiv: HTMLDivElement;

    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      columnsMock[0].header!.menu!.commandItems![1] = undefined as any;
      columnsMock[0].header!.menu!.commandItems![1] = {
        cssClass: 'mdi mdi-lightbulb-on',
        command: 'show-negative-numbers',
        tooltip: 'Highlight negative numbers.',
      } as MenuCommandItem;
      headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';
      gridContainerDiv = document.createElement('div');
      gridContainerDiv.className = 'slickgrid-container';
      headersDiv = document.createElement('div');
      headersDiv.className = 'slick-header-columns';
      jest.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
      jest.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
      headersDiv.appendChild(headerDiv);
      gridContainerDiv.appendChild(headersDiv);
      document.body.appendChild(gridContainerDiv);
    });

    afterEach(() => {
      plugin.dispose();
    });

    it('should populate a Header Menu button with extra button css classes when header menu option "buttonCssClass" and cell is being rendered', () => {
      plugin.dispose();
      plugin.init({ buttonCssClass: 'mdi mdi-chevron-down' });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-menu-button mdi mdi-chevron-down" aria-label="Header Menu"></div>`));
    });

    it('should populate a Header Menu button with extra tooltip title attribute when header menu option "tooltip" and cell is being rendered', () => {
      plugin.dispose();
      plugin.init({ tooltip: 'some tooltip text' });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-menu-button" aria-label="Header Menu" title="some tooltip text"></div>`));
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility callback returns undefined', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));

      gridStub.onBeforeHeaderCellDestroy.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      expect(headerDiv.innerHTML).toBe('');
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility callback returns false', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility & usability callbacks returns true', () => {
      plugin.dispose();
      plugin.init({ hideFreezeColumnsCommand: false, hideFilterCommand: false });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(`<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should populate a Header Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
      const publishSpy = jest.spyOn(pubSubServiceStub, 'publish');

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button:nth-child(1)') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item slick-menu-item-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));

      commandElm.dispatchEvent(new Event('click'));
      expect(publishSpy).not.toHaveBeenCalledWith('onHeaderMenuCommand');
    });

    it('should populate a Header Menu and a 2nd button is "disabled" and expect button to be disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = undefined;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item slick-menu-item-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should populate a Header Menu and expect button to be disabled when command property is disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).hidden = true;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-hidden') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item slick-menu-item-hidden mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should populate a Header Menu and a 2nd button and property "tooltip" is filled and expect button to include a "title" attribute for the tooltip', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).tooltip = 'Some Tooltip';

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Some Tooltip">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should populate a Header Menu and a 2nd button and expect the button click handler & action callback to be executed when defined', () => {
      const actionMock = jest.fn();

      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).action = actionMock;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
      headerButtonElm.dispatchEvent(clickEvent);
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));

      gridContainerDiv.querySelector('.slick-menu-item.mdi-lightbulb-on')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      expect(actionMock).toHaveBeenCalledWith(clickEvent, { command: 'show-negative-numbers', item: columnsMock[0].header!.menu!.commandItems![1], column: columnsMock[0], grid: gridStub });
      expect(headerDiv.querySelector('.slick-header-menu-button')!.innerHTML).toBe('');
    });

    it('should populate a Header Menu and a 2nd button and expect the "onCommand" handler to be executed when defined', () => {
      const onCommandMock = jest.fn();

      plugin.dispose();
      plugin.init();
      plugin.addonOptions.onCommand = onCommandMock;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));

      gridContainerDiv.querySelector('.slick-menu-item.mdi-lightbulb-on')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      expect(onCommandMock).toHaveBeenCalled();
      expect(headerDiv.querySelector('.slick-header-menu-button')!.innerHTML).toBe('');
    });

    it('should populate a Header Menu and a 2nd button is "disabled" but still expect the button NOT to be disabled because the "itemUsabilityOverride" has priority over the "disabled" property', () => {
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true, });

      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should "autoAlign" and expect menu to aligned left with a calculate offset when showing menu', () => {
      plugin.dispose();
      plugin.init({ autoAlign: true });

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const buttonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      buttonElm.dispatchEvent(new Event('click'));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;
      const menuElm = gridContainerDiv.querySelector('.slick-header-menu') as HTMLDivElement;
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(buttonElm, 'clientWidth', { writable: true, configurable: true, value: 350 });
      Object.defineProperty(plugin.menuElement, 'clientWidth', { writable: true, configurable: true, value: 275 });
      Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: buttonElm });

      expect(menuElm).toBeTruthy();
      expect(menuElm.clientWidth).toBe(275);
      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));
    });

    it('should not populate a Header Menu when 2nd button item visibility callback returns false', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button:nth-child(1)') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeFalsy();
    });

    it('should not populate a Header Menu when "menuUsabilityOverride" is defined and returns False', () => {
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true, });

      plugin.dispose();
      plugin.init({ menuUsabilityOverride: () => false });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;

      expect(headerButtonElm).toBeFalsy();
    });

    it('should open the Header Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
      const hideMenuSpy = jest.spyOn(plugin, 'hideMenu');
      jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true, });

      plugin.dispose();
      plugin.init();

      const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(removeExtraSpaces(
        `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
      ));

      // click inside menu shouldn't close it
      plugin.menuElement!.dispatchEvent(new Event('mousedown', { bubbles: true, cancelable: false, composed: false }));
      expect(plugin.menuElement).toBeTruthy();

      // click anywhere else should close it
      const bodyElm = document.body;
      bodyElm.dispatchEvent(new Event('mousedown', { bubbles: true }));
      expect(hideMenuSpy).toHaveBeenCalled();
    });

    describe('hideColumn method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        columnsMock[0].header!.menu = undefined;
        columnsMock[1].header!.menu = undefined;
        columnsMock[2].header!.menu = undefined;
        const mockColumn = { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE', sortable: true, filterable: true } as any;
        jest.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue([mockColumn]);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(columnsMock);
      });

      it('should call hideColumn and expect "visibleColumns" to be updated accordingly', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnResizeByContentCommand: true, }
        });
        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
        const visibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
        const updatedColumnsMock = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: { menu: undefined, }, },
          { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', header: { menu: undefined, }, width: 75, },
        ] as Column[];

        plugin.hideColumn(columnsMock[1]);

        expect(setOptionSpy).not.toHaveBeenCalled();
        expect(visibleSpy).toHaveBeenCalledWith(updatedColumnsMock);
        expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
      });

      it('should call hideColumn and expect "setOptions" to be called with new "frozenColumn" index when the grid is detected to be a frozen grid', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, frozenColumn: 1,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnResizeByContentCommand: true, }
        });

        jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
        jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const setColumnsSpy = jest.spyOn(gridStub, 'setColumns');
        const setOptionSpy = jest.spyOn(gridStub, 'setOptions');
        const visibleSpy = jest.spyOn(SharedService.prototype, 'visibleColumns', 'set');
        const updatedColumnsMock = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: { menu: undefined, }, },
          { id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing', header: { menu: undefined, }, width: 75, },
        ] as Column[];

        plugin.hideColumn(columnsMock[1]);

        expect(setOptionSpy).toHaveBeenCalledWith({ frozenColumn: 0 });
        expect(visibleSpy).toHaveBeenCalledWith(updatedColumnsMock);
        expect(setColumnsSpy).toHaveBeenCalledWith(updatedColumnsMock);
      });
    });

    describe('with sub-menus', () => {
      let columnsMock: Column[];

      beforeEach(() => {
        columnsMock = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100, },
          {
            id: 'field3', field: 'field3', name: 'Field 3', columnGroup: 'Billing',
            header: {
              menu: {
                commandItems: [
                  { command: 'help', title: 'Help', textCssClass: 'red bold' },
                  {
                    command: 'sub-commands', title: 'Sub Commands', subMenuTitle: 'Sub Command Title', commandItems: [
                      { command: 'command3', title: 'Command 3', positionOrder: 70, },
                      { command: 'command4', title: 'Command 4', positionOrder: 71, },
                      {
                        command: 'more-sub-commands', title: 'More Sub Commands', subMenuTitle: 'Sub Command Title 2', subMenuTitleCssClass: 'text-color-warning', commandItems: [
                          { command: 'command5', title: 'Command 5', positionOrder: 72, },
                        ]
                      }
                    ]
                  },
                  {
                    command: 'sub-commands3', title: 'Sub Commands 3', commandItems: [
                      { command: 'command33', title: 'Command 33', positionOrder: 70, },
                    ]
                  }
                ]
              }
            }, width: 75,
          },
        ] as Column[];
      });

      it('should create Header Menu item with commands sub-menu commandItems and expect sub-menu list to show in the DOM element aligned left when sub-menu is clicked', () => {
        const onCommandMock = jest.fn();
        const subCommand33ActionMock = jest.fn();
        const disposeSubMenuSpy = jest.spyOn(plugin, 'disposeSubMenus');
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);

        plugin.init({ autoAlign: true });
        plugin.addonOptions.onCommand = onCommandMock;
        ((columnsMock[1].header!.menu!.commandItems![2] as MenuCommandItem).commandItems![0] as MenuCommandItem).action = subCommand33ActionMock;

        const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const headerMenu1Elm = gridContainerDiv.querySelector('.slick-header-menu.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = headerMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        Object.defineProperty(commandList1Elm, 'clientWidth', { writable: true, configurable: true, value: 70 });
        const helpCommandElm = commandList1Elm.querySelector('[data-command="help"]') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        Object.defineProperty(subCommands1Elm, 'clientWidth', { writable: true, configurable: true, value: 70 });
        const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subCommands1Elm!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const headerMenu2Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        const commandList2Elm = headerMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
        const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

        subCommands2Elm!.dispatchEvent(new Event('mouseover', { bubbles: true, cancelable: true, composed: false })); // mouseover or click should work
        const cellMenu3Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-2') as HTMLDivElement;
        const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
        const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandContentElm2.textContent).toBe('Sub Commands');
        expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
        expect(subMenuTitleElm.className).toBe('slick-menu-title text-color-warning');
        expect(commandChevronElm.className).toBe('sub-item-chevron');
        expect(subCommand3Elm.textContent).toContain('Command 3');
        expect(subCommand5Elm.textContent).toContain('Command 5');
        expect(headerMenu1Elm.classList.contains('dropleft'));
        expect(headerMenu2Elm.classList.contains('dropup')).toBeFalsy();
        expect(headerMenu2Elm.classList.contains('dropdown')).toBeTruthy();

        // return Header Menu menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
        subCommands1Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(1);
        const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands3"]') as HTMLDivElement;
        subCommands12Elm!.dispatchEvent(new Event('mouseover'));
        const subCommandList3 = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        const subCommands33Elm = subCommandList3.querySelector('[data-command="command33"]') as HTMLDivElement;
        const command33ClickEvent = new Event('click');
        subCommands33Elm!.dispatchEvent(command33ClickEvent);
        expect(subCommand33ActionMock).toHaveBeenCalledWith(command33ClickEvent, { command: 'command33', item: (columnsMock[1].header!.menu!.commandItems![2] as MenuCommandItem).commandItems![0], column: columnsMock[1], grid: gridStub });
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(3);

        // calling another command on parent menu should dispose sub-menus
        helpCommandElm!.dispatchEvent(new Event('mouseover'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(4);
      });

      it('should create a Header Menu item with commands sub-menu commandItems and expect sub-menu list to show in the DOM element align right when sub-menu is clicked', () => {
        const onCommandMock = jest.fn();
        const disposeSubMenuSpy = jest.spyOn(plugin, 'disposeSubMenus');
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);

        plugin.init({ autoAlign: true, subItemChevronClass: 'mdi mdi-chevron-right' });
        plugin.addonOptions.onCommand = onCommandMock;

        const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const headerMenu1Elm = gridContainerDiv.querySelector('.slick-header-menu.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = headerMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        const commandContentElm2 = subCommands1Elm.querySelector('.slick-menu-content') as HTMLDivElement;
        const commandChevronElm = commandList1Elm.querySelector('.sub-item-chevron') as HTMLSpanElement;

        subCommands1Elm!.dispatchEvent(new Event('click'));
        const headerMenu2Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        const commandList2Elm = headerMenu2Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand3Elm = commandList2Elm.querySelector('[data-command="command3"]') as HTMLDivElement;
        const subCommands2Elm = commandList2Elm.querySelector('[data-command="more-sub-commands"]') as HTMLDivElement;

        subCommands2Elm!.dispatchEvent(new Event('click'));
        const cellMenu3Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-2') as HTMLDivElement;
        const commandList3Elm = cellMenu3Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommand5Elm = commandList3Elm.querySelector('[data-command="command5"]') as HTMLDivElement;
        const subMenuTitleElm = commandList3Elm.querySelector('.slick-menu-title') as HTMLDivElement;

        expect(commandList1Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandList2Elm.querySelectorAll('.slick-menu-item').length).toBe(3);
        expect(commandContentElm2.textContent).toBe('Sub Commands');
        expect(subMenuTitleElm.textContent).toBe('Sub Command Title 2');
        expect(subMenuTitleElm.className).toBe('slick-menu-title text-color-warning');
        expect(commandChevronElm.className).toBe('sub-item-chevron mdi mdi-chevron-right');
        expect(subCommand3Elm.textContent).toContain('Command 3');
        expect(subCommand5Elm.textContent).toContain('Command 5');
        expect(headerMenu1Elm.classList.contains('dropright'));
        expect(headerMenu2Elm.classList.contains('dropup')).toBeFalsy();
        expect(headerMenu2Elm.classList.contains('dropdown')).toBeTruthy();

        // return menu/sub-menu if it's already opened unless we are on different sub-menu tree if so close them all
        subCommands1Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(1);
        const subCommands12Elm = commandList1Elm.querySelector('[data-command="sub-commands3"]') as HTMLDivElement;
        subCommands12Elm!.dispatchEvent(new Event('click'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(2);
        expect(disposeSubMenuSpy).toHaveBeenCalled();
      });

      it('should create a Grid Menu item with commands sub-menu commandItems and expect sub-menu to be positioned on top (dropup)', () => {
        const hideMenuSpy = jest.spyOn(plugin, 'hideMenu');
        const onCommandMock = jest.fn();
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        jest.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);

        plugin.init({ autoAlign: true });
        plugin.addonOptions.onCommand = onCommandMock;

        const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const headerMenu1Elm = gridContainerDiv.querySelector('.slick-header-menu.slick-menu-level-0') as HTMLDivElement;
        const commandList1Elm = headerMenu1Elm.querySelector('.slick-menu-command-list') as HTMLDivElement;
        const subCommands1Elm = commandList1Elm.querySelector('[data-command="sub-commands"]') as HTMLDivElement;
        Object.defineProperty(headerMenu1Elm, 'clientHeight', { writable: true, configurable: true, value: 77 });
        Object.defineProperty(headerMenu1Elm, 'clientWidth', { writable: true, configurable: true, value: 225 });
        const divEvent1 = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
        Object.defineProperty(divEvent1, 'target', { writable: true, configurable: true, value: headerButtonElm });

        subCommands1Elm!.dispatchEvent(new Event('click'));
        plugin.repositionMenu(divEvent1 as any, headerMenu1Elm);
        const headerMenu2Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        Object.defineProperty(headerMenu2Elm, 'clientHeight', { writable: true, configurable: true, value: 320 });

        const divEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
        const subMenuElm = document.createElement('div');
        const menuItem = document.createElement('div');
        menuItem.className = 'slick-menu-item';
        menuItem.style.top = '465px';
        jest.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({ top: 465, left: 25 } as any);
        Object.defineProperty(menuItem, 'target', { writable: true, configurable: true, value: menuItem });
        subMenuElm.className = 'slick-submenu';
        Object.defineProperty(divEvent, 'target', { writable: true, configurable: true, value: subMenuElm });
        menuItem.appendChild(subMenuElm);

        plugin.repositionMenu(divEvent as any, headerMenu2Elm);
        const headerMenu2Elm2 = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;

        expect(headerMenu2Elm2.classList.contains('dropup')).toBeTruthy();
        expect(headerMenu2Elm2.classList.contains('dropdown')).toBeFalsy();

        // cell click should close it
        gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);

        expect(hideMenuSpy).toHaveBeenCalled();
      });
    });

    describe('Internal Custom Commands', () => {
      let eventData: SlickEventData;

      beforeEach(() => {
        columnsMock[1].header!.menu = undefined;
        columnsMock[2].header!.menu = undefined;
        headerDiv = document.createElement('div');
        headerDiv.className = 'slick-header-column';
        eventData = { ...new SlickEventData(), preventDefault: jest.fn() } as unknown as SlickEventData;
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should expect menu to show and "onBeforeMenuShow" callback to run when defined', () => {
        const originalColumnDefinitions = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnDefinitions);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(originalColumnDefinitions);
        jest.spyOn(SharedService.prototype, 'hasColumnsReordered', 'get').mockReturnValue(true);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: {
            hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true,
          }
        });

        plugin.init({ onBeforeMenuShow: () => false });
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: originalColumnDefinitions, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: originalColumnDefinitions[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect((originalColumnDefinitions[1] as any).header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
        ]);
        expect(commandDivElm).toBeFalsy();
      });

      it('should expect menu to show and "onAfterMenuShow" callback to run when defined', () => {
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableFiltering: true,
          headerMenu: { hideFilterCommand: false, hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        plugin.init({ onAfterMenuShow: () => false });
        const onAfterSpy = jest.spyOn(plugin.addonOptions, 'onAfterMenuShow').mockReturnValue(false);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearFilterSpy = jest.spyOn(filterServiceStub, 'clearFilterByColumnId');

        const headerMenuExpected = [{ iconCssClass: 'mdi mdi-filter-remove-outline', title: 'Remove Filter', titleKey: 'REMOVE_FILTER', command: 'clear-filter', positionOrder: 57 }];
        const commandDivElm = gridContainerDiv.querySelector('[data-command="clear-filter"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual(headerMenuExpected);
        expect(commandIconElm.classList.contains('mdi-filter-remove-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Remove Filter');

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);

        expect(clearFilterSpy).toHaveBeenCalledWith(clickEvent, 'field2');
        expect(onAfterSpy).toHaveBeenCalled();
        expect(pubSubSpy).toHaveBeenCalledWith('onHeaderMenuAfterMenuShow', {
          grid: gridStub,
          menu: { commandItems: headerMenuExpected },
          column: columnsMock[1]
        });
      });

      it('should have the commands "column-resize-by-content" and "hide-column" in the header menu list and also expect the command to execute necessary callback', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnResizeByContentCommand: false, }
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate any column menus
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const pubSubSpy = jest.spyOn(pubSubServiceStub, 'publish');

        const headerMenuExpected = [
          { iconCssClass: 'mdi mdi-arrow-expand-horizontal', title: 'Resize by Content', titleKey: 'COLUMN_RESIZE_BY_CONTENT', command: 'column-resize-by-content', positionOrder: 47 },
          { divider: true, command: '', positionOrder: 48 },
          { iconCssClass: 'mdi mdi-close', title: 'Hide Column', titleKey: 'HIDE_COLUMN', command: 'hide-column', positionOrder: 59 }
        ];
        const commandDivElm = gridContainerDiv.querySelector('[data-command="column-resize-by-content"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual(headerMenuExpected);
        expect(commandIconElm.classList.contains('mdi-arrow-expand-horizontal')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Resize by Content');

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(pubSubSpy).toHaveBeenCalledWith('onHeaderMenuColumnResizeByContent', { columnId: 'field2' });
      });

      it('should populate Filter Shortcuts list with shortcuts as sub-menus when a shortcu list is provided and we should also expect the command to execute necessary callback', () => {
        columnsMock[0].filter = {
          filterShortcuts: [
            { title: 'Blank Values', searchTerms: ['A'], operator: '<', iconCssClass: 'mdi mdi-filter-minus-outline', },
            { title: 'Non-Blank Values', searchTerms: ['A'], operator: '>', iconCssClass: 'mdi mdi-filter-plus-outline', },
          ]
        };
        jest.spyOn(SharedService.prototype.slickGrid, 'getColumns').mockReturnValueOnce(columnsMock);
        jest.spyOn(SharedService.prototype.slickGrid, 'getColumnIndex').mockReturnValue(0);
        const setValueMock = jest.fn();
        const filterMock = { columnDef: columnsMock[0], setValues: setValueMock } as unknown as Filter;
        jest.spyOn(filterServiceStub, 'getFiltersMetadata').mockReturnValueOnce([filterMock]);

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate any column menus
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuExpected = [
          { command: 'freeze-columns', iconCssClass: 'mdi mdi-pin-outline', positionOrder: 45, title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', },
          { command: 'show-negative-numbers', cssClass: 'mdi mdi-lightbulb-on', tooltip: 'Highlight negative numbers.', },
          { command: 'column-resize-by-content', iconCssClass: 'mdi mdi-arrow-expand-horizontal', positionOrder: 47, title: 'Resize by Content', titleKey: 'COLUMN_RESIZE_BY_CONTENT', },
          { command: '', divider: true, positionOrder: 48, },
          {
            command: 'filter-shortcuts-root-menu',
            commandItems: [
              { command: 'blank-values', action: expect.any(Function), iconCssClass: 'mdi mdi-filter-minus-outline', operator: '<', searchTerms: ['A'], title: 'Blank Values', },
              { command: 'non-blank-values', action: expect.any(Function), iconCssClass: 'mdi mdi-filter-plus-outline', operator: '>', searchTerms: ['A'], title: 'Non-Blank Values', },
            ],
            iconCssClass: 'mdi mdi-filter-outline',
            positionOrder: 55,
            title: 'Filter Shortcuts',
            titleKey: 'FILTER_SHORTCUTS',
          },
          { command: '', divider: true, positionOrder: 56 },
          { command: 'hide-column', iconCssClass: 'mdi mdi-close', positionOrder: 59, title: 'Hide Column', titleKey: 'HIDE_COLUMN', },
        ];
        const shortcutSubMenuElm = gridContainerDiv.querySelector('[data-command="filter-shortcuts-root-menu"]') as HTMLDivElement;
        shortcutSubMenuElm!.dispatchEvent(new Event('mouseover'));
        const subCommandShortcut1 = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        const blankValueCommandElm = subCommandShortcut1.querySelector('[data-command="blank-values"]') as HTMLDivElement;
        const commandIconElm = subCommandShortcut1.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = subCommandShortcut1.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[0].header!.menu!.commandItems!).toEqual(headerMenuExpected);
        expect(commandIconElm.classList.contains('mdi-filter-minus-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Blank Values');

        const clickEvent = new Event('click');
        blankValueCommandElm.dispatchEvent(clickEvent);
        expect(setValueMock).toHaveBeenCalledWith(['A'], '<', true);
      });

      it('should expect only the "hide-column" command in the menu when "enableSorting" and "hideSortCommands" are set and also expect the command to execute necessary callback', () => {
        jest.spyOn(SharedService.prototype.slickGrid, 'getColumnIndex').mockReturnValue(1);
        jest.spyOn(SharedService.prototype.slickGrid, 'getColumns').mockReturnValue(columnsMock);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true, enableColumnResizeOnDoubleClick: false,
          headerMenu: { hideColumnHideCommand: false, hideSortCommands: true, }
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate hide column menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const autosizeSpy = jest.spyOn(gridStub, 'autosizeColumns');

        const headerMenuExpected = [
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
          { iconCssClass: 'mdi mdi-close', title: 'Hide Column', titleKey: 'HIDE_COLUMN', command: 'hide-column', positionOrder: 59 }
        ];
        const commandDivElm = gridContainerDiv.querySelector('[data-command="hide-column"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual(headerMenuExpected);
        expect(commandIconElm.classList.contains('mdi-close')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Hide Column');

        commandDivElm.dispatchEvent(new Event('click'));
        expect(autosizeSpy).toHaveBeenCalled();
      });

      it('should expect all menu related to Filtering when "enableFiltering" is set', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableFiltering: true,
          headerMenu: { hideFilterCommand: false, hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear filter menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearFilterSpy = jest.spyOn(filterServiceStub, 'clearFilterByColumnId');

        const headerMenuExpected = [{ iconCssClass: 'mdi mdi-filter-remove-outline', title: 'Remove Filter', titleKey: 'REMOVE_FILTER', command: 'clear-filter', positionOrder: 57 }];
        const commandDivElm = gridContainerDiv.querySelector('[data-command="clear-filter"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual(headerMenuExpected);
        expect(commandIconElm.classList.contains('mdi-filter-remove-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Remove Filter');

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(clearFilterSpy).toHaveBeenCalledWith(clickEvent, 'field2');
      });

      it('should expect all menu related to Sorting when "enableSorting" is set', () => {
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear sort menu
        const eventData = { ...new SlickEventData(), preventDefault: jest.fn() };
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearSortSpy = jest.spyOn(sortServiceStub, 'clearSortByColumnId');
        const commandDivElm = gridContainerDiv.querySelector('[data-command="clear-sort"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-sort-ascending', title: 'Sort Ascending', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 50 },
          { iconCssClass: 'mdi mdi-sort-descending', title: 'Sort Descending', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 51 },
          { divider: true, command: '', positionOrder: 52 },
          { iconCssClass: 'mdi mdi-sort-variant-off', title: 'Remove Sort', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 58 },
        ]);
        expect(commandIconElm.classList.contains('mdi-sort-variant-off')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Remove Sort');

        translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-sort-ascending', title: 'Trier par ordre croissant', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 50 },
          { iconCssClass: 'mdi mdi-sort-descending', title: 'Trier par ordre décroissant', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 51 },
          { divider: true, command: '', positionOrder: 52 },
          { iconCssClass: 'mdi mdi-sort-variant-off', title: 'Supprimer le tri', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 58 },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(clearSortSpy).toHaveBeenCalledWith(clickEvent, 'field2');
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect grid "setOptions" method to be called with current column position', () => {
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColSpy = jest.spyOn(gridStub, 'setColumns');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear sort menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
        ]);
        expect(commandIconElm.classList.contains('mdi-pin-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Freeze Columns');

        translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Geler les colonnes', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 1, enableMouseWheelScrollHandler: true }, false, true);
        expect(setColSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect grid "setOptions" method to be called with frozen column of -1 because the column found is not visible', () => {
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColSpy = jest.spyOn(gridStub, 'setColumns');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[2], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect(columnsMock[2].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, enableMouseWheelScrollHandler: true }, false, true);
        expect(setColSpy).toHaveBeenCalledWith(columnsMock);
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect "setColumns" to be called with same as original even when the column definitions list did not change', () => {
        const originalColumnDefinitions = [{ id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' }, { id: 'field2', field: 'field2', width: 75 }];
        const setOptionsSpy = jest.spyOn(gridStub, 'setOptions');
        const setColSpy = jest.spyOn(gridStub, 'setColumns');
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnDefinitions);
        jest.spyOn(SharedService.prototype, 'visibleColumns', 'get').mockReturnValue(originalColumnDefinitions);
        jest.spyOn(SharedService.prototype, 'hasColumnsReordered', 'get').mockReturnValue(false);
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: originalColumnDefinitions, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: originalColumnDefinitions[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect((originalColumnDefinitions[1] as any).header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-pin-outline', title: 'Freeze Columns', titleKey: 'FREEZE_COLUMNS', command: 'freeze-columns', positionOrder: 45 },
          { divider: true, command: '', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 0, enableMouseWheelScrollHandler: true }, false, true);
        expect(setColSpy).toHaveBeenCalledWith(originalColumnDefinitions);
      });

      it('should trigger the command "sort-asc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = jest.spyOn(sortServiceStub, 'onBackendSortChanged');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="sort-asc"]') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-sort-ascending', title: 'Sort Ascending', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 50 },
          { iconCssClass: 'mdi mdi-sort-descending', title: 'Sort Descending', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 51 },
          { divider: true, command: '', positionOrder: 52 },
          { iconCssClass: 'mdi mdi-sort-variant-off', title: 'Remove Sort', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 58 },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = jest.spyOn(sortServiceStub, 'onBackendSortChanged');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="sort-desc"]') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          { iconCssClass: 'mdi mdi-sort-ascending', title: 'Sort Ascending', titleKey: 'SORT_ASCENDING', command: 'sort-asc', positionOrder: 50 },
          { iconCssClass: 'mdi mdi-sort-descending', title: 'Sort Descending', titleKey: 'SORT_DESCENDING', command: 'sort-desc', positionOrder: 51 },
          { divider: true, command: '', positionOrder: 52 },
          { iconCssClass: 'mdi mdi-sort-variant-off', title: 'Remove Sort', titleKey: 'REMOVE_SORT', command: 'clear-sort', positionOrder: 58 },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onLocalSortChanged" being called without the sorted column', () => {
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(dataViewStub);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const localSortSpy = jest.spyOn(sortServiceStub, 'onLocalSortChanged');
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true, backendServiceApi: undefined,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        gridContainerDiv.querySelector('[data-command="sort-desc"]')!.dispatchEvent(new Event('click'));
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(previousSortSpy).toHaveBeenCalled();
        expect(localSortSpy).toHaveBeenCalledWith(gridStub, mockSortedOuput);
        expect(setSortSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect "onSort" event triggered when no DataView is provided', () => {
        jest.spyOn(SharedService.prototype, 'dataView', 'get').mockReturnValue(undefined as any);
        const mockSortedCols: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } }];
        const mockSortedOuput: ColumnSort[] = [{ columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } }, { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } }];
        const previousSortSpy = jest.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const setSortSpy = jest.spyOn(SharedService.prototype.slickGrid, 'setSortColumns');
        const gridSortSpy = jest.spyOn(gridStub.onSort, 'notify');
        jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock, enableSorting: true, backendServiceApi: undefined,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true, }
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        gridContainerDiv.querySelector('[data-command="sort-desc"]')!.dispatchEvent(new Event('click'));
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(previousSortSpy).toHaveBeenCalled();
        expect(gridSortSpy).toHaveBeenCalledWith(mockSortedOuput);
        expect(setSortSpy).toHaveBeenCalled();
      });
    });
  });
});