import type {
  CancellablePromiseWrapper,
  Column,
  ContainerService,
  CustomDataView,
  CustomTooltipOption,
  Formatter,
  FormatterResultWithHtml,
  FormatterResultWithText,
  GridOption,
  Observable,
  RxJsFacade,
  SharedService,
  SlickEventData,
  SlickGrid,
  Subscription,
} from '@slickgrid-universal/common';
import {
  calculateAvailableSpace,
  CancelledException,
  cancellablePromise,
  createDomElement,
  findFirstAttribute,
  getOffset,
  SlickEventHandler,
} from '@slickgrid-universal/common';
import { classNameToList, isPrimitiveOrHTML } from '@slickgrid-universal/utils';

type CellType = 'slick-cell' | 'slick-header-column' | 'slick-headerrow-column';

const CLOSEST_TOOLTIP_FILLED_ATTR = ['title', 'data-slick-tooltip'];
const SELECTOR_CLOSEST_TOOLTIP_ATTR = '[title], [data-slick-tooltip]';

/**
 * A plugin to add Custom Tooltip when hovering a cell, it subscribes to the cell "onMouseEnter" and "onMouseLeave" events.
 * The "customTooltip" is defined in the Column Definition OR Grid Options (the first found will have priority over the second)
 * To specify a tooltip when hovering a cell, extend the column definition like so:
 *
 * Available plugin options (same options are available in both column definition and/or grid options)
 * Example 1  - via Column Definition
 *  this.columnDefinitions = [
 *    {
 *      id: "action", name: "Action", field: "action", formatter: fakeButtonFormatter,
 *      customTooltip: {
 *        formatter: tooltipTaskFormatter,
 *        usabilityOverride: (args) => !!(args.dataContext.id % 2) // show it only every second row
 *      }
 *    }
 *  ];
 *
 *  OR Example 2 - via Grid Options (for all columns), NOTE: the column definition tooltip options will win over the options defined in the grid options
 *  this.gridOptions = {
 *    enableCellNavigation: true,
 *    customTooltip: {
 *    },
 *  };
 */

// add a default CSS class name that is used and required by SlickGrid Theme
const DEFAULT_CLASS_NAME = 'slick-custom-tooltip';

export class SlickCustomTooltip {
  name: 'CustomTooltip' = 'CustomTooltip' as const;

  protected _addonOptions?: CustomTooltipOption;
  protected _cellAddonOptions?: CustomTooltipOption;
  protected _cellNodeElm?: HTMLElement;
  protected _cellType: CellType = 'slick-cell';
  protected _cancellablePromise?: CancellablePromiseWrapper;
  protected _observable$?: Subscription;
  protected _rxjs?: RxJsFacade | null = null;
  protected _sharedService?: SharedService | null = null;
  protected _tooltipBodyElm?: HTMLDivElement;
  protected _tooltipElm?: HTMLDivElement;
  protected _mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  protected _mouseTarget?: HTMLElement | null;
  protected _hasMultipleTooltips = false;
  protected _defaultOptions = {
    bodyClassName: 'tooltip-body',
    className: '',
    offsetArrow: 3, // same as `$slick-tooltip-arrow-side-margin` CSS/SASS variable
    offsetLeft: 0,
    offsetRight: 0,
    offsetTopBottom: 4,
    hideArrow: false,
    regularTooltipWhiteSpace: 'pre-line',
    whiteSpace: 'normal',
  } as CustomTooltipOption;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;

  constructor() {
    this._eventHandler = new SlickEventHandler();
  }

  get addonOptions(): CustomTooltipOption | undefined {
    return this._addonOptions;
  }

  get cancellablePromise(): CancellablePromiseWrapper<any> | undefined {
    return this._cancellablePromise;
  }

  get cellAddonOptions(): CustomTooltipOption | undefined {
    return this._cellAddonOptions;
  }

  get bodyClassName(): string {
    return this._cellAddonOptions?.bodyClassName ?? 'tooltip-body';
  }
  get className(): string {
    // we'll always add our default class name for the CSS style to display as intended
    // and then append any custom CSS class to default when provided
    let className = DEFAULT_CLASS_NAME;
    if (this._addonOptions?.className) {
      className += ` ${this._addonOptions.className}`;
    }
    return className;
  }
  get dataView(): CustomDataView {
    return this._grid.getData<CustomDataView>() || {};
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() || ({} as GridOption);
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._grid?.getUID() || '';
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  get tooltipElm(): HTMLDivElement | undefined {
    return this._tooltipElm;
  }

  addRxJsResource(rxjs: RxJsFacade): void {
    this._rxjs = rxjs;
  }

  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._rxjs = containerService.get<RxJsFacade>('RxJsFacade');
    this._sharedService = containerService.get<SharedService>('SharedService');
    this._addonOptions = { ...this._defaultOptions, ...this._sharedService?.gridOptions?.customTooltip } as CustomTooltipOption;
    this._eventHandler
      .subscribe(grid.onMouseEnter, this.handleOnMouseOver.bind(this))
      .subscribe(grid.onHeaderMouseOver, (e, args) => this.handleOnHeaderMouseOverByType(e, args, 'slick-header-column'))
      .subscribe(grid.onHeaderRowMouseEnter, (e, args) => this.handleOnHeaderMouseOverByType(e, args, 'slick-headerrow-column'))
      .subscribe(grid.onHeaderRowMouseOver, (e, args) => this.handleOnHeaderMouseOverByType(e, args, 'slick-headerrow-column'))
      .subscribe(grid.onMouseLeave, this.hideTooltip.bind(this))
      .subscribe(grid.onHeaderMouseOut, this.hideTooltip.bind(this))
      .subscribe(grid.onHeaderRowMouseLeave, this.hideTooltip.bind(this))
      .subscribe(grid.onHeaderRowMouseOut, this.hideTooltip.bind(this));
  }

  dispose(): void {
    // hide (remove) any tooltip and unsubscribe from all events
    this.hideTooltip();
    this._cancellablePromise = undefined;
    this._eventHandler.unsubscribeAll();
  }

  /**
   * hide (remove) tooltip from the DOM, it will also remove it from the DOM and also cancel any pending requests (as mentioned below).
   * When using async process, it will also cancel any opened Promise/Observable that might still be pending.
   */
  hideTooltip(): void {
    this._cancellablePromise?.cancel();
    this._observable$?.unsubscribe();
    const cssClasses = classNameToList(this.className).join('.');
    const prevTooltip = document.body.querySelector(`.${cssClasses}${this.gridUidSelector}`);
    prevTooltip?.remove();
  }

  getOptions(): CustomTooltipOption | undefined {
    return this._addonOptions;
  }

  setOptions(newOptions: CustomTooltipOption): void {
    this._addonOptions = { ...this._addonOptions, ...newOptions } as CustomTooltipOption;
  }

  // --
  // protected functions
  // ---------------------

  /**
   * Async process callback will hide any prior tooltip & then merge the new result with the item `dataContext` under a `__params` property
   * (unless a new prop name is provided) to provice as dataContext object to the asyncPostFormatter.
   */
  protected asyncProcessCallback(asyncResult: any, cell: { row: number; cell: number }, value: any, columnDef: Column, dataContext: any): void {
    this.hideTooltip();
    const itemWithAsyncData = { ...dataContext, [this.addonOptions?.asyncParamsPropName ?? '__params']: asyncResult };
    if (this._cellAddonOptions?.useRegularTooltip) {
      this.renderRegularTooltip(this._cellAddonOptions!.asyncPostFormatter, cell, value, columnDef, itemWithAsyncData);
    } else {
      this.renderTooltipFormatter(this._cellAddonOptions!.asyncPostFormatter, cell, value, columnDef, itemWithAsyncData);
    }
  }

  /** depending on the selector type, execute the necessary handler code */
  protected handleOnHeaderMouseOverByType(event: SlickEventData, args: any, selector: CellType): void {
    this._cellType = selector;
    this._mousePosition = { x: event.clientX || 0, y: event.clientY || 0 };
    this._mouseTarget = document.elementFromPoint(event.clientX || 0, event.clientY || 0)?.closest(SELECTOR_CLOSEST_TOOLTIP_ATTR);

    // before doing anything, let's remove any previous tooltip before
    // and cancel any opened Promise/Observable when using async
    this.hideTooltip();

    const cell = {
      row: -1, // negative row to avoid pulling any dataContext while rendering
      cell: this._grid.getColumns().findIndex((col) => (args?.column?.id ?? '') === col.id),
    };
    const columnDef = args.column;
    const item = {};
    const isHeaderRowType = selector === 'slick-headerrow-column';

    // run the override function (when defined), if the result is false it won't go further
    args ||= {};
    args.cell = cell.cell;
    args.row = cell.row;
    args.columnDef = columnDef;
    args.dataContext = item;
    args.grid = this._grid;
    args.type = isHeaderRowType ? 'header-row' : 'header';
    this._cellAddonOptions = { ...this._addonOptions, ...columnDef?.customTooltip } as CustomTooltipOption;
    if (
      columnDef?.disableTooltip ||
      (typeof this._cellAddonOptions?.usabilityOverride === 'function' && !this._cellAddonOptions.usabilityOverride(args))
    ) {
      return;
    }

    if (columnDef && event.target) {
      this._cellNodeElm = (event.target as HTMLDivElement).closest(`.${selector}`) as HTMLDivElement;
      const formatter = isHeaderRowType ? this._cellAddonOptions.headerRowFormatter : this._cellAddonOptions.headerFormatter;

      if (this._cellAddonOptions?.useRegularTooltip || !formatter) {
        const formatterOrText = !isHeaderRowType ? columnDef.name : this._cellAddonOptions?.useRegularTooltip ? null : formatter;
        this.renderRegularTooltip(formatterOrText, cell, null, columnDef, item);
      } else if (this._cellNodeElm && typeof formatter === 'function') {
        this.renderTooltipFormatter(formatter, cell, null, columnDef, item);
      }
    }
  }

  protected async handleOnMouseOver(event: SlickEventData): Promise<void> {
    this._cellType = 'slick-cell';
    this._mousePosition = { x: event.clientX || 0, y: event.clientY || 0 };
    this._mouseTarget = document.elementFromPoint(event.clientX || 0, event.clientY || 0)?.closest(SELECTOR_CLOSEST_TOOLTIP_ATTR);

    // before doing anything, let's remove any previous tooltip before
    // and cancel any opened Promise/Observable when using async
    this.hideTooltip();

    if (event && this._grid) {
      // get cell only when it's possible (ie, Composite Editor will not be able to get cell and so it will never show any tooltip)
      const targetClassName = event?.target?.closest('.slick-cell')?.className;
      const cell = targetClassName && /l\d+/.exec(targetClassName || '') ? this._grid.getCellFromEvent(event) : null;

      if (cell) {
        const item = this.dataView ? this.dataView.getItem(cell.row) : this._grid.getDataItem(cell.row);
        const columnDef = this._grid.getColumns()[cell.cell];
        this._cellNodeElm = this._grid.getCellNode(cell.row, cell.cell) as HTMLDivElement;

        if (item && columnDef) {
          this._cellAddonOptions = { ...this._addonOptions, ...columnDef?.customTooltip } as CustomTooltipOption;

          if (
            columnDef?.disableTooltip ||
            (typeof this._cellAddonOptions?.usabilityOverride === 'function' &&
              !this._cellAddonOptions.usabilityOverride({
                cell: cell.cell,
                row: cell.row,
                dataContext: item,
                column: columnDef,
                grid: this._grid,
                type: 'cell',
              }))
          ) {
            return;
          }

          const value = item.hasOwnProperty(columnDef.field) ? item[columnDef.field] : null;

          // when cell is currently lock for editing, we'll force a tooltip title search
          const cellValue = this._grid.getEditorLock().isActive() ? null : value;

          // when there aren't any formatter OR when user specifically want to use a regular tooltip (via "title" attribute)
          if ((this._cellAddonOptions.useRegularTooltip && !this._cellAddonOptions?.asyncProcess) || !this._cellAddonOptions?.formatter) {
            this.renderRegularTooltip(columnDef.formatter, cell, cellValue, columnDef, item);
          } else {
            // when we aren't using regular tooltip and we do have a tooltip formatter, let's render it
            if (typeof this._cellAddonOptions?.formatter === 'function') {
              this.renderTooltipFormatter(this._cellAddonOptions.formatter, cell, cellValue, columnDef, item);
            }

            // when tooltip is an Async (delayed, e.g. with a backend API call)
            if (typeof this._cellAddonOptions?.asyncProcess === 'function') {
              const asyncProcess = this._cellAddonOptions.asyncProcess(cell.row, cell.cell, value, columnDef, item, this._grid);
              if (!this._cellAddonOptions.asyncPostFormatter) {
                console.error(
                  `[Slickgrid-Universal] when using "asyncProcess" with Custom Tooltip, you must also provide an "asyncPostFormatter" formatter.`
                );
              }

              if (asyncProcess instanceof Promise) {
                // create a new cancellable promise which will resolve, unless it's cancelled, with the udpated `dataContext` object that includes the `__params`
                this._cancellablePromise = cancellablePromise(asyncProcess);
                this._cancellablePromise.promise
                  .then((asyncResult: any) => this.asyncProcessCallback(asyncResult, cell, value, columnDef, item))
                  .catch((error: Error) => {
                    // we will throw back any errors, unless it's a cancelled promise which in that case will be disregarded (thrown by the promise wrapper cancel() call)
                    if (!(error instanceof CancelledException)) {
                      console.error(error);
                    }
                  });
              } else if (this._rxjs?.isObservable(asyncProcess)) {
                const rxjs = this._rxjs as RxJsFacade;
                this._observable$ = (asyncProcess as unknown as Observable<any>)
                  .pipe(
                    // use `switchMap` so that it cancels any previous subscription, it must return an observable so we can use `of` for that, and then finally we can subscribe to the new observable
                    rxjs.switchMap((asyncResult) => rxjs.of(asyncResult))
                  )
                  .subscribe(
                    (asyncResult: any) => this.asyncProcessCallback(asyncResult, cell, value, columnDef, item),
                    (error: any) => console.error(error)
                  );
              }
            }
          }
        }
      }
    }
  }

  /**
   * Parse the Custom Formatter (when provided) or return directly the text when it is already a string.
   * We will also sanitize the text in both cases before returning it so that it can be used safely.
   */
  protected parseFormatterAndSanitize(
    formatterOrText: Formatter | string | undefined,
    cell: { row: number; cell: number },
    value: any,
    columnDef: Column,
    item: unknown
  ): string {
    if (typeof formatterOrText === 'function') {
      const tooltipResult = formatterOrText(cell.row, cell.cell, value, columnDef, item, this._grid);
      // prettier-ignore
      const formatterText = isPrimitiveOrHTML(tooltipResult) ? tooltipResult : (tooltipResult as FormatterResultWithHtml).html || (tooltipResult as FormatterResultWithText).text;
      return this._grid.sanitizeHtmlString((formatterText instanceof HTMLElement ? formatterText.textContent : (formatterText as string)) || '');
    } else if (typeof formatterOrText === 'string') {
      return this._grid.sanitizeHtmlString(formatterOrText);
    }
    return '';
  }

  /**
   * Parse the cell formatter and assume it might be html
   * then create a temporary html element to easily retrieve the first [title=""] attribute text content
   * also clear the "title" attribute from the grid div text content so that it won't show also as a 2nd browser tooltip
   */
  protected renderRegularTooltip(
    formatterOrText: Formatter | string | undefined,
    cell: { row: number; cell: number },
    value: any,
    columnDef: Column,
    item: any
  ): void {
    const tmpDiv = document.createElement('div');
    this._grid.applyHtmlCode(tmpDiv, this.parseFormatterAndSanitize(formatterOrText, cell, value, columnDef, item));
    this._hasMultipleTooltips = (this._cellNodeElm?.querySelectorAll(SELECTOR_CLOSEST_TOOLTIP_ATTR).length || 0) > 1;

    let tmpTitleElm: HTMLElement | null | undefined;
    const cellElm =
      this._cellAddonOptions?.useRegularTooltipFromCellTextOnly || !this._mouseTarget ? (this._cellNodeElm as HTMLElement) : this._mouseTarget;

    let tooltipText = columnDef?.toolTip ?? '';
    if (!tooltipText) {
      if (
        this._cellType === 'slick-cell' &&
        cellElm &&
        cellElm.clientWidth < cellElm.scrollWidth &&
        !this._cellAddonOptions?.useRegularTooltipFromFormatterOnly
      ) {
        tooltipText = cellElm.textContent?.trim() ?? '';
        if (this._cellAddonOptions?.tooltipTextMaxLength && tooltipText.length > this._cellAddonOptions?.tooltipTextMaxLength) {
          tooltipText = tooltipText.substring(0, this._cellAddonOptions.tooltipTextMaxLength - 3) + '...';
        }
        tmpTitleElm = cellElm;
      } else {
        if (this._cellAddonOptions?.useRegularTooltipFromFormatterOnly) {
          tmpTitleElm = tmpDiv.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);
        } else {
          tmpTitleElm = findFirstAttribute(cellElm, CLOSEST_TOOLTIP_FILLED_ATTR)
            ? cellElm
            : tmpDiv.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);

          if ((!tmpTitleElm || !findFirstAttribute(tmpTitleElm, CLOSEST_TOOLTIP_FILLED_ATTR)) && cellElm) {
            tmpTitleElm = cellElm.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);
          }
        }

        // prettier-ignore
        if (tmpTitleElm?.style.display === 'none' || (this._hasMultipleTooltips && (!cellElm || cellElm === this._cellNodeElm))) {
          tooltipText = '';
        } else if (!tooltipText || (typeof formatterOrText === 'function' && this._cellAddonOptions?.useRegularTooltipFromFormatterOnly)) {
          tooltipText = findFirstAttribute(tmpTitleElm, CLOSEST_TOOLTIP_FILLED_ATTR) || '';
        }
      }
    }

    if (tooltipText !== '') {
      this.renderTooltipFormatter(formatterOrText, cell, value, columnDef, item, tooltipText, tmpTitleElm);
    }

    // also clear any "title" attribute to avoid showing a 2nd browser tooltip
    this.swapAndClearTitleAttribute(tmpTitleElm, tooltipText);
  }

  protected renderTooltipFormatter(
    formatter: Formatter | string | undefined,
    cell: { row: number; cell: number },
    value: any,
    columnDef: Column,
    item: unknown,
    tooltipText?: string,
    inputTitleElm?: Element | null
  ): void {
    // create the tooltip DOM element with the text returned by the Formatter
    this._tooltipElm = createDomElement('div', { className: this.className });
    this._tooltipBodyElm = createDomElement('div', { className: this.bodyClassName });
    this._tooltipElm.classList.add(this.gridUid);
    this._tooltipElm.classList.add('l' + cell.cell);
    this._tooltipElm.classList.add('r' + cell.cell);
    this.tooltipElm?.appendChild(this._tooltipBodyElm);

    // when cell is currently lock for editing, we'll force a tooltip title search
    // that can happen when user has a formatter but is currently editing and in that case we want the new value
    // e.g.: when user is currently editing and uses the Slider, when dragging its value is changing, so we wish to use the editing value instead of the previous cell value.
    if (value === null || value === undefined) {
      const tmpTitleElm = this._cellNodeElm?.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);
      value = findFirstAttribute(tmpTitleElm, CLOSEST_TOOLTIP_FILLED_ATTR) || value;
    }

    let outputText = tooltipText || this.parseFormatterAndSanitize(formatter, cell, value, columnDef, item) || '';
    outputText =
      this._cellAddonOptions?.tooltipTextMaxLength && outputText.length > this._cellAddonOptions.tooltipTextMaxLength
        ? outputText.substring(0, this._cellAddonOptions.tooltipTextMaxLength - 3) + '...'
        : outputText;

    let finalOutputText = '';
    if (!tooltipText || this._cellAddonOptions?.renderRegularTooltipAsHtml) {
      finalOutputText = this._grid.sanitizeHtmlString(outputText);
      this._grid.applyHtmlCode(this._tooltipBodyElm, finalOutputText);
      this._tooltipBodyElm.style.whiteSpace = this._cellAddonOptions?.whiteSpace ?? (this._defaultOptions.whiteSpace as string);
    } else {
      finalOutputText = outputText || '';
      this._tooltipBodyElm.textContent = finalOutputText;
      this._tooltipBodyElm.style.whiteSpace =
        this._cellAddonOptions?.regularTooltipWhiteSpace ?? (this._defaultOptions.regularTooltipWhiteSpace as string); // use `pre` so that sequences of white space are collapsed. Lines are broken at newline characters
    }

    // optional max height/width of the tooltip container
    if (this._cellAddonOptions?.maxHeight) {
      this._tooltipElm.style.maxHeight = `${this._cellAddonOptions.maxHeight}px`;
    }
    if (this._cellAddonOptions?.maxWidth) {
      this._tooltipElm.style.maxWidth = `${this._cellAddonOptions.maxWidth}px`;
    }

    // when do have text to show, then append the new tooltip to the html body & reposition the tooltip
    if (finalOutputText.toString()) {
      document.body.appendChild(this._tooltipElm);

      // reposition the tooltip on top of the cell that triggered the mouse over event
      this.reposition(cell);

      // user could optionally hide the tooltip arrow (we can simply update the CSS variables, that's the only way we have to update CSS pseudo)
      if (!this._cellAddonOptions?.hideArrow) {
        this._tooltipElm.classList.add('tooltip-arrow');
      }

      // also clear any "title" attribute to avoid showing a 2nd browser tooltip
      this.swapAndClearTitleAttribute(inputTitleElm, outputText);
    }
  }

  /**
   * Reposition the Tooltip to be top-left position over the cell.
   * By default we use an "auto" mode which will allow to position the Tooltip to the best logical position in the window, also when we mention position, we are talking about the relative position against the grid cell.
   * We can assume that in 80% of the time the default position is top-right, the default is "auto" but we can also override it and use a specific position.
   * Most of the time positioning of the tooltip will be to the "top-right" of the cell is ok but if our column is completely on the right side then we'll want to change the position to "left" align.
   * Same goes for the top/bottom position, Most of the time positioning the tooltip to the "top" but if we are hovering a cell at the top of the grid and there's no room to display it then we might need to reposition to "bottom" instead.
   */
  protected reposition(cell: { row: number; cell: number }): void {
    if (this._tooltipElm) {
      this._cellNodeElm = this._cellNodeElm || (this._grid.getCellNode(cell.row, cell.cell) as HTMLDivElement);
      const cellPosition = getOffset(this._cellNodeElm);
      const cellContainerWidth = this._cellNodeElm.offsetWidth;
      const calculatedTooltipHeight = this._tooltipElm.getBoundingClientRect().height;
      const calculatedTooltipWidth = this._tooltipElm.getBoundingClientRect().width;
      const calculatedBodyWidth = document.body.offsetWidth || window.innerWidth;

      // first calculate the default (top/left) position
      let newPositionTop = (cellPosition.top || 0) - this._tooltipElm.offsetHeight - (this._cellAddonOptions?.offsetTopBottom ?? 0);
      let newPositionLeft = (cellPosition.left || 0) - (this._cellAddonOptions?.offsetRight ?? 0);

      // user could explicitely use a "left-align" arrow position, (when user knows his column is completely on the right in the grid)
      // or when using "auto" and we detect not enough available space then we'll position to the "left" of the cell
      // NOTE the class name is for the arrow and is inverse compare to the tooltip itself, so if user ask for "left-align", then the arrow will in fact be "arrow-right-align"
      const position = this._cellAddonOptions?.position ?? 'auto';
      let finalTooltipPosition = '';
      if (position === 'center') {
        newPositionLeft += cellContainerWidth / 2 - calculatedTooltipWidth / 2 + (this._cellAddonOptions?.offsetRight ?? 0);
        finalTooltipPosition = 'top-center';
        this._tooltipElm.classList.remove('arrow-left-align', 'arrow-right-align');
        this._tooltipElm.classList.add('arrow-center-align');
      } else if (
        position === 'right-align' ||
        ((position === 'auto' || position !== 'left-align') && newPositionLeft + calculatedTooltipWidth > calculatedBodyWidth)
      ) {
        finalTooltipPosition = 'right';
        newPositionLeft -= calculatedTooltipWidth - cellContainerWidth - (this._cellAddonOptions?.offsetLeft ?? 0);
        this._tooltipElm.classList.remove('arrow-center-align', 'arrow-left-align');
        this._tooltipElm.classList.add('arrow-right-align');
      } else {
        finalTooltipPosition = 'left';
        this._tooltipElm.classList.remove('arrow-center-align', 'arrow-right-align');
        this._tooltipElm.classList.add('arrow-left-align');
      }

      // do the same calculation/reposition with top/bottom (default is top of the cell or in other word starting from the cell going down)
      // NOTE the class name is for the arrow and is inverse compare to the tooltip itself, so if user ask for "bottom", then the arrow will in fact be "arrow-top"
      if (
        position === 'bottom' ||
        ((position === 'auto' || position !== 'top') && calculatedTooltipHeight > calculateAvailableSpace(this._cellNodeElm).top)
      ) {
        newPositionTop = (cellPosition.top || 0) + (this.gridOptions.rowHeight ?? 0) + (this._cellAddonOptions?.offsetTopBottom ?? 0);
        finalTooltipPosition = `bottom-${finalTooltipPosition}`;
        this._tooltipElm.classList.remove('arrow-down');
        this._tooltipElm.classList.add('arrow-up');
      } else {
        finalTooltipPosition = `top-${finalTooltipPosition}`;
        this._tooltipElm.classList.remove('arrow-up');
        this._tooltipElm.classList.add('arrow-down');
      }

      // when having multiple tooltips, we'll try to reposition tooltip to mouse position
      if (this._tooltipElm && (this._hasMultipleTooltips || this.cellAddonOptions?.repositionByMouseOverTarget)) {
        const mouseElmOffset = getOffset(this._mouseTarget);
        if (finalTooltipPosition.includes('left') || finalTooltipPosition === 'top-center') {
          newPositionLeft = mouseElmOffset.left - (this._addonOptions?.offsetArrow ?? 3);
        } else if (finalTooltipPosition.includes('right')) {
          newPositionLeft =
            mouseElmOffset.left - calculatedTooltipWidth + (this._mouseTarget?.offsetWidth ?? 0) + (this._addonOptions?.offsetArrow ?? 3);
        }
      }

      // reposition the tooltip over the cell (90% of the time this will end up using a position on the "right" of the cell)
      this._tooltipElm.style.top = `${newPositionTop}px`;
      this._tooltipElm.style.left = `${newPositionLeft}px`;
    }
  }

  /**
   * swap and copy the "title" attribute into a new custom attribute then clear the "title" attribute
   * from the grid div text content so that it won't show also as a 2nd browser tooltip
   */
  protected swapAndClearTitleAttribute(inputTitleElm?: Element | null, tooltipText?: string): void {
    // the title attribute might be directly on the slick-cell container element (when formatter returns a result object)
    // OR in a child element (most commonly as a custom formatter)
    let cellWithTitleElm: Element | null | undefined;
    if (inputTitleElm) {
      cellWithTitleElm =
        this._cellNodeElm &&
        (this._cellNodeElm.hasAttribute('title') && this._cellNodeElm.getAttribute('title')
          ? this._cellNodeElm
          : this._cellNodeElm?.querySelector('[title]'));
    }
    // prettier-ignore
    const titleElm = inputTitleElm || (this._cellNodeElm && ((this._cellNodeElm.hasAttribute('title') && this._cellNodeElm.getAttribute('title')) ? this._cellNodeElm : this._cellNodeElm?.querySelector('[title]')));

    // flip tooltip text from `title` to `data-slick-tooltip`
    if (titleElm) {
      titleElm.setAttribute('data-slick-tooltip', tooltipText || '');
      if (titleElm.hasAttribute('title')) {
        titleElm.setAttribute('title', '');
      }
      // targeted element might actually not be the cell element,
      // so let's also clear the cell element title attribute to avoid showing native + custom tooltips
      if (cellWithTitleElm?.hasAttribute('title')) {
        cellWithTitleElm.setAttribute('title', '');
      }
    }
  }
}
