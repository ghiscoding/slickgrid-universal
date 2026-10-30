import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, getInnerSize, getOffset, isPrimitiveOrHTML, stripTags } from '@slickgrid-universal/utils';
import { SlickEventHandler } from '../core/slickCore.js';
import { type SlickDataView } from '../core/slickDataView.js';
import { type SlickGrid } from '../core/slickGrid.js';
import { parseFormatterWhenExist } from '../formatters/formatterUtilities.js';
import type { AutoResizeOption, Column, GridOption, GridSize, ResizeByContentOption } from '../interfaces/index.js';

// using external non-typed js libraries
const DATAGRID_BOTTOM_PADDING = 20;
const DATAGRID_FOOTER_HEIGHT = 25;
const DATAGRID_PAGINATION_HEIGHT = 35;
const DATAGRID_MIN_HEIGHT = 180;
const DATAGRID_MIN_WIDTH = 300;

export class ResizerService {
  protected _autoResizeOptions!: AutoResizeOption;
  protected _bindingEventService: BindingEventService;
  protected _allHeaderHeight = 0;
  protected _autoHeightRecalcRow = 0;
  protected _grid!: SlickGrid;
  protected _eventHandler: SlickEventHandler;
  protected _fixedHeight?: number | string;
  protected _fixedWidth?: number | string;
  protected _gridDomElm!: HTMLElement;
  protected _gridContainerElm!: HTMLElement;
  protected _pageContainerElm!: HTMLElement;
  protected _hasResizedByContentAtLeastOnce = false;
  protected _lastGridSizes?: GridSize;
  protected _lastWindowSize?: GridSize;
  protected _totalColumnsWidthByContent = 0;
  protected _timer?: any;
  protected _resizePaused = false;
  protected _resizeObserver!: ResizeObserver;
  protected _subscriptions: EventSubscription[] = [];
  protected _canvasCtx?: CanvasRenderingContext2D;

  get autoHeightRecalcRow(): number {
    return this._autoHeightRecalcRow || 100;
  }

  get isAutoHeightEnabled(): boolean {
    return !!(this.gridOptions.enableAutoResize && this.gridOptions.autoResize?.autoHeight);
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  /** Getter for the SlickGrid DataView */
  get dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._grid?.getUID() ?? '';
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  get resizeByContentOptions(): ResizeByContentOption {
    return this.gridOptions?.resizeByContentOptions ?? {};
  }

  constructor(protected readonly pubSubService: BasePubSubService) {
    this._eventHandler = new SlickEventHandler();
    this._bindingEventService = new BindingEventService();
  }

  /** Dispose function when service is destroyed */
  dispose(): void {
    // first clear all timers
    clearTimeout(this._timer);
    if (this.gridOptions.autoResize?.resizeDetection === 'container' && this._resizeObserver) {
      this._resizeObserver.disconnect();
    }

    // then unsubscribe all SlickGrid events and pub/sub events
    this._bindingEventService.unbindAll();
    this._eventHandler?.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
    this._subscriptions.length = 0;
  }

  init(grid: SlickGrid, gridParentContainerElm: HTMLElement): void {
    if (!grid || !this.gridOptions || !gridParentContainerElm) {
      throw new Error(`
      [Slickgrid-Universal] Resizer Service requires a valid Grid object and DOM Element Container to be provided.
      You can fix this by setting your gridOption to use "enableAutoResize" or create an instance of the ResizerService by calling bindAutoResizeDataGrid() once.`);
    }

    this._grid = grid;
    this._gridContainerElm = gridParentContainerElm;
    const fixedGridSizes =
      this.gridOptions?.gridHeight || this.gridOptions?.gridWidth
        ? { height: this.gridOptions?.gridHeight, width: this.gridOptions?.gridWidth }
        : undefined;
    this._autoResizeOptions = this.gridOptions?.autoResize ?? { container: 'grid1', bottomPadding: 0 };

    if (fixedGridSizes?.width && gridParentContainerElm?.style) {
      gridParentContainerElm.style.width = typeof fixedGridSizes.width === 'string' ? fixedGridSizes.width : `${fixedGridSizes.width}px`;
    }

    this._gridDomElm = grid.getContainerNode() as HTMLDivElement;

    if (typeof this._autoResizeOptions.container === 'string') {
      // prettier-ignore
      this._pageContainerElm = typeof this._autoResizeOptions.container === 'string' ? document.querySelector(this._autoResizeOptions.container) as HTMLElement : this._autoResizeOptions.container;
    } else {
      this._pageContainerElm = this._autoResizeOptions.container!;
    }

    if (fixedGridSizes) {
      this._fixedHeight = fixedGridSizes.height;
      this._fixedWidth = fixedGridSizes.width;
    }

    if (this.gridOptions.enableAutoResize) {
      this._autoHeightRecalcRow = this.gridOptions.autoResize?.autoHeightRecalcRow ?? 100;
      this.bindAutoResizeDataGrid();
    }

    // Events
    if (this.gridOptions.autoResize) {
      // resize by content could be called from the outside by other services via pub/sub event
      this._subscriptions.push(this.pubSubService.subscribe('onFullResizeByContentRequested', () => this.resizeColumnsByCellContent(true)));
    }

    // whenever the autosizeColumns() is called, we'll recalculate our header height total cache
    this._eventHandler.subscribe(this._grid.onAutosizeColumns, () => {
      this.cacheHeaderHeightTotal();
    });

    // on double-click resize, should we resize the cell by its cell content?
    // the same action can be called from a double-click and/or from column header menu
    if (this.gridOptions.enableColumnResizeOnDoubleClick) {
      this._subscriptions.push(
        this.pubSubService.subscribe('onHeaderMenuColumnResizeByContent', (data) => {
          this.handleSingleColumnResizeByContent(data.columnId);
        })
      );

      this._eventHandler.subscribe(this._grid.onColumnsResizeDblClick, (_e, args) => {
        this.handleSingleColumnResizeByContent(args.triggeredByColumn);
      });
    }
  }

  /** Bind an auto resize trigger on the datagrid, if that is enable then it will resize itself to the available space
   * Options: we could also provide a % factor to resize on each height/width independently
   */
  bindAutoResizeDataGrid(newSizes?: GridSize): null | void {
    this.saveLastWindowSize();
    if (this.gridOptions.autoResize?.resizeDetection === 'container') {
      if (!this._pageContainerElm) {
        throw new Error(`
          [Slickgrid-Universal] Resizer Service requires a container when gridOption.autoResize.resizeDetection="container"
          You can fix this by setting your gridOption.autoResize.container`);
      }
      if (!this._resizeObserver) {
        this._resizeObserver = new ResizeObserver(() => this.resizeObserverCallback());
      }
      this._resizeObserver.observe(this._pageContainerElm);
    } else {
      // if we can't find the grid to resize, return without binding anything
      if (this._gridDomElm === undefined) {
        return null;
      }

      // -- 1st resize the datagrid size at first load (we need this because the .on event is not triggered on first load)
      this.resizeGridOnFirstLoad().catch((rejection: any) => console.log('Error:', rejection));

      // -- do a 2nd resize with a slight delay (in ms) so that we resize after the grid render is done
      this.resizeGrid(10, newSizes);

      // -- 2nd bind a trigger on the Window DOM element, so that it happens also when resizing after first load
      // -- bind auto-resize to Window object only if it exist
      this._bindingEventService.bind(window, 'resize', () => {
        this.handleResizeGrid(newSizes);
      });
    }
  }

  handleResizeGrid(newSizes?: GridSize): void {
    this.pubSubService.publish('onGridBeforeResize');
    this.saveLastWindowSize();
    if (!this._resizePaused) {
      // for some yet unknown reason, calling the resize twice removes any stuttering/flickering
      // when changing the height and makes it much smoother experience
      this.resizeGrid(0, newSizes);
      this.resizeGrid(0, newSizes);
    }
  }

  resizeObserverCallback(): void {
    if (!this._resizePaused) {
      this.resizeGrid();
    }
  }

  /**
   * cache all header height total which will be used to calculate grid autoHeight with autoResize,
   * if you toggle any of the headers (column, header row, header menu), you should call this method to recalculate the header height total
   */
  cacheHeaderHeightTotal(): void {
    const topHeaderElm = this._gridContainerElm.querySelector<HTMLDivElement>(`${this.gridUidSelector} .slick-topheader-panel`);
    const headerElm = this._gridContainerElm.querySelector<HTMLDivElement>(`${this.gridUidSelector} .slick-header`);
    const headerRowElm = this._gridContainerElm.querySelector<HTMLDivElement>(`${this.gridUidSelector} .slick-headerrow`);
    this._allHeaderHeight = (topHeaderElm?.offsetHeight || 0) + (headerElm?.offsetHeight || 0) + (headerRowElm?.offsetHeight || 0);
  }

  /**
   * Calculate the datagrid new height/width from the available space, also consider that a % factor might be applied to calculation
   * @param {GridOption} gridOptions
   */
  calculateGridNewDimensions(gridOptions: GridOption): GridSize | null {
    const autoResizeOptions = gridOptions?.autoResize ?? {};
    const gridElmOffset = getOffset(this._gridDomElm);

    if (!window || !this._gridDomElm) {
      return null;
    }

    // calculate bottom padding
    // if using pagination, we need to add the pagination height to this bottom padding
    let bottomPadding = autoResizeOptions?.bottomPadding ?? DATAGRID_BOTTOM_PADDING;
    if (bottomPadding && gridOptions.enablePagination) {
      bottomPadding += DATAGRID_PAGINATION_HEIGHT;
    }

    // optionally show a custom footer with the data metrics(dataset length and last updated timestamp)
    if (bottomPadding && gridOptions.showCustomFooter) {
      const footerHeight: string | number = this.gridOptions?.customFooterOptions?.footerHeight ?? DATAGRID_FOOTER_HEIGHT;
      bottomPadding += parseInt(`${footerHeight}`, 10);
    }

    let gridHeight = 0;
    let gridOffsetTop = 0;

    // which DOM element are we using to calculate the available size for the grid?
    if (autoResizeOptions.calculateAvailableSizeBy === 'container') {
      // uses the container's height to calculate grid height without any top offset
      gridHeight = getInnerSize(this._pageContainerElm, 'height') || 0;
    } else {
      // uses the browser's window height with its top offset to calculate grid height
      gridHeight = window.innerHeight || 0;
      gridOffsetTop = gridElmOffset.top;
    }

    const availableHeight = gridHeight - gridOffsetTop - bottomPadding;
    const availableWidth =
      getInnerSize(this._pageContainerElm, 'width') ||
      (autoResizeOptions.calculateAvailableSizeBy !== 'container' && window.innerWidth) ||
      0;
    const maxHeight = autoResizeOptions?.maxHeight;
    const minHeight = autoResizeOptions?.minHeight ?? DATAGRID_MIN_HEIGHT;
    const maxWidth = autoResizeOptions?.maxWidth;
    const minWidth = autoResizeOptions?.minWidth ?? DATAGRID_MIN_WIDTH;

    let newHeight = availableHeight;
    let newWidth = autoResizeOptions?.rightPadding ? availableWidth - autoResizeOptions.rightPadding : availableWidth;

    // when `autoResize.autoHeight` is enabled, we'll calculate the available height by the data length + header height
    if (gridOptions.enableAutoResize && this.isAutoHeightEnabled) {
      const dataLn = this.dataView.getLength();
      if (dataLn < this.autoHeightRecalcRow) {
        this._allHeaderHeight || this.cacheHeaderHeightTotal();
        const dataHeight = dataLn * gridOptions.rowHeight!;
        const calcAutoHeight = this._allHeaderHeight + dataHeight;
        if (calcAutoHeight < newHeight) {
          newHeight = calcAutoHeight;
        }
      }
    }

    // optionally (when defined), make sure that grid height & width are within their thresholds
    if (newHeight < minHeight) {
      newHeight = minHeight;
    }
    if (maxHeight && newHeight > maxHeight) {
      newHeight = maxHeight;
    }
    if (newWidth < minWidth) {
      newWidth = minWidth;
    }
    if (maxWidth && newWidth > maxWidth) {
      newWidth = maxWidth;
    }

    // return the new dimensions unless a fixed height/width was defined
    return {
      height: this._fixedHeight || newHeight,
      width: this._fixedWidth || newWidth,
    };
  }

  /**
   * Return the last resize dimensions used by the service
   * @return {object} last dimensions (height, width)
   */
  getLastResizeDimensions(): GridSize | undefined {
    return this._lastGridSizes;
  }

  /**
   * Provide the possibility to pause the resizer for some time, until user decides to re-enabled it later if he wish to.
   * @param {boolean} isResizePaused are we pausing the resizer?
   */
  pauseResizer(isResizePaused: boolean): void {
    this._resizePaused = isResizePaused;
  }

  /**
   * Resize the datagrid to fit the browser height & width.
   * @param {number} delay to wait before resizing, defaults to 0 (in milliseconds)
   * @param {object} newSizes can optionally be passed (height, width)
   * @param {object} event that triggered the resize, defaults to null
   * @return If the browser supports it, we can return a Promise that would resolve with the new dimensions
   */
  resizeGrid(delay?: number, newSizes?: GridSize): Promise<GridSize | undefined> {
    return new Promise((resolve) => {
      // because of the JavaScript async nature, we might want to delay the resize a little bit
      delay = delay || 0;

      if (delay > 0) {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => resolve(this.resizeGridCallback(newSizes)), delay);
      } else {
        resolve(this.resizeGridCallback(newSizes));
      }
    });
  }

  resizeGridCallback(newSizes?: GridSize): GridSize | undefined {
    const dimensions = this.resizeGridWithDimensions(newSizes);
    this.pubSubService.publish('onGridAfterResize', dimensions);

    // we can call our resize by content here (when enabled)
    // since the core SlickResizer plugin only supports the "autosizeColumns"
    if (
      this.gridOptions.enableAutoResizeColumnsByCellContent &&
      (!this._lastGridSizes?.width || dimensions?.width !== this._lastGridSizes.width)
    ) {
      this.resizeColumnsByCellContent(false);
    }
    this._lastGridSizes = dimensions;

    return dimensions;
  }

  resizeGridWithDimensions(newSizes?: GridSize): GridSize | undefined {
    // calculate the available sizes with minimum height defined as a constant
    const availableDimensions = this.calculateGridNewDimensions(this.gridOptions);

    if ((newSizes || availableDimensions) && this._gridDomElm) {
      // get the new sizes, if new sizes are passed (not 0), we will use them else use available space
      // basically if user passes 1 of the dimension, let say he passes just the height,
      // we will use the height as a fixed height but the width will be resized by it's available space
      const newHeight = newSizes?.height ? newSizes.height : availableDimensions?.height;
      const newWidth = newSizes?.width ? newSizes.width : availableDimensions?.width;

      // apply these new height/width to the datagrid
      if (!this.gridOptions.autoHeight) {
        this._gridDomElm.style.height = `${newHeight}px`;
      }
      this._gridDomElm.style.width = typeof newWidth === 'string' ? newWidth : `${newWidth || 1}px`;
      if (this._gridContainerElm) {
        this._gridContainerElm.style.width = typeof newWidth === 'string' ? newWidth : `${newWidth}px`;
      }

      // resize the slickgrid canvas on all browser
      if (this._grid?.resizeCanvas && this._gridContainerElm) {
        this._grid.resizeCanvas();
      }

      // also call the grid auto-size columns so that it takes available space when going bigger
      if (this._grid && this.gridOptions?.enableAutoSizeColumns) {
        // make sure that the grid still exist (by looking if the Grid UID is found in the DOM tree) to avoid SlickGrid error "missing stylesheet"
        if (this.gridUid && document.querySelector(this.gridUidSelector)) {
          // don't call autosize unless dimension really changed
          if (!this._lastGridSizes || this._lastGridSizes.height !== newHeight || this._lastGridSizes.width !== newWidth) {
            this._grid.autosizeColumns();
          }
        }
      } else if (
        this.gridOptions.enableAutoResizeColumnsByCellContent &&
        (!this._lastGridSizes?.width || newWidth !== this._lastGridSizes.width)
      ) {
        // we can call our resize by content here (when enabled)
        // since the core SlickResizer plugin only supports the "autosizeColumns"
        this.resizeColumnsByCellContent(false);
      }

      // patch for Chromium browsers to avoid scrollbar from showing way too early when using `overflow:auto`
      // the canvas size equals exactly the size of its container and for some users (not all) it will show the horizontal scrollbar too early.
      // not exactly sure but, this might be caused by a floating precision on some computers
      this._gridDomElm.style.width = typeof newWidth === 'string' ? newWidth : `${(newWidth || 1) + 0.2}px`;

      // keep last resized dimensions & resolve them to the Promise
      this._lastGridSizes = {
        height: newHeight || 0,
        width: newWidth || 0,
      };
    }

    return this._lastGridSizes;
  }

  /**
   * Resize each column width by their cell text/value content (this could potentially go wider than the viewport and end up showing an horizontal scroll).
   * This operation requires to loop through each dataset item to inspect each cell content width and has a performance cost associated to this process.
   *
   * NOTE: please that for performance reasons we will inspect up to 1000 evenly spaced rows,
   * however user could override it by using the grid option `resizeByContentOptions.sampleSize` to increase/decrease how many items to inspect.
   * @param {Boolean} recalculateColumnsTotalWidth - defaults to false, do we want to recalculate the necessary total columns width even if it was already calculated?
   */
  resizeColumnsByCellContent(recalculateColumnsTotalWidth = false): void {
    const columns = this._grid.getColumns();
    const dataset = this.dataView.getItems() as any[];
    const columnWidths: { [columnId in string | number]: number } = Object.create(null);
    let reRender = false;
    let readItemCount = 0;
    const viewportWidth = this._gridContainerElm?.offsetWidth ?? 0;

    // if our columns total width is smaller than the grid viewport, we can call the column autosize directly without the need to recalculate all column widths
    if (
      !Array.isArray(dataset) ||
      dataset.length === 0 ||
      (!recalculateColumnsTotalWidth && this._totalColumnsWidthByContent > 0 && this._totalColumnsWidthByContent < viewportWidth)
    ) {
      this._grid.autosizeColumns();
      return;
    }

    if (this._hasResizedByContentAtLeastOnce && this.gridOptions?.resizeByContentOnlyOnFirstLoad && !recalculateColumnsTotalWidth) {
      return;
    }

    this.pubSubService.publish('onBeforeResizeByContent', undefined, 0);

    // calculate total width necessary by each cell content
    // we won't re-evaluate if we already had calculated the total
    if (this._totalColumnsWidthByContent === 0 || recalculateColumnsTotalWidth) {
      // calculate cell width by reading all data from dataset and also parse through any Formatter(s) when exist
      readItemCount = this.calculateCellWidthByReadingDataset(columns, columnWidths, this.resizeByContentOptions.sampleSize);

      // finally loop through all column definitions one last time to apply new calculated `width` on each elligible column
      let totalColsWidth = 0;
      for (const column of columns) {
        const resizeAlwaysRecalculateWidth =
          column.resizeAlwaysRecalculateWidth ?? this.resizeByContentOptions.alwaysRecalculateColumnWidth ?? false;

        if (column.originalWidth && !resizeAlwaysRecalculateWidth) {
          column.width = column.originalWidth;
        } else if (columnWidths[column.id] !== undefined) {
          if (column.rerenderOnResize) {
            reRender = true;
          }

          // let's start with column width found in previous column & data analysis
          this.applyNewCalculatedColumnWidthByReference(column, columnWidths[column.id]);
        }

        // add the new column width to the total width which we'll use later to compare against viewport width
        totalColsWidth += column.width || 0;
      }
      this._totalColumnsWidthByContent = totalColsWidth;
    }

    // send updated column definitions widths to SlickGrid
    this._grid.updateColumns();
    this._hasResizedByContentAtLeastOnce = true;

    const calculateColumnWidths: { [columnId in string | number]: number | undefined } = Object.create(null);
    for (const columnDef of columns) {
      calculateColumnWidths[columnDef.id] = columnDef.width;
    }

    // get the grid container viewport width and if our viewport calculated total columns is greater than the viewport width
    // then we'll call reRenderColumns() when getting wider than viewport or else the default autosizeColumns() when we know we have plenty of space to shrink the columns
    this._totalColumnsWidthByContent > viewportWidth ? this._grid.reRenderColumns(reRender) : this._grid.autosizeColumns();
    this.pubSubService.publish('onAfterResizeByContent', { readItemCount, calculateColumnWidths });
  }

  // --
  // protected functions
  // ------------------

  /**
   * Step 1 - Read the dataset (spread evenly when it has more items than the max item count) and keep the distinct formatted (sanitized) texts of each column,
   * then measure these candidates with a canvas to find the widest text, add the cell padding and optionally the header width.
   * @param columnOrColumns - single or array of column definition(s)
   * @param columnWidths - column width object that will be updated by reference pointers
   * @param maxItemToInspect - maximum count of items to read
   * @param columnIndexOverride - an optional column index, if provided it will override the column index position
   * @returns - count of items that was read
   */
  protected calculateCellWidthByReadingDataset(
    columnOrColumns: Column | Column[],
    columnWidths: { [columnId in string | number]: number },
    maxItemToInspect = 1000,
    columnIndexOverride?: number
  ): number {
    const columns = Array.isArray(columnOrColumns) ? columnOrColumns : [columnOrColumns];
    const dataset = this.dataView.getItems() as any[];
    const step = Math.max(1, Math.ceil(dataset.length / maxItemToInspect));

    // Deduplicate sampled texts without discarding shorter strings that may be wider in pixels.
    let readItemCount = 0;
    const candidatesMap: { [columnId: string]: Set<string> } = Object.create(null);
    columns.forEach((columnDef) => (candidatesMap[columnDef.id] = new Set()));
    for (let rowIdx = 0; rowIdx < dataset.length; rowIdx += step) {
      columns.forEach((columnDef, colIdx) => {
        const formattedData = parseFormatterWhenExist(
          columnDef.formatter,
          rowIdx,
          columnIndexOverride ?? colIdx,
          columnDef,
          dataset[rowIdx],
          this._grid
        );
        const text = isPrimitiveOrHTML(formattedData) ? stripTags(formattedData) : '';
        if (text) {
          candidatesMap[columnDef.id].add(text);
        }
      });
      readItemCount++;
    }

    // measure the candidates with the cell font and add the cell padding (from CSS unless overridden)
    const ctx = this.getCanvasContext();
    columns.forEach((columnDef, colIdx) => {
      const cellStyle = this.readCellStyle(columnDef, columnIndexOverride ?? colIdx);
      const cellPadding = this.resizeByContentOptions.cellPaddingWidthInPx ?? cellStyle.padding;
      ctx.font = cellStyle.font;
      let textWidth = 0;
      candidatesMap[columnDef.id].forEach((text) => {
        textWidth = Math.max(textWidth, ctx.measureText(this.applyTextTransform(text, cellStyle.textTransform)).width);
      });
      columnWidths[columnDef.id] = Math.max(textWidth + cellPadding, this.calculateHeaderWidth(columnDef));
    });

    return readItemCount;
  }

  /** Calculate the header title width (including padding and sort/menu icons) when `includeHeaderWidth` is enabled, or else return 0 */
  protected calculateHeaderWidth(column: Column): number {
    const headerElm = this.resizeByContentOptions.includeHeaderWidth ? this._grid.getHeaderColumn(column.id) : null;
    if (!headerElm) {
      return 0;
    }
    const nameElm = headerElm.querySelector('.slick-column-name');
    const ctx = this.getCanvasContext();
    const nameStyle = this.getElementStyle(nameElm || headerElm);
    ctx.font = nameStyle.font;
    const headerText = this.applyTextTransform(nameElm?.textContent || '', nameStyle.textTransform);
    let headerWidth = this.getElementStyle(headerElm).padding + ctx.measureText(headerText).width;
    headerElm.querySelectorAll('.slick-sort-indicator,.slick-header-menu-button').forEach((iconElm) => {
      headerWidth += parseFloat(getComputedStyle(iconElm).width) || 0;
    });
    return headerWidth;
  }

  /** Read the font and horizontal padding (incl. borders) of a grid cell, a temp cell is created when the grid has no rows yet. */
  protected readCellStyle(column: Column, columnIndex: number): { font: string; padding: number; textTransform: string } {
    const gCanvas = this._grid.getCanvasNode();
    let cellElm = gCanvas?.querySelector(`:scope > .slick-row > .slick-cell.l${columnIndex}`);
    let tmpRowElm: HTMLDivElement | undefined;
    if (gCanvas && !cellElm) {
      tmpRowElm = createDomElement('div', { className: 'slick-row' }, gCanvas);
      cellElm = createDomElement('div', { className: `slick-cell l${columnIndex} r${columnIndex} ${column.cssClass || ''}` }, tmpRowElm);
    }
    const style = this.getElementStyle(cellElm);
    tmpRowElm?.remove();
    return style;
  }

  /** Get an element font (built from longhands since the `font` shorthand might be empty in some browsers) and its horizontal padding + borders */
  protected getElementStyle(elm?: Element | null): { font: string; padding: number; textTransform: string } {
    if (!elm) {
      return { font: '', padding: 0, textTransform: '' };
    }
    const { fontStyle, fontWeight, fontSize, fontFamily, paddingLeft, paddingRight, borderLeftWidth, borderRightWidth, textTransform } =
      getComputedStyle(elm);
    return {
      font: `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`.trim(),
      textTransform,
      padding: [paddingLeft, paddingRight, borderLeftWidth, borderRightWidth].reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
    };
  }

  /** Apply common CSS text transformations before measuring rendered text. */
  protected applyTextTransform(text: string, transform: string): string {
    if (transform === 'uppercase') {
      return text.toUpperCase();
    }
    if (transform === 'lowercase') {
      return text.toLowerCase();
    }
    if (transform === 'capitalize') {
      return text.replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
    }
    return text;
  }

  getBrowserCanvas(): CanvasRenderingContext2D {
    return document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  }

  protected getCanvasContext(): CanvasRenderingContext2D {
    return (this._canvasCtx ??= this.getBrowserCanvas());
  }

  /**
   * Step 2 - Apply the new calculated width, it might or might not use this calculated width depending on a few conditions.
   * It will add any extra/editor padding, make sure the new width doesn't go over a maxWidth and/or a maxWidthThreshold and isn't below the minWidth.
   * @param {Object} column - column definition to apply the width
   * @param {Number} calculatedColumnWidth - new calculated column width to possibly apply
   */
  protected applyNewCalculatedColumnWidthByReference(column: Column<any>, calculatedColumnWidth: number): void {
    let newColWidth = calculatedColumnWidth + (column.resizeExtraWidthPadding ?? 0);
    if (column.editor && this.gridOptions.editable) {
      newColWidth += this.resizeByContentOptions.formatterPaddingWidthInPx ?? 0;
    }

    // make sure we're not over a column max width and/or optional custom max width threshold, and not under the min width
    newColWidth = Math.min(newColWidth, column.maxWidth ?? Infinity, column.resizeMaxWidthThreshold ?? Infinity);
    newColWidth = Math.ceil(Math.max(newColWidth, column.minWidth ?? 0));

    // finally only apply the new width if user didn't yet provide one and/or if user really wants to specifically ask for a recalculate
    // prettier-ignore
    if (column.originalWidth === undefined || column.resizeAlwaysRecalculateWidth === true || this.resizeByContentOptions.alwaysRecalculateColumnWidth === true) {
      column.width = newColWidth;
    }
  }

  protected handleSingleColumnResizeByContent(columnId: string): void {
    // A custom DataView might not expose all rows through getItems() (for example, a windowed
    // DataView can intentionally return an empty array). In that case we cannot calculate a
    // content width, so leave the current column width unchanged and let the consumer provide
    // its own resize handler if it can fetch the rows asynchronously.
    const dataItems = this.dataView?.getItems?.();
    if (!Array.isArray(dataItems) || dataItems.length === 0) {
      return;
    }

    const columns = this._grid.getColumns();
    const columnDefIdx = columns.findIndex((col) => col.id === columnId);

    if (columnDefIdx >= 0) {
      // provide the initial column width by reference to the calculation and the result will also be returned by reference
      const columnDef = columns[columnDefIdx];
      const columnWidths: { [columnId: string]: number } = {};
      columnDef.originalWidth = undefined; // reset original width since we want to recalculate it
      this.calculateCellWidthByReadingDataset(columnDef, columnWidths, this.resizeByContentOptions.singleColumnSampleSize, columnDefIdx);
      this.applyNewCalculatedColumnWidthByReference(columnDef, columnWidths[columnId]);

      // finally call the re-render for the UI to render the new column width
      this._grid.reRenderColumns(columnDef?.rerenderOnResize ?? false);
    }
  }

  /** Initial resize hook for integrations that need additional layout recovery. */
  protected resizeGridOnFirstLoad(): Promise<GridSize | undefined> {
    return this.resizeGrid();
  }

  /** keep reference of the last window size for possible comparisons */
  protected saveLastWindowSize(): void {
    this._lastWindowSize = {
      height: window.innerHeight,
      width: window.innerWidth,
    };
  }
}
