import { GroupingAndColspanService } from '../groupingAndColspan.service';
import { Column, GridOption } from '../../interfaces/index';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { type SlickDataView, SlickEvent, SlickEventData, SlickEventHandler, type SlickGrid } from '../../core/index';

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
jest.mock('@slickgrid-universal/event-pub-sub', () => ({
  BasePubSubService: () => mockPubSub
}));

const gridOptionMock = {
  createPreHeaderPanel: true,
  enablePagination: true,
  enableTranslate: false,
} as GridOption;

const dataViewStub = {
  refresh: jest.fn(),
  sort: jest.fn(),
  onRowCountChanged: new SlickEvent(),
  reSort: jest.fn(),
} as unknown as SlickDataView;

const resizerPluginStub = {
  pluginName: 'resizer',
  init: jest.fn(),
  destroy: jest.fn(),
  onGridAfterResize: new SlickEvent(),
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
  onAutosizeColumns: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onColumnsResized: new SlickEvent(),
  onRendered: new SlickEvent(),
  onSetOptions: new SlickEvent(),
  onSort: new SlickEvent(),
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

    service = new GroupingAndColspanService(mockExtensionUtility, mockPubSub);
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
    gridStub.getOptions = () => undefined as any;
    const spy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
    service.init(gridStub);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('init method', () => {
    let mockColumns: Column[];
    let setTimeoutSpy: any;

    beforeEach(() => {
      const mockParentPreHeaderElm = document.createElement('div');
      const mockPreHeaderPanelElm = document.createElement('div');
      mockPreHeaderPanelElm.className = 'slick-header-columns';
      mockPreHeaderPanelElm.style.left = '-1000px';
      mockPreHeaderPanelElm.style.width = '2815px';
      mockParentPreHeaderElm.appendChild(mockPreHeaderPanelElm);
      mockColumns = [
        { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
        { id: 'duration', name: 'Duration', field: 'duration', width: 100, columnGroup: 'Common Factor' },
        { id: 'category', name: 'Category', field: 'category', columnGroup: 'Common Factor' },
        { id: 'start', name: 'Start', field: 'start' },
      ];
      gridStub.getColumns = jest.fn();
      jest.spyOn(gridStub, 'getPluginByName').mockReturnValue(resizerPluginStub);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      jest.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(mockPreHeaderPanelElm);
      jest.spyOn(gridStub, 'getPreHeaderPanelLeft').mockReturnValue(document.createElement('div'));
      jest.spyOn(gridStub, 'getPreHeaderPanelRight').mockReturnValue(document.createElement('div'));
      setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call the "renderPreHeaderRowGroupingTitles" on initial load even when there are no column definitions', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      gridStub.getColumns = () => undefined as any;

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onSort"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onSort.notify({ columnId: 'lastName', sortAsc: true, sortCol: mockColumns[0] }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onAutosizeColumns"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onAutosizeColumns.notify({ columns: [], grid: gridStub }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onRendered"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onRendered.notify({ startRow: 0, endRow: 10, grid: gridStub }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onColumnsResized"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onColumnsResized.notify({ triggeredByColumn: 'lastName', grid: gridStub }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onColumnsReordered"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onColumnsReordered.notify({ impactedColumns: [], grid: gridStub }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a dataView "onColumnsResized"', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      dataViewStub.onRowCountChanged.notify({ previous: 1, current: 2, dataView: dataViewStub, callingOnRowsChanged: false, itemCount: 1 }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 75);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 0);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid resize', () => {
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      resizerPluginStub.onGridAfterResize.notify({}, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility from column picker', () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      fnCallbacks['onColumnPickerColumnsChanged'](columnsMock);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x for init, 1x for event
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility from grid menu', () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      fnCallbacks['onGridMenuColumnsChanged'](columnsMock);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x for init, 1x for event
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after changing column visibility & closing the grid menu', () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      fnCallbacks['onGridMenuMenuClose'](columnsMock);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x for init, 1x for event
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
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
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should render the pre-header twice (for both left & right viewports) row grouping title DOM element', () => {
      const frozenColumns = 2;
      gridOptionMock.frozenColumn = frozenColumns;
      const headerGroupSpy = jest.spyOn(service, 'renderHeaderGroups');
      const preHeaderLeftSpy = jest.spyOn(gridStub, 'getPreHeaderPanelLeft').mockReturnValue(document.createElement('div'));
      const preHeaderRightSpy = jest.spyOn(gridStub, 'getPreHeaderPanelRight').mockReturnValue(document.createElement('div'));
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(preHeaderLeftSpy).toHaveBeenCalledTimes(1);
      expect(preHeaderRightSpy).toHaveBeenCalledTimes(1);
      expect(headerGroupSpy).toHaveBeenNthCalledWith(1, expect.anything(), 0, (frozenColumns + 1));
      expect(headerGroupSpy).toHaveBeenNthCalledWith(2, expect.anything(), (frozenColumns + 1), mockColumns.length);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should render the pre-header row grouping title after changing "frozenColumn" with grid "setOptions"', () => {
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onSetOptions.notify({ grid: gridStub, optionsBefore: { frozenColumn: -1 }, optionsAfter: { frozenColumn: 1 } }, new SlickEventData(), gridStub);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 0);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should  call the "renderPreHeaderRowGroupingTitles" when "onHeaderMenuHideColumns" is triggered', () => {
      const columnsMock = [{ id: 'field1', field: 'field1', width: 100, cssClass: 'red' }] as Column[];
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = jest.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      fnCallbacks['onHeaderMenuHideColumns'](columnsMock);
      jest.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x for init, 1x for event
      expect(divHeaderColumns.length).toBeGreaterThan(2);
    });
  });
});
