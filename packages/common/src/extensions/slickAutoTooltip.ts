
import { stripTags } from '@slickgrid-universal/utils';

import type { AutoTooltipOption, Column } from '../interfaces/index';
import { SlickEventHandler, type SlickGrid } from '../core/index';

/**
 * AutoTooltips plugin to show/hide tooltips when columns are too narrow to fit content.
 * @constructor
 * @param {boolean} [options.enableForCells=true]        - Enable tooltip for grid cells
 * @param {boolean} [options.enableForHeaderCells=false] - Enable tooltip for header cells
 * @param {number}  [options.maxToolTipLength=null]      - The maximum length for a tooltip
 */
export class SlickAutoTooltip {
  pluginName = 'AutoTooltips' as const;

  protected _addonOptions?: AutoTooltipOption;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _defaults = {
    enableForCells: true,
    enableForHeaderCells: false,
    maxToolTipLength: undefined,
    replaceExisting: true
  } as AutoTooltipOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(options?: AutoTooltipOption) {
    this._eventHandler = new SlickEventHandler();
    this._addonOptions = options;
  }

  get addonOptions(): AutoTooltipOption {
    return this._addonOptions as AutoTooltipOption;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Initialize plugin. */
  init(grid: SlickGrid) {
    this._addonOptions = { ...this._defaults, ...this.addonOptions };
    this._grid = grid;
    if (this._addonOptions.enableForCells) {
      this._eventHandler.subscribe(this._grid.onMouseEnter, this.handleMouseEnter.bind(this));
    }
    if (this._addonOptions.enableForHeaderCells) {
      this._eventHandler.subscribe(this._grid.onHeaderMouseEnter, this.handleHeaderMouseEnter.bind(this));
    }
  }

  destroy() {
    this.dispose();
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this._eventHandler?.unsubscribeAll();
  }

  // --
  // protected functions
  // ------------------

  /**
   * Handle mouse entering grid cell to add/remove tooltip.
   * @param {Object} event - The event
   */
  protected handleMouseEnter(event: MouseEvent) {
    const cell = this._grid.getCellFromEvent(event);
    if (cell) {
      let node: HTMLElement | null = this._grid.getCellNode(cell.row, cell.cell);
      let text;
      if (this._addonOptions && node && (!node.title || this._addonOptions?.replaceExisting)) {
        if (node.clientWidth < node.scrollWidth) {
          text = node.textContent?.trim() ?? '';
          if (this._addonOptions?.maxToolTipLength && text.length > this._addonOptions?.maxToolTipLength) {
            text = text.substring(0, this._addonOptions.maxToolTipLength - 3) + '...';
          }
        } else {
          text = '';
        }
        node.title = text;
      }
      node = null;
    }
  }

  /**
   * Handle mouse entering header cell to add/remove tooltip.
   * @param {Object} event - The event
   * @param {Object} args.column - The column definition
   */
  protected handleHeaderMouseEnter(event: MouseEvent, args: { column: Column; }) {
    const column = args.column;
    let node: HTMLDivElement | null;
    const targetElm = (event.target as HTMLDivElement);

    if (targetElm) {
      node = targetElm.closest<HTMLDivElement>('.slick-header-column');
      if (node && !(column?.toolTip)) {
        const titleVal = (targetElm.clientWidth < node.clientWidth) ? column?.name ?? '' : '';
        node.title = titleVal instanceof HTMLElement ? stripTags(titleVal.innerHTML) : titleVal;
      }
    }
    node = null;
  }
}