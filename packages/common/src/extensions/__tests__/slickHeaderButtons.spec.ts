import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type { Column, GridOption } from '../../interfaces/index.js';
import { SlickHeaderButtons } from '../slickHeaderButtons.js';
import { BackendUtilityService } from '../../services/index.js';
import { SharedService } from '../../services/shared.service.js';
import { ExtensionUtility } from '../../extensions/extensionUtility.js';
import { SlickEvent, SlickEventData, type SlickGrid } from '../../core/index.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';

const removeExtraSpaces = (textS) => `${textS}`.replace(/[\n\r]\s+/g, '');

const gridStub = {
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getColumns: vi.fn(),
  getOptions: vi.fn(),
  getUID: () => 'slickgrid12345',
  registerPlugin: vi.fn(),
  setColumns: vi.fn(),
  updateColumnHeader: vi.fn(),
  onBeforeHeaderCellDestroy: new SlickEvent(),
  onHeaderCellRendered: new SlickEvent(),
  onHeaderMouseEnter: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

const headerMock = {
  buttons: [
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
};

const columnsMock: Column[] = [
  { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: headerMock },
  { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
  { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
];

describe('HeaderButton Plugin', () => {
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let plugin: SlickHeaderButtons;
  let sharedService: SharedService;
  const mockEventCallback = () => {};
  const gridOptionsMock = {
    enableHeaderButton: true,
    headerButton: {
      onExtensionRegistered: vi.fn(),
      onCommand: mockEventCallback,
    },
  } as GridOption;

  beforeEach(() => {
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    sharedService.slickGrid = gridStub;
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    plugin = new SlickHeaderButtons(extensionUtility, pubSubServiceStub, sharedService);
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
      buttonCssClass: 'slick-header-button',
    });
  });

  it('should be able to change Header Button options', () => {
    plugin.init();
    plugin.addonOptions = {
      buttonCssClass: 'some-class',
    };

    expect(plugin.addonOptions).toEqual({
      buttonCssClass: 'some-class',
    });
  });

  describe('plugins - Header Button', () => {
    beforeEach(() => {
      sharedService.slickGrid = gridStub;
      columnsMock[0].header!.buttons![1] = undefined as any;
      columnsMock[0].header!.buttons![1] = {
        cssClass: 'mdi mdi-lightbulb-on',
        command: 'show-negative-numbers',
        tooltip: 'Highlight negative numbers.',
      };
    });

    it('should populate 1x Header Button when cell is being rendered and a 2nd button item visibility callback returns undefined', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = () => undefined as any;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (only 1x)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(`<li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`)
      );

      gridStub.onBeforeHeaderCellDestroy.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      expect(headerDiv.innerHTML).toBe('');
    });

    it('should populate 1x Header Button when cell is being rendered and a 2nd button item visibility callback returns false', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (only 1x)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(`<li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`)
      );
    });

    it('should populate 2x Header Buttons when cell is being rendered and a 2nd button item visibility & usability callbacks returns true', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = () => true;
      columnsMock[0].header!.buttons![1].itemUsabilityOverride = () => true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
        <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
    });

    it('should populate 2x Header Buttons and a 2nd button item usability callback returns false and expect button to be disabled', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = () => true;
      columnsMock[0].header!.buttons![1].itemUsabilityOverride = () => false;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button slick-header-button-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
        <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
    });

    it('should populate 2x Header Buttons and a 2nd button is "disabled" and expect button to be disabled', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = undefined as any;
      columnsMock[0].header!.buttons![1].disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button slick-header-button-disabled mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
        <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
    });

    it('should populate 2x Header Buttons and a 2nd button and property "showOnHover" is enabled and expect button to be hidden until we hover it', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = undefined as any;
      columnsMock[0].header!.buttons![1].showOnHover = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button slick-header-button-hidden mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
        <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
    });

    it('should populate 2x Header Buttons and a 2nd button and a "handler" callback to be executed when defined', () => {
      const handlerMock = vi.fn();
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].handler = handlerMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
          <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
      expect(handlerMock).toHaveBeenCalled();
    });

    it('should populate 2x Header Buttons and a 2nd button and expect the button click handler & action callback to be executed when defined', () => {
      const actionMock = vi.fn();
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].action = actionMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
          <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
      expect(actionMock).toHaveBeenCalled();
    });

    it('should populate 2x Header Buttons and a 2nd button and expect the "onCommand" handler to be executed when defined', () => {
      const onCommandMock = vi.fn();
      const updateColSpy = vi.spyOn(gridStub, 'updateColumnHeader');
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      plugin.addonOptions.onCommand = onCommandMock;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on')!.dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
          <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
      expect(onCommandMock).toHaveBeenCalled();
      expect(updateColSpy).toHaveBeenCalledWith('field1');
    });

    it('should populate 2x Header Buttons and a 2nd button is "disabled" but still expect the button NOT to be disabled because the "itemUsabilityOverride" has priority over the "disabled" property', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header!.buttons![1].itemVisibilityOverride = () => true;
      columnsMock[0].header!.buttons![1].itemUsabilityOverride = () => true;
      delete columnsMock[0].header!.buttons![1].showOnHover;
      columnsMock[0].header!.buttons![1].disabled = true;

      const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData as any, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(
        removeExtraSpaces(
          `<li class="slick-header-button mdi mdi-lightbulb-on" role="menuitem" data-command="show-negative-numbers" title="Highlight negative numbers."></li>
        <li class="slick-header-button mdi mdi-lightbulb-outline" role="menuitem" data-command="show-positive-numbers"></li>`
        )
      );
    });
  });
});
