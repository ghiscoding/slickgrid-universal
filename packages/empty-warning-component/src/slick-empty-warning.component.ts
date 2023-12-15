import type {
  ContainerService,
  EmptyWarning,
  ExternalResource,
  GridOption,
  SlickGrid,
  TranslaterService
} from '@slickgrid-universal/common';

export class SlickEmptyWarningComponent implements ExternalResource {
  protected _warningLeftElement: HTMLDivElement | null = null;
  protected _warningRightElement: HTMLDivElement | null = null;
  protected grid!: SlickGrid;
  protected isPreviouslyShown = false;
  protected translaterService?: TranslaterService | null;


  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this.grid?.getOptions() ?? {};
  }

  constructor() { }

  init(grid: SlickGrid, containerService: ContainerService) {
    this.grid = grid;
    this.translaterService = containerService.get<TranslaterService>('TranslaterService');
  }

  dispose() {
    this._warningLeftElement?.remove();
    this._warningRightElement?.remove();
    this._warningLeftElement = null;
    this._warningRightElement = null;
  }

  /**
   * Display a warning of empty data when the filtered dataset is empty
   * NOTE: to make this code reusable, you could (should) move this code into a utility service
   * @param isShowing - are we showing the message?
   * @param options - any styling options you'd like to pass like the text color
   */
  showEmptyDataMessage(isShowing = true, options?: EmptyWarning): boolean {
    if (!this.grid || !this.gridOptions || this.isPreviouslyShown === isShowing) {
      return false;
    }

    // keep reference so that we won't re-render the warning if the status is the same
    this.isPreviouslyShown = isShowing;

    const gridUid = this.grid.getUID();
    const defaultMessage = 'No data to display.';
    const mergedOptions: EmptyWarning = { message: defaultMessage, ...this.gridOptions.emptyDataWarning, ...options };
    const emptyDataClassName = mergedOptions?.className ?? 'slick-empty-data-warning';
    this._warningLeftElement = document.querySelector<HTMLDivElement>(`.${gridUid} .${emptyDataClassName}`);
    const gridCanvasLeftElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-left`);
    const gridCanvasRightElm = document.querySelector<HTMLDivElement>(`.${gridUid} .grid-canvas.grid-canvas-right`);
    const leftElementMarginLeft = mergedOptions.leftViewportMarginLeft ?? 0;
    const rightElementMarginLeft = mergedOptions.rightViewportMarginLeft ?? 0;
    const leftElementFrozenMarginLeft = mergedOptions.frozenLeftViewportMarginLeft ?? 0;
    const rightElementFrozenMarginLeft = mergedOptions.frozenRightViewportMarginLeft ?? 0;
    const isFrozenGrid = (this.gridOptions?.frozenColumn !== undefined && this.gridOptions.frozenColumn >= 0);
    const leftViewportMarginLeft = typeof leftElementMarginLeft === 'string' ? leftElementMarginLeft : `${leftElementMarginLeft}px`;
    const rightViewportMarginLeft = typeof rightElementMarginLeft === 'string' ? rightElementMarginLeft : `${rightElementMarginLeft}px`;

    // when dealing with a grid that has "autoHeight" option, we need to override 2 height that get miscalculated
    // that is because it is not aware that we are adding this slick empty element in this grid DOM
    if (this.gridOptions.autoHeight) {
      const leftPaneElm = document.querySelector<HTMLDivElement>(`.${gridUid} .slick-pane.slick-pane-top.slick-pane-left`);
      if (leftPaneElm && leftPaneElm.style && gridCanvasLeftElm && gridCanvasLeftElm.style) {
        const leftPaneHeight = parseInt(leftPaneElm.style.height, 10) || 0; // this field auto calc by row height

        // get row height of each feature when enabled (rowHeight will always be defined because that is the cell height)
        const cellRowHeight = this.gridOptions?.rowHeight ?? 0;
        const filterRowHeight = this.gridOptions.enableFiltering ? (this.gridOptions?.headerRowHeight ?? 0) : 0;
        const preHeaderRowHeight = this.gridOptions.createPreHeaderPanel ? (this.gridOptions?.preHeaderPanelHeight ?? 0) : 0;

        if (isShowing) {
          // use when height with rows more that 100px
          // AutoHeight option collapse dataview to 100px when show message without data in huge grid
          // (default autoHeight for message - 100px you can add as param if needed)
          let leftPaneMinHeight = (leftPaneHeight !== null && leftPaneHeight < 100) ? leftPaneHeight : 100;
          leftPaneMinHeight += filterRowHeight + preHeaderRowHeight; // add preHeader & filter height when enabled
          leftPaneElm.style.minHeight = `${leftPaneMinHeight}px`;
          gridCanvasLeftElm.style.minHeight = `${cellRowHeight}px`;
        }
      }
    }

    // warning message could come from a translation key or by the warning options
    let warningMessage = mergedOptions.message;
    if (this.gridOptions.enableTranslate && this.translaterService && mergedOptions?.messageKey) {
      warningMessage = this.translaterService.translate(mergedOptions.messageKey);
    }

    if (!this._warningLeftElement && gridCanvasLeftElm && gridCanvasRightElm) {
      this._warningLeftElement = document.createElement('div');
      this._warningLeftElement.classList.add(emptyDataClassName);
      this._warningLeftElement.classList.add('left');
      this.grid.applyHtmlCode(this._warningLeftElement, warningMessage);

      // clone the warning element and add the "right" class to it so we can distinguish
      this._warningRightElement = this._warningLeftElement.cloneNode(true) as HTMLDivElement;
      this._warningRightElement.classList.add('right');

      // append both warning elements to both left/right canvas
      gridCanvasRightElm.appendChild(this._warningRightElement);
      gridCanvasLeftElm.appendChild(this._warningLeftElement);
    }

    // if we did find the Slick-Empty-Warning element then we'll display/hide at the grid position with some margin offsets (we need to position under the headerRow and filterRow)
    // when using a frozen/pinned grid, we also have extra options to hide left/right message
    if (this._warningLeftElement) {
      // display/hide right/left messages
      let leftDisplay = isShowing ? 'block' : 'none';
      if (isFrozenGrid && isShowing) {
        leftDisplay = (mergedOptions.hideFrozenLeftWarning) ? 'none' : 'block';
      }
      this._warningLeftElement.style.display = leftDisplay;

      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      const leftFrozenMarginLeft = typeof leftElementFrozenMarginLeft === 'string' ? leftElementFrozenMarginLeft : `${leftElementFrozenMarginLeft}px`;
      this._warningLeftElement.style.marginLeft = isFrozenGrid ? leftFrozenMarginLeft : leftViewportMarginLeft;
    }

    if (this._warningRightElement) {
      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      let rightDisplay = isShowing ? 'block' : 'none';
      if (isFrozenGrid && isShowing) {
        rightDisplay = (mergedOptions.hideFrozenRightWarning) ? 'none' : 'block';
      }
      this._warningRightElement.style.display = rightDisplay;

      // use correct left margin (defaults to 40% on regular grid or 10px on frozen grid)
      const rightFrozenMarginLeft = typeof rightElementFrozenMarginLeft === 'string' ? rightElementFrozenMarginLeft : `${rightElementFrozenMarginLeft}px`;
      this._warningRightElement.style.marginLeft = isFrozenGrid ? rightFrozenMarginLeft : rightViewportMarginLeft;
    }

    return isShowing;
  }
}