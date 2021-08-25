import { Column, GridOption, SlickGrid, SlickNamespace, } from '../../interfaces/index';
import { HeaderButtonPlugin } from '../headerButton.plugin';
import { PubSubService } from '../../services';
import { SharedService } from '../../services/shared.service';

declare const Slick: SlickNamespace;

const removeExtraSpaces = (textS) => `${textS}`.replace(/[\n\r]\s+/g, '');

const gridStub = {
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getColumns: jest.fn(),
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  setColumns: jest.fn(),
  updateColumnHeader: jest.fn(),
  onBeforeHeaderCellDestroy: new Slick.Event(),
  onHeaderCellRendered: new Slick.Event(),
  onHeaderMouseEnter: new Slick.Event(),
  onMouseEnter: new Slick.Event(),
} as unknown as SlickGrid;

const pubSubServiceStub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
} as PubSubService;

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
    }
  ]
};

const columnsMock: Column[] = [
  { id: 'field1', field: 'field1', name: 'Field 1', width: 100, header: headerMock },
  { id: 'field2', field: 'field2', name: 'Field 2', width: 75 },
  { id: 'field3', field: 'field3', name: 'Field 3', width: 75, columnGroup: 'Billing' },
];

describe('HeaderButton Plugin', () => {
  const consoleWarnSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
  let plugin: HeaderButtonPlugin;
  let sharedService: SharedService;
  const mockEventCallback = () => { };
  const gridOptionsMock = {
    enableHeaderButton: true,
    headerButton: {
      onExtensionRegistered: jest.fn(),
      onCommand: mockEventCallback
    }
  } as GridOption;

  beforeEach(() => {
    sharedService = new SharedService();
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    plugin = new HeaderButtonPlugin(pubSubServiceStub, sharedService);
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

    expect(plugin.options).toEqual({
      buttonCssClass: 'slick-header-button',
    });
  });

  it('should be able to change Header Button options', () => {
    plugin.init();
    plugin.options = {
      buttonCssClass: 'some-class'
    }

    expect(plugin.options).toEqual({
      buttonCssClass: 'some-class',
    });
  });

  describe('plugins - Header Button', () => {
    beforeEach(() => {
      jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
      columnsMock[0].header.buttons[1] = undefined;
      columnsMock[0].header.buttons[1] = {
        cssClass: 'mdi mdi-lightbulb-on',
        command: 'show-negative-numbers',
        tooltip: 'Highlight negative numbers.',
      };
    });

    afterEach(() => {
      plugin.dispose();
    });

    it('should populate 1x Header Button when cell is being rendered and a 2nd button item visibility callback returns undefined', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = () => undefined;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (only 1x)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));

      gridStub.onBeforeHeaderCellDestroy.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);
      expect(headerDiv.innerHTML).toBe('');
    });

    it('should populate 1x Header Button when cell is being rendered and a 2nd button item visibility callback returns false', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = () => false;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (only 1x)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });

    it('should populate 2x Header Buttons when cell is being rendered and a 2nd button item visibility & usability callbacks returns true', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = () => true;
      columnsMock[0].header.buttons[1].itemUsabilityOverride = () => true;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
        <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });

    it('should populate 2x Header Buttons and a 2nd button item usability callback returns false and expect button to be disabled', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = () => true;
      columnsMock[0].header.buttons[1].itemUsabilityOverride = () => false;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button slick-header-button-disabled mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
        <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });

    it('should populate 2x Header Buttons and a 2nd button is "disabled" and expect button to be disabled', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = undefined;
      columnsMock[0].header.buttons[1].disabled = true;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button slick-header-button-disabled mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
        <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });

    it('should populate 2x Header Buttons and a 2nd button and property "showOnHover" is enabled and expect button to be hidden until we hover it', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = undefined;
      columnsMock[0].header.buttons[1].showOnHover = true;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button slick-header-button-hidden mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
        <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });

    it('should populate 2x Header Buttons and a 2nd button and property "image" is filled and expect button to include an image background', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].image = '/images/some-gridmenu-image.png';

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" style="background-image: url(/images/some-gridmenu-image.png);" title="Highlight negative numbers."></div>
          <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "image" property of a Header Button is now deprecated and will be removed in future version, consider using "cssClass" instead.');
    });

    it('should populate 2x Header Buttons and a 2nd button and property "tooltip" is filled and expect button to include a "title" attribute for the tooltip', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].tooltip = 'Some Tooltip';

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Some Tooltip"></div>
          <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] The "image" property of a Header Button is now deprecated and will be removed in future version, consider using "cssClass" instead.');
    });

    it('should populate 2x Header Buttons and a 2nd button and a "handler" callback to be executed when defined', () => {
      const handlerMock = jest.fn();
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].handler = handlerMock;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on').dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
          <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
      expect(handlerMock).toHaveBeenCalled();
    });

    it('should populate 2x Header Buttons and a 2nd button and expect the button click handler & action callback to be executed when defined', () => {
      const actionMock = jest.fn();
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].action = actionMock;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on').dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
          <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
      expect(actionMock).toHaveBeenCalled();
    });

    it('should populate 2x Header Buttons and a 2nd button and expect the "onCommand" handler to be executed when defined', () => {
      const onCommandMock = jest.fn();
      const updateColSpy = jest.spyOn(gridStub, 'updateColumnHeader');
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      plugin.options.onCommand = onCommandMock;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);
      headerDiv.querySelector('.slick-header-button.mdi-lightbulb-on').dispatchEvent(new Event('click', { bubbles: true, cancelable: true, composed: false }));

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
          <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
      expect(onCommandMock).toHaveBeenCalled();
      expect(updateColSpy).toHaveBeenCalledWith('field1');
    });

    it('should populate 2x Header Buttons and a 2nd button is "disabled" but still expect the button NOT to be disabled because the "itemUsabilityOverride" has priority over the "disabled" property', () => {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'slick-header-column';

      plugin.dispose();
      plugin.init();
      columnsMock[0].header.buttons[1].itemVisibilityOverride = () => true;
      columnsMock[0].header.buttons[1].itemUsabilityOverride = () => true;
      delete columnsMock[0].header.buttons[1].showOnHover;
      columnsMock[0].header.buttons[1].disabled = true;

      const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
      gridStub.onHeaderCellRendered.notify({ column: columnsMock[0], node: headerDiv, grid: gridStub }, eventData, gridStub);

      // add Header Buttons which are visible (2x buttons)
      expect(removeExtraSpaces(headerDiv.innerHTML)).toBe(removeExtraSpaces(
        `<div class="slick-header-button mdi mdi-lightbulb-on" title="Highlight negative numbers."></div>
        <div class="slick-header-button mdi mdi-lightbulb-outline"></div>`));
    });
  });
});
