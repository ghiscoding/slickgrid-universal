import { createDomElement, deepMerge } from '@slickgrid-universal/utils';
import type { SlickGrid, SlickRange } from '../core/index.js';
import type { CellRangeDecoratorOption } from '../interfaces/index.js';

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
  readonly pluginName = 'CellRangeDecorator';

  protected _options: CellRangeDecoratorOption;
  protected _elem?: HTMLDivElement | null;
  protected _selectionCss: CSSStyleDeclaration;
  protected _defaults = {
    selectionCssClass: 'slick-range-decorator',
    selectionCss: {
      border: '2px dashed red',
      zIndex: '9999',
    },
    copyToSelectionCss: {
      border: '2px dashed blue',
      zIndex: '9999',
    },
    offset: { top: 0, left: 0, height: 1, width: 1 },
  } as CellRangeDecoratorOption;

  constructor(
    protected readonly grid: SlickGrid,
    options?: Partial<CellRangeDecoratorOption>
  ) {
    this._options = deepMerge(this._defaults, options);
    this._selectionCss = options?.selectionCss || ({} as CSSStyleDeclaration);
  }

  get addonOptions(): CellRangeDecoratorOption {
    return this._options;
  }

  get addonElement(): HTMLElement | null | undefined {
    return this._elem;
  }

  /** Dispose the plugin. */
  destroy(): void {
    this.hide();
  }

  init(): void {}

  getSelectionCss(): CSSStyleDeclaration {
    return this._selectionCss;
  }

  setSelectionCss(cssProps: CSSStyleDeclaration): void {
    this._selectionCss = cssProps;
  }

  hide(): void {
    this._elem?.remove();
    this._elem = null;
  }

  show(range: SlickRange, isCopyTo?: boolean): HTMLDivElement {
    if (!this._elem) {
      this._elem = createDomElement('div', { className: this._options.selectionCssClass });
      this._elem.style.position = 'absolute';
      this.grid.getActiveCanvasNode()?.appendChild(this._elem);
    }

    // Determine which CSS style to use
    const css = isCopyTo && this._options.copyToSelectionCss ? this._options.copyToSelectionCss : this._options.selectionCss;

    // Apply styles to the element
    Object.keys(css).forEach((cssStyleKey: string) => {
      const value = css[cssStyleKey as keyof CSSStyleDeclaration];
      if (this._elem!.style[cssStyleKey as keyof CSSStyleDeclaration] !== value) {
        this._elem!.style.setProperty(cssStyleKey, String(value));
      }
    });

    // Get the boxes for the selected cells
    const from = this.grid.getCellNodeBox(range.fromRow, range.fromCell);
    const to = this.grid.getCellNodeBox(range.toRow, range.toCell);

    // Update position and dimensions if both nodes are valid
    if (from && to && this._options?.offset) {
      this._elem.style.top = `${from.top + this._options.offset.top}px`;
      this._elem.style.left = `${from.left + this._options.offset.left}px`;
      this._elem.style.height = `${to.bottom - from.top + this._options.offset.height}px`;
      this._elem.style.width = `${to.right - from.left + this._options.offset.width}px`;
    }

    return this._elem;
  }
}
