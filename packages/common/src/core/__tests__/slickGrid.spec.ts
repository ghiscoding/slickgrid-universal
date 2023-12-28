import { InputEditor, LongTextEditor } from '../../editors';
import { SlickCellSelectionModel, SlickRowSelectionModel } from '../../extensions';
import { Column, Editor, FormatterResultWithHtml, FormatterResultWithText, GridOption } from '../../interfaces';
import { SlickEventData } from '../slickCore';
import { SlickDataView } from '../slickDataview';
import { SlickGrid } from '../slickGrid';

jest.useFakeTimers();

const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const containerId = 'demo-container';
const template =
  `<div id="${containerId}" style="height: 800px; width: 600px; overflow: hidden; display: block;">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid}" style="width: 100%">
      <div class="slick-pane slick-pane-header slick-pane-left" tabindex="0" style="width: 100%;">
        <div class="slick-viewport slick-viewport-top slick-viewport-left" style="overflow:hidden;position:relative;">
          <div class="grid-canvas" style="height: 12500px; width: 500px;"></div>
        </div>
      </div>
    </div>
  </div>`;

describe('SlickGrid core file', () => {
  let container: HTMLElement;
  let grid: SlickGrid;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    container.innerHTML = template;
    document.body.appendChild(container);
    Object.defineProperty(container, 'clientHeight', { writable: true, configurable: true, value: 600 });
    Object.defineProperty(container, 'clientWidth', { writable: true, configurable: true, value: 800 });
  });

  afterEach(() => {
    document.body.textContent = '';
    grid?.destroy(true);
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);
    expect(grid.getCanvases()).toBeTruthy();
    expect(grid.getCanvasNode()).toBeTruthy();
    expect(grid.getActiveCanvasNode()).toBeTruthy();
    expect(grid.getContainerNode()).toEqual(container);
  });

  it('should be able to instantiate SlickGrid and get columns', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', headerCssClass: 'header-class', headerCellAttrs: { 'some-attr': 3 } }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(grid).toBeTruthy();
    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('header-class')).toBeTruthy();
    expect(colHeaderElms[0].getAttribute('some-attr')).toBe('3');
    expect(grid.getOptions().addNewRowCssClass).toBe('new-class');
    expect(grid.getData()).toEqual([]);
    expect(grid.getColumns()).toEqual(columns);
    expect(grid.getColumnIndex('firstName')).toBe(0);

    const columnsMock = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ] as Column[];
    grid.setColumns(columnsMock);

    expect(grid.getColumns()).toEqual(columnsMock);
    expect(grid.getColumnIndex('age')).toBe(2);
    expect(grid.getColumnIndex('invalid')).toBeUndefined();
  });

  it('should be able to instantiate SlickGrid and set headerCssClass and expect it in column header', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', headerCssClass: 'header-class' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('header-class')).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid and set headerCellAttrs and expect it in column header', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', headerCellAttrs: { 'some-attr': 3 } }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].getAttribute('some-attr')).toBe('3');
  });

  it('should expect "slick-header-sortable" when column is sortable', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', sortable: true }] as Column[];
    const options = { enableCellNavigation: true, enableColumnReorder: () => true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('slick-header-sortable')).toBeTruthy();
  });

  it('should expect "slick-header-sortable" when column is sortable', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', sortable: true }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();
    grid.setOptions({ addNewRowCssClass: 'new-class' });
    const colHeaderElms = container.querySelectorAll('.slick-header-columns .slick-header-column');

    expect(colHeaderElms.length).toBe(1);
    expect(colHeaderElms[0].classList.contains('slick-header-sortable')).toBeTruthy();
  });

  it('should be able to instantiate SlickGrid without data and later add data with "setData()"', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual([]);

    const scrollToSpy = jest.spyOn(grid, 'scrollTo');
    grid.setData([{ id: 0, firstName: 'John' }, { id: 1, firstName: 'Jane' }], true);

    expect(grid.getDataLength()).toBe(2);
    expect(scrollToSpy).toHaveBeenCalledWith(0);
  });

  it('should be able to instantiate SlickGrid without DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    const dim = grid.getScrollbarDimensions();
    const dim2 = grid.getDisplayedScrollbarDimensions();

    expect(grid).toBeTruthy();
    expect(dim).toEqual({ height: 0, width: 0 });
    expect(dim2).toEqual({ height: 0, width: 0 });
  });

  it('should be able to instantiate SlickGrid and invalidate some rows', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', cellAttrs: { 'cell-attr': 22 }, }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const data = [{ id: 0, firstName: 'John' }, { id: 1, firstName: 'Jane' }];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    const invalidSpy = jest.spyOn(grid, 'invalidateAllRows');
    const renderSpy = jest.spyOn(grid, 'render');
    const updateSpy = jest.spyOn(grid, 'updateRowCount');

    grid.setData(data);
    grid.invalidate();
    const cellElms = container.querySelectorAll('.slick-cell.l0.r0');

    expect(cellElms[0].getAttribute('cell-attr')).toBe('22');
    expect(invalidSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
  });

  it('should be able to edit when editable grid option is enabled and invalidate some rows', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editor: InputEditor }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const data = [{ id: 0, firstName: 'John' }, { id: 1, firstName: 'Jane' }];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, { ...options, editable: true, enableAsyncPostRenderCleanup: true });
    grid.setData(data);
    grid.setActiveCell(0, 0);
    grid.editActiveCell(InputEditor as any, true);

    const onBeforeSpy = jest.spyOn(grid.onBeforeCellEditorDestroy, 'notify');
    grid.invalidateAllRows();

    expect(onBeforeSpy).toHaveBeenCalled();
  });

  it('should be able to edit when editable grid option is enabled and invalidate all rows', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editor: InputEditor }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const data = [{ id: 0, firstName: 'John' }, { id: 1, firstName: 'Jane' }];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, { ...options, editable: true });
    grid.setData(data);
    grid.setActiveCell(0, 0);
    grid.editActiveCell(InputEditor as any, true);

    const onBeforeSpy = jest.spyOn(grid.onBeforeCellEditorDestroy, 'notify');
    grid.invalidateRows([0, 1]);

    expect(onBeforeSpy).toHaveBeenCalled();
  });

  it('should throw when trying to edit cell when editable grid option is disabled', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const data = [{ id: 0, firstName: 'John' }, { id: 1, firstName: 'Jane' }];

    grid = new SlickGrid<any, Column>('#myGrid', [], columns, options);
    grid.setData(data);
    grid.setActiveRow(0, 0);
    grid.setActiveCell(0, 0);
    expect(() => grid.editActiveCell(new InputEditor({ container: document.createElement('div'), column: columns[0], grid } as any, 'text'), true))
      .toThrow('SlickGrid makeActiveCellEditable : should never get called when grid options.editable is false');
    grid.invalidateRows([0, 1]);
  });

  it('should be able to instantiate SlickGrid with a DataView', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const dv = new SlickDataView({});
    grid = new SlickGrid<any, Column>(container, dv, columns, options);
    grid.init();

    expect(grid).toBeTruthy();
    expect(grid.getData()).toEqual(dv);
    expect(dv.getItems()).toEqual([]);
    expect(grid.getUID()).toMatch(/slickgrid_\d*$/);
  });

  it('should be able to add CSS classes to all Viewports', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, viewportClass: 'vp-class1 vp-class2', devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>(container, [], columns, options);
    grid.init();
    const vpElms = container.querySelectorAll('.slick-viewport');

    expect(grid).toBeTruthy();
    expect(vpElms.length).toBe(4);
    expect(grid.getViewport()).toBeTruthy();
    expect(grid.getViewports().length).toBe(4);
    expect(grid.getViewportRowCount()).toBe(0);
    expect(vpElms[0].classList.contains('slick-viewport')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[0].classList.contains('vp-class2')).toBeTruthy();
    expect(vpElms[1].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[2].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[3].classList.contains('vp-class1')).toBeTruthy();
    expect(vpElms[3].classList.contains('vp-class2')).toBeTruthy();
  });

  it('should throw when no container provided', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const dv = new SlickDataView({});
    grid = null as any;

    expect(() => new SlickGrid<any, Column>(null as any, dv, columns, options)).toThrow('SlickGrid requires a valid container');
  });

  describe('Pre-Header Panel', () => {
    it('should create a preheader panel when enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, preHeaderPanelHeight: 30, showPreHeaderPanel: true, createPreHeaderPanel: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const preheaderElm = container.querySelector('.slick-preheader-panel');
      const preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');

      expect(grid).toBeTruthy();
      expect(preheaderElm).toBeTruthy();
      expect(preheaderElm?.querySelectorAll('div').length).toBe(3);
      expect(preheaderElms[0].style.display).not.toBe('none');
      expect(preheaderElms[1].style.display).not.toBe('none');
      expect(grid.getPreHeaderPanel()).toBeTruthy();
      expect(grid.getPreHeaderPanel()).toEqual(grid.getPreHeaderPanelLeft());
      expect(grid.getPreHeaderPanelRight().outerHTML).toBe('<div></div>');
    });

    it('should hide column headers div when "showPreHeaderPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, preHeaderPanelHeight: 30, showPreHeaderPanel: false, createPreHeaderPanel: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');

      expect(grid).toBeTruthy();
      expect(preheaderElms).toBeTruthy();
      expect(preheaderElms[0].style.display).toBe('none');
      expect(preheaderElms[1].style.display).toBe('none');

      grid.setPreHeaderPanelVisibility(true);
      preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');
      expect(preheaderElms[0].style.display).not.toBe('none');
      expect(preheaderElms[1].style.display).not.toBe('none');
    });
  });

  describe('Headers', () => {
    it('should show column headers div by default', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElm = container.querySelector('.slick-header') as HTMLDivElement;

      expect(grid.getHeaderRow()).toBeTruthy();
      expect(grid.getHeaderRowColumn('firstName')).toBeUndefined();
      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
    });

    it('should hide column headers div when "showColumnHeader" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showColumnHeader: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');

      expect(grid).toBeTruthy();
      expect(headerElms).toBeTruthy();
      expect(headerElms[0].style.display).toBe('none');
      expect(headerElms[1].style.display).toBe('none');

      grid.setColumnHeaderVisibility(true);
      headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');
    });
  });

  describe('Footer', () => {
    it('should show footer when "showFooterRow" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: true, showFooterRow: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });

    it('should hide column headers div when "showFooterRow" is disabled and expect defined footer row column', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: true, showFooterRow: false, frozenColumn: 1, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setFooterRowVisibility(true);
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn('firstName')).toEqual(footerElms[0].querySelector('.slick-footerrow-column'));
    });

    it('should hide column headers div when "showFooterRow" is disabled and expect undefined footer row column', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: true, showFooterRow: false, frozenColumn: 1, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(grid.getFooterRow()).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');

      grid.setFooterRowVisibility(true);
      footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
      expect(grid.getFooterRowColumn(2)).toBeUndefined();
    });

    it('should hide column headers div when "showFooterRow" is disabled and return undefined footer row column', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: false, showFooterRow: false, frozenColumn: 1, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let footerElm = container.querySelector<HTMLDivElement>('.slick-footerrow');

      expect(grid.getFooterRow()).toBeFalsy();
      expect(footerElm).toBeFalsy();
      expect(grid.getFooterRowColumn('firstName')).toBeUndefined();
    });
  });

  describe('Top Panel', () => {
    it('should show top panel div when "showTopPanel" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showTopPanel: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel');
      const topPanelScrollerElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(grid.getTopPanel()).toEqual(topPanelElms[0]);
      expect(grid.getTopPanels()).toEqual([topPanelElms[0], topPanelElms[1]]);
      expect(topPanelScrollerElms.length).toBe(2);
      expect(topPanelScrollerElms[0].style.display).not.toBe('none');
      expect(topPanelScrollerElms[1].style.display).not.toBe('none');
    });

    it('should hide top panel div when "showTopPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showTopPanel: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(topPanelElms).toBeTruthy();
      expect(topPanelElms[0].style.display).toBe('none');
      expect(topPanelElms[1].style.display).toBe('none');

      grid.setTopPanelVisibility(true);
      topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');
      expect(topPanelElms[0].style.display).not.toBe('none');
      expect(topPanelElms[1].style.display).not.toBe('none');
    });
  });

  describe('Header Row', () => {
    it('should show top panel div when "showHeaderRow" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, showHeaderRow: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElms = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElms.length).toBe(2);
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');
      expect(grid.getHeaderRowColumn('firstName')).toEqual(headerElms[0].querySelector('.slick-headerrow-column'));
    });

    it('should hide top panel div when "showHeaderRow" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, showHeaderRow: false, frozenColumn: 1, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');

      grid.setHeaderRowVisibility(true);
      headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      expect(headerElm[0].style.display).not.toBe('none');
      expect(headerElm[1].style.display).not.toBe('none');
      expect(grid.getHeaderRowColumn('firstName')).toBeUndefined();
    });

    it('should hide top panel div when "showHeaderRow" is disabled and return undefined header row column', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }, { id: 'lastName', field: 'lastName', name: 'Last Name' }] as Column[];
      const options = { enableCellNavigation: true, showHeaderRow: false, frozenColumn: 1, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      let headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');

      grid.setHeaderRowVisibility(true);
      headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');
      expect(headerElm[0].style.display).not.toBe('none');
      expect(headerElm[1].style.display).not.toBe('none');
      expect(grid.getHeaderRowColumn(2)).toBeUndefined();
    });
  });

  describe('applyHtmlCode() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const dv = new SlickDataView({});

    it('should be able to apply HTMLElement to a HTMLElement target and empty its content by default', () => {
      const divElm = document.createElement('div');
      divElm.textContent = 'text to be erased';
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, spanElm);

      expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
    });

    it('should be able to apply HTMLElement to a HTMLElement target but not empty its content when defined', () => {
      const divElm = document.createElement('div');
      divElm.textContent = 'text not erased';
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, spanElm, { emptyTarget: false });

      expect(divElm.outerHTML).toBe('<div>text not erased<span>some text</span></div>');
    });

    it('should be able to apply DocumentFragment to a HTMLElement target', () => {
      const fragment = document.createDocumentFragment();
      const divElm = document.createElement('div');
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some text';
      divElm.appendChild(spanElm);
      fragment.appendChild(spanElm);

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, fragment);

      expect(divElm.outerHTML).toBe('<div><span>some text</span></div>');
    });

    it('should be able to apply a number and not expect it to be sanitized but parsed as string', () => {
      const divElm = document.createElement('div');

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, 123);

      expect(divElm.outerHTML).toBe('<div>123</div>');
    });

    it('should be able to apply a boolean and not expect it to be sanitized but parsed as string', () => {
      const divElm = document.createElement('div');

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, false);

      expect(divElm.outerHTML).toBe('<div>false</div>');
    });

    it('should be able to supply a custom sanitizer to use before applying html code', () => {
      const sanitizer = (dirtyHtml: string) => typeof dirtyHtml === 'string' ? dirtyHtml.replace(/(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi, '') : dirtyHtml;
      const divElm = document.createElement('div');
      const htmlStr = '<span><script>alert("hello")</script>only text kept</span>';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, { ...options, sanitizer });
      grid.applyHtmlCode(divElm, htmlStr);

      expect(divElm.outerHTML).toBe('<div><span>only text kept</span></div>');
    });

    it('should be able to supply differnt sanitizer options to use with DOMPurify before applying html code', () => {
      const divElm = document.createElement('div');
      const htmlStr = '<span aria-label="some aria label">only text kept</span>';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyHtmlCode(divElm, htmlStr, { sanitizerOptions: { ALLOW_ARIA_ATTR: false } });

      expect(divElm.outerHTML).toBe('<div><span>only text kept</span></div>');
    });

    it('should expect HTML string to be kept as a string and not be converted (but html escaped) when "enableHtmlRendering" grid option is disabled', () => {
      const divElm = document.createElement('div');
      const htmlStr = '<span aria-label="some aria label">only text kept</span>';

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, { ...options, enableHtmlRendering: false });
      grid.applyHtmlCode(divElm, htmlStr);

      expect(divElm.outerHTML).toBe('<div>&lt;span aria-label="some aria label"&gt;only text kept&lt;/span&gt;</div>');
    });
  });

  describe('applyFormatResultToCellNode() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const dv = new SlickDataView({});
    const cellNodeElm = document.createElement('div');
    cellNodeElm.className = 'slick-cell';

    it('should expect cell target to be empty string when formatter result is null', () => {
      const formatterResult = null as any;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell"></div>');
    });

    it('should be able to apply HTMLElement returned by a Formatter to a HTMLElement target', () => {
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some content';
      const formatterResult = spanElm;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell"><span>some content</span></div>');
    });

    it('should be able to apply text, CSS classes and tooltip when Formatter is returnbing FormatterResultWithText', () => {
      const formatterResult = { addClasses: 'some-class', toolTip: 'some tooltip', text: 'some content' } as FormatterResultWithText;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell some-class" title="some tooltip">some content</div>');
    });

    it('should be able to apply text, CSS classes and tooltip when Formatter is returnbing FormatterResultWithHtml', () => {
      const divElm = document.createElement('div');
      const spanElm = document.createElement('span');
      spanElm.textContent = 'some content';
      divElm.appendChild(spanElm);
      const formatterResult = { addClasses: 'some-class', toolTip: 'some tooltip', html: divElm } as FormatterResultWithHtml;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="slick-cell some-class" title="some tooltip"><div><span>some content</span></div></div>');
    });

    it('should be able to apply text, CSS classes and removed CSS classes when Formatter is returnbing FormatterResultWithText', () => {
      const formatterResult = { addClasses: 'some-class', removeClasses: 'slick-cell', toolTip: 'some tooltip', text: 'some content' } as FormatterResultWithText;

      grid = new SlickGrid<any, Column>('#myGrid', dv, columns, options);
      grid.applyFormatResultToCellNode(formatterResult, cellNodeElm);

      expect(cellNodeElm.outerHTML).toBe('<div class="some-class" title="some tooltip">some content</div>');
    });
  });

  describe('highlightRow() method', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
    const dv = new SlickDataView({});

    it('should call the method and expect the highlight to happen for a certain duration', () => {
      const mockItems = [{ id: 0, firstName: 'John', lastName: 'Doe', age: 30 }, { id: 0, firstName: 'Jane', lastName: 'Doe', age: 28 }];

      grid = new SlickGrid<any, Column>(container, dv, columns, options);
      dv.addItems(mockItems);
      grid.init();
      grid.render();

      grid.highlightRow(0, 10);
      expect(grid).toBeTruthy();
      expect(grid.getDataLength()).toBe(2);
      expect(grid.getHeader(columns[0])).toBeInstanceOf(HTMLDivElement);
      expect(grid.getHeaderColumn(columns[0].id)).toBeInstanceOf(HTMLDivElement);

      let slickRowElms = container.querySelectorAll<HTMLDivElement>('.slick-row');
      expect(slickRowElms.length).toBe(2);
      expect(slickRowElms[0].classList.contains('highlight-animate')).toBeTruthy(); // only 1st row is highlighted
      expect(slickRowElms[1].classList.contains('highlight-animate')).toBeFalsy();

      jest.runAllTimers(); // fast-forward timer

      slickRowElms = container.querySelectorAll<HTMLDivElement>('.slick-row');
      expect(slickRowElms.length).toBe(2);
      expect(slickRowElms[0].classList.contains('highlight-animate')).toBeFalsy();
      expect(slickRowElms[1].classList.contains('highlight-animate')).toBeFalsy();
    });
  });

  describe('plugins', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;

    it('should be able to register a plugin', () => {
      const rowSelectionModel = new SlickRowSelectionModel();
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.setSelectionModel(rowSelectionModel);
      rowSelectionModel.init(grid);

      grid.registerPlugin(rowSelectionModel);
      let loadedPlugin = grid.getPluginByName<SlickRowSelectionModel>('RowSelectionModel');
      const selectionModel = grid.getSelectionModel();
      expect(loadedPlugin).toBeTruthy();
      expect(selectionModel).toBeTruthy();

      grid.unregisterPlugin(loadedPlugin as SlickRowSelectionModel);
      loadedPlugin = grid.getPluginByName<SlickRowSelectionModel>('RowSelectionModel');
      expect(loadedPlugin).toBeFalsy();

      const p = grid.getPluginByName('RowSelectionModel');
      expect(p).toBeFalsy();
    });

    it('should clear previous selection model when calling setSelectionModel() with a different model', () => {
      const rowSelectionModel = new SlickRowSelectionModel();
      const rowSelectSpy = jest.spyOn(rowSelectionModel, 'destroy');
      const cellSelectionModel = new SlickCellSelectionModel();

      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.setSelectionModel(rowSelectionModel);
      grid.setSelectionModel(cellSelectionModel);

      expect(rowSelectSpy).toHaveBeenCalled();
    });
  });

  describe('Node Getters', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;

    describe('getActiveCanvasNode() function', () => {
      it('should return undefined when calling the method when the Event does not include any target', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new CustomEvent('click');
        const result = grid.getActiveCanvasNode(mockEvent);

        expect(result).toBeFalsy();
      });

      it('should return closest grid canvas when calling the method when the Event includes grid canvas', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new MouseEvent('click');
        const gridCanvasElm = container.querySelector('.grid-canvas');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: gridCanvasElm });
        const result = grid.getActiveCanvasNode(mockEvent);

        expect(result).toEqual(gridCanvasElm);
      });

      it('should return grid canvas when event is null', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const result = grid.getActiveCanvasNode();

        expect(result).toEqual(container.querySelector('.grid-canvas'));
      });

      it('should return native event from SlickEventData when it is an instance of it', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new MouseEvent('click');
        const gridCanvasElm = container.querySelector('.grid-canvas');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: gridCanvasElm });
        const ed = new SlickEventData(mockEvent);
        const result = grid.getActiveCanvasNode(ed);

        expect(result).toEqual(gridCanvasElm);
      });
    });

    describe('getActiveViewportNode() function', () => {
      it('should return undefined when calling the method when the Event does not include any target', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new CustomEvent('click');
        const result = grid.getActiveViewportNode(mockEvent);

        expect(result).toBeFalsy();
      });

      it('should return closest grid canvas when calling the method when the Event includes grid canvas', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new MouseEvent('click');
        const viewportElm = container.querySelector('.slick-viewport');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: viewportElm });
        const result = grid.getActiveViewportNode(mockEvent);

        expect(result).toEqual(viewportElm);
      });

      it('should return native event from SlickEventData when it is an instance of it', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const mockEvent = new MouseEvent('click');
        const viewportElm = container.querySelector('.slick-viewport');
        Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: viewportElm });
        const ed = new SlickEventData(mockEvent);
        const result = grid.getActiveViewportNode(ed);

        expect(result).toEqual(viewportElm);
      });
    });

    describe('getViewportNode() function', () => {
      it('should return viewport element when calling the function when found in the grid container', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const result = grid.getViewportNode();

        expect(result).toBeTruthy();
        expect(result).toEqual(container.querySelector('.slick-viewport'));
      });

      it('should return viewport element when calling the function when found in the grid container', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, frozenRow: 2, frozenBottom: true });
        const result = grid.getViewportNode(22, 3);

        expect(result).toBeTruthy();
        expect(result!.className).toEqual('slick-viewport slick-viewport-bottom slick-viewport-left');
        expect(result!.querySelector('div')!.className).toEqual('grid-canvas grid-canvas-bottom grid-canvas-left');
        expect(result!.querySelector('.slick-row.frozen')).toBeTruthy();
        expect(result!.querySelector('.slick-cell')).toBeTruthy();
      });

      it('should return undefined when calling the function when getViewports() is returning undefined', () => {
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        jest.spyOn(grid, 'getViewports').mockReturnValueOnce(null as any);
        const result = grid.getViewportNode();

        expect(result).toBeFalsy();
      });

      it('should return slick header left & right depending on frozenColumn index', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, fullWidthRows: true, frozenColumn: 1 });

        expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
        expect((grid.getHeader()[0] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-left');
        expect((grid.getHeader()[1] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-right');
      });
    });

    describe('Grid Dimensions', () => {
      it('should return default column width when column is not wider than grid and fullWidthRows is disabled with mixinDefaults is enabled', () => {
        const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, mixinDefaults: true });
        const result = grid.getCanvasWidth();

        expect(result).toBe(80);
        expect(grid.getAbsoluteColumnMinWidth()).toBe(0);
        expect(grid.getHeaderColumnWidthDiff()).toBe(0);
      });

      it('should return default full grid width when column is not wider than grid but fullWidthRows is enabled', () => {
        const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, fullWidthRows: true });
        const result = grid.getCanvasWidth();

        expect(result).toBe(800);
      });

      it('should return original grid width of 800px', () => {
        const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, fullWidthRows: true });
        const result = grid.getCanvasWidth();

        expect(result).toBe(800);
      });

      it('should return left viewport width of 160px which is the default column width times 2', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, frozenColumn: 1 });
        const result = grid.getCanvasWidth();
        grid.autosizeColumns();
        grid.reRenderColumns();
        grid.render();
        grid.updateColumnHeader(1);

        expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
        expect(grid.getHeader(columns[0])).toBeInstanceOf(HTMLDivElement);
        expect(grid.getVisibleColumns().length).toBe(2);
        expect(result).toBe(80 * 2);
      });

      it('should return visible columns', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, frozenColumn: 1 });
        const updateSpy = jest.spyOn(grid.onBeforeUpdateColumns, 'notify');
        grid.updateColumns();
        expect(grid.getVisibleColumns().length).toBe(2);

        const newColumns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: false },
          { id: 'lastName', field: 'lastName', name: 'Last Name', hidden: true },
          { id: 'age', field: 'age', name: 'age', hidden: true },
        ] as Column[];
        grid.setColumns(newColumns);

        expect(updateSpy).toHaveBeenCalled();
        expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
        expect(grid.getVisibleColumns().length).toBe(1);
      });

      it('should return full grid width when fullWidthRows is enabled even with frozenColumn defined', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, fullWidthRows: true, frozenColumn: 1 });
        const result = grid.getCanvasWidth();

        expect(grid.getVisibleColumns().length).toBe(2);
        expect(result).toBe(800);
        expect(grid.getHeader()[0]).toBeInstanceOf(HTMLDivElement);
        expect((grid.getHeader()[0] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-left');
        expect((grid.getHeader()[1] as HTMLDivElement).className).toBe('slick-header-columns slick-header-columns-right');
      });

      it('should return viewport element when calling the function when found in the grid container', () => {
        const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, options);
        const result = grid.getHeadersWidth();

        expect(result).toBe(2800); // (1000 * 1) + 1000 + gridWidth 800
      });

      it('should return viewport element when calling the function when found in the grid container', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name', hidden: true },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
          { id: 'age', field: 'age', name: 'age' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, frozenColumn: 1 });
        grid.init();
        const result = grid.getHeadersWidth();

        expect(result).toBe(800 + (1000 + 80 * 2) + 1000 + 1000); // Left + Right => 800 + (1000 + (defaultColumnWidth * 2)) * 2 + 1000
      });

      it('should return viewport element when calling the function when found in the grid container', () => {
        const columns = [
          { id: 'firstName', field: 'firstName', name: 'First Name' },
          { id: 'lastName', field: 'lastName', name: 'Last Name' },
        ] as Column[];
        grid = new SlickGrid<any, Column>(container, [], columns, { ...options, frozenColumn: 1 });
        grid.init();
        const result = grid.getHeadersWidth();

        expect(result).toBe(800 + (1000 + 80 * 2) * 2 + 1000); // Left + Right => 800 + (1000 + (defaultColumnWidth * 2)) * 2 + 1000
      });
    });
  });

  describe('updateColumnHeader() method', () => {
    const columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
    ] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;

    it('should be able to change Header text content and title tooltip', () => {
      grid = new SlickGrid<any, Column>(container, [], [...columns], options);
      const onBeforeHeaderSpy = jest.spyOn(grid.onBeforeHeaderCellDestroy, 'notify');
      const onHeaderCellRenderSpy = jest.spyOn(grid.onHeaderCellRendered, 'notify');
      let column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Last Name');

      grid.updateColumnHeader('lastName', 'Middle Name', 'middle name tooltip');

      column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Middle Name');
      expect(column2Elm[1].title).toBe('middle name tooltip');
      expect(onBeforeHeaderSpy).toHaveBeenCalled();
      expect(onHeaderCellRenderSpy).toHaveBeenCalled();
    });

    it('should not be able to change Header text content when enabling "explicitInitialization" and we called updateColumnHeader() and init() was not called', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, { ...options, explicitInitialization: true });

      grid.updateColumnHeader('lastName', 'Middle Name', 'middle name tooltip');

      const column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm.length).toBe(0);
    });

    it('should not be able to change any Header text content when column provided is invalid', () => {
      grid = new SlickGrid<any, Column>(container, [], [...columns], options);
      let column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[1].textContent).toBe('Last Name');

      grid.updateColumnHeader('unknown', 'Middle Name', 'middle name tooltip');

      column2Elm = container.querySelectorAll<HTMLDivElement>('.slick-header-columns .slick-header-column');
      expect(column2Elm[0].textContent).toBe('First Name');
      expect(column2Elm[1].textContent).toBe('Last Name');
    });
  });

  describe('reRenderColumns() method', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;

    it('should force grid render when calling method with true argument provided', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      const invalidateSpy = jest.spyOn(grid, 'invalidateAllRows');
      const renderSpy = jest.spyOn(grid, 'render');

      grid.reRenderColumns(true);

      expect(invalidateSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Editors', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name', editor: LongTextEditor }] as Column[];
    const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;

    it('should ', () => {
      grid = new SlickGrid<any, Column>(container, [], columns, options);

      const result = grid.getEditController();

      expect(result).toBeTruthy();
    });
  });
});