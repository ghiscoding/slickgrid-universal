import { createDomElement, deepMerge } from '@slickgrid-universal/utils';

import type { CellRangeDecoratorOption, CSSStyleDeclarationWritable } from '../interfaces/index';
import type { SlickGrid, SlickRange } from '../core/index';

/**
 * Displays an overlay on top of a given cell range.
 * TODO:
 * Currently, it blocks mouse events to DOM nodes behind it.
 * Use FF and WebKit-specific "pointer-events" CSS style, or some kind of event forwarding.
 * Could also construct the borders separately using 4 individual DIVs.
 */
export class SlickCellRangeDecorator {
  // --
  // public API
  pluginName = 'CellRangeDecorator' as const;

  protected _options: CellRangeDecoratorOption;
  protected _elem?: HTMLDivElement | null;
  protected _defaults = {
    selectionCssClass: 'slick-range-decorator',
    selectionCss: {
      border: '2px dashed red',
      zIndex: '9999',
    },
    offset: { top: -1, left: -1, height: -2, width: -2 }
  } as CellRangeDecoratorOption;

  constructor(protected readonly grid: SlickGrid, options?: Partial<CellRangeDecoratorOption>) {
    this._options = deepMerge(this._defaults, options);
  }

  get addonOptions() {
    return this._options;
  }

  get addonElement(): HTMLElement | null | undefined {
    return this._elem;
  }

  /** Dispose the plugin. */
  destroy() {
    this.hide();
  }

  init() { }

  hide() {
    this._elem?.remove();
    this._elem = null;
  }

  show(range: SlickRange) {
    if (!this._elem) {
      this._elem = createDomElement('div', { className: this._options.selectionCssClass });
      Object.keys(this._options.selectionCss as CSSStyleDeclaration).forEach((cssStyleKey) => {
        this._elem!.style[cssStyleKey as CSSStyleDeclarationWritable] = this._options.selectionCss[cssStyleKey as CSSStyleDeclarationWritable];
      });
      this._elem.style.position = 'absolute';
      this.grid.getActiveCanvasNode()?.appendChild(this._elem);
    }

    const from = this.grid.getCellNodeBox(range.fromRow, range.fromCell);
    const to = this.grid.getCellNodeBox(range.toRow, range.toCell);

    if (from && to && this._options?.offset) {
      this._elem.style.top = `${from.top + this._options.offset.top}px`;
      this._elem.style.left = `${from.left + this._options.offset.left}px`;
      this._elem.style.height = `${to.bottom - from.top + this._options.offset.height}px`;
      this._elem.style.width = `${to.right - from.left + this._options.offset.width}px`;
    }
    return this._elem;
  }
}