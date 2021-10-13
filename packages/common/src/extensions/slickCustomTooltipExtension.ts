import { CancellablePromiseWrapper, Column, CustomTooltipOption, Formatter, GridOption, SlickDataView, SlickEventData, SlickEventHandler, SlickGrid, SlickNamespace } from '../interfaces/index';
import { cancellablePromise, CancelledException, getHtmlElementOffset, sanitizeTextByAvailableSanitizer } from '../services/utilities';
import { SharedService } from '../services/shared.service';
import { Observable, RxJsFacade, Subscription } from '../services/rxjsFacade';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class SlickCustomTooltip {
  protected _addonOptions?: CustomTooltipOption;
  protected _cancellablePromise?: CancellablePromiseWrapper;
  protected _observable$?: Subscription;
  protected _defaultOptions = {
    className: 'slick-custom-tooltip',
    offsetLeft: 0,
    offsetTop: 5,
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

  addRxJsResource(rxjs: RxJsFacade) {
    this.rxjs = rxjs;
  }

  init(grid: SlickGrid) {
    this._grid = grid;
    this._eventHandler
      .subscribe(grid.onMouseEnter, this.handleOnMouseEnter.bind(this) as unknown as EventListener)
      .subscribe(grid.onMouseLeave, this.hide.bind(this) as EventListener);
  }

  dispose() {
    // hide (remove) any tooltip and unsubscribe from all events
    this.hide();
    this._eventHandler.unsubscribeAll();
  }

  /**
   * hide (remove) tooltip from the DOM,
   * when using async process, it will also cancel any opened Promise/Observable that might still be opened/pending.
   */
  hide() {
    this._cancellablePromise?.cancel();
    this._observable$?.unsubscribe();
    const prevTooltip = document.body.querySelector(`.${this.className}${this.gridUidSelector}`);
    prevTooltip?.remove();
  }

  async handleOnMouseEnter(e: SlickEventData) {
    // before doing anything, let's remove any previous tooltip before
    // and cancel any opened Promise/Observable when using async
    this.hide();

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

  renderTooltipFormatter(value: any, columnDef: Column, item: any, formatter: Formatter, cell: { row: number; cell: number; }) {
    if (typeof formatter === 'function') {
      const tooltipText = formatter(cell.row, cell.cell, value, columnDef, item, this._grid);

      // create the tooltip DOM element with the text returned by the Formatter
      const tooltipElm = document.createElement('div');
      tooltipElm.className = `${this.className} ${this.gridUid}`;
      tooltipElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, (typeof tooltipText === 'object' ? tooltipText.text : tooltipText));
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

  // --
  // protected functions
  // ---------------------

  /**
   *  hide any prior tooltip & merge the new result with the item `dataContext` under a `__params` property (unless a new prop name is provided)
   * finally render the tooltip with the `asyncPostFormatter` formatter
   */
  protected asyncProcessCallback(asyncResult: any, cell: { row: number, cell: number }, value: any, columnDef: Column, dataContext: any) {
    this.hide();
    const itemWithAsyncData = { ...dataContext, [this.addonOptions?.asyncParamsPropName ?? '__params']: asyncResult };
    this.renderTooltipFormatter(value, columnDef, itemWithAsyncData, this._addonOptions!.asyncPostFormatter!, cell);
  }
}
