import { BindingEventService } from '@slickgrid-universal/binding';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, emptyElement, findWidthOrDefault, getHtmlStringOutput } from '@slickgrid-universal/utils';

import type { Column, ColumnPickerOption, DOMMouseOrTouchEvent, GridOption, OnColumnsChangedArgs } from '../interfaces/index';
import type { ExtensionUtility } from '../extensions/extensionUtility';
import type { SharedService } from '../services/shared.service';
import {
  addColumnTitleElementWhenDefined,
  addCloseButtomElement,
  handleColumnPickerItemClick,
  populateColumnPicker,
  updateColumnPickerOrder
} from '../extensions/extensionCommonUtils';
import { SlickEvent, type SlickEventData, SlickEventHandler, type SlickGrid } from '../core/index';

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
  onColumnsChanged: SlickEvent<OnColumnsChangedArgs>;

  protected _areVisibleColumnDifferent = false;
  protected _bindEventService: BindingEventService;
  protected _columns: Column[] = [];
  protected _columnTitleElm!: HTMLDivElement;
  protected _eventHandler!: SlickEventHandler;
  protected _gridUid = '';
  protected _listElm!: HTMLSpanElement;
  protected _menuElm: HTMLDivElement | null = null;
  protected _columnCheckboxes: HTMLInputElement[] = [];

  protected _defaults = {
    // the last 2 checkboxes titles
    hideForceFitButton: false,
    hideSyncResizeButton: false,
    forceFitTitle: 'Force fit columns',
    minHeight: 200,
    syncResizeTitle: 'Synchronous resize',
    headerColumnValueExtractor: (columnDef: Column) => {
      return getHtmlStringOutput(columnDef.columnPickerLabel || columnDef.name || '', 'innerHTML');
    }
  } as ColumnPickerOption;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly pubSubService: BasePubSubService, protected readonly sharedService: SharedService) {
    this._bindEventService = new BindingEventService();
    this.onColumnsChanged = new SlickEvent<OnColumnsChangedArgs>('onColumnsChanged');
    this._eventHandler = new SlickEventHandler();
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

  get menuElement(): HTMLDivElement | null {
    return this._menuElm;
  }

  /** Initialize plugin. */
  init(): void {
    this._gridUid = this.grid.getUID() ?? '';
    this.gridOptions.columnPicker = { ...this._defaults, ...this.gridOptions.columnPicker };

    // add PubSub instance to all SlickEvent
    this.onColumnsChanged.setPubSubService(this.pubSubService);

    // localization support for the picker
    this.addonOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'columnPicker');
    this.addonOptions.forceFitTitle = this.extensionUtility.getPickerTitleOutputString('forceFitTitle', 'columnPicker');
    this.addonOptions.syncResizeTitle = this.extensionUtility.getPickerTitleOutputString('syncResizeTitle', 'columnPicker');

    this._eventHandler.subscribe(this.grid.onPreHeaderContextMenu, (e) => {
      if (['slick-column-name', 'slick-header-column'].some(className => e.target?.classList.contains(className))) {
        this.handleHeaderContextMenu(e); // open picker only when preheader has column groups
      }
    });
    this._eventHandler.subscribe(this.grid.onHeaderContextMenu, this.handleHeaderContextMenu.bind(this));
    this._eventHandler.subscribe(this.grid.onColumnsReordered, updateColumnPickerOrder.bind(this));
    this._eventHandler.subscribe(this.grid.onClick, this.disposeMenu.bind(this));

    // Hide the menu on outside click.
    this._bindEventService.bind(document.body, 'mousedown', this.handleBodyMouseDown.bind(this) as EventListener, undefined, 'body');

    // destroy the picker if user leaves the page
    this._bindEventService.bind(document.body, 'beforeunload', this.dispose.bind(this) as EventListener, undefined, 'body');
  }

  /** Dispose (destroy) the SlickGrid 3rd party plugin */
  dispose(): void {
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
    this.disposeMenu();
  }

  disposeMenu(): void {
    this._bindEventService.unbindAll('parent-menu');
    this._listElm?.remove();
    this._menuElm?.remove();
    this._menuElm = null;
  }

  createPickerMenu(): HTMLDivElement {
    const menuElm = createDomElement('div', {
      ariaExpanded: 'true',
      className: `slick-column-picker ${this._gridUid}`,
      role: 'menu',
    });
    updateColumnPickerOrder.call(this);

    // add Close button and optiona a Column list title
    addColumnTitleElementWhenDefined.call(this, menuElm);
    addCloseButtomElement.call(this, menuElm);

    this._listElm = createDomElement('div', { className: 'slick-column-picker-list', role: 'menu' });
    this._bindEventService.bind(menuElm, 'click', handleColumnPickerItemClick.bind(this) as EventListener, undefined, 'parent-menu');

    document.body.appendChild(menuElm);

    return menuElm;
  }

  /**
   * Get all columns including hidden columns.
   * @returns {Array<Object>} - all columns array
   */
  getAllColumns(): Column[] {
    return this._columns;
  }

  /**
   * Get only the visible columns.
   * @returns {Array<Object>} - all columns array
   */
  getVisibleColumns(): Column[] {
    return this.grid.getColumns();
  }

  /** Translate the Column Picker headers and also the last 2 checkboxes */
  translateColumnPicker(): void {
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
    this.translateTitleLabels(this.addonOptions);
  }

  // --
  // protected functions
  // ------------------

  /** Mouse down handler when clicking anywhere in the DOM body */
  protected handleBodyMouseDown(e: DOMMouseOrTouchEvent<HTMLDivElement>): void {
    if ((this._menuElm !== e.target && !this._menuElm?.contains(e.target)) || (e.target.className === 'close' && e.target.closest('.slick-column-picker'))) {
      this.disposeMenu();
    }
  }

  /** Mouse header context handler when doing a right+click on any of the header column title */
  protected handleHeaderContextMenu(e: SlickEventData): void {
    e.preventDefault();
    emptyElement(this._menuElm);
    this._columnCheckboxes = [];

    this._menuElm = this.createPickerMenu();

    // add dark mode CSS class when enabled
    if (this.gridOptions.darkMode) {
      this._menuElm.classList.add('slick-dark-mode');
    }

    // load the column & create column picker list
    populateColumnPicker.call(this, this.addonOptions);
    document.body.appendChild(this._menuElm);

    this.repositionMenu(e);
  }

  protected repositionMenu(event: DOMMouseOrTouchEvent<HTMLDivElement> | SlickEventData): void {
    const targetEvent: MouseEvent | Touch = (event as TouchEvent)?.touches?.[0] ?? event;
    if (this._menuElm) {
      // auto-positioned menu left/right by available viewport space
      const gridPos = this.grid.getGridPosition();
      const menuWidth = this._menuElm.clientWidth || 0;
      let menuOffsetLeft = targetEvent.pageX || 0;
      if (gridPos?.width && (menuOffsetLeft + menuWidth >= gridPos.width)) {
        menuOffsetLeft = menuOffsetLeft - menuWidth;
      }

      this._menuElm.style.top = `${targetEvent.pageY - 10}px`;
      this._menuElm.style.left = `${menuOffsetLeft}px`;
      this._menuElm.style.minHeight = findWidthOrDefault(this.addonOptions.minHeight, '');
      this._menuElm.style.maxHeight = findWidthOrDefault(this.addonOptions.maxHeight, `${window.innerHeight - targetEvent.clientY}px`);
      this._menuElm.style.display = 'block';
      this._menuElm.ariaExpanded = 'true';
      this._menuElm.appendChild(this._listElm);
    }
  }

  /** Update the Titles of each sections (command, commandTitle, ...) */
  protected translateTitleLabels(pickerOptions: ColumnPickerOption): void {
    if (pickerOptions) {
      pickerOptions.columnTitle = this.extensionUtility.getPickerTitleOutputString('columnTitle', 'gridMenu');
    }
  }
}