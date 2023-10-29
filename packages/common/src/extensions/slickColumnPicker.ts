import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';

import type {
  Column,
  ColumnPickerOption,
  DOMMouseOrTouchEvent,
  GridOption,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';
import type { ExtensionUtility } from '../extensions/extensionUtility';
import { BindingEventService } from '../services/bindingEvent.service';
import type { SharedService } from '../services/shared.service';
import { createDomElement, emptyElement, findWidthOrDefault } from '../services/domUtilities';
import { addColumnTitleElementWhenDefined, addCloseButtomElement, handleColumnPickerItemClick, populateColumnPicker, updateColumnPickerOrder } from '../extensions/extensionCommonUtils';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

/**
 * A control to add a Column Picker (right+click on any column header to reveal the column picker)
 * To specify a custom button in a column header, extend the column definition like so:
 *   this.gridOptions = {
 *     enableColumnPicker: true,
 *     columnPicker: {
 *       ... column picker options ...
 *     }
 *   }];
 * @class ColumnPickerControl
 * @constructor
 */
export class SlickColumnPicker {
  protected _areVisibleColumnDifferent = false;
  protected _bindEventService: BindingEventService;
  protected _columns: Column[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _gridUid = '';
  protected _listElm!: HTMLSpanElement;
  protected _menuElm!: HTMLDivElement;
  protected _columnCheckboxes: HTMLInputElement[] = [];
  onColumnsChanged = new Slick.Event();

  protected _defaults = {
    // the last 2 checkboxes titles
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    minHeight: 200,
    syncResizeTitle: 'Synchronous resize',
    headerColumnValueExtractor: (columnDef: Column) => columnDef.name
  } as ColumnPickerOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly pubSubService: BasePubSubService, protected readonly sharedService: SharedService) {
    this._bindEventService = new BindingEventService();
    this._eventHandler = new Slick.EventHandler();
    this._columns = this.sharedService.allColumns ?? [];
    this._gridUid = this.grid?.getUID?.() ?? '';

    this.init();
  }

  get addonOptions(): ColumnPickerOption {
    return this.gridOptions.columnPicker || {};
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
    this.addonOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'columnPicker');
    this.addonOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'columnPicker');
    this.addonOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'columnPicker');

    this._eventHandler.subscribe(this.grid.onHeaderContextMenu, this.handleHeaderContextMenu.bind(this) as EventListener);
    this._eventHandler.subscribe(this.grid.onColumnsReordered, updateColumnPickerOrder.bind(this) as EventListener);

    this._menuElm = createDomElement('div', {
      ariaExpanded: 'false',
      className: `slick-column-picker ${this._gridUid}`, role: 'menu',
      style: { display: 'none' },
    });

    // add Close button and optiona a Column list title
    addColumnTitleElementWhenDefined.call(this, this._menuElm);
    addCloseButtomElement.call(this, this._menuElm);

    this._listElm = createDomElement('div', { className: 'slick-column-picker-list', role: 'menu' });
    this._bindEventService.bind(this._menuElm, 'click', handleColumnPickerItemClick.bind(this) as EventListener, undefined, 'parent-menu');

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

  /** Translate the Column Picker headers and also the last 2 checkboxes */
  translateColumnPicker() {
    // update the properties by pointers, that is the only way to get Column Picker Control to see the new values
    if (this.addonOptions) {
      this.addonOptions.columnTitle = '';
      this.addonOptions.forceFitTitle = '';
      this.addonOptions.syncResizeTitle = '';
      this.addonOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'columnPicker');
      this.addonOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'columnPicker');
      this.addonOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'columnPicker');
    }

    // translate all columns (including hidden columns)
    this.extensionUtility.translateItems(this._columns, 'nameKey', 'name');

    // update the Titles of each sections (command, commandTitle, ...)
    if (this.addonOptions) {
      this.updateAllTitles(this.addonOptions);
    }
  }

  // --
  // protected functions
  // ------------------

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMMouseOrTouchEvent<HTMLDivElement>) {
    if ((this._menuElm !== e.target && !this._menuElm.contains(e.target)) || (e.target.className === 'close' && e.target.closest('.slick-column-picker'))) {
      this._menuElm.setAttribute('aria-expanded', 'false');
      this._menuElm.style.display = 'none';
    }
  }

  /** Mouse header context handler when doing a right+click on any of the header column title */
  protected handleHeaderContextMenu(e: DOMMouseOrTouchEvent<HTMLDivElement>) {
    e.preventDefault();
    emptyElement(this._listElm);
    updateColumnPickerOrder.call(this);
    this._columnCheckboxes = [];

    populateColumnPicker.call(this, this.addonOptions);
    this.repositionMenu(e);
  }

  protected repositionMenu(event: DOMMouseOrTouchEvent<HTMLDivElement>) {
    const targetEvent: MouseEvent | Touch = (event as TouchEvent)?.touches?.[0] ?? event;
    this._menuElm.style.top = `${targetEvent.pageY - 10}px`;
    this._menuElm.style.left = `${targetEvent.pageX - 10}px`;
    this._menuElm.style.minHeight = findWidthOrDefault(this.addonOptions.minHeight, '');
    this._menuElm.style.maxHeight = findWidthOrDefault(this.addonOptions.maxHeight, `${window.innerHeight - targetEvent.clientY}px`);
    this._menuElm.style.display = 'block';
    this._menuElm.setAttribute('aria-expanded', 'true');
    this._menuElm.appendChild(this._listElm);
  }

  /** Update the Titles of each sections (command, commandTitle, ...) */
  protected updateAllTitles(options: ColumnPickerOption) {
    if (this._columnTitleElm?.textContent && options.columnTitle) {
      this._columnTitleElm.textContent = options.columnTitle;
    }
  }
}