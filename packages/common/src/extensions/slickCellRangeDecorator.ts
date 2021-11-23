import { CellRange, CellRangeDecoratorOption, CSSStyleDeclarationWritable, SlickGrid } from '../interfaces/index';
import { createDomElement } from '../services/domUtilities';
import { deepMerge } from '../services/utilities';

/**
 * Displays an overlay on top of a given cell range.
 * TODO:
 * Currently, it blocks mouse events to DOM nodes behind it.
 * Use FF and WebKit-specific "pointer-events" CSS style, or some kind of event forwarding.
 * Could also construct the borders separately using 4 individual DIVs.
 */
export class SlickCellRangeDecorator {
  protected _addonOptions!: CellRangeDecoratorOption;
  protected _elem?: HTMLElement | null;
  protected _grid?: SlickGrid;
  protected _defaults = {
    selectionCssClass: 'slick-range-decorator',
    selectionCss: {
      border: '2px dashed red',
      zIndex: '9999',
    },
    offset: { top: -1, left: -1, height: -2, width: -2 }
  } as CellRangeDecoratorOption;
  pluginName = 'CellRangeDecorator';

  constructor(grid: SlickGrid, options?: Partial<CellRangeDecoratorOption>) {
    this._addonOptions = deepMerge(this._defaults, options);
    this._grid = grid;
  }

  get addonOptions() {
    return this._addonOptions;
  }

  get addonElement(): HTMLElement | null | undefined {
    return this._elem;
  }

  /** Dispose the plugin. */
  dispose() {
    this.hide();
  }

  hide() {
    this._elem?.remove();
    this._elem = null;
  }

  show(range: CellRange) {
    if (!this._elem) {
      this._elem = createDomElement('div', { className: this._addonOptions.selectionCssClass });
      Object.keys(this._addonOptions.selectionCss as CSSStyleDeclaration).forEach((cssStyleKey) => {
        this._elem!.style[cssStyleKey as CSSStyleDeclarationWritable] = this._addonOptions.selectionCss[cssStyleKey as CSSStyleDeclarationWritable];
      });
      this._elem.style.position = 'absolute';
      this._grid?.getActiveCanvasNode()?.appendChild(this._elem);
    }

    const from = this._grid?.getCellNodeBox(range.fromRow, range.fromCell);
    const to = this._grid?.getCellNodeBox(range.toRow, range.toCell);

    if (from && to && this._addonOptions?.offset) {
      this._elem.style.top = `${from.top + this._addonOptions.offset.top}px`;
      this._elem.style.left = `${from.left + this._addonOptions.offset.left}px`;
      this._elem.style.height = `${to.bottom - from.top + this._addonOptions.offset.height}px`;
      this._elem.style.width = `${to.right - from.left + this._addonOptions.offset.width}px`;
    }
    return this._elem;
  }
}