import { createDomElement, extend } from '@slickgrid-universal/utils';

import { SlickEventHandler, type SlickDataView, SlickGroup, type SlickGrid, type SlickEventData } from '../core/index';
import type {
  Column,
  Formatter,
  GridOption,
  GroupingFormatterItem,
  GroupItemMetadataProviderOption,
  ItemMetadata,
  OnClickEventArgs,
  SlickPlugin,
} from '../interfaces/index';

/**
 * Provides item metadata for group (SlickGroup) and totals (SlickTotals) rows produced by the DataView.
 * This metadata overrides the default behavior and formatting of those rows so that they appear and function
 * correctly when processed by the grid.
 *
 * This class also acts as a grid plugin providing event handlers to expand & collapse groups.
 * If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
 */
export class SlickGroupItemMetadataProvider implements SlickPlugin {
  pluginName = 'GroupItemMetadataProvider' as const;
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _options: GroupItemMetadataProviderOption;
  protected _defaults: GroupItemMetadataProviderOption = {
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
  };

  constructor(inputOptions?: GroupItemMetadataProviderOption) {
    this._eventHandler = new SlickEventHandler();
    this._options = extend<GroupItemMetadataProviderOption>(true, {}, this._defaults, inputOptions);
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter of SlickGrid DataView object */
  protected get dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>() ?? {};
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions() || {};
  }

  init(grid: SlickGrid, inputOptions?: GroupItemMetadataProviderOption): void {
    this._grid = grid;
    this._options = { ...this._defaults, ...inputOptions };

    this._eventHandler.subscribe(grid.onClick, this.handleGridClick.bind(this));
    this._eventHandler.subscribe(grid.onKeyDown, this.handleGridKeyDown.bind(this));
  }

  destroy(): void {
    this.dispose();
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    this._eventHandler?.unsubscribeAll();
  }

  getOptions(): GroupItemMetadataProviderOption {
    return this._options;
  }

  setOptions(inputOptions: GroupItemMetadataProviderOption): void {
    this._options = { ...this._options, ...inputOptions };
  }

  getGroupRowMetadata(item: GroupingFormatterItem): ItemMetadata {
    return {
      selectable: false,
      focusable: this._options.groupFocusable,
      cssClasses: `${this._options.groupCssClass} slick-group-level-${item?.level || 0}`,
      formatter: (this._options.includeHeaderTotals && this._options.totalsFormatter) || undefined,
      columns: {
        0: {
          colspan: this._options.includeHeaderTotals ? '1' : '*',
          formatter: this._options.groupFormatter,
          editorClass: null
        }
      }
    };
  }

  getTotalsRowMetadata(item: { group: GroupingFormatterItem; }): { selectable: boolean; focusable: boolean | undefined; cssClasses: string; formatter: Formatter | undefined; editorClass: null; } {
    return {
      selectable: false,
      focusable: this._options.totalsFocusable,
      cssClasses: `${this._options.totalsCssClass} slick-group-level-${item?.group?.level || 0}`,
      formatter: this._options.totalsFormatter,
      editorClass: null
    };
  }

  //
  // protected functions
  // -------------------

  protected defaultGroupCellFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, item: any): any {
    if (!this._options.enableExpandCollapse) {
      return item.title;
    }

    const groupLevel = item.level || 0;
    const indentation = this._options?.indentation ?? 15;
    const marginLeft = `${groupLevel * indentation}px`;
    const toggleClass = item.collapsed ? this._options.toggleCollapsedCssClass : this._options.toggleExpandedCssClass;

    // use a DocumentFragment to avoid creating an extra div container
    const containerElm = this.gridOptions?.preventDocumentFragmentUsage ? document.createElement('span') : new DocumentFragment();

    // 1. group toggle span
    containerElm.appendChild(createDomElement('span', {
      className: `${this._options.toggleCssClass} ${toggleClass}`,
      ariaExpanded: String(!item.collapsed),
      style: { marginLeft }
    }));

    // 2. group title span
    const groupTitleElm = createDomElement('span', { className: this._options.groupTitleCssClass || '' });
    groupTitleElm.setAttribute('level', groupLevel);
    (item.title instanceof HTMLElement || item.title instanceof DocumentFragment)
      ? groupTitleElm.appendChild(item.title)
      : this._grid.applyHtmlCode(groupTitleElm, item.title ?? '');
    containerElm.appendChild(groupTitleElm);

    return containerElm;
  }

  protected defaultTotalsCellFormatter(_row: number, _cell: number, _value: any, columnDef: Column, item: any, grid: SlickGrid): string | HTMLElement {
    return columnDef?.groupTotalsFormatter?.(item, columnDef, grid) ?? '';
  }

  /** Handle a grid cell clicked, it could be a Group that is being collapsed/expanded or do nothing when it's not */
  protected handleGridClick(e: SlickEventData, args: OnClickEventArgs): void {
    const target = e.target as HTMLElement;
    const item = this._grid?.getDataItem(args.row);
    if (item instanceof SlickGroup && target.classList.contains(this._options.toggleCssClass || '')) {
      this.handleDataViewExpandOrCollapse(item);
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }

  /**
   * Handle a keyboard down event on a grouping cell.
   * TODO:  add -/+ handling
   */
  protected handleGridKeyDown(e: SlickEventData): void {
    if (this._options.enableExpandCollapse && (e.key === ' ')) {
      const activeCell = this._grid?.getActiveCell();
      if (activeCell) {
        const item = this._grid.getDataItem(activeCell.row);
        if (item instanceof SlickGroup) {
          this.handleDataViewExpandOrCollapse(item);
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }
    }
  }

  protected handleDataViewExpandOrCollapse(item: any): void {
    const range = this._grid?.getRenderedRange();
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