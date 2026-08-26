import { createDomElement, deepMerge, setStyles } from '@slickgrid-universal/utils';
import type { SlickRange } from '../core/slickCore.js';
import type { SlickGrid } from '../core/slickGrid.js';
import type { CellRangeDecoratorOption } from '../interfaces/index.js';

/**
 * Displays an overlay on top of a given cell range.
 * The overlay uses pointer-events: none so it does not block mouse events
 * from reaching the grid cells beneath it.
 */
export class SlickCellRangeDecorator {
  // --
  // public API
  readonly pluginName = 'CellRangeDecorator';

  protected _options: CellRangeDecoratorOption;
  protected _elem?: HTMLDivElement | null;
  protected _selectionCss: Partial<CSSStyleDeclaration>;
  protected _defaults = {
    selectionCssClass: 'slick-range-decorator',
    selectionCss: {
      border: '2px dashed red',
      zIndex: '9999',
      pointerEvents: 'none',
    },
    copyToSelectionCss: {
      border: '2px dashed blue',
      zIndex: '9999',
      pointerEvents: 'none',
    },
    offset: { top: 0, left: 0, height: 1, width: 1 },
  } as CellRangeDecoratorOption;

  constructor(
    protected readonly grid: SlickGrid,
    options?: Partial<CellRangeDecoratorOption>
  ) {
    this._options = deepMerge(this._defaults, options);
    this._selectionCss = this._options?.selectionCss || ({} as Partial<CSSStyleDeclaration>);
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

  getSelectionCss(): Partial<CSSStyleDeclaration> {
    return this._selectionCss;
  }

  setSelectionCss(cssProps: Partial<CSSStyleDeclaration>): void {
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
    const css = isCopyTo && this._options.copyToSelectionCss ? this._options.copyToSelectionCss : this._selectionCss;

    // Apply styles to the element
    setStyles(this._elem, css);

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
