import { CancellablePromiseWrapper, Column, CustomTooltipOption, Formatter, GridOption, SlickDataView, SlickEventData, SlickEventHandler, SlickGrid, SlickNamespace } from '../interfaces/index';
import { cancellablePromise, CancelledException, getHtmlElementOffset, sanitizeTextByAvailableSanitizer } from '../services/utilities';
import { SharedService } from '../services/shared.service';
import { Observable, RxJsFacade, Subscription } from '../services/rxjsFacade';
import { calculateAvailableSpace } from '../services/domUtilities';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickCustomTooltip {
  protected _addonOptions?: CustomTooltipOption;
  protected _cancellablePromise?: CancellablePromiseWrapper;
  protected _observable$?: Subscription;
  protected _tooltipElm?: HTMLDivElement;
  protected _defaultOptions = {
    className: 'slick-custom-tooltip',
    offsetLeft: 0,
    offsetRight: 0,
    offsetTopBottom: 4,
    hideArrow: false,
  } as CustomTooltipOption;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;

  constructor(protected readonly sharedService: SharedService, protected rxjs?: RxJsFacade) {
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

  get tooltipElm(): HTMLDivElement | undefined {
    return this._tooltipElm;
  }

  addRxJsResource(rxjs: RxJsFacade) {
    this.rxjs = rxjs;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._eventHandler
      .subscribe(grid.onMouseEnter, this.handleOnMouseEnter.bind(this) as unknown as EventListener)
      .subscribe(grid.onMouseLeave, this.hideTooltip.bind(this) as EventListener);
  }

  dispose() {
    // hide (remove) any tooltip and unsubscribe from all events
    this.hideTooltip();
    this._eventHandler.unsubscribeAll();
  }

  /**
   * hide (remove) tooltip from the DOM, it will also remove it from the DOM and also cancel any pending requests (as mentioned below).
   * When using async process, it will also cancel any opened Promise/Observable that might still be pending.
   */
  hideTooltip() {
    this._cancellablePromise?.cancel();
    this._observable$?.unsubscribe();
    const prevTooltip = document.body.querySelector(`.${this.className}${this.gridUidSelector}`);
    prevTooltip?.remove();
  }

  setOptions(newOptions: CustomTooltipOption) {
    this._addonOptions = { ...this._addonOptions, ...newOptions } as CustomTooltipOption;
  }

  // --
  // protected functions
  // ---------------------

  /**
   *  hide any prior tooltip & merge the new result with the item `dataContext` under a `__params` property (unless a new prop name is provided)
   * finally render the tooltip with the `asyncPostFormatter` formatter
   */
  protected asyncProcessCallback(asyncResult: any, cell: { row: number, cell: number }, value: any, columnDef: Column, dataContext: any) {
    this.hideTooltip();
    const itemWithAsyncData = { ...dataContext, [this.addonOptions?.asyncParamsPropName ?? '__params']: asyncResult };
    this.renderTooltipFormatter(value, columnDef, itemWithAsyncData, this._addonOptions!.asyncPostFormatter!, cell);
  }

  protected async handleOnMouseEnter(e: SlickEventData) {
    // before doing anything, let's remove any previous tooltip before
    // and cancel any opened Promise/Observable when using async
    this.hideTooltip();

    if (this._grid && e) {
      const cell = this._grid.getCellFromEvent(e);
      if (cell) {
        const item = this.dataView.getItem(cell.row);
        const columnDef = this._grid.getColumns()[cell.cell];
        if (item && columnDef) {
          this._addonOptions = { ...this._addonOptions, ...(this.sharedService?.gridOptions?.customTooltip), ...(columnDef?.customTooltip) } as CustomTooltipOption;

          let showTooltip = true;
          if (typeof this._addonOptions?.usabilityOverride === 'function') {
            showTooltip = this._addonOptions.usabilityOverride({ cell: cell.cell, row: cell.row, dataContext: item, column: columnDef, grid: this._grid });
          }

          const value = item.hasOwnProperty(columnDef.field) ? item[columnDef.field] : null;
          if (showTooltip && typeof this._addonOptions?.formatter === 'function') {
            this.renderTooltipFormatter(value, columnDef, item, this._addonOptions.formatter, cell);
          }
          if (typeof this._addonOptions?.asyncPostProcess === 'function') {
            const asyncProcess = this._addonOptions.asyncPostProcess(cell.row, cell.cell, value, columnDef, item, this._grid);
            if (!this._addonOptions.asyncPostFormatter) {
              throw new Error(`[Slickgrid-Universal] when using "asyncPostProcess", you must also provide an "asyncPostFormatter" formatter`);
            }

            if (asyncProcess instanceof Promise) {
              // create a new cancellable promise which will resolve, unless it's cancelled, with the udpated `dataContext` object that includes the `__params`
              this._cancellablePromise = cancellablePromise(asyncProcess);
              this._cancellablePromise.promise
                .then((asyncResult: any) => this.asyncProcessCallback(asyncResult, cell, value, columnDef, item))
                .catch((error: Error) => {
                  // we will throw back any errors, unless it's a cancelled promise which in that case will be disregarded (thrown by the promise wrapper cancel() call)
                  if (!(error instanceof CancelledException)) {
                    throw error;
                  }
                });
            } else if (this.rxjs?.isObservable(asyncProcess)) {
              const rxjs = this.rxjs as RxJsFacade;
              this._observable$ = (asyncProcess as unknown as Observable<any>)
                .pipe(
                  // use `switchMap` so that it cancels the previous subscription and a new observable is subscribed
                  rxjs.switchMap((asyncResult) => this.asyncProcessCallback(asyncResult, cell, value, columnDef, item))
                )
                .subscribe();
            }
          }
        }
      }
    }
  }

  protected renderTooltipFormatter(value: any, columnDef: Column, item: any, formatter: Formatter, cell: { row: number; cell: number; }) {
    if (typeof formatter === 'function') {
      const tooltipText = formatter(cell.row, cell.cell, value, columnDef, item, this._grid);

      // create the tooltip DOM element with the text returned by the Formatter
      this._tooltipElm = document.createElement('div');
      this._tooltipElm.className = `${this.className} ${this.gridUid}`;
      this._tooltipElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, (typeof tooltipText === 'object' ? tooltipText.text : tooltipText));
      document.body.appendChild(this._tooltipElm);

      // reposition the tooltip on top of the cell that triggered the mouse over event
      this.reposition(cell);

      // user could optionally hide the tooltip arrow (we can simply update the CSS variables, that's the only way we have to update CSS pseudo)
      if (!this._addonOptions?.hideArrow) {
        this._tooltipElm.classList.add('tooltip-arrow');
      }
    }
  }

  /**
   * Reposition the Tooltip to be top-left position over the cell.
   * By default we use an "auto" mode which will allow to position the Tooltip to the best logical position in the window, also when we mention position, we are talking about the relative position against the grid cell.
   * We can assume that in 80% of the time the default position is top-right, the default is "auto" but we can also override it and use a specific position.
   * Most of the time positioning of the tooltip will be to the "top-right" of the cell is ok but if our column is completely on the right side then we'll want to change the position to "left" align.
   * Same goes for the top/bottom position, Most of the time positioning the tooltip to the "top" but if we are hovering a cell at the top of the grid and there's no room to display it then we might need to reposition to "bottom" instead.
   */
  protected reposition(cell: { row: number; cell: number; }) {
    if (this._tooltipElm) {
      const cellElm = this._grid.getCellNode(cell.row, cell.cell);
      const cellPosition = getHtmlElementOffset(cellElm);
      const containerWidth = cellElm.offsetWidth;
      const calculatedTooltipHeight = this._tooltipElm.getBoundingClientRect().height;
      const calculatedTooltipWidth = this._tooltipElm.getBoundingClientRect().width;
      const calculatedBodyWidth = document.body.offsetWidth || window.innerWidth;

      // first calculate the default (top/left) position
      let newPositionTop = cellPosition.top - this._tooltipElm.offsetHeight - (this._addonOptions?.offsetTopBottom ?? 0);
      let newPositionLeft = (cellPosition?.left ?? 0) - (this._addonOptions?.offsetLeft ?? 0);

      // user could explicitely use a "left" position (when user knows his column is completely on the right)
      // or when using "auto" and we detect not enough available space then we'll position to the "left" of the cell
      const position = this._addonOptions?.position ?? 'auto';
      if (position === 'left' || (position === 'auto' && (newPositionLeft + calculatedTooltipWidth) > calculatedBodyWidth)) {
        newPositionLeft -= (calculatedTooltipWidth - containerWidth - (this._addonOptions?.offsetRight ?? 0));
        this._tooltipElm.classList.remove('arrow-left');
        this._tooltipElm.classList.add('arrow-right');
      } else {
        this._tooltipElm.classList.add('arrow-left');
        this._tooltipElm.classList.remove('arrow-right');
      }

      // do the same calculation/reposition with top/bottom (default is top of the cell or in other word starting from the cell going down)
      if (position === 'top' || (position === 'auto' && calculatedTooltipHeight > calculateAvailableSpace(cellElm).top)) {
        newPositionTop = cellPosition.top + (this.gridOptions.rowHeight ?? 0) + (this._addonOptions?.offsetTopBottom ?? 0);
        this._tooltipElm.classList.remove('arrow-down');
        this._tooltipElm.classList.add('arrow-up');
      } else {
        this._tooltipElm.classList.add('arrow-down');
        this._tooltipElm.classList.remove('arrow-up');
      }

      // reposition the tooltip over the cell (90% of the time this will end up using a position on the "right" of the cell)
      this._tooltipElm.style.top = `${newPositionTop}px`;
      this._tooltipElm.style.left = `${newPositionLeft}px`;
    }
  }
}
