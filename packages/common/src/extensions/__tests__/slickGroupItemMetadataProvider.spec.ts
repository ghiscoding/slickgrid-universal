import 'jest-extended';
import type { Column, GridOption, GroupItemMetadataProviderOption } from '../../interfaces';
import { SlickGroupItemMetadataProvider } from '../slickGroupItemMetadataProvider';
import { type SlickDataView, SlickEvent, SlickGrid, SlickGroup } from '../../core/index';
import { getHtmlStringOutput } from '@slickgrid-universal/utils';

const gridOptionMock = {
  enablePagination: true,
  backendServiceApi: {
    service: undefined,
    preProcess: jest.fn(),
    process: jest.fn(),
    postProcess: jest.fn(),
  },
} as unknown as GridOption;

const dataViewStub = {
  collapseGroup: jest.fn(),
  expandGroup: jest.fn(),
  setRefreshHints: jest.fn(),
  getFilteredItemCount: jest.fn(),
  getItemCount: jest.fn(),
  getItemMetadata: jest.fn(),
  getLength: jest.fn(),
  refresh: jest.fn(),
  reSort: jest.fn(),
  sort: jest.fn(),
  setItems: jest.fn(),
  onRowCountChanged: new SlickEvent(),
} as unknown as SlickDataView;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  autosizeColumns: jest.fn(),
  getActiveCell: jest.fn(),
  getColumnIndex: jest.fn(),
  getColumns: jest.fn(),
  getData: () => dataViewStub as SlickDataView,
  getDataItem: jest.fn(),
  getOptions: () => gridOptionMock,
  getRenderedRange: jest.fn(),
  getSortColumns: jest.fn(),
  invalidate: jest.fn(),
  onLocalSortChanged: jest.fn(),
  render: jest.fn(),
  setColumns: jest.fn(),
  setOptions: jest.fn(),
  setSortColumns: jest.fn(),
  onClick: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

describe('GroupItemMetadataProvider Service', () => {
  let service: SlickGroupItemMetadataProvider;
  const mockColumns = [
    { id: 'firstName', field: 'firstName' },
    { id: 'lastName', field: 'lastName' },
    { id: 'age', field: 'age', groupTotalsFormatter: (totals, grid) => `<strong>Totals:</strong> ${totals.sum}` },
  ] as Column[];

  beforeEach(() => {
    service = new SlickGroupItemMetadataProvider();
  });

  afterEach(() => {
    service?.destroy();
    service?.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should expect event handler to unsubscribeAll when disposing the service', () => {
    const eventSpy = jest.spyOn(service.eventHandler, 'unsubscribeAll');
    service.dispose();
    expect(eventSpy).toHaveBeenCalled();
  });

  it('should expect default options after calling init method', () => {
    service.init(gridStub);

    expect(service.getOptions()).toEqual({
      groupCssClass: 'slick-group',
      groupTitleCssClass: 'slick-group-title',
      totalsCssClass: 'slick-group-totals',
      groupFocusable: true,
      indentation: 15,
      totalsFocusable: false,
      toggleCssClass: 'slick-group-toggle',
      toggleExpandedCssClass: 'expanded',
      toggleCollapsedCssClass: 'collapsed',
      enableExpandCollapse: true,
      groupFormatter: expect.toBeFunction(),
      totalsFormatter: expect.toBeFunction(),
      includeHeaderTotals: false
    });
  });

  it('should expect options to be updated when calling "setOptions"', () => {
    service.setOptions({
      groupCssClass: 'groupy',
      toggleCssClass: 'groupy-toggle',
      groupFocusable: false,
    });

    expect(service.getOptions().groupCssClass).toBe('groupy');
    expect(service.getOptions().toggleCssClass).toBe('groupy-toggle');
    expect(service.getOptions().groupFocusable).toBe(false);
  });

  describe('Group Formatter', () => {
    it('should return item title when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to False', () => {
      service.setOptions({ enableExpandCollapse: false });
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: 'Some Title' }, gridStub);
      expect(output).toBe('Some Title');
    });
    it('should provide HTMLElement and expect item title HTMLElement returned when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to False', () => {
      service.setOptions({ enableExpandCollapse: false });
      const spanElm = document.createElement('span');
      spanElm.textContent = 'Another Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: spanElm }, gridStub);
      expect(output).toBe(spanElm);
    });

    it('should return Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: 'Some Title' }, gridStub) as DocumentFragment;
      const htmlContent = [].map.call(output.childNodes, x => x.outerHTML).join('');
      expect(htmlContent).toBe('<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0">Some Title</span>');
    });

    it('should provide HTMLElement and return same Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const spanElm = document.createElement('span');
      spanElm.textContent = 'Another Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: spanElm }, gridStub) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe('<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0"><span>Another Title</span></span>');
    });

    it('should provide a DocumentFragment as header title and return same Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const fragment = document.createDocumentFragment();
      fragment.textContent = 'Fragment Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: fragment }, gridStub) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe('<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0">Fragment Title</span>');
    });

    it('should return Grouping info formatted with a group level 2 with indentation of 30px when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True and level 2', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true, toggleCssClass: 'groupy-toggle', toggleExpandedCssClass: 'groupy-expanded' });
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { level: 2, title: 'Some Title' }, gridStub) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe('<span class="groupy-toggle groupy-expanded" aria-expanded="true" style="margin-left: 30px;"></span><span class="slick-group-title" level="2">Some Title</span>');
    });

    it('should return Grouping info formatted with a group level 2 with indentation of 30px when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True and level 2', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true, toggleCssClass: 'groupy-toggle', toggleCollapsedCssClass: 'groupy-collapsed' });
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { collapsed: true, level: 3, title: 'Some Title' }, gridStub) as DocumentFragment;
      const htmlContent = [].map.call(output.childNodes, x => x.outerHTML).join('');
      expect(htmlContent).toBe('<span class="groupy-toggle groupy-collapsed" aria-expanded="false" style="margin-left: 45px;"></span><span class="slick-group-title" level="3">Some Title</span>');
    });
  });

  describe('Group Totals Formatter', () => {
    it('should return Grouping Totals formatted with column definition "groupTotalsFormatter" called when defined', () => {
      const mockDataContext = { sum: 152, avg: 33 };
      const output = service.getOptions().totalsFormatter!(0, 0, 'some value', mockColumns[2], mockDataContext, gridStub);
      expect(output).toBe('<strong>Totals:</strong> 152');
    });

    it('should return empty string when column definition does not include grouping info formatter', () => {
      const mockDataContext = { sum: 152, avg: 33 };
      const output = service.getOptions().totalsFormatter!(0, 0, 'some value', mockColumns[0], mockDataContext, gridStub);
      expect(output).toBe('');
    });
  });

  describe('getGroupRowMetadata method', () => {
    it('should return a formatted Group row including header totals when calling associated getter method with "includeHeaderTotals" enabled', () => {
      const mockOptions = { groupFocusable: true, groupCssClass: 'groupy-group', includeHeaderTotals: true } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getGroupRowMetadata({ count: 12, level: undefined as any, groupingKey: 'age', value: 33 });
      expect(output).toEqual({
        selectable: false,
        focusable: mockOptions.groupFocusable,
        cssClasses: `${mockOptions.groupCssClass} slick-group-level-0`,
        formatter: service.getOptions().totalsFormatter,
        columns: {
          0: {
            colspan: '1',
            formatter: service.getOptions().groupFormatter,
            editorClass: null
          }
        }
      });
    });

    it('should return a formatted Group row with column full colspan when calling associated getter method without "includeHeaderTotals"', () => {
      const mockOptions = { groupFocusable: true, groupCssClass: 'groupy-group', includeHeaderTotals: false } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getGroupRowMetadata({ count: 12, level: 2, groupingKey: 'age', value: 33 });
      expect(output).toEqual({
        selectable: false,
        focusable: mockOptions.groupFocusable,
        cssClasses: `${mockOptions.groupCssClass} slick-group-level-2`,
        formatter: undefined,
        columns: {
          0: {
            colspan: '*',
            formatter: service.getOptions().groupFormatter,
            editorClass: null
          }
        }
      });
    });
  });

  describe('getTotalsRowMetadata method', () => {
    it('should return a formatted Group Totals row using options provided', () => {
      const mockOptions = { totalsFocusable: true, totalsCssClass: 'groupy-totals' } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getTotalsRowMetadata({ group: { count: 12, level: undefined as any, groupingKey: 'age', value: 33 } });
      expect(output).toEqual({
        editorClass: null,
        selectable: false,
        focusable: mockOptions.totalsFocusable,
        cssClasses: `groupy-totals slick-group-level-0`,
        formatter: service.getOptions().totalsFormatter,
      });
    });

    it('should return a formatted Group Totals with defaults options when nothing is provided', () => {
      const output = service.getTotalsRowMetadata({ group: { count: 12, level: 3, groupingKey: 'age', value: 33 } });
      expect(output).toEqual({
        editorClass: null,
        focusable: false,
        selectable: false,
        cssClasses: `slick-group-totals slick-group-level-3`,
        formatter: service.getOptions().totalsFormatter,
      });
    });
  });

  describe('onClick - grid cell clicked event handler', () => {
    let refreshHintSpy;
    let collapseGroupSpy;
    let preventDefaultSpy;
    let stopPropagationSpy;
    let expandGroupSpy;
    let clickEvent: Event;
    const group = new SlickGroup();
    const mockRange = { top: 10, bottom: 25 } as any;

    beforeEach(() => {
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue(mockRange);
      refreshHintSpy = jest.spyOn(dataViewStub, 'setRefreshHints');
      collapseGroupSpy = jest.spyOn(dataViewStub, 'collapseGroup');
      expandGroupSpy = jest.spyOn(dataViewStub, 'expandGroup');

      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(group);
      const targetElm = document.createElement('div');
      targetElm.className = 'slick-group-toggle';
      clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: targetElm });
      Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
      Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
      preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      stopPropagationSpy = jest.spyOn(clickEvent, 'stopImmediatePropagation');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should expect call the DataView expand of the Group when original Group is collapsed', () => {
      group.groupingKey = 'age';
      group.collapsed = true;
      service.init(gridStub);
      gridStub.onClick.notify({ row: 0, cell: 2, grid: gridStub }, clickEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1
      });
      expect(expandGroupSpy).toHaveBeenCalledWith('age');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should expect call the DataView collapse of the Group when original Group is expanded', () => {
      group.groupingKey = 'age';
      group.collapsed = false;
      service.init(gridStub);
      gridStub.onClick.notify({ row: 0, cell: 2, grid: gridStub }, clickEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1
      });
      expect(collapseGroupSpy).toHaveBeenCalledWith('age');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('onKeyDown - grid cell keyboard typing handler', () => {
    let refreshHintSpy;
    let collapseGroupSpy;
    let preventDefaultSpy;
    let stopPropagationSpy;
    let expandGroupSpy;
    let keyDownEvent: Event;
    const group = new SlickGroup();
    const mockActiveCell = { row: 0, cell: 3 };
    const mockRange = { top: 10, bottom: 25 } as any;

    beforeEach(() => {
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(mockActiveCell);
      jest.spyOn(gridStub, 'getRenderedRange').mockReturnValue(mockRange);
      refreshHintSpy = jest.spyOn(dataViewStub, 'setRefreshHints');
      collapseGroupSpy = jest.spyOn(dataViewStub, 'collapseGroup');
      expandGroupSpy = jest.spyOn(dataViewStub, 'expandGroup');

      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(group);
      const targetElm = document.createElement('div');
      targetElm.className = 'slick-group-toggle';
      keyDownEvent = new Event('keydown');
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: ' ' });
      Object.defineProperty(keyDownEvent, 'isPropagationStopped', { writable: true, configurable: true, value: jest.fn() });
      Object.defineProperty(keyDownEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: jest.fn() });
      preventDefaultSpy = jest.spyOn(keyDownEvent, 'preventDefault');
      stopPropagationSpy = jest.spyOn(keyDownEvent, 'stopImmediatePropagation');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should expect call the DataView expand of the Group when original Group is collapsed', () => {
      group.groupingKey = 'age';
      group.collapsed = true;
      service.init(gridStub);
      gridStub.onKeyDown.notify({ row: 0, cell: 2, grid: gridStub }, keyDownEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1
      });
      expect(expandGroupSpy).toHaveBeenCalledWith('age');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should expect call the DataView collapse of the Group when original Group is expanded', () => {
      group.groupingKey = 'age';
      group.collapsed = false;
      service.init(gridStub);
      gridStub.onKeyDown.notify({ row: 0, cell: 2, grid: gridStub }, keyDownEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1
      });
      expect(collapseGroupSpy).toHaveBeenCalledWith('age');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
