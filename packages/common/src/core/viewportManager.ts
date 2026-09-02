import { classNameToList, createDomElement } from '@slickgrid-universal/utils';
import type { GridOption } from '../interfaces/index.js';

export interface RightFrozenLayout {
  panes: HTMLDivElement[];
  headerScroller: HTMLDivElement;
  header: HTMLDivElement;
  headerRowScroller: HTMLDivElement;
  headerRow: HTMLDivElement;
  topPanelScroller: HTMLDivElement;
  topPanel: HTMLDivElement;
  viewportTop: HTMLDivElement;
  canvasTop: HTMLDivElement;
  viewportBottom: HTMLDivElement;
  canvasBottom: HTMLDivElement;
  footerRowScroller?: HTMLDivElement;
  footerRow?: HTMLDivElement;
}

/** Creates optional viewport bands on demand; grid geometry and rendering stay in SlickGrid. */
export class ViewportMgr {
  protected rightFrozen?: RightFrozenLayout;

  constructor(protected readonly container: HTMLElement) {}

  get right(): RightFrozenLayout | undefined {
    return this.rightFrozen;
  }

  ensureRight(options: GridOption<any>): RightFrozenLayout {
    if (this.rightFrozen) {
      this.ensureFooter(options);
      return this.rightFrozen;
    }

    const paneHeader = createDomElement('div', { className: 'slick-pane slick-pane-header slick-pane-right-frozen' });
    const paneTop = createDomElement('div', { className: 'slick-pane slick-pane-top slick-pane-right-frozen' });
    const paneBottom = createDomElement('div', { className: 'slick-pane slick-pane-bottom slick-pane-right-frozen' });
    const headerScroller = createDomElement(
      'div',
      { className: 'slick-header slick-state-default slick-header-right-frozen', role: 'rowgroup' },
      paneHeader
    );
    const header = createDomElement(
      'div',
      {
        className: 'slick-header-columns slick-header-columns-right-frozen',
        style: { [options.rtl ? 'right' : 'left']: '-1000px' },
        role: 'row',
      },
      headerScroller
    );
    const headerRowScroller = createDomElement('div', { className: 'slick-headerrow slick-state-default', role: 'rowgroup' }, paneTop);
    const headerRow = createDomElement(
      'div',
      { className: 'slick-headerrow-columns slick-headerrow-columns-right-frozen', role: 'row' },
      headerRowScroller
    );
    const topPanelScroller = createDomElement('div', { className: 'slick-top-panel-scroller slick-state-default' }, paneTop);
    const topPanel = createDomElement('div', { className: 'slick-top-panel', style: { width: '10000px' } }, topPanelScroller);
    const viewportTop = createDomElement('div', { className: 'slick-viewport slick-viewport-top slick-viewport-right-frozen' }, paneTop);
    const canvasTop = createDomElement('div', { className: 'grid-canvas grid-canvas-top grid-canvas-right-frozen' }, viewportTop);
    const viewportBottom = createDomElement(
      'div',
      { className: 'slick-viewport slick-viewport-bottom slick-viewport-right-frozen' },
      paneBottom
    );
    const canvasBottom = createDomElement('div', { className: 'grid-canvas grid-canvas-bottom grid-canvas-right-frozen' }, viewportBottom);

    if (options.viewportClass) {
      [viewportTop, viewportBottom].forEach((viewport) => viewport.classList.add(...classNameToList(options.viewportClass!)));
    }
    if (!options.showColumnHeader) {
      headerScroller.style.display = 'none';
    }
    if (!options.showHeaderRow) {
      headerRowScroller.style.display = 'none';
    }
    if (!options.showTopPanel) {
      topPanelScroller.style.display = 'none';
    }

    this.rightFrozen = {
      panes: [paneHeader, paneTop, paneBottom],
      headerScroller,
      header,
      headerRowScroller,
      headerRow,
      topPanelScroller,
      topPanel,
      viewportTop,
      canvasTop,
      viewportBottom,
      canvasBottom,
    };
    this.ensureFooter(options);
    return this.rightFrozen;
  }

  ensureFooter(options: GridOption<any>): void {
    const right = this.rightFrozen;
    if (!right || !options.createFooterRow || right.footerRow) {
      return;
    }
    right.footerRowScroller = createDomElement('div', { className: 'slick-footerrow slick-state-default' }, right.panes[1]);
    right.footerRow = createDomElement(
      'div',
      { className: 'slick-footerrow-columns slick-footerrow-columns-right-frozen' },
      right.footerRowScroller
    );
    if (!options.showFooterRow) {
      right.footerRowScroller.style.display = 'none';
    }
  }

  attachRight(hasFrozenRows: boolean): void {
    if (this.rightFrozen) {
      this.container.append(...this.rightFrozen.panes.slice(0, hasFrozenRows ? 3 : 2));
      if (!hasFrozenRows) {
        this.rightFrozen.panes[2].remove();
      }
    }
  }

  detachRight(): void {
    this.rightFrozen?.panes.forEach((pane) => pane.remove());
  }
}
