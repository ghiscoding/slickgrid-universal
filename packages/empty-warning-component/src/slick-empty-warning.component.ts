import {
  applyHtmlToElement,
  classNameToList,
  emptyElement,
  type ContainerService,
  type EmptyWarning,
  type ExternalResource,
  type GridOption,
  type SlickGrid,
  type TranslaterService,
} from '@slickgrid-universal/common';

export class SlickEmptyWarningComponent implements ExternalResource {
  readonly pluginName = 'EmptyWarningComponent';
  protected _grid!: SlickGrid;
  protected _isPreviouslyShown = false;
  protected _translaterService?: TranslaterService | null;
  protected _warningLeftElement: HTMLDivElement | null = null;
  protected _warningRightElement: HTMLDivElement | null = null;

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._translaterService = containerService.get<TranslaterService>('TranslaterService');
  }

  dispose(): void {
    emptyElement(this._warningLeftElement);
    emptyElement(this._warningRightElement);
    this._warningLeftElement?.remove();
    this._warningRightElement?.remove();
  }

  /**
   * Display a warning of empty data when the filtered dataset is empty
   * NOTE: to make this code reusable, you could (should) move this code into a utility service
   * @param isShowing - are we showing the message?
   * @param options - any styling options you'd like to pass like the text color
   */
  showEmptyDataMessage(isShowing = true, options?: EmptyWarning): boolean {
    if (!this._grid || !this.gridOptions || this._isPreviouslyShown === isShowing) {
      return false;
    }

    // keep reference so that we won't re-render the warning if the status is the same
    this._isPreviouslyShown = isShowing;

    const gridUid = this._grid.getUID();
    const defaultMessage = 'No data to display.';
    const mergedOptions: EmptyWarning = { message: defaultMessage, ...this.gridOptions.emptyDataWarning, ...options };
    const emptyDataClassName = mergedOptions?.className ?? 'slick-empty-data-warning';
    this._warningLeftElement = document.querySelector<HTMLDivElement>(`.${gridUid} .${emptyDataClassName}`);
    const gridCanvasLeftElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-left`);
    const gridCanvasRightElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-right`);
    // The pinning renderer uses one live canvas. Keep the legacy left/right
    // lookup for split-pane grids, but fall back to that single canvas when no
    // right pane exists.
    const gridCanvasElm = gridCanvasLeftElm || document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas`);
    const leftElementMarginLeft = mergedOptions.leftViewportMarginLeft ?? 0;
    const rightElementMarginLeft = mergedOptions.rightViewportMarginLeft ?? 0;
    const leftElementPinnedMarginLeft = mergedOptions.pinnedLeftViewportMarginLeft ?? 0;
    const rightElementPinnedMarginLeft = mergedOptions.pinnedRightViewportMarginLeft ?? 0;
    const isPinnedGrid = this.gridOptions?.pinning?.columns !== undefined;
    const leftViewportMarginLeft = typeof leftElementMarginLeft === 'string' ? leftElementMarginLeft : `${leftElementMarginLeft}px`;
    const rightViewportMarginLeft = typeof rightElementMarginLeft === 'string' ? rightElementMarginLeft : `${rightElementMarginLeft}px`;

    // when dealing with a grid that has "autoHeight" option, we need to override 2 height that get miscalculated
    // that is because it is not aware that we are adding this slick empty element in this grid DOM
    if (this.gridOptions.autoHeight) {
      const contentRootElm = document.querySelector<HTMLDivElement>(`.${gridUid} .slick-content-root`);
      if (contentRootElm && contentRootElm.style && gridCanvasElm && gridCanvasElm.style) {
        const contentRootHeight = parseInt(contentRootElm.style.height, 10) || 0; // this field auto calc by row height

        // get row height of each feature when enabled (rowHeight will always be defined because that is the cell height)
        const cellRowHeight = this.gridOptions?.rowHeight ?? 0;
        const filterRowHeight = this.gridOptions.enableFiltering ? (this.gridOptions?.headerRowHeight ?? 0) : 0;
        const preHeaderRowHeight = this.gridOptions.createPreHeaderPanel ? (this.gridOptions?.preHeaderPanelHeight ?? 0) : 0;

        if (isShowing) {
          // use when height with rows more that 100px
          // AutoHeight option collapse dataview to 100px when show message without data in huge grid
          // (default autoHeight for message - 100px you can add as param if needed)
          let contentRootMinHeight = contentRootHeight !== null && contentRootHeight < 100 ? contentRootHeight : 100;
          contentRootMinHeight += filterRowHeight + preHeaderRowHeight; // add preHeader & filter height when enabled
          contentRootElm.style.minHeight = `${contentRootMinHeight}px`;
          gridCanvasElm.style.minHeight = `${cellRowHeight}px`;
        }
      }
    }

    // warning message could come from a translation key or by the warning options
    let warningMessage = mergedOptions.message;
    if (this.gridOptions.enableTranslate && this._translaterService && mergedOptions?.messageKey) {
      warningMessage = this._translaterService.translate(mergedOptions.messageKey);
    }

    if (!this._warningLeftElement && gridCanvasElm) {
      this._warningLeftElement = document.createElement('div');
      this._warningLeftElement.classList.add(...classNameToList(emptyDataClassName), 'left');
      applyHtmlToElement(this._warningLeftElement, warningMessage, this.gridOptions);

      // Split-pane grids receive a clone in the right canvas. Single-canvas
      // pinning grids only need the one warning element.
      if (gridCanvasRightElm && gridCanvasRightElm !== gridCanvasElm) {
        this._warningRightElement = this._warningLeftElement.cloneNode(true) as HTMLDivElement;
        this._warningRightElement.classList.add('right');
        gridCanvasRightElm.appendChild(this._warningRightElement);
      }
      gridCanvasElm.appendChild(this._warningLeftElement);
    }

    // if we did find the Slick-Empty-Warning element then display it with the configured margin offsets
    if (this._warningLeftElement) {
      this._warningLeftElement.style.display = isShowing ? 'flex' : 'none';

      const leftPinnedMarginLeft =
        typeof leftElementPinnedMarginLeft === 'string' ? leftElementPinnedMarginLeft : `${leftElementPinnedMarginLeft}px`;
      this._warningLeftElement.style.marginLeft = isPinnedGrid ? leftPinnedMarginLeft : leftViewportMarginLeft;
    }

    if (this._warningRightElement) {
      this._warningRightElement.style.display = isShowing ? 'flex' : 'none';

      const rightPinnedMarginLeft =
        typeof rightElementPinnedMarginLeft === 'string' ? rightElementPinnedMarginLeft : `${rightElementPinnedMarginLeft}px`;
      this._warningRightElement.style.marginLeft = isPinnedGrid ? rightPinnedMarginLeft : rightViewportMarginLeft;
    }

    return isShowing;
  }
}
