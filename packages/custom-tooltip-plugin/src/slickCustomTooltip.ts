import { BindingEventService } from '@slickgrid-universal/binding';
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
  applyHtmlToElement,
  calculateAvailableSpace,
  cancellablePromise,
  CancelledException,
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
  readonly pluginName = 'CustomTooltip';
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
  protected _mouseTarget?: HTMLElement | null;
  protected _hasMultipleTooltips = false;
  protected _defaultOptions = {
    bodyClassName: 'tooltip-body',
    className: '',
    offsetLeft: 0,
    offsetRight: 0,
    offsetTopBottom: 2,
    regularTooltipWhiteSpace: 'pre-line',
    whiteSpace: 'normal',
    autoHideDelay: 3000,
    persistOnHover: true,
    observeAllTooltips: false, // global tooltip observation is disabled by default
    observeTooltipContainer: 'body',
  } as CustomTooltipOption;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;
  protected _hideTooltipTimeout?: any;
  protected _autoHideTimeout?: any;
  protected _isMouseOverTooltip = false;
  protected _isGridTooltip = false; // tracks if tooltip is from grid events vs global events
  protected _bindEventService: BindingEventService = new BindingEventService();

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
      .subscribe(grid.onMouseLeave, this.handleOnMouseLeave.bind(this))
      .subscribe(grid.onHeaderMouseOut, this.handleOnMouseLeave.bind(this))
      .subscribe(grid.onHeaderRowMouseLeave, this.handleOnMouseLeave.bind(this))
      .subscribe(grid.onHeaderRowMouseOut, this.handleOnMouseLeave.bind(this));

    // optionally observe all title elements outside the grid
    if (this._addonOptions?.observeAllTooltips) {
      const containerSelector = this._addonOptions.observeTooltipContainer || 'body';
      const scope = containerSelector === 'body' ? document.body : document.querySelector(containerSelector) || grid.getContainerNode();
      this._bindEventService.bind(scope, 'mouseover', this.handleGlobalMouseOver.bind(this) as EventListener);
      this._bindEventService.bind(scope, 'mouseout', this.handleGlobalMouseOut.bind(this) as EventListener);
    }
  }

  dispose(): void {
    // hide (remove) any tooltip and unsubscribe from all events
    this.hideTooltip();
    this._cancellablePromise = undefined;
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
  }

  protected handleGlobalMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // skip if target is within a SlickGrid cell (to avoid duplicate tooltips)
    if (target?.closest('.slick-cell, .slick-header-column, .slick-headerrow-column')) {
      return;
    }

    // Always hide any existing tooltip first to prevent overlapping tooltips
    this._isGridTooltip = false; // mark as global tooltip event
    this.hideTooltip();

    // Find element with tooltip
    const titleElm = this.findTooltipElement(target);

    if (titleElm) {
      const tooltipText = findFirstAttribute(titleElm, CLOSEST_TOOLTIP_FILLED_ATTR);
      if (tooltipText) {
        this._cellNodeElm = titleElm;
        this._mouseTarget = titleElm;
        this._cellType = 'slick-cell'; // use as default type
        this._hasMultipleTooltips = (titleElm?.querySelectorAll(SELECTOR_CLOSEST_TOOLTIP_ATTR).length || 0) > 1;

        // render the tooltip using regular tooltip mode
        this._cellAddonOptions = { ...this._addonOptions, useRegularTooltip: true };
        this.renderRegularTooltip(undefined, { row: -1, cell: -1 }, null, {} as Column, {});
      }
    }
  }

  protected handleGlobalMouseOut(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    // check if we're leaving an element with a title attribute
    const leavingTitleElm = target?.closest(SELECTOR_CLOSEST_TOOLTIP_ATTR);

    if (leavingTitleElm) {
      // don't hide if we're moving to the tooltip itself (for persistOnHover support)
      const enteringTooltip = relatedTarget?.closest('.slick-custom-tooltip');
      // also don't hide if moving to a child of the same element with title
      const stayingInSameTitleElm = relatedTarget?.closest(SELECTOR_CLOSEST_TOOLTIP_ATTR) === leavingTitleElm;

      if (!enteringTooltip && !stayingInSameTitleElm) {
        this.handleOnMouseLeave();
      }
    }
  }

  protected handleOnMouseLeave(): void {
    this._isGridTooltip = false; // reset tooltip type flag
    if (this.addonOptions?.persistOnHover === false) {
      if (this._hideTooltipTimeout) {
        clearTimeout(this._hideTooltipTimeout);
      }
      this._hideTooltipTimeout = setTimeout(() => {
        if (!this._isMouseOverTooltip) {
          this.hideTooltip();
        }
      }, 100);
    } else {
      this.hideTooltip();
    }
  }

  /**
   * hide (remove) tooltip from the DOM, it will also remove it from the DOM and also cancel any pending requests (as mentioned below).
   * When using async process, it will also cancel any opened Promise/Observable that might still be pending.
   */
  hideTooltip(): void {
    this._cancellablePromise?.cancel();
    this._observable$?.unsubscribe();

    if (this.addonOptions?.persistOnHover === false) {
      this.clearTimeouts();
      this._isMouseOverTooltip = false;
      this._bindEventService.unbindAll();
    }

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

  /** Clear all timeouts (hide and auto-hide) */
  protected clearTimeouts(): void {
    if (this._hideTooltipTimeout) {
      clearTimeout(this._hideTooltipTimeout);
      this._hideTooltipTimeout = undefined;
    }
    if (this._autoHideTimeout) {
      clearTimeout(this._autoHideTimeout);
      this._autoHideTimeout = undefined;
    }
  }

  /** Truncate text if it exceeds maxLength */
  protected truncateText(text: string, maxLength?: number): string {
    if (maxLength && text.length > maxLength) {
      return text.substring(0, maxLength - 3) + '...';
    }
    return text;
  }

  /** Find the closest tooltip element based on attributes */
  protected findTooltipElement(target: HTMLElement | null): HTMLElement | null {
    if (!target) return null;
    const targetHasTooltipAttr = target?.hasAttribute('title') || target?.hasAttribute('data-slick-tooltip');
    return target && findFirstAttribute(target, CLOSEST_TOOLTIP_FILLED_ATTR)
      ? target
      : !targetHasTooltipAttr
        ? (target?.closest(SELECTOR_CLOSEST_TOOLTIP_ATTR) as HTMLElement)
        : null;
  }

  /**
   * Async process callback will hide any prior tooltip & then merge the new result with the item `dataContext` under a `__params` property
   * (unless a new prop name is provided) to provice as dataContext object to the asyncPostFormatter.
   */
  protected asyncProcessCallback(
    asyncResult: any,
    cell: { row: number; cell: number },
    value: any,
    columnDef: Column,
    dataContext: any
  ): void {
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
    this._isGridTooltip = true; // mark as grid tooltip event
    this._cellType = selector;

    // Find element with tooltip
    const target = event.target as HTMLElement;
    this._mouseTarget = this.findTooltipElement(target);

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
    this._isGridTooltip = true; // mark as grid tooltip event
    this._cellType = 'slick-cell';

    // Find element with tooltip
    const target = event.target as HTMLElement;
    this._mouseTarget = this.findTooltipElement(target);

    // if target has tooltip attribute but it's empty, return early to prevent showing parent/cell tooltip
    const targetHasTooltipAttr = target?.hasAttribute('title') || target?.hasAttribute('data-slick-tooltip');
    if (targetHasTooltipAttr && !this._mouseTarget) {
      return;
    }
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

              // Clear all title attributes from elements in the cell to prevent native browser tooltips
              // This should happen whenever we're using custom tooltips (not regular tooltips)
              if (!this._cellAddonOptions?.useRegularTooltip && this._cellNodeElm) {
                const elementsWithTitle = this._cellNodeElm.querySelectorAll('[title]');
                elementsWithTitle.forEach((elm) => {
                  const title = elm.getAttribute('title');
                  if (title) {
                    elm.setAttribute('data-slick-tooltip', title);
                    elm.setAttribute('title', '');
                  }
                });
              }
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
      return this._grid.sanitizeHtmlString(
        (formatterText instanceof HTMLElement ? formatterText.textContent : (formatterText as string)) || ''
      );
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
    applyHtmlToElement(tmpDiv, this.parseFormatterAndSanitize(formatterOrText, cell, value, columnDef, item), this.gridOptions);
    this._hasMultipleTooltips = (this._cellNodeElm?.querySelectorAll(SELECTOR_CLOSEST_TOOLTIP_ATTR).length || 0) > 1;

    let tmpTitleElm: HTMLElement | null | undefined;
    const cellElm =
      this._cellAddonOptions?.useRegularTooltipFromCellTextOnly || !this._mouseTarget
        ? (this._cellNodeElm as HTMLElement)
        : this._mouseTarget;

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
          tooltipText = this.truncateText(tooltipText, this._cellAddonOptions.tooltipTextMaxLength);
        }
        tmpTitleElm = cellElm;
      } else {
        if (this._cellAddonOptions?.useRegularTooltipFromFormatterOnly) {
          // For nested tooltips in formatters, prioritize formatter output first, then fallback to cell element
          tmpTitleElm = tmpDiv.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR)
            ? tmpDiv.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR)
            : cellElm && findFirstAttribute(cellElm, CLOSEST_TOOLTIP_FILLED_ATTR)
              ? cellElm
              : null;
        } else {
          tmpTitleElm = findFirstAttribute(cellElm, CLOSEST_TOOLTIP_FILLED_ATTR)
            ? cellElm
            : tmpDiv.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);

          if ((!tmpTitleElm || !findFirstAttribute(tmpTitleElm, CLOSEST_TOOLTIP_FILLED_ATTR)) && cellElm) {
            tmpTitleElm = cellElm.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);
          }
        }

        // prettier-ignore
        // When in global tooltip observation mode (cell.row === -1), we always want to show the tooltip from the target element
        // For grid cells with multiple tooltips, only hide if hovering the cell container itself (not a specific child element)
        if (
          tmpTitleElm?.style.display === 'none' ||
          (cell.row !== -1 && this._hasMultipleTooltips && (!cellElm || cellElm === this._cellNodeElm))
        ) {
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
    this._tooltipElm.classList.add(this.gridUid, `l${cell.cell}`, `r${cell.cell}`);
    this.tooltipElm?.appendChild(this._tooltipBodyElm);

    // when cell is currently lock for editing, we'll force a tooltip title search
    // that can happen when user has a formatter but is currently editing and in that case we want the new value
    // e.g.: when user is currently editing and uses the Slider, when dragging its value is changing, so we wish to use the editing value instead of the previous cell value.
    if (value === null || value === undefined) {
      const tmpTitleElm = this._cellNodeElm?.querySelector<HTMLDivElement>(SELECTOR_CLOSEST_TOOLTIP_ATTR);
      value = findFirstAttribute(tmpTitleElm, CLOSEST_TOOLTIP_FILLED_ATTR) || value;
    }

    let outputText = tooltipText || this.parseFormatterAndSanitize(formatter, cell, value, columnDef, item) || '';
    outputText = this.truncateText(outputText, this._cellAddonOptions?.tooltipTextMaxLength);

    let finalOutputText = '';
    if (!tooltipText || this._cellAddonOptions?.renderRegularTooltipAsHtml) {
      finalOutputText = this._grid.sanitizeHtmlString(outputText);
      applyHtmlToElement(this._tooltipBodyElm, finalOutputText, this.gridOptions);
      this._tooltipBodyElm.style.whiteSpace = this._cellAddonOptions?.whiteSpace ?? (this._defaultOptions.whiteSpace as string);
    } else {
      finalOutputText = outputText || '';
      this._tooltipBodyElm.textContent = finalOutputText;
      this._tooltipBodyElm.style.whiteSpace =
        this._cellAddonOptions?.regularTooltipWhiteSpace ?? (this._defaultOptions.regularTooltipWhiteSpace as string);
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
      this.bindPersistOnHoverEvents();
      this.reposition(cell);
      this.swapAndClearTitleAttribute(inputTitleElm, outputText);
    }
  }

  /** Bind mouseenter/mouseleave events to tooltip when persistOnHover is disabled */
  protected bindPersistOnHoverEvents(): void {
    if (this.addonOptions?.persistOnHover === false && this._tooltipElm) {
      this._bindEventService.bind(this._tooltipElm, 'mouseenter', () => {
        this._isMouseOverTooltip = true;
        if (this._hideTooltipTimeout) {
          clearTimeout(this._hideTooltipTimeout);
          this._hideTooltipTimeout = undefined;
        }
      });

      this._bindEventService.bind(this._tooltipElm, 'mouseleave', () => {
        this._isMouseOverTooltip = false;
        this.hideTooltip();
      });

      if (this._autoHideTimeout) {
        clearTimeout(this._autoHideTimeout);
      }
      // Auto-hide tooltip after 3 seconds regardless of mouse position
      this._autoHideTimeout = setTimeout(() => this.hideTooltip(), this.addonOptions?.autoHideDelay);
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

      // user could explicitely use a "left-align" position, (when user knows his column is completely on the right in the grid)
      // or when using "auto" and we detect not enough available space then we'll position to the "left" of the cell
      const position = this._cellAddonOptions?.position ?? 'auto';
      let finalTooltipPosition = '';
      if (position === 'center') {
        newPositionLeft += cellContainerWidth / 2 - calculatedTooltipWidth / 2 + (this._cellAddonOptions?.offsetRight ?? 0);
        finalTooltipPosition = 'top-center';
      } else if (
        position === 'right-align' ||
        ((position === 'auto' || position !== 'left-align') && newPositionLeft + calculatedTooltipWidth > calculatedBodyWidth)
      ) {
        finalTooltipPosition = 'right';
        newPositionLeft -= calculatedTooltipWidth - cellContainerWidth - (this._cellAddonOptions?.offsetLeft ?? 0);
      } else {
        finalTooltipPosition = 'left';
      }

      // do the same calculation/reposition with top/bottom (default is top of the cell or in other word starting from the cell going down)
      if (
        position === 'bottom' ||
        ((position === 'auto' || position !== 'top') && calculatedTooltipHeight > calculateAvailableSpace(this._cellNodeElm).top)
      ) {
        newPositionTop = (cellPosition.top || 0) + (this.gridOptions.rowHeight ?? 0) + (this._cellAddonOptions?.offsetTopBottom ?? 0);
        finalTooltipPosition = `bottom-${finalTooltipPosition}`;
      } else {
        finalTooltipPosition = `top-${finalTooltipPosition}`;
      }

      // when having multiple tooltips, we'll try to reposition tooltip to mouse position
      if (this._tooltipElm && (this._hasMultipleTooltips || this.cellAddonOptions?.repositionByMouseOverTarget)) {
        const mouseElmOffset = getOffset(this._mouseTarget);
        if (finalTooltipPosition.includes('left') || finalTooltipPosition === 'top-center') {
          newPositionLeft = mouseElmOffset.left - 3;
        } else if (finalTooltipPosition.includes('right')) {
          newPositionLeft = mouseElmOffset.left - calculatedTooltipWidth + (this._mouseTarget?.offsetWidth ?? 0) + 3;
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
    let titleElm: Element | null | undefined = inputTitleElm;
    let cellWithTitleElm: Element | null | undefined;

    // Only search for children in grid cells, not in global tooltip elements
    if (!titleElm && this._cellNodeElm && this._isGridTooltip) {
      titleElm =
        this._cellNodeElm.hasAttribute('title') && this._cellNodeElm.getAttribute('title')
          ? this._cellNodeElm
          : this._cellNodeElm.querySelector('[title]');
    }

    // For grid cells with inputTitleElm matching cellNodeElm, also check for child elements with title attributes
    if (this._isGridTooltip && inputTitleElm && inputTitleElm === this._cellNodeElm) {
      cellWithTitleElm =
        this._cellNodeElm.hasAttribute('title') && this._cellNodeElm.getAttribute('title')
          ? this._cellNodeElm
          : this._cellNodeElm.querySelector('[title]');
    }

    // Swap title to data-slick-tooltip and clear title to prevent native browser tooltip
    if (titleElm && tooltipText) {
      titleElm.setAttribute('data-slick-tooltip', tooltipText);
      if (titleElm.hasAttribute('title')) {
        titleElm.setAttribute('title', '');
      }
      // Also clear cell element's title if it's different (only for grid cells)
      if (cellWithTitleElm && cellWithTitleElm !== titleElm && cellWithTitleElm.hasAttribute('title')) {
        cellWithTitleElm.setAttribute('title', '');
      }
    }
  }
}
