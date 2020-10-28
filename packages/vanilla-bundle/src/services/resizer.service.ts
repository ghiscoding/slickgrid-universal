import {
  getHtmlElementOffset,
  GetSlickEventType,
  GridOption,
  GridSize,
  PubSubService,
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
  private _grid: SlickGrid;
  private _addon: SlickResizer;
  private _eventHandler: SlickEventHandler;
  private _intervalId: NodeJS.Timeout;
  private _intervalExecutionCounter = 0;
  private _intervalRetryDelay = DEFAULT_INTERVAL_RETRY_DELAY;
  private _isStopResizeIntervalRequested = false;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this._grid && this._grid.getOptions) ? this._grid.getOptions() : {};
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
    const fixedGridDimensions = (this.gridOptions?.gridHeight || this.gridOptions?.gridWidth) ? { height: this.gridOptions?.gridHeight, width: this.gridOptions?.gridWidth } : undefined;
    const autoResizeOptions = this.gridOptions?.autoResize ?? { bottomPadding: 0 };
    if (autoResizeOptions && autoResizeOptions.bottomPadding !== undefined && this.gridOptions.showCustomFooter) {
      const footerHeight: string | number = this.gridOptions?.customFooterOptions?.footerHeight ?? DATAGRID_FOOTER_HEIGHT;
      autoResizeOptions.bottomPadding += parseInt(`${footerHeight}`, 10);
    }
    if (autoResizeOptions && autoResizeOptions.bottomPadding !== undefined && this.gridOptions.enablePagination) {
      autoResizeOptions.bottomPadding += DATAGRID_PAGINATION_HEIGHT;
    }
    if (fixedGridDimensions?.width && gridParentContainerElm?.style) {
      gridParentContainerElm.style.width = `${fixedGridDimensions.width}px`;
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
        });
      }
      if (this._addon && this._addon.onGridBeforeResize) {
        const onGridBeforeResizeHandler = this._addon.onGridBeforeResize;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onGridBeforeResizeHandler>>).subscribe(onGridBeforeResizeHandler, (_e, args) => {
          this.eventPubSubService.publish('onGridBeforeResize', args);
        });
      }
    }
  }

  /**
   * Return the last resize dimensions used by the service
   * @return {object} last dimensions (height: number, width: number)
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
   * Resize the datagrid to fit the browser height & width.
   * @param {number} delay to wait before resizing, defaults to 0 (in milliseconds)
   * @param {object} newSizes can optionally be passed (height: number, width: number)
   * @param {object} event that triggered the resize, defaults to null
   * @return If the browser supports it, we can return a Promise that would resolve with the new dimensions
   */
  resizeGrid(delay?: number, newSizes?: GridSize, event?: SlickEventData): Promise<GridSize> | null {
    return this._addon?.resizeGrid(delay, newSizes, event);
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
