import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeaderGroupingService } from '../headerGrouping.service';
import type { Column, GridOption } from '../../interfaces/index';
import type { ExtensionUtility } from '../../extensions/extensionUtility';
import { type SlickDataView, SlickEvent, SlickEventData, type SlickEventHandler, type SlickGrid } from '../../core/index';

const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';

const gridOptionMock = {
  createPreHeaderPanel: true,
  enablePagination: true,
  enableTranslate: false,
} as GridOption;

const dataViewStub = {
  refresh: vi.fn(),
  sort: vi.fn(),
  onRowCountChanged: new SlickEvent(),
  reSort: vi.fn(),
} as unknown as SlickDataView;

const resizerPluginStub = {
  pluginName: 'resizer',
  init: vi.fn(),
  destroy: vi.fn(),
  onGridAfterResize: new SlickEvent(),
};

const gridStub = {
  autosizeColumns: vi.fn(),
  getColumnIndex: vi.fn(),
  getData: () => dataViewStub,
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getHeadersWidth: vi.fn(),
  getHeaderColumnWidthDiff: vi.fn(),
  getPluginByName: vi.fn(),
  getPreHeaderPanel: vi.fn(),
  getPreHeaderPanelLeft: vi.fn(),
  getPreHeaderPanelRight: vi.fn(),
  getSortColumns: vi.fn(),
  invalidate: vi.fn(),
  onAutosizeColumns: new SlickEvent(),
  onColumnsReordered: new SlickEvent(),
  onColumnsResized: new SlickEvent(),
  onRendered: new SlickEvent(),
  onSetOptions: new SlickEvent(),
  onSort: new SlickEvent(),
  render: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSortColumns: vi.fn(),
} as unknown as SlickGrid;

const mockExtensionUtility = {
  translateItems: vi.fn(),
} as unknown as ExtensionUtility;

vi.useFakeTimers();

// define a <div> container to simulate the grid container
const template =
  `<div id="${containerId}" style="height: 800px; width: 600px; overflow: hidden; display: block;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid}" style="width: 100%">
      <div class="slick-pane slick-pane-header slick-pane-left" tabindex="0" style="width: 100%;">
        <div class="slick-preheader-panel slick-state-default slick-header" style="overflow:hidden;position:relative;">
          <div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>
        </div>
      </div>
    </div>
  </div>`;

describe('HeaderGroupingService', () => {
  let service: HeaderGroupingService;
  let slickgridEventHandler: SlickEventHandler;

  beforeEach(() => {
    const div = document.createElement('div');
    div.innerHTML = template;
    document.body.appendChild(div);

    service = new HeaderGroupingService(mockExtensionUtility);
    slickgridEventHandler = service.eventHandler;
  });

  afterEach(() => {
    vi.clearAllMocks();
    service.dispose();
    gridOptionMock.enableTranslate = false;
    gridStub.getOptions = () => gridOptionMock;
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should dispose of the event handler', () => {
    const spy = vi.spyOn(slickgridEventHandler, 'unsubscribeAll');
    service.dispose();
    expect(spy).toHaveBeenCalled();
  });

  it('should not call the "renderPreHeaderRowGroupingTitles" when there are no grid options', () => {
    gridStub.getOptions = () => undefined as any;
    const spy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');
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
      gridStub.getColumns = vi.fn();
      vi.spyOn(gridStub, 'getPluginByName').mockReturnValue(resizerPluginStub);
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      vi.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(mockPreHeaderPanelElm);
      vi.spyOn(gridStub, 'getPreHeaderPanelLeft').mockReturnValue(document.createElement('div'));
      vi.spyOn(gridStub, 'getPreHeaderPanelRight').mockReturnValue(document.createElement('div'));
      setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call the "renderPreHeaderRowGroupingTitles" on initial load even when there are no column definitions', () => {
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      gridStub.getColumns = () => undefined as any;

      service.init(gridStub);
      vi.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onAutosizeColumns"', () => {
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onAutosizeColumns.notify({ columns: [], grid: gridStub }, new SlickEventData(), gridStub);
      vi.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after triggering a grid "onRendered"', () => {
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onRendered.notify({ startRow: 0, endRow: 10, grid: gridStub }, new SlickEventData(), gridStub);
      vi.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
    });

    it('should call the "renderPreHeaderRowGroupingTitles" after calling the "translateGroupingAndColSpan" method', () => {
      gridOptionMock.enableTranslate = true;
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const translateSpy = vi.spyOn(mockExtensionUtility, 'translateItems');
      const getColSpy = vi.spyOn(gridStub, 'getColumns');
      const setColSpy = vi.spyOn(gridStub, 'setColumns');

      service.init(gridStub);
      service.translateGroupingAndColSpan();

      expect(getColSpy).toHaveBeenCalled();
      expect(setColSpy).toHaveBeenCalled();
      expect(translateSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalledTimes(2); // 1x by the init, 1x by translateGroupingAndColSpan
    });

    it('should render the pre-header row grouping title DOM element', () => {
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      vi.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 75);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });

    it('should render the pre-header twice (for both left & right viewports) row grouping title DOM element', () => {
      const frozenColumns = 2;
      gridOptionMock.frozenColumn = frozenColumns;
      const headerGroupSpy = vi.spyOn(service, 'renderHeaderGroups');
      const preHeaderLeftSpy = vi.spyOn(gridStub, 'getPreHeaderPanelLeft').mockReturnValue(document.createElement('div'));
      const preHeaderRightSpy = vi.spyOn(gridStub, 'getPreHeaderPanelRight').mockReturnValue(document.createElement('div'));
      const divHeaderColumns = document.getElementsByClassName('slick-header-columns');

      service.init(gridStub);
      vi.runAllTimers(); // fast-forward timer

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
      vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      const renderSpy = vi.spyOn(service, 'renderPreHeaderRowGroupingTitles');

      service.init(gridStub);
      gridStub.onSetOptions.notify({ grid: gridStub, optionsBefore: { frozenColumn: -1 }, optionsAfter: { frozenColumn: 1 } }, new SlickEventData(), gridStub);
      vi.runAllTimers(); // fast-forward timer

      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 0);
      expect(divHeaderColumns.length).toBeGreaterThan(2);
      expect(divHeaderColumns[0].outerHTML).toEqual(`<div style="width: 2815px; left: -1000px;" class="slick-header-columns">All your colums div here</div>`);
    });
  });
});
