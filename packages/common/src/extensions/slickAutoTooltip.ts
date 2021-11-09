import {
  AutoTooltipOption,
  Column,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * AutoTooltips plugin to show/hide tooltips when columns are too narrow to fit content.
 * @constructor
 * @param {boolean} [options.enableForCells=true]        - Enable tooltip for grid cells
 * @param {boolean} [options.enableForHeaderCells=false] - Enable tooltip for header cells
 * @param {number}  [options.maxToolTipLength=null]      - The maximum length for a tooltip
 */
export class SlickAutoTooltip {
  protected _eventHandler!: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _addonOptions?: AutoTooltipOption;
  protected _defaults = {
    enableForCells: true,
    enableForHeaderCells: false,
    maxToolTipLength: undefined,
    replaceExisting: true
  } as AutoTooltipOption;
  pluginName: 'AutoTooltips' = 'AutoTooltips';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(options?: AutoTooltipOption) {
    this._eventHandler = new Slick.EventHandler();
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

  /** @deprecated @use `dispose` Destroy plugin. */
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
  protected handleMouseEnter(event: Event) {
    const cell = this._grid.getCellFromEvent(event);
    if (cell) {
      let node: HTMLElement | null = this._grid.getCellNode(cell.row, cell.cell);
      let text;
      if (this._addonOptions && node && (!node.title || this._addonOptions?.replaceExisting)) {
        if (node.clientWidth < node.scrollWidth) {
          text = node.textContent?.trim() ?? '';
          if (this._addonOptions?.maxToolTipLength && text.length > this._addonOptions?.maxToolTipLength) {
            text = text.substr(0, this._addonOptions.maxToolTipLength - 3) + '...';
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
  protected handleHeaderMouseEnter(event: Event, args: { column: Column; }) {
    const column = args.column;
    let node: HTMLDivElement | null;
    const targetElm = (event.target as HTMLDivElement);

    if (targetElm) {
      node = targetElm.closest<HTMLDivElement>('.slick-header-column');
      if (node && !(column?.toolTip)) {
        node.title = (targetElm.clientWidth < node.clientWidth) ? column?.name ?? '' : '';
      }
    }
    node = null;
  }
}