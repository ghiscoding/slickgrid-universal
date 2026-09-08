import type { EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, emptyElement } from '@slickgrid-universal/utils';
import { SlickEventHandler } from '../core/slickCore.js';
import { type SlickDataView } from '../core/slickDataView.js';
import { type SlickGrid } from '../core/slickGrid.js';
import type { ExtensionUtility } from '../extensions/extensionUtility.js';
import type { GridOption } from './../interfaces/index.js';

export class HeaderGroupingService {
  readonly pluginName = 'HeaderGroupingService';
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _subscriptions: EventSubscription[] = [];
  protected _timer?: any;

  constructor(protected readonly extensionUtility: ExtensionUtility) {
    this._eventHandler = new SlickEventHandler();
  }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return this._grid?.getData<SlickDataView>() ?? {};
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return this._grid?.getOptions() ?? ({} as GridOption);
  }

  /**
   * Initialize the Service
   * @param {SlickGrid} grid
   */
  init(grid: SlickGrid): void {
    this._grid = grid;

    if (grid && this._gridOptions) {
      // When dealing with Pre-Header Grouping colspan, we need to re-create the pre-header in multiple occasions
      // for all these events, we have to trigger a re-create
      if (this._gridOptions.createPreHeaderPanel) {
        // if we use Translation, then we need to translate the first time
        if (this._gridOptions.enableTranslate) {
          this.translateHeaderGrouping();
        }

        this._eventHandler
          .subscribe(grid.onAfterUpdateColumns, () => this.renderPreHeaderRowGroupingTitles())
          .subscribe(grid.onColumnsReordered, () => this.renderPreHeaderRowGroupingTitles())
          .subscribe(grid.onRendered, () => this.renderPreHeaderRowGroupingTitles())
          .subscribe(grid.onAutosizeColumns, () => this.renderPreHeaderRowGroupingTitles())
          .subscribe(this._dataView.onRowCountChanged, () => this.delayRenderPreHeaderRowGroupingTitles(0));

        // also not sure why at this point, but it seems that I need to call the 1st create in a delayed execution
        // probably some kind of timing issues and delaying it until the grid is fully ready fixes this problem
        this.delayRenderPreHeaderRowGroupingTitles(75);
      }
    }
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    clearTimeout(this._timer);
    this._eventHandler.unsubscribeAll();
  }

  /** call "renderPreHeaderRowGroupingTitles()" with a setTimeout delay */
  delayRenderPreHeaderRowGroupingTitles(delay = 0): void {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.renderPreHeaderRowGroupingTitles(), delay);
  }

  /** Create or Render the Pre-Header Row Grouping Titles */
  renderPreHeaderRowGroupingTitles(): void {
    const colsCount = this._grid.getVisibleColumns().length;

    this.renderHeaderGroups(this._grid.getPreHeaderPanel(), 0, colsCount);
  }

  renderHeaderGroups(preHeaderPanel: HTMLElement, start: number, end: number): void {
    emptyElement(preHeaderPanel);
    preHeaderPanel.className = 'slick-header-columns';
    preHeaderPanel.style.removeProperty('left');
    preHeaderPanel.style.width = `${this._grid.getHeadersWidth()}px`;
    preHeaderPanel.parentElement?.classList.add('slick-header');

    const headerColumnWidthDiff = this._grid.getHeaderColumnWidthDiff();

    let colDef;
    let headerElm: HTMLDivElement | null = null;
    let lastColumnGroup = '';
    let widthTotal = 0;
    const visibleColumns = this._grid.getVisibleColumns();

    for (let i = start; i < end; i++) {
      colDef = visibleColumns[i];
      if (colDef) {
        if (lastColumnGroup === colDef.columnGroup && i > 0) {
          widthTotal += colDef.width || 0;
          if (headerElm?.style) {
            headerElm.style.width = `${widthTotal - headerColumnWidthDiff}px`;
          }
        } else {
          widthTotal = colDef.width || 0;
          headerElm = createDomElement('div', {
            className: 'slick-state-default slick-header-column',
            dataset: { group: colDef.columnGroup },
            style: { width: `${widthTotal - headerColumnWidthDiff}px` },
          });

          createDomElement('span', { className: 'slick-column-name', textContent: colDef.columnGroup || '' }, headerElm);

          preHeaderPanel.appendChild(headerElm);
        }
        lastColumnGroup = colDef.columnGroup || '';
      }
    }
  }

  /** Translate Column Group texts and re-render them afterward. */
  translateHeaderGrouping(): void {
    const currentColumns = this._grid.getColumns();
    this.extensionUtility.translateItems(currentColumns, 'columnGroupKey', 'columnGroup');
    this._grid.updateColumns();
    this.renderPreHeaderRowGroupingTitles();
  }
}
