import { Column, FormatterResultWithHtml, FormatterResultWithText, GridOption } from '../../interfaces';
import { SlickDataView } from '../slickDataview';
import { SlickGrid } from '../slickGrid';

jest.useFakeTimers();

describe('SlickGrid core file', () => {
  let container: HTMLElement;
  let grid: SlickGrid;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'myGrid';
    document.body.appendChild(container);
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
  });

  it('should be able to add CSS classes to all Viewports', () => {
    const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
    const options = { enableCellNavigation: true, viewportClass: 'vp-class1 vp-class2', devMode: { ownerNodeIndex: 0 } } as GridOption;
    grid = new SlickGrid<any, Column>(container, [], columns, options);
    grid.init();
    const vpElms = container.querySelectorAll('.slick-viewport');

    expect(grid).toBeTruthy();
    expect(vpElms.length).toBe(4);
    expect(grid.getViewports().length).toBe(4);
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
    });

    it('should hide column headers div when "showPreHeaderPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, preHeaderPanelHeight: 30, showPreHeaderPanel: false, createPreHeaderPanel: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const preheaderElms = container.querySelectorAll<HTMLDivElement>('.slick-preheader-panel');

      expect(grid).toBeTruthy();
      expect(preheaderElms).toBeTruthy();
      expect(preheaderElms[0].style.display).toBe('none');
      expect(preheaderElms[1].style.display).toBe('none');
    });
  });

  describe('Headers', () => {
    it('should show column headers div by default', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElm = container.querySelector('.slick-header') as HTMLDivElement;

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
    });

    it('should hide column headers div when "showColumnHeader" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showColumnHeader: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElms = container.querySelectorAll<HTMLDivElement>('.slick-header');

      expect(grid).toBeTruthy();
      expect(headerElms).toBeTruthy();
      expect(headerElms[0].style.display).toBe('none');
      expect(headerElms[1].style.display).toBe('none');
    });
  });

  describe('Footer', () => {
    it('should show footer when "showFooterRow" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: true, showFooterRow: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElm = container.querySelector('.slick-footerrow') as HTMLDivElement;
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm.style.display).not.toBe('none');
      expect(footerElms[0].style.display).not.toBe('none');
      expect(footerElms[1].style.display).not.toBe('none');
    });

    it('should hide column headers div when "showFooterRow" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, createFooterRow: true, showFooterRow: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const footerElms = container.querySelectorAll<HTMLDivElement>('.slick-footerrow');

      expect(grid).toBeTruthy();
      expect(footerElms).toBeTruthy();
      expect(footerElms[0].style.display).toBe('none');
      expect(footerElms[1].style.display).toBe('none');
    });
  });

  describe('Top Panel', () => {
    it('should show top panel div when "showTopPanel" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showTopPanel: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(grid).toBeTruthy();
      expect(topPanelElms.length).toBe(2);
      expect(topPanelElms[0].style.display).not.toBe('none');
      expect(topPanelElms[1].style.display).not.toBe('none');
    });

    it('should hide top panel div when "showTopPanel" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showTopPanel: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const topPanelElms = container.querySelectorAll<HTMLDivElement>('.slick-top-panel-scroller');

      expect(grid).toBeTruthy();
      expect(topPanelElms).toBeTruthy();
      expect(topPanelElms[0].style.display).toBe('none');
      expect(topPanelElms[1].style.display).toBe('none');
    });
  });

  describe('Header Row', () => {
    it('should show top panel div when "showHeaderRow" is enabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showHeaderRow: true, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElms = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElms.length).toBe(2);
      expect(headerElms[0].style.display).not.toBe('none');
      expect(headerElms[1].style.display).not.toBe('none');
    });

    it('should hide top panel div when "showHeaderRow" is disabled', () => {
      const columns = [{ id: 'firstName', field: 'firstName', name: 'First Name' }] as Column[];
      const options = { enableCellNavigation: true, showHeaderRow: false, devMode: { ownerNodeIndex: 0 } } as GridOption;
      grid = new SlickGrid<any, Column>(container, [], columns, options);
      grid.init();
      const headerElm = container.querySelectorAll<HTMLDivElement>('.slick-headerrow');

      expect(grid).toBeTruthy();
      expect(headerElm).toBeTruthy();
      expect(headerElm[0].style.display).toBe('none');
      expect(headerElm[1].style.display).toBe('none');
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
});