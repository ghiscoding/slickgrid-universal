import {
  Column,
  ExternalResource,
  FormatterResultObject,
  GridOption,
  PubSubService,
  RowDetailView,
  RowDetailViewOption,
  SlickDataView,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  SlickRowDetailView as UniversalRowDetailView,
  UsabilityOverrideFn,
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class SlickRowDetailView implements ExternalResource, UniversalRowDetailView {
  protected _addonOptions!: RowDetailView;
  protected _dataViewIdProperty = 'id';
  protected _eventHandler: SlickEventHandler;
  protected _expandableOverride: any;
  protected _expandedRows: any[] = [];
  protected _grid!: SlickGrid;
  protected _gridRowBuffer = 0;
  protected _gridUid = '';
  protected _keyPrefix = '';
  protected _lastRange: any = null;
  protected _outsideRange = 5;
  protected _pubSubService: PubSubService | null = null;
  protected _rowIdsOutOfViewport: Array<number | string> = [];
  protected _visibleRenderedCellCount = 0;
  protected _defaults = {
    columnId: '_detail_selector',
    cssClass: 'detailView-toggle',
    expandedClass: null,
    collapsedClass: null,
    keyPrefix: '_',
    loadOnce: false,
    collapseAllOnSort: true,
    saveDetailViewOnScroll: true,
    singleRowExpand: false,
    useSimpleViewportCalc: false,
    alwaysRenderColumn: true,
    toolTip: '',
    width: 30,
    maxRows: null
  } as unknown as RowDetailView;

  pluginName: 'RowDetailView' = 'RowDetailView';

  /** Fired when the async response finished */
  onAsyncEndUpdate = new Slick.Event();

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse = new Slick.Event();

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle = new Slick.Event();

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle = new Slick.Event();

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange = new Slick.Event();

  /** Fired after a row becomes out of viewport range (when user can't see the row anymore) */
  onRowOutOfViewportRange = new Slick.Event();

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor() {
    this._eventHandler = new Slick.EventHandler();
  }

  get addonOptions() {
    return this._addonOptions;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this._grid?.getData() || {} as SlickDataView;
  }

  get eventHandler() {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() || {};
  }

  protected gridUid() {
    return this._gridUid || (this._grid?.getUID() || '');
  }

  /**
   * Initialize the Export Service
   * @param _grid
   * @param _containerService
   */
  init(grid: SlickGrid) {
    this._grid = grid;
    if (!grid) {
      throw new Error('RowDetailView Plugin requires the Grid instance to be passed as argument to the "init()" method');
    }
    this._grid = grid;
    this._gridUid = grid.getUID();
    this._addonOptions = (this.gridOptions.rowDetailView || {}) as RowDetailView;
    this._keyPrefix = this._addonOptions?.keyPrefix || '_';

    // Update the minRowBuffer so that the view doesn't disappear when it's at top of screen + the original default 3
    this._gridRowBuffer = this._grid.getOptions().minRowBuffer || 0;
    this._grid.getOptions().minRowBuffer = this._addonOptions.panelRows + 3;

    this._eventHandler
      .subscribe(this._grid.onClick, this.handleClick.bind(this))
      .subscribe(this._grid.onScroll, this.handleScroll.bind(this));

    // Sort will, by default, Collapse all of the open items (unless user implements his own onSort which deals with open row and padding)
    if (this._addonOptions.collapseAllOnSort) {
      this._eventHandler.subscribe(this._grid.onSort, this.collapseAll);
      this._expandedRows = [];
      this._rowIdsOutOfViewport = [];
    }

    this._eventHandler.subscribe(this.dataView.onRowCountChanged, () => {
      this._grid.updateRowCount();
      this._grid.render();
    });

    this._eventHandler.subscribe(this.dataView.onRowsChanged, (_e: SlickEventData, args: any) => {
      this._grid.invalidateRows(args.rows);
      this._grid.render();
    });

    // subscribe to the onAsyncResponse so that the plugin knows when the user server side calls finished
    this.subscribeToOnAsyncResponse();

    // after data is set, let's get the DataView Id Property name used (defaults to "id")
    this._eventHandler.subscribe(this.dataView.onSetItemsCalled, () => {
      this._dataViewIdProperty = this.dataView?.getIdPropertyName() || 'id';
    });

    // if we use the alternative & simpler calculation of the out of viewport range
    // we will need to know how many rows are rendered on the screen and we need to wait for grid to be rendered
    // unfortunately there is no triggered event for knowing when grid is finished, so we use 250ms delay and it's typically more than enough
    if (this._addonOptions.useSimpleViewportCalc) {
      this._eventHandler.subscribe(this._grid.onRendered, (_e: SlickEventData, args: any) => {
        if (args?.endRow) {
          this._visibleRenderedCellCount = args.endRow - args.startRow;
        }
      });
    }
  }

  /** @deprecated use `dispose` Destroy the Slick Row Detail View */
  destroy() {
    this.dispose();
  }

  /** Dispose of the Slick Row Detail View */
  dispose() {
    this._eventHandler?.unsubscribeAll();
  }

  create(columnDefinitions: Column[], gridOptions: GridOption): UniversalRowDetailView | null {
    if (!gridOptions.rowDetailView) {
      throw new Error('[Slickgrid-Universal] The Row Detail View requires options to be passed via the "rowDetailView" property of the Grid Options');
    }

    this._addonOptions = { ...this._defaults, ...gridOptions.rowDetailView } as RowDetailView;

    // user could override the expandable icon logic from within the options or after instantiating the plugin
    if (typeof this._addonOptions.expandableOverride === 'function') {
      this.expandableOverride(this._addonOptions.expandableOverride);
    }

    if (Array.isArray(columnDefinitions) && gridOptions) {
      const newRowDetailViewColumn: Column = this.getColumnDefinition();
      const rowDetailColDef = Array.isArray(columnDefinitions) && columnDefinitions.find(col => col?.behavior === 'selectAndMove');
      const finalRowDetailViewColumn = rowDetailColDef ? rowDetailColDef : newRowDetailViewColumn;

      // column index position in the grid
      const columnPosition = gridOptions?.rowDetailView?.columnIndexPosition ?? 0;
      if (columnPosition > 0) {
        columnDefinitions.splice(columnPosition, 0, finalRowDetailViewColumn);
      } else {
        columnDefinitions.unshift(finalRowDetailViewColumn);
      }
    }
    return this as unknown as UniversalRowDetailView;
  }

  /** Get current plugin options */
  getOptions(): RowDetailViewOption {
    return this._addonOptions;
  }

  /** set or change some of the plugin options */
  setOptions(options: RowDetailViewOption) {
    this._addonOptions = { ... this._addonOptions, ...options };
    if (this._addonOptions?.singleRowExpand) {
      this.collapseAll();
    }
  }

  /** Collapse all of the open items */
  collapseAll() {
    this.dataView.beginUpdate();
    for (let i = this._expandedRows.length - 1; i >= 0; i--) {
      this.collapseDetailView(this._expandedRows[i], true);
    }
    this.dataView.endUpdate();
  }

  /** Colapse an Item so it is not longer seen */
  collapseDetailView(item: any, isMultipleCollapsing = false) {
    if (!isMultipleCollapsing) {
      this.dataView.beginUpdate();
    }
    // Save the details on the collapse assuming onetime loading
    if (this._addonOptions.loadOnce) {
      this.saveDetailView(item);
    }

    item[this._keyPrefix + 'collapsed'] = true;
    for (let idx = 1; idx <= item[this._keyPrefix + 'sizePadding']; idx++) {
      this.dataView.deleteItem(item[this._dataViewIdProperty] + '.' + idx);
    }
    item[this._keyPrefix + 'sizePadding'] = 0;
    this.dataView.updateItem(item[this._dataViewIdProperty], item);

    // Remove the item from the expandedRows
    this._expandedRows = this._expandedRows.filter((r) => {
      return r[this._dataViewIdProperty] !== item[this._dataViewIdProperty];
    });

    if (!isMultipleCollapsing) {
      this.dataView.endUpdate();
    }
  }

  /** Expand a row given the dataview item that is to be expanded */
  expandDetailView(item: any) {
    if (this._addonOptions?.singleRowExpand) {
      this.collapseAll();
    }

    item[this._keyPrefix + 'collapsed'] = false;
    this._expandedRows.push(item);

    // In the case something went wrong loading it the first time such a scroll of screen before loaded
    if (!item[this._keyPrefix + 'detailContent']) {
      item[this._keyPrefix + 'detailViewLoaded'] = false;
    }

    // display pre-loading template
    if (!item[this._keyPrefix + 'detailViewLoaded'] || this._addonOptions.loadOnce !== true) {
      item[this._keyPrefix + 'detailContent'] = this._addonOptions.preTemplate!(item);
    } else {
      this.onAsyncResponse.notify({
        item,
        itemDetail: item,
        detailView: item[this._keyPrefix + 'detailContent']
      });
      this.applyTemplateNewLineHeight(item);
      this.dataView.updateItem(item[this._dataViewIdProperty], item);

      return;
    }

    this.applyTemplateNewLineHeight(item);
    this.dataView.updateItem(item[this._dataViewIdProperty], item);

    // async server call
    this._addonOptions.process(item);
  }

  /** Saves the current state of the detail view */
  saveDetailView(item: any) {
    const view = document.querySelector('.' + this._gridUid + ' .innerDetailView_' + item[this._dataViewIdProperty]);
    if (view) {
      const html = view.innerHTML;
      if (html !== undefined) {
        item[this._keyPrefix + 'detailContent'] = html;
      }
    }
  }

  /**
     * subscribe to the onAsyncResponse so that the plugin knows when the user server side calls finished
     * the response has to be as "args.item" (or "args.itemDetail") with it's data back
     */
  subscribeToOnAsyncResponse() {
    this._eventHandler.subscribe(this.onAsyncResponse, (_e: Event, args: any) => {
      if (!args || (!args.item && !args.itemDetail)) {
        throw new Error('Slick.RowDetailView plugin requires the onAsyncResponse() to supply "args.item" property.');
      }

      // we accept item/itemDetail, just get the one which has data
      const itemDetail = args.item || args.itemDetail;

      // If we just want to load in a view directly we can use detailView property to do so
      if (args.detailView) {
        itemDetail[this._keyPrefix + 'detailContent'] = args.detailView;
      } else {
        itemDetail[this._keyPrefix + 'detailContent'] = this._addonOptions.postTemplate!(itemDetail);
      }

      itemDetail[this._keyPrefix + 'detailViewLoaded'] = true;
      this.dataView.updateItem(itemDetail[this._dataViewIdProperty], itemDetail);

      // trigger an event once the post template is finished loading
      this.onAsyncEndUpdate.notify({
        grid: this._grid,
        item: itemDetail,
        itemDetail,
      });
    });
  }

  /** When row is getting toggled, we will handle the action of collapsing/expanding */
  protected handleAccordionShowHide(item: any) {
    if (item) {
      if (!item[this._keyPrefix + 'collapsed']) {
        this.collapseDetailView(item);
      } else {
        this.expandDetailView(item);
      }
    }
  }

  /**
   * TODO interface only has a GETTER not a SETTER..why?
   * Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable)
   * Method that user can pass to override the default behavior or making every row an expandable row.
   * In order word, user can choose which rows to be an available row detail (or not) by providing his own logic.
   * @param overrideFn: override function callback
   */
  expandableOverride(overrideFn: UsabilityOverrideFn) {
    this._expandableOverride = overrideFn;
  }

  getExpandableOverride(): UsabilityOverrideFn {
    return this._expandableOverride;
  }

  /** Get the Column Definition of the first column dedicated to toggling the Row Detail View */
  getColumnDefinition(): Column {
    return {
      id: (this._addonOptions as any).columnId,
      field: 'sel',
      name: '',
      alwaysRenderColumn: (this._addonOptions as any).alwaysRenderColumn,
      cssClass: this._addonOptions.cssClass,
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      formatter: this.detailSelectionFormatter.bind(this),
      resizable: false,
      sortable: false,
      toolTip: (this._addonOptions as any).toolTip,
      width: (this._addonOptions as any).width,
    };
  }

  /** return the currently expanded rows */
  getExpandedRows(): Array<number | string> {
    return this._expandedRows;
  }

  /** Takes in the item we are filtering and if it is an expanded row returns it's parents row to filter on */
  getFilterItem(item: any) {
    if (item[this._keyPrefix + 'isPadding'] && item[this._keyPrefix + 'parent']) {
      item = item[this._keyPrefix + 'parent'];
    }
    return item;
  }

  /** Resize the Row Detail View */
  resizeDetailView(item: any) {
    if (!item) {
      return;
    }

    // Grad each of the DOM elements
    const mainContainer = document.querySelector('.' + this._gridUid + ' .detailViewContainer_' + item[this._dataViewIdProperty]) as HTMLDivElement;
    const cellItem = document.querySelector('.' + this._gridUid + ' .cellDetailView_' + item[this._dataViewIdProperty]) as HTMLDivElement;
    const inner = document.querySelector('.' + this._gridUid + ' .innerDetailView_' + item[this._dataViewIdProperty]) as HTMLDivElement;

    if (!mainContainer || !cellItem || !inner) {
      return;
    }

    for (let idx = 1; idx <= item[this._keyPrefix + 'sizePadding']; idx++) {
      this.dataView.deleteItem(item[this._dataViewIdProperty] + '.' + idx);
    }

    const rowHeight = this.gridOptions.rowHeight as number; // height of a row
    const lineHeight = 13; // we know cuz we wrote the custom css innit ;)

    // remove the height so we can calculate the height
    mainContainer.style.minHeight = '';

    // Get the scroll height for the main container so we know the actual size of the view
    const itemHeight = mainContainer.scrollHeight;

    // Now work out how many rows
    const rowCount = Math.ceil(itemHeight / rowHeight);

    item[this._keyPrefix + 'sizePadding'] = Math.ceil(((rowCount * 2) * lineHeight) / rowHeight);
    item[this._keyPrefix + 'height'] = itemHeight;

    let outterHeight = (item[this._keyPrefix + 'sizePadding'] * rowHeight);
    if ((this._addonOptions as any).maxRows !== null && item[this._keyPrefix + 'sizePadding'] > (this._addonOptions as any).maxRows) {
      outterHeight = (this._addonOptions as any).maxRows * rowHeight;
      item[this._keyPrefix + 'sizePadding'] = (this._addonOptions as any).maxRows;
    }

    // If the padding is now more than the original minRowBuff we need to increase it
    if (this.gridOptions.minRowBuffer! < item[this._keyPrefix + 'sizePadding']) {
      // Update the minRowBuffer so that the view doesn't disappear when it's at top of screen + the original default 3
      this.gridOptions.minRowBuffer = item[this._keyPrefix + 'sizePadding'] + 3;
    }

    mainContainer.setAttribute('style', 'min-height: ' + item[this._keyPrefix + 'height'] + 'px');
    if (cellItem) {
      cellItem.setAttribute('style', 'height: ' + outterHeight + 'px; top:' + rowHeight + 'px');
    }

    const idxParent = this.dataView.getIdxById(item[this._dataViewIdProperty]) as number;
    for (let idx = 1; idx <= item[this._keyPrefix + 'sizePadding']; idx++) {
      this.dataView.insertItem(idxParent + idx, this.getPaddingItem(item, idx));
    }

    // Lastly save the updated state
    this.saveDetailView(item);
  }

  /**
   * create the detail ctr node. this belongs to the dev & can be custom-styled as per
   */
  protected applyTemplateNewLineHeight(item: any) {
    // the height is calculated by the template row count (how many line of items does the template view have)
    const rowCount = this._addonOptions.panelRows;

    // calculate padding requirements based on detail-content..
    // ie. worst-case: create an invisible dom node now & find it's height.
    const lineHeight = 13; // we know cuz we wrote the custom css init ;)
    item[this._keyPrefix + 'sizePadding'] = Math.ceil(((rowCount * 2) * lineHeight) / this.gridOptions.rowHeight!);
    item[this._keyPrefix + 'height'] = (item[this._keyPrefix + 'sizePadding'] * this.gridOptions.rowHeight!);
    const idxParent = this.dataView.getIdxById(item[this._dataViewIdProperty]);
    for (let idx = 1; idx <= item[this._keyPrefix + 'sizePadding']; idx++) {
      this.dataView.insertItem((idxParent || 0) + idx, this.getPaddingItem(item, idx));
    }
  }

  /** Find a value in an array and return the index when (or -1 when not found) */
  protected arrayFindIndex(sourceArray: any[], value: any) {
    if (sourceArray) {
      for (let i = 0; i < sourceArray.length; i++) {
        if (sourceArray[i] === value) {
          return i;
        }
      }
    }
    return -1;
  }

  protected calculateOutOfRangeViews() {
    if (this._grid) {
      let scrollDir: any;
      const renderedRange = this._grid.getRenderedRange();
      // Only check if we have expanded rows
      if (this._expandedRows.length > 0) {
        // Assume scroll direction is down by default.
        scrollDir = 'DOWN';
        if (this._lastRange) {
          // Some scrolling isn't anything as the range is the same
          if (this._lastRange.top === renderedRange.top && this._lastRange.bottom === renderedRange.bottom) {
            return;
          }

          // If our new top is smaller we are scrolling up
          if (this._lastRange.top > renderedRange.top ||
            // Or we are at very top but our bottom is increasing
            (this._lastRange.top === 0 && renderedRange.top === 0) && this._lastRange.bottom > renderedRange.bottom) {
            scrollDir = 'UP';
          }
        }
      }

      this._expandedRows.forEach((row) => {
        const rowIndex = this.dataView.getRowById(row[this._dataViewIdProperty]) as number;
        const rowPadding = row[`${this._keyPrefix}sizePadding`];
        const rowOutOfRange = this.arrayFindIndex(this._rowIdsOutOfViewport, row[this._dataViewIdProperty]) >= 0;

        if (scrollDir === 'UP') {
          // save the view when asked
          if (this._addonOptions.saveDetailViewOnScroll) {
            // If the bottom item within buffer range is an expanded row save it.
            if (rowIndex >= renderedRange.bottom - this._gridRowBuffer) {
              this.saveDetailView(row);
            }
          }

          // If the row expanded area is within the buffer notify that it is back in range
          if (rowOutOfRange && rowIndex - this._outsideRange < renderedRange.top && rowIndex >= renderedRange.top) {
            this.notifyBackToViewportWhenDomExist(row, row[this._dataViewIdProperty]);
          } else if (!rowOutOfRange && (rowIndex + rowPadding) > renderedRange.bottom) {
            // if our first expanded row is about to go off the bottom
            this.notifyOutOfViewport(row, row[this._dataViewIdProperty]);
          }
        } else if (scrollDir === 'DOWN') {
          // save the view when asked
          if (this._addonOptions.saveDetailViewOnScroll) {
            // If the top item within buffer range is an expanded row save it.
            if (rowIndex <= renderedRange.top + this._gridRowBuffer) {
              this.saveDetailView(row);
            }
          }

          // If row index is i higher than bottom with some added value (To ignore top rows off view) and is with view and was our of range
          if (rowOutOfRange && (rowIndex + rowPadding + this._outsideRange) > renderedRange.bottom && rowIndex < rowIndex + rowPadding) {
            this.notifyBackToViewportWhenDomExist(row, row[this._dataViewIdProperty]);
          } else if (!rowOutOfRange && rowIndex < renderedRange.top) {
            // if our row is outside top of and the buffering zone but not in the array of outOfVisable range notify it
            this.notifyOutOfViewport(row, row[this._dataViewIdProperty]);
          }
        }
      });
      this._lastRange = renderedRange;
    }
  }

  protected calculateOutOfRangeViewsSimplerVersion() {
    if (this._grid) {
      const renderedRange = this._grid.getRenderedRange();

      this._expandedRows.forEach((row) => {
        const rowIndex = this.dataView.getRowById(row[this._dataViewIdProperty]) as number;
        const isOutOfVisibility = this.checkIsRowOutOfViewportRange(rowIndex, renderedRange);
        if (!isOutOfVisibility && this.arrayFindIndex(this._rowIdsOutOfViewport, row[this._dataViewIdProperty]) >= 0) {
          this.notifyBackToViewportWhenDomExist(row, row[this._dataViewIdProperty]);
        } else if (isOutOfVisibility) {
          this.notifyOutOfViewport(row, row[this._dataViewIdProperty]);
        }
      });
    }
  }

  protected checkExpandableOverride(row: number, dataContext: any, grid: SlickGrid) {
    if (typeof this._expandableOverride === 'function') {
      return this._expandableOverride(row, dataContext, grid);
    }
    return true;
  }

  protected checkIsRowOutOfViewportRange(rowIndex: number, renderedRange: any) {
    if (Math.abs(renderedRange.bottom - this._gridRowBuffer - rowIndex) > this._visibleRenderedCellCount * 2) {
      return true;
    }
    return false;
  }

  /** Get the Row Detail padding (which are the rows dedicated to the detail panel) */
  protected getPaddingItem(parent: any, offset: any) {
    const item: any = {};

    for (const prop in this.dataView) {
      if (prop) {
        item[prop] = null;
      }
    }
    item[this._dataViewIdProperty] = parent[this._dataViewIdProperty] + '.' + offset;

    // additional hidden padding metadata fields
    item[this._keyPrefix + 'collapsed'] = true;
    item[this._keyPrefix + 'isPadding'] = true;
    item[this._keyPrefix + 'parent'] = parent;
    item[this._keyPrefix + 'offset'] = offset;

    return item;
  }

  /** The Formatter of the toggling icon of the Row Detail */
  protected detailSelectionFormatter(row: number, cell: number, value: any, columnDef: Column, dataContext: any, grid: SlickGrid): FormatterResultObject | string {
    if (!this.checkExpandableOverride(row, dataContext, grid)) {
      return '';
    } else {
      if (dataContext[this._keyPrefix + 'collapsed'] === undefined) {
        dataContext[this._keyPrefix + 'collapsed'] = true;
        dataContext[this._keyPrefix + 'sizePadding'] = 0;     // the required number of pading rows
        dataContext[this._keyPrefix + 'height'] = 0;     // the actual height in pixels of the detail field
        dataContext[this._keyPrefix + 'isPadding'] = false;
        dataContext[this._keyPrefix + 'parent'] = undefined;
        dataContext[this._keyPrefix + 'offset'] = 0;
      }

      if (dataContext[this._keyPrefix + 'isPadding']) {
        // render nothing
      } else if (dataContext[this._keyPrefix + 'collapsed']) {
        let collapsedClasses = this._addonOptions.cssClass + ' expand ';
        if (this._addonOptions.collapsedClass) {
          collapsedClasses += this._addonOptions.collapsedClass;
        }
        return '<div class="' + collapsedClasses + '"></div>';
      } else {
        const html = [];
        const rowHeight = this.gridOptions.rowHeight;
        let outterHeight = dataContext[this._keyPrefix + 'sizePadding'] * this.gridOptions.rowHeight!;

        if ((this._addonOptions as any).maxRows !== null && dataContext[this._keyPrefix + 'sizePadding'] > (this._addonOptions as any).maxRows) {
          outterHeight = (this._addonOptions as any).maxRows * rowHeight!;
          dataContext[this._keyPrefix + 'sizePadding'] = (this._addonOptions as any).maxRows;
        }

        // V313HAX:
        // putting in an extra closing div after the closing toggle div and ommiting a
        // final closing div for the detail ctr div causes the slickgrid renderer to
        // insert our detail div as a new column ;) ~since it wraps whatever we provide
        // in a generic div column container. so our detail becomes a child directly of
        // the row not the cell. nice =)  ~no need to apply a css change to the parent
        // slick-cell to escape the cell overflow clipping.

        // sneaky extra </div> inserted here-----------------v
        let expandedClasses = this._addonOptions.cssClass + ' collapse ';
        if (this._addonOptions.expandedClass) {
          expandedClasses += this._addonOptions.expandedClass;
        }
        html.push('<div class="' + expandedClasses + '"></div></div>');
        html.push('<div class="dynamic-cell-detail cellDetailView_', dataContext[this._dataViewIdProperty], '" ');   // apply custom css to detail
        html.push('style="height:', outterHeight, 'px;'); // set total height of padding
        html.push('top:', rowHeight, 'px">');             // shift detail below 1st row
        html.push('<div class="detail-container detailViewContainer_', dataContext[this._dataViewIdProperty], '">'); // sub ctr for custom styling
        html.push('<div class="innerDetailView_', dataContext[this._dataViewIdProperty], '">', dataContext[this._keyPrefix + 'detailContent'], '</div></div>');
        // omit a final closing detail container </div> that would come next

        return html.join('');
      }
    }
    return '';
  }

  /** Handle mouse click event */
  protected handleClick(e: any, args: any) {
    const dataContext = this._grid.getDataItem(args.row);
    if (!this.checkExpandableOverride(args.row, dataContext, this._grid)) {
      return;
    }

    // clicking on a row select checkbox
    if (this._addonOptions.useRowClick || this._grid.getColumns()[args.cell]['id'] === (this._addonOptions as any).columnId && e.target.classList.contains(this._addonOptions.cssClass)) {
      // if editing, try to commit
      if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // trigger an event before toggling
      this.onBeforeRowDetailToggle.notify({
        'grid': this._grid,
        'item': dataContext
      });

      this.toggleRowSelection(args.row, dataContext);

      // trigger an event after toggling
      this.onAfterRowDetailToggle.notify({
        grid: this._grid,
        item: dataContext,
        expandedRows: this._expandedRows,
      });

      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }

  protected handleScroll() {
    if (this._addonOptions.useSimpleViewportCalc) {
      this.calculateOutOfRangeViewsSimplerVersion();
    } else {
      this.calculateOutOfRangeViews();
    }
  }

  protected notifyOutOfViewport(item: any, rowId: any) {
    const rowIndex = item.rowIndex || this.dataView.getRowById(item[this._dataViewIdProperty]);

    this.onRowOutOfViewportRange.notify({
      grid: this._grid,
      item,
      rowId,
      rowIndex,
      expandedRows: this._expandedRows,
      rowIdsOutOfViewport: this.syncOutOfViewportArray(rowId, true)
    });
  }

  protected notifyBackToViewportWhenDomExist(item: any, rowId: any) {
    const rowIndex = item.rowIndex || this.dataView.getRowById(item[this._dataViewIdProperty]);

    setTimeout(() => {
      // make sure View Row DOM Element really exist before notifying that it's a row that is visible again
      if (document.querySelector('.cellDetailView_' + item[this._dataViewIdProperty])) {
        this.onRowBackToViewportRange.notify({
          grid: this._grid,
          item,
          rowId,
          rowIndex,
          expandedRows: this._expandedRows,
          rowIdsOutOfViewport: this.syncOutOfViewportArray(rowId, false)
        });
      }
    }, 100);
  }

  protected syncOutOfViewportArray(rowId: any, isAdding: boolean) {
    const arrayRowIndex = this.arrayFindIndex(this._rowIdsOutOfViewport, rowId);

    if (isAdding && arrayRowIndex < 0) {
      this._rowIdsOutOfViewport.push(rowId);
    } else if (!isAdding && arrayRowIndex >= 0) {
      this._rowIdsOutOfViewport.splice(arrayRowIndex, 1);
    }
    return this._rowIdsOutOfViewport;
  }

  protected toggleRowSelection(rowNumber: number, dataContext: any) {
    if (!this.checkExpandableOverride(rowNumber, dataContext, this._grid)) {
      return;
    }

    this.dataView.beginUpdate();
    this.handleAccordionShowHide(dataContext);
    this.dataView.endUpdate();
  }


}
