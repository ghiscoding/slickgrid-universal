import { KeyCode } from '../enums/keyCode.enum';
import {
  Column,
  DOMEvent,
  GroupingFormatterItem,
  GroupItemMetadataProviderOption,
  OnClickEventArgs,
  SlickDataView,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
} from '../interfaces/index';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/**
 * Provides item metadata for group (Slick.Group) and totals (Slick.Totals) rows produced by the DataView.
 * This metadata overrides the default behavior and formatting of those rows so that they appear and function
 * correctly when processed by the grid.
 *
 * This class also acts as a grid plugin providing event handlers to expand & collapse groups.
 * If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
 */
export class SlickGroupItemMetadataProvider {
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _options: GroupItemMetadataProviderOption;
  protected _defaults = {
    groupCssClass: 'slick-group',
    groupTitleCssClass: 'slick-group-title',
    totalsCssClass: 'slick-group-totals',
    groupFocusable: true,
    indentation: 15,
    totalsFocusable: false,
    toggleCssClass: 'slick-group-toggle',
    toggleExpandedCssClass: 'expanded',
    toggleCollapsedCssClass: 'collapsed',
    enableExpandCollapse: true,
    groupFormatter: this.defaultGroupCellFormatter.bind(this),
    totalsFormatter: this.defaultTotalsCellFormatter.bind(this),
    includeHeaderTotals: false
  } as GroupItemMetadataProviderOption;

  constructor() {
    this._eventHandler = new Slick.EventHandler();
    this._options = this._defaults;
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter of SlickGrid DataView object */
  protected get dataView(): SlickDataView {
    return this._grid?.getData?.() ?? {} as SlickDataView;
  }

  get grid(): SlickGrid {
    return this._grid;
  }

  init(grid: SlickGrid, inputOptions?: GroupItemMetadataProviderOption) {
    this._grid = grid;
    this._options = { ...this._defaults, ...inputOptions };

    this._eventHandler.subscribe(grid.onClick, this.handleGridClick.bind(this) as EventListener);
    this._eventHandler.subscribe(grid.onKeyDown, this.handleGridKeyDown.bind(this) as EventListener);
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler?.unsubscribeAll();
  }

  getOptions(): GroupItemMetadataProviderOption {
    return this._options;
  }

  setOptions(inputOptions: GroupItemMetadataProviderOption) {
    this._options = { ...this._options, ...inputOptions };
  }

  getGroupRowMetadata(item: GroupingFormatterItem) {
    return {
      selectable: false,
      focusable: this._options.groupFocusable,
      cssClasses: `${this._options.groupCssClass} slick-group-level-${item?.level || 0}`,
      formatter: this._options.includeHeaderTotals && this._options.totalsFormatter,
      columns: {
        0: {
          colspan: this._options.includeHeaderTotals ? '1' : '*',
          formatter: this._options.groupFormatter,
          editor: null
        }
      }
    };
  }

  getTotalsRowMetadata(item: { group: GroupingFormatterItem }) {
    return {
      selectable: false,
      focusable: this._options.totalsFocusable,
      cssClasses: `${this._options.totalsCssClass} slick-group-level-${item?.group?.level || 0}`,
      formatter: this._options.totalsFormatter,
      editor: null
    };
  }

  //
  // protected functions
  // -------------------

  protected defaultGroupCellFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, item: any) {
    if (!this._options.enableExpandCollapse) {
      return item.title;
    }

    const groupLevel = item.level || 0;
    const indentation = this._options?.indentation ?? 15;
    const marginLeft = `${groupLevel * indentation}px`;
    const toggleClass = item.collapsed ? this._options.toggleCollapsedCssClass : this._options.toggleExpandedCssClass;

    return `<span class="${this._options.toggleCssClass} ${toggleClass}" aria-expanded="${!item.collapsed}" style="margin-left: ${marginLeft}"></span>` +
      `<span class="${this._options.groupTitleCssClass}" level="${groupLevel}">${item.title || ''}</span>`;
  }

  protected defaultTotalsCellFormatter(_row: number, _cell: number, _value: any, columnDef: Column, item: any, grid: SlickGrid) {
    return columnDef?.groupTotalsFormatter?.(item, columnDef, grid) ?? '';
  }

  /** Handle a grid cell clicked, it could be a Group that is being collapsed/expanded or do nothing when it's not */
  protected handleGridClick(e: DOMEvent<HTMLDivElement>, args: OnClickEventArgs) {
    const target = e.target;
    const item = this.grid.getDataItem(args.row);
    if (item instanceof Slick.Group && target.classList.contains(this._options.toggleCssClass || '')) {
      this.handleDataViewExpandOrCollapse(item);
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }

  /**
   * Handle a keyboard down event on a grouping cell.
   * TODO:  add -/+ handling
   */
  protected handleGridKeyDown(e: DOMEvent<HTMLDivElement> & { keyCode: number; which: number; }) {
    if (this._options.enableExpandCollapse && (e.keyCode === KeyCode.SPACE)) {
      const activeCell = this.grid.getActiveCell();
      if (activeCell) {
        const item = this.grid.getDataItem(activeCell.row);
        if (item instanceof Slick.Group) {
          this.handleDataViewExpandOrCollapse(item);
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }
    }
  }

  protected handleDataViewExpandOrCollapse(item: any) {
    const range = this.grid.getRenderedRange();
    this.dataView.setRefreshHints({
      ignoreDiffsBefore: range.top,
      ignoreDiffsAfter: range.bottom + 1
    });

    if (item.collapsed) {
      this.dataView.expandGroup(item.groupingKey);
    } else {
      this.dataView.collapseGroup(item.groupingKey);
    }
  }
}