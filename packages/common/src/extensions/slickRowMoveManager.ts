import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, findWidthOrDefault, getOffset } from '@slickgrid-universal/utils';

import type { UsabilityOverrideFn } from '../enums/usabilityOverrideFn.type.js';
import type {
  Column,
  DragRowMove,
  FormatterResultWithHtml,
  GridOption,
  RowMoveManager,
  RowMoveManagerOption,
} from '../interfaces/index.js';
import { SlickEvent, SlickEventData, SlickEventHandler, type SlickGrid, Utils as SlickUtils } from '../core/index.js';

/**
 * Row Move Manager options:
 *    cssClass:             A CSS class to be added to the menu item container.
 *    columnId:             Column definition id (defaults to "_move")
 *    cancelEditOnDrag:     Do we want to cancel any Editing while dragging a row (defaults to false)
 *    disableRowSelection:  Do we want to disable the row selection? (defaults to false)
 *    singleRowMove:        Do we want a single row move? Setting this to false means that it's a multple row move (defaults to false)
 *    width:                Width of the column
 *    usabilityOverride:    Callback method that user can override the default behavior of the row being moveable or not
 *
 */
export class SlickRowMoveManager {
  onBeforeMoveRows: SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number }>;
  onMoveRows: SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number }>;
  pluginName: 'RowMoveManager' = 'RowMoveManager' as const;

  protected _addonOptions!: RowMoveManager;
  protected _canvas!: HTMLElement;
  protected _dragging = false;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _usabilityOverride?: UsabilityOverrideFn;
  protected _defaults = {
    autoScroll: true,
    columnId: '_move',
    cssClass: 'slick-row-move-column',
    cancelEditOnDrag: false,
    disableRowSelection: false,
    hideRowMoveShadow: true,
    reorderable: false,
    rowMoveShadowMarginTop: 0,
    rowMoveShadowMarginLeft: 0,
    rowMoveShadowOpacity: 0.9,
    rowMoveShadowScale: 0.75,
    singleRowMove: false,
    width: 40,
  } as RowMoveManagerOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly pubSubService: BasePubSubService) {
    this.onBeforeMoveRows = new SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number }>('onBeforeMoveRows');
    this.onMoveRows = new SlickEvent<{ grid: SlickGrid; rows: number[]; insertBefore: number }>('onMoveRows');
    this._eventHandler = new SlickEventHandler();
  }

  get addonOptions(): RowMoveManagerOption {
    return this._addonOptions;
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  /** Initialize plugin. */
  init(grid: SlickGrid, options?: RowMoveManager): void {
    this._addonOptions = { ...this._defaults, ...options };
    this._grid = grid;
    this._canvas = this._grid.getCanvasNode();

    // add PubSub instance to all SlickEvent
    SlickUtils.addSlickEventPubSubWhenDefined(this.pubSubService, this);

    // user could override the expandable icon logic from within the options or after instantiating the plugin
    if (typeof this._addonOptions?.usabilityOverride === 'function') {
      this.usabilityOverride(this._addonOptions.usabilityOverride);
    }

    this._eventHandler
      .subscribe(this._grid.onDragInit, this.handleDragInit.bind(this))
      .subscribe(this._grid.onDragStart, this.handleDragStart.bind(this))
      .subscribe(this._grid.onDrag, this.handleDrag.bind(this))
      .subscribe(this._grid.onDragEnd, this.handleDragEnd.bind(this));
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose(): void {
    this._eventHandler?.unsubscribeAll();
  }

  /**
   * Create the plugin before the Grid creation to avoid having odd behaviors.
   * Mostly because the column definitions might change after the grid creation, so we want to make sure to add it before then
   */
  create(columns: Column[], gridOptions: GridOption): SlickRowMoveManager | null {
    this._addonOptions = { ...this._defaults, ...gridOptions.rowMoveManager } as RowMoveManagerOption;
    if (Array.isArray(columns) && gridOptions) {
      const newRowMoveColumn: Column = this.getColumnDefinition();

      // add new row move column unless it was already added
      if (!columns.some((col) => col.id === newRowMoveColumn.id)) {
        const rowMoveColDef = Array.isArray(columns) && columns.find((col: Column) => col?.behavior === 'selectAndMove');
        const finalRowMoveColumn = rowMoveColDef ? rowMoveColDef : newRowMoveColumn;

        // column index position in the grid
        const columnPosition = gridOptions?.rowMoveManager?.columnIndexPosition ?? 0;
        if (columnPosition > 0) {
          columns.splice(columnPosition, 0, finalRowMoveColumn);
        } else {
          columns.unshift(finalRowMoveColumn);
        }

        this.pubSubService.publish(`onPluginColumnsChanged`, {
          columns,
          pluginName: this.pluginName,
        });
      }
    }
    return this;
  }

  getColumnDefinition(): Column {
    const columnId = String(this._addonOptions?.columnId ?? this._defaults.columnId);

    return {
      id: columnId,
      name: '',
      behavior: 'selectAndMove',
      excludeFromExport: true,
      excludeFromColumnPicker: true,
      excludeFromGridMenu: true,
      excludeFromQuery: true,
      excludeFromHeaderMenu: true,
      field: columnId,
      reorderable: this._addonOptions.reorderable,
      resizable: false,
      width: this._addonOptions.width || 40,
      formatter: this.moveIconFormatter.bind(this),
    };
  }

  /**
   * Method that user can pass to override the default behavior or making every row moveable.
   * In order word, user can choose which rows to be an available as moveable (or not) by providing his own logic show/hide icon and usability.
   * @param overrideFn: override function callback
   */
  usabilityOverride(overrideFn: UsabilityOverrideFn): void {
    this._usabilityOverride = overrideFn;
  }

  setOptions(newOptions: RowMoveManagerOption): void {
    this._addonOptions = { ...this._addonOptions, ...newOptions };
  }

  // --
  // protected functions
  // ------------------

  protected handleDragInit(e: SlickEventData): void {
    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  protected handleDragEnd(e: SlickEventData, dd: DragRowMove): void {
    if (!this._dragging) {
      return;
    }
    this._dragging = false;
    e.stopImmediatePropagation();

    dd.guide?.remove();
    dd.selectionProxy?.remove();
    dd.clonedSlickRow?.remove();

    if (dd.canMove) {
      const eventData = {
        grid: this._grid,
        rows: dd.selectedRows,
        insertBefore: dd.insertBefore,
      };
      // TODO:  this._grid.remapCellCssClasses ?
      if (typeof this._addonOptions.onMoveRows === 'function') {
        this._addonOptions.onMoveRows(e instanceof SlickEventData ? e.getNativeEvent() : e, eventData);
      }
      this.onMoveRows.notify(eventData);
    }
  }

  protected handleDrag(evt: SlickEventData, dd: DragRowMove): boolean | void {
    if (this._dragging) {
      evt.stopImmediatePropagation();
      const e = evt.getNativeEvent<MouseEvent | TouchEvent>();

      const targetEvent: MouseEvent | Touch = (e as TouchEvent)?.touches?.[0] ?? e;
      const top = targetEvent.pageY - getOffset(this._canvas).top;
      dd.selectionProxy.style.top = `${top - 5}px`;
      dd.selectionProxy.style.display = 'block';

      // if the row move shadow is enabled, we'll also make it follow the mouse cursor
      if (dd.clonedSlickRow) {
        dd.clonedSlickRow.style.top = `${top - 6}px`;
        dd.clonedSlickRow.style.display = 'block';
      }

      const insertBefore = Math.max(0, Math.min(Math.round(top / (this.gridOptions.rowHeight || 0)), this._grid.getDataLength()));
      if (insertBefore !== dd.insertBefore) {
        const eventData = {
          grid: this._grid,
          rows: dd.selectedRows,
          insertBefore,
        };

        if (
          this._addonOptions?.onBeforeMoveRows?.(e, eventData) === false ||
          this.onBeforeMoveRows.notify(eventData).getReturnValue() === false
        ) {
          dd.canMove = false;
        } else {
          dd.canMove = true;
        }

        // if there's a UsabilityOverride defined, we also need to verify that the condition is valid
        if (this._usabilityOverride && dd.canMove) {
          const insertBeforeDataContext = this._grid.getDataItem(insertBefore);
          dd.canMove = this.checkUsabilityOverride(insertBefore, insertBeforeDataContext, this._grid);
        }

        // if the new target is possible we'll display the dark blue bar (representing the acceptability) at the target position
        // else it won't show up (it will be off the screen)
        if (!dd.canMove) {
          dd.guide.style.top = '-1000px';
        } else {
          dd.guide.style.top = `${insertBefore * (this.gridOptions.rowHeight || 0)}px`;
        }

        dd.insertBefore = insertBefore;
      }
    }
  }

  protected handleDragStart(event: SlickEventData, dd: DragRowMove): boolean | void {
    const cell = this._grid.getCellFromEvent(event) || { cell: -1, row: -1 };
    const currentRow = cell.row;
    const dataContext = this._grid.getDataItem(currentRow);

    if (this.checkUsabilityOverride(currentRow, dataContext, this._grid)) {
      if (this._addonOptions.cancelEditOnDrag && this._grid.getEditorLock().isActive()) {
        this._grid.getEditorLock().cancelCurrentEdit();
      }

      if (this._grid.getEditorLock().isActive() || !/move|selectAndMove/.test(this._grid.getColumns()[cell.cell].behavior || '')) {
        return false;
      }

      this._dragging = true;
      event.stopImmediatePropagation();

      // optionally create a shadow element of the row item that we're moving/dragging so that we can see it all the time exactly which row is being dragged
      if (!this.addonOptions.hideRowMoveShadow) {
        const slickRowElm = this._grid.getCellNode(cell.row, cell.cell)?.closest<HTMLDivElement>('.slick-row');
        if (slickRowElm) {
          dd.clonedSlickRow = slickRowElm.cloneNode(true) as HTMLDivElement;
          dd.clonedSlickRow.classList.add('slick-reorder-shadow-row');
          dd.clonedSlickRow.style.display = 'none';
          dd.clonedSlickRow.style.marginLeft = findWidthOrDefault(this._addonOptions?.rowMoveShadowMarginLeft, '0px');
          dd.clonedSlickRow.style.marginTop = findWidthOrDefault(this._addonOptions?.rowMoveShadowMarginTop, '0px');
          dd.clonedSlickRow.style.opacity = `${this._addonOptions?.rowMoveShadowOpacity ?? 0.95}`;
          dd.clonedSlickRow.style.transform = `scale(${this.addonOptions?.rowMoveShadowScale ?? 0.75})`;
          this._canvas.appendChild(dd.clonedSlickRow);
        }
      }

      let selectedRows = this._addonOptions.singleRowMove ? [cell.row] : this._grid.getSelectedRows();
      if (selectedRows.length === 0 || !selectedRows.some((selectedRow) => selectedRow === cell.row)) {
        selectedRows = [cell.row];
        if (!this._addonOptions.disableRowSelection) {
          this._grid.setSelectedRows(selectedRows);
        }
      }

      const rowHeight = this.gridOptions.rowHeight as number;
      dd.selectedRows = selectedRows;

      dd.selectionProxy = createDomElement(
        'div',
        {
          className: 'slick-reorder-proxy',
          style: {
            display: 'none',
            position: 'absolute',
            zIndex: '99999',
            width: `${this._canvas.clientWidth}px`,
            height: `${rowHeight * selectedRows.length}px`,
          },
        },
        this._canvas
      );

      dd.guide = createDomElement(
        'div',
        {
          className: 'slick-reorder-guide',
          style: {
            position: 'absolute',
            zIndex: '99999',
            width: `${this._canvas.clientWidth}px`,
            top: `-1000px`,
          },
        },
        this._canvas
      );

      dd.insertBefore = -1;
    }
  }

  protected checkUsabilityOverride(row: number, dataContext: any, grid: SlickGrid): boolean {
    if (typeof this._usabilityOverride === 'function') {
      return this._usabilityOverride(row, dataContext, grid);
    }
    return true;
  }

  protected moveIconFormatter(
    row: number,
    _cell: number,
    _val: any,
    _col: Column,
    dataContext: any,
    grid: SlickGrid
  ): FormatterResultWithHtml | string {
    if (!this.checkUsabilityOverride(row, dataContext, grid)) {
      return '';
    } else {
      return {
        addClasses: `cell-reorder dnd`,
        html: createDomElement('div', { className: this._addonOptions.cssClass || '' }),
      };
    }
  }
}
