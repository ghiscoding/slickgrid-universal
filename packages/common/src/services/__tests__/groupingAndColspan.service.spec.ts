// @ts-nocheck
import { GroupingAndColspanService } from '../groupingAndColspan.service';
import { Column, SlickDataView, GridOption, SlickEventHandler, SlickGrid, SlickNamespace, SlickColumnPicker, SlickGridMenu } from '../../interfaces/index';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { ExtensionService } from '../extension.service';
import { ExtensionName } from '../../enums/index';

declare const Slick: SlickNamespace;
const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';

const fnCallbacks = {};
const mockPubSub = {
  publish: jest.fn(),
  subscribe: (eventName, fn) => fnCallbacks[eventName] = fn,
  unsubscribe: jest.fn(),
  unsubscribeAll: jest.fn(),
};
jest.mock('../pubSub.service', () => ({
  PubSubService: () => mockPubSub
}));

const gridOptionMock = {
  createPreHeaderPanel: true,
  enablePagination: true,
  enableTranslate: false,
} as GridOption;

const dataViewStub = {
  refresh: jest.fn(),
  sort: jest.fn(),
  onRowCountChanged: new Slick.Event(),
  reSort: jest.fn(),
} as unknown as SlickDataView;

const extensionServiceStub = {
  getExtensionByName: jest.fn()
} as unknown as ExtensionService;

const resizerPluginStub = {
  init: jest.fn(),
  destroy: jest.fn(),
  onGridAfterResize: new Slick.Event(),
};

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getData: () => dataViewStub,
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getHeadersWidth: jest.fn(),
  getHeaderColumnWidthDiff: jest.fn(),
  getPluginByName: jest.fn(),
  getPreHeaderPanel: jest.fn(),
  getPreHeaderPanelLeft: jest.fn(),
  getPreHeaderPanelRight: jest.fn(),
  getSortColumns: jest.fn(),
  invalidate: jest.fn(),
  onColumnsReordered: new Slick.Event(),
  onColumnsResized: new Slick.Event(),
  onSetOptions: new Slick.Event(),
  onSort: new Slick.Event(),
  render: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
} as unknown as SlickGrid;

const mockExtensionUtility = {
  translateItems: jest.fn(),
} as unknown as ExtensionUtility;

jest.useFakeTimers();

// define a <div> container to simulate the grid container
const template =
  `<div id="${containerId}" style="height: 800px; width: 600px; overflow: hidden; display: block;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid}" style="width: 100%">
      <div class="slick-pane slick-pane-header slick-pane-left" tabindex="0" style="width: 100%;">
        <div class="slick-preheader-panel ui-state-default slick-header" style="overflow:hidden;position:relative;">
          <div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>
        </div>
      </div>
    </div>
  </div>`;

describe('GroupingAndColspanService', () => {
  let service: GroupingAndColspanService;
  let slickgridEventHandler: SlickEventHandler;

  beforeEach(() => {
    const div = document.createElement('div');
    div.innerHTML = template;
    document.body.appendChild(div);

    service = new GroupingAndColspanService(mockExtensionUtility, extensionServiceStub, mockPubSub);
    slickgridEventHandler = service.eventHandler;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.dispose();
    gridOptionMock.enableTranslate = false;
    gridStub.getOptions = () => gridOptionMock;
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should dispose of the event handler', () => {
    const spy = jest.spyOn(slickgridEventHandler, 'unsubscribeAll');
    service.dispose();
    expect(spy).toHaveBeenCalled();
  });

  it('should not call the "renderPreHeaderRowGroupingTitles" when there are no grid options', () => {
    gridStub.getOptions = undefined;
    const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
    service.init(gridStub);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('init method', () => {
    let mockColumns: Column[];

    beforeEach(() => {
      mockColumns = [
        { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
        { id: 'duration', name: 'Duration', field: 'duration', width: 100, columnGroup: 'Common Factor' },
        { id: 'category', name: 'Category', field: 'category', columnGroup: 'Common Factor' },
        { id: 'start', name: 'Start', field: 'start' },
      ];
      gridStub.getColumns = jest.fn();
      jest.spyOn(gridStub, 'getPluginByName').mockReturnValue(resizerPluginStub);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      jest.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns"></div>` as unknown as HTMLElement);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call the "renderPreHeaderRowGroupingTitles" on initial load even when there are no column definitions', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      gridStub.getColumns = undefined;

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onSort"', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onSort.notify({ columnId: 'lastName', sortAsc: true, sortCol: mockColumns[0] }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onColumnsResized"', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onColumnsResized.notify({ triggeredByColumn: 'lastName', grid: gridStub }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onColumnsReordered"', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onColumnsReordered.notify({ impactedColumns: [], grid: gridStub }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a dataView "onColumnsResized"', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      dataViewStub.onRowCountChanged.notify({ previous: 1, current: 2, dataView: dataViewStub, callingOnRowsChanged: false }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 75);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid resize', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      resizerPluginStub.onGridAfterResize.notify({}, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility from column picker', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const slickEvent1 = new Slick.Event();
      const slickEvent2 = new Slick.Event();
      const instanceMock = { onColumnsChanged: slickEvent1, onMenuClose: slickEvent2 };
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const extensionMock = { name: ExtensionName.columnPicker, addon: instanceMock, instance: instanceMock as unknown as SlickColumnPicker, class: null };
      jest.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock);

      service.init(gridStub);
      slickEvent1.notify({ columns: columnsMock }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(3);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility from grid menu', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const slickEvent1 = new Slick.Event();
      const slickEvent2 = new Slick.Event();
      const instanceMock = { onColumnsChanged: slickEvent1, onMenuClose: slickEvent2 };
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const extensionMock = { name: ExtensionName.columnPicker, addon: instanceMock, instance: instanceMock as SlickGridMenu, class: null };
      jest.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock);

      service.init(gridStub);
      slickEvent1.notify({ columns: columnsMock }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(3);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility & closing the grid menu', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const slickEvent1 = new Slick.Event();
      const slickEvent2 = new Slick.Event();
      const instanceMock = { onColumnsChanged: slickEvent1, onMenuClose: slickEvent2 };
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const extensionMock = { name: ExtensionName.columnPicker, addon: instanceMock, instance: instanceMock as SlickGridMenu, class: null };
      jest.spyOn(extensionServiceStub, 'getExtensionByName').mockReturnValue(extensionMock);

      service.init(gridStub);
      slickEvent2.notify({ allColumns: columnsMock }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after calling the "translateGroupingAndColSpan" method', () => {
      gridOptionMock.enableTranslate = true;
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const translateSpy = jest.spyOn(mockExtensionUtility, 'translateItems');
      const getColSpy = jest.spyOn(gridStub, 'getColumns');
      const setColSpy = jest.spyOn(gridStub, 'setColumns');

      service.init(gridStub);
      service.translateGroupingAndColSpan();

      expect(getColSpy).toHaveBeenCalled();
      expect(setColSpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x by the init, 1x by translateGroupingAndColSpan
    });

    it('should render the pre-header row grouping title DOM element', () => {
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should render the pre-header twice (for both left & right viewports) row grouping title DOM element', () => {
      const frozenColumns = 2;
      gridOptionMock.frozenColumn = frozenColumns;
      const headerGroupSpy = jest.spyOn(service, 'renderHeaderGroups');
      const preHeaderLeftSpy = jest.spyOn(gridStub, 'getPreHeaderPanelLeft');
      const preHeaderRightSpy = jest.spyOn(gridStub, 'getPreHeaderPanelRight');
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(preHeaderLeftSpy).toHaveBeenCalledTimes(1);
      expect(preHeaderRightSpy).toHaveBeenCalledTimes(1);
      expect(headerGroupSpy).toHaveBeenNthCalledWith(1, expect.anything(), 0, (frozenColumns + 1));
      expect(headerGroupSpy).toHaveBeenNthCalledWith(2, expect.anything(), (frozenColumns + 1), mockColumns.length);
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 75);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should render the pre-header row grouping title after changing "frozenColumn" with grid "setOptions"', () => {
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onSetOptions.notify({ grid: gridStub, optionsBefore: { frozenColumn: -1 }, optionsAfter: { frozenColumn: 1 } }, new Slick.EventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should  call the "renderPreHeaderRowGroupingTitles" when "onHeaderMenuHideColumns" is triggered', () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      fnCallbacks['onHeaderMenuHideColumns'](columnsMock);
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalledTimes(2); // 1x for init, 1x for event
      expect(divHeaderColumns.length).toBeGreaterThan(2);
    });
  });
});
