import { createDomElement, SlickEvent, SlickEventHandler, Utils as SlickUtils } from '@slickgrid-universal/common';
import type {
  Column,
  ExternalResource,
  FormatterResultWithHtml,
  GridOption,
  OnAfterRowDetailToggleArgs,
  OnBeforeRowDetailToggleArgs,
  OnRowBackOrOutOfViewportRangeArgs,
  OnRowDetailAsyncEndUpdateArgs,
  OnRowDetailAsyncResponseArgs,
  PubSubService,
  RowDetailView,
  RowDetailViewOption,
  SlickGrid,
  SlickRowDetailView as UniversalRowDetailView,
  SlickDataView,
  SlickEventData,
  UsabilityOverrideFn,
} from '@slickgrid-universal/common';
import { classNameToList, extend } from '@slickgrid-universal/utils';

/**
 * A plugin to add Row Detail Panel View (for example providing order detail info when clicking on the order row in the grid)
 * Original StackOverflow question & article making this possible (thanks to violet313)
 * https://stackoverflow.com/questions/10535164/can-slickgrids-row-height-be-dynamically-altered#29399927
 * http://violet313.org/slickgrids/#intro
 */
export class SlickRowDetailView implements ExternalResource, UniversalRowDetailView {
  // --
  // public API
  pluginName = 'RowDetailView' as const;

  /** Fired when the async response finished */
  onAsyncEndUpdate: SlickEvent<OnRowDetailAsyncEndUpdateArgs>;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse: SlickEvent<OnRowDetailAsyncResponseArgs>;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle: SlickEvent<OnAfterRowDetailToggleArgs>;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle: SlickEvent<OnBeforeRowDetailToggleArgs>;

  /** Fired just before a row becomes out of viewport range (you can use this event to save inner Grid State before it gets destroyed) */
  onBeforeRowOutOfViewportRange: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;

  /** Fired after a row becomes out of viewport range (when user can't see the row anymore) */
  onRowOutOfViewportRange: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;

  // --
  // protected props
  protected _addonOptions!: RowDetailView;
  protected _dataViewIdProperty = 'id';
  protected _eventHandler: SlickEventHandler;
  protected _expandableOverride: UsabilityOverrideFn | null = null;
  protected _expandedRowIds: Set<number | string> = new Set();
  protected _grid!: SlickGrid;
  protected _gridRowBuffer = 0;
  protected _gridUid = '';
  protected _keyPrefix = '';
  protected _disposedRows: Set<number> = new Set();
  protected _rowIdsOutOfViewport: Set<number | string> = new Set();
  protected _renderedViewportRowIds: Set<number | string> = new Set();
  protected _renderedIds: Set<number | string> = new Set();
  protected _visibleRenderedCell?: { startRow: number; endRow: number };
  protected _backViewportTimer: any;
  protected _defaults = {
    alwaysRenderColumn: true,
    columnId: '_detail_selector',
    field: '_detail_selector',
    cssClass: 'detailView-toggle',
    collapseAllOnSort: true,
    collapsedClass: undefined,
    expandedClass: undefined,
    keyPrefix: '__',
    loadOnce: false,
    maxRows: undefined,
    reorderable: false,
    saveDetailViewOnScroll: true,
    singleRowExpand: false,
    toolTip: '',
    width: 30,
  } as unknown as RowDetailView;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly pubSubService: PubSubService) {
    this._eventHandler = new SlickEventHandler();
    this.onAsyncEndUpdate = new SlickEvent<OnRowDetailAsyncEndUpdateArgs>('onAsyncEndUpdate');
    this.onAsyncResponse = new SlickEvent<OnRowDetailAsyncResponseArgs>('onAsyncResponse');
    this.onAfterRowDetailToggle = new SlickEvent<OnAfterRowDetailToggleArgs>('onAfterRowDetailToggle');
    this.onBeforeRowDetailToggle = new SlickEvent<OnBeforeRowDetailToggleArgs>('onBeforeRowDetailToggle');
    this.onBeforeRowOutOfViewportRange = new SlickEvent<OnRowBackOrOutOfViewportRangeArgs>('onBeforeRowOutOfViewportRange');
    this.onRowBackToViewportRange = new SlickEvent<OnRowBackOrOutOfViewportRangeArgs>('onRowBackToViewportRange');
    this.onRowOutOfViewportRange = new SlickEvent<OnRowBackOrOutOfViewportRangeArgs>('onRowOutOfViewportRange');
  }

  get addonOptions(): RowDetailView {
    return this._addonOptions;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>();
  }

  get dataViewIdProperty(): string {
    return this._dataViewIdProperty;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() || {};
  }

  get gridUid(): string {
    return this._gridUid || this._grid?.getUID() || '';
  }

  set rowIdsOutOfViewport(rowIds: Array<string | number>) {
    this._rowIdsOutOfViewport = new Set(rowIds);
  }

  /**
   * Initialize the Export Service
   * @param _grid
   */
  init(grid: SlickGrid): void {
    if (!grid) {
      throw new Error(
        '[Slickgrid-Universal] RowDetailView Plugin requires the Grid instance to be passed as argument to the "init()" method.'
      );
    }
    this._grid = grid;
    this._gridUid = grid.getUID();
    if (!this._addonOptions) {
      this._addonOptions = extend(true, {}, this._defaults, this.gridOptions.rowDetailView) as RowDetailView;
    }
    this._keyPrefix = this._addonOptions?.keyPrefix || '__';

    // add PubSub instance to all SlickEvent
    SlickUtils.addSlickEventPubSubWhenDefined(this.pubSubService, this);

    // Update the minRowBuffer so that the view doesn't disappear when it's at top of screen + the original default 3
    this._gridRowBuffer = this.gridOptions.minRowBuffer || 0;
    this.gridOptions.minRowBuffer = this._addonOptions.panelRows + 3;

    this._eventHandler
      .subscribe(this._grid.onClick, this.handleClick.bind(this))
      .subscribe(this._grid.onBeforeEditCell, () => this.collapseAll())
      .subscribe(this._grid.onScroll, () => this.recalculateOutOfRangeViews(true, 0))
      .subscribe(this._grid.onBeforeRemoveCachedRow, (_e, args) => this.handleRemoveRow(args.row));

    // Sort will, by default, Collapse all of the open items (unless user implements his own onSort which deals with open row and padding)
    if (this._addonOptions.collapseAllOnSort) {
      // sort event can be triggered by column header click or from header menu
      this.pubSubService.subscribe('onSortChanged', () => this.collapseAll());
    }

    this._eventHandler.subscribe(this.dataView.onRowCountChanged, () => {
      this._grid.updateRowCount();
      this._grid.render();
    });

    this._eventHandler.subscribe(this.dataView.onRowsChanged, (_e, args) => {
      const cachedRows = Object.keys(this._grid.getRowCache()).map(Number);
      const toInvalidateRows: number[] = [];
      const intersectedRows = args.rows.filter((nb) => cachedRows.includes(nb));

      // only consider rows to invalidate as rows that exists in the viewport (cached rows)
      this._expandedRowIds.forEach((itemId) => {
        const idx = this.dataView.getRowById(itemId);
        if (idx !== undefined && intersectedRows.includes(idx)) {
          toInvalidateRows.push(idx);
        }
      });

      // don't invalidate row detail that were already rendered and visible
      // for example, if we open row 3 and then row 1, row 3 will be pushed down but it was already rendered so no need to re-render it
      this._renderedIds.forEach((rowId) => {
        const dataRowIdx = this.dataView.getRowById(rowId);
        if (dataRowIdx !== undefined) {
          const invRowIdx = toInvalidateRows.findIndex((r) => r === dataRowIdx);
          if (invRowIdx >= 0) {
            toInvalidateRows.splice(invRowIdx, 1);
          }
        }
      });

      this._grid.invalidateRows(toInvalidateRows);
      this._grid.render();
    });

    // subscribe to the onAsyncResponse so that the plugin knows when the user server side calls finished
    this._eventHandler.subscribe(this.onAsyncResponse, this.handleOnAsyncResponse.bind(this));

    // after data is set, let's get the DataView Id Property name used (defaults to "id")
    this._eventHandler.subscribe(this.dataView.onSetItemsCalled, () => {
      this._dataViewIdProperty = this.dataView?.getIdPropertyName() || 'id';
    });
  }

  /** Dispose of the Slick Row Detail View */
  dispose(): void {
    this._eventHandler?.unsubscribeAll();
    this._expandedRowIds.clear();
    this._rowIdsOutOfViewport.clear();
    this._renderedViewportRowIds.clear();
    clearTimeout(this._backViewportTimer);
  }

  create(columns: Column[], gridOptions: GridOption): UniversalRowDetailView | null {
    if (!gridOptions.rowDetailView) {
      throw new Error(
        '[Slickgrid-Universal] The Row Detail View requires options to be passed via the "rowDetailView" property of the Grid Options'
      );
    }

    this._addonOptions = extend(true, {}, this._defaults, gridOptions.rowDetailView) as RowDetailView;

    // user could override the expandable icon logic from within the options or after instantiating the plugin
    if (typeof this._addonOptions.expandableOverride === 'function') {
      this.expandableOverride(this._addonOptions.expandableOverride);
    }

    if (Array.isArray(columns) && gridOptions) {
      const newRowDetailViewColumn: Column = this.getColumnDefinition();

      // add new row detail column unless it was already added
      if (!columns.some((col) => col.id === newRowDetailViewColumn.id)) {
        const rowDetailColDef = Array.isArray(columns) && columns.find((col) => col?.behavior === 'selectAndMove');
        const finalRowDetailViewColumn = rowDetailColDef ? rowDetailColDef : newRowDetailViewColumn;

        // column index position in the grid
        const columnPosition = gridOptions?.rowDetailView?.columnIndexPosition ?? 0;
        if (columnPosition > 0) {
          columns.splice(columnPosition, 0, finalRowDetailViewColumn);
        } else {
          columns.unshift(finalRowDetailViewColumn);
        }

        this.pubSubService.publish(`onPluginColumnsChanged`, {
          columns,
          pluginName: this.pluginName,
        });
      }
    }
    return this as unknown as UniversalRowDetailView;
  }

  /** Get current plugin options */
  getOptions(): RowDetailViewOption {
    return this._addonOptions;
  }

  /** set or change some of the plugin options */
  setOptions(options: Partial<RowDetailViewOption>): void {
    this._addonOptions = extend(true, {}, this._addonOptions, options) as RowDetailView;
    if (this._addonOptions?.singleRowExpand) {
      this.collapseAll();
    }
  }

  /** Collapse all of the open items */
  collapseAll(): void {
    this.dataView.beginUpdate();
    this._expandedRowIds.forEach((itemId) => {
      this.collapseDetailView(itemId, true);
    });
    this.dataView.endUpdate();
  }

  /** Collapse an Item so it is not longer seen */
  collapseDetailView(itemId: number | string, isMultipleCollapsing = false): void {
    if (!isMultipleCollapsing) {
      this.dataView.beginUpdate();
    }
    const item = this.dataView.getItemById(itemId);
    // Save the details on the collapse assuming onetime loading
    if (this._addonOptions.loadOnce) {
      this.saveDetailView(item);
    }

    item[`${this._keyPrefix}collapsed`] = true;
    for (let idx = 1; idx <= item[`${this._keyPrefix}sizePadding`]; idx++) {
      this.dataView.deleteItem(`${item[this._dataViewIdProperty]}.${idx}`);
    }
    item[`${this._keyPrefix}sizePadding`] = 0;
    this.dataView.updateItem(item[this._dataViewIdProperty], item);

    // Remove the item from the expandedRows & renderedIds
    this._expandedRowIds = new Set(Array.from(this._expandedRowIds).filter((expItemId) => expItemId !== item[this._dataViewIdProperty]));
    this._renderedIds.delete(item[this._dataViewIdProperty]);

    // we need to reevaluate & invalidate any row detail that are shown on top of the row that we're closing
    this.reevaluateRenderedRowIds(item);

    if (!isMultipleCollapsing) {
      this.dataView.endUpdate();
    }
  }

  /** Expand a row given the dataview item that is to be expanded */
  expandDetailView(itemId: number | string): void {
    if (this._addonOptions?.singleRowExpand) {
      this.collapseAll();
    }
    const item = this.dataView.getItemById(itemId);

    // we need to reevaluate & invalidate any row detail that are shown on top of the row that we're closing
    this.reevaluateRenderedRowIds(item);

    item[`${this._keyPrefix}collapsed`] = false;
    this._expandedRowIds.add(itemId);

    // in the case something went wrong loading it the first time such a scroll of screen before loaded
    if (!item[`${this._keyPrefix}detailContent`]) {
      item[`${this._keyPrefix}detailViewLoaded`] = false;
    }

    // display pre-loading template
    if (!item[`${this._keyPrefix}detailViewLoaded`] || this._addonOptions.loadOnce !== true) {
      item[`${this._keyPrefix}detailContent`] = this._addonOptions?.preTemplate?.(item);
    } else {
      this.onAsyncResponse.notify({
        item,
        detailView: item[`${this._keyPrefix}detailContent`],
        grid: this._grid,
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

  /** reset all Set rows/ids cache and start empty (but keep expanded rows ref) */
  resetRenderedRows(): void {
    this._renderedViewportRowIds.clear();
    this._disposedRows.clear();
  }

  /** Saves the current state of the detail view */
  saveDetailView(item: any): void {
    if (this._addonOptions.loadOnce) {
      const view = document.querySelector(`.${this.gridUid} .innerDetailView_${item[this._dataViewIdProperty]}`);
      if (view) {
        const html = view.innerHTML;
        if (html !== undefined) {
          item[`${this._keyPrefix}detailContent`] = html;
        }
      }
    }
  }

  /**
   * subscribe to the onAsyncResponse so that the plugin knows when the user server side calls finished
   * the response has to be as "args.item" with it's data back
   */
  handleOnAsyncResponse(e: SlickEventData, args: { item: any; detailView?: any }): void {
    if (!args || !args.item) {
      console.error('SlickRowDetailView plugin requires the onAsyncResponse() to supply "args.item" property.');
      return;
    }

    // get item detail argument
    const itemDetail = args.item;

    // if we just want to load in a view directly we can use detailView property to do so
    itemDetail[`${this._keyPrefix}detailContent`] = args.detailView ?? this._addonOptions?.postTemplate?.(itemDetail);
    itemDetail[`${this._keyPrefix}detailViewLoaded`] = true;
    this.dataView.updateItem(itemDetail[this._dataViewIdProperty], itemDetail);

    // trigger an event once the post template is finished loading
    this._renderedIds.add(itemDetail[this.dataViewIdProperty]);
    this.onAsyncEndUpdate.notify(
      {
        grid: this._grid,
        item: itemDetail,
      },
      e,
      this
    );
  }

  /**
   * Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable)
   * Method that user can pass to override the default behavior or making every row an expandable row.
   * In order word, user can choose which rows to be an available row detail (or not) by providing his own logic.
   * @param overrideFn: override function callback
   */
  expandableOverride(overrideFn: UsabilityOverrideFn): void {
    this._expandableOverride = overrideFn;
  }

  getExpandableOverride(): UsabilityOverrideFn | null {
    return this._expandableOverride;
  }

  /** Get the Column Definition of the first column dedicated to toggling the Row Detail View */
  getColumnDefinition(): Column {
    const columnId = String(this._addonOptions?.columnId ?? this._defaults.columnId);

    return {
      id: columnId,
      field: columnId,
      name: '',
      alwaysRenderColumn: this._addonOptions?.alwaysRenderColumn,
      cssClass: this._addonOptions.cssClass || '',
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      formatter: this.detailSelectionFormatter.bind(this),
      reorderable: this._addonOptions.reorderable,
      resizable: false,
      sortable: false,
      toolTip: this._addonOptions.toolTip,
      width: this._addonOptions.width,
    };
  }

  /** return the currently expanded rows */
  getExpandedRowIds(): Array<number | string> {
    return Array.from(this._expandedRowIds);
  }

  /** return the rows that are out of the viewport */
  getOutOfViewportRows(): Array<number | string> {
    return Array.from(this._rowIdsOutOfViewport);
  }

  /** Takes in the item we are filtering and if it is an expanded row returns it's parents row to filter on */
  getFilterItem(item: any): any {
    if (item[`${this._keyPrefix}isPadding`] && item[`${this._keyPrefix}parent`]) {
      item = item[`${this._keyPrefix}parent`];
    }
    return item;
  }

  /** Resize the Row Detail View */
  resizeDetailView(item: any): void {
    if (!item) {
      return;
    }

    // Grab each of the DOM elements
    const mainContainer = document.querySelector<HTMLDivElement>(`.${this.gridUid} .detailViewContainer_${item[this._dataViewIdProperty]}`);
    const cellItem = document.querySelector<HTMLDivElement>(`.${this.gridUid} .cellDetailView_${item[this._dataViewIdProperty]}`);
    const inner = document.querySelector<HTMLDivElement>(`.${this.gridUid} .innerDetailView_${item[this._dataViewIdProperty]}`);

    if (!mainContainer || !cellItem || !inner) {
      return;
    }

    for (let idx = 1; idx <= item[`${this._keyPrefix}sizePadding`]; idx++) {
      this.dataView.deleteItem(`${item[this._dataViewIdProperty]}.${idx}`);
    }

    const rowHeight = this.gridOptions.rowHeight as number; // height of a row
    const lineHeight = 13; // we know cuz we wrote the custom css init ;)

    // remove the height so we can calculate the height
    mainContainer.style.minHeight = '';

    // Get the scroll height for the main container so we know the actual size of the view
    const itemHeight = mainContainer.scrollHeight;

    // Now work out how many rows
    const rowCount = Math.ceil(itemHeight / rowHeight);

    item[`${this._keyPrefix}sizePadding`] = Math.ceil((rowCount * 2 * lineHeight) / rowHeight);
    item[`${this._keyPrefix}height`] = itemHeight;

    let outterHeight = item[`${this._keyPrefix}sizePadding`] * rowHeight;
    if (this._addonOptions.maxRows !== undefined && item[`${this._keyPrefix}sizePadding`] > this._addonOptions.maxRows) {
      outterHeight = this._addonOptions.maxRows! * rowHeight;
      item[`${this._keyPrefix}sizePadding`] = this._addonOptions.maxRows;
    }

    // If the padding is now more than the original minRowBuff we need to increase it
    if (this.gridOptions.minRowBuffer! < item[`${this._keyPrefix}sizePadding`]) {
      // Update the minRowBuffer so that the view doesn't disappear when it's at top of screen + the original default 3
      this.gridOptions.minRowBuffer = item[`${this._keyPrefix}sizePadding`] + 3;
    }

    mainContainer.setAttribute('style', `min-height: ${item[this._keyPrefix + 'height']}px`);
    if (cellItem) {
      cellItem.setAttribute('style', `height: ${outterHeight}px; top: ${rowHeight}px`);
    }

    const idxParent = this.dataView.getIdxById(item[this._dataViewIdProperty]) as number;
    for (let idx = 1; idx <= item[`${this._keyPrefix}sizePadding`]; idx++) {
      this.dataView.insertItem(idxParent + idx, this.getPaddingItem(item, idx));
    }

    // Lastly save the updated state
    this.saveDetailView(item);
  }

  /**
   * (re)calculate/sync row detail views that are out of range of the viewport and trigger events (when enabled)
   * @param {Boolean} [triggerEvent] - should trigger notify event which will re-render the detail view
   * @param {Number} [delay] - optional delay to execute the calculation of out of range views
   */
  recalculateOutOfRangeViews(triggerEvent = true, delay?: number): void {
    clearTimeout(this._backViewportTimer);

    const calculateFn = () =>
      this._expandedRowIds.forEach((itemId) => {
        const item = this.dataView.getItemById(itemId);
        const rowIdx = this.dataView.getRowById(itemId) as number;
        const cachedRows = Object.keys(this._grid.getRowCache()).map(Number);

        const visible = this._grid.getRenderedRange();
        const rowDetailCount = this.gridOptions.rowDetailView?.panelRows ?? 0;
        this._visibleRenderedCell = { startRow: visible.top, endRow: visible.bottom };
        let { startRow, endRow } = this._visibleRenderedCell;
        if (rowIdx >= startRow && rowIdx <= endRow) {
          const rowSum = rowIdx + (this.gridOptions.rowDetailView?.panelRows ?? 0);
          if (rowSum > endRow) {
            endRow = rowSum;
          }
        }
        const rdEndRow = rowIdx + rowDetailCount;
        if (startRow > rowIdx && rowIdx < rdEndRow && rdEndRow > this._visibleRenderedCell!.startRow + 1) {
          startRow = rowIdx;
        }
        this._visibleRenderedCell = { startRow, endRow };

        if (
          !this._renderedViewportRowIds.has(itemId) &&
          this._visibleRenderedCell &&
          rowIdx >= this._visibleRenderedCell.startRow &&
          rowIdx <= this._visibleRenderedCell.endRow &&
          cachedRows.includes(rowIdx)
        ) {
          this._disposedRows.delete(rowIdx);
          this.notifyViewportChange(item, 'add', triggerEvent);
        } else if (
          (this._disposedRows.has(rowIdx) && !cachedRows.includes(rowIdx)) ||
          (!cachedRows.includes(rowIdx) &&
            this._renderedViewportRowIds.has(itemId) &&
            this._visibleRenderedCell &&
            (rowIdx < this._visibleRenderedCell.startRow || rowIdx > this._visibleRenderedCell.endRow))
        ) {
          this.notifyViewportChange(item, 'remove', triggerEvent);
        }
      });

    if (delay !== undefined) {
      this._backViewportTimer = setTimeout(calculateFn, delay);
    } else {
      calculateFn();
    }
  }

  // --
  // protected functions
  // ------------------

  /**
   * create the row detail ctr node. this belongs to the dev & can be custom-styled as per
   * @param {Object} item
   */
  protected applyTemplateNewLineHeight(item: any): void {
    // the height is calculated by the template row count (how many line of items does the template view have)
    const rowCount = this._addonOptions.panelRows;

    // calculate padding requirements based on detail-content..
    // ie. worst-case: create an invisible dom node now & find it's height.
    const lineHeight = 13; // we know cuz we wrote the custom css init ;)
    item[`${this._keyPrefix}sizePadding`] = Math.ceil((rowCount * 2 * lineHeight) / this.gridOptions.rowHeight!);
    item[`${this._keyPrefix}height`] = item[`${this._keyPrefix}sizePadding`] * this.gridOptions.rowHeight!;
    const idxParent = this.dataView.getIdxById(item[this._dataViewIdProperty]);
    for (let idx = 1; idx <= item[`${this._keyPrefix}sizePadding`]; idx++) {
      this.dataView.insertItem((idxParent || 0) + idx, this.getPaddingItem(item, idx));
    }
  }

  protected notifyViewportChange(item: any, action: 'add' | 'remove', triggerEvent = true): void {
    if (item) {
      const itemId = item[this._dataViewIdProperty];
      if (action === 'add') {
        this._renderedViewportRowIds.add(itemId);
        triggerEvent && this.notifyBackToViewportWhenDomExist(item);
      } else if (action === 'remove') {
        this._renderedViewportRowIds.delete(itemId);
        triggerEvent && this.notifyOutOfViewport(item);
      }
    }
  }

  protected checkExpandableOverride(row: number, dataContext: any, grid: SlickGrid): boolean {
    if (typeof this._expandableOverride === 'function') {
      return this._expandableOverride(row, dataContext, grid);
    }
    return true;
  }

  /** Get the Row Detail padding (which are the rows dedicated to the detail panel) */
  protected getPaddingItem(parent: any, offset: any): any {
    const item: any = {};

    Object.keys(this.dataView).forEach((prop) => {
      if (prop) {
        item[prop] = null;
      }
    });
    item[this._dataViewIdProperty] = `${parent[this._dataViewIdProperty]}.${offset}`;

    // additional hidden padding metadata fields
    item[`${this._keyPrefix}collapsed`] = true;
    item[`${this._keyPrefix}isPadding`] = true;
    item[`${this._keyPrefix}parent`] = parent;
    item[`${this._keyPrefix}offset`] = offset;

    return item;
  }

  /** The Formatter of the toggling icon of the Row Detail */
  protected detailSelectionFormatter(
    row: number,
    _cell: number,
    _val: any,
    _colDef: Column,
    dataContext: any,
    grid: SlickGrid
  ): FormatterResultWithHtml | HTMLElement | '' {
    if (!this.checkExpandableOverride(row, dataContext, grid)) {
      return '';
    } else {
      if (dataContext[`${this._keyPrefix}collapsed`] === undefined) {
        dataContext[`${this._keyPrefix}collapsed`] = true;
        dataContext[`${this._keyPrefix}sizePadding`] = 0; // the required number of pading rows
        dataContext[`${this._keyPrefix}height`] = 0; // the actual height in pixels of the detail field
        dataContext[`${this._keyPrefix}isPadding`] = false;
        dataContext[`${this._keyPrefix}parent`] = undefined;
        dataContext[`${this._keyPrefix}offset`] = 0;
      }

      if (dataContext[`${this._keyPrefix}isPadding`]) {
        // render nothing
      } else if (dataContext[`${this._keyPrefix}collapsed`]) {
        let collapsedClasses = `${this._addonOptions.cssClass || ''} expand `;
        if (this._addonOptions.collapsedClass) {
          collapsedClasses += this._addonOptions.collapsedClass;
        }
        return createDomElement('div', { className: classNameToList(collapsedClasses).join(' ') });
      } else {
        const rowHeight = this.gridOptions.rowHeight || 0;
        let outterHeight = (dataContext[`${this._keyPrefix}sizePadding`] || 0) * this.gridOptions.rowHeight!;

        if (this._addonOptions.maxRows !== null && (dataContext[`${this._keyPrefix}sizePadding`] || 0) > this._addonOptions.maxRows!) {
          outterHeight = this._addonOptions.maxRows! * rowHeight!;
          dataContext[`${this._keyPrefix}sizePadding`] = this._addonOptions.maxRows;
        }

        // sneaky extra </div> inserted here-----------------v
        let expandedClasses = `${this._addonOptions.cssClass || ''} collapse `;
        if (this._addonOptions.expandedClass) {
          expandedClasses += this._addonOptions.expandedClass;
        }

        // create the Row Detail div container that will be inserted AFTER the `.slick-cell`
        const cellDetailContainerElm = createDomElement('div', {
          className: `dynamic-cell-detail cellDetailView_${dataContext[this._dataViewIdProperty]}`,
          style: { height: `${outterHeight}px`, top: `${rowHeight}px` },
        });
        const innerContainerElm = createDomElement('div', {
          className: `detail-container detailViewContainer_${dataContext[this._dataViewIdProperty]}`,
        });
        const innerDetailViewElm = createDomElement('div', {
          className: `innerDetailView_${dataContext[this._dataViewIdProperty]}`,
        });
        if (dataContext[`${this._keyPrefix}detailContent`] instanceof HTMLElement) {
          innerDetailViewElm.appendChild(dataContext[`${this._keyPrefix}detailContent`]);
        } else {
          innerDetailViewElm.innerHTML = this._grid.sanitizeHtmlString(dataContext[`${this._keyPrefix}detailContent`]);
        }

        innerContainerElm.appendChild(innerDetailViewElm);
        cellDetailContainerElm.appendChild(innerContainerElm);

        const result: FormatterResultWithHtml = {
          html: createDomElement('div', { className: classNameToList(expandedClasses).join(' ') }),
          insertElementAfterTarget: cellDetailContainerElm,
        };

        return result;
      }
    }
    return '';
  }

  /** When row is getting toggled, we will handle the action of collapsing/expanding */
  protected handleAccordionShowHide(item: any): void {
    if (item) {
      const itemId = item[this._dataViewIdProperty];
      if (!item[`${this._keyPrefix}collapsed`]) {
        this.collapseDetailView(itemId);
      } else {
        this.expandDetailView(itemId);
      }
    }
  }

  /** Handle mouse click event */
  protected handleClick(e: SlickEventData, args: { row: number; cell: number }): void {
    const dataContext = this._grid.getDataItem(args.row);

    if (this.checkExpandableOverride(args.row, dataContext, this._grid)) {
      // clicking on a row select checkbox
      const columnDef = this._grid.getColumns()[args.cell];
      // prettier-ignore
      if (this._addonOptions.useRowClick || (columnDef.id === this._addonOptions.columnId && e.target!.classList.contains(this._addonOptions.cssClass || ''))) {
        // if editing, try to commit
        if (this._grid.getEditorLock().isActive() && !this._grid.getEditorLock().commitCurrentEdit()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        // trigger an event before toggling
        // user could cancel the Row Detail opening when event is returning false
        const ignorePrevEventDataValue = true; // click event might return false from Row Selection canCellBeActive() validation, we need to ignore that
        if (
          this.onBeforeRowDetailToggle
            .notify({ grid: this._grid, item: dataContext }, e, this, ignorePrevEventDataValue)
            .getReturnValue() === false
        ) {
          return;
        }

        // tag any row details that will need to be re-rendered after the row detail is toggled.
        // for example if row(2) is open and we open row(1) then row(2) needs to be re-rendered,
        // if however row(1) is open and we open row(2) then there is nothing to re-render
        const toReRenderItems: any[] = [];
        const visible = this._grid.getRenderedRange();
        this._expandedRowIds.forEach((itemId) => {
          const row = this.dataView.getRowById(itemId);
          if (row !== undefined && row > args.row && row >= visible.top && row <= visible.bottom) {
            const item = this.dataView.getItemById(itemId);
            toReRenderItems.push(item);
            this.notifyOutOfViewport(item);
          }
        });

        this.toggleRowSelection(args.row, dataContext);

        // trigger an event after toggling
        this.onAfterRowDetailToggle.notify(
          {
            grid: this._grid,
            item: dataContext,
            expandedRows: Array.from(this._expandedRowIds).map((id) => this.dataView.getItemById(id)),
          },
          e,
          this
        );

        // re-render the row details that were tagged as
        toReRenderItems.forEach(item => this.notifyViewportChange(item, 'add', true));

        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }
  }

  protected handleRemoveRow(rowIndex: number): void {
    const item = this.dataView.getItemByIdx(rowIndex);

    if (!item) {
      return;
    }
    
    const rowId = item[this.dataViewIdProperty];

    if (this._expandedRowIds.has(rowId)) {
      this.onBeforeRowOutOfViewportRange.notify(
        {
          grid: this._grid,
          item,
          rowId,
          rowIndex,
          expandedRows: Array.from(this._expandedRowIds).map((id) => this.dataView.getItemById(id)),
          rowIdsOutOfViewport: Array.from(this.syncOutOfViewportArray(rowId, true)),
        },
        null,
        this
      );
      this._disposedRows.add(rowIndex);
    }
  }

  protected notifyOutOfViewport(item: any): void {
    const rowIndex = item.rowIndex || this.dataView.getRowById(item[this._dataViewIdProperty]);
    const rowId = item[this.dataViewIdProperty];

    this._renderedIds.delete(rowId);
    this.onRowOutOfViewportRange.notify(
      {
        grid: this._grid,
        item,
        rowId,
        rowIndex,
        expandedRows: Array.from(this._expandedRowIds).map((id) => this.dataView.getItemById(id)),
        rowIdsOutOfViewport: Array.from(this.syncOutOfViewportArray(rowId, true)),
      },
      null,
      this
    );
  }

  protected notifyBackToViewportWhenDomExist(item: any): void {
    const rowIndex = item.rowIndex || this.dataView.getRowById(item[this._dataViewIdProperty]);
    const rowId = item[this.dataViewIdProperty];

    // make sure View Row DOM Element really exist before notifying that it's a row that is visible again
    if (document.querySelector(`.${this.gridUid} .cellDetailView_${item[this._dataViewIdProperty]}`)) {
      this.onRowBackToViewportRange.notify(
        {
          grid: this._grid,
          item,
          rowId,
          rowIndex,
          expandedRows: Array.from(this._expandedRowIds).map((id) => this.dataView.getItemById(id)),
          rowIdsOutOfViewport: Array.from(this.syncOutOfViewportArray(rowId, false)),
        },
        null,
        this
      );
    }
  }

  /**
   * keep any row detail that are shown on top of the row that we're opening
   * but invalidate any rows that are after the row that we're opening
   */
  protected reevaluateRenderedRowIds(item: any): void {
    // get current item row index
    const rowIdx = this.dataView.getRowById(item[this._dataViewIdProperty]) as number;
    this._renderedViewportRowIds.forEach((rid) => {
      const invRowIdx = this.dataView.getRowById(rid);
      if (invRowIdx !== undefined && invRowIdx > rowIdx) {
        this.notifyViewportChange(this.dataView.getItemById(rid), 'remove');
      }
    });
  }

  protected syncOutOfViewportArray(rowId: number | string, isAdding: boolean): Set<string | number> {
    const hasRowId = this._rowIdsOutOfViewport.has(rowId);

    if (isAdding && !hasRowId) {
      this._rowIdsOutOfViewport.add(rowId);
    } else if (!isAdding && hasRowId) {
      this._rowIdsOutOfViewport.delete(rowId);
    }
    return this._rowIdsOutOfViewport;
  }

  protected toggleRowSelection(rowNumber: number, dataContext: any): void {
    if (this.checkExpandableOverride(rowNumber, dataContext, this._grid)) {
      this.dataView.beginUpdate();
      this.handleAccordionShowHide(dataContext);
      this.dataView.endUpdate();
    }
  }
}
