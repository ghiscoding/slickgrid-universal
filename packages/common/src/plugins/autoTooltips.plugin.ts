import {
  AutoTooltipOption,
  Column,
  GetSlickEventType,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class AutoTooltipsPlugin {
  private _eventHandler!: SlickEventHandler;
  private _grid!: SlickGrid;
  private _options?: AutoTooltipOption;
  private _defaults = {
    enableForCells: true,
    enableForHeaderCells: false,
    maxToolTipLength: undefined,
    replaceExisting: true
  } as AutoTooltipOption;
  pluginName: 'AutoTooltips' = 'AutoTooltips';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(options?: AutoTooltipOption) {
    this._eventHandler = new Slick.EventHandler();
    this._options = options;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get options(): AutoTooltipOption {
    return this._options as AutoTooltipOption;
  }

  /** Initialize plugin. */
  init(grid: SlickGrid) {
    this._options = { ...this._defaults, ...this._options };
    this._grid = grid;
    if (this._options.enableForCells) {
      const onMouseEnterHandler = this._grid.onMouseEnter;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onMouseEnterHandler>>).subscribe(onMouseEnterHandler, this.handleMouseEnter.bind(this));
    }
    if (this._options.enableForHeaderCells) {
      const onHeaderMouseEnterHandler = this._grid.onHeaderMouseEnter;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onHeaderMouseEnterHandler>>).subscribe(onHeaderMouseEnterHandler, this.handleHeaderMouseEnter.bind(this));
    }
  }

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy() {
    this._eventHandler?.unsubscribeAll();
  }

  // --
  // private functions
  // ------------------

  /**
   * Handle mouse entering grid cell to add/remove tooltip.
   * @param {Object} event - The event
   */
  private handleMouseEnter(event: Event) {
    const cell = this._grid.getCellFromEvent(event);
    if (cell) {
      let node: HTMLElement | null = this._grid.getCellNode(cell.row, cell.cell);
      let text;
      if (this._options && node && (!node.title || this._options?.replaceExisting)) {
        if (node.clientWidth < node.scrollWidth) {
          text = node.textContent?.trim() ?? '';
          if (this._options?.maxToolTipLength && text.length > this._options?.maxToolTipLength) {
            text = text.substr(0, this._options.maxToolTipLength - 3) + '...';
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
  private handleHeaderMouseEnter(event: Event, args: { column: Column; }) {
    const column = args.column;
    let node = (event.target as HTMLDivElement).querySelector<HTMLDivElement>('.slick-header-column');
    if (node && !column?.toolTip) {
      node.title = (node.clientWidth < node.scrollWidth) ? column.name ?? '' : '';
    }
    node = null;
  }
}