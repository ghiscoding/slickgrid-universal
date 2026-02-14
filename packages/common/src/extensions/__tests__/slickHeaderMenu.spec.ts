import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SlickEvent, SlickEventData, type SlickDataView, type SlickGrid } from '../../core/index.js';
import { ExtensionUtility } from '../../extensions/extensionUtility.js';
import type { Column, ColumnSort, ElementPosition, Filter, GridOption, HeaderButtonsOrMenu, HeaderMenuItems, MenuCommandItem } from '../../interfaces/index.js';
import { BackendUtilityService, SharedService, type FilterService, type SortService } from '../../services/index.js';
import { SlickHeaderMenu } from '../slickHeaderMenu.js';

const removeExtraSpaces = (inputText: string) => `${inputText}`.replace(/[\n\r]\s+/g, '');

const mockEventCallback = () => {};
const gridOptionsMock = {
  enableAutoSizeColumns: true,
  enableColumnResizeOnDoubleClick: true,
  enableHeaderMenu: true,
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
  headerMenu: {
    buttonCssClass: 'mdi mdi-chevron-down',
    hideFreezeColumnsCommand: false,
    hideColumnResizeByContentCommand: false,
    hideForceFitButton: false,
    hideSyncResizeButton: true,
    onExtensionRegistered: vi.fn(),
    onCommand: mockEventCallback,
  },
  multiColumnSort: true,
  pagination: {
    totalItems: 0,
  },
  showHeaderRow: false,
  showTopPanel: false,
  showPreHeaderPanel: false,
} as unknown as GridOption;

const gridStub = {
  autosizeColumns: vi.fn(),
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getContainerNode: vi.fn(),
  getFrozenColumnId: vi.fn(),
  getGridPosition: () => ({ width: 10, left: 0 }),
  getVisibleColumns: vi.fn(),
  getUID: () => 'slickgrid12345',
  getOptions: () => gridOptionsMock,
  registerPlugin: vi.fn(),
  sanitizeHtmlString: (str: string) => str,
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSortColumns: vi.fn(),
  updateColumnHeader: vi.fn(),
  updateColumnById: vi.fn(),
  updateColumns: vi.fn(),
  validateColumnFreezeWidth: vi.fn(),
  validateColumnFreeze: vi.fn(),
  onBeforeSetColumns: new SlickEvent(),
  onBeforeHeaderCellDestroy: new SlickEvent(),
  onClick: new SlickEvent(),
  onHeaderCellRendered: new SlickEvent(),
  onHeaderMouseEnter: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

const dataViewStub = {
  refresh: vi.fn(),
} as unknown as SlickDataView;

const filterServiceStub = {
  clearFilterByColumnId: vi.fn(),
  clearFilters: vi.fn(),
  getFiltersMetadata: vi.fn(),
} as unknown as FilterService;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  subscribeEvent: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const sortServiceStub = {
  clearSortByColumnId: vi.fn(),
  clearSorting: vi.fn(),
  emitSortChanged: vi.fn(),
  getCurrentColumnSorts: vi.fn(),
  onBackendSortChanged: vi.fn(),
  onLocalSortChanged: vi.fn(),
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
      },
    ],
  } as HeaderMenuItems,
} as HeaderButtonsOrMenu;

const columnsMock: Column[] = [
  { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: headerMock },
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
    sharedService.slickGrid = gridStub;
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue(columnsMock);
    vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(columnsMock.slice(0, 2));
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
      subMenuOpenByEvent: 'mouseover',
    });
  });

  it('should be able to change Header Menu options', () => {
    plugin.init();
    plugin.addonOptions = {
      buttonCssClass: 'some-class',
    };

    expect(plugin.addonOptions).toEqual({
      buttonCssClass: 'some-class',
    });
  });

  describe('plugins - Header Menu', () => {
    let gridContainerDiv: HTMLDivElement;
    let headerDiv: HTMLDivElement;
    let headersDiv: HTMLDivElement;
    let parentContainer: HTMLDivElement;

    beforeEach(() => {
      sharedService.slickGrid = gridStub;
      if (columnsMock[0].header!.menu?.commandItems?.length) {
        columnsMock[0].header!.menu!.commandItems![1] = undefined as any;
        columnsMock[0].header!.menu!.commandItems![1] = {
          cssClass: 'mdi mdi-lightbulb-on',
          command: 'show-negative-numbers',
          tooltip: 'Highlight negative numbers.',
        } as MenuCommandItem;
      }
      gridStub.updateColumnById = (columnId, props) => {
        const column = columnsMock.find((col) => col.id === columnId);
        if (column) {
          Object.assign(column, props);
        }
      };
      headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';
      gridContainerDiv = document.createElement('div');
      gridContainerDiv.className = 'slickgrid-container';
      headersDiv = document.createElement('div');
      headersDiv.className = 'slick-header-columns';
      headersDiv.appendChild(headerDiv);
      gridContainerDiv.appendChild(headersDiv);
      parentContainer = document.createElement('div');
      parentContainer.appendChild(gridContainerDiv);
      document.body.appendChild(parentContainer);
      sharedService.gridContainerElement = parentContainer;
      vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
      vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as ElementPosition);
    });

    afterEach(() => {
      plugin.dispose();
    });

    it('should populate a Header Menu button with extra button css classes when header menu option "buttonCssClass" and cell is being rendered', () => {
      plugin.dispose();
      plugin.init({ buttonCssClass: 'mdi mdi-chevron-down' });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(`<div class="slick-header-menu-button mdi mdi-chevron-down" aria-label="Header Menu"></div>`)
      );
    });

    it('should populate a Header Menu button with extra tooltip title attribute when header menu option "tooltip" and cell is being rendered', () => {
      plugin.dispose();
      plugin.init({ tooltip: 'some tooltip text' });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(`<div class="slick-header-menu-button" aria-label="Header Menu" title="some tooltip text"></div>`)
      );
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility callback returns undefined', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(`<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));

      gridStub.onBeforeHeaderCellDestroy.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      expect(headerDiv.innerHTML).toBe('');
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility callback returns false', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(`<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));
    });

    it('should populate a Header Menu when cell is being rendered and a 2nd button item visibility & usability callbacks returns true', () => {
      plugin.dispose();
      plugin.init({ hideFreezeColumnsCommand: false, hideFilterCommand: false });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;

      // add Header Menu which is visible
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(`<div class="slick-header-menu-button" aria-label="Header Menu"></div>`));
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should populate a Header Menu and a 2nd button item usability callback returns false and expect button to be disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;
      const publishSpy = vi.spyOn(pubSubServiceStub, 'publish');

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button:nth-child(1)') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item slick-menu-item-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );

      commandElm.dispatchEvent(new Event('click'));
      expect(publishSpy).not.toHaveBeenCalledWith('onHeaderMenuCommand');
    });

    it('should populate a Header Menu and a 2nd button is "disabled" and expect button to be disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = undefined;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item slick-menu-item-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should populate a Header Menu and expect button to be disabled when command property is disabled', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).hidden = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-hidden') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item slick-menu-item-hidden mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should populate a Header Menu and a 2nd button and property "tooltip" is filled and expect button to include a "title" attribute for the tooltip', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).tooltip = 'Some Tooltip';

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Some Tooltip">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should populate a Header Menu and a 2nd button and expect the button click handler & action callback to be executed when defined', () => {
      const actionMock = vi.fn();

      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).action = actionMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      const clickEvent = new Event('click', { bubbles: true, cancelable: true, composed: false });
      headerButtonElm.dispatchEvent(clickEvent);
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );

      gridContainerDiv
        .querySelector('.slick-menu-item.mdi-lightbulb-on')!
        .dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      expect(actionMock).toHaveBeenCalledWith(clickEvent, {
        command: 'show-negative-numbers',
        item: columnsMock[0].header!.menu!.commandItems![1],
        column: columnsMock[0],
        grid: gridStub,
      });
      expect(headerDiv.querySelector('.slick-header-menu-button')!.innerHTML).toBe('');
    });

    it('should populate a Header Menu and a 2nd button and expect the "onCommand" handler to be executed when defined', () => {
      const onCommandMock = vi.fn();

      plugin.dispose();
      plugin.init();
      plugin.addonOptions.onCommand = onCommandMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );

      gridContainerDiv
        .querySelector('.slick-menu-item.mdi-lightbulb-on')!
        .dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      expect(onCommandMock).toHaveBeenCalled();
      expect(headerDiv.querySelector('.slick-header-menu-button')!.innerHTML).toBe('');
    });

    it('should populate a Header Menu and a 2nd button is "disabled" but still expect the button NOT to be disabled because the "itemUsabilityOverride" has priority over the "disabled" property', () => {
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true });

      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should "autoAlign" and expect menu to aligned left with a calculate offset when showing menu', () => {
      plugin.dispose();
      plugin.init({ autoAlign: true });

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
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
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );
    });

    it('should not populate a Header Menu when 2nd button item visibility callback returns false', () => {
      plugin.dispose();
      plugin.init();
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => false;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button:nth-child(1)') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item.slick-menu-item-disabled') as HTMLDivElement;

      expect(commandElm).toBeFalsy();
    });

    it('should not populate a Header Menu when "menuUsabilityOverride" is defined and returns False', () => {
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true });

      plugin.dispose();
      plugin.init({ menuUsabilityOverride: () => false });
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemVisibilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).itemUsabilityOverride = () => true;
      (columnsMock[0].header!.menu!.commandItems![1] as MenuCommandItem).disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;

      expect(headerButtonElm).toBeFalsy();
    });

    it('should open the Header Menu and then expect it to hide when clicking anywhere in the DOM body', () => {
      const hideMenuSpy = vi.spyOn(plugin, 'hideMenu');
      vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableSorting: true });

      plugin.dispose();
      plugin.init();

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
      headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
      const commandElm = gridContainerDiv.querySelector('.slick-menu-item[data-command="show-negative-numbers"]') as HTMLDivElement;

      expect(commandElm).toBeTruthy();
      expect(removeExtraSpaces(commandElm.outerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-menu-item mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers.">
            <div class="slick-menu-icon">◦</div>
            <span class="slick-menu-content"></span>
          </li>`
        )
      );

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
        vi.clearAllMocks();
        columnsMock[0].header!.menu = undefined;
        columnsMock[1].header!.menu = undefined;
        columnsMock[2].header!.menu = undefined;
        const mockColumn = { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE', sortable: true, filterable: true } as any;
        vi.spyOn(SharedService.prototype, 'columnDefinitions', 'get').mockReturnValue([mockColumn]);
        vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(columnsMock);
      });

      it('should call hideColumn and expect "visibleColumns" to be updated accordingly', () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        sharedService.slickGrid = gridStub;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnResizeByContentCommand: true },
        });
        vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
        vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const updateColumnsSpy = vi.spyOn(gridStub, 'updateColumns');
        const setOptionSpy = vi.spyOn(gridStub, 'setOptions');

        plugin.hideColumn(columnsMock[1]);

        expect(setOptionSpy).not.toHaveBeenCalled();
        expect(updateColumnsSpy).toHaveBeenCalledWith();
        expect(columnsMock[1].hidden).toBeTruthy();
        expect(pubSubSpy).toHaveBeenCalledWith('onHideColumns', { columns: columnsMock, hiddenColumn: columnsMock[1] });
      });

      it('should call hideColumn and expect "setOptions" to be called with new "frozenColumn" index when the grid is detected to be a frozen grid', () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        sharedService.slickGrid = gridStub;
        sharedService.frozenVisibleColumnId = 'field1';
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          frozenColumn: 1,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnResizeByContentCommand: true },
        });

        vi.spyOn(gridStub, 'validateColumnFreeze').mockReturnValueOnce(true);
        vi.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        const updateColumnsSpy = vi.spyOn(gridStub, 'updateColumns');

        plugin.hideColumn(columnsMock[1]);

        expect(updateColumnsSpy).toHaveBeenCalled();
        expect(columnsMock[1].hidden).toBeTruthy();
        expect(pubSubSpy).toHaveBeenCalledWith('onHideColumns', { columns: columnsMock, hiddenColumn: columnsMock[1] });
      });
    });

    describe('with sub-menus', () => {
      let columnsMock: Column[];

      beforeEach(() => {
        columnsMock = [
          { id: 'field1', field: 'field1', name: 'Field 1', width: 100 },
          {
            id: 'field3',
            field: 'field3',
            name: 'Field 3',
            columnGroup: 'Billing',
            header: {
              menu: {
                commandItems: [
                  { command: 'help', title: 'Help', textCssClass: 'red bold' },
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
                  {
                    command: 'sub-commands3',
                    title: 'Sub Commands 3',
                    commandItems: [{ command: 'command33', title: 'Command 33', positionOrder: 70 }],
                  },
                ],
              },
            },
            width: 75,
          },
        ] as Column[];
      });

      it('should create Header Menu item with commands sub-menu commandItems and expect sub-menu list to show in the DOM element aligned left when sub-menu is clicked', () => {
        const onCommandMock = vi.fn();
        const subCommand33ActionMock = vi.fn();
        const disposeSubMenuSpy = vi.spyOn(plugin, 'disposeSubMenus');
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);

        plugin.init({ autoAlign: true });
        plugin.addonOptions.onCommand = onCommandMock;
        ((columnsMock[1].header!.menu!.commandItems![2] as MenuCommandItem).commandItems![0] as MenuCommandItem).action = subCommand33ActionMock;

        const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
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
        expect(subMenuTitleElm.className).toBe('slick-menu-title color-warning');
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
        expect(subCommand33ActionMock).toHaveBeenCalledWith(command33ClickEvent, {
          command: 'command33',
          item: (columnsMock[1].header!.menu!.commandItems![2] as MenuCommandItem).commandItems![0],
          column: columnsMock[1],
          grid: gridStub,
        });
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(3);

        // calling another command on parent menu should dispose sub-menus
        helpCommandElm!.dispatchEvent(new Event('mouseover'));
        expect(disposeSubMenuSpy).toHaveBeenCalledTimes(4);
      });

      it('should create a Header Menu item with commands sub-menu commandItems and expect sub-menu list to show in the DOM element align right when sub-menu is clicked', () => {
        const onCommandMock = vi.fn();
        const disposeSubMenuSpy = vi.spyOn(plugin, 'disposeSubMenus');
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);

        plugin.init({ autoAlign: true, subItemChevronClass: 'mdi mdi-chevron-right' });
        plugin.addonOptions.onCommand = onCommandMock;

        const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
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
        expect(subMenuTitleElm.className).toBe('slick-menu-title color-warning');
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

      it('should create a Header Menu item with commands sub-menu commandItems and expect sub-menu to be positioned on top (dropup)', () => {
        const hideMenuSpy = vi.spyOn(plugin, 'hideMenu');
        const onCommandMock = vi.fn();
        Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 50 });
        vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(columnsMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          darkMode: true,
        });

        plugin.init({ autoAlign: true });
        plugin.addonOptions.onCommand = onCommandMock;

        const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
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
        plugin.repositionMenu(divEvent1 as any, headerMenu1Elm, undefined, plugin.addonOptions);
        const headerMenu2Elm = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;
        Object.defineProperty(headerMenu2Elm, 'offsetHeight', { writable: true, configurable: true, value: 320 });

        const divEvent = new MouseEvent('click', { bubbles: true, cancelable: true, composed: false });
        const subMenuElm = document.createElement('div');
        const menuItem = document.createElement('div');
        menuItem.className = 'slick-menu-item';
        menuItem.style.top = '465px';
        vi.spyOn(menuItem, 'getBoundingClientRect').mockReturnValue({ top: 465, left: 25 } as any);
        Object.defineProperty(menuItem, 'target', { writable: true, configurable: true, value: menuItem });
        subMenuElm.className = 'slick-submenu';
        Object.defineProperty(divEvent, 'target', { writable: true, configurable: true, value: subMenuElm });
        menuItem.appendChild(subMenuElm);

        parentContainer.classList.add('slickgrid-container');
        plugin.repositionMenu(divEvent as any, headerMenu2Elm, undefined, plugin.addonOptions);
        const headerMenu2Elm2 = document.body.querySelector('.slick-header-menu.slick-menu-level-1') as HTMLDivElement;

        expect(headerMenu2Elm2.classList.contains('dropup')).toBeTruthy();
        expect(headerMenu2Elm2.classList.contains('dropdown')).toBeFalsy();
        expect(headerMenu2Elm2.classList.contains('slick-dark-mode')).toBeTruthy();

        // cell click should close it
        gridStub.onClick.notify({ row: 1, cell: 2, grid: gridStub }, eventData as any, gridStub);

        expect(hideMenuSpy).toHaveBeenCalled();
      });
    });

    describe('with slot renderer', () => {
      let gridContainerDiv: HTMLDivElement;
      let headerDiv: HTMLDivElement;
      let headersDiv: HTMLDivElement;
      let parentContainer: HTMLDivElement;
      let eventData: SlickEventData;

      beforeEach(() => {
        headerDiv = document.createElement('div');
        headerDiv.className = 'slick-header-column';
        headersDiv = document.createElement('div');
        headersDiv.className = 'slick-header-columns';
        headersDiv.appendChild(headerDiv);
        gridContainerDiv = document.createElement('div');
        gridContainerDiv.className = 'slickgrid-container';
        gridContainerDiv.appendChild(headersDiv);
        parentContainer = document.createElement('div');
        parentContainer.appendChild(gridContainerDiv);
        document.body.appendChild(parentContainer);
        sharedService.gridContainerElement = parentContainer;
        vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(gridContainerDiv);
        vi.spyOn(gridStub, 'getGridPosition').mockReturnValue({ top: 10, bottom: 5, left: 15, right: 22, width: 225 } as any);
        eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as any;
      });

      afterEach(() => {
        parentContainer?.remove();
      });

      it('should render menu item with slotRenderer returning HTMLElement', () => {
        const mockSlotRenderer = vi.fn((item: any) => {
          const div = document.createElement('div');
          div.className = 'custom-slot-content';
          div.textContent = `Custom: ${item.title}`;
          return div;
        });

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] as any };
        plugin.init(columnsMock as any);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const customSlotElm = commandListElm?.querySelector('.custom-slot-content') as any;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(customSlotElm).toBeTruthy();
        expect(customSlotElm?.textContent).toBe('Custom: Test Command');
      });

      it('should render menu item with slotRenderer returning string', () => {
        const mockSlotRenderer = vi.fn((item: any) => `<span class="custom-string">String: ${item.title}</span>`);

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] as any };
        plugin.init(columnsMock as any);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const customSlotElm = commandListElm?.querySelector('.custom-string') as any;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(customSlotElm).toBeTruthy();
        expect(customSlotElm?.textContent).toContain('String: Test Command');
      });

      it('should render menu item with defaultMenuItemRenderer when item has no slotRenderer', () => {
        const mockDefaultRenderer = vi.fn((item: any) => {
          const div = document.createElement('div');
          div.className = 'default-renderer-content';
          div.textContent = `Default: ${item.title}`;
          return div;
        });

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command' }] as any };
        plugin.init(columnsMock as any);
        plugin.addonOptions.defaultMenuItemRenderer = mockDefaultRenderer as any;
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const defaultRendererElm = commandListElm?.querySelector('.default-renderer-content') as any;

        expect(mockDefaultRenderer).toHaveBeenCalled();
        expect(defaultRendererElm).toBeTruthy();
        expect(defaultRendererElm?.textContent).toBe('Default: Test Command');
      });

      it('should prioritize item slotRenderer over defaultMenuItemRenderer', () => {
        const mockSlotRenderer = vi.fn((item: any) => {
          const div = document.createElement('div');
          div.className = 'slot-prioritized';
          div.textContent = 'Slot renderer prioritized';
          return div;
        });
        const mockDefaultRenderer = vi.fn();

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] as any };
        plugin.init(columnsMock as any);
        plugin.addonOptions.defaultMenuItemRenderer = mockDefaultRenderer as any;
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const slotRendererElm = commandListElm?.querySelector('.slot-prioritized') as any;

        expect(mockSlotRenderer).toHaveBeenCalled();
        expect(slotRendererElm).toBeTruthy();
        expect(slotRendererElm?.textContent).toBe('Slot renderer prioritized');
      });

      it('should pass correct arguments (item and args) to slotRenderer callback', () => {
        const mockSlotRenderer = vi.fn((item: any, args: any) => {
          const div = document.createElement('div');
          div.className = 'renderer-args-test';
          div.textContent = `Item: ${item.command}, Grid: ${args?.grid ? 'present' : 'missing'}`;
          return div;
        });

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command with Args', slotRenderer: mockSlotRenderer }] as any };
        plugin.init(columnsMock as any);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        expect(mockSlotRenderer).toHaveBeenCalled();
        const callArgs = mockSlotRenderer.mock.calls[0];
        expect(callArgs[0].command).toBe('test-cmd');
        expect(callArgs[1]).toBeDefined();
        expect(callArgs[1].grid).toBe(gridStub);
      });

      it('should call slotRenderer with click event as third argument when menu item is clicked', () => {
        const mockSlotRenderer = vi.fn((item: any, args: any, event?: Event) => {
          const div = document.createElement('div');
          div.className = 'click-test';
          return div;
        });

        columnsMock[1].header!.menu = { commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer }] as any };
        plugin.init(columnsMock as any);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const menuItemElm = commandListElm?.querySelector('.slick-menu-item') as any;

        // Click the menu item
        menuItemElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

        // Verify slotRenderer was called with the click event as the third argument
        expect(mockSlotRenderer).toHaveBeenCalledTimes(2); // once for render, once for click
        const clickCallArgs = mockSlotRenderer.mock.calls[1]; // second call is from click
        expect(clickCallArgs[2]).toBeDefined();
        expect(clickCallArgs[2]!.type).toBe('click');
      });

      it('should not trigger menu action when slotRenderer calls preventDefault on click event', () => {
        const mockAction = vi.fn();
        const mockSlotRenderer = vi.fn((item: any, args: any, event?: Event) => {
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

        columnsMock[1].header!.menu = {
          commandItems: [{ command: 'test-cmd', title: 'Test Command', slotRenderer: mockSlotRenderer, action: mockAction }] as any,
        };
        plugin.init(columnsMock as any);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as any;
        headerButtonElm?.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuElm = gridContainerDiv.querySelector('.slick-header-menu') as any;
        const commandListElm = headerMenuElm?.querySelector('.slick-menu-command-list') as any;
        const menuItemElm = commandListElm?.querySelector('.slick-menu-item') as any;
        const buttonElm = menuItemElm?.querySelector('button') as HTMLButtonElement;

        // Click the button inside the slotRenderer, which calls preventDefault
        buttonElm?.click();

        // Verify the action callback was not called because preventDefault was called
        expect(mockAction).not.toHaveBeenCalled();
      });
    });

    describe('Internal Custom Commands', () => {
      let eventData: SlickEventData;

      beforeEach(() => {
        columnsMock[1].header!.menu = undefined;
        columnsMock[2].header!.menu = undefined;
        headerDiv = document.createElement('div');
        headerDiv.className = 'slick-header-column';
        eventData = { ...new SlickEventData(), preventDefault: vi.fn() } as unknown as SlickEventData;
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect grid "setOptions" method to be called with current column position', async () => {
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: {
            hideCommands: ['column-resize-by-content', 'hide-column'],
          },
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
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);
        expect(commandIconElm.classList.contains('mdi-pin-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Freeze Columns');

        await translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Geler les colonnes',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 1, enableMouseWheelScrollHandler: true }, false, true);
        expect(gridStub.setColumns).toHaveBeenCalledWith(columnsMock);
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect grid "setOptions" method to be called with current column position', async () => {
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
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
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);
        expect(commandIconElm.classList.contains('mdi-pin-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Freeze Columns');

        await translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Geler les colonnes',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 1, enableMouseWheelScrollHandler: true }, false, true);
        expect(gridStub.setColumns).toHaveBeenCalledWith(columnsMock);
      });

      it('should expect menu related to Unfreeze Columns when "hideFreezeColumnsCommand" is disabled and column is already frozen to that index and then also expect grid "setOptions" method to be called with current column position', async () => {
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          // @deprecated `hideXYZ`, replace by `hideCommands` in next major
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
          frozenColumn: 1,
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear sort menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="unfreeze-columns"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-off-outline',
            title: 'Unfreeze Columns',
            titleKey: 'UNFREEZE_COLUMNS',
            command: 'unfreeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);
        expect(commandIconElm.classList.contains('mdi-pin-off-outline')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Unfreeze Columns');

        await translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-off-outline',
            title: 'Dégeler les colonnes',
            titleKey: 'UNFREEZE_COLUMNS',
            command: 'unfreeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, enableMouseWheelScrollHandler: true }, false, true);
        expect(gridStub.setColumns).toHaveBeenCalledWith(columnsMock);
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect grid "setOptions" method to be called with frozen column of -1 because the column found is not visible', () => {
        sharedService.hasColumnsReordered = true;
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          // @deprecated `hideXYZ`, replace by `hideCommands` in next major
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });
        vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ frozenColumn: -1 } as GridOption);

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[2], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect(columnsMock[2].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: -1, enableMouseWheelScrollHandler: true }, false, true);
        expect(updateColumnSpy).toHaveBeenCalled();
      });

      it('should expect menu to show and "onBeforeMenuShow" callback to run when defined', () => {
        const originalColumnDefinitions = [
          { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', width: 75 },
        ];
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnDefinitions);
        vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(originalColumnDefinitions);
        sharedService.hasColumnsReordered = true;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          // @deprecated `hideXYZ`, replace by `hideCommands` in next major
          headerMenu: {
            hideFreezeColumnsCommand: false,
            hideColumnHideCommand: true,
            hideColumnResizeByContentCommand: true,
          },
        });

        plugin.init({ onBeforeMenuShow: () => false });
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: originalColumnDefinitions, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: originalColumnDefinitions[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect((originalColumnDefinitions[1] as any).header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);
        expect(commandDivElm).toBeFalsy();
      });

      it('should expect menu to show and "onAfterMenuShow" callback to run when defined', () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableFiltering: true,
          // @deprecated `hideXYZ`, replace by `hideCommands` in next major
          headerMenu: { hideFilterCommand: false, hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        plugin.init({ onAfterMenuShow: () => false });
        const onAfterSpy = vi.spyOn(plugin.addonOptions, 'onAfterMenuShow');
        (onAfterSpy as Mock).mockReturnValue(false);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearFilterSpy = vi.spyOn(filterServiceStub, 'clearFilterByColumnId');

        const headerMenuExpected = [
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-filter-remove-outline',
            title: 'Remove Filter',
            titleKey: 'REMOVE_FILTER',
            command: 'clear-filter',
            positionOrder: 57,
            action: expect.any(Function),
          },
        ];
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
          column: columnsMock[1],
        });
      });

      it('should have the commands "column-resize-by-content" and "hide-column" in the header menu list and also expect the command to execute necessary callback', () => {
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnResizeByContentCommand: false },
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate any column menus
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        const headerMenuExpected = [
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-arrow-expand-horizontal',
            title: 'Resize by Content',
            titleKey: 'COLUMN_RESIZE_BY_CONTENT',
            command: 'column-resize-by-content',
            positionOrder: 47,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-close',
            title: 'Hide Column',
            titleKey: 'HIDE_COLUMN',
            command: 'hide-column',
            positionOrder: 59,
            action: expect.any(Function),
          },
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
            { title: 'Blank Values', searchTerms: ['A'], operator: '<', iconCssClass: 'mdi mdi-filter-minus-outline' },
            { title: 'Non-Blank Values', searchTerms: ['A'], operator: '>', iconCssClass: 'mdi mdi-filter-plus-outline' },
          ],
        };
        vi.spyOn(sharedService.slickGrid, 'getColumns').mockReturnValueOnce(columnsMock);
        vi.spyOn(sharedService.slickGrid, 'getColumnIndex').mockReturnValue(0);
        const setValueMock = vi.fn();
        const filterMock = { columnDef: columnsMock[0], setValues: setValueMock } as unknown as Filter;
        vi.spyOn(filterServiceStub, 'getFiltersMetadata').mockReturnValueOnce([filterMock]);

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate any column menus
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const headerMenuExpected = [
          {
            _orgTitle: '',
            command: 'freeze-columns',
            iconCssClass: 'mdi mdi-pin-outline',
            positionOrder: 45,
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            action: expect.any(Function),
          },
          { command: 'show-negative-numbers', cssClass: 'mdi mdi-lightbulb-on', tooltip: 'Highlight negative numbers.' },
          {
            _orgTitle: '',
            command: 'column-resize-by-content',
            iconCssClass: 'mdi mdi-arrow-expand-horizontal',
            positionOrder: 47,
            title: 'Resize by Content',
            titleKey: 'COLUMN_RESIZE_BY_CONTENT',
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
          {
            _orgTitle: '',
            command: 'filter-shortcuts-root-menu',
            commandItems: [
              {
                command: 'blank-values',
                action: expect.any(Function),
                iconCssClass: 'mdi mdi-filter-minus-outline',
                operator: '<',
                searchTerms: ['A'],
                title: 'Blank Values',
              },
              {
                command: 'non-blank-values',
                action: expect.any(Function),
                iconCssClass: 'mdi mdi-filter-plus-outline',
                operator: '>',
                searchTerms: ['A'],
                title: 'Non-Blank Values',
              },
            ],
            iconCssClass: 'mdi mdi-filter-outline',
            positionOrder: 55,
            title: 'Filter Shortcuts',
            titleKey: 'FILTER_SHORTCUTS',
          },
          { divider: true, command: 'divider-3', positionOrder: 56 },
          {
            _orgTitle: '',
            command: 'hide-column',
            iconCssClass: 'mdi mdi-close',
            positionOrder: 59,
            title: 'Hide Column',
            titleKey: 'HIDE_COLUMN',
            action: expect.any(Function),
          },
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
        vi.spyOn(sharedService.slickGrid, 'getColumnIndex').mockReturnValue(1);
        vi.spyOn(sharedService.slickGrid, 'getColumns').mockReturnValue(columnsMock);
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          enableColumnResizeOnDoubleClick: false,
          headerMenu: { hideColumnHideCommand: false, hideSortCommands: true },
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate hide column menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const autosizeSpy = vi.spyOn(gridStub, 'autosizeColumns');

        const headerMenuExpected = [
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-close',
            title: 'Hide Column',
            titleKey: 'HIDE_COLUMN',
            command: 'hide-column',
            positionOrder: 59,
            action: expect.any(Function),
          },
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
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableFiltering: true,
          headerMenu: { hideFilterCommand: false, hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear filter menu
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearFilterSpy = vi.spyOn(filterServiceStub, 'clearFilterByColumnId');

        const headerMenuExpected = [
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-filter-remove-outline',
            title: 'Remove Filter',
            titleKey: 'REMOVE_FILTER',
            command: 'clear-filter',
            positionOrder: 57,
            action: expect.any(Function),
          },
        ];
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
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        // calling `onBeforeSetColumns` 2x times shouldn't duplicate clear sort menu
        const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));
        const clearSortSpy = vi.spyOn(sortServiceStub, 'clearSortByColumnId');
        const commandDivElm = gridContainerDiv.querySelector('[data-command="clear-sort"]') as HTMLDivElement;
        const commandIconElm = commandDivElm.querySelector('.slick-menu-icon') as HTMLDivElement;
        const commandLabelElm = commandDivElm.querySelector('.slick-menu-content') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-ascending',
            title: 'Sort Ascending',
            titleKey: 'SORT_ASCENDING',
            command: 'sort-asc',
            positionOrder: 50,
            action: expect.any(Function),
          },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-descending',
            title: 'Sort Descending',
            titleKey: 'SORT_DESCENDING',
            command: 'sort-desc',
            positionOrder: 51,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-2', positionOrder: 52 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-variant-off',
            title: 'Remove Sort',
            titleKey: 'REMOVE_SORT',
            command: 'clear-sort',
            positionOrder: 58,
            action: expect.any(Function),
          },
        ]);
        expect(commandIconElm.classList.contains('mdi-sort-variant-off')).toBeTruthy();
        expect(commandLabelElm.textContent).toBe('Remove Sort');

        translateService.use('fr');
        plugin.translateHeaderMenu();
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-ascending',
            title: 'Trier par ordre croissant',
            titleKey: 'SORT_ASCENDING',
            command: 'sort-asc',
            positionOrder: 50,
            action: expect.any(Function),
          },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-descending',
            title: 'Trier par ordre décroissant',
            titleKey: 'SORT_DESCENDING',
            command: 'sort-desc',
            positionOrder: 51,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-2', positionOrder: 52 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-variant-off',
            title: 'Supprimer le tri',
            titleKey: 'REMOVE_SORT',
            command: 'clear-sort',
            positionOrder: 58,
            action: expect.any(Function),
          },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(clearSortSpy).toHaveBeenCalledWith(clickEvent, 'field2');
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect "updateColumns" to be called', () => {
        const originalColumnDefinitions = [
          { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', width: 75 },
        ];
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
        vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ frozenColumn: 0 } as GridOption);
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnDefinitions);
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(originalColumnDefinitions);
        sharedService.hasColumnsReordered = false;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: originalColumnDefinitions, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: originalColumnDefinitions[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect((originalColumnDefinitions[1] as any).header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 0, enableMouseWheelScrollHandler: true }, false, true);
        expect(updateColumnSpy).toHaveBeenCalled();
      });

      it('should expect menu related to Freeze Columns when "hideFreezeColumnsCommand" is disabled and also expect "updateColumns" to be called when hasColumnsReordered returns true', () => {
        const originalColumnDefinitions = [
          { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
          { id: 'field2', field: 'field2', width: 75 },
        ];
        const visibleColumnDefinitions = [
          { id: 'field2', field: 'field2', width: 75 },
          { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
        ];
        const setOptionsSpy = vi.spyOn(gridStub, 'setOptions');
        const updateColumnSpy = vi.spyOn(gridStub, 'updateColumns');
        vi.spyOn(gridStub, 'getOptions').mockReturnValueOnce({ frozenColumn: 0 } as GridOption);
        vi.spyOn(gridStub, 'getColumns').mockReturnValue(originalColumnDefinitions);
        vi.spyOn(gridStub, 'validateColumnFreezeWidth').mockReturnValue(true);
        vi.spyOn(gridStub, 'getVisibleColumns').mockReturnValue(visibleColumnDefinitions);
        sharedService.hasColumnsReordered = true;
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          headerMenu: { hideFreezeColumnsCommand: false, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: visibleColumnDefinitions, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: visibleColumnDefinitions[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="freeze-columns"]') as HTMLDivElement;
        expect((visibleColumnDefinitions[1] as any).header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-pin-outline',
            title: 'Freeze Columns',
            titleKey: 'FREEZE_COLUMNS',
            command: 'freeze-columns',
            positionOrder: 45,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-1', positionOrder: 48 },
        ]);

        commandDivElm.dispatchEvent(new Event('click')); // execute command
        expect(setOptionsSpy).toHaveBeenCalledWith({ frozenColumn: 0, enableMouseWheelScrollHandler: true }, false, true);
        expect(updateColumnSpy).toHaveBeenCalled();
      });

      it('should trigger the command "sort-asc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        const mockSortedCols: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const mockSortedOuput: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const previousSortSpy = vi.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = vi.spyOn(sortServiceStub, 'onBackendSortChanged');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="sort-asc"]') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-ascending',
            title: 'Sort Ascending',
            titleKey: 'SORT_ASCENDING',
            command: 'sort-asc',
            positionOrder: 50,
            action: expect.any(Function),
          },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-descending',
            title: 'Sort Descending',
            titleKey: 'SORT_DESCENDING',
            command: 'sort-desc',
            positionOrder: 51,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-2', positionOrder: 52 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-variant-off',
            title: 'Remove Sort',
            titleKey: 'REMOVE_SORT',
            command: 'clear-sort',
            positionOrder: 58,
            action: expect.any(Function),
          },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(sharedService.slickGrid.setSortColumns).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onBackendSortChanged" being called without the sorted column', () => {
        const mockSortedCols: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const mockSortedOuput: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const previousSortSpy = vi.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const backendSortSpy = vi.spyOn(sortServiceStub, 'onBackendSortChanged');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
        });

        gridStub.onBeforeSetColumns.notify({ previousColumns: [], newColumns: columnsMock, grid: gridStub }, eventData as any, gridStub);
        gridStub.onHeaderCellRendered.notify({ column: columnsMock[1], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
        const headerButtonElm = headerDiv.querySelector('.slick-header-menu-button') as HTMLDivElement;
        headerButtonElm.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

        const commandDivElm = gridContainerDiv.querySelector('[data-command="sort-desc"]') as HTMLDivElement;
        expect(columnsMock[1].header!.menu!.commandItems!).toEqual([
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-ascending',
            title: 'Sort Ascending',
            titleKey: 'SORT_ASCENDING',
            command: 'sort-asc',
            positionOrder: 50,
            action: expect.any(Function),
          },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-descending',
            title: 'Sort Descending',
            titleKey: 'SORT_DESCENDING',
            command: 'sort-desc',
            positionOrder: 51,
            action: expect.any(Function),
          },
          { divider: true, command: 'divider-2', positionOrder: 52 },
          {
            _orgTitle: '',
            iconCssClass: 'mdi mdi-sort-variant-off',
            title: 'Remove Sort',
            titleKey: 'REMOVE_SORT',
            command: 'clear-sort',
            positionOrder: 58,
            action: expect.any(Function),
          },
        ]);

        const clickEvent = new Event('click');
        commandDivElm.dispatchEvent(clickEvent);
        expect(previousSortSpy).toHaveBeenCalled();
        mockSortedOuput[1].sortCol = { ...columnsMock[1], ...mockSortedOuput[1].sortCol }; // merge with column header menu
        expect(backendSortSpy).toHaveBeenCalledWith(expect.anything(), { multiColumnSort: true, sortCols: mockSortedOuput, grid: gridStub });
        expect(sharedService.slickGrid.setSortColumns).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect Sort Service to call "onLocalSortChanged" being called without the sorted column', () => {
        sharedService.dataView = dataViewStub;
        const mockSortedCols: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const mockSortedOuput: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const previousSortSpy = vi.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const localSortSpy = vi.spyOn(sortServiceStub, 'onLocalSortChanged');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          backendServiceApi: undefined,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
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
        expect(sharedService.slickGrid.setSortColumns).toHaveBeenCalled();
      });

      it('should trigger the command "sort-desc" and expect "onSort" event triggered when no DataView is provided', () => {
        sharedService.dataView = undefined as any;
        const mockSortedCols: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: true, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const mockSortedOuput: ColumnSort[] = [
          { columnId: 'field1', sortAsc: true, sortCol: { id: 'field1', field: 'field1' } },
          { columnId: 'field2', sortAsc: false, sortCol: { id: 'field2', field: 'field2' } },
        ];
        const previousSortSpy = vi.spyOn(sortServiceStub, 'getCurrentColumnSorts').mockReturnValue([mockSortedCols[0]]);
        const gridSortSpy = vi.spyOn(gridStub.onSort, 'notify');
        vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({
          ...gridOptionsMock,
          enableSorting: true,
          backendServiceApi: undefined,
          headerMenu: { hideFreezeColumnsCommand: true, hideColumnHideCommand: true, hideColumnResizeByContentCommand: true },
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
        expect(gridStub.setSortColumns).toHaveBeenCalled();
      });
    });
  });
});
