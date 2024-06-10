import type { BasePubSubService, EventSubscription } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, emptyElement } from '@slickgrid-universal/utils';

import type { Column, GridOption, SlickResizer, } from './../interfaces/index';
import type { ExtensionUtility } from '../extensions/extensionUtility';
import { type SlickDataView, SlickEventHandler, type SlickGrid } from '../core/index';

export class GroupingAndColspanService {
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _subscriptions: EventSubscription[] = [];

  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly pubSubService: BasePubSubService) {
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
    return this._grid?.getOptions() ?? {} as GridOption;
  }

  /** Getter for the Column Definitions pulled through the Grid Object */
  protected get _columnDefinitions(): Column[] {
    return this._grid?.getColumns() ?? [];
  }

  /**
   * Initialize the Service
   * @param {object} grid
   * @param {object} resizerPlugin
   */
  init(grid: SlickGrid): void {
    this._grid = grid;

    if (grid && this._gridOptions) {
      // When dealing with Pre-Header Grouping colspan, we need to re-create the pre-header in multiple occasions
      // for all these events, we have to trigger a re-create
      if (this._gridOptions.createPreHeaderPanel) {
        // if we use Translation, then we need to translate the first time
        if (this._gridOptions.enableTranslate) {
          this.translateGroupingAndColSpan();
        }

        this._eventHandler.subscribe(grid.onSort, () => this.renderPreHeaderRowGroupingTitles());
        this._eventHandler.subscribe(grid.onRendered, () => this.renderPreHeaderRowGroupingTitles());
        this._eventHandler.subscribe(grid.onAutosizeColumns, () => this.renderPreHeaderRowGroupingTitles());
        this._eventHandler.subscribe(grid.onColumnsResized, () => this.renderPreHeaderRowGroupingTitles());
        this._eventHandler.subscribe(grid.onColumnsReordered, () => this.renderPreHeaderRowGroupingTitles());
        this._eventHandler.subscribe(this._dataView.onRowCountChanged, () => this.delayRenderPreHeaderRowGroupingTitles(0));

        // for both picker (columnPicker/gridMenu) we also need to re-create after hiding/showing columns
        this._subscriptions.push(
          this.pubSubService.subscribe(`onColumnPickerColumnsChanged`, () => this.renderPreHeaderRowGroupingTitles()),
          this.pubSubService.subscribe('onHeaderMenuHideColumns', () => this.delayRenderPreHeaderRowGroupingTitles(0)),
          this.pubSubService.subscribe(`onGridMenuColumnsChanged`, () => this.renderPreHeaderRowGroupingTitles()),
          this.pubSubService.subscribe(`onGridMenuMenuClose`, () => this.renderPreHeaderRowGroupingTitles()),
        );

        // we also need to re-create after a grid resize
        const resizerPlugin = grid.getPluginByName<SlickResizer>('Resizer');
        if (resizerPlugin?.onGridAfterResize) {
          this._eventHandler.subscribe(resizerPlugin.onGridAfterResize, () => this.renderPreHeaderRowGroupingTitles());
        }

        // and finally we need to re-create after user calls the Grid "setOptions" when changing from regular to frozen grid (and vice versa)
        this._eventHandler.subscribe(grid.onSetOptions, (_e, args) => {
          // when user changes frozen columns dynamically (e.g. from header menu), we need to re-render the pre-header of the grouping titles
          if (args?.optionsBefore?.frozenColumn !== args?.optionsAfter?.frozenColumn) {
            this.delayRenderPreHeaderRowGroupingTitles(0);
          }
        });

        // also not sure why at this point, but it seems that I need to call the 1st create in a delayed execution
        // probably some kind of timing issues and delaying it until the grid is fully ready fixes this problem
        this.delayRenderPreHeaderRowGroupingTitles(75);
      }
    }
  }

  dispose(): void {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  /** call "renderPreHeaderRowGroupingTitles()" with a setTimeout delay */
  delayRenderPreHeaderRowGroupingTitles(delay = 0): void {
    setTimeout(() => this.renderPreHeaderRowGroupingTitles(), delay);
  }

  /** Create or Render the Pre-Header Row Grouping Titles */
  renderPreHeaderRowGroupingTitles(): void {
    const colsCount = this._columnDefinitions.length;

    if (this._gridOptions?.frozenColumn !== undefined && this._gridOptions.frozenColumn >= 0) {
      const frozenCol = this._gridOptions.frozenColumn;

      // Add column groups to left panel
      this.renderHeaderGroups(this._grid.getPreHeaderPanelLeft(), 0, frozenCol + 1);

      // Add column groups to right panel
      this.renderHeaderGroups(this._grid.getPreHeaderPanelRight(), frozenCol + 1, colsCount);
    } else {
      // regular grid (not a frozen grid)
      this.renderHeaderGroups(this._grid.getPreHeaderPanel(), 0, colsCount);
    }
  }

  renderHeaderGroups(preHeaderPanel: HTMLElement, start: number, end: number): void {
    emptyElement(preHeaderPanel);
    preHeaderPanel.className = 'slick-header-columns';
    preHeaderPanel.style.left = '-1000px';
    preHeaderPanel.style.width = `${this._grid.getHeadersWidth()}px`;

    if (preHeaderPanel.parentElement) {
      preHeaderPanel.parentElement.classList.add('slick-header');
    }

    const headerColumnWidthDiff = this._grid.getHeaderColumnWidthDiff();

    let colDef;
    let headerElm: HTMLDivElement | null = null;
    let lastColumnGroup = '';
    let widthTotal = 0;
    const frozenHeaderWidthCalcDifferential = this._gridOptions?.frozenHeaderWidthCalcDifferential ?? 0;
    const isFrozenGrid = (this._gridOptions?.frozenColumn !== undefined && this._gridOptions.frozenColumn >= 0);

    for (let i = start; i < end; i++) {
      colDef = this._columnDefinitions[i];
      if (colDef) {
        if (lastColumnGroup === colDef.columnGroup && i > 0) {
          widthTotal += colDef.width || 0;
          if (headerElm?.style) {
            headerElm.style.width = `${widthTotal - headerColumnWidthDiff - frozenHeaderWidthCalcDifferential}px`; // remove possible frozen border
          }
        } else {
          widthTotal = colDef.width || 0;
          headerElm = createDomElement('div', {
            className: `slick-state-default slick-header-column ${isFrozenGrid ? 'frozen' : ''}`,
            style: { width: `${widthTotal - headerColumnWidthDiff}px` }
          });

          createDomElement('span', { className: 'slick-column-name', textContent: colDef.columnGroup || '' }, headerElm);

          preHeaderPanel.appendChild(headerElm);
        }
        lastColumnGroup = colDef.columnGroup || '';
      }
    }
  }

  /** Translate Column Group texts and re-render them afterward. */
  translateGroupingAndColSpan(): void {
    const currentColumnDefinitions = this._grid.getColumns();
    this.extensionUtility.translateItems(currentColumnDefinitions, 'columnGroupKey', 'columnGroup');
    this._grid.setColumns(currentColumnDefinitions);
    this.renderPreHeaderRowGroupingTitles();
  }
}
