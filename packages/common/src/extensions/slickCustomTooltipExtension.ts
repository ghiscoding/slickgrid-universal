import { CustomTooltipOption, GridOption, SlickDataView, SlickEventData, SlickEventHandler, SlickGrid, SlickNamespace } from '../interfaces/index';
import { getHtmlElementOffset, sanitizeTextByAvailableSanitizer } from '../services/utilities';
import { SharedService } from '../services/shared.service';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickCustomTooltip {
  protected _addonOptions?: CustomTooltipOption;
  protected _defaultOptions = {
    className: 'slick-custom-tooltip',
    offsetLeft: 0,
    offsetTop: 5,
    hideArrow: false,
  } as CustomTooltipOption;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;

  constructor(protected readonly sharedService: SharedService) {
    this._eventHandler = new Slick.EventHandler();
  }

  get addonOptions(): CustomTooltipOption | undefined {
    return this._addonOptions;
  }

  get className(): string {
    return this._addonOptions?.className ?? 'slick-custom-tooltip';
  }
  get dataView(): SlickDataView {
    return this._grid.getData<SlickDataView>() || {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid.getOptions() || {};
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._grid.getUID() || '';
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._eventHandler
      .subscribe(grid.onMouseEnter, this.handleOnMouseEnter.bind(this) as EventListener)
      .subscribe(grid.onMouseLeave, this.handleOnMouseLeave.bind(this) as EventListener);
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
  }

  handleOnMouseEnter(e: SlickEventData) {
    if (this._grid && e) {
      const cell = this._grid.getCellFromEvent(e);
      if (cell) {
        const item = this.dataView.getItem(cell.row);
        const columnDef = this._grid.getColumns()[cell.cell];
        if (item && columnDef) {
          this._addonOptions = { ...this._defaultOptions, ...(this.sharedService?.gridOptions?.customTooltip), ...(columnDef?.customTooltip) };

          let showTooltip = true;
          if (typeof this._addonOptions?.usabilityOverride === 'function') {
            showTooltip = this._addonOptions.usabilityOverride({ cell: cell.cell, row: cell.row, dataContext: item, column: columnDef, grid: this._grid });
          }

          if (showTooltip && typeof this._addonOptions?.formatter === 'function') {
            const itemValue = item.hasOwnProperty(columnDef.field) ? item[columnDef.field] : null;
            const value = sanitizeTextByAvailableSanitizer(this.gridOptions, itemValue);
            const tooltipText = this._addonOptions.formatter(cell.row, cell.cell, value, columnDef, item, this._grid);

            // create the tooltip DOM element with the text returned by the Formatter
            const tooltipElm = document.createElement('div');
            tooltipElm.className = `${this.className} ${this.gridUid}`;
            tooltipElm.innerHTML = typeof tooltipText === 'object' ? tooltipText.text : tooltipText;
            document.body.appendChild(tooltipElm);

            // reposition the tooltip on top of the cell that triggered the mouse over event
            const cellPosition = getHtmlElementOffset(this._grid.getCellNode(cell.row, cell.cell));
            tooltipElm.style.left = `${cellPosition.left}px`;
            tooltipElm.style.top = `${cellPosition.top - tooltipElm.clientHeight - (this._addonOptions?.offsetTop ?? 0)}px`;

            // user could optionally hide the tooltip arrow (we can simply update the CSS variables, that's the only way we have to update CSS pseudo)
            const root = document.documentElement;
            if (this._addonOptions?.hideArrow) {
              root.style.setProperty('--slick-tooltip-arrow-border-left', '0');
              root.style.setProperty('--slick-tooltip-arrow-border-right', '0');
            }
            if (this._addonOptions?.arrowMarginLeft) {
              const marginLeft = typeof this._addonOptions.arrowMarginLeft === 'string' ? this._addonOptions.arrowMarginLeft : `${this._addonOptions.arrowMarginLeft}px`;
              root.style.setProperty('--slick-tooltip-arrow-margin-left', marginLeft);
            }
          }
        }
      }
    }
  }

  handleOnMouseLeave() {
    const prevTooltip = document.body.querySelector(`.${this.className}${this.gridUidSelector}`);
    prevTooltip?.remove();
  }
}
