import {
  Column,
  FieldType,
  getHtmlElementOffset,
  GetSlickEventType,
  GridOption,
  GridSize,
  parseFormatterWhenExist,
  PubSubService,
  ResizeByContentOption,
  sanitizeHtmlToText,
  SlickDataView,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  SlickResizer,
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;
const DATAGRID_FOOTER_HEIGHT = 25;
const DATAGRID_PAGINATION_HEIGHT = 35;
const DEFAULT_INTERVAL_MAX_RETRIES = 70;
const DEFAULT_INTERVAL_RETRY_DELAY = 250;

export class ResizerService {
  private _grid!: SlickGrid;
  private _addon!: SlickResizer;
  private _eventHandler: SlickEventHandler;
  private _gridParentContainerElm!: HTMLElement;
  private _intervalId!: NodeJS.Timeout;
  private _intervalExecutionCounter = 0;
  private _intervalRetryDelay = DEFAULT_INTERVAL_RETRY_DELAY;
  private _isStopResizeIntervalRequested = false;
  private _hasResizedByContentAtLeastOnce = false;
  private _lastDimensions?: GridSize;
  private _totalColumnsWidthByContent = 0;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this._grid && this._grid.getOptions) ? this._grid.getOptions() : {};
  }

  /** Getter for the SlickGrid DataView */
  get dataView(): SlickDataView {
    return this._grid?.getData() as SlickDataView;
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this._grid?.getUID() ?? '';
  }

  get intervalRetryDelay(): number {
    return this._intervalRetryDelay;
  }
  set intervalRetryDelay(delay: number) {
    this._intervalRetryDelay = delay;
  }

  get resizeByContentOptions(): ResizeByContentOption {
    return this.gridOptions?.resizeByContentOptions ?? {};
  }

  constructor(private eventPubSubService: PubSubService) {
    this._eventHandler = new Slick.EventHandler();
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickResizer | null {
    return this._addon;
  }

  /** dispose (destroy) the 3rd party plugin */
  dispose() {
    this._addon?.destroy();
    this._eventHandler?.unsubscribeAll();
  }

  init(grid: SlickGrid, gridParentContainerElm: HTMLElement) {
    this._grid = grid;
    this._gridParentContainerElm = gridParentContainerElm;
    const fixedGridDimensions = (this.gridOptions?.gridHeight || this.gridOptions?.gridWidth) ? { height: this.gridOptions?.gridHeight, width: this.gridOptions?.gridWidth } : undefined;
    const autoResizeOptions = this.gridOptions?.autoResize ?? { bottomPadding: 0 };
    if (autoResizeOptions?.bottomPadding !== undefined && this.gridOptions.showCustomFooter) {
      const footerHeight: string | number = this.gridOptions?.customFooterOptions?.footerHeight ?? DATAGRID_FOOTER_HEIGHT;
      autoResizeOptions.bottomPadding += parseInt(`${footerHeight}`, 10);
    }
    if (autoResizeOptions?.bottomPadding !== undefined && this.gridOptions.enablePagination) {
      autoResizeOptions.bottomPadding += DATAGRID_PAGINATION_HEIGHT;
    }
    if (fixedGridDimensions?.width && gridParentContainerElm?.style) {
      gridParentContainerElm.style.width = typeof fixedGridDimensions.width === 'string' ? fixedGridDimensions.width : `${fixedGridDimensions.width}px`;
    }

    this._addon = new Slick.Plugins.Resizer({ ...autoResizeOptions, gridContainer: gridParentContainerElm }, fixedGridDimensions);
    this._grid.registerPlugin<SlickResizer>(this._addon);
    if (this.gridOptions.enableAutoResize && this._addon?.resizeGrid() instanceof Promise) {
      this._addon.resizeGrid()
        .then(() => this.resizeGridWhenStylingIsBrokenUntilCorrected())
        .catch((rejection: any) => console.log('Error:', rejection));
    }

    // Events
    if (this.gridOptions.autoResize) {
      if (this._addon && this._addon.onGridAfterResize) {
        const onGridAfterResizeHandler = this._addon.onGridAfterResize;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onGridAfterResizeHandler>>).subscribe(onGridAfterResizeHandler, (_e, args) => {
          this.eventPubSubService.publish('onGridAfterResize', args);

          // we can call our resize by content here (when enabled)
          // since the core Slick.Resizer plugin only supports the "autosizeColumns"
          if (this.gridOptions.enableAutoResizeColumnsByCellContent && (!this._lastDimensions?.width || args.dimensions.width !== this._lastDimensions?.width)) {
            this.resizeColumnsByCellContent();
          }
          this._lastDimensions = args.dimensions;
        });
      }
      if (this._addon && this._addon.onGridBeforeResize) {
        const onGridBeforeResizeHandler = this._addon.onGridBeforeResize;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onGridBeforeResizeHandler>>).subscribe(onGridBeforeResizeHandler, (_e, args) => {
          this.eventPubSubService.publish('onGridBeforeResize', args);
        });
      }

      // resize by content could be called from the outside by other services via pub/sub event
      this.eventPubSubService.subscribe('onFullResizeByContentRequested', () => this.resizeColumnsByCellContent(true));
    }

    // on double-click resize, should we resize the cell by its cell content?
    // the same action can be called from a double-click and/or from column header menu
    if (this.gridOptions?.enableColumnResizeOnDoubleClick) {
      this.eventPubSubService.subscribe('onHeaderMenuColumnResizeByContent', (data => {
        this.handleSingleColumnResizeByContent(data.columnId);
      }));

      const onColumnsResizeDblClickHandler = this._grid.onColumnsResizeDblClick;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onColumnsResizeDblClickHandler>>).subscribe(onColumnsResizeDblClickHandler, (_e, args) => {
        this.handleSingleColumnResizeByContent(args.triggeredByColumn);
      });
    }
  }

  /**
   * Return the last resize dimensions used by the service
   * @return {object} last dimensions (height, width)
   */
  getLastResizeDimensions(): GridSize {
    return this._addon?.getLastResizeDimensions();
  }

  /**
   * Provide the possibility to pause the resizer for some time, until user decides to re-enabled it later if he wish to.
   * @param {boolean} isResizePaused are we pausing the resizer?
   */
  pauseResizer(isResizePaused: boolean) {
    this._addon.pauseResizer(isResizePaused);
  }

  requestStopOfAutoFixResizeGrid(isStopRequired = true) {
    this._isStopResizeIntervalRequested = isStopRequired;
  }

  /**
   * Resize each column width by their cell text/value content (this could potentially go wider than the viewport and end up showing an horizontal scroll).
   * This operation requires to loop through each dataset item to inspect each cell content width and has a performance cost associated to this process.
   *
   * NOTE: please that for performance reasons we will only inspect the first 1000 rows,
   * however user could override it by using the grid option `resizeMaxItemToInspectCellContentWidth` to increase/decrease how many items to inspect.
   * @param {Boolean} recalculateColumnsTotalWidth - defaults to false, do we want to recalculate the necessary total columns width even if it was already calculated?
   */
  resizeColumnsByCellContent(recalculateColumnsTotalWidth = false) {
    const columnDefinitions = this._grid.getColumns();
    const dataset = this.dataView.getItems() as any[];
    const columnWidths: { [columnId in string | number]: number; } = {};
    let reRender = false;
    let readItemCount = 0;

    if ((!Array.isArray(dataset) || dataset.length === 0) || (this._hasResizedByContentAtLeastOnce && this.gridOptions?.resizeByContentOnlyOnFirstLoad && !recalculateColumnsTotalWidth)) {
      return;
    }

    this.eventPubSubService.publish('onBeforeResizeByContent');

    // calculate total width necessary by each cell content
    // we won't re-evaluate if we already had calculated the total
    if (this._totalColumnsWidthByContent === 0 || recalculateColumnsTotalWidth) {
      // loop through all columns to get their minWidth or width for later usage
      for (const columnDef of columnDefinitions) {
        columnWidths[columnDef.id] = columnDef.originalWidth ?? columnDef.minWidth ?? 0;
      }

      // calculate cell width by reading all data from dataset and also parse through any Formatter(s) when exist
      readItemCount = this.calculateCellWidthByReadingDataset(columnDefinitions, columnWidths, this.resizeByContentOptions.maxItemToInspectCellContentWidth);

      // finally loop through all column definitions one last time to apply new calculated `width` on each elligible column
      let totalColsWidth = 0;
      for (const column of columnDefinitions) {
        const resizeAlwaysRecalculateWidth = column.resizeAlwaysRecalculateWidth ?? this.resizeByContentOptions.alwaysRecalculateColumnWidth ?? false;

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
        this._totalColumnsWidthByContent = totalColsWidth;
      }
    }

    // send updated column definitions widths to SlickGrid
    this._grid.setColumns(columnDefinitions);
    this._hasResizedByContentAtLeastOnce = true;

    const calculateColumnWidths: { [columnId in string | number]: number | undefined; } = {};
    for (const columnDef of columnDefinitions) {
      calculateColumnWidths[columnDef.id] = columnDef.width;
    }

    // get the grid container viewport width and if our viewport calculated total columns is greater than the viewport width
    // then we'll call reRenderColumns() when getting wider than viewport or else the default autosizeColumns() when we know we have plenty of space to shrink the columns
    const viewportWidth = this._gridParentContainerElm?.offsetWidth ?? 0;
    this._totalColumnsWidthByContent > viewportWidth ? this._grid.reRenderColumns(reRender) : this._grid.autosizeColumns();
    this.eventPubSubService.publish('onAfterResizeByContent', { readItemCount, calculateColumnWidths });
  }

  /**
   * Resize the datagrid to fit the browser height & width.
   * @param {number} delay to wait before resizing, defaults to 0 (in milliseconds)
   * @param {object} newSizes can optionally be passed (height, width)
   * @param {object} event that triggered the resize, defaults to null
   * @return If the browser supports it, we can return a Promise that would resolve with the new dimensions
   */
  resizeGrid(delay?: number, newSizes?: GridSize, event?: SlickEventData): Promise<GridSize> | null {
    return this._addon?.resizeGrid(delay, newSizes, event);
  }

  // --
  // private functions
  // ------------------

  /**
   * Step 1 - The first step will read through the entire dataset (unless max item count is reached),
   * it will analyze each cell of the grid and calculate its max width via its content and column definition info (it will do so by calling step 2 method while looping through each cell).
   * @param columnOrColumns - single or array of column definition(s)
   * @param columnWidths - column width object that will be updated by reference pointers
   * @param columnIndexOverride - an optional column index, if provided it will override the column index position
   * @returns - count of items that was read
   */
  private calculateCellWidthByReadingDataset(columnOrColumns: Column | Column[], columnWidths: { [columnId in string | number]: number; }, maxItemToInspect = 1000, columnIndexOverride?: number) {
    const columnDefinitions = Array.isArray(columnOrColumns) ? columnOrColumns : [columnOrColumns];

    // const columnDefinitions = this._grid.getColumns();
    const dataset = this.dataView.getItems() as any[];

    let readItemCount = 0;
    for (const [rowIdx, item] of dataset.entries()) {
      if (rowIdx > maxItemToInspect) {
        break;
      }
      if (Array.isArray(columnDefinitions)) {
        if (typeof columnWidths === 'object') {
          columnDefinitions.forEach((columnDef, colIdx) => {
            const newColumnWidth = this.calculateCellWidthByContent(item, columnDef, rowIdx, columnIndexOverride ?? colIdx, columnWidths[columnDef.id]);
            if (newColumnWidth !== undefined) {
              columnWidths[columnDef.id] = newColumnWidth;
            }
          });
        }
      }
      readItemCount = rowIdx + 1;
    }

    return readItemCount;
  }

  /**
   * Step 2 - This step will parse any Formatter(s) if defined, it will then sanitize any HTML tags and calculate the max width from that cell content.
   * This function will be executed on every cell of the grid data.
   * @param {Object} item - item data context object
   * @param {Object} columnDef - column definition
   * @param {Number} rowIdx - row index
   * @param {Number} colIdx - column (cell) index
   * @param {Number} initialMininalColumnWidth - initial width, could be coming from `minWidth` or a default `width`
   * @returns - column width
   */
  private calculateCellWidthByContent(item: any, columnDef: Column, rowIdx: number, colIdx: number, initialMininalColumnWidth?: number): number | undefined {
    const resizeCellCharWidthInPx = this.resizeByContentOptions.cellCharWidthInPx ?? 7; // width in pixels of a string character, this can vary depending on which font family/size is used & cell padding

    if (!columnDef.originalWidth) {
      const charWidthPx = columnDef?.resizeCharWidthInPx ?? resizeCellCharWidthInPx;
      const formattedData = parseFormatterWhenExist(columnDef?.formatter, rowIdx, colIdx, columnDef, item, this._grid);
      const formattedDataSanitized = sanitizeHtmlToText(formattedData);
      const formattedTextWidthInPx = Math.ceil(formattedDataSanitized.length * charWidthPx);
      const resizeMaxWidthThreshold = columnDef.resizeMaxWidthThreshold;
      if (columnDef && (initialMininalColumnWidth === undefined || formattedTextWidthInPx > initialMininalColumnWidth)) {
        initialMininalColumnWidth = (resizeMaxWidthThreshold !== undefined && formattedTextWidthInPx > resizeMaxWidthThreshold)
          ? resizeMaxWidthThreshold
          : (columnDef.maxWidth !== undefined && formattedTextWidthInPx > columnDef.maxWidth) ? columnDef.maxWidth : formattedTextWidthInPx;
      }
    }
    return initialMininalColumnWidth;
  }

  /**
   * Step 3 - Apply the new calculated width, it might or might not use this calculated width depending on a few conditions.
   * One of those condition will be to check that the new width doesn't go over a maxWidth and/or a maxWidthThreshold
   * @param {Object} column - column definition to apply the width
   * @param {Number} calculatedColumnWidth - new calculated column width to possibly apply
   */
  private applyNewCalculatedColumnWidthByReference(column: Column<any>, calculatedColumnWidth: number) {
    // read a few optional resize by content grid options
    const resizeCellPaddingWidthInPx = this.resizeByContentOptions.cellPaddingWidthInPx ?? 6;
    const resizeFormatterPaddingWidthInPx = this.resizeByContentOptions.formatterPaddingWidthInPx ?? 6;
    const fieldType = column?.filter?.type ?? column?.type ?? FieldType.string;

    // let's start with column width found in previous column & data analysis
    let newColWidth = calculatedColumnWidth;

    // apply optional ratio which is typically 1, except for string where we use a ratio of around ~0.9 since we have more various thinner characters like (i, l, t, ...)
    const stringWidthRatio = column?.resizeCalcWidthRatio ?? this.resizeByContentOptions.defaultRatioForStringType ?? 0.9;
    newColWidth *= fieldType === 'string' ? stringWidthRatio : 1;

    // apply extra cell padding, custom padding & editor formatter padding
    // --
    newColWidth += resizeCellPaddingWidthInPx;
    if (column.resizeExtraWidthPadding) {
      newColWidth += column.resizeExtraWidthPadding;
    }
    if (column.editor && this.gridOptions.editable) {
      newColWidth += resizeFormatterPaddingWidthInPx;
    }

    // make sure we're not over a column max width and/or optional custom max width threshold
    if (column.maxWidth !== undefined && newColWidth > column.maxWidth) {
      newColWidth = column.maxWidth;
    }
    if (column.resizeMaxWidthThreshold !== undefined && newColWidth > column.resizeMaxWidthThreshold) {
      newColWidth = column.resizeMaxWidthThreshold;
    }

    // make the value the closest bottom integer
    newColWidth = Math.ceil(newColWidth);

    // finally only apply the new width if user didn't yet provide one and/or if user really wants to specifically ask for a recalculate
    if (column.originalWidth === undefined || column.resizeAlwaysRecalculateWidth === true || this.resizeByContentOptions.alwaysRecalculateColumnWidth === true) {
      column.width = this.readjustNewColumnWidthWhenOverLimit(column, newColWidth);
    }
  }

  private handleSingleColumnResizeByContent(columnId: string) {
    const columnDefinitions = this._grid.getColumns();
    const columnDefIdx = columnDefinitions.findIndex(col => col.id === columnId);

    if (columnDefIdx >= 0) {
      // provide the initial column width by reference to the calculation and the result will also be returned by reference
      const columnDef = columnDefinitions[columnDefIdx];
      const columnWidths = { [columnId]: columnDef.originalWidth ?? columnDef.minWidth ?? 0 };
      columnDef.originalWidth = undefined; // reset original width since we want to recalculate it
      this.calculateCellWidthByReadingDataset(columnDef, columnWidths, this.resizeByContentOptions.maxItemToInspectSingleColumnWidthByContent, columnDefIdx);
      this.applyNewCalculatedColumnWidthByReference(columnDef, columnWidths[columnId]);

      // finally call the re-render for the UI to render the new column width
      this._grid.reRenderColumns(columnDef?.rerenderOnResize ?? false);
    }
  }

  /**
   * Checks wether the new calculated column width is valid or not, if it's not then return a lower and acceptable width.
   * When using frozen (pinned) column, we cannot make our column wider than the grid viewport because it would become unusable/unscrollable
   * and so if we do reach that threshold then our calculated column width becomes officially invalid
   * @param {Object} column - column definition
   * @param {Number} newColumnWidth - calculated column width input
   * @returns boolean
   */
  private readjustNewColumnWidthWhenOverLimit(column: Column, newColumnWidth: number): number {
    const frozenColumnIdx = this.gridOptions.frozenColumn ?? -1;
    const columnIdx = this._grid.getColumns().findIndex(col => col.id === column.id) ?? 0;
    let adjustedWidth = newColumnWidth;

    if (frozenColumnIdx >= 0 && columnIdx <= frozenColumnIdx) {
      const allViewports = Array.from(this._grid.getViewports());
      const leftViewportWidth = allViewports.find(viewport => viewport.classList.contains('slick-viewport-left'))?.clientWidth ?? 0;
      const rightViewportWidth = allViewports.find(viewport => viewport.classList.contains('slick-viewport-right'))?.clientWidth ?? 0;
      const viewportFullWidth = leftViewportWidth + rightViewportWidth;
      const leftViewportWidthMinusCurrentCol = leftViewportWidth - (column.width ?? 0);
      const isGreaterThanFullViewportWidth = (leftViewportWidthMinusCurrentCol + newColumnWidth) > viewportFullWidth;

      if (isGreaterThanFullViewportWidth) {
        const resizeWidthToRemoveFromExceededWidthReadjustment = this.resizeByContentOptions.widthToRemoveFromExceededWidthReadjustment ?? 50;
        adjustedWidth = (leftViewportWidth - leftViewportWidthMinusCurrentCol + rightViewportWidth - resizeWidthToRemoveFromExceededWidthReadjustment);
      }
    }
    return Math.ceil(adjustedWidth);
  }

  /**
   * Patch for SalesForce, some issues arise when having a grid inside a Tab and user clicks in a different Tab without waiting for the grid to be rendered
   * in ideal world, we would simply call a resize when user comes back to the Tab with the grid (tab focused) but this is an extra step and we might not always have this event available.
   * The grid seems broken, the header titles seems to be showing up behind the grid data and the rendering seems broken.
   * Why it happens? Because SlickGrid can resize problem when the DOM element is hidden and that happens when user doesn't wait for the grid to be fully rendered and go in a different Tab.
   *
   * So the patch is to call a grid resize if the following 2 conditions are met
   *   1- header row is Y coordinate 0 (happens when user is not in current Tab)
   *   2- header titles are lower than the viewport of dataset (this can happen when user change Tab and DOM is not shown),
   * for these cases we'll resize until it's no longer true or until we reach a max time limit (70min)
   */
  private resizeGridWhenStylingIsBrokenUntilCorrected() {
    const headerElm = document.querySelector<HTMLDivElement>(`.${this.gridUid} .slick-header`);
    const viewportElm = document.querySelector<HTMLDivElement>(`.${this.gridUid} .slick-viewport`);

    if (headerElm && viewportElm) {
      this._intervalId = setInterval(() => {
        const headerTitleRowHeight = 44; // this one is set by SASS/CSS so let's hard code it
        const headerPos = getHtmlElementOffset(headerElm);
        let headerOffsetTop = headerPos?.top ?? 0;
        if (this.gridOptions && this.gridOptions.enableFiltering && this.gridOptions.headerRowHeight) {
          headerOffsetTop += this.gridOptions.headerRowHeight; // filter row height
        }
        if (this.gridOptions && this.gridOptions.createPreHeaderPanel && this.gridOptions.showPreHeaderPanel && this.gridOptions.preHeaderPanelHeight) {
          headerOffsetTop += this.gridOptions.preHeaderPanelHeight; // header grouping titles row height
        }
        headerOffsetTop += headerTitleRowHeight; // header title row height

        const viewportPos = getHtmlElementOffset(viewportElm);
        const viewportOffsetTop = viewportPos?.top ?? 0;

        // if header row is Y coordinate 0 (happens when user is not in current Tab) or when header titles are lower than the viewport of dataset (this can happen when user change Tab and DOM is not shown)
        // for these cases we'll resize until it's no longer true or until we reach a max time limit (70min)
        let isResizeRequired = (headerPos?.top === 0 || (headerOffsetTop - viewportOffsetTop) > 40) ? true : false;

        // user could choose to manually stop the looped of auto resize fix
        if (this._isStopResizeIntervalRequested) {
          isResizeRequired = false;
        }

        if (isResizeRequired && this._addon?.resizeGrid) {
          this._addon.resizeGrid();
        } else if ((!isResizeRequired && !this.gridOptions.useSalesforceDefaultGridOptions) || (this._intervalExecutionCounter++ > (4 * 60 * DEFAULT_INTERVAL_MAX_RETRIES))) { // interval is 250ms, so 4x is 1sec, so (4 * 60 * intervalMaxTimeInMin) shoud be 70min
          clearInterval(this._intervalId); // stop the interval if we don't need resize or if we passed let say 70min
        }
      }, this.intervalRetryDelay);
    }
  }
}
