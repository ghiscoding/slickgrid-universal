import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHtmlStringOutput } from '@slickgrid-universal/utils';

import type { Column, GridOption, GroupItemMetadataProviderOption } from '../../interfaces/index.js';
import { SlickGroupItemMetadataProvider } from '../slickGroupItemMetadataProvider.js';
import { type SlickDataView, SlickEvent, type SlickGrid, SlickGroup } from '../../core/index.js';
import * as utils from '../../core/utils.js';

const gridOptionMock = {
  enablePagination: true,
  backendServiceApi: {
    service: undefined,
    preProcess: vi.fn(),
    process: vi.fn(),
    postProcess: vi.fn(),
  },
} as unknown as GridOption;

const dataViewStub = {
  collapseGroup: vi.fn(),
  expandGroup: vi.fn(),
  setRefreshHints: vi.fn(),
  getFilteredItemCount: vi.fn(),
  getItemCount: vi.fn(),
  getItemMetadata: vi.fn(),
  getLength: vi.fn(),
  refresh: vi.fn(),
  reSort: vi.fn(),
  sort: vi.fn(),
  setItems: vi.fn(),
  onRowCountChanged: new SlickEvent(),
} as unknown as SlickDataView;

const gridStub = {
  autosizeColumns: vi.fn(),
  getActiveCell: vi.fn(),
  getColumnIndex: vi.fn(),
  getColumns: vi.fn(),
  getData: () => dataViewStub as SlickDataView,
  getDataItem: vi.fn(),
  getOptions: () => gridOptionMock,
  getRenderedRange: vi.fn(),
  getSortColumns: vi.fn(),
  invalidate: vi.fn(),
  onLocalSortChanged: vi.fn(),
  render: vi.fn(),
  setColumns: vi.fn(),
  setOptions: vi.fn(),
  setSortColumns: vi.fn(),
  onClick: new SlickEvent(),
  onKeyDown: new SlickEvent(),
  onSort: new SlickEvent(),
} as unknown as SlickGrid;

describe('GroupItemMetadataProvider Service', () => {
  let service: SlickGroupItemMetadataProvider;
  const mockColumns = [
    { id: 'firstName', field: 'firstName' },
    { id: 'lastName', field: 'lastName' },
    { id: 'age', field: 'age', groupTotalsFormatter: (totals) => `<strong>Totals:</strong> ${totals.sum}` },
  ] as Column[];

  beforeEach(() => {
    service = new SlickGroupItemMetadataProvider();
    vi.spyOn(utils, 'applyHtmlToElement').mockImplementation((elm, val) => {
      elm.innerHTML = `${val || ''}`;
    });
  });

  afterEach(() => {
    service?.destroy();
    service?.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should expect event handler to unsubscribeAll when disposing the service', () => {
    const eventSpy = vi.spyOn(service.eventHandler, 'unsubscribeAll');
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
      groupFormatter: expect.any(Function),
      totalsFormatter: expect.any(Function),
      includeHeaderTotals: false,
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
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: 'Some Title' }, {} as GridOption);
      expect(output).toBe('Some Title');
    });
    it('should provide HTMLElement and expect item title HTMLElement returned when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to False', () => {
      service.setOptions({ enableExpandCollapse: false });
      const spanElm = document.createElement('span');
      spanElm.textContent = 'Another Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: spanElm }, {} as GridOption);
      expect(output).toBe(spanElm);
    });

    it('should return Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: 'Some Title' }, {} as GridOption) as DocumentFragment;
      const htmlContent = [].map.call(output.childNodes, (x) => x.outerHTML).join('');
      expect(htmlContent).toBe(
        '<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0">Some Title</span>'
      );
    });

    it('should provide HTMLElement and return same Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const spanElm = document.createElement('span');
      spanElm.textContent = 'Another Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: spanElm }, {} as GridOption) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe(
        '<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0"><span>Another Title</span></span>'
      );
    });

    it('should provide a DocumentFragment as header title and return same Grouping info formatted with a group level 0 without indentation when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true });
      const fragment = document.createDocumentFragment();
      fragment.textContent = 'Fragment Title';
      const output = service.getOptions().groupFormatter!(0, 0, 'test', mockColumns[0], { title: fragment }, {} as GridOption) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe(
        '<span class="slick-group-toggle expanded" aria-expanded="true" style="margin-left: 0px;"></span><span class="slick-group-title" level="0">Fragment Title</span>'
      );
    });

    it('should return Grouping info formatted with a group level 2 with indentation of 30px when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True and level 2', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true, toggleCssClass: 'groupy-toggle', toggleExpandedCssClass: 'groupy-expanded' });
      const output = service.getOptions().groupFormatter!(
        0,
        0,
        'test',
        mockColumns[0],
        { level: 2, title: 'Some Title' },
        {} as GridOption
      ) as DocumentFragment;
      const htmlContent = getHtmlStringOutput(output, 'outerHTML');
      expect(htmlContent).toBe(
        '<span class="groupy-toggle groupy-expanded" aria-expanded="true" style="margin-left: 30px;"></span><span class="slick-group-title" level="2">Some Title</span>'
      );
    });

    it('should return Grouping info formatted with a group level 2 with indentation of 30px when calling "defaultGroupCellFormatter" with option "enableExpandCollapse" set to True and level 2', () => {
      service.init(gridStub);
      service.setOptions({ enableExpandCollapse: true, toggleCssClass: 'groupy-toggle', toggleCollapsedCssClass: 'groupy-collapsed' });
      const output = service.getOptions().groupFormatter!(
        0,
        0,
        'test',
        mockColumns[0],
        { collapsed: true, level: 3, title: 'Some Title' },
        gridOptionMock
      ) as DocumentFragment;
      const htmlContent = [].map.call(output.childNodes, (x) => x.outerHTML).join('');
      expect(htmlContent).toBe(
        '<span class="groupy-toggle groupy-collapsed" aria-expanded="false" style="margin-left: 45px;"></span><span class="slick-group-title" level="3">Some Title</span>'
      );
    });
  });

  describe('Group Totals Formatter', () => {
    it('should return Grouping Totals formatted with column definition "groupTotalsFormatter" called when defined', () => {
      const mockDataContext = { sum: 152, avg: 33 };
      const output = service.getOptions().totalsFormatter!(0, 0, 'some value', mockColumns[2], mockDataContext, {} as GridOption);
      expect(output).toBe('<strong>Totals:</strong> 152');
    });

    it('should return empty string when column definition does not include grouping info formatter', () => {
      const mockDataContext = { sum: 152, avg: 33 };
      const output = service.getOptions().totalsFormatter!(0, 0, 'some value', mockColumns[0], mockDataContext, {} as GridOption);
      expect(output).toBe('');
    });
  });

  describe('getGroupRowMetadata method', () => {
    it('should return a formatted Group row including header totals when calling associated getter method with "includeHeaderTotals" enabled', () => {
      const mockOptions = { groupFocusable: true, groupCssClass: 'groupy-group', includeHeaderTotals: true } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getGroupRowMetadata({ count: 12, level: undefined as any, groupingKey: 'age', value: 33 }, 0);
      expect(output).toEqual({
        selectable: false,
        focusable: mockOptions.groupFocusable,
        cssClasses: `${mockOptions.groupCssClass} slick-group-level-0`,
        formatter: service.getOptions().totalsFormatter,
        columns: {
          0: {
            colspan: '1',
            formatter: service.getOptions().groupFormatter,
            editorClass: null,
          },
        },
      });
    });

    it('should return a formatted Group row with column full colspan when calling associated getter method without "includeHeaderTotals"', () => {
      const mockOptions = { groupFocusable: true, groupCssClass: 'groupy-group', includeHeaderTotals: false } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getGroupRowMetadata({ count: 12, level: 2, groupingKey: 'age', value: 33 }, 0);
      expect(output).toEqual({
        selectable: false,
        focusable: mockOptions.groupFocusable,
        cssClasses: `${mockOptions.groupCssClass} slick-group-level-2`,
        formatter: undefined,
        columns: {
          0: {
            colspan: '*',
            formatter: service.getOptions().groupFormatter,
            editorClass: null,
          },
        },
      });
    });
  });

  describe('getTotalsRowMetadata method', () => {
    it('should return a formatted Group Totals row using options provided', () => {
      const mockOptions = { totalsFocusable: true, totalsCssClass: 'groupy-totals' } as GroupItemMetadataProviderOption;
      service.setOptions(mockOptions);

      const output = service.getTotalsRowMetadata({ group: { count: 12, level: undefined as any, groupingKey: 'age', value: 33 } }, 0);
      expect(output).toEqual({
        editorClass: null,
        selectable: false,
        focusable: mockOptions.totalsFocusable,
        cssClasses: `groupy-totals slick-group-level-0`,
        formatter: service.getOptions().totalsFormatter,
      });
    });

    it('should return a formatted Group Totals with defaults options when nothing is provided', () => {
      const output = service.getTotalsRowMetadata({ group: { count: 12, level: 3, groupingKey: 'age', value: 33 } }, 0);
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
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue(mockRange);
      refreshHintSpy = vi.spyOn(dataViewStub, 'setRefreshHints');
      collapseGroupSpy = vi.spyOn(dataViewStub, 'collapseGroup');
      expandGroupSpy = vi.spyOn(dataViewStub, 'expandGroup');

      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(group);
      const targetElm = document.createElement('div');
      targetElm.className = 'slick-group-toggle';
      clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: targetElm });
      Object.defineProperty(clickEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      Object.defineProperty(clickEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      stopPropagationSpy = vi.spyOn(clickEvent, 'stopImmediatePropagation');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should expect call the DataView expand of the Group when original Group is collapsed', () => {
      group.groupingKey = 'age';
      group.collapsed = true;
      service.init(gridStub);
      gridStub.onClick.notify({ row: 0, cell: 2, grid: gridStub }, clickEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1,
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
        ignoreDiffsAfter: mockRange.bottom + 1,
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
      vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(mockActiveCell);
      vi.spyOn(gridStub, 'getRenderedRange').mockReturnValue(mockRange);
      refreshHintSpy = vi.spyOn(dataViewStub, 'setRefreshHints');
      collapseGroupSpy = vi.spyOn(dataViewStub, 'collapseGroup');
      expandGroupSpy = vi.spyOn(dataViewStub, 'expandGroup');

      vi.spyOn(gridStub, 'getDataItem').mockReturnValue(group);
      const targetElm = document.createElement('div');
      targetElm.className = 'slick-group-toggle';
      keyDownEvent = new Event('keydown');
      Object.defineProperty(keyDownEvent, 'key', { writable: true, configurable: true, value: ' ' });
      Object.defineProperty(keyDownEvent, 'isPropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      Object.defineProperty(keyDownEvent, 'isImmediatePropagationStopped', { writable: true, configurable: true, value: vi.fn() });
      preventDefaultSpy = vi.spyOn(keyDownEvent, 'preventDefault');
      stopPropagationSpy = vi.spyOn(keyDownEvent, 'stopImmediatePropagation');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should expect call the DataView expand of the Group when original Group is collapsed', () => {
      group.groupingKey = 'age';
      group.collapsed = true;
      service.init(gridStub);
      gridStub.onKeyDown.notify({ row: 0, cell: 2, grid: gridStub }, keyDownEvent);

      expect(refreshHintSpy).toHaveBeenCalledWith({
        ignoreDiffsBefore: mockRange.top,
        ignoreDiffsAfter: mockRange.bottom + 1,
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
        ignoreDiffsAfter: mockRange.bottom + 1,
      });
      expect(collapseGroupSpy).toHaveBeenCalledWith('age');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
