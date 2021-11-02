import {
  Column,
  EventSubscription,
  GetSlickEventType,
  GridOption,
  SlickColumnPicker,
  SlickDataView,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  SlickResizer,
} from './../interfaces/index';
import { ExtensionName } from '../enums/index';
import { ExtensionUtility } from '../extensions/extensionUtility';
import { ExtensionService } from '../services/extension.service';
import { PubSubService } from './pubSub.service';
import { emptyElement } from './utilities';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class GroupingAndColspanService {
  protected _eventHandler: SlickEventHandler;
  protected _grid!: SlickGrid;
  protected _subscriptions: EventSubscription[] = [];

  constructor(protected readonly extensionUtility: ExtensionUtility, protected readonly extensionService: ExtensionService, protected readonly pubSubService: PubSubService,) {
    this._eventHandler = new Slick.EventHandler();
  }

  /** Getter of SlickGrid DataView object */
  get _dataView(): SlickDataView {
    return (this._grid?.getData && this._grid.getData()) as SlickDataView;
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  protected get _gridOptions(): GridOption {
    return (this._grid?.getOptions) ? this._grid.getOptions() : {};
  }

  /** Getter for the Column Definitions pulled through the Grid Object */
  protected get _columnDefinitions(): Column[] {
    return (this._grid && this._grid.getColumns) ? this._grid.getColumns() : [];
  }

  /**
   * Initialize the Service
   * @param {object} grid
   * @param {object} resizerPlugin
   */
  init(grid: SlickGrid) {
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
        const columnPickerExtension = this.extensionService.getExtensionByName<SlickColumnPicker>(ExtensionName.columnPicker);
        if (columnPickerExtension?.instance?.onColumnsChanged) {
          this._eventHandler.subscribe(columnPickerExtension.instance.onColumnsChanged, () => this.renderPreHeaderRowGroupingTitles());
        }
        this._subscriptions.push(
          this.pubSubService.subscribe('onHeaderMenuHideColumns', () => this.delayRenderPreHeaderRowGroupingTitles(0))
        );

        const gridMenuExtension = this.extensionService.getExtensionByName(ExtensionName.gridMenu);
        if (gridMenuExtension && gridMenuExtension.instance && gridMenuExtension.instance.onColumnsChanged && gridMenuExtension.instance.onMenuClose) {
          this._eventHandler.subscribe(gridMenuExtension.instance.onColumnsChanged, () => this.renderPreHeaderRowGroupingTitles());
          this._eventHandler.subscribe(gridMenuExtension.instance.onMenuClose, () => this.renderPreHeaderRowGroupingTitles());
        }

        // we also need to re-create after a grid resize
        const resizerPlugin = grid.getPluginByName<SlickResizer>('Resizer');
        if (resizerPlugin?.onGridAfterResize) {
          this._eventHandler.subscribe(resizerPlugin.onGridAfterResize, () => this.renderPreHeaderRowGroupingTitles());
        }

        // and finally we need to re-create after user calls the Grid "setOptions" when changing from regular to frozen grid (and vice versa)
        const onSetOptionsHandler = grid.onSetOptions;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onSetOptionsHandler>>).subscribe(onSetOptionsHandler, (_e, args) => {
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

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);
  }

  /** call "renderPreHeaderRowGroupingTitles()" with a setTimeout delay */
  delayRenderPreHeaderRowGroupingTitles(delay = 0) {
    setTimeout(() => this.renderPreHeaderRowGroupingTitles(), delay);
  }

  /** Create or Render the Pre-Header Row Grouping Titles */
  renderPreHeaderRowGroupingTitles() {
    if (this._gridOptions && this._gridOptions.frozenColumn !== undefined && this._gridOptions.frozenColumn >= 0) {
      // Add column groups to left panel
      let preHeaderPanelElm = this._grid.getPreHeaderPanelLeft();
      this.renderHeaderGroups(preHeaderPanelElm, 0, this._gridOptions.frozenColumn + 1);

      // Add column groups to right panel
      preHeaderPanelElm = this._grid.getPreHeaderPanelRight();
      this.renderHeaderGroups(preHeaderPanelElm, this._gridOptions?.frozenColumn + 1, this._columnDefinitions.length);
    } else {
      // regular grid (not a frozen grid)
      const preHeaderPanelElm = this._grid.getPreHeaderPanel();
      this.renderHeaderGroups(preHeaderPanelElm, 0, this._columnDefinitions.length);
    }
  }

  renderHeaderGroups(preHeaderPanel: HTMLElement, start: number, end: number) {
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
          headerElm = document.createElement('div');
          headerElm.className = `ui-state-default slick-header-column ${isFrozenGrid ? 'frozen' : ''}`;
          headerElm.style.width = `${widthTotal - headerColumnWidthDiff}px`;

          const spanColumnNameElm = document.createElement('span');
          spanColumnNameElm.className = 'slick-column-name';
          spanColumnNameElm.textContent = colDef.columnGroup || '';

          headerElm.appendChild(spanColumnNameElm);
          preHeaderPanel.appendChild(headerElm);
        }
        lastColumnGroup = colDef.columnGroup || '';
      }
    }
  }

  /** Translate Column Group texts and re-render them afterward. */
  translateGroupingAndColSpan() {
    const currentColumnDefinitions = this._grid.getColumns();
    this.extensionUtility.translateItems(currentColumnDefinitions, 'columnGroupKey', 'columnGroup');
    this._grid.setColumns(currentColumnDefinitions);
    this.renderPreHeaderRowGroupingTitles();
  }
}
