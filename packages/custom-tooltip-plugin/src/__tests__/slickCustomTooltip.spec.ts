import { delay, of, throwError } from 'rxjs';

import { Column, getOffset, GridOption, SlickGrid, SharedService, type SlickDataView, SlickEvent, SlickEventData, } from '@slickgrid-universal/common';

import { SlickCustomTooltip } from '../slickCustomTooltip';
import { ContainerServiceStub } from '../../../../test/containerServiceStub';
import { RxJsResourceStub } from '../../../../test/rxjsResourceStub';

// mocked modules
jest.mock('@slickgrid-universal/common', () => ({
  ...(jest.requireActual('@slickgrid-universal/common') as any),
  getOffset: jest.fn(),
}));

const GRID_UID = 'slickgrid12345';

const gridOptionsMock = { enableAutoTooltip: true } as GridOption;

const dataviewStub = {
  getItem: jest.fn(),
} as unknown as SlickDataView;

const getEditorLockMock = {
  isActive: jest.fn(),
};

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  getCellFromEvent: jest.fn(),
  getCellNode: jest.fn(),
  getColumns: jest.fn(),
  getData: () => dataviewStub,
  getEditorLock: () => getEditorLockMock,
  getOptions: () => gridOptionsMock,
  getUID: () => GRID_UID,
  registerPlugin: jest.fn(),
  sanitizeHtmlString: (s) => s,
  onMouseEnter: new SlickEvent(),
  onHeaderMouseOver: new SlickEvent(),
  onHeaderRowMouseOver: new SlickEvent(),
  onMouseLeave: new SlickEvent(),
  onHeaderMouseOut: new SlickEvent(),
  onHeaderRowMouseOut: new SlickEvent(),
} as unknown as SlickGrid;

describe('SlickCustomTooltip plugin', () => {
  let divContainer = document.createElement('div');
  let container: ContainerServiceStub;
  let plugin: SlickCustomTooltip;
  let rxjsResourceStub: RxJsResourceStub;
  let sharedService: SharedService;

  beforeEach(() => {
    container = new ContainerServiceStub();
    sharedService = new SharedService();
    rxjsResourceStub = new RxJsResourceStub();
    plugin = new SlickCustomTooltip();
    divContainer.className = `slickgrid-container ${GRID_UID}`;
    document.body.appendChild(divContainer);
    (document as any).elementFromPoint = jest.fn(); // document.elementFromPoint() doesn't exist in JSDOM but we can mock it
  });

  afterEach(() => {
    plugin.dispose();
    jest.clearAllMocks();
  });

  it('should create the plugin', () => {
    plugin.init(gridStub, container);
    expect(plugin).toBeTruthy();
  });

  it('should be able to change plugin options', () => {
    const mockOptions = {
      bodyClassName: 'tooltip-body',
      className: 'some-class',
      offsetArrow: 3,
      offsetLeft: 5,
      offsetRight: 7,
      offsetTopBottom: 8,
      hideArrow: true,
      regularTooltipWhiteSpace: 'pre-wrap',
      whiteSpace: 'normal',
    };
    plugin.init(gridStub, container);
    plugin.setOptions(mockOptions);

    expect(plugin.addonOptions).toEqual(mockOptions);
    expect(plugin.getOptions()).toEqual(mockOptions);
  });

  it('should return without creating a tooltip when column definition has "disableTooltip: true" when "onMouseEnter" event is triggered', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', disableTooltip: true }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    expect(document.body.querySelector('.slick-custom-tooltip')).toBeFalsy();
  });

  it('should return without creating a tooltip when column definition has "disableTooltip: true" when "onHeaderMouseOver" event is triggered', () => {
    const mockColumns = [{ id: 'firstName', field: 'firstName', disableTooltip: true }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    gridStub.onHeaderMouseOver.notify({ column: mockColumns[0], grid: gridStub });

    expect(document.body.querySelector('.slick-custom-tooltip')).toBeFalsy();
  });

  it('should return without creating a tooltip when column definition has "disableTooltip: true" when "onHeaderRowMouseOver" event is triggered', () => {
    const mockColumns = [{ id: 'firstName', field: 'firstName', disableTooltip: true }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    gridStub.onHeaderRowMouseOver.notify({ column: mockColumns[0], grid: gridStub });

    expect(document.body.querySelector('.slick-custom-tooltip')).toBeFalsy();
  });

  it('should return without creating a tooltip when "usabilityOverride" returns False', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ usabilityOverride: () => false });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    expect(document.body.querySelector('.slick-custom-tooltip')).toBeFalsy();
  });

  it('should NOT create a tooltip when tooltip option has "useRegularTooltip" set BUT [title] attribute is not set or is empty', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', '');
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    expect(document.body.querySelector('.slick-custom-tooltip')).toBeFalsy();
  });

  it('should create a tooltip and the editor [title] attribute instead of the cell [title] when currently editing (editor lock)', () => {
    jest.spyOn(getEditorLockMock, 'isActive').mockReturnValue(true);
    const cellNode = document.createElement('div');
    const editInput = document.createElement('input');
    cellNode.className = 'slick-cell l2 r2';
    editInput.setAttribute('title', 'editing input tooltip text');
    cellNode.appendChild(editInput);
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('editing input tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip from the editor [title] attribute and a formatter instead of the cell [title] when currently editing (editor lock) and a formatter is provided', () => {
    jest.spyOn(getEditorLockMock, 'isActive').mockReturnValue(true);
    const cellNode = document.createElement('div');
    const editInput = document.createElement('input');
    cellNode.className = 'slick-cell l2 r2';
    editInput.setAttribute('title', 'editing input tooltip text 20');
    cellNode.appendChild(editInput);
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: false, formatter: () => 'EDITING FORMATTER' });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('EDITING FORMATTER');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip, with default positioning (down & leftAlign), when tooltip option has "useRegularTooltip" enabled', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip align on the right, when position is set to "right-align"', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, position: 'right-align' });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-center-align')).toBeFalsy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeFalsy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeTruthy();
  });

  it('should create a centered tooltip, when position is set to "center"', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, position: 'center' });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-center-align')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeFalsy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeFalsy();
  });

  it('should create a tooltip with truncated text when tooltip option has "useRegularTooltip" enabled and the tooltip text is longer than that of "tooltipTextMaxLength"', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'some very extra long tooltip text sentence');
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, tooltipTextMaxLength: 23 });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('some very extra long...');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip as regular tooltip with coming from text content when it is filled & also expect "hideTooltip" to be called after leaving the cell when "onHeaderMouseOut" event is triggered', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.textContent = 'some text content';
    cellNode.setAttribute('title', 'tooltip text');
    Object.defineProperty(cellNode, 'scrollWidth', { writable: true, configurable: true, value: 400 });
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });
    const hideColumnSpy = jest.spyOn(plugin, 'hideTooltip');

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, maxWidth: 85 });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm).toEqual(plugin.tooltipElm);
    expect(plugin.cellAddonOptions).toBeTruthy();
    expect(tooltipElm.style.maxWidth).toBe('85px');
    expect(tooltipElm.textContent).toBe('some text content');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();

    gridStub.onMouseLeave.notify({ grid: gridStub } as any);
    expect(hideColumnSpy).toHaveBeenCalled();
  });

  it('should create a tooltip as regular tooltip with truncated text when tooltip option has "useRegularTooltip" enabled and the tooltip text is longer than that of "tooltipTextMaxLength"', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.textContent = 'some very extra long tooltip text sentence';
    cellNode.setAttribute('title', 'tooltip text');
    Object.defineProperty(cellNode, 'scrollWidth', { writable: true, configurable: true, value: 400 });
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, tooltipTextMaxLength: 23 });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('some very extra long...');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should NOT create a tooltip as regular tooltip with truncated text when tooltip option has "useRegularTooltip" enabled but the mouse over is not a slick-cell cell type', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.textContent = 'some very extra long tooltip text sentence';
    cellNode.setAttribute('title', 'tooltip text');
    Object.defineProperty(cellNode, 'scrollWidth', { writable: true, configurable: true, value: 400 });
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, tooltipTextMaxLength: 23 });
    gridStub.onHeaderMouseOver.notify({ column: mockColumns[0], grid: gridStub }, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeFalsy();
  });

  it('should create a tooltip with only the tooltip pulled from the cell text when enabling option "useRegularTooltip" & "useRegularTooltipFromCellTextOnly" and column definition has a regular formatter with a "title" attribute filled', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', formatter: () => `<span title="formatter tooltip text">Hello World</span>` }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, useRegularTooltipFromCellTextOnly: true, maxHeight: 100 });
    (document as any).elementFromPoint.mockReturnValue(cellNode);

    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('tooltip text');
    expect(tooltipElm.style.maxHeight).toBe('100px');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip aligned left from a cell with multiple span and title attributes', () => {
    const cellNode = document.createElement('div');
    const icon1Elm = document.createElement('span');
    const icon2Elm = document.createElement('span');
    cellNode.className = 'slick-cell l2 r2';
    icon1Elm.className = 'mdi mdi-check';
    icon1Elm.title = 'Click here when successful';
    icon2Elm.className = 'mdi mdi-cancel';
    icon2Elm.title = 'Click here to cancel the action';
    cellNode.appendChild(icon1Elm);
    cellNode.appendChild(icon2Elm);

    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });
    (getOffset as jest.Mock)
      .mockReturnValueOnce({ top: 100, left: 333, height: 75, width: 400 }) // mock cell position
      .mockReturnValueOnce({ top: 100, left: 333, height: 75, width: 400 }); // mock cell position

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, maxHeight: 100 });
    (document as any).elementFromPoint.mockReturnValue(icon2Elm);

    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('Click here to cancel the action');
    expect(tooltipElm.style.maxHeight).toBe('100px');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should create a tooltip aligned right from a cell with multiple span and title attributes', () => {
    const cellNode = document.createElement('div');
    const icon1Elm = document.createElement('span');
    const icon2Elm = document.createElement('span');
    cellNode.className = 'slick-cell l2 r2';
    icon1Elm.className = 'mdi mdi-check';
    icon1Elm.title = 'Click here when successful';
    icon2Elm.className = 'mdi mdi-cancel';
    icon2Elm.title = 'Click here to cancel the action';
    cellNode.appendChild(icon1Elm);
    cellNode.appendChild(icon2Elm);

    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });
    (getOffset as jest.Mock)
      .mockReturnValueOnce({ top: 100, left: 1030, height: 75, width: 400 }) // mock cell position
      .mockReturnValueOnce({ top: 100, left: 1030, height: 75, width: 400 }); // mock cell position

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, maxHeight: 100 });
    (document as any).elementFromPoint.mockReturnValue(icon2Elm);

    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('Click here to cancel the action');
    expect(tooltipElm.style.maxHeight).toBe('100px');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeTruthy();
  });

  it('should NOT create a tooltip from a cell with multiple span and title attributes but it is actually hidden', () => {
    const cellNode = document.createElement('div');
    const icon1Elm = document.createElement('span');
    const icon2Elm = document.createElement('span');
    cellNode.className = 'slick-cell l2 r2';
    icon1Elm.className = 'mdi mdi-check';
    icon1Elm.title = 'Click here when successful';
    icon2Elm.className = 'mdi mdi-cancel';
    icon2Elm.title = 'Click here to cancel the action';
    icon2Elm.style.display = 'none';
    cellNode.appendChild(icon1Elm);
    cellNode.appendChild(icon2Elm);

    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, maxHeight: 100 });
    (document as any).elementFromPoint.mockReturnValue(icon2Elm);

    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeFalsy();
  });

  it('should create a tooltip with only the tooltip formatter output when tooltip option has "useRegularTooltip" & "useRegularTooltipFromFormatterOnly" enabled and column definition has a regular formatter with a "title" attribute filled', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', formatter: () => `<span title="formatter tooltip text">Hello World</span>` }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, useRegularTooltipFromFormatterOnly: true, maxHeight: 100 });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('formatter tooltip text');
    expect(tooltipElm.style.maxHeight).toBe('100px');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
  });

  it('should throw an error when trying to create an async tooltip without "asyncPostFormatter" defined', () => {
    const consoleSpy = jest.spyOn(global.console, 'error').mockReturnValue();
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({
      offsetLeft: 5,
      position: 'bottom',
      asyncProcess: () => Promise.resolve({ ratio: 1.2 }),
      formatter: () => 'loading...',
      asyncPostFormatter: undefined
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    expect(consoleSpy).toHaveBeenCalledWith(`[Slickgrid-Universal] when using "asyncProcess" with Custom Tooltip, you must also provide an "asyncPostFormatter" formatter.`);
  });

  it('should create an Observable async tooltip', (done) => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.addRxJsResource(rxjsResourceStub);
    plugin.setOptions({
      asyncProcess: () => of({ ratio: 1.2 }).pipe(delay(0)),
      formatter: () => 'loading...',
      asyncPostFormatter: (row, cell, val, column, dataContext) => `async post text with ratio: ${dataContext.__params.ratio || ''}`,
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    let tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('loading...');

    setTimeout(() => {
      tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
      expect(tooltipElm.textContent).toBe('async post text with ratio: 1.2');
      expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
      done();
    }, 0);
  });

  it('should create an Observable async tooltip and throw an error when the Observable is throwing', (done) => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });
    const consoleSpy = jest.spyOn(global.console, 'error').mockReturnValue();

    plugin.init(gridStub, container);
    plugin.addRxJsResource(rxjsResourceStub);
    plugin.setOptions({
      asyncProcess: () => throwError(() => 'observable error').pipe(delay(0)),
      formatter: () => 'loading...',
      asyncPostFormatter: (row, cell, val, column, dataContext) => `async post text with ratio: ${dataContext.__params.ratio || ''}`,
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    let tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('loading...');

    setTimeout(() => {
      expect(consoleSpy).toHaveBeenCalledWith(`observable error`);
      done();
    }, 0);
  });

  it('should create a Promise async tooltip with position (up & right align) when space is not available on the right of the tooltip', (done) => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });
    (getOffset as jest.Mock).mockReturnValue({ top: 100, left: 1030, height: 75, width: 400 }); // mock cell position

    plugin.init(gridStub, container);
    plugin.setOptions({
      offsetLeft: 5,
      position: 'left-align',
      formatter: () => 'loading...',
      asyncProcess: () => Promise.resolve({ ratio: 1.2 }),
      asyncPostFormatter: (row, cell, val, column, dataContext) => `async post text with ratio: ${dataContext.__params.ratio || ''}`,
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    let tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    jest.spyOn(tooltipElm, 'getBoundingClientRect').mockReturnValue({ top: 22, left: 11, height: 100, width: 250 } as any);
    tooltipElm.style.top = '22px';
    tooltipElm.style.left = '11px';
    tooltipElm.style.height = '100px';
    tooltipElm.style.width = '250px';

    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('loading...');

    setTimeout(() => {
      tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
      expect(tooltipElm.textContent).toBe('async post text with ratio: 1.2');
      expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
      expect(tooltipElm.classList.contains('arrow-left-align')).toBeTruthy();
      done();
    }, 0);
  });

  it('should create a Promise async tooltip even on regular tooltip with "asyncProcess" and "useRegularTooltip" flags', (done) => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({
      useRegularTooltip: true,
      useRegularTooltipFromFormatterOnly: true,
      formatter: () => 'loading...',
      asyncProcess: () => Promise.resolve({ ratio: 1.2 }),
      asyncPostFormatter: (row, cell, val, column, dataContext) => `<span title="tooltip title text with ratio: ${dataContext.__params.ratio || ''}">cell value</span>`,
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);

    let tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;

    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('loading...');

    setTimeout(() => {
      tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
      expect(tooltipElm.textContent).toBe('tooltip title text with ratio: 1.2');
      expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
      done();
    }, 0);
  });

  it('should create a Promise async tooltip and throw an error when the Promise is not completing (rejected)', (done) => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell l2 r2';
    const mockColumns = [{ id: 'firstName', field: 'firstName', }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({
      asyncProcess: () => Promise.reject('promise error'),
      formatter: () => 'loading...',
      asyncPostFormatter: (row, cell, val, column, dataContext) => `async post text with ratio: ${dataContext.__params.ratio || ''}`,
    });
    gridStub.onMouseEnter.notify({ grid: gridStub } as any, { ...new SlickEventData(), target: cellNode } as any);
    const cancellablePromise = plugin.cancellablePromise;
    let tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('loading...');

    cancellablePromise!.promise.catch(e => {
      tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
      expect(tooltipElm.textContent).toBe('loading...');
      expect(e.toString()).toBe('promise error');
      done();
    });
  });

  it('should create a tooltip on the header column when "useRegularTooltip" enabled and "onHeaderMouseOver" is triggered', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', name: `<span title="name title tooltip">First Name</span>` }] as Column[];
    const mockFormatter = jest.fn();
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ useRegularTooltip: true, headerFormatter: mockFormatter });
    const eventData = new SlickEventData();
    const div = document.createElement('div');
    div.className = 'toggle';
    Object.defineProperty(eventData, 'target', { writable: true, value: div });
    gridStub.onHeaderMouseOver.notify({ column: mockColumns[0], grid: gridStub }, eventData);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('name title tooltip');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeTruthy();
  });

  it('should create a tooltip on the header column when "useRegularTooltip" enabled and "onHeaderMouseOver" is triggered', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ headerFormatter: () => 'header tooltip text' });
    const eventData = new SlickEventData();
    const divHeaders = document.createElement('div');
    divHeaders.className = 'slick-header-columns';
    const divHeaderColumn = document.createElement('div');
    divHeaderColumn.className = 'slick-header-column';
    divHeaders.appendChild(divHeaderColumn);
    divHeaders.className = 'toggle';
    Object.defineProperty(eventData, 'target', { writable: true, value: divHeaderColumn });
    gridStub.onHeaderMouseOver.notify({ column: mockColumns[0], grid: gridStub }, eventData);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('header tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeTruthy();
  });

  it('should create a tooltip on the header column when "useRegularTooltip" enabled and "onHeaderRowMouseOver" is triggered', () => {
    const cellNode = document.createElement('div');
    cellNode.className = 'slick-cell';
    cellNode.setAttribute('title', 'tooltip text');
    const mockColumns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    jest.spyOn(gridStub, 'getCellFromEvent').mockReturnValue({ cell: 0, row: 1 });
    jest.spyOn(gridStub, 'getCellNode').mockReturnValue(cellNode);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(dataviewStub, 'getItem').mockReturnValue({ firstName: 'John', lastName: 'Doe' });

    plugin.init(gridStub, container);
    plugin.setOptions({ headerRowFormatter: () => 'header row tooltip text' });
    const eventData = new SlickEventData();
    const divHeaders = document.createElement('div');
    divHeaders.className = 'slick-header-columns';
    const divHeaderColumn = document.createElement('div');
    divHeaderColumn.className = 'slick-headerrow-column';
    divHeaders.appendChild(divHeaderColumn);
    divHeaders.className = 'toggle';
    Object.defineProperty(eventData, 'target', { writable: true, value: divHeaderColumn });
    gridStub.onHeaderRowMouseOver.notify({ column: mockColumns[0], grid: gridStub }, eventData);

    const tooltipElm = document.body.querySelector('.slick-custom-tooltip') as HTMLDivElement;
    expect(tooltipElm).toBeTruthy();
    expect(tooltipElm.textContent).toBe('header row tooltip text');
    expect(tooltipElm.classList.contains('arrow-down')).toBeTruthy();
    expect(tooltipElm.classList.contains('arrow-right-align')).toBeTruthy();
  });
});
