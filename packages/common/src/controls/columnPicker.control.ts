import {
  Column,
  ColumnPickerOption,
  DOMEvent,
  GetSlickEventType,
  GridOption,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { BindingEventService } from '../services/bindingEvent.service';
import { PubSubService } from '../services/pubSub.service';
import { SharedService } from '../services/shared.service';
import { emptyElement, sanitizeTextByAvailableSanitizer } from '../services';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A control to add a Column Picker (right+click on any column header to reveal the column picker)
 * @class ColumnPickerControl
 * @constructor
 */
export class ColumnPickerControl {
  protected _bindEventService: BindingEventService;
  protected _columns: Column[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _gridUid = '';
  protected _listElm!: HTMLSpanElement;
  protected _menuElm!: HTMLDivElement;
  protected columnCheckboxes: HTMLInputElement[] = [];

  protected _defaults = {
    // the last 2 checkboxes titles
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    syncResizeTitle: 'Synchronous resize',
    headerColumnValueExtractor: (columnDef: Column) => columnDef.name
  } as ColumnPickerOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly pubSubService: PubSubService, protected readonly sharedService: SharedService) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this._columns = this.sharedService.allColumns ?? [];
    this._gridUid = this.grid?.getUID?.() ?? '';

    this.init();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get columns(): Column[] {
    return this._columns;
  }
  set columns(newColumns: Column[]) {
    this._columns = newColumns;
  }

  get controlOptions(): ColumnPickerOption {
    return this.gridOptions.columnPicker || {};
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions ?? {};
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  get menuElement(): HTMLDivElement {
    return this._menuElm;
  }

  /** Initialize plugin. */
  init() {
    this._gridUid = this.grid.getUID() ?? '';
    this.gridOptions.columnPicker = { ...this._defaults, ...this.gridOptions.columnPicker };

    // localization support for the picker
    this.controlOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'columnPicker');
    this.controlOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'columnPicker');
    this.controlOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'columnPicker');

    const onHeaderContextMenuHandler = this.grid.onHeaderContextMenu;
    const onColumnsReorderedHandler = this.grid.onColumnsReordered;
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onHeaderContextMenuHandler>>).subscribe(onHeaderContextMenuHandler, this.handleHeaderContextMenu.bind(this) as EventListener);
    (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onColumnsReorderedHandler>>).subscribe(onColumnsReorderedHandler, this.updateColumnOrder.bind(this) as EventListener);

    this._menuElm = document.createElement('div');
    this._menuElm.className = `slick-columnpicker ${this._gridUid}`;
    this._menuElm.style.visibility = 'hidden';

    const closePickerButtonElm = document.createElement('button');
    closePickerButtonElm.className = 'close';
    closePickerButtonElm.type = 'button';
    closePickerButtonElm.dataset.dismiss = 'slick-columnpicker';
    closePickerButtonElm.setAttribute('aria-label', 'Close');

    const closeSpanElm = document.createElement('span');
    closeSpanElm.className = 'close';
    closeSpanElm.innerHTML = '&times;';
    closeSpanElm.setAttribute('aria-hidden', 'true');

    closePickerButtonElm.appendChild(closeSpanElm);
    this._menuElm.appendChild(closePickerButtonElm);

    // user could pass a title on top of the columns list
    if (this.controlOptions?.columnTitle) {
      this._columnTitleElm = document.createElement('div');
      this._columnTitleElm.className = 'title';
      this._columnTitleElm.textContent = this.controlOptions?.columnTitle ?? this._defaults.columnTitle;
      this._menuElm.appendChild(this._columnTitleElm);
    }

    this._bindEventService.bind(this._menuElm, 'click', this.updateColumn.bind(this) as EventListener);

    this._listElm = document.createElement('span');
    this._listElm.className = 'slick-columnpicker-list';

    // Hide the menu on outside click.
    this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener);

    // destroy the picker if user leaves the page
    this._bindEventService.bind(document.body, 'beforeunload', this.dispose.bind(this) as EventListener);

    document.body.appendChild(this._menuElm);
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose() {
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
    this._listElm?.remove?.();
    this._menuElm?.remove?.();
  }

  /**
   * Get all columns including hidden columns.
   * @returns {Array<Object>} - all columns array
   */
  getAllColumns() {
    return this._columns;
  }

  /**
   * Get only the visible columns.
   * @returns {Array<Object>} - all columns array
   */
  getVisibleColumns() {
    return this.grid.getColumns();
  }

  /** Mouse down handler when clicking anywhere in the DOM body */
  handleBodyMouseDown(e: DOMEvent<HTMLDivElement>) {
    if ((this._menuElm !== e.target && !this._menuElm.contains(e.target)) || e.target.className === 'close') {
      this._menuElm.style.visibility = 'hidden';
    }
  }

  /** Mouse header context handler when doing a right+click on any of the header column title */
  handleHeaderContextMenu(e: DOMEvent<HTMLDivElement>) {
    e.preventDefault();
    emptyElement(this._listElm);
    this.updateColumnOrder();
    this.columnCheckboxes = [];

    let liElm;
    let inputElm;
    let columnId;
    let columnLabel;
    let excludeCssClass;
    for (const column of this.columns) {
      columnId = column.id;
      excludeCssClass = column.excludeFromColumnPicker ? 'hidden' : '';
      liElm = document.createElement('li');
      liElm.className = excludeCssClass;
      this._listElm.appendChild(liElm);

      inputElm = document.createElement('input');
      inputElm.type = 'checkbox';
      inputElm.id = `${this._gridUid}-colpicker-${columnId}`;
      inputElm.dataset.columnid = `${columnId}`;
      const colIndex = this.grid.getColumnIndex(columnId);
      if (colIndex >= 0) {
        inputElm.checked = true;
      }
      liElm.appendChild(inputElm);
      this.columnCheckboxes.push(inputElm);

      if (this.controlOptions?.headerColumnValueExtractor) {
        columnLabel = this.controlOptions.headerColumnValueExtractor(column, this.gridOptions);
      } else {
        columnLabel = this._defaults.headerColumnValueExtractor!(column, this.gridOptions);
      }

      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-colpicker-${columnId}`;
      labelElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, columnLabel);
      liElm.appendChild(labelElm);
    }

    if (!this.controlOptions.hideForceFitButton || !this.controlOptions.hideSyncResizeButton) {
      this._listElm.appendChild(document.createElement('hr'));
    }

    if (!(this.controlOptions?.hideForceFitButton)) {
      const forceFitTitle = this.controlOptions?.forceFitTitle;

      liElm = document.createElement('li');
      this._listElm.appendChild(liElm);
      inputElm = document.createElement('input');
      inputElm.type = 'checkbox';
      inputElm.id = `${this._gridUid}-colpicker-forcefit`;
      inputElm.dataset.option = 'autoresize';
      liElm.appendChild(inputElm);

      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-colpicker-forcefit`;
      labelElm.textContent = `${forceFitTitle ?? ''}`;
      liElm.appendChild(labelElm);
      if (this.grid.getOptions().forceFitColumns) {
        inputElm.checked = true;
      }
    }

    if (!(this.controlOptions?.hideSyncResizeButton)) {
      const syncResizeTitle = (this.controlOptions?.syncResizeTitle) || this.controlOptions.syncResizeTitle;
      liElm = document.createElement('li');
      this._listElm.appendChild(liElm);

      inputElm = document.createElement('input');
      inputElm.type = 'checkbox';
      inputElm.id = `${this._gridUid}-colpicker-syncresize`;
      inputElm.dataset.option = 'syncresize';
      liElm.appendChild(inputElm);

      const labelElm = document.createElement('label');
      labelElm.htmlFor = `${this._gridUid}-colpicker-syncresize`;
      labelElm.textContent = `${syncResizeTitle ?? ''}`;
      liElm.appendChild(labelElm);
      if (this.grid.getOptions().syncColumnCellResize) {
        inputElm.checked = true;
      }
    }

    this._menuElm.style.top = `${(e as any).pageY - 10}px`;
    this._menuElm.style.left = `${(e as any).pageX - 10}px`;
    this._menuElm.style.maxHeight = `${document.body.clientHeight - (e as any).pageY - 10}px`;
    this._menuElm.style.visibility = 'visible';
    this._menuElm.appendChild(this._listElm);
  }

  updateColumnOrder() {
    // Because columns can be reordered, we have to update the `columns` to reflect the new order, however we can't just take `grid.getColumns()`,
    // as it does not include columns currently hidden by the picker. We create a new `columns` structure by leaving currently-hidden
    // columns in their original ordinal position and interleaving the results of the current column sort.
    const current = this.grid.getColumns().slice(0);
    const ordered = new Array(this.columns.length);

    for (let i = 0; i < ordered.length; i++) {
      const columnIdx = this.grid.getColumnIndex(this.columns[i].id);
      if (columnIdx === undefined) {
        // if the column doesn't return a value from getColumnIndex, it is hidden. Leave it in this position.
        ordered[i] = this.columns[i];
      } else {
        // otherwise, grab the next visible column.
        ordered[i] = current.shift();
      }
    }

    // the new set of ordered columns becomes the new set of column picker columns
    this._columns = ordered;
  }

  /** Update the Titles of each sections (command, customTitle, ...) */
  updateAllTitles(options: ColumnPickerOption) {
    if (this._columnTitleElm?.textContent && options.columnTitle) {
      this._columnTitleElm.textContent = options.columnTitle;
    }
  }

  updateColumn(e: DOMEvent<HTMLInputElement>) {
    if (e.target.dataset.option === 'autoresize') {
      // when calling setOptions, it will resize with ALL Columns (even the hidden ones)
      // we can avoid this problem by keeping a reference to the visibleColumns before setOptions and then setColumns after
      const previousVisibleColumns = this.getVisibleColumns();
      const isChecked = e.target.checked;
      this.grid.setOptions({ forceFitColumns: isChecked });
      this.grid.setColumns(previousVisibleColumns);
      return;
    }

    if (e.target.dataset.option === 'syncresize') {
      this.grid.setOptions({ syncColumnCellResize: !!(e.target.checked) });
      return;
    }

    if (e.target.type === 'checkbox') {
      const isChecked = e.target.checked;
      const columnId = e.target.dataset.columnid || '';
      const visibleColumns: Column[] = [];
      this.columnCheckboxes.forEach((columnCheckbox: HTMLInputElement, idx: number) => {
        if (columnCheckbox.checked) {
          visibleColumns.push(this.columns[idx]);
        }
      });

      if (!visibleColumns.length) {
        e.target.checked = true;
        return;
      }

      this.grid.setColumns(visibleColumns);

      // keep reference to the updated visible columns list
      if (Array.isArray(visibleColumns) && visibleColumns.length !== this.sharedService.visibleColumns.length) {
        this.sharedService.visibleColumns = visibleColumns;
      }

      // when using row selection, SlickGrid will only apply the "selected" CSS class on the visible columns only
      // and if the row selection was done prior to the column being shown then that column that was previously hidden (at the time of the row selection)
      // will not have the "selected" CSS class because it wasn't visible at the time.
      // To bypass this problem we can simply recall the row selection with the same selection and that will trigger a re-apply of the CSS class
      // on all columns including the column we just made visible
      if (this.gridOptions.enableRowSelection && isChecked) {
        const rowSelection = this.grid.getSelectedRows();
        this.grid.setSelectedRows(rowSelection);
      }

      // if we're using frozen columns, we need to readjust pinning when the new hidden column becomes visible again on the left pinning container
      // we need to readjust frozenColumn index because SlickGrid freezes by index and has no knowledge of the columns themselves
      const frozenColumnIndex = this.gridOptions.frozenColumn ?? -1;
      if (frozenColumnIndex >= 0) {
        this.extensionUtility.readjustFrozenColumnIndexWhenNeeded(frozenColumnIndex, this.columns, visibleColumns);
      }

      const callbackArgs = {
        columnId,
        showing: isChecked,
        allColumns: this.columns,
        visibleColumns,
        columns: visibleColumns,
        grid: this.grid
      };

      // execute user callback when defined
      this.pubSubService.publish('columnPicker:onColumnsChanged', callbackArgs);
      if (typeof this.controlOptions?.onColumnsChanged === 'function') {
        this.controlOptions.onColumnsChanged(e, callbackArgs);
      }
    }
  }

  /** Translate the Column Picker headers and also the last 2 checkboxes */
  translateColumnPicker() {
    // update the properties by pointers, that is the only way to get Column Picker Control to see the new values
    if (this.controlOptions) {
      this.emptyColumnPickerTitles();
      this.controlOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'columnPicker');
      this.controlOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'columnPicker');
      this.controlOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'columnPicker');
    }

    // translate all columns (including hidden columns)
    this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');

    // update the Titles of each sections (command, customTitle, ...)
    if (this.controlOptions) {
      this.updateAllTitles(this.controlOptions);
    }
  }

  protected emptyColumnPickerTitles() {
    if (this.controlOptions) {
      this.controlOptions.columnTitle = '';
      this.controlOptions.forceFitTitle = '';
      this.controlOptions.syncResizeTitle = '';
    }
  }
}