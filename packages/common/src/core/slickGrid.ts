import { BindingEventService } from '@slickgrid-universal/binding';
import {
  classNameToList,
  createDomElement,
  destroyAllElementProps,
  emptyElement,
  extend,
  getInnerSize,
  getOffset,
  insertAfterElement,
  isDefined,
  isDefinedNumber,
  isPrimitiveOrHTML,
  queueMicrotaskPolyfill,
  type CSSStyleDeclarationWritable,
} from '@slickgrid-universal/utils';
import type { Options as SortableOptions } from 'sortablejs';
import Sortable from 'sortablejs/modular/sortable.core.esm.js';
import type { TrustedHTML } from 'trusted-types/lib';
import type { SelectionModel } from '../enums/index.js';
import { copyCellToClipboard } from '../formatters/formatterUtilities.js';
import type {
  GridOption as BaseGridOption,
  CellPosition,
  CellSelectionMode,
  CellViewportRange,
  Column,
  ColumnDockingBand,
  ColumnDockingLayout,
  ColumnMetadata,
  ColumnPinningReferences,
  ColumnSort,
  CssStyleHash,
  CustomDataView,
  DockedRow,
  DockingSide,
  DOMEvent,
  DragPosition,
  DragRowMove,
  EditController,
  Editor,
  EditorArguments,
  EditorConstructor,
  ElementPosition,
  FormattedDataCachePlanner,
  Formatter,
  FormatterResultObject,
  FormatterResultWithHtml,
  FormatterResultWithText,
  InteractionBase,
  ItemMetadata,
  MultiColumnSort,
  OnActivateChangedOptionsEventArgs,
  OnActiveCellChangedEventArgs,
  OnAddNewRowEventArgs,
  OnAfterSetColumnsEventArgs,
  OnAutosizeColumnsEventArgs,
  OnBeforeAppendCellEventArgs,
  OnBeforeCellEditorDestroyEventArgs,
  OnBeforeColumnsResizeEventArgs,
  OnBeforeEditCellEventArgs,
  OnBeforeFooterRowCellDestroyEventArgs,
  OnBeforeHeaderCellDestroyEventArgs,
  OnBeforeHeaderRowCellDestroyEventArgs,
  OnBeforeSetColumnsEventArgs,
  OnCellChangeEventArgs,
  OnCellCssStylesChangedEventArgs,
  OnClickEventArgs,
  OnColumnsDragEventArgs,
  OnColumnsEventArgs,
  OnColumnsReorderedEventArgs,
  OnColumnsResizeDblClickEventArgs,
  OnColumnsResizedEventArgs,
  OnCompositeEditorChangeEventArgs,
  OnContextMenuArgs,
  OnDblClickEventArgs,
  OnDragReplaceCellsEventArgs,
  OnFooterClickEventArgs,
  OnFooterContextMenuEventArgs,
  OnFooterRowCellRenderedEventArgs,
  OnHeaderCellRenderedEventArgs,
  OnHeaderClickEventArgs,
  OnHeaderContextMenuEventArgs,
  OnHeaderKeyDownEventArgs,
  OnHeaderMouseEventArgs,
  OnHeaderRowCellRenderedEventArgs,
  OnKeyDownEventArgs,
  OnPreHeaderClickEventArgs,
  OnPreHeaderContextMenuEventArgs,
  OnRenderedEventArgs,
  OnScrollEventArgs,
  OnSelectedRowsChangedEventArgs,
  OnSetOptionsEventArgs,
  OnValidationErrorEventArgs,
  PagingInfo,
  PinnedColumns,
  RowDockingLayout,
  SingleColumnSort,
  SlickPlugin,
} from '../interfaces/index.js';
import { DockingController } from './dockingController.js';
import {
  preClickClassName,
  RowPositionIndexer,
  SlickDragExtendHandle,
  SlickEvent,
  SlickEventData,
  SlickGlobalEditorLock,
  SlickRange,
  SlickSelectionUtils,
  Utils,
  type BasePubSub,
  type SlickEditorLock,
} from './slickCore.js';
import type { SlickDataView } from './slickDataView.js';
import { Draggable, MouseWheel, Resizable } from './slickInteractions.js';
import { applyHtmlToElement, runOptionalHtmlSanitizer } from './utils.js';

const COLUMN_AUTOSCROLL_DISTANCE_PX = 10;
const COLUMN_AUTOSCROLL_INTERVAL_MS = 30;
const RESIZE_AUTOSCROLL_BROWSER_EDGE_PX = 1;
const RESIZE_AUTOSCROLL_BROWSER_EDGE_LEFT_DELAY_MS = 300;
const RESIZE_AUTOSCROLL_BROWSER_EDGE_RIGHT_DELAY_MS = 1200;

/**
 * @license
 * (c) 2009-present Michael Leibman
 * michael{dot}leibman{at}gmail{dot}com
 * http://github.com/mleibman/slickgrid
 *
 * Distributed under MIT license.
 * All rights reserved.
 *
 * SlickGrid v5.1.0
 *
 * NOTES:
 *     Cell/row DOM manipulations are done directly bypassing JS DOM manipulation methods.
 *     This increases the speed dramatically,
 *  but can only be done safely because there are no event handlers
 *     or data associated with any cell/row DOM nodes.  Cell editors must make sure they implement .destroy()
 *     and do proper cleanup.
 */

// SlickGrid class implementation (available as SlickGrid)

interface RowCaching {
  rowNode: HTMLElement[] | null;
  cellRegions?: { center: HTMLElement; left: HTMLElement; right: HTMLElement };
  cellColSpans: Array<number | '*'>;
  cellNodesByColumnIdx: HTMLElement[];
  cellRenderQueue: any[];
  cellSpanFragments: Record<number, HTMLElement[]>;
  cellSpanSegments: Record<number, Array<{ start: number; end: number; band: ColumnDockingBand }>>;
}

const EMPTY_DOCKING_LAYOUT: ColumnDockingLayout = {
  center: [],
  centerWidth: 0,
  contentWidth: 0,
  left: [],
  leftBaseWidth: 0,
  leftWidth: 0,
  revision: 0,
  right: [],
  rightBaseWidth: 0,
  rightWidth: 0,
};

const EMPTY_ROW_DOCKING_LAYOUT: RowDockingLayout = {
  bottom: [],
  bottomHeight: 0,
  center: [],
  revision: 0,
  top: [],
  topHeight: 0,
};

export class SlickGrid<TData = any, C extends Column<TData> = Column<TData>, O extends BaseGridOption<C> = BaseGridOption<C>> {
  // -- Public API

  // Events
  onActiveCellChanged: SlickEvent<OnActiveCellChangedEventArgs>;
  onActiveCellPositionChanged: SlickEvent<{ grid: SlickGrid }>;
  onActivateChangedOptions: SlickEvent<OnActivateChangedOptionsEventArgs>;
  onAddNewRow: SlickEvent<OnAddNewRowEventArgs>;
  onAfterSetColumns: SlickEvent<OnAfterSetColumnsEventArgs>;
  onAutosizeColumns: SlickEvent<OnAutosizeColumnsEventArgs>;
  onBeforeAppendCell: SlickEvent<OnBeforeAppendCellEventArgs>;
  onBeforeCellEditorDestroy: SlickEvent<OnBeforeCellEditorDestroyEventArgs>;
  onBeforeColumnsResize: SlickEvent<OnBeforeColumnsResizeEventArgs>;
  onBeforeDestroy: SlickEvent<{ grid: SlickGrid }>;
  onBeforeEditCell: SlickEvent<OnBeforeEditCellEventArgs>;
  onBeforeFooterRowCellDestroy: SlickEvent<OnBeforeFooterRowCellDestroyEventArgs>;
  onBeforeHeaderCellDestroy: SlickEvent<OnBeforeHeaderCellDestroyEventArgs>;
  onBeforeHeaderRowCellDestroy: SlickEvent<OnBeforeHeaderRowCellDestroyEventArgs>;
  onBeforeRemoveCachedRow: SlickEvent<{ row: number; grid: SlickGrid }>;
  onBeforeSetColumns: SlickEvent<OnBeforeSetColumnsEventArgs>;
  onBeforeSort: SlickEvent<SingleColumnSort | MultiColumnSort>;
  onBeforeUpdateColumns: SlickEvent<OnColumnsEventArgs>;
  onAfterUpdateColumns: SlickEvent<OnColumnsEventArgs>;
  onCellChange: SlickEvent<OnCellChangeEventArgs>;
  onCellCssStylesChanged: SlickEvent<OnCellCssStylesChangedEventArgs>;
  onClick: SlickEvent<OnClickEventArgs>;
  onColumnsReordered: SlickEvent<OnColumnsReorderedEventArgs>;
  onColumnsDrag: SlickEvent<OnColumnsDragEventArgs>;
  onColumnsResized: SlickEvent<OnColumnsResizedEventArgs>;
  onColumnsResizeDblClick: SlickEvent<OnColumnsResizeDblClickEventArgs>;
  onCompositeEditorChange: SlickEvent<OnCompositeEditorChangeEventArgs>;
  onContextMenu: SlickEvent<OnContextMenuArgs>;
  onDblClick: SlickEvent<OnDblClickEventArgs>;
  onDrag: SlickEvent<DragRowMove>;
  onDragInit: SlickEvent<DragRowMove>;
  onDragStart: SlickEvent<DragRowMove>;
  onDragEnd: SlickEvent<DragRowMove>;
  onFooterClick: SlickEvent<OnFooterClickEventArgs>;
  onFooterContextMenu: SlickEvent<OnFooterContextMenuEventArgs>;
  onFooterRowCellRendered: SlickEvent<OnFooterRowCellRenderedEventArgs>;
  onHeaderCellRendered: SlickEvent<OnHeaderCellRenderedEventArgs>;
  onHeaderClick: SlickEvent<OnHeaderClickEventArgs>;
  onHeaderContextMenu: SlickEvent<OnHeaderContextMenuEventArgs>;
  onHeaderMouseEnter: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderMouseLeave: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderMouseOver: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderMouseOut: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderKeyDown: SlickEvent<OnHeaderKeyDownEventArgs>;
  onHeaderRowCellRendered: SlickEvent<OnHeaderRowCellRenderedEventArgs>;
  onHeaderRowMouseEnter: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderRowMouseLeave: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderRowMouseOver: SlickEvent<OnHeaderMouseEventArgs>;
  onHeaderRowMouseOut: SlickEvent<OnHeaderMouseEventArgs>;
  onKeyDown: SlickEvent<OnKeyDownEventArgs>;
  onMouseEnter: SlickEvent<OnHeaderMouseEventArgs>;
  onMouseLeave: SlickEvent<OnHeaderMouseEventArgs>;
  onPreHeaderClick: SlickEvent<OnPreHeaderClickEventArgs>;
  onPreHeaderContextMenu: SlickEvent<OnPreHeaderContextMenuEventArgs>;
  onRendered: SlickEvent<OnRenderedEventArgs>;
  onScroll: SlickEvent<OnScrollEventArgs>;
  onSelectedRowsChanged: SlickEvent<OnSelectedRowsChangedEventArgs>;
  onSetOptions: SlickEvent<OnSetOptionsEventArgs>;
  onSort: SlickEvent<SingleColumnSort | MultiColumnSort>;
  onValidationError: SlickEvent<OnValidationErrorEventArgs>;
  onViewportChanged: SlickEvent<{ grid: SlickGrid }>;
  onDragReplaceCells: SlickEvent<OnDragReplaceCellsEventArgs>;

  // ---
  // protected variables

  // shared across all grids on the page
  protected scrollbarDimensions?: { height: number; width: number };
  protected maxSupportedCssHeight!: number; // browser's breaking point

  protected canvas: HTMLCanvasElement | null = null;
  protected canvas_context: CanvasRenderingContext2D | null = null;
  protected _isResizingColumn = false;
  protected _columnResizeAutoScrollTimer?: ReturnType<typeof setInterval>;
  protected _lastColumnGridMenuCompensation = 2; // when Grid Menu is enabled, we need to compensate the last column width by 2px to give room for the column resize handle between the last column and the grid menu button

  // settings
  protected _options!: O;
  protected _defaults: BaseGridOption = {
    invalidColumnPinningPickerCallback: (error) => alert(error),
    invalidColumnPinningWidthCallback: (error) => alert(error),
    invalidColumnPinningWidthMessage:
      '[SlickGrid] You are trying to pin more columns than the grid can support. ' +
      'Make sure to have less columns pinned (on the left) than the actual visible grid width.',
    invalidColumnPinningPickerMessage:
      '[SlickGrid] Action not allowed and aborted, you need to have at least one or more column in the center section of the grid. ' +
      'You could alternatively unpin columns before trying again.',
    invalidColumnPinningSequenceMessage:
      '[SlickGrid] Action not allowed and aborted because pinning would split a colspan across the grid in a non-sequential order. ' +
      'Pin columns from the left or right edge without skipping columns.',
    skipPinningValidation: false,
    allowDragFromClosest: 'div.slick-cell.dnd, div.slick-cell.cell-reorder',
    alwaysShowVerticalScroll: false,
    alwaysAllowHorizontalScroll: false,
    enableVariableRowHeight: false,
    explicitInitialization: false,
    rowHeight: 25,
    rowHeightProvider: (grid, row) => grid.getItemMetadaWhenExists(row)?.height,
    defaultColumnWidth: 80,
    enableHtmlRendering: true,
    enableAddRow: false,
    leaveSpaceForNewRows: false,
    editable: false,
    autoEdit: true,
    autoEditNewRow: true,
    autoCommitEdit: false,
    suppressActiveCellChangeOnEdit: false,
    enableCellNavigation: true,
    enableColumnReorder: true,
    unorderableColumnCssClass: 'unorderable',
    asyncEditorLoading: false,
    asyncEditorLoadDelay: 100,
    forceFitColumns: false,
    autoHeaderHeight: false,
    autoScrollOnColumnResize: true,
    autoScrollResizeLeftDelay: RESIZE_AUTOSCROLL_BROWSER_EDGE_LEFT_DELAY_MS,
    autoScrollResizeRightDelay: RESIZE_AUTOSCROLL_BROWSER_EDGE_RIGHT_DELAY_MS,
    enableAsyncPostRender: false,
    asyncPostRenderDelay: 50,
    enableAsyncPostRenderCleanup: false,
    asyncPostRenderCleanupDelay: 40,
    columnResizingDelay: 300,
    nonce: '',
    editorLock: SlickGlobalEditorLock,
    showColumnHeader: true,
    showHeaderRow: false,
    headerRowHeight: 25,
    createFooterRow: false,
    showFooterRow: false,
    footerRowHeight: 25,
    createPreHeaderPanel: false,
    createTopHeaderPanel: false,
    showPreHeaderPanel: false,
    showTopHeaderPanel: false,
    preHeaderPanelHeight: 25,
    preHeaderPanelWidth: 'auto', // mostly useful for Draggable Grouping dropzone to take full width
    topHeaderPanelHeight: 25,
    topHeaderPanelWidth: 'auto', // mostly useful for Draggable Grouping dropzone to take full width
    showTopPanel: false,
    topPanelHeight: 25,
    formatterFactory: null,
    editorFactory: null,
    cellFlashingCssClass: 'flashing',
    rowHighlightCssClass: 'highlight-animate',
    rowHighlightDuration: 400,
    selectedCellCssClass: 'selected',
    multiSelect: true,
    enableCellRowSpan: false,
    enableTextSelectionOnCells: false,
    dataItemColumnValueExtractor: null,
    docking: {
      maxColumnViewportWidthPercent: 60,
      maxRowViewportHeightPercent: 60,
      overflowStrategy: 'conveyor',
      stickyHysteresis: 2,
    },
    fullWidthRows: false,
    multiColumnSort: false,
    numberedMultiColumnSort: false,
    tristateMultiColumnSort: false,
    sortColNumberInSeparateSpan: false,
    defaultFormatter: this.defaultFormatter,
    forceSyncScrolling: false,
    addNewRowCssClass: 'new-row',
    preserveCopiedSelectionOnPaste: false,
    preventDragFromKeys: ['ctrlKey', 'metaKey'],
    showCellSelection: true,
    viewportClass: undefined,
    minRowBuffer: 3,
    emulatePagingWhenScrolling: true, // when scrolling off bottom of viewport, place new row at top of viewport
    editorCellNavOnLRKeys: false,
    enableMouseWheelScrollHandler: true,
    doPaging: true,
    rowTopOffsetRenderType: 'top',
    rtl: false,
    scrollRenderThrottling: 10,
    suppressCssChangesOnHiddenInit: false,
    ffMaxSupportedCssHeight: 6000000,
    maxSupportedCssHeight: 1000000000,
    maxPartialRowSpanRemap: 5000,
    sanitizer: undefined, // sanitize function
    mixinDefaults: false,
    shadowRoot: undefined,
  };

  protected _columnDefaults = {
    name: '',
    headerCssClass: null,
    defaultSortAsc: true,
    focusable: true,
    hidden: false,
    minWidth: 30,
    maxWidth: undefined,
    rerenderOnResize: false,
    reorderable: true,
    resizable: true,
    sortable: false,
    selectable: true,
  } as Partial<C>;

  protected _columnResizeTimer?: any;
  protected _executionBlockTimer?: any;
  protected _flashCellTimer?: any;
  protected _highlightRowTimer?: any;

  // scroller
  protected th!: number; // virtual height
  protected h!: number; // real scrollable height
  protected ph!: number; // page height
  protected n!: number; // number of pages
  protected cj!: number; // "jumpiness" coefficient

  protected page = 0; // current page
  protected offset = 0; // current page offset
  protected vScrollDir = 1;
  protected _bindingEventService: BindingEventService = new BindingEventService();
  protected initialized = false;
  protected _container!: HTMLElement;
  protected uid = `slickgrid_${Math.round(1000000 * Math.random())}`;
  protected dragReplaceEl: SlickDragExtendHandle = new SlickDragExtendHandle(this.uid);
  protected _focusSink!: HTMLDivElement;
  protected _focusSink2!: HTMLDivElement;
  protected _groupHeaders: HTMLDivElement[] = [];
  protected _headerScroller: HTMLDivElement[] = [];
  protected _headers: HTMLDivElement[] = [];
  protected _headerRows!: HTMLDivElement[];
  protected _headerRowScroller!: HTMLDivElement[];
  protected _headerRowSpacerL!: HTMLDivElement;
  protected _headerRowSpacerR!: HTMLDivElement;
  protected _footerRow!: HTMLDivElement[];
  protected _footerRowScroller!: HTMLDivElement[];
  protected _footerRowSpacerL!: HTMLDivElement;
  protected _footerRowSpacerR!: HTMLDivElement;
  protected _preHeaderPanel!: HTMLDivElement;
  protected _preHeaderPanelScroller!: HTMLDivElement;
  protected _preHeaderPanelSpacer!: HTMLDivElement;
  protected _preHeaderPanelR!: HTMLDivElement;
  protected _preHeaderPanelScrollerR!: HTMLDivElement;
  protected _preHeaderPanelSpacerR!: HTMLDivElement;
  protected _topHeaderPanel!: HTMLDivElement;
  protected _topHeaderPanelScroller!: HTMLDivElement;
  protected _topHeaderPanelSpacer!: HTMLDivElement;
  protected _topPanelScrollers!: HTMLDivElement[];
  protected _topPanels!: HTMLDivElement[];
  protected _viewport!: HTMLDivElement[];
  protected _canvas!: HTMLDivElement[];
  protected _style?: HTMLStyleElement;
  protected stylesheet?: { cssRules: Array<{ selectorText: string }>; rules: Array<{ selectorText: string }> } | null;
  protected columnCssRulesL?: Array<{ selectorText: string }>;
  protected columnCssRulesR?: Array<{ selectorText: string }>;
  protected viewportH = 0;
  protected viewportW = 0;
  protected canvasWidth = 0;
  protected canvasWidthL = 0;
  protected canvasWidthR = 0;
  protected headersWidth = 0;
  protected headersWidthL = 0;
  protected headersWidthR = 0;
  protected viewportHasHScroll = false;
  protected viewportHasVScroll = false;
  protected headerColumnWidthDiff = 0;
  protected headerColumnHeightDiff = 0; // border+padding
  protected cellWidthDiff = 0;
  protected cellHeightDiff = 0;
  protected absoluteColumnMinWidth!: number;
  protected rowPositionIndexer?: RowPositionIndexer; // row top positions (variable row height mode only)
  protected rowHeightsDirty = true; // set when row heights may have changed; the index is rebuilt on the next updateRowCount()
  /** flag to indicate if an invalid pinning alert has been shown already or not */
  protected _invalidPinningAlerted = false;
  protected paneTopH = 0;
  protected paneBottomH = 0;
  protected viewportTopH = 0;
  protected viewportBottomH = 0;
  protected topPanelH = 0;
  protected headerRowH = 0;
  protected footerRowH = 0;

  protected tabbingDirection = 1;
  protected _activeCanvasNode!: HTMLDivElement;
  protected _activeViewportNode!: HTMLDivElement;
  protected activePosX!: number;
  protected activePosY!: number;
  protected activeRow!: number;
  protected activeCell!: number;
  protected activeCellNode: HTMLDivElement | null = null;
  protected currentEditor: Editor | null = null;
  protected serializedEditorValue: any;
  protected editController?: EditController;
  protected _prevDataLength = 0;
  protected _prevInvalidatedRowsCount = 0;
  protected _rowSpanIsCached = false;
  protected _colsWithRowSpanCache: { [colIdx: number]: Set<string> } = {};
  protected rowsCache: Record<number, RowCaching> = {};
  protected renderedRows = 0;
  protected numVisibleRows = 0;
  protected prevScrollTop = 0;
  protected scrollHeight = 0;
  protected scrollTop = 0;
  protected lastRenderedScrollTop = 0;
  protected lastRenderedScrollLeft = 0;
  protected prevScrollLeft = 0;
  protected scrollLeft = 0;
  protected selectionBottomRow!: number;
  protected selectionRightCell!: number;

  protected selectionModel?: SelectionModel;
  protected selectedRows: number[] = [];
  protected selectedRanges: SlickRange[] = [];

  protected plugins: SlickPlugin[] = [];
  protected cellCssClasses: CssStyleHash = Object.create(null);
  protected cellCssClassesByCell: CssStyleHash = Object.create(null);

  protected columnsById: Record<string, number> = Object.create(null);
  protected visibleColumnsById: Record<string, number> = Object.create(null);
  protected dockingController: DockingController<C> = new DockingController<C>();
  protected dockingLayout: ColumnDockingLayout = EMPTY_DOCKING_LAYOUT;
  protected dockingByColumn: Map<
    number,
    { band: ColumnDockingBand; naturalOffset: number; offset: number; sticky: boolean; width: number }
  > = new Map();
  protected rowDockingLayout: RowDockingLayout = EMPTY_ROW_DOCKING_LAYOUT;
  protected dockingByRow: Map<number, DockedRow> = new Map<number, DockedRow>();
  protected dockingRowIndexByReference: Map<number | string, number> = new Map<number | string, number>();
  protected dockingChromeByColumn: Map<number, HTMLElement[]> = new Map<number, HTMLElement[]>();
  protected sortColumns: ColumnSort[] = [];
  protected columnPosLeft: number[] = [];
  protected columnPosRight: number[] = [];

  protected pagingActive = false;
  protected pagingIsLastPage = false;

  protected scrollThrottle!: { enqueue: () => void; dequeue: () => void };
  /** Defers expensive horizontal virtual-cell renders so compositor offsets can paint first. */
  protected singleViewportRenderTimer?: number;
  /** Coalesces sticky-column resolution to one layout pass per animation frame. */
  protected stickyColumnLayoutFrame?: number;

  // async call handles
  protected h_editorLoader?: any;
  protected h_postrender?: any;
  protected h_postrenderCleanup?: any;
  protected postProcessedRows: any = {};
  protected postProcessToRow: number = null as any;
  protected postProcessFromRow: number = null as any;
  protected postProcessedCleanupQueue: Array<{
    actionType: string;
    groupId: number;
    node: HTMLElement | HTMLElement[];
    columnIdx?: number;
    rowIdx?: number;
  }> = [];
  protected postProcessgroupId = 0;

  // perf counters
  protected counter_rows_rendered = 0;
  protected counter_rows_removed = 0;

  protected _headerRoot!: HTMLDivElement;
  protected _contentRoot!: HTMLDivElement;
  protected _headerScrollerL!: HTMLDivElement;
  protected _headerScrollerR!: HTMLDivElement;
  protected _headerL!: HTMLDivElement;
  protected _headerR!: HTMLDivElement;
  protected _groupHeadersL!: HTMLDivElement;
  protected _groupHeadersR!: HTMLDivElement;
  protected _headerRowScrollerL!: HTMLDivElement;
  protected _headerRowScrollerR!: HTMLDivElement;
  protected _footerRowScrollerL!: HTMLDivElement;
  protected _footerRowScrollerR!: HTMLDivElement;
  protected _headerRowL!: HTMLDivElement;
  protected _headerRowR!: HTMLDivElement;
  protected _footerRowL!: HTMLDivElement;
  protected _footerRowR!: HTMLDivElement;
  protected _topPanelScrollerL!: HTMLDivElement;
  protected _topPanelScrollerR!: HTMLDivElement;
  protected _topPanelL!: HTMLDivElement;
  protected _topPanelR!: HTMLDivElement;
  protected _viewportNode!: HTMLDivElement;
  protected _canvasNode!: HTMLDivElement;
  protected _dockingOverlay?: HTMLDivElement;
  protected _dockingHorizontalScroller?: HTMLDivElement;
  protected _dockingHorizontalSpacer?: HTMLDivElement;
  /** Persistent semantic left/center/right wrappers for the single header roots. */
  protected dockingHeaderRegions?: Record<ColumnDockingBand, HTMLDivElement>;
  protected dockingHeaderRowRegions?: Record<ColumnDockingBand, HTMLDivElement>;
  protected dockingFooterRowRegions?: Record<ColumnDockingBand, HTMLDivElement>;
  protected _viewportScrollContainerX!: HTMLDivElement;
  protected _viewportScrollContainerY!: HTMLDivElement;
  protected _headerScrollContainer!: HTMLDivElement;
  protected _headerRowScrollContainer!: HTMLDivElement;
  protected _footerRowScrollContainer!: HTMLDivElement;

  // store css attributes if display:none is active in container or parent
  protected cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' };
  protected _hiddenParents: HTMLElement[] = [];
  protected oldProps: Array<Partial<CSSStyleDeclaration>> = [];
  protected columnResizeDragging = false;
  protected slickDraggableInstance: InteractionBase | null = null;
  protected slickMouseWheelInstances: Array<InteractionBase> = [];
  protected slickResizableInstances: Array<InteractionBase> = [];
  protected sortableSideLeftInstance?: ReturnType<typeof Sortable.create>;
  protected sortableSideCenterInstance?: ReturnType<typeof Sortable.create>;
  protected sortableSideRightInstance?: ReturnType<typeof Sortable.create>;
  protected _pubSubService?: BasePubSub;
  /** Original pin states for columns changed by the unified pinning option, keyed by stable column id. */
  protected pinningColumnsState: Map<number | string, Column['pinned']> = new Map();

  /**
   * Creates a new instance of the grid.
   * @class SlickGrid
   * @constructor
   * @param {Node} container - Container node to create the grid in.
   * @param {Array|Object} data - An array of objects for databinding or an external DataView.
   * @param {Array<C>} columns - An array of column definitions.
   * @param {Object} [options] - Grid Options
   * @param {Object} [externalPubSub] - optional External PubSub Service to use by SlickEvent
   **/
  constructor(
    protected readonly container: HTMLElement | string,
    protected data: CustomDataView<TData> | TData[],
    protected columns: C[],
    options: Partial<O>,
    protected readonly externalPubSub?: BasePubSub | undefined
  ) {
    this._container = typeof this.container === 'string' ? (document.querySelector(this.container) as HTMLDivElement) : this.container;

    if (!this._container) {
      throw new Error(`SlickGrid requires a valid container, ${this.container} does not exist in the DOM.`);
    }

    this._pubSubService = externalPubSub;
    this.onActiveCellChanged = new SlickEvent<OnActiveCellChangedEventArgs>('onActiveCellChanged', externalPubSub);
    this.onActiveCellPositionChanged = new SlickEvent<{ grid: SlickGrid }>('onActiveCellPositionChanged', externalPubSub);
    this.onAddNewRow = new SlickEvent<OnAddNewRowEventArgs>('onAddNewRow', externalPubSub);
    this.onAfterSetColumns = new SlickEvent<OnAfterSetColumnsEventArgs>('onAfterSetColumns', externalPubSub);
    this.onAutosizeColumns = new SlickEvent<OnAutosizeColumnsEventArgs>('onAutosizeColumns', externalPubSub);
    this.onBeforeAppendCell = new SlickEvent<OnBeforeAppendCellEventArgs>('onBeforeAppendCell', externalPubSub);
    this.onBeforeCellEditorDestroy = new SlickEvent<OnBeforeCellEditorDestroyEventArgs>('onBeforeCellEditorDestroy', externalPubSub);
    this.onBeforeColumnsResize = new SlickEvent<OnBeforeColumnsResizeEventArgs>('onBeforeColumnsResize', externalPubSub);
    this.onBeforeDestroy = new SlickEvent<{ grid: SlickGrid }>('onBeforeDestroy', externalPubSub);
    this.onBeforeEditCell = new SlickEvent<OnBeforeEditCellEventArgs>('onBeforeEditCell', externalPubSub);
    // prettier-ignore
    this.onBeforeFooterRowCellDestroy = new SlickEvent<OnBeforeFooterRowCellDestroyEventArgs>('onBeforeFooterRowCellDestroy', externalPubSub);
    this.onBeforeHeaderCellDestroy = new SlickEvent<OnBeforeHeaderCellDestroyEventArgs>('onBeforeHeaderCellDestroy', externalPubSub);
    // prettier-ignore
    this.onBeforeHeaderRowCellDestroy = new SlickEvent<OnBeforeHeaderRowCellDestroyEventArgs>('onBeforeHeaderRowCellDestroy', externalPubSub);
    this.onBeforeRemoveCachedRow = new SlickEvent<{ row: number; grid: SlickGrid }>('onRowRemovedFromCache', externalPubSub);
    this.onBeforeSetColumns = new SlickEvent<OnBeforeSetColumnsEventArgs>('onBeforeSetColumns', externalPubSub);
    this.onBeforeSort = new SlickEvent<SingleColumnSort | MultiColumnSort>('onBeforeSort', externalPubSub);
    this.onBeforeUpdateColumns = new SlickEvent<OnColumnsEventArgs>('onBeforeUpdateColumns', externalPubSub);
    this.onAfterUpdateColumns = new SlickEvent<OnColumnsEventArgs>('onBeforeUpdateColumns', externalPubSub);
    this.onCellChange = new SlickEvent<OnCellChangeEventArgs>('onCellChange', externalPubSub);
    this.onCellCssStylesChanged = new SlickEvent<OnCellCssStylesChangedEventArgs>('onCellCssStylesChanged', externalPubSub);
    this.onClick = new SlickEvent<OnClickEventArgs>('onClick', externalPubSub);
    this.onColumnsReordered = new SlickEvent<OnColumnsReorderedEventArgs>('onColumnsReordered', externalPubSub);
    this.onColumnsDrag = new SlickEvent<OnColumnsDragEventArgs>('onColumnsDrag', externalPubSub);
    this.onColumnsResized = new SlickEvent<OnColumnsResizedEventArgs>('onColumnsResized', externalPubSub);
    this.onColumnsResizeDblClick = new SlickEvent<OnColumnsResizeDblClickEventArgs>('onColumnsResizeDblClick', externalPubSub);
    this.onCompositeEditorChange = new SlickEvent<OnCompositeEditorChangeEventArgs>('onCompositeEditorChange', externalPubSub);
    this.onContextMenu = new SlickEvent<OnContextMenuArgs>('onContextMenu', externalPubSub);
    this.onDblClick = new SlickEvent<OnDblClickEventArgs>('onDblClick', externalPubSub);
    this.onDrag = new SlickEvent<DragRowMove>('onDrag', externalPubSub);
    this.onDragInit = new SlickEvent<DragRowMove>('onDragInit', externalPubSub);
    this.onDragStart = new SlickEvent<DragRowMove>('onDragStart', externalPubSub);
    this.onDragEnd = new SlickEvent<DragRowMove>('onDragEnd', externalPubSub);
    this.onFooterClick = new SlickEvent<OnFooterClickEventArgs>('onFooterClick', externalPubSub);
    this.onFooterContextMenu = new SlickEvent<OnFooterContextMenuEventArgs>('onFooterContextMenu', externalPubSub);
    this.onFooterRowCellRendered = new SlickEvent<OnFooterRowCellRenderedEventArgs>('onFooterRowCellRendered', externalPubSub);
    this.onHeaderCellRendered = new SlickEvent<OnHeaderCellRenderedEventArgs>('onHeaderCellRendered', externalPubSub);
    this.onHeaderClick = new SlickEvent<OnHeaderClickEventArgs>('onHeaderClick', externalPubSub);
    this.onHeaderContextMenu = new SlickEvent<OnHeaderContextMenuEventArgs>('onHeaderContextMenu', externalPubSub);
    this.onHeaderMouseEnter = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderMouseEnter', externalPubSub);
    this.onHeaderMouseLeave = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderMouseLeave', externalPubSub);
    this.onHeaderMouseOver = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderMouseOver', externalPubSub);
    this.onHeaderMouseOut = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderMouseOut', externalPubSub);
    this.onHeaderRowMouseOver = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderRowMouseOver', externalPubSub);
    this.onHeaderRowMouseOut = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderRowMouseOut', externalPubSub);
    this.onHeaderKeyDown = new SlickEvent<OnHeaderKeyDownEventArgs>('onHeaderKeyDown', externalPubSub);
    this.onHeaderRowCellRendered = new SlickEvent<OnHeaderRowCellRenderedEventArgs>('onHeaderRowCellRendered', externalPubSub);
    this.onHeaderRowMouseEnter = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderRowMouseEnter', externalPubSub);
    this.onHeaderRowMouseLeave = new SlickEvent<OnHeaderMouseEventArgs>('onHeaderRowMouseLeave', externalPubSub);
    this.onKeyDown = new SlickEvent<OnKeyDownEventArgs>('onKeyDown', externalPubSub);
    this.onMouseEnter = new SlickEvent<OnHeaderMouseEventArgs>('onMouseEnter', externalPubSub);
    this.onMouseLeave = new SlickEvent<OnHeaderMouseEventArgs>('onMouseLeave', externalPubSub);
    this.onPreHeaderClick = new SlickEvent<OnPreHeaderClickEventArgs>('onPreHeaderClick', externalPubSub);
    this.onPreHeaderContextMenu = new SlickEvent<OnPreHeaderContextMenuEventArgs>('onPreHeaderContextMenu', externalPubSub);
    this.onRendered = new SlickEvent<OnRenderedEventArgs>('onRendered', externalPubSub);
    this.onScroll = new SlickEvent<OnScrollEventArgs>('onScroll', externalPubSub);
    this.onSelectedRowsChanged = new SlickEvent<OnSelectedRowsChangedEventArgs>('onSelectedRowsChanged', externalPubSub);
    this.onSetOptions = new SlickEvent<OnSetOptionsEventArgs>('onSetOptions', externalPubSub);
    this.onActivateChangedOptions = new SlickEvent<OnActivateChangedOptionsEventArgs>('onActivateChangedOptions', externalPubSub);
    this.onSort = new SlickEvent<SingleColumnSort | MultiColumnSort>('onSort', externalPubSub);
    this.onValidationError = new SlickEvent<OnValidationErrorEventArgs>('onValidationError', externalPubSub);
    this.onViewportChanged = new SlickEvent<{ grid: SlickGrid }>('onViewportChanged', externalPubSub);
    this.onDragReplaceCells = new SlickEvent<OnDragReplaceCellsEventArgs>('onDragReplaceCells', externalPubSub);

    this.initialize(options);
    this.syncDataViewFormattedCachePlanner();
  }

  // Initialization

  /** Initializes the grid. */
  init(): void {
    // prettier-ignore
    const isZoomLevelUnsupported = this._options.enableVariableRowHeight || this._options.enableCellRowSpan || this._options.enableRowDetailView;
    if (!this._options.silenceWarnings && document.body.style.zoom && document.body.style.zoom !== '100%' && isZoomLevelUnsupported) {
      console.warn(
        '[Slickgrid] Zoom level other than 100% can cause subpar rendering in some configurations. ' +
          'SlickGrid relies on row positioning calculations that can drift with browser zoom.'
      );
    }
    this.finishInitialization();
  }

  protected initialize(options: Partial<O>): void {
    // calculate these only once and share between grid instances
    if (options?.mixinDefaults) {
      // use provided options and then assign defaults
      if (!this._options) {
        this._options = options as O;
      }
      Utils.applyDefaults(this._options, this._defaults);
    } else {
      this._options = extend<O>(true, {}, this._defaults, options);
    }
    this.scrollThrottle = this.actionThrottle(this.render.bind(this), this._options.scrollRenderThrottling as number);
    this.maxSupportedCssHeight = this.maxSupportedCssHeight || this.getMaxSupportedCssHeight();
    this.validateAndEnforceOptions();
    this.applyColumnPinningOptions(this.columns);
    this._columnDefaults.width = this._options.defaultColumnWidth;

    if (!this._options.suppressCssChangesOnHiddenInit) {
      this.cacheCssForHiddenInit();
    }

    this.updateColumnProps();

    this.editController = {
      commitCurrentEdit: this.commitCurrentEdit.bind(this),
      cancelCurrentEdit: this.cancelCurrentEdit.bind(this),
    };

    emptyElement(this._container);
    this._container.style.outline = String(0);
    this._container.classList.add(this.uid);
    this._container.classList.add('slick-widget');
    this._container.setAttribute('role', 'grid');
    this._container.setAttribute('aria-colcount', this.columns.length.toString());
    this._container.setAttribute('aria-rowcount', Array.isArray(this.data) ? this.data.length.toString() : '0');

    const containerStyles = getComputedStyle(this._container);
    if (!/relative|absolute|fixed/.test(containerStyles.position)) {
      this._container.style.position = 'relative';
    }

    const focusSinkParent = this._container.parentElement ?? this._container.ownerDocument?.body ?? this._container;

    this._focusSink = createDomElement(
      'div',
      { tabIndex: -1, style: { position: 'fixed', width: '0px', height: '0px', top: '0px', left: '0px', outline: '0px' } },
      focusSinkParent
    );

    if (this._options.createTopHeaderPanel) {
      this._topHeaderPanelScroller = createDomElement(
        'div',
        { className: 'slick-topheader-panel slick-state-default', style: { overflow: 'hidden', position: 'relative' } },
        this._container
      );
      this._topHeaderPanelScroller.appendChild(document.createElement('div'));
      this._topHeaderPanel = createDomElement('div', null, this._topHeaderPanelScroller);
      this._topHeaderPanelSpacer = createDomElement(
        'div',
        { style: { display: 'block', height: '1px', position: 'absolute', top: '0px', left: '0px' } },
        this._topHeaderPanelScroller
      );

      if (!this._options.showTopHeaderPanel) {
        Utils.hide(this._topHeaderPanelScroller);
      }
    }

    // The grid uses one live header and one live content root.
    this._headerRoot = createDomElement('div', { className: 'slick-header-root' }, this._container);
    this._contentRoot = createDomElement('div', { className: 'slick-content-root' }, this._container);

    if (this._options.createPreHeaderPanel) {
      const headerContainer = createDomElement('div', { className: 'slick-preheader-container' }, this._headerRoot);
      this._preHeaderPanelScroller = createDomElement(
        'div',
        { className: 'slick-preheader-panel slick-state-default', style: { overflow: 'hidden', position: 'relative' } },
        headerContainer
      );
      this._preHeaderPanelScroller.appendChild(document.createElement('div'));
      this._preHeaderPanel = createDomElement('div', null, this._preHeaderPanelScroller);
      this._preHeaderPanelSpacer = createDomElement(
        'div',
        { style: { display: 'block', height: '1px', position: 'absolute', top: '0px', left: '0px' } },
        this._preHeaderPanelScroller
      );

      this._preHeaderPanelScrollerR = this._preHeaderPanelScroller;
      this._preHeaderPanelR = this._preHeaderPanel;
      this._preHeaderPanelSpacerR = this._preHeaderPanelSpacer;

      if (!this._options.showPreHeaderPanel) {
        Utils.hide(this._preHeaderPanelScroller);
      }
    }

    // Append the header scroller containers
    const headerContainerL = createDomElement('div', { className: 'slick-header-container' }, this._headerRoot);
    this._headerScrollerL = createDomElement(
      'div',
      { className: 'slick-header slick-state-default slick-header-left', role: 'rowgroup' },
      headerContainerL
    );
    this._headerScrollerR = this._headerScrollerL;

    // Cache the header scroller containers
    this._headerScroller.push(this._headerScrollerL);

    // Append the columnn containers to the headers
    this._headerL = createDomElement(
      'div',
      { className: 'slick-header-columns slick-header-columns-left', role: 'row' },
      this._headerScrollerL
    );
    this._headerR = this._headerL;

    // Cache the header columns
    this._headers = [this._headerL];

    this._headerRowScrollerL = createDomElement(
      'div',
      { className: 'slick-headerrow slick-state-default', role: 'rowgroup' },
      this._contentRoot
    );
    this._headerRowScrollerR = this._headerRowScrollerL;

    this._headerRowScroller = [this._headerRowScrollerL];

    this._headerRowSpacerL = createDomElement(
      'div',
      { style: { display: 'block', height: '1px', position: 'absolute', top: '0px', left: '0px' } },
      this._headerRowScrollerL
    );
    this._headerRowSpacerR = this._headerRowSpacerL;

    this._headerRowL = createDomElement(
      'div',
      { className: 'slick-headerrow-columns slick-headerrow-columns-left', role: 'row' },
      this._headerRowScrollerL
    );
    this._headerRowR = this._headerRowL;

    this._headerRows = [this._headerRowL];

    // Append the top panel scroller
    this._topPanelScrollerL = createDomElement('div', { className: 'slick-top-panel-scroller slick-state-default' }, this._contentRoot);
    this._topPanelScrollerR = this._topPanelScrollerL;

    this._topPanelScrollers = [this._topPanelScrollerL];

    // Append the top panel
    this._topPanelL = createDomElement('div', { className: 'slick-top-panel', style: { width: '10000px' } }, this._topPanelScrollerL);
    this._topPanelR = this._topPanelL;

    this._topPanels = [this._topPanelL];

    if (!this._options.showColumnHeader) {
      this._headerScroller.forEach((el) => {
        Utils.hide(el);
      });
    }

    if (!this._options.showTopPanel) {
      this._topPanelScrollers.forEach((scroller) => {
        Utils.hide(scroller);
      });
    }

    if (!this._options.showHeaderRow) {
      this._headerRowScroller.forEach((scroller) => {
        Utils.hide(scroller);
      });
    }

    // Append the viewport
    this._viewportNode = createDomElement('div', { className: 'slick-viewport slick-viewport-top slick-viewport-left' }, this._contentRoot);

    // Cache the viewports
    this._viewport = [this._viewportNode];
    if (this._options.viewportClass) {
      this._viewport.forEach((view) => {
        view.classList.add(...classNameToList(this._options.viewportClass));
      });
    }

    // Default the active viewport
    this._activeViewportNode = this._viewportNode;

    // Append the canvas
    this._canvasNode = createDomElement('div', { className: 'grid-canvas grid-canvas-top grid-canvas-left' }, this._viewportNode);

    // Cache the canvases
    this._canvas = [this._canvasNode];

    this.scrollbarDimensions = this.scrollbarDimensions || this.measureScrollbar();
    const canvasWithScrollbarWidth = this.getCanvasWidth() + this.scrollbarDimensions.width;

    // Default the active canvas
    this._activeCanvasNode = this._canvasNode;

    // top-header
    if (this._topHeaderPanelSpacer) {
      Utils.width(this._topHeaderPanelSpacer, canvasWithScrollbarWidth);
    }

    // pre-header
    if (this._preHeaderPanelSpacer) {
      Utils.width(this._preHeaderPanelSpacer, canvasWithScrollbarWidth);
    }

    this._headers.forEach((el) => {
      Utils.width(el, this.getHeadersWidth());
    });

    Utils.width(this._headerRowSpacerL, canvasWithScrollbarWidth);
    Utils.width(this._headerRowSpacerR, canvasWithScrollbarWidth);

    // footer Row
    if (this._options.createFooterRow) {
      this.materializeFooterRow();
    }

    this._focusSink2 = this._focusSink.cloneNode(true) as HTMLDivElement;
    focusSinkParent.appendChild(this._focusSink2);

    if (!this._options.explicitInitialization) {
      this.finishInitialization();
    }

    this.applyRTL(this._options.rtl ?? false);
  }

  protected finishInitialization(): void {
    if (!this.initialized) {
      this.initialized = true;

      this.getViewportWidth();
      this.getViewportHeight();
      this.refreshDockingLayout();

      // header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
      // calculate the diff so we can set consistent sizes
      this.measureCellPaddingAndBorder();

      // disable all text selection in header (including input and textarea)
      this.disableSelection(this._headers);

      if (!this._options.enableTextSelectionOnCells) {
        // disable text selection in grid cells except in input and textarea elements
        this._viewport.forEach((view) => {
          this._bindingEventService.bind(view, 'selectstart', (event: Event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
              return;
            }
            event.preventDefault();
          });
        });
      }

      this.activateSingleViewportLayout();
      this.setScroller();
      this.setOverflow();

      this.updateColumnCaches();
      this.refreshRowDockingLayout(this.scrollTop, true);
      this.createColumnHeaders();
      this.createColumnFooter();
      this.setupColumnSort();
      this.createCssRules();
      this.resizeCanvas();

      if (this._options.autoHeaderHeight) {
        this.recalculateHeaderHeight();
      }
      this.bindAncestorScrollEvents();

      this._bindingEventService.bind(this._container, 'resize', this.resizeCanvas.bind(this));
      this._bindingEventService.bind(this._viewport, 'scroll', this.handleScroll.bind(this));
      if (this._dockingHorizontalScroller) {
        this._bindingEventService.bind(this._dockingHorizontalScroller, 'scroll', this.handleScroll.bind(this));
      }
      this._bindingEventService.bind(this._viewport, 'focus', () => {
        this._options.enableCellNavigation && this.focusGridCell();
      });

      if (this._options.enableMouseWheelScrollHandler) {
        this._viewport.forEach((view) => {
          this.slickMouseWheelInstances.push(
            MouseWheel({
              element: view,
              onMouseWheel: this.handleMouseWheel.bind(this),
            })
          );
        });
      }

      this._bindingEventService.bind(this._headerScroller, 'contextmenu', this.handleHeaderContextMenu.bind(this) as EventListener);
      this._bindingEventService.bind(this._headerScroller, 'click', this.handleHeaderClick.bind(this) as EventListener);
      this._bindingEventService.bind(this._headerRowScrollerL, 'scroll', this.handleHeaderRowScroll.bind(this) as EventListener);

      if (this._options.createFooterRow) {
        this._bindingEventService.bind(this._footerRow, 'contextmenu', this.handleFooterContextMenu.bind(this) as EventListener);
        this._bindingEventService.bind(this._footerRow, 'click', this.handleFooterClick.bind(this) as EventListener);
        this._bindingEventService.bind(this._footerRowScrollerL, 'scroll', this.handleFooterRowScroll.bind(this) as EventListener);
      }

      if (this._options.createTopHeaderPanel) {
        this._bindingEventService.bind(this._topHeaderPanelScroller, 'scroll', this.handleTopHeaderPanelScroll.bind(this) as EventListener);
      }

      if (this._options.createPreHeaderPanel) {
        this._bindingEventService.bind(this._preHeaderPanelScroller, 'scroll', this.handlePreHeaderPanelScroll.bind(this) as EventListener);
        this._bindingEventService.bind(
          [this._preHeaderPanelScroller, this._preHeaderPanelScrollerR],
          'contextmenu',
          this.handlePreHeaderContextMenu.bind(this) as EventListener
        );
        this._bindingEventService.bind(
          [this._preHeaderPanelScroller, this._preHeaderPanelScrollerR],
          'click',
          this.handlePreHeaderClick.bind(this) as EventListener
        );
      }

      this._bindingEventService.bind(this._focusSink, 'keydown', this.handleGridKeyDown.bind(this) as EventListener);
      this._bindingEventService.bind(this._focusSink2, 'keydown', this.handleGridKeyDown.bind(this) as EventListener);

      this._bindingEventService.bind(this._canvas, 'keydown', this.handleGridKeyDown.bind(this) as EventListener);
      this._bindingEventService.bind(this._canvas, 'click', this.handleClick.bind(this) as EventListener);
      this._bindingEventService.bind(this._canvas, 'dblclick', this.handleDblClick.bind(this) as EventListener);
      this._bindingEventService.bind(this._canvas, 'contextmenu', this.handleContextMenu.bind(this) as EventListener);
      this._bindingEventService.bind(this._canvas, 'mouseover', this.handleCellMouseOver.bind(this) as EventListener);
      this._bindingEventService.bind(this._canvas, 'mouseout', this.handleCellMouseOut.bind(this) as EventListener);
      // Pinned rows are moved out of the canvas into an optional overlay.
      // Bind the same cell interactions when a permanent or active sticky row
      // caused that overlay to be materialized.
      this.bindDockingOverlayEvents();
      this._bindingEventService.bind(this._container, 'keydown', this.handleContainerKeyDown.bind(this) as EventListener);

      if (Draggable) {
        const preventDragFromKeys =
          this._options.selectionOptions?.enableMultiSelection !== undefined
            ? this._options.preventDragFromKeys?.filter((key) => key !== 'ctrlKey' && key !== 'metaKey')
            : this._options.preventDragFromKeys;
        this.slickDraggableInstance = Draggable({
          containerElement: this._container,
          allowDragFrom: `div.slick-cell, div.${this.dragReplaceEl.cssClass}`,
          dragFromClassDetectArr: [{ tag: 'dragReplaceHandle', id: this.dragReplaceEl.id }],
          // the slick cell parent must always contain `.dnd` and/or `.cell-reorder` class to be identified as draggable
          allowDragFromClosest: this._options.allowDragFromClosest,
          preventDragFromKeys,
          onDragInit: this.handleDragInit.bind(this),
          onDragStart: this.handleDragStart.bind(this),
          onDrag: this.handleDrag.bind(this),
          onDragEnd: this.handleDragEnd.bind(this),
        });
      }

      if (!this._options.suppressCssChangesOnHiddenInit) {
        this.restoreCssFromHiddenInit();
      }
    }
  }

  /** handles "display:none" on container or container parents, related to issue: https://github.com/6pac/SlickGrid/issues/568 */
  cacheCssForHiddenInit(): void {
    this._hiddenParents = Utils.parents(this._container, ':hidden') as HTMLElement[];
    this.oldProps = [];
    this._hiddenParents.forEach((el) => {
      const old: Partial<CSSStyleDeclaration> = {};
      Object.keys(this.cssShow).forEach((name) => {
        if (this.cssShow) {
          old[name as any] = el.style[name as 'position' | 'visibility' | 'display'];
          el.style[name as any] = this.cssShow[name as 'position' | 'visibility' | 'display'];
        }
      });
      this.oldProps.push(old);
    });
  }

  restoreCssFromHiddenInit<P extends Partial<CSSStyleDeclarationWritable>>(): void {
    // finish handle display:none on container or container parents
    // - put values back the way they were
    let i = 0;
    if (this._hiddenParents) {
      this._hiddenParents.forEach((el) => {
        const old = this.oldProps[i++];
        Object.keys(this.cssShow).forEach((name) => {
          if (this.cssShow) {
            (el.style as unknown as P)[name as keyof P] = (old as any)[name];
          }
        });
      });
      this._hiddenParents.length = 0;
    }
  }

  /** Whether the row index belongs to a pinned row band. */
  protected isPinnedRowIdx(row: number): boolean {
    return this.dockingByRow.get(row)?.band !== undefined && this.dockingByRow.get(row)?.band !== 'center';
  }

  /** Register an external Plugin */
  registerPlugin<T extends SlickPlugin>(plugin: T): void {
    this.plugins.unshift(plugin);
    plugin.init(this as unknown as SlickGrid);
  }

  /** Unregister (destroy) an external Plugin */
  unregisterPlugin(plugin: SlickPlugin): void {
    for (let i = this.plugins.length; i >= 0; i--) {
      if (this.plugins[i] === plugin) {
        this.plugins[i]?.destroy();
        this.plugins.splice(i, 1);
        break;
      }
    }
  }

  /** Get a Plugin (addon) by its name */
  getPluginByName<P extends SlickPlugin | undefined = undefined>(name: string): P | undefined {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      if (this.plugins[i]?.pluginName === name) {
        return this.plugins[i] as P;
      }
    }
    return undefined;
  }

  getPubSubService(): BasePubSub | undefined {
    return this._pubSubService;
  }

  /**
   * Unregisters a current selection model and registers a new one. See the definition of SelectionModel for more information.
   * @param {Object} selectionModel A SelectionModel.
   */
  setSelectionModel(model: SelectionModel): void {
    if (this.selectionModel) {
      this.selectionModel.onSelectedRangesChanged.unsubscribe(this.handleSelectedRangesChanged.bind(this));
      this.selectionModel.destroy?.();
    }

    this.selectionModel = model;
    if (this.selectionModel) {
      this.selectionModel.init(this as unknown as SlickGrid);
      this.selectionModel.onSelectedRangesChanged.subscribe(this.handleSelectedRangesChanged.bind(this));
    }
  }

  /** Returns the current SelectionModel. See here for more information about SelectionModels. */
  getSelectionModel<T extends SelectionModel>(): T | undefined {
    return this.selectionModel as T;
  }

  /** Get Grid Canvas Node DOM Element */
  getCanvasNode(columnIdOrIdx?: number | string, rowIndex?: number): HTMLDivElement {
    return this._getContainerElement(this.getCanvases(), columnIdOrIdx, rowIndex) as HTMLDivElement;
  }

  /** Get the canvas DOM element */
  getActiveCanvasNode(e?: Event | SlickEventData): HTMLDivElement {
    if (e === undefined) {
      return this._activeCanvasNode;
    }

    if (e instanceof SlickEventData) {
      e = e.getNativeEvent<Event>();
    }

    this._activeCanvasNode =
      ((e as Event & { target: HTMLElement })?.target?.closest('.grid-canvas') as HTMLDivElement | null) ||
      this._activeCanvasNode ||
      this._canvasNode;
    return this._activeCanvasNode;
  }

  /** Get the canvas DOM element */
  getCanvases(): HTMLDivElement[] {
    return this._canvas;
  }

  /** Get the Viewport DOM node element */
  getViewportNode(columnIdOrIdx?: number | string, rowIndex?: number): HTMLElement | undefined {
    return this._getContainerElement(this.getViewports(), columnIdOrIdx, rowIndex);
  }

  /** Get all the Viewport node elements */
  getViewports(): HTMLDivElement[] {
    return this._viewport;
  }

  getActiveViewportNode(e: Event | SlickEventData): HTMLDivElement {
    this.setActiveViewportNode(e);

    return this._activeViewportNode;
  }

  /** Sets an active viewport node */
  setActiveViewportNode(e: Event | SlickEventData): HTMLDivElement {
    if (e instanceof SlickEventData) {
      e = e.getNativeEvent<Event>();
    }
    this._activeViewportNode =
      ((e as Event & { target: HTMLDivElement })?.target?.closest('.slick-viewport') as HTMLDivElement | null) ||
      this._activeViewportNode ||
      this._viewportNode;
    return this._activeViewportNode;
  }

  protected _getContainerElement(
    targetContainers: HTMLElement[],
    columnIdOrIdx?: number | string,
    rowIndex?: number
  ): HTMLElement | undefined {
    if (!targetContainers) {
      return;
    }
    if (!columnIdOrIdx) {
      columnIdOrIdx = 0;
    }
    if (!rowIndex) {
      rowIndex = 0;
    }

    const idx = typeof columnIdOrIdx === 'number' ? columnIdOrIdx : this.getColumnIndex(columnIdOrIdx);

    const isBottomSide = this.dockingByRow.get(rowIndex)?.band === 'bottom';
    const isRightSide = this.getColumnDockingBand(idx) === 'right';

    return targetContainers[(isBottomSide ? 2 : 0) + (isRightSide ? 1 : 0)];
  }

  protected measureScrollbar(): { width: number; height: number } {
    let className = '';
    this._viewport.forEach((v) => (className += v.className));
    const outerdiv = createDomElement(
      'div',
      {
        className,
        style: { position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'auto', width: '100px', height: '100px' },
      },
      document.body
    );
    const innerdiv = createDomElement('div', { style: { width: '200px', height: '200px', overflow: 'auto' } }, outerdiv);
    const dim = {
      width: outerdiv.offsetWidth - outerdiv.clientWidth,
      height: outerdiv.offsetHeight - outerdiv.clientHeight,
    };
    innerdiv.remove();
    outerdiv.remove();
    return dim;
  }

  /** Get the headers width in pixel */
  getHeadersWidth(): number {
    this.headersWidth = this.headersWidthL = this.headersWidthR = 0;
    const includeScrollbar = !this._options.autoHeight;

    for (let i = 0, ii = this.columns.length; i < ii; i++) {
      if (!this.columns[i] || this.columns[i].hidden) {
        continue;
      }
      const width = this.columns[i].width;
      if (this.getColumnDockingBand(i) === 'right') {
        this.headersWidthR += width || 0;
      } else {
        this.headersWidthL += width || 0;
      }
    }

    if (includeScrollbar) {
      // Attribute the scrollbar width to the active scrollable band: the right band
      // when columns are pinned, otherwise the left band.
      if (this.hasDockedColumns()) {
        this.headersWidthR += this.scrollbarDimensions?.width || 0;
      } else {
        this.headersWidthL += this.scrollbarDimensions?.width || 0;
      }
    }

    if (this.hasDockedColumns()) {
      this.headersWidthR = Math.max(this.headersWidthR, this.viewportW);
    } else {
      this.headersWidthL = Math.max(this.headersWidthL, this.viewportW);
    }

    this.headersWidth = this.headersWidthL + this.headersWidthR;
    return Math.max(this.headersWidth, this.viewportW);
  }

  /** Get the grid canvas width */
  getCanvasWidth(): number {
    const availableWidth = this.getViewportInnerWidth();
    let i = this.columns.length;

    this.canvasWidthL = this.canvasWidthR = 0;

    while (i--) {
      if (!this.columns[i] || this.columns[i].hidden) {
        continue;
      }

      if (this.getColumnDockingBand(i) === 'right') {
        this.canvasWidthR += this.columns[i].width || 0;
      } else {
        this.canvasWidthL += this.columns[i].width || 0;
      }
    }
    let totalRowWidth = this.canvasWidthL + this.canvasWidthR;
    if (this._options.fullWidthRows) {
      const extraWidth = Math.max(totalRowWidth, availableWidth) - totalRowWidth;
      if (extraWidth > 0) {
        totalRowWidth += extraWidth;
        if (this.hasDockedColumns()) {
          this.canvasWidthR += extraWidth;
        } else {
          this.canvasWidthL += extraWidth;
        }
      }
    }
    return totalRowWidth;
  }

  /**
   * Validate that pinned columns fit within the available grid width.
   * @param pinnedIndexes the columns to validate
   *  - if `undefined` it will do the condition check and never alert more than once
   *  - if `true` it will do the condition check and always alert even if it was called before
   *  - if `false` it will do the condition check but always skip the alert
   */
  protected validatePinnedColumnWidth(pinnedIndexes: Map<number, DockingSide>, forceAlert = false, columns: C[] = this.columns): boolean {
    const widths = { left: 0, right: 0 };
    pinnedIndexes.forEach((side, index) => {
      const column = columns[index];
      if (!column || column.hidden) {
        return;
      }
      const { minWidth = 0, maxWidth = 0, width = this._options.defaultColumnWidth! } = column;
      widths[side] += Math.min(maxWidth || Number.POSITIVE_INFINITY, Math.max(width, minWidth));
    });
    const viewportWidth = this._viewportNode?.clientWidth || this.getViewportInnerWidth() || Utils.width(this._container) || 0;
    if (viewportWidth > 0 && widths.left + widths.right >= viewportWidth && !this._options.skipPinningValidation) {
      if ((forceAlert || !this._invalidPinningAlerted) && this._options.invalidColumnPinningWidthCallback) {
        this._options.invalidColumnPinningWidthCallback(this._options.invalidColumnPinningWidthMessage!);
        this._invalidPinningAlerted = true;
      }
      return false;
    }
    return true;
  }

  /**
   * Validate that a pinning change leaves at least one visible center column.
   * @param {Number|String} [columnId] column id
   * @param {Boolean} [forceAlert] tri-state flag to alert when pinning is invalid
   * @param {Array<Column>} [colums] optionally provide new columns to validate
   *  - if `undefined` it will do the condition check and never alert more than once
   *  - if `true` it will do the condition check and always alert even if it was called before
   *  - if `false` it will do the condition check but always skip the alert
   */
  validateColumnPinning(columnId?: number | string, forceAlert = false, columns: C[] = this.columns): boolean {
    const hasColummnIdArg = columnId !== undefined;
    const prospectiveColumns = hasColummnIdArg
      ? columns.map((column) => (column?.id === columnId && !column.hidden ? { ...column, hidden: true } : column))
      : columns;
    const pinnedIndexes = this.getPinnedColumnIndexes(this._options.pinning?.columns);
    if (!this.validateColspanPinningSequence(pinnedIndexes, forceAlert, prospectiveColumns)) {
      return false;
    }
    const visibleIndexes = this.getVisibleColumnIndexes(prospectiveColumns);
    const hasCenterColumn = visibleIndexes.some((index) => !pinnedIndexes.has(index));
    if (!hasCenterColumn && visibleIndexes.length && !this._options.skipPinningValidation) {
      if ((forceAlert || !this._invalidPinningAlerted) && this._options.invalidColumnPinningPickerCallback) {
        this._options.invalidColumnPinningPickerCallback(this._options.invalidColumnPinningPickerMessage!);
        this._invalidPinningAlerted = true;
      }
      return false;
    }
    return this.validatePinnedColumnWidth(pinnedIndexes, forceAlert, prospectiveColumns);
  }

  protected updateCanvasWidth(forceColumnWidthsUpdate?: boolean): void {
    const oldCanvasWidth = this.canvasWidth;
    const oldCanvasWidthL = this.canvasWidthL;
    const oldCanvasWidthR = this.canvasWidthR;
    this.canvasWidth = this.getCanvasWidth();
    // A right-docked region is positioned at the visible edge, not immediately
    // after the last center column. Keep the one real canvas at least as wide
    // as the body viewport so an enlarged grid does not leave a blank area
    // between the center cells and the right pin. The natural column width is
    // still retained by dockingLayout for scroll/chrome coordinates.
    if (this.hasDockedColumns()) {
      this.canvasWidth = Math.max(this.canvasWidth, this.getDockingRenderedWidth());
      this.canvasWidthL = this.canvasWidth;
    }

    if (this._options.createTopHeaderPanel && !this._isResizingColumn) {
      const panelWidth = this._options.topHeaderPanelWidth ?? this.canvasWidth;
      this._topHeaderPanel.style.width = typeof panelWidth === 'string' ? panelWidth : `${panelWidth}px`;
    }
    const widthChanged =
      this.canvasWidth !== oldCanvasWidth || this.canvasWidthL !== oldCanvasWidthL || this.canvasWidthR !== oldCanvasWidthR;

    if (widthChanged) {
      Utils.width(this._canvasNode, this.canvasWidthL);

      this.getHeadersWidth();

      Utils.width(this._headerL, this.getDockingChromeRootWidth());
      // v11 uses one live content root for both pinned and center columns.
      this._headerRoot.style.left = '';
      this._contentRoot.style.left = '';
      Utils.width(this._headerRoot, '100%');
      Utils.width(this._contentRoot, '100%');
      Utils.width(this._headerRowScrollerL, '100%');
      Utils.width(this._headerRowL, this.canvasWidth);

      if (this._options.createFooterRow) {
        Utils.width(this._footerRowScrollerL, '100%');
        Utils.width(this._footerRowL, this.canvasWidth);
      }

      if (this._options.createPreHeaderPanel && !this._isResizingColumn) {
        const panelWidth = this._options.preHeaderPanelWidth ?? this.canvasWidth;
        this._preHeaderPanel.style.width = typeof panelWidth === 'string' ? panelWidth : `${panelWidth}px`;
      }
      Utils.width(this._viewportNode, '100%');

      if (this.rowDockingLayout.bottom.length > 0) {
        this._contentRoot.style.left = '';
      }
    }

    this.viewportHasHScroll = this.canvasWidth >= this.viewportW - (this.scrollbarDimensions?.width || 0);

    Utils.width(this._headerRowSpacerL, this.canvasWidth + (this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0));
    Utils.width(this._headerRowSpacerR, this.canvasWidth + (this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0));

    if (this._options.createFooterRow) {
      Utils.width(this._footerRowSpacerL, this.canvasWidth + (this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0));
      Utils.width(this._footerRowSpacerR, this.canvasWidth + (this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0));
    }

    this.updateDockingHorizontalScrollerDimensions();
    this.updateDockingOverlayDimensions();

    if (widthChanged || forceColumnWidthsUpdate) {
      this.applyColumnWidths();
      this.applyDockingToColumnChrome();
      this.applyDockingDimensionsToRows();
    }
  }

  /**
   * The docking layout's content width is the natural sum of column widths and
   * is used for virtual-scroll/chrome coordinates. Rows additionally need a
   * rendered width so a right pin remains at the viewport edge when the grid
   * is wider than its unpinned center columns.
   */
  protected getDockingRenderedWidth(): number {
    const viewportWidth = this._viewportNode?.clientWidth || this._dockingHorizontalScroller?.clientWidth || this.getViewportInnerWidth();
    return Math.max(this.dockingLayout.contentWidth, viewportWidth || this.viewportW);
  }

  /** Keep proxy-scrolled chrome and the canvas on the same logical track width. */
  protected getDockingChromeRootWidth(): number {
    return this.usesDockingChromeRegions() ? this.getDockingRenderedWidth() : this.headersWidthL;
  }

  protected getDockingRenderedCenterWidth(renderedWidth: number = this.getDockingRenderedWidth()): number {
    return Math.max(0, renderedWidth - this.dockingLayout.leftWidth - this.dockingLayout.rightWidth);
  }

  protected applyDockingDimensionsToRows(): void {
    const renderedWidth = this.getDockingRenderedWidth();
    const renderedCenterWidth = this.getDockingRenderedCenterWidth(renderedWidth);
    Object.values(this.rowsCache).forEach((cacheEntry) => {
      const row = cacheEntry.rowNode?.[0];
      if (!row?.classList.contains('slick-row-docked')) {
        return;
      }
      row.style.width = `${renderedWidth}px`;
      row.style.gridTemplateColumns = `${this.dockingLayout.leftWidth}px ${renderedCenterWidth}px ${this.dockingLayout.rightWidth}px`;
      const { left, center, right } = cacheEntry.cellRegions || {};
      if (left) {
        left.style.width = `${this.dockingLayout.leftWidth}px`;
        left.classList.toggle('slick-pinned-left-cells-active', this.dockingLayout.leftWidth > 0);
      }
      if (center) {
        center.style.width = `${renderedCenterWidth}px`;
      }
      if (right) {
        right.style.width = `${this.dockingLayout.rightWidth}px`;
        right.classList.toggle('slick-pinned-right-cells-active', this.dockingLayout.rightWidth > 0);
      }
      this.applyDockingScrollOffsetToRow(row, cacheEntry);
    });
  }

  protected applyDockingScrollOffsetToRow(row: HTMLElement, cacheEntry: RowCaching): void {
    if (!row.classList.contains('slick-row-docked') || !cacheEntry.cellRegions) {
      return;
    }
    if (this.hasDockingHorizontalScroller()) {
      return;
    }
    const viewportWidth = this._viewportScrollContainerX?.clientWidth || this.viewportW;
    const isOverlayRow = row.parentElement === this._dockingOverlay;
    row.style.left = isOverlayRow ? `${-this.scrollLeft}px` : '';
    // Regular rows stay in the native scrolling canvas, so the left region can
    // use CSS sticky positioning without a per-scroll transform. Overlay rows
    // are outside that scroll container and still need the compensating shift.
    cacheEntry.cellRegions.left.style.transform = isOverlayRow ? `translateX(${this.scrollLeft}px)` : '';
    cacheEntry.cellRegions.right.style.transform = `translateX(${this.scrollLeft + viewportWidth - this.dockingLayout.contentWidth}px)`;
  }

  protected applyDockingScrollOffsets(): void {
    if (this.hasDockingHorizontalScroller()) {
      return;
    }
    const hasRightDocking = this.dockingLayout.right.length > 0;
    Object.values(this.rowsCache).forEach((cacheEntry) => {
      const row = cacheEntry.rowNode?.[0];
      // Ordinary rows with only leading pinned columns use CSS sticky and do
      // not need a per-scroll style write. Keep the small overlay rows and
      // right-docked regions synchronized, since those are outside (or at the
      // far edge of) the native scrolling coordinate system.
      if (row && (row.parentElement === this._dockingOverlay || hasRightDocking)) {
        this.applyDockingScrollOffsetToRow(row, cacheEntry);
      }
    });
    this.applyDockingChromeScrollOffsets();
  }

  protected applyDockingChromeScrollOffsets(): void {
    if (this.hasDockingHorizontalScroller()) {
      return;
    }
    const viewportWidth = this._viewportScrollContainerX?.clientWidth || this.viewportW;
    for (const docking of [...this.dockingLayout.left, ...this.dockingLayout.right]) {
      const naturalOffset = docking.sticky
        ? this.dockingLayout.leftBaseWidth + docking.naturalOffset
        : docking.band === 'left'
          ? docking.offset
          : this.dockingLayout.contentWidth - this.dockingLayout.rightWidth + docking.offset;
      const dockedOffset =
        docking.band === 'left'
          ? this.scrollLeft + docking.offset
          : this.scrollLeft + viewportWidth - this.dockingLayout.rightWidth + docking.offset;
      this.dockingChromeByColumn
        .get(docking.index)
        ?.forEach((element) => (element.style.transform = `translateX(${dockedOffset - naturalOffset}px)`));
    }
  }

  protected disableSelection(target: HTMLElement[]): void {
    target.forEach((el) => {
      el.setAttribute('unselectable', 'on');
      (el.style as any).mozUserSelect = 'none';
      /* v8 ignore next */
      this._bindingEventService.bind(el, 'selectstart', () => false);
    });
  }

  protected getMaxSupportedCssHeight(): number {
    let supportedHeight = 1000000;
    // FF reports the height back but still renders blank after ~6M px
    // let testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
    const testUpTo = navigator.userAgent.toLowerCase().match(/firefox/)
      ? this._options.ffMaxSupportedCssHeight
      : this._options.maxSupportedCssHeight;
    const div = createDomElement('div', { style: { display: 'hidden' } }, document.body);
    const marker = createDomElement('div', { style: { position: 'absolute' } }, div);

    let condition = true;
    while (condition) {
      const test = supportedHeight * 2;
      Utils.height(div, test);
      const height = Utils.height(div);
      marker.style.top = `${test - 1}px`;
      const offsetTop = marker.offsetTop;

      /* v8 ignore else */
      if (test > testUpTo! || height !== test || offsetTop !== test - 1) {
        condition = false;
        break;
      } else {
        supportedHeight = test;
      }
    }

    div.remove();
    return supportedHeight;
  }

  /** Get grid unique identifier */
  getUID(): string {
    return this.uid;
  }

  /** Get Header Column Width Difference in pixel */
  getHeaderColumnWidthDiff(): number {
    return this.headerColumnWidthDiff;
  }

  /** Get scrollbar dimensions */
  getScrollbarDimensions(): { height: number; width: number } | undefined {
    return this.scrollbarDimensions;
  }

  /** Get the displayed scrollbar dimensions */
  getDisplayedScrollbarDimensions(): { width: number; height: number } {
    return {
      width: this.viewportHasVScroll && this.scrollbarDimensions?.width ? this.scrollbarDimensions.width : 0,
      height: this.viewportHasHScroll && this.scrollbarDimensions?.height ? this.scrollbarDimensions.height : 0,
    };
  }

  /** Get the absolute column minimum width */
  getAbsoluteColumnMinWidth(): number {
    return this.absoluteColumnMinWidth;
  }

  protected bindAncestorScrollEvents(): void {
    this._bindingEventService.bind(
      document,
      'scroll',
      (event) => {
        const target = event.target;
        if (this._viewport.includes(target as HTMLDivElement) || (target instanceof Node && target.contains(this._container))) {
          this.handleActiveCellPositionChange();
        }
      },
      true
    );
  }

  /**
   * Updates an existing column definition and a corresponding header DOM element with the new title and tooltip.
   * @param {Number|String} columnId Column id.
   * @param {string | HTMLElement | DocumentFragment} [title] New column name.
   * @param {String} [toolTip] New column tooltip.
   */
  updateColumnHeader(columnId: number | string, title?: string | HTMLElement | DocumentFragment, toolTip?: string): HTMLElement | void {
    if (this.initialized) {
      const idx = this.getColumnIndex(columnId);
      if (!isDefined(idx)) {
        return;
      }

      const columnDef = this.columns[idx];
      const header: HTMLElement | undefined = this.getColumnHeaderByIndex(idx);
      if (header) {
        if (title !== undefined) {
          this.columns[idx].name = title;
        }
        if (toolTip !== undefined) {
          this.columns[idx].toolTip = toolTip;
        }

        this.triggerEvent(this.onBeforeHeaderCellDestroy, {
          node: header,
          column: columnDef,
          grid: this,
        });

        header.setAttribute('title', toolTip || '');
        if (title !== undefined) {
          applyHtmlToElement(header.children[0] as HTMLElement, title, this._options);
        }

        this.triggerEvent(this.onHeaderCellRendered, {
          node: header,
          column: columnDef,
          grid: this,
        });
      }

      return header;
    }
  }

  /**
   * Get the Header DOM element
   * @param {C} columnDef - column definition
   */
  getHeader(columnDef?: C): HTMLDivElement | HTMLDivElement[] {
    if (!columnDef) {
      return this._headerL;
    }
    const idx = this.getColumnIndex(columnDef.id);
    return this.usesDockingChromeRegions() ? this.getDockingChromeRegion('header', this.getColumnDockingBand(idx)) : this._headerL;
  }

  /**
   * Get a specific Header Column DOM element by its column Id or index
   * @param {Number|String} columnIdOrIdx - column Id or index
   */
  getHeaderColumn(columnIdOrIdx: number | string): HTMLDivElement {
    const idx = typeof columnIdOrIdx === 'number' ? columnIdOrIdx : this.getColumnIndex(columnIdOrIdx);
    if (this.usesDockingChromeRegions()) {
      return this._headerL.querySelector(
        `.slick-header-column[data-id="${String(this.columns[idx]?.id ?? columnIdOrIdx)}"]`
      ) as HTMLDivElement;
    }
    const targetHeader = this._headerL;
    const targetIndex = idx;
    const directMatch = targetHeader.children[targetIndex] as HTMLDivElement | undefined;
    const targetColumnId = String(this.columns[idx]?.id ?? columnIdOrIdx);
    const directMatchColumn = Utils.storage.get(directMatch, 'column') as C | undefined;
    if (directMatch && (directMatch.dataset?.id === targetColumnId || String(directMatchColumn?.id) === targetColumnId)) {
      return directMatch;
    }

    return (
      (Array.from(targetHeader.children).find((child) => (child as HTMLDivElement).dataset?.id === targetColumnId) as HTMLDivElement) ||
      (undefined as any)
    );
  }

  /** Get the Header Row DOM element */
  getHeaderRow(): HTMLDivElement | HTMLDivElement[] {
    return this._headerRowL;
  }

  /** Get the Footer DOM element */
  getFooterRow(): HTMLDivElement | HTMLDivElement[] {
    return this._footerRowL;
  }

  /** @alias `getPreHeaderPanelLeft` */
  getPreHeaderPanel(): HTMLDivElement {
    return this._preHeaderPanel;
  }

  /** Get the Pre-Header Panel Left DOM node element */
  getPreHeaderPanelLeft(): HTMLDivElement {
    return this._preHeaderPanel;
  }

  /** Get the Pre-Header Panel Right DOM node element */
  getPreHeaderPanelRight(): HTMLDivElement {
    return this._preHeaderPanelR;
  }

  /** Get the Top-Header Panel DOM node element */
  getTopHeaderPanel(): HTMLDivElement {
    return this._topHeaderPanel;
  }

  /**
   * Get Header Row Column DOM element by its column Id or index
   * @param {Number|String} columnIdOrIdx - column Id or index
   */
  getHeaderRowColumn(columnIdOrIdx: number | string): HTMLDivElement {
    let idx = typeof columnIdOrIdx === 'number' ? columnIdOrIdx : this.getColumnIndex(columnIdOrIdx);
    if (this.usesDockingChromeRegions()) {
      return this._headerRowL.querySelector(`.slick-headerrow-column.l${idx}`) as HTMLDivElement;
    }
    const headerRowTarget = this._headerRowL;
    return (headerRowTarget.querySelector(`.slick-headerrow-column.l${idx}`) || headerRowTarget.children[idx]) as HTMLDivElement;
  }

  /**
   * Get the Footer Row Column DOM element by its column Id or index
   * @param {Number|String} columnIdOrIdx - column Id or index
   */
  getFooterRowColumn(columnIdOrIdx: number | string): HTMLDivElement {
    let idx = typeof columnIdOrIdx === 'number' ? columnIdOrIdx : this.getColumnIndex(columnIdOrIdx);
    if (this.usesDockingChromeRegions()) {
      return this._footerRowL?.querySelector(`.slick-footerrow-column.l${idx}`) as HTMLDivElement;
    }
    const footerRowTarget = this._footerRowL;
    return (footerRowTarget?.querySelector(`.slick-footerrow-column.l${idx}`) || footerRowTarget?.children[idx]) as HTMLDivElement;
  }

  protected createColumnFooter(): void {
    if (this._options.createFooterRow) {
      this._footerRow.forEach((footer) => {
        const columnElements = footer.querySelectorAll('.slick-footerrow-column');
        columnElements.forEach((column) => {
          const columnDef = Utils.storage.get(column, 'column');
          this.triggerEvent(this.onBeforeFooterRowCellDestroy, {
            node: column,
            column: columnDef,
            grid: this,
          });
        });
      });

      if (this.usesDockingChromeRegions()) {
        this.dockingFooterRowRegions = this.createDockingChromeRegionSet(this._footerRowL, 'slick-footerrow-columns');
      } else {
        this.resetDockingChromeRegionSet(this._footerRowL, 'slick-footerrow-columns', 'left');
        this.dockingFooterRowRegions = undefined;
      }
      if (this._footerRowR !== this._footerRowL) {
        emptyElement(this._footerRowR);
      }

      for (let i = 0; i < this.columns.length; i++) {
        const m = this.columns[i];
        if (!m || m.hidden) {
          continue;
        }

        const band = this.getColumnDockingBand(i);
        const footerRowCell = createDomElement(
          'div',
          { className: `slick-state-default slick-footerrow-column l${i} r${i}` },
          this.getDockingChromeRegion('footerRow', band)
        );
        const className = band !== 'center' ? 'pinned' : null;
        if (className) {
          footerRowCell.classList.add(className);
        }

        Utils.storage.put(footerRowCell, 'column', m);

        this.triggerEvent(this.onFooterRowCellRendered, {
          node: footerRowCell,
          column: m,
          grid: this,
        });
      }
      this.applyDockingToColumnChrome();
    }
  }

  /**
   * Builds the footer-row DOM (scrollers, spacers and footer-row containers) in both
   * panes — the single construction path shared by init and by a runtime
   * `setOptions({ createFooterRow: true })` enable. On an already-initialized grid it
   * also binds the footer events (during init they are bound in `finishInitialization`).
   * Runtime disable hides the footer rather than destroying it (symmetric with
   * `showFooterRow`).
   */
  protected materializeFooterRow(): void {
    const canvasWithScrollbarWidth = this.getCanvasWidth() + (this.scrollbarDimensions?.width || 0);

    this._footerRowScrollerL = createDomElement('div', { className: 'slick-footerrow slick-state-default' }, this._contentRoot);
    this._footerRowScrollerR = this._footerRowScrollerL;
    this._footerRowScroller = [this._footerRowScrollerL];

    this._footerRowSpacerL = createDomElement(
      'div',
      { style: { display: 'block', height: '1px', position: 'absolute', top: '0px', left: '0px' } },
      this._footerRowScrollerL
    );
    Utils.width(this._footerRowSpacerL, canvasWithScrollbarWidth);

    this._footerRowSpacerR = this._footerRowSpacerL;

    this._footerRowL = createDomElement(
      'div',
      { className: 'slick-footerrow-columns slick-footerrow-columns-left' },
      this._footerRowScrollerL
    );
    this._footerRowR = this._footerRowL;
    this._footerRow = [this._footerRowL];

    if (this.hasConfiguredColumnDocking()) {
      this.dockingFooterRowRegions = this.createDockingChromeRegionSet(this._footerRowL, 'slick-footerrow-columns');
    }

    if (!this._options.showFooterRow) {
      this._footerRowScroller.forEach((scroller) => {
        Utils.hide(scroller);
      });
    }

    // Bind footer events only when footer row is created after init.
    if (this.initialized) {
      this._bindingEventService.bind(this._footerRow, 'contextmenu', this.handleFooterContextMenu.bind(this) as EventListener);
      this._bindingEventService.bind(this._footerRow, 'click', this.handleFooterClick.bind(this) as EventListener);
      this._bindingEventService.bind(this._footerRowScroller, 'scroll', this.handleFooterRowScroll.bind(this) as EventListener);
    }
  }

  protected handleHeaderMouseHoverOn(e: Event | SlickEventData): void {
    (e as any)?.target.classList.add('slick-state-hover');
  }

  protected handleHeaderMouseHoverOff(e: Event | SlickEventData): void {
    (e as any)?.target.classList.remove('slick-state-hover');
  }

  protected createColumnHeaders(): void {
    this._bindingEventService.unbindAll('colheaders');
    this._headers.forEach((header) => {
      const columnElements = header.querySelectorAll('.slick-header-column');
      columnElements.forEach((column) => {
        const columnDef = Utils.storage.get(column, 'column');
        if (columnDef) {
          this.triggerEvent(this.onBeforeHeaderCellDestroy, {
            node: column,
            column: columnDef,
            grid: this,
          });
        }
      });
    });

    if (this.hasConfiguredColumnDocking()) {
      this.dockingHeaderRegions = this.createDockingChromeRegionSet(this._headerL, 'slick-header-columns');
      this.dockingHeaderRowRegions = this.createDockingChromeRegionSet(this._headerRowL, 'slick-headerrow-columns');
    } else {
      this.resetDockingChromeRegionSet(this._headerL, 'slick-header-columns', 'left');
      this.resetDockingChromeRegionSet(this._headerRowL, 'slick-headerrow-columns', 'left');
      this.dockingHeaderRegions = undefined;
      this.dockingHeaderRowRegions = undefined;
    }
    this.getHeadersWidth();

    Utils.width(this._headerL, this.getDockingChromeRootWidth());

    this._headerRows.forEach((row) => {
      const columnElements = row.querySelectorAll('.slick-headerrow-column');
      columnElements.forEach((column) => {
        const columnDef = Utils.storage.get(column, 'column');
        if (columnDef) {
          this.triggerEvent(this.onBeforeHeaderRowCellDestroy, {
            node: this,
            column: columnDef,
            grid: this,
          });
        }
      });
    });

    for (let i = 0, ln = this.columns.length; i < ln; i++) {
      const m: C = this.columns[i];
      if (!m || m.hidden) {
        continue;
      }

      const band = this.getColumnDockingBand(i);
      const headerTarget = this.getDockingChromeRegion('header', band);
      const headerRowTarget = this.getDockingChromeRegion('headerRow', band);

      const header = createDomElement(
        'div',
        {
          id: `${this.uid + m.id}`,
          dataset: { id: String(m.id) },
          role: 'columnheader',
          className: 'slick-state-default slick-header-column',
          tabIndex: 0,
        },
        headerTarget
      );
      if (m.toolTip) {
        header.title = m.toolTip;
      }
      if (!m.reorderable) {
        header.classList.add(this._options.unorderableColumnCssClass!);
      }
      const colNameElm = createDomElement('span', { className: 'slick-column-name' }, header);
      applyHtmlToElement(colNameElm, m.name, this._options);

      let colWidth = m.width! - this.headerColumnWidthDiff;
      if (this._options.enableGridMenu && i === ln - 1) {
        // account for 2px border on last column to give room for the column resize handle between the last column and the grid menu button
        // scrollbar could be hidden or collapsed (e.g. Firefox) but we still have to compensate for the Grid Menu button width
        colWidth -= this._lastColumnGridMenuCompensation;
        if (!this.scrollbarDimensions?.width) {
          colWidth -= this._options.gridMenu?.menuWidth ?? 18;
        }
      }
      Utils.width(header, colWidth);

      let classname = m.headerCssClass || null;
      if (classname) {
        header.classList.add(...classNameToList(classname));
      }
      classname = band !== 'center' ? 'pinned' : null;
      if (classname) {
        header.classList.add(classname);
      }

      this._bindingEventService.bind(header, 'mouseenter', this.handleHeaderMouseEnter.bind(this) as EventListener, {}, 'colheaders');
      this._bindingEventService.bind(header, 'mouseleave', this.handleHeaderMouseLeave.bind(this) as EventListener, {}, 'colheaders');
      this._bindingEventService.bind(header, 'mouseover', this.handleHeaderMouseOver.bind(this) as EventListener, {}, 'colheaders');
      this._bindingEventService.bind(header, 'mouseout', this.handleHeaderMouseOut.bind(this) as EventListener, {}, 'colheaders');

      Utils.storage.put(header, 'column', m);

      if (this._options.enableColumnReorder || m.sortable) {
        this._bindingEventService.bind(header, 'mouseenter', this.handleHeaderMouseHoverOn.bind(this) as EventListener, {}, 'colheaders');
        this._bindingEventService.bind(header, 'mouseleave', this.handleHeaderMouseHoverOff.bind(this) as EventListener, {}, 'colheaders');
      }

      if (m.hasOwnProperty('headerCellAttrs') && m.headerCellAttrs instanceof Object) {
        Object.keys(m.headerCellAttrs).forEach((key) => {
          if (m.headerCellAttrs.hasOwnProperty(key)) {
            header.setAttribute(key, m.headerCellAttrs[key]);
          }
        });
      }

      if (m.sortable) {
        header.classList.add('slick-header-sortable');
        createDomElement(
          'div',
          {
            className: `slick-sort-indicator ${this._options.numberedMultiColumnSort && !this._options.sortColNumberInSeparateSpan ? ' slick-sort-indicator-numbered' : ''}`,
          },
          header
        );
        if (this._options.numberedMultiColumnSort && this._options.sortColNumberInSeparateSpan) {
          createDomElement('div', { className: 'slick-sort-indicator-numbered' }, header);
        }
      }

      this.triggerEvent(this.onHeaderCellRendered, {
        node: header,
        column: m,
        grid: this,
      });

      if (this._options.showHeaderRow) {
        const headerRowCell = createDomElement(
          'div',
          { className: `slick-state-default slick-headerrow-column l${i} r${i}`, role: 'gridcell' },
          headerRowTarget
        );
        const pinnedClasses = band !== 'center' ? 'pinned' : null;
        if (pinnedClasses) {
          headerRowCell.classList.add(pinnedClasses);
        }

        // prettier-ignore
        this._bindingEventService.bind(headerRowCell, 'mouseenter', this.handleHeaderRowMouseEnter.bind(this) as EventListener, {}, 'colheaders');
        // prettier-ignore
        this._bindingEventService.bind(headerRowCell, 'mouseleave', this.handleHeaderRowMouseLeave.bind(this) as EventListener, {}, 'colheaders');
        // prettier-ignore
        this._bindingEventService.bind(headerRowCell, 'mouseover', this.handleHeaderRowMouseOver.bind(this) as EventListener, {}, 'colheaders');
        this._bindingEventService.bind(
          headerRowCell,
          'mouseout',
          this.handleHeaderRowMouseOut.bind(this) as EventListener,
          {},
          'colheaders'
        );

        Utils.storage.put(headerRowCell, 'column', m);

        this.triggerEvent(this.onHeaderRowCellRendered, {
          node: headerRowCell,
          column: m,
          grid: this,
        });
      }
    }

    this.setSortColumns(this.sortColumns);
    this.setupColumnResize();
    if (this._options.enableColumnReorder) {
      if (typeof this._options.enableColumnReorder === 'function') {
        this._options.enableColumnReorder(
          this as unknown as SlickGrid,
          this._headers,
          this.headerColumnWidthDiff,
          this.setColumns as any,
          this.setupColumnResize,
          this.columns,
          this.getColumnIndex,
          this.uid,
          this.triggerEvent
        );
      } else {
        this.setupColumnReorder();
      }
    }

    this.applyDockingToColumnChrome();
    this.handleAutoHeaderHeightChange();
  }

  protected applyDockingToColumnChrome(): void {
    if (!this.usesDockingChromeRegions()) {
      return;
    }
    this.syncDockingChromeRegions();
    this.dockingChromeByColumn.clear();
    // Chrome is clipped by the header scroller, not by the horizontal-scroll
    // proxy. The proxy can briefly retain an older width during a browser
    // resize, which placed right-pinned titles at that stale edge (for example
    // `1537px` for a 1637px proxy) instead of the visible header edge.
    const viewportWidth = this._headerScrollerL?.clientWidth || this._viewportScrollContainerX?.clientWidth || this.viewportW;
    this.columns.forEach((column, index) => {
      const docking = this.dockingByColumn.get(index);
      const band = docking?.band || 'center';
      const header = Array.from(this._headerL?.querySelectorAll('.slick-header-column') || []).find(
        (element) => (element as HTMLElement).dataset.id === String(column.id)
      ) as HTMLElement;
      const elements = [
        header,
        this._headerRowL?.querySelector(`.l${index}`) as HTMLElement,
        this._footerRowL?.querySelector(`.l${index}`) as HTMLElement,
      ].filter(Boolean);
      this.dockingChromeByColumn.set(index, elements);
      const leftEdgeIndex = this.dockingLayout.left[this.dockingLayout.left.length - 1]?.index;
      const rightEdgeIndex = this.dockingLayout.right[0]?.index;
      elements.forEach((element) => {
        element.classList.toggle('slick-column-pinned-left', band === 'left');
        element.classList.toggle('slick-column-pinned-right', band === 'right');
        const isRightDockedChrome = band === 'right' && !this._options.rtl;
        element.classList.toggle('slick-docking-chrome-right', isRightDockedChrome);
        element.classList.toggle('slick-column-pinned-left-edge', band === 'left' && index === leftEdgeIndex);
        element.classList.toggle('slick-column-pinned-right-edge', band === 'right' && index === rightEdgeIndex);
        element.classList.toggle('slick-column-sticky', !!docking?.sticky);
        // Reset the edge compensation before applying the current docking pass.
        if (element === header) {
          element.style.marginLeft = '';
          element.style.marginRight = '';
        }
        // Header-row and footer cells do not receive the header element's
        // inline width. Once a cell is taken out of the normal left/right
        // constraint layout, give it an explicit content-box width so its
        // rendered outer width matches the corresponding header column.
        if (element !== header) {
          const headerOuterWidth = header?.getBoundingClientRect().width || 0;
          const elementStyle = getComputedStyle(element);
          const elementHorizontalBox =
            parseFloat(elementStyle.paddingLeft) +
            parseFloat(elementStyle.paddingRight) +
            parseFloat(elementStyle.borderLeftWidth) +
            parseFloat(elementStyle.borderRightWidth);
          const targetOuterWidth = headerOuterWidth || column.width || 0;
          // Preserve the normal theme border-box geometry at a pinned edge.
          // The pinning cue itself is an inset shadow and therefore does not
          // contribute to this measured width.
          const isPinnedEdge =
            element.classList.contains('slick-column-pinned-left-edge') || element.classList.contains('slick-column-pinned-right-edge');
          // Keep the measured header outer width so title/filter/footer edges
          // share the same fractional border geometry. Do not extend a right
          // filter into the scrollbar gutter: that overlaps its neighbor.
          element.style.boxSizing = isPinnedEdge ? 'border-box' : 'content-box';
          element.style.width = `${Math.max(0, isPinnedEdge ? targetOuterWidth : targetOuterWidth - elementHorizontalBox)}px`;
        }
        if (!docking || band === 'center') {
          element.style.removeProperty('--slick-docking-chrome-offset');
          element.style.position = '';
          element.style.left = element === header ? '' : `${this.dockingLayout.leftBaseWidth + (docking?.offset || 0)}px`;
          element.style.right =
            element === header
              ? ''
              : `${this.dockingLayout.contentWidth - this.dockingLayout.leftBaseWidth - (docking?.offset || 0) - (docking?.width || 0)}px`;
          element.style.order = '0';
          element.style.transform = '';
          return;
        }

        // The display-contents left wrapper already supplies the grouped edge
        // offset; only cancel the translated root layer here.
        if (band === 'left') {
          element.style.position = element === header ? 'relative' : 'absolute';
          element.style.left = element === header ? '' : `${docking.offset}px`;
          element.style.right = 'auto';
          element.style.order = '0';
          if (element === header && index === leftEdgeIndex) {
            const elementStyle = getComputedStyle(element);
            const separatorWidth = parseFloat(this._options.rtl ? elementStyle.borderLeftWidth : elementStyle.borderRightWidth) || 0;
            if (separatorWidth) {
              if (this._options.rtl) {
                element.style.marginLeft = `-${separatorWidth}px`;
              } else {
                element.style.marginRight = `-${separatorWidth}px`;
              }
            }
          }
          element.style.setProperty('--slick-docking-chrome-offset', '0px');
          element.style.transform = 'translateX(0px)';
          return;
        }

        const naturalOffset = docking.sticky
          ? this.dockingLayout.leftBaseWidth + docking.naturalOffset
          : this.dockingLayout.contentWidth - this.dockingLayout.rightWidth + docking.offset;
        const dockedOffset = this.scrollLeft + viewportWidth - this.dockingLayout.rightWidth + docking.offset;

        // All right-docked chrome uses the visible viewport coordinate directly.
        // Its parent layer is translated by -scrollLeft, so placing it at
        // `scrollLeft + viewportWidth - rightBandWidth` keeps it at the right
        // edge regardless of whether the natural content is narrower or wider
        // than the viewport. This also keeps every column in a multi-column
        // right band in the correct order.
        element.style.position = isRightDockedChrome ? 'absolute' : element === header ? 'relative' : 'absolute';
        element.style.left =
          element === header && !isRightDockedChrome
            ? ''
            : `${isRightDockedChrome ? this.getRightDockedChromeLeft(element, docking) : naturalOffset}px`;
        element.style.right = 'auto';
        element.style.order = docking.sticky ? '0' : '1';
        // The container receives the current `-scrollLeft` transform once per
        // frame. Keep the chrome's natural-to-docked delta separately so CSS
        // can add the current scroll position without using a stale inline
        // transform. This is essential for sticky Q1/Q2/etc.: a permanent
        // left column needs no delta, while a later sticky column needs its
        // natural offset subtracted to sit beside the existing sticky band.
        element.style.setProperty(
          '--slick-docking-chrome-offset',
          `${isRightDockedChrome ? 0 : dockedOffset - naturalOffset - this.scrollLeft}px`
        );
        element.style.transform = isRightDockedChrome ? 'translateX(0px)' : `translateX(${dockedOffset - naturalOffset}px)`;
      });
    });
  }

  /** Move header/filter/footer cells to their current persistent docking bands. */
  protected syncDockingChromeRegions(): void {
    if (!this.usesDockingChromeRegions()) {
      return;
    }

    const syncRegionSet = (
      root: HTMLElement | undefined,
      regions: Record<ColumnDockingBand, HTMLDivElement> | undefined,
      selector: string,
      getColumnIndex: (element: HTMLElement) => number
    ) => {
      if (!root || !regions) {
        return;
      }

      Array.from(root.querySelectorAll(selector)).forEach((node) => {
        const element = node as HTMLElement;
        const columnIndex = getColumnIndex(element);
        if (columnIndex < 0 || columnIndex >= this.columns.length) {
          return;
        }
        const targetRegion = regions[this.getColumnDockingBand(columnIndex)];
        if (element.parentElement !== targetRegion) {
          targetRegion.appendChild(element);
        }
      });

      Object.values(regions).forEach((region) => {
        const elements = Array.from(region.children).filter((element) => element.matches(selector)) as HTMLElement[];
        elements.sort((a, b) => getColumnIndex(a) - getColumnIndex(b)).forEach((element) => region.appendChild(element));
      });
    };

    syncRegionSet(this._headerL, this.dockingHeaderRegions, '.slick-header-column', (element) =>
      this.getColumnIndex(element.dataset.id || '')
    );
    syncRegionSet(this._headerRowL, this.dockingHeaderRowRegions, '.slick-headerrow-column', (element) => {
      const match = element.className.match(/(?:^|\s)l(\d+)(?:\s|$)/);
      return match ? Number(match[1]) : -1;
    });
    syncRegionSet(this._footerRowL, this.dockingFooterRowRegions, '.slick-footerrow-column', (element) => {
      const match = element.className.match(/(?:^|\s)l(\d+)(?:\s|$)/);
      return match ? Number(match[1]) : -1;
    });
  }

  /**
   * Return the local CSS `left` coordinate that places a right-pinned chrome
   * cell at its visible viewport edge.
   */
  protected getRightDockedChromeLeft(element: HTMLElement, docking: Pick<ColumnDockingLayout['right'][number], 'offset'>): number {
    const chromeScroller = element.classList.contains('slick-headerrow-column')
      ? this._headerRowScrollerL
      : element.classList.contains('slick-footerrow-column')
        ? this._footerRowScrollerL
        : this._headerScrollerL;
    const directParent = element.parentElement as HTMLElement | null;
    const chromeContainer =
      directParent?.style.display === 'contents'
        ? element.classList.contains('slick-headerrow-column')
          ? this._headerRowL
          : element.classList.contains('slick-footerrow-column')
            ? this._footerRowL
            : this._headerL
        : directParent;
    if (!chromeScroller || !chromeContainer) {
      return (
        this.scrollLeft + (this._viewportScrollContainerX?.clientWidth || this.viewportW) - this.dockingLayout.rightWidth + docking.offset
      );
    }

    const scrollerRect = chromeScroller.getBoundingClientRect();
    // Header/header-row/footer chrome has no native vertical scrollbar, while
    // the body does. Right pins must stop at the body's visible edge, not the
    // wider chrome scroller edge, otherwise they drift right by the scrollbar
    // width (for example 1551.11px instead of 1536px).
    const dockingViewportWidth = this._viewportNode?.clientWidth || chromeScroller.clientWidth;
    // The chrome container itself is translated by -scrollLeft. Add it back
    // before converting the target screen coordinate to the local `left`.
    const untransformedContainerLeft = chromeContainer.getBoundingClientRect().left + this.scrollLeft;
    const visibleRightStart = scrollerRect.left + dockingViewportWidth - this.dockingLayout.rightWidth + docking.offset;
    return visibleRightStart - untransformedContainerLeft;
  }

  /** Adds or removes the automatic header-height styles from both header panes. */
  protected handleAutoHeaderHeightChange(): void {
    const enabled = !!this._options.autoHeaderHeight;
    const headers = [this._headerScrollerL, this._headerScrollerR].filter((header): header is HTMLDivElement => !!header);

    headers.forEach((header) => header.classList.toggle('slick-header-auto-height', enabled));

    if (!enabled) {
      this.clearAutoHeaderHeightStyles(headers);
    }
  }

  /** Measures natural header heights and applies the largest one to every header pane. */
  protected recalculateHeaderHeight(): void {
    if (!this._headerScrollerL) {
      return;
    }

    const headers = [this._headerScrollerL, this._headerScrollerR].filter((header): header is HTMLDivElement => !!header);
    const currentHeight = parseFloat(this._headerScrollerL.style.getPropertyValue('--slick-auto-header-height') || '0');

    // Remove the previous calculated height before measuring the rendered header content.
    this.clearAutoHeaderHeightStyles(headers);
    const maxHeight = Math.max(...headers.map((header) => header.getBoundingClientRect().height));

    if (maxHeight > 0) {
      this.setAutoHeaderHeightStyles(maxHeight, headers);

      // A viewport resize is only necessary when the calculated height actually changed.
      if (Math.abs(maxHeight - currentHeight) > 0.5) {
        this.resizeCanvas();
      }
    }
  }

  protected clearAutoHeaderHeightStyles(headers: HTMLDivElement[]): void {
    headers.forEach((header) => {
      header.style.removeProperty('--slick-auto-header-height');
      header.style.height = '';
    });
  }

  protected setAutoHeaderHeightStyles(height: number, headers: HTMLDivElement[]): void {
    headers.forEach((header) => {
      header.style.setProperty('--slick-auto-header-height', `${height}px`);
      header.style.height = `${height}px`;
    });
  }

  protected setupColumnSort(): void {
    this._bindingEventService.unbindAll('colsorts');
    this._headers.forEach((header) => {
      const sortCallback = (e: (MouseEvent | KeyboardEvent) & { target: HTMLElement }) => {
        if (this.columnResizeDragging || e.target.classList.contains('slick-resizable-handle')) {
          return;
        }

        const coll = e.target.closest('.slick-header-column');
        if (!coll) {
          return;
        }

        const column = Utils.storage.get(coll, 'column');
        if (column?.sortable) {
          if (!this.getEditorLock()?.commitCurrentEdit()) {
            return;
          }

          const previousSortColumns = this.sortColumns.slice();
          let sortColumn: ColumnSort | null = null;
          let i = 0;
          for (; i < this.sortColumns.length; i++) {
            if (this.sortColumns[i].columnId === column.id) {
              sortColumn = this.sortColumns[i];
              sortColumn.sortAsc = !sortColumn.sortAsc;
              break;
            }
          }
          const hadSortCol = !!sortColumn;

          if (this._options.tristateMultiColumnSort) {
            if (!sortColumn) {
              sortColumn = { columnId: column.id, sortAsc: column.defaultSortAsc, sortCol: column };
            }
            if (hadSortCol && sortColumn.sortAsc) {
              // three state: remove sort rather than go back to ASC
              this.sortColumns.splice(i, 1);
              sortColumn = null;
            }
            if (!this._options.multiColumnSort) {
              this.sortColumns = [];
            }
            if (sortColumn && (!hadSortCol || !this._options.multiColumnSort)) {
              this.sortColumns.push(sortColumn);
            }
          } else {
            // legacy behaviour
            if (e.metaKey && this._options.multiColumnSort) {
              if (sortColumn) {
                this.sortColumns.splice(i, 1);
              }
            } else {
              if ((!e.shiftKey && !e.metaKey) || !this._options.multiColumnSort) {
                this.sortColumns = [];
              }

              if (!sortColumn) {
                sortColumn = { columnId: column.id, sortAsc: column.defaultSortAsc, sortCol: column };
                this.sortColumns.push(sortColumn);
              } else if (this.sortColumns.length === 0) {
                this.sortColumns.push(sortColumn);
              }
            }
          }

          let onSortArgs;
          if (!this._options.multiColumnSort) {
            onSortArgs = {
              multiColumnSort: false,
              previousSortColumns,
              columnId: this.sortColumns.length > 0 ? column.id : null,
              sortCol: this.sortColumns.length > 0 ? column : null,
              sortAsc: this.sortColumns.length > 0 ? this.sortColumns[0].sortAsc : true,
            };
          } else {
            onSortArgs = {
              multiColumnSort: true,
              previousSortColumns,
              sortCols: this.sortColumns
                .map((col) => {
                  const tempCol = this.getColumnById(col.columnId);
                  return tempCol && !tempCol.hidden ? { columnId: tempCol.id, sortCol: tempCol, sortAsc: col.sortAsc } : null;
                })
                .filter((el) => el),
            };
          }

          if (this.triggerEvent(this.onBeforeSort, onSortArgs, e).getReturnValue() !== false) {
            this.setSortColumns(this.sortColumns);
            this.triggerEvent(this.onSort, onSortArgs, e);
          }
        }
      };

      // Add keydown/click event handlers for sortable columns
      this._bindingEventService.bind(
        header,
        'keydown',
        ((e: KeyboardEvent & { target: HTMLElement }) => {
          this.triggerEvent(this.onHeaderKeyDown, { event: e, column: Utils.storage.get(e.target, 'column'), grid: this });
          if (e.key === 'Enter' || e.key === ' ') {
            sortCallback(e);
          }
        }) as EventListener,
        {},
        'colsorts'
      );
      this._bindingEventService.bind(
        header,
        'click',
        ((e: MouseEvent & { target: HTMLElement }) => sortCallback(e)) as EventListener,
        {},
        'colsorts'
      );
    });
  }

  protected setupColumnReorder(): void {
    this.sortableSideLeftInstance?.destroy();
    this.sortableSideCenterInstance?.destroy();
    this.sortableSideRightInstance?.destroy();
    this.sortableSideLeftInstance = undefined;
    this.sortableSideCenterInstance = undefined;
    this.sortableSideRightInstance = undefined;

    let columnScrollTimer: ReturnType<typeof setInterval> | undefined;
    let columnScrollDirection = 0;

    const stopAutoScroll = () => {
      clearInterval(columnScrollTimer);
      columnScrollTimer = undefined;
      columnScrollDirection = 0;
    };
    let prevColumnIds: Array<string | number> = [];

    // fires on document during native drag; also bind 'mousemove' for SortableJS forceFallback mode
    const autoScrollHandler = (e: DragEvent | MouseEvent) => {
      if (!this.initialized || !this._viewportScrollContainerX) {
        stopAutoScroll();
        return;
      }
      const { clientX, clientY, pageX } = e;
      if (clientX && clientY) {
        const viewportLeft = getOffset(this._viewportScrollContainerX).left;
        const containerRight = getOffset(this._container).left + this._container.clientWidth;
        const direction = pageX > containerRight ? 1 : pageX < viewportLeft ? -1 : 0;
        if (direction !== columnScrollDirection) {
          stopAutoScroll();
          columnScrollDirection = direction;
          if (direction) {
            columnScrollTimer = setInterval(() => {
              if (!this.initialized || !this._viewportScrollContainerX) {
                stopAutoScroll();
                return;
              }
              this._viewportScrollContainerX.scrollLeft += direction * COLUMN_AUTOSCROLL_DISTANCE_PX;
            }, COLUMN_AUTOSCROLL_INTERVAL_MS);
          }
        }
      }
    };

    const sortableOptions = {
      animation: 50,
      direction: 'horizontal',
      ghostClass: 'slick-sortable-placeholder',
      draggable: '.slick-header-column',
      dragoverBubble: false,
      // Fixes broken Firefox-Linux dragging
      forceFallback: /firefox/i.test(navigator.userAgent) && /linux/i.test(navigator.userAgent),
      // allow column to be resized even when they are not orderable
      preventOnFilter: false,
      revertClone: true,
      // Use built-in SortableJS proximity scroll for unpinned grids; pinned grids use custom scroll.
      scroll: !this.hasDockedColumns(),
      // lock unorderable columns by using a combo of filter + onMove
      filter: `.${this._options.unorderableColumnCssClass}`,
      onMove: (event) => {
        return !event.related.classList.contains(this._options.unorderableColumnCssClass as string);
      },
      onStart: (e) => {
        e.item.classList.add('slick-header-column-active');
        // Only scrolling columns should auto-scroll; use contains() since offset comparisons
        // are not reliable across the header regions.
        const leftHeader = this.usesDockingChromeRegions() ? this.getDockingChromeRegion('header', 'left') : this._headerL;
        if (!this.hasDockedColumns() || !leftHeader.contains(e.item)) {
          // bind 'drag' for native HTML5 drag and 'mousemove' for SortableJS forceFallback
          this._bindingEventService.bind(document, 'drag', autoScrollHandler as EventListener, {}, 'colreorder');
          this._bindingEventService.bind(document, 'mousemove', autoScrollHandler as EventListener, {}, 'colreorder');
        }

        prevColumnIds = this.columns.map((c) => c.id);
      },
      onEnd: (e) => {
        e.item.classList.remove('slick-header-column-active');
        stopAutoScroll();
        this._bindingEventService.unbindAll('colreorder');
        const prevScrollLeft = this.scrollLeft;

        if (!this.getEditorLock()?.commitCurrentEdit()) {
          return;
        }

        const reorderedIdsByBand = [
          this.sortableSideLeftInstance?.toArray() || [],
          this.sortableSideCenterInstance?.toArray() || [],
          this.sortableSideRightInstance?.toArray() || [],
        ];
        const reorderedColumnsByBand = reorderedIdsByBand.map((ids: Array<string | number>) =>
          ids.map((id) => this.columns[this.getColumnIndex(id)])
        );
        const finalColumns = this.columns.slice();

        // Keep each docking band in its logical slots; flattening moves center columns into pinned slots.
        if (this.usesDockingChromeRegions()) {
          (['left', 'center', 'right'] as const).forEach((band, bandIndex) => {
            this.dockingLayout[band].forEach(({ index }, reorderedIndex) => {
              finalColumns[index] = reorderedColumnsByBand[bandIndex][reorderedIndex];
            });
          });
        } else {
          let reorderedIndex = 0;
          const reorderedColumns = reorderedColumnsByBand.flat();
          this.columns.forEach((column, index) => {
            if (!column.hidden) {
              finalColumns[index] = reorderedColumns[reorderedIndex++];
            }
          });
        }

        e.stopPropagation();
        const finalColumnIds = finalColumns.map(({ id }) => id);
        if (!this.arrayEquals(prevColumnIds, finalColumnIds)) {
          this.setColumns(finalColumns);
          // reapply previous scroll position since it might move back to x=0 after calling `setColumns()`
          this.scrollToX(prevScrollLeft);
          this.triggerEvent(this.onColumnsReordered, { impactedColumns: this.columns, previousColumnOrder: prevColumnIds });
          this.setupColumnResize();
        }
        if (this.activeCellNode) {
          this.setFocus(); // refocus on active cell
        }
      },
    } as SortableOptions;

    if (this.usesDockingChromeRegions()) {
      this.sortableSideLeftInstance = Sortable.create(this.getDockingChromeRegion('header', 'left'), sortableOptions);
      this.sortableSideCenterInstance = Sortable.create(this.getDockingChromeRegion('header', 'center'), sortableOptions);
      this.sortableSideRightInstance = Sortable.create(this.getDockingChromeRegion('header', 'right'), sortableOptions);
    } else {
      this.sortableSideLeftInstance = Sortable.create(this._headerL, sortableOptions);
      this.sortableSideRightInstance =
        this._headerR !== this._headerL && this._headerR.isConnected ? Sortable.create(this._headerR, sortableOptions) : undefined;
    }
  }

  protected getHeaderChildren(): HTMLElement[] {
    if (this.usesDockingChromeRegions()) {
      const headers = Array.from(this._headerL.querySelectorAll('.slick-header-column')) as HTMLElement[];
      return this.getVisibleColumns()
        .map((column) => headers.find((header) => header.dataset.id === String(column.id)))
        .filter((header): header is HTMLElement => !!header);
    }
    return this._headers.flatMap((header) => Array.from(header.children)) as HTMLElement[];
  }

  protected handleResizeableDoubleClick(evt: MouseEvent & { target: HTMLDivElement }): void {
    const triggeredByColumn = evt.target.parentElement!.id.replace(this.uid, '');
    this.triggerEvent(this.onColumnsResizeDblClick, { triggeredByColumn });
  }

  protected setupColumnResize(): void {
    let j: number, k: number, c: C;
    let pageX: number, minPageX: number, maxPageX: number;
    let firstResizable: number | undefined;
    let lastResizable = -1;
    let resizeAutoScrollDeltaX = 0;
    let autoScrollClientX: number | undefined;
    let autoScrollOffsetX = 0;

    this._bindingEventService.unbindAll('colresizes');
    this.clearAutoScrollTimer();
    const children: HTMLElement[] = this.getHeaderChildren();
    const vc = this.getVisibleColumns();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const handles = child.querySelectorAll('.slick-resizable-handle');
      handles.forEach((handle) => handle.remove());

      if (i < vc.length && vc[i]?.resizable) {
        if (firstResizable === undefined) {
          firstResizable = i;
        }
        lastResizable = i;
      }
    }

    if (firstResizable === undefined) {
      return;
    }

    // --- Minimal auto-scroll logic for browser edge ---
    const stopColumnResizeAutoScroll = () => {
      this.clearAutoScrollTimer();
      autoScrollOffsetX = 0;
    };

    const scheduleColumnResizeAutoScroll = (resizeCallback: (targetPageX: number) => void) => {
      if (this._columnResizeAutoScrollTimer) {
        return;
      }
      this._columnResizeAutoScrollTimer = setInterval(() => {
        if (!this.initialized || !this._viewportScrollContainerX) {
          stopColumnResizeAutoScroll();
          return;
        }
        const viewportOffset = getOffset(this._viewportScrollContainerX);
        /* v8 ignore next */
        const targetPageX =
          autoScrollOffsetX > 0
            ? viewportOffset.left + this._viewportScrollContainerX.clientWidth + COLUMN_AUTOSCROLL_DISTANCE_PX
            : viewportOffset.left - COLUMN_AUTOSCROLL_DISTANCE_PX;
        resizeCallback(targetPageX + resizeAutoScrollDeltaX);
      }, COLUMN_AUTOSCROLL_INTERVAL_MS);
    };

    const updateColumnResizeAutoScroll = (
      clientX: number | undefined,
      targetPageX: number,
      resizeCallback: (targetPageX: number) => void
    ): number => {
      if (!this.initialized || !this._viewportScrollContainerX) {
        stopColumnResizeAutoScroll();
        return targetPageX;
      }
      // TODO: there is a known bug with auto-scroll in RTL,
      // so disable it until someone can contribute a fix
      if (this._options.rtl || !this._options.autoScrollOnColumnResize) {
        stopColumnResizeAutoScroll();
        return targetPageX;
      }

      autoScrollClientX = isDefinedNumber(clientX) ? clientX : autoScrollClientX;
      const left = getOffset(this._viewportScrollContainerX).left;
      const viewportWidth = this._viewportScrollContainerX.clientWidth;
      const right = left + viewportWidth;
      const browserW = window.innerWidth || document.documentElement.clientWidth || 0;
      if (targetPageX <= left) {
        autoScrollOffsetX = targetPageX - left;
      } else if (targetPageX >= right) {
        autoScrollOffsetX = targetPageX - right;
      } else if (isDefinedNumber(autoScrollClientX) && browserW > 0) {
        autoScrollOffsetX =
          autoScrollClientX <= RESIZE_AUTOSCROLL_BROWSER_EDGE_PX
            ? -1
            : autoScrollClientX >= browserW - RESIZE_AUTOSCROLL_BROWSER_EDGE_PX
              ? 1
              : 0;
      } else {
        autoScrollOffsetX = 0;
      }
      if (autoScrollOffsetX) {
        scheduleColumnResizeAutoScroll(resizeCallback);
        return autoScrollOffsetX > 0 && viewportWidth ? Math.min(right, targetPageX) : targetPageX;
      }
      stopColumnResizeAutoScroll();
      return targetPageX;
    };

    for (let i = 0; i < children.length; i++) {
      const colElm = children[i];

      /* v8 ignore if */
      if (i >= vc.length || !vc[i]) {
        continue;
      }
      if (i < firstResizable || (this._options.forceFitColumns && i >= lastResizable)) {
        continue;
      }

      const resizeableHandle = createDomElement(
        'div',
        { className: 'slick-resizable-handle', role: 'separator', ariaOrientation: 'horizontal' },
        colElm
      );
      this._bindingEventService.bind(
        resizeableHandle,
        'dblclick',
        this.handleResizeableDoubleClick.bind(this) as EventListener,
        {},
        'colresizes'
      );

      const applyColumnResize = (
        targetPageX: number,
        resizeElms: { resizeableElement: HTMLElement; resizeableHandleElement: HTMLElement }
      ) => {
        this.columnResizeDragging = true;
        let actualMinWidth;
        let d = Math.min(maxPageX, Math.max(minPageX, targetPageX)) - pageX;

        if (this._options.rtl) {
          d = -d;
        }

        let x;
        let newCanvasWidthL = 0;
        // oxlint-disable-next-line no-unused-vars
        let newCanvasWidthR = 0;

        if (d < 0) {
          x = d;
          for (j = i; j >= 0; j--) {
            c = vc[j];
            if (c && c.resizable && !c.hidden) {
              actualMinWidth = Math.max(c.minWidth || 0, this.absoluteColumnMinWidth);
              /* v8 ignore if */
              if (x && (c.previousWidth || 0) + x < actualMinWidth) {
                x += (c.previousWidth || 0) - actualMinWidth;
                c.width = actualMinWidth;
              } else {
                c.width = (c.previousWidth || 0) + x;
                x = 0;
              }
            }
          }

          for (k = 0; k <= i; k++) {
            c = vc[k];
            if (c && !c.hidden) {
              if (this.getColumnDockingBand(k) === 'right') {
                newCanvasWidthR += c.width || 0;
              } else {
                newCanvasWidthL += c.width || 0;
              }
            }
          }

          if (this._options.forceFitColumns) {
            x = -d;
            for (j = i + 1; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden) {
                if (c.resizable) {
                  if (x && c.maxWidth && c.maxWidth - (c.previousWidth || 0) < x) {
                    x -= c.maxWidth - (c.previousWidth || 0);
                    c.width = c.maxWidth;
                  } else {
                    c.width = (c.previousWidth || 0) + x;
                    x = 0;
                  }

                  if (this.getColumnDockingBand(j) === 'right') {
                    newCanvasWidthR += c.width || 0;
                  } else {
                    newCanvasWidthL += c.width || 0;
                  }
                }
              }
            }
          } else {
            for (j = i + 1; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden) {
                if (this.getColumnDockingBand(j) === 'right') {
                  newCanvasWidthR += c.width || 0;
                } else {
                  newCanvasWidthL += c.width || 0;
                }
              }
            }
          }

          if (this._options.forceFitColumns) {
            x = -d;
            for (j = i + 1; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden && c.resizable) {
                /* v8 ignore if */
                if (x && c.maxWidth && c.maxWidth - (c.previousWidth || 0) < x) {
                  x -= c.maxWidth - (c.previousWidth || 0);
                  c.width = c.maxWidth;
                } else {
                  c.width = (c.previousWidth || 0) + x;
                  x = 0;
                }
              }
            }
          }
        } else {
          x = d;

          newCanvasWidthL = 0;
          newCanvasWidthR = 0;

          for (j = i; j >= 0; j--) {
            c = vc[j];
            if (c && !c.hidden && c.resizable) {
              if (x && c.maxWidth && c.maxWidth - (c.previousWidth || 0) < x) {
                x -= c.maxWidth - (c.previousWidth || 0);
                c.width = c.maxWidth;
              } else {
                const newWidth = (c.previousWidth || 0) + x;
                c.width = newWidth;
                x = 0;
              }
            }
          }

          for (k = 0; k <= i; k++) {
            c = vc[k];
            if (c && !c.hidden) {
              if (this.getColumnDockingBand(k) === 'right') {
                newCanvasWidthR += c.width || 0;
              } else {
                newCanvasWidthL += c.width || 0;
              }
            }
          }

          if (this._options.forceFitColumns) {
            x = -d;
            for (j = i + 1; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden && c.resizable) {
                actualMinWidth = Math.max(c.minWidth || 0, this.absoluteColumnMinWidth);
                /* v8 ignore if */
                if (x && (c.previousWidth || 0) + x < actualMinWidth) {
                  x += (c.previousWidth || 0) - actualMinWidth;
                  c.width = actualMinWidth;
                } else {
                  c.width = (c.previousWidth || 0) + x;
                  x = 0;
                }

                if (this.getColumnDockingBand(j) === 'right') {
                  newCanvasWidthR += c.width || 0;
                } else {
                  newCanvasWidthL += c.width || 0;
                }
              }
            }
          } else {
            for (j = i + 1; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden) {
                if (this.getColumnDockingBand(j) === 'right') {
                  // eslint-disable-next-line
                  newCanvasWidthR += c.width || 0;
                } else {
                  newCanvasWidthL += c.width || 0;
                }
              }
            }
          }
        }

        this.applyColumnHeaderWidths();
        if (this._options.syncColumnCellResize) {
          this.applyColumnWidths();
        }

        this.updateCanvasWidth();
        if (
          this._options.autoScrollOnColumnResize &&
          !this._options.rtl &&
          !this._options.forceFitColumns &&
          this.getColumnDockingBand(i) === 'center'
        ) {
          const columnRight = this.columnPosRight[i];
          const previousScrollLeft = this._viewportScrollContainerX.scrollLeft;
          const viewportWidth = this._viewportScrollContainerX.clientWidth;
          const isLastVisibleColumn = i === vc.length - 1;
          if (isLastVisibleColumn) {
            this._isResizingColumn = true;
            const maxScrollLeft = Math.max(0, this._viewportScrollContainerX.scrollWidth - this._viewportScrollContainerX.clientWidth);
            this.scrollToX(maxScrollLeft);
          } else if (columnRight > previousScrollLeft + viewportWidth) {
            this._isResizingColumn = true;
            this.scrollToX(columnRight - viewportWidth);
          }
          resizeAutoScrollDeltaX += this._viewportScrollContainerX.scrollLeft - previousScrollLeft;
        }

        this.triggerEvent(this.onColumnsDrag, {
          triggeredByColumn: resizeElms.resizeableElement,
          resizeHandle: resizeElms.resizeableHandleElement,
        });
      };

      this.slickResizableInstances.push(
        Resizable({
          resizeableElement: colElm as HTMLElement,
          resizeableHandleElement: resizeableHandle,
          onResizeStart: (e, resizeElms): boolean | void => {
            const targetEvent = (e as TouchEvent).touches ? (e as TouchEvent).changedTouches[0] : e;
            if (!this.getEditorLock()?.commitCurrentEdit()) {
              return false;
            }
            pageX = (targetEvent as MouseEvent).pageX;
            resizeElms.resizeableElement.classList.add('slick-header-column-active');
            let shrinkLeewayOnRight: number | null = null;
            let stretchLeewayOnRight: number | null = null;
            // lock each column's width option to current width
            for (let pw = 0; pw < children.length; pw++) {
              if (pw < vc.length && vc[pw]) {
                vc[pw].previousWidth = children[pw].offsetWidth;
              }
            }
            if (this._options.forceFitColumns) {
              shrinkLeewayOnRight = 0;
              stretchLeewayOnRight = 0;
              // colums on right affect maxPageX/minPageX
              for (j = i + 1; j < vc.length; j++) {
                c = vc[j];
                if (c?.resizable) {
                  if (stretchLeewayOnRight !== null) {
                    if (c.maxWidth) {
                      stretchLeewayOnRight += c.maxWidth - (c.previousWidth || 0);
                    } else {
                      stretchLeewayOnRight = null;
                    }
                  }
                  shrinkLeewayOnRight += (c.previousWidth || 0) - Math.max(c.minWidth || 0, this.absoluteColumnMinWidth);
                }
              }
            }
            let shrinkLeewayOnLeft = 0;
            let stretchLeewayOnLeft: number | null = 0;
            for (j = 0; j <= i; j++) {
              // columns on left only affect minPageX
              c = vc[j];
              if (c?.resizable) {
                if (stretchLeewayOnLeft !== null) {
                  /* v8 ignore if */
                  if (c.maxWidth) {
                    stretchLeewayOnLeft += c.maxWidth - (c.previousWidth || 0);
                  } else {
                    stretchLeewayOnLeft = null;
                  }
                }
                shrinkLeewayOnLeft += (c.previousWidth || 0) - Math.max(c.minWidth || 0, this.absoluteColumnMinWidth);
              }
            }
            if (this._options.rtl) {
              maxPageX = pageX + Math.min(shrinkLeewayOnLeft ?? 100000, stretchLeewayOnRight ?? 100000);
              minPageX = pageX - Math.min(shrinkLeewayOnRight ?? 100000, stretchLeewayOnLeft ?? 100000);
            } else {
              maxPageX = pageX + Math.min(shrinkLeewayOnRight ?? 100000, stretchLeewayOnLeft ?? 100000);
              minPageX = pageX - Math.min(shrinkLeewayOnLeft ?? 100000, stretchLeewayOnRight ?? 100000);
            }
            resizeAutoScrollDeltaX = 0;
            autoScrollClientX = (targetEvent as MouseEvent).clientX;
            stopColumnResizeAutoScroll();
          },
          onResize: (e, resizeElms) => {
            const targetEvent = (e as TouchEvent).touches ? (e as TouchEvent).changedTouches[0] : e;
            let targetPageX = (targetEvent as MouseEvent).pageX;
            if (this.getColumnDockingBand(i) === 'center') {
              targetPageX = updateColumnResizeAutoScroll((targetEvent as MouseEvent).clientX, targetPageX, (resizePageX) =>
                applyColumnResize(resizePageX, resizeElms)
              );
            }
            applyColumnResize(targetPageX + resizeAutoScrollDeltaX, resizeElms);
          },
          onResizeEnd: (_e, resizeElms) => {
            stopColumnResizeAutoScroll();
            resizeAutoScrollDeltaX = 0;
            this._isResizingColumn = false;
            resizeElms.resizeableElement.classList.remove('slick-header-column-active');

            const triggeredByColumn = resizeElms.resizeableElement.id.replace(this.uid, '');
            if (this.triggerEvent(this.onBeforeColumnsResize, { triggeredByColumn }).getReturnValue() === true) {
              this.applyColumnHeaderWidths();
            }
            let newWidth;
            for (j = 0; j < vc.length; j++) {
              c = vc[j];
              if (c && !c.hidden && children[j]) {
                newWidth = children[j].offsetWidth;

                if (c.previousWidth !== newWidth && c.rerenderOnResize) {
                  this.invalidateAllRows();
                }
              }
            }
            this.updateCanvasWidth(true);
            if (this._options.autoHeaderHeight) {
              this.recalculateHeaderHeight();
            } else {
              this.render();
            }
            this.scrollToX(this._viewportScrollContainerX.scrollLeft);
            this.triggerEvent(this.onColumnsResized, { triggeredByColumn });
            clearTimeout(this._columnResizeTimer);
            this._columnResizeTimer = setTimeout(() => (this.columnResizeDragging = false), this._options.columnResizingDelay);
          },
        })
      );
    }
  }

  /**
   * Calculates the vertical box sizes (the sum of top/bottom borders and paddings)
   * for a given element by reading its computed style.
   * @param el
   * @returns number
   */
  protected getVBoxDelta(el: HTMLElement): number {
    const p = ['borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'];
    const styles = getComputedStyle(el);
    let delta = 0;
    p.forEach((val) => (delta += Utils.toFloat(styles[val as any])));
    return delta;
  }

  protected activateSingleViewportLayout(): void {
    this._headerScroller = [this._headerScrollerL];
    this._headers = [this._headerL];
    this._headerRowScroller = [this._headerRowScrollerL];
    this._headerRows = [this._headerRowL];
    this._topPanelScrollers = [this._topPanelScrollerL];
    this._topPanels = [this._topPanelL];
    this._viewport = [this._viewportNode];
    this._canvas = [this._canvasNode];
    // Keep the original viewport as the horizontal scroll owner for ordinary
    // grids. The dedicated scrollbar is only required once pinning/sticky
    // docking is configured; creating it for every grid breaks integrations
    // that scroll `.slick-viewport` directly.
    if (this.hasConfiguredDocking()) {
      this.createDockingChromeRegions();
      this._container.classList.add('slick-docking-horizontal-scroll-proxy');
      this._dockingHorizontalScroller ??= createDomElement(
        'div',
        { className: 'slick-docking-horizontal-scroller', role: 'presentation' },
        this._contentRoot
      );
      this._dockingHorizontalSpacer ??= createDomElement(
        'div',
        { className: 'slick-docking-horizontal-spacer' },
        this._dockingHorizontalScroller
      );
    }
    if (this._footerRowL) {
      this._footerRowScroller = [this._footerRowScrollerL];
      this._footerRow = [this._footerRowL];
    }
  }

  /** The pinning POC owns horizontal scroll through one dedicated scrollbar. */
  protected hasDockingHorizontalScroller(): boolean {
    return !!this._dockingHorizontalScroller;
  }

  /** Whether the grid needs the three-band chrome/row DOM. */
  protected hasConfiguredDocking(): boolean {
    return this.hasConfiguredColumnDocking() || this.hasConfiguredRowDocking();
  }

  /** Column docking is opt-in; ordinary grids retain the flat DOM. */
  protected hasConfiguredColumnDocking(): boolean {
    const configuredColumns = this._options.pinning?.columns;
    const hasReferences = (references: ColumnPinningReferences | undefined, side: DockingSide): boolean => {
      if (Array.isArray(references)) {
        return references.length > 0;
      }
      return (
        typeof references === 'number' &&
        Number.isInteger(references) &&
        references >= 0 &&
        (side === 'left' ? this.columns.length > 0 : references > 0)
      );
    };
    return !!(
      hasReferences(configuredColumns?.left, 'left') ||
      hasReferences(configuredColumns?.right, 'right') ||
      this.columns.some((column) => !!column && (column.pinned || column.sticky))
    );
  }

  /** Whether chrome currently uses persistent docking wrappers. */
  protected usesDockingChromeRegions(): boolean {
    return !!this.dockingHeaderRegions;
  }

  /** Create stable left/center/right descendants without changing chrome layout. */
  protected createDockingChromeRegions(): void {
    this.dockingHeaderRegions = this.createDockingChromeRegionSet(this._headerL, 'slick-header-columns');
    this.dockingHeaderRowRegions = this.createDockingChromeRegionSet(this._headerRowL, 'slick-headerrow-columns');
    if (this._footerRowL) {
      this.dockingFooterRowRegions = this.createDockingChromeRegionSet(this._footerRowL, 'slick-footerrow-columns');
    }
  }

  protected resetDockingChromeRegionSet(
    root: HTMLDivElement,
    className: 'slick-header-columns' | 'slick-headerrow-columns' | 'slick-footerrow-columns',
    side: 'left' | 'right'
  ): void {
    emptyElement(root);
    root.classList.remove('slick-docking-chrome', `${className}-root`, `${className}-center`, `${className}-right`, `${className}-left`);
    root.classList.add(`${className}-${side}`);
    root.classList.add(className);
  }

  protected createDockingChromeRegionSet(
    root: HTMLDivElement,
    className: 'slick-header-columns' | 'slick-headerrow-columns' | 'slick-footerrow-columns'
  ): Record<ColumnDockingBand, HTMLDivElement> {
    emptyElement(root);
    // Keep bands as direct root children so the legacy chrome selector contract remains usable.
    root.classList.remove(className, `${className}-left`, `${className}-right`);
    root.classList.add('slick-docking-chrome', `${className}-root`);
    const createRegion = (band: ColumnDockingBand) =>
      createDomElement(
        'div',
        {
          className: `${className} ${className}-${band}`,
          role: 'presentation',
          style: { display: 'contents' },
        },
        root
      );
    return { left: createRegion('left'), center: createRegion('center'), right: createRegion('right') };
  }

  /** Return the persistent chrome wrapper for a docking band. */
  protected getDockingChromeRegion(type: 'header' | 'headerRow' | 'footerRow', band: ColumnDockingBand): HTMLDivElement {
    const regions =
      type === 'header' ? this.dockingHeaderRegions : type === 'headerRow' ? this.dockingHeaderRowRegions : this.dockingFooterRowRegions;
    const fallback = type === 'header' ? this._headerL : type === 'headerRow' ? this._headerRowL : this._footerRowL;
    return regions?.[band] || fallback;
  }

  /** Whether row docking was configured, even when no row is currently docked. */
  protected hasConfiguredRowDocking(): boolean {
    const stickyRows = this._options.stickyRows;
    // Preserve the row-band DOM after an empty pinning update while keeping
    // ordinary grids without pinning lightweight and flat.
    return this._options.pinning !== undefined || stickyRows !== undefined;
  }

  /** Create the row overlay once for a configured row-docking grid. */
  protected ensureDockingOverlay(): HTMLDivElement {
    this._dockingOverlay ??= createDomElement('div', { className: 'slick-docking-overlay', role: 'presentation' }, this._contentRoot);
    if (this.initialized) {
      this.bindDockingOverlayEvents();
    }
    return this._dockingOverlay;
  }

  /** Bind the overlay's cell interactions consistently with the canvas. */
  protected bindDockingOverlayEvents(): void {
    this._bindingEventService.unbindAll('docking-overlay');
    if (!this._dockingOverlay) {
      return;
    }
    const events: Array<[string, EventListener]> = [
      ['keydown', this.handleGridKeyDown.bind(this) as EventListener],
      ['click', this.handleClick.bind(this) as EventListener],
      ['dblclick', this.handleDblClick.bind(this) as EventListener],
      ['contextmenu', this.handleContextMenu.bind(this) as EventListener],
      ['mouseover', this.handleCellMouseOver.bind(this) as EventListener],
      ['mouseout', this.handleCellMouseOut.bind(this) as EventListener],
    ];
    events.forEach(([eventName, listener]) =>
      this._bindingEventService.bind(this._dockingOverlay!, eventName, listener, {}, 'docking-overlay')
    );
  }

  protected setOverflow(): void {
    this._viewportNode.style.overflowX = this.hasDockingHorizontalScroller() ? 'hidden' : 'auto';
    this._viewportNode.style.overflowY = this._options.autoHeight ? 'hidden' : this._options.alwaysShowVerticalScroll ? 'scroll' : 'auto';
    if (this._dockingHorizontalScroller) {
      this._dockingHorizontalScroller.style.overflowX = 'auto';
      this._dockingHorizontalScroller.style.overflowY = 'hidden';
    }

    if (this._options.viewportClass) {
      const viewportClasses = classNameToList(this._options.viewportClass);
      this._viewportNode.classList.add(...viewportClasses);
    }
  }

  protected setScroller(): void {
    this._headerScrollContainer = this._headerScrollerL;
    this._headerRowScrollContainer = this._headerRowScrollerL;
    this._footerRowScrollContainer = this._footerRowScrollerL;
    this._viewportScrollContainerY = this._viewportNode;
    this._viewportScrollContainerX = this._dockingHorizontalScroller ?? this._viewportNode;

    // Expose the active horizontal scroll element through one stable selector.
    // The docking-specific class remains available for styling and diagnostics.
    this._viewportNode.classList.toggle('slick-horizontal-scroller', this._viewportScrollContainerX === this._viewportNode);
    this._dockingHorizontalScroller?.classList.toggle(
      'slick-horizontal-scroller',
      this._viewportScrollContainerX === this._dockingHorizontalScroller
    );
    this._viewportScrollContainerY.classList.add('slick-vertical-scroller');
  }

  protected measureCellPaddingAndBorder(): void {
    const h = ['borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight'];
    const v = ['borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'];
    const header = this._headers[0];

    this.headerColumnWidthDiff = this.headerColumnHeightDiff = 0;
    this.cellWidthDiff = this.cellHeightDiff = 0;

    let el = createDomElement(
      'div',
      { className: 'slick-state-default slick-header-column', style: { visibility: 'hidden' }, textContent: '-' },
      header
    );
    let style = getComputedStyle(el);
    if (style.boxSizing !== 'border-box') {
      h.forEach((val) => (this.headerColumnWidthDiff += Utils.toFloat(style[val as any])));
      v.forEach((val) => (this.headerColumnHeightDiff += Utils.toFloat(style[val as any])));
    }
    el.remove();

    const r = createDomElement('div', { className: 'slick-row' }, this._canvas[0]);
    el = createDomElement('div', { className: 'slick-cell', id: '', style: { visibility: 'hidden' }, textContent: '-' }, r);
    style = getComputedStyle(el);
    if (style.boxSizing !== 'border-box') {
      h.forEach((val) => (this.cellWidthDiff += Utils.toFloat(style[val as any])));
      v.forEach((val) => (this.cellHeightDiff += Utils.toFloat(style[val as any])));
    }
    r.remove();

    this.absoluteColumnMinWidth = Math.max(this.headerColumnWidthDiff, this.cellWidthDiff);
  }

  protected createCssRules(): void {
    this._style = document.createElement('style');
    if (this._options.nonce) {
      this._style.nonce = this._options.nonce;
    }
    (this._options.shadowRoot || document.head).appendChild(this._style);

    const rules = [
      `.${this.uid} .slick-top-panel { height: ${this._options.topPanelHeight}px; }`,
      `.${this.uid} .slick-preheader-panel { height: ${this._options.preHeaderPanelHeight}px; }`,
      `.${this.uid} .slick-topheader-panel { height: ${this._options.topHeaderPanelHeight}px; }`,
      // Docking chrome bands use `display: contents`, so their persistent root
      // must carry the row height; otherwise the header-row/footer collapses to
      // the 1px spacer height even though each band has the configured height.
      `.${this.uid} .slick-headerrow-columns, .${this.uid} .slick-headerrow-columns-root { height: ${this._options.headerRowHeight}px; }`,
      `.${this.uid} .slick-footerrow-columns, .${this.uid} .slick-footerrow-columns-root { height: ${this._options.footerRowHeight}px; }`,
    ];

    // Rows get a default height from CSS; in variable-height mode, individual rows override
    // this via inline `style="height: Xpx"`. Cells use `height: 100%` (stylesheet) to fill their row.
    rules.push(`.${this.uid} .slick-row { height: ${this._options.rowHeight}px; }`);

    const sheet = this._style.sheet;

    /* v8 ignore else */
    if (sheet) {
      rules.forEach((rule) => sheet.insertRule(rule));

      for (let i = 0; i < this.columns.length; i++) {
        if (this.columns[i]) {
          sheet.insertRule(`.${this.uid} .l${i} { }`);
          sheet.insertRule(`.${this.uid} .r${i} { }`);
        }
      }
    } else {
      // fallback in case the 1st approach doesn't work, let's use our previous way of creating the css rules which is what works in Salesforce :(
      this.createCssRulesAlternative(rules);
    }
  }

  /** Create CSS rules via template in case the first approach with createElement('style') doesn't work */
  /* v8 ignore next */
  protected createCssRulesAlternative(rules: string[]): void {
    const template = document.createElement('template');
    template.innerHTML = '<style type="text/css" rel="stylesheet" />';
    this._style = template.content.firstChild as HTMLStyleElement;
    (this._options.shadowRoot || document.head).appendChild(this._style);

    for (let i = 0; i < this.columns.length; i++) {
      if (this.columns[i] && !this.columns[i].hidden) {
        rules.push(`.${this.uid} .l${i} { }`);
        rules.push(`.${this.uid} .r${i} { }`);
      }
    }

    if ((this._style as any).styleSheet) {
      (this._style as any).styleSheet.cssText = rules.join(' '); // IE
    } else {
      this._style.appendChild(document.createTextNode(rules.join(' ')));
    }
  }

  protected getColumnCssRules(idx: number): { left: { selectorText: string }; right: { selectorText: string } } {
    let i: number;
    if (!this.stylesheet) {
      const sheets: any = (this._options.shadowRoot || document).styleSheets;

      if (this._options.devMode && typeof this._options.devMode.ownerNodeIndex === 'number' && this._options.devMode.ownerNodeIndex >= 0) {
        sheets[this._options.devMode.ownerNodeIndex].ownerNode = this._style;
      }

      for (i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        if ((sheet.ownerNode || sheet.owningElement) === this._style) {
          this.stylesheet = sheet;
          break;
        }
      }

      /* v8 ignore if */
      if (!this.stylesheet) {
        throw new Error('SlickGrid Cannot find stylesheet.');
      }

      // find and cache column CSS rules
      this.columnCssRulesL = [];
      this.columnCssRulesR = [];
      const cssRules = this.stylesheet.cssRules || this.stylesheet.rules;
      let matches;
      let columnIdx;
      for (i = 0; i < cssRules.length; i++) {
        const selector = cssRules[i].selectorText;
        if ((matches = /\.l\d+/.exec(selector))) {
          columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
          this.columnCssRulesL[columnIdx] = cssRules[i];
        } else if ((matches = /\.r\d+/.exec(selector))) {
          columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
          this.columnCssRulesR[columnIdx] = cssRules[i];
        }
      }
    }

    return {
      left: this.columnCssRulesL![idx],
      right: this.columnCssRulesR![idx],
    };
  }

  protected removeCssRules(): void {
    this._style?.remove();
    this.stylesheet = null;
  }

  /** Clear all highlight timers that might have been left opened */
  protected clearAllTimers(): void {
    this.clearAutoScrollTimer();
    [
      this._columnResizeTimer,
      this._executionBlockTimer,
      this._flashCellTimer,
      this._highlightRowTimer,
      this.h_editorLoader,
      this.h_postrender,
      this.h_postrenderCleanup,
    ].forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.cancelSingleViewportRender();
    this.cancelScheduledAnimationFrame(this.stickyColumnLayoutFrame);
    this.stickyColumnLayoutFrame = undefined;
  }

  protected clearAutoScrollTimer(): void {
    if (this._columnResizeAutoScrollTimer) {
      clearInterval(this._columnResizeAutoScrollTimer);
      this._columnResizeAutoScrollTimer = undefined;
    }
  }

  /**
   * Destroy (dispose) of SlickGrid
   * @param {boolean} shouldDestroyAllElements - do we want to destroy (nullify) all DOM elements as well? This help in avoiding mem leaks
   */
  destroy(shouldDestroyAllElements?: boolean): void {
    this.clearAllTimers();
    this.slickDraggableInstance = this.destroyAllInstances(this.slickDraggableInstance) as null;
    this.slickMouseWheelInstances = this.destroyAllInstances(this.slickMouseWheelInstances) as InteractionBase[];
    this.slickResizableInstances = this.destroyAllInstances(this.slickResizableInstances) as InteractionBase[];
    this.getEditorLock()?.cancelCurrentEdit();
    this.clearInternalDomCaches();

    this.triggerEvent(this.onBeforeDestroy, {});
    this._bindingEventService.unbindAll();
    this._pubSubService?.unsubscribeAll();

    let i = this.plugins.length;
    while (i--) {
      this.unregisterPlugin(this.plugins[i]);
    }

    if (this.sortableSideRightInstance?.el && typeof this.sortableSideRightInstance?.destroy === 'function') {
      this.sortableSideRightInstance.destroy();
    }
    if (this.sortableSideCenterInstance?.el && typeof this.sortableSideCenterInstance?.destroy === 'function') {
      this.sortableSideCenterInstance.destroy();
    }
    if (this.sortableSideLeftInstance?.el && typeof this.sortableSideLeftInstance?.destroy === 'function') {
      this.sortableSideLeftInstance.destroy();
    }

    this._focusSink?.remove();
    this._focusSink2?.remove();

    // Mark the grid as inactive before its DOM references are cleared. Async data/sort
    // callbacks can finish after destruction and must not attempt to update a null container.
    this.initialized = false;
    emptyElement(this._container);
    this.removeCssRules();

    if (shouldDestroyAllElements) {
      destroyAllElementProps(this);
    }
  }

  protected clearInternalDomCaches(): void {
    this.activeCellNode = null;
    this.rowsCache = {};
    this.postProcessedRows = {};
    this.postProcessedCleanupQueue.length = 0;
  }

  /**
   * call destroy method, when exists, on all the instance(s) it found
   * @params instances - can be a single instance or a an array of instances
   */
  protected destroyAllInstances(inputInstances: null | InteractionBase | Array<InteractionBase>): InteractionBase[] | null {
    if (inputInstances) {
      const instances = Array.isArray(inputInstances) ? inputInstances : [inputInstances];
      let instance: InteractionBase | undefined;
      while (isDefined((instance = instances.pop()))) {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      }
    }
    // reset instance(s)
    inputInstances = Array.isArray(inputInstances) ? [] : null;
    return inputInstances;
  }

  // Column Autosizing

  autosizeColumns(): void {
    this.legacyAutosizeColumns();
  }

  /**
   * legacy autosizeColumns() method that was used before 6pac/SlickGrid reimplemented autosizeColumns().
   * We could simply rename the method to autosizeColumns() but let's keep separate for now
   * to make it easier to compare against 6pac/SlickGrid fork
   */
  protected legacyAutosizeColumns(): void {
    let i;
    let c: C | undefined;
    let shrinkLeeway = 0;
    let total = 0;
    let prevTotal = 0;
    const widths: number[] = [];
    const availWidth = this.getViewportInnerWidth();

    for (i = 0; i < this.columns.length; i++) {
      c = this.columns[i];
      if (!c || c.hidden) {
        widths.push(0);
        continue;
      }
      widths.push(c.width || 0);
      total += c.width || 0;
      if (c.resizable) {
        shrinkLeeway += (c.width || 0) - Math.max(c.minWidth || 0, this.absoluteColumnMinWidth);
      }
    }

    // shrink
    prevTotal = total;
    while (total > availWidth && shrinkLeeway) {
      const shrinkProportion = (total - availWidth) / shrinkLeeway;
      for (i = 0; i < this.columns.length && total > availWidth; i++) {
        c = this.columns[i];
        if (c && !c.hidden) {
          const width = widths[i];
          if (!c.resizable || width <= c.minWidth! || width <= this.absoluteColumnMinWidth) {
            continue;
          }
          const absMinWidth = Math.max(c.minWidth!, this.absoluteColumnMinWidth);
          let shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
          shrinkSize = Math.min(shrinkSize, width - absMinWidth);
          total -= shrinkSize;
          shrinkLeeway -= shrinkSize;
          widths[i] -= shrinkSize;
        }
      }
      /* v8 ignore if - avoid infinite loop */
      if (prevTotal <= total) {
        break;
      }
      prevTotal = total;
    }

    // grow
    prevTotal = total;
    while (total < availWidth) {
      const growProportion = availWidth / total;
      for (i = 0; i < this.columns.length && total < availWidth; i++) {
        c = this.columns[i];
        if (c && !c.hidden) {
          const currentWidth = widths[i];
          let growSize;

          if (!c.resizable || c.maxWidth! <= currentWidth) {
            growSize = 0;
          } else {
            growSize = Math.min(Math.floor(growProportion * currentWidth) - currentWidth, c.maxWidth! - currentWidth || 1000000) || 1;
          }
          total += growSize;
          widths[i] += total <= availWidth ? growSize : 0;
        }
      }
      /* v8 ignore if - avoid infinite loop */
      if (prevTotal >= total) {
        break;
      }
      prevTotal = total;
    }

    let reRender = false;
    for (i = 0; i < this.columns.length; i++) {
      c = this.columns[i];
      if (c && !c.hidden) {
        if (this.columns[i].rerenderOnResize && this.columns[i].width !== widths[i]) {
          reRender = true;
        }
        this.columns[i].width = widths[i];
      }
    }

    this.reRenderColumns(reRender);
  }

  /**
   * Apply Columns Widths in the UI and optionally invalidate & re-render the columns when specified
   * @param {Boolean} shouldReRender - should we invalidate and re-render the grid?
   */
  reRenderColumns(reRender?: boolean): void {
    this.applyColumnHeaderWidths();
    this.updateCanvasWidth(true);

    if (this._options.autoHeaderHeight) {
      this.recalculateHeaderHeight();
    }

    this.triggerEvent(this.onAutosizeColumns, { columns: this.columns });

    if (reRender) {
      this.invalidateAllRows();
      this.render();
    }
  }

  getVisibleColumns(): C[] {
    return this.columns.filter((c) => !c.hidden);
  }

  /** Returns columns in their current rendered docking order. Hidden columns are optionally included. */
  getColumnsInRenderedOrder(includeHidden = false): C[] {
    const columns = includeHidden ? this.columns : this.getVisibleColumns();
    if (!this.hasConfiguredColumnDocking()) {
      return columns;
    }

    return (['left', 'center', 'right'] as const).flatMap((band) => {
      const rendered = this.dockingLayout[band]
        .map(({ index }) => this.columns[index])
        .filter((column): column is C => !!column && !column.hidden);

      if (includeHidden) {
        for (const column of columns.filter((column) => column.hidden && (column.pinned ?? 'center') === band)) {
          const columnIndex = columns.indexOf(column);
          const insertAt = rendered.findIndex((current) => columns.indexOf(current) > columnIndex);
          rendered.splice(insertAt < 0 ? rendered.length : insertAt, 0, column);
        }
      }
      return rendered;
    });
  }

  protected getVisibleColumnIndexes(columns: C[] = this.columns): number[] {
    return columns.reduce<number[]>((indexes, column, index) => {
      if (column && !column.hidden) {
        indexes.push(index);
      }
      return indexes;
    }, []);
  }

  // General

  triggerEvent<ArgType = any>(evt: SlickEvent, args?: ArgType, e?: Event | SlickEventData): SlickEventData<any> {
    const sed: SlickEventData = (e || new SlickEventData(e, args)) as SlickEventData;
    const eventArgs = (args || {}) as ArgType & { grid: SlickGrid<TData, C, O> };
    eventArgs.grid = this;
    return evt.notify(eventArgs, sed, this);
  }

  /** Get Editor lock */
  getEditorLock() {
    return this._options.editorLock as SlickEditorLock;
  }

  /** Get Editor Controller */
  getEditController(): EditController | undefined {
    return this.editController;
  }

  /**
   * Returns the index of a column with a given id. Since columns can be reordered by the user, this can be used to get the column definition independent of the order:
   * @param {String | Number} id A column id.
   */
  getColumnIndex(id: number | string): number {
    return this.columnsById[id];
  }

  /**
   * Returns the index of a visible column with a given id. Since columns can be reordered by the user, this can be used to get the column definition independent of the order:
   * @param {String | Number} id A column id.
   */
  getVisibleColumnIndex(id: number | string): number {
    return this.visibleColumnsById[id];
  }

  /** Returns the column object by its ID */
  getColumnById(id: number | string): C | null {
    const index = this.getColumnIndex(id);
    if (isDefined(index)) {
      return this.columns[index];
    }
    return null;
  }

  /** Update any column properties by their finding column by ID */
  updateColumnById(columnId: number | string, props: Partial<C>, forceColumnUpdate = false): void {
    const column = this.getColumnById(columnId);
    if (isDefined(column)) {
      Object.assign(column, props);
    }

    if (forceColumnUpdate) {
      this.updateColumns();
    }
  }

  protected applyColumnHeaderWidths(): void {
    if (this.initialized) {
      const vc = this.getVisibleColumns();
      const headers = this.usesDockingChromeRegions()
        ? this.getHeaderChildren()
        : (this._headers.flatMap((header) => Array.from(header.children)) as HTMLElement[]);
      headers.forEach((h, columnIndex) => {
        const col = vc[columnIndex] || {};
        let width = (col.width || 0) - this.headerColumnWidthDiff;
        if (this._options.enableGridMenu && columnIndex === vc.length - 1) {
          // Only apply compensation if columns are at least as wide as the canvas (i.e., horizontal scroll is needed).
          // This avoids a gap at the end of the last column when columns are smaller than the grid.
          const totalColumnsWidth = vc.reduce((sum, col) => sum + (col.width || 0), 0);
          const canvasWidth = this.getViewportInnerWidth();
          if (totalColumnsWidth >= canvasWidth) {
            // Compensate for the resize handle and grid menu button (including hidden/collapsed scrollbars)
            width -= this._lastColumnGridMenuCompensation;
            if (!this.scrollbarDimensions?.width) {
              width -= this._options.gridMenu?.menuWidth ?? 18;
            }
          }
        }
        if (Utils.width(h) !== width) {
          Utils.width(h, width);
        }
      });

      this.updateColumnCaches();
    }
  }

  protected applyColumnWidths(): void {
    let rule: any;
    const centerWidth = this.hasDockedColumns() ? this.getDockingRenderedCenterWidth() : this.dockingLayout.centerWidth;
    for (let i = 0; i < this.columns.length; i++) {
      if (this.columns[i]) {
        const w = this.columns[i].hidden ? 0 : this.columns[i].width || 0;
        const docked = this.dockingByColumn.get(i);
        const x = this.columnPosLeft[i] ?? docked?.offset ?? 0;
        const rightEdge = this.columnPosRight[i] ?? x + w;
        const bandWidth =
          docked?.band === 'left' ? this.dockingLayout.leftWidth : docked?.band === 'right' ? this.dockingLayout.rightWidth : centerWidth;

        rule = this.getColumnCssRules(i);
        if (this._options.rtl) {
          if (rule.left) {
            rule.left.style.right = `${x}px`;
          }
          if (rule.right) {
            rule.right.style.left = `${bandWidth - rightEdge}px`;
          }
        } else {
          if (rule.left) {
            rule.left.style.left = `${x}px`;
          }
          if (rule.right) {
            rule.right.style.right = `${bandWidth - rightEdge}px`;
          }
        }
      }
    }
  }

  /**
   * Get column header by index
   * @param {Number} idx - column index
   * @returns - column header HTML element
   */
  getColumnHeaderByIndex(idx: number): HTMLElement | undefined {
    return this.getColumnByIndex(idx);
  }

  /** @deprecated @alias `getColumnHeaderByIndex` Get column header by index */
  getColumnByIndex(idx: number): HTMLElement | undefined {
    if (this.usesDockingChromeRegions()) {
      const column = this.getVisibleColumns()[idx];
      return Array.from(this._headerL.querySelectorAll('.slick-header-column')).find(
        (element) => (element as HTMLElement).dataset.id === String(column?.id)
      ) as HTMLElement | undefined;
    }
    let result: HTMLElement | undefined;
    this._headers.every((header) => {
      const length = header.children.length;
      if (idx < length) {
        result = header.children[idx] as HTMLElement;
        return false;
      }
      idx -= length;
      return true;
    });

    return result;
  }

  /**
   * Get column by index
   * @param {Number} idx - column index
   * @returns - column object
   */
  getColumnByIdx(idx: number): C | null {
    return this.columns[idx];
  }

  /**
   * Accepts a columnId string and an ascending boolean. Applies a sort glyph in either ascending or descending form to the header of the column. Note that this does not actually sort the column. It only adds the sort glyph to the header.
   * @param {String | Number} columnId
   * @param {Boolean} ascending
   */
  setSortColumn(columnId: number | string, ascending: boolean): void {
    this.setSortColumns([{ columnId, sortAsc: ascending }]);
  }

  /**
   * Accepts an array of objects in the form [ { columnId: [string], sortAsc: [boolean] }, ... ]. When called, this will apply a sort glyph in either ascending or descending form to the header of each column specified in the array. Note that this does not actually sort the column. It only adds the sort glyph to the header
   * @param {ColumnSort[]} cols - column sort
   */
  setSortColumns(cols: ColumnSort[]): void {
    this.sortColumns = cols;

    const numberCols = this._options.numberedMultiColumnSort && this.sortColumns.length > 1;
    this._headers.forEach((header) => {
      let indicators = header.querySelectorAll('.slick-header-column-sorted');
      // v8 ignore next
      indicators.forEach((indicator) => indicator.classList.remove('slick-header-column-sorted'));

      indicators = header.querySelectorAll('.slick-sort-indicator');
      indicators.forEach((indicator) => indicator.classList.remove('slick-sort-indicator-asc', 'slick-sort-indicator-desc'));

      indicators = header.querySelectorAll('.slick-sort-indicator-numbered');
      indicators.forEach((el) => (el.textContent = ''));
    });

    let i = 1;
    this.sortColumns.forEach((col) => {
      if (!isDefined(col.sortAsc)) {
        col.sortAsc = true;
      }

      const columnIndex = this.getVisibleColumnIndex(col.columnId);
      if (isDefined(columnIndex)) {
        const column = this.getColumnHeaderByIndex(columnIndex);
        if (column) {
          column.classList.add('slick-header-column-sorted');
          let indicator = column.querySelector('.slick-sort-indicator');
          indicator?.classList.add(col.sortAsc ? 'slick-sort-indicator-asc' : 'slick-sort-indicator-desc');

          if (numberCols) {
            indicator = column.querySelector('.slick-sort-indicator-numbered') as HTMLElement;
            if (indicator) {
              indicator.textContent = String(i);
            }
          }
        }
      }
      i++;
    });
  }

  /** Get sorted columns **/
  getSortColumns(): ColumnSort[] {
    return this.sortColumns;
  }

  protected getDragHandleVisibility(): boolean | 'hover' {
    return this._options.selectionOptions?.showDragHandle ?? this.getSelectionModel()?.getOptions()?.showDragHandle ?? true;
  }

  protected handleSelectedRangesChanged(e: SlickEventData, ranges: SlickRange[]): void {
    const ne = e.getNativeEvent<CustomEvent>();
    const selectionMode: CellSelectionMode = ne?.detail?.selectionMode ?? '';
    const caller = ne?.detail?.caller ?? 'click';
    const isBulkSelection = caller === 'click.selectAll' || caller === 'click.unselectAll';
    let addDragHandle = !!ne?.detail?.addDragHandle;
    const selectedCellCssClass = this._options.selectedCellCssClass || '';

    const selectionType = this.getSelectionModel()?.getOptions()?.selectionType;
    const showDragHandle = this.getDragHandleVisibility();
    addDragHandle = selectionType === 'cell' || selectionType === 'mixed';

    // drag and replace functionality
    const prevSelectedRanges = this.selectedRanges.slice(0);
    this.selectedRanges = ranges;

    if (selectionMode === 'REP' && prevSelectedRanges.length === this.selectedRanges.length && prevSelectedRanges.length > 0) {
      let changedRangeIndex = -1;
      for (let i = 0; i < this.selectedRanges.length; i++) {
        const previousRange = prevSelectedRanges[i];
        const selectedRange = this.selectedRanges[i];
        if (
          previousRange.fromRow !== selectedRange.fromRow ||
          previousRange.fromCell !== selectedRange.fromCell ||
          previousRange.toRow !== selectedRange.toRow ||
          previousRange.toCell !== selectedRange.toCell
        ) {
          if (changedRangeIndex !== -1) {
            changedRangeIndex = -1;
            break;
          }
          changedRangeIndex = i;
        }
      }

      if (changedRangeIndex !== -1) {
        const prevSelectedRange = prevSelectedRanges[changedRangeIndex];
        const selectedRange = this.selectedRanges[changedRangeIndex];

        // check range has expanded
        if (SlickSelectionUtils.copyRangeIsLarger(prevSelectedRange, selectedRange)) {
          this.triggerEvent(this.onDragReplaceCells, { prevSelectedRange, selectedRange });
          this.invalidate();
        }
      }
    }

    const previousSelectedRows = this.selectedRows.slice(0); // shallow copy previously selected rows for later comparison
    this.selectionBottomRow = -1;
    this.selectionRightCell = -1;
    this.dragReplaceEl.removeEl();
    this.selectedRows = [];
    const hash: CssStyleHash = Object.create(null);
    const selectedRowsSet = ranges.length > 1 ? new Set<number>() : undefined;
    let rangesAreOrdered = true;
    for (let i = 0; i < ranges.length; i++) {
      if (i > 0 && ranges[i - 1].toRow >= ranges[i].fromRow) {
        rangesAreOrdered = false;
      }
      for (let j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        if (!selectedRowsSet || !selectedRowsSet.has(j)) {
          selectedRowsSet?.add(j);
          this.selectedRows.push(j);
        }
        const rowHash = this.rowsCache[j] ? (hash[j] ??= Object.create(null)) : undefined;
        for (let k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
          if (rowHash && this.canCellBeSelected(j, k)) {
            rowHash[this.columns[k].id] = selectedCellCssClass;
          }
        }
      }
    }

    if (!isBulkSelection || !rangesAreOrdered) {
      // Preserve the legacy default sort order (numeric values are compared as strings).
      this.selectedRows.sort();
    }

    const activeRange = ranges[ranges.length - 1];
    if (activeRange) {
      this.selectionBottomRow = activeRange.toRow;
      this.selectionRightCell = activeRange.toCell;
    }

    this.setCellCssStyles(selectedCellCssClass, hash);

    if (this.selectionBottomRow >= 0 && this.selectionRightCell >= 0 && addDragHandle && showDragHandle !== false) {
      const lowerRightCell = this.getCellNode(this.selectionBottomRow, this.selectionRightCell);
      this.dragReplaceEl.createEl(lowerRightCell, showDragHandle);
    }

    let selectedRowsChanged = previousSelectedRows.length !== this.selectedRows.length;
    if (!selectedRowsChanged) {
      const previousSelectedRowsSet = new Set(previousSelectedRows);
      selectedRowsChanged = this.selectedRows.some((row) => !previousSelectedRowsSet.has(row));
    }
    if (selectedRowsChanged) {
      const selectedRows = this.getSelectedRows();
      const selectedRowsSet = selectedRows.length ? new Set(selectedRows) : undefined;
      const previousSelectedRowsSet = previousSelectedRows.length ? new Set(previousSelectedRows) : undefined;
      const newSelectedAdditions = previousSelectedRowsSet ? selectedRows.filter((i) => !previousSelectedRowsSet.has(i)) : selectedRows;
      const newSelectedDeletions = selectedRowsSet ? previousSelectedRows.filter((i) => !selectedRowsSet.has(i)) : previousSelectedRows;

      this.triggerEvent(
        this.onSelectedRowsChanged,
        {
          rows: selectedRows,
          previousSelectedRows,
          caller,
          changedSelectedRows: newSelectedAdditions,
          changedUnselectedRows: newSelectedDeletions,
        },
        e
      );
    }
  }

  // compare 2 primitive type arrays, do not use to compare object arrays)
  arrayEquals<T extends boolean | string | number>(arr1: Array<T>, arr2: Array<T>): boolean {
    return Array.isArray(arr1) && Array.isArray(arr2) && arr2.toString() === arr1.toString();
  }

  /** Returns an array of column definitions. */
  getColumns(): C[] {
    return this.columns;
  }

  /**
   * Applies the unified permanent column pinning option. Column references may
   * be numeric edge shorthands, ids, or zero-based indexes; left pinning wins
   * if a reference appears in both lists.
   */
  protected applyColumnPinningOptions(columns: C[]): void {
    const configuredColumns = this._options.pinning?.columns;

    if (configuredColumns !== undefined) {
      const leftRefs = new Set(this.normalizeColumnPinningReferences(configuredColumns.left, 'left', columns.length));
      const rightRefs = new Set(this.normalizeColumnPinningReferences(configuredColumns.right, 'right', columns.length));

      columns.forEach((column, index) => {
        if (!column) {
          return;
        }
        if (!this.pinningColumnsState.has(column.id)) {
          this.pinningColumnsState.set(column.id, column.pinned);
        }

        const isLeftPinned = leftRefs.has(index) || leftRefs.has(column.id);
        const isRightPinned = rightRefs.has(index) || rightRefs.has(column.id);
        column.pinned = isLeftPinned ? 'left' : isRightPinned ? 'right' : null;
      });
      return;
    }

    // If the unified option was removed, restore only the values it changed.
    columns.forEach((column) => {
      if (!column || !this.pinningColumnsState.has(column.id)) {
        return;
      }
      column.pinned = this.pinningColumnsState.get(column.id) ?? null;
      this.pinningColumnsState.delete(column.id);
    });
  }

  /** Resolve pinning options or column flags into visible indexes by edge. */
  protected getPinnedColumnIndexes(configuredColumns?: PinnedColumns): Map<number, DockingSide> {
    const pinnedIndexes = new Map<number, DockingSide>();
    const columns = configuredColumns ?? this._options.pinning?.columns;
    if (columns !== undefined) {
      const left = this.normalizeColumnPinningReferences(columns.left, 'left', this.columns.length);
      const right = this.normalizeColumnPinningReferences(columns.right, 'right', this.columns.length);
      left.forEach((reference) => {
        const index = typeof reference === 'number' ? reference : this.getColumnIndex(reference);
        if (isDefinedNumber(index) && !this.columns[index]?.hidden) {
          pinnedIndexes.set(index, 'left');
        }
      });
      right.forEach((reference) => {
        const index = typeof reference === 'number' ? reference : this.getColumnIndex(reference);
        if (isDefinedNumber(index) && !this.columns[index]?.hidden && !pinnedIndexes.has(index)) {
          pinnedIndexes.set(index, 'right');
        }
      });
      return pinnedIndexes;
    }

    this.columns.forEach((column, index) => {
      if (!column?.hidden && (column.pinned === 'left' || column.pinned === 'right')) {
        pinnedIndexes.set(index, column.pinned);
      }
    });
    return pinnedIndexes;
  }

  /** Keep a scrollable center column and reject bands that consume the viewport. */
  protected validatePinnedColumnIndexes(pinnedIndexes: Map<number, DockingSide>, forceAlert = false, columns: C[] = this.columns): boolean {
    if (this._options.skipPinningValidation) {
      return true;
    }

    if (!this.validateColspanPinningSequence(pinnedIndexes, forceAlert, columns)) {
      return false;
    }

    const visibleIndexes = this.getVisibleColumnIndexes(columns);
    if (visibleIndexes.length && visibleIndexes.every((index) => pinnedIndexes.has(index))) {
      if ((forceAlert || !this._invalidPinningAlerted) && this._options.invalidColumnPinningPickerCallback) {
        this._options.invalidColumnPinningPickerCallback(this._options.invalidColumnPinningPickerMessage!);
        this._invalidPinningAlerted = true;
      }
      return false;
    }

    const widths = { left: 0, right: 0 };
    pinnedIndexes.forEach((side, index) => {
      const column = columns[index];
      if (!column || column.hidden) {
        return;
      }
      const { minWidth = 0, maxWidth = 0, width = this._options.defaultColumnWidth! } = column;
      let effectiveWidth = Math.max(width, minWidth);
      if (maxWidth > 0) {
        effectiveWidth = Math.min(effectiveWidth, maxWidth);
      }
      widths[side] += effectiveWidth;
    });

    const viewportWidth = this._viewportNode?.clientWidth || this.getViewportInnerWidth() || Utils.width(this._container) || 0;
    // Include the reserved scrollbar strip; clientWidth excludes it while the
    // legacy validation compared against the outer grid width.
    const scrollbarWidth = this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0;
    const outerGridWidth = Utils.width(this._container) || 0;
    const availablePinningWidth = Math.max(viewportWidth + scrollbarWidth, outerGridWidth);
    if (viewportWidth > 0 && widths.left + widths.right >= availablePinningWidth) {
      if ((forceAlert || !this._invalidPinningAlerted) && this._options.invalidColumnPinningWidthCallback) {
        this._options.invalidColumnPinningWidthCallback(this._options.invalidColumnPinningWidthMessage!);
        this._invalidPinningAlerted = true;
      }
      return false;
    }
    return true;
  }

  /** Reject only non-sequential pinning that would visually split a rendered colspan. */
  protected validateColspanPinningSequence(
    pinnedIndexes: Map<number, DockingSide>,
    forceAlert = false,
    columns: C[] = this.columns
  ): boolean {
    const visibleIndexes = this.getVisibleColumnIndexes(columns);

    let previousBandOrder = 0;
    const isSequential = visibleIndexes.every((index) => {
      const band = pinnedIndexes.get(index) || 'center';
      const bandOrder = band === 'left' ? 0 : band === 'center' ? 1 : 2;
      if (bandOrder < previousBandOrder) {
        return false;
      }
      previousBandOrder = bandOrder;
      return true;
    });
    if (isSequential) {
      return true;
    }

    const hasCrossBandColspan = Object.keys(this.rowsCache).some((rowId) => {
      const metadata = this.getItemMetadaWhenExists(Number(rowId));
      if (!metadata?.columns || metadata.isGroup) {
        return false;
      }

      return Object.entries(metadata.columns).some(([columnRef, columnMetadata]) => {
        const columnIndex = Number(columnRef);
        const start = Number.isNaN(columnIndex) ? this.getColumnIndex(columnRef) : columnIndex;
        const span = columnMetadata?.colspan === '*' ? columns.length - start : Number(columnMetadata?.colspan || 1);
        if (!isDefinedNumber(start) || span <= 1) {
          return false;
        }
        const end = Math.min(columns.length - 1, start + span - 1);
        let firstBand: ColumnDockingBand | undefined;
        return visibleIndexes.some((index) => {
          if (index < start || index > end) {
            return false;
          }
          const band = pinnedIndexes.get(index) || 'center';
          if (!firstBand) {
            firstBand = band;
            return false;
          }
          return band !== firstBand;
        });
      });
    });

    if (!hasCrossBandColspan) {
      return true;
    }

    if ((forceAlert || !this._invalidPinningAlerted) && this._options.invalidColumnPinningPickerCallback) {
      this._options.invalidColumnPinningPickerCallback(this._options.invalidColumnPinningSequenceMessage!);
      this._invalidPinningAlerted = true;
    }
    return false;
  }

  /** Merge a partial pinning update before validating it. */
  protected getProspectivePinnedColumnIndexes(incomingColumns: PinnedColumns): Map<number, DockingSide> {
    const currentColumns = this._options.pinning?.columns;
    return this.getPinnedColumnIndexes({
      left: incomingColumns.left !== undefined ? incomingColumns.left : currentColumns?.left,
      right: incomingColumns.right !== undefined ? incomingColumns.right : currentColumns?.right,
    });
  }

  /** Normalize a numeric edge shorthand to the explicit indexes consumed by the docking resolver. */
  protected normalizeColumnPinningReferences(
    references: ColumnPinningReferences | undefined,
    side: DockingSide,
    columnCount: number
  ): Array<number | string> {
    if (Array.isArray(references)) {
      return [...references];
    }
    if (typeof references !== 'number' || !Number.isInteger(references) || references < 0 || columnCount === 0) {
      return [];
    }

    const requestedCount = side === 'left' ? references + 1 : references;
    const count = Math.min(requestedCount, columnCount);
    const firstIndex = side === 'left' ? 0 : columnCount - count;
    return Array.from({ length: count }, (_value, index) => firstIndex + index);
  }

  protected updateColumnCaches(): void {
    this.refreshDockingLayout();
    this.updateColumnPositionCaches();
  }

  /** Rebuild the virtual-rendering coordinates from the already-resolved docking layout. */
  protected updateColumnPositionCaches(): void {
    // Pre-calculate cell boundaries.
    this.columnPosLeft = [];
    this.columnPosRight = [];
    for (let i = 0, ii = this.columns.length; i < ii; i++) {
      if (this.columns[i]) {
        const docked = this.dockingByColumn.get(i);
        if (!this.columns[i].hidden) {
          this.columnPosLeft[i] = docked?.offset ?? 0;
          this.columnPosRight[i] = (docked?.offset ?? 0) + (this.columns[i].width || 0);
        }
      }
    }

    // Give hidden columns zero-width boundaries so span endpoints stay monotonic.
    for (let i = 0, ii = this.columns.length; i < ii; i++) {
      if (!this.columns[i] || !this.columns[i].hidden) {
        continue;
      }
      let previousVisible = i - 1;
      while (previousVisible >= 0 && this.columns[previousVisible]?.hidden) {
        previousVisible--;
      }
      let nextVisible = i + 1;
      while (nextVisible < ii && this.columns[nextVisible]?.hidden) {
        nextVisible++;
      }

      const previousBand = previousVisible >= 0 ? this.getColumnDockingBand(previousVisible) : undefined;
      const nextBand = nextVisible < ii ? this.getColumnDockingBand(nextVisible) : undefined;
      const band = previousBand ?? nextBand ?? 'center';
      const boundary =
        previousBand === band ? this.columnPosRight[previousVisible] : nextBand === band ? this.columnPosLeft[nextVisible] : 0;
      this.columnPosLeft[i] = boundary ?? 0;
      this.columnPosRight[i] = boundary ?? 0;
    }
  }

  /** Return a colspan endpoint when its endpoint column is hidden. */
  protected getColumnRangeRight(index: number, startIndex: number = index): number {
    if (!this.columns[index]?.hidden) {
      return this.columnPosRight[index] ?? 0;
    }
    const band = this.getColumnDockingBand(startIndex);
    let nextVisible = index + 1;
    while (nextVisible < this.columns.length && this.columns[nextVisible]?.hidden) {
      nextVisible++;
    }
    if (nextVisible < this.columns.length && this.getColumnDockingBand(nextVisible) === band) {
      return this.columnPosLeft[nextVisible] ?? 0;
    }
    let previousVisible = index - 1;
    while (previousVisible >= 0 && this.columns[previousVisible]?.hidden) {
      previousVisible--;
    }
    return previousVisible >= 0 && this.getColumnDockingBand(previousVisible) === band
      ? (this.columnPosRight[previousVisible] ?? 0)
      : (this.columnPosRight[index] ?? 0);
  }

  /**
   * Move already-rendered cells to their new docking region after a sticky
   * column crosses an edge. Keeping their formatter output and editor state in
   * place is considerably cheaper than invalidating every visible row.
   *
   * A layout that has just gained its first docked band has rows without the
   * three region wrappers. Let the normal render path rebuild those rare rows
   * rather than trying to retrofit their DOM structure here.
   */
  protected updateRenderedCellDocking(): boolean {
    // Likewise, removing the final band needs the normal renderer to remove
    // the no-longer-needed region wrappers.
    if (!this.usesDockingRowRegions()) {
      return false;
    }

    for (const cacheEntry of Object.values(this.rowsCache)) {
      const rowNode = cacheEntry.rowNode?.[0];
      if (rowNode && !rowNode.classList.contains('slick-row-docked')) {
        return false;
      }
      if (Object.keys(cacheEntry.cellSpanFragments || {}).length) {
        return false;
      }
    }

    for (const cacheEntry of Object.values(this.rowsCache)) {
      const rowNode = cacheEntry.rowNode?.[0];
      if (!rowNode) {
        continue;
      }

      this.ensureCellNodesInRowsCache(+rowNode.dataset.row!);
      Object.keys(cacheEntry.cellNodesByColumnIdx).forEach((columnIndex) => {
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIndex)) {
          return;
        }
        const index = +columnIndex;
        const cellNode = cacheEntry.cellNodesByColumnIdx[index];
        const docking = this.dockingByColumn.get(index);
        const band = docking?.band || 'center';
        const isFullWidthGroup = rowNode.classList.contains('slick-row-full-width-group');

        cellNode.classList.toggle('slick-cell-full-width-group', isFullWidthGroup);
        cellNode.classList.toggle('slick-cell-pinned-left', !isFullWidthGroup && band === 'left');
        cellNode.classList.toggle('slick-cell-pinned-right', !isFullWidthGroup && band === 'right');
        cellNode.classList.toggle('slick-cell-sticky', !isFullWidthGroup && band !== 'center' && !!docking?.sticky);

        const region = this.getRowDockingRegion(rowNode, index);
        if (cellNode.parentElement !== region) {
          region.appendChild(cellNode);
        }
      });

      Object.values(cacheEntry.cellRegions || {}).forEach((region) => {
        const cells = Array.from(region.children) as HTMLElement[];
        cells.sort((a, b) => this.getCellFromNode(a) - this.getCellFromNode(b)).forEach((cell) => region.appendChild(cell));
      });
    }
    return true;
  }

  protected refreshDockingLayout(scrollLeft: number = this.scrollLeft, preserveUnchanged = false): boolean {
    const previousRevision = this.dockingLayout.revision;
    this.dockingController.setOptions(this._options.docking);
    const nextLayout = this.dockingController.resolveColumns(
      this.columns,
      scrollLeft,
      // Sticky thresholds must use the body viewport's visible width. The
      // outer grid width includes the vertical scrollbar gutter, which made
      // right stickies wait until scrolling roughly one scrollbar-width past
      // the actual edge.
      this.getViewportInnerWidth() || this.viewportW || Utils.width(this._container) || 0,
      this._options.rtl ? 'right' : 'left'
    );
    if (preserveUnchanged && nextLayout.revision === previousRevision) {
      return false;
    }
    this.dockingLayout = nextLayout;
    this.dockingByColumn.clear();
    for (const entry of [...this.dockingLayout.left, ...this.dockingLayout.center, ...this.dockingLayout.right]) {
      this.dockingByColumn.set(entry.index, entry);
    }
    return this.dockingLayout.revision !== previousRevision;
  }

  protected getColumnDockingBand(columnIndex: number): ColumnDockingBand {
    return this.dockingByColumn.get(columnIndex)?.band || 'center';
  }

  protected hasDockedColumns(): boolean {
    return this.dockingLayout.left.length > 0 || this.dockingLayout.right.length > 0;
  }

  /** The single-viewport renderer exposes all three row regions. */
  protected usesDockingRowRegions(): boolean {
    return this.hasConfiguredDocking();
  }

  protected getRowIdentity(row: number): number | string {
    const item = this.getDataItem(row);
    const idProperty = this._options.datasetIdPropertyName || 'id';
    if (item && typeof item === 'object') {
      const id = (item as Record<string, unknown>)[idProperty];
      if (typeof id === 'number' || typeof id === 'string') {
        return id;
      }
    }
    return row;
  }

  protected resolveDockingRowIndex(reference: number | string): number | undefined {
    if (this.dockingRowIndexByReference.has(reference)) {
      return this.dockingRowIndexByReference.get(reference);
    }
    if (typeof reference === 'number' && Number.isInteger(reference) && reference >= 0 && reference < this.getDataLength()) {
      this.dockingRowIndexByReference.set(reference, reference);
      return reference;
    }
    const getRowById = (this.data as CustomDataView<TData> & { getRowById?: (id: number | string) => number | undefined }).getRowById;
    const dataViewRow = getRowById?.call(this.data, reference);
    if (dataViewRow !== undefined) {
      this.dockingRowIndexByReference.set(reference, dataViewRow);
      return dataViewRow;
    }
    const idProperty = this._options.datasetIdPropertyName || 'id';
    if (Array.isArray(this.data)) {
      const index = this.data.findIndex(
        (item) => item && typeof item === 'object' && (item as Record<string, unknown>)[idProperty] === reference
      );
      if (index >= 0) {
        this.dockingRowIndexByReference.set(reference, index);
      }
      return index >= 0 ? index : undefined;
    }
    return undefined;
  }

  protected refreshRowDockingLayout(scrollTop: number = this.scrollTop, rebuildReferences = false): boolean {
    if (rebuildReferences) {
      this.dockingRowIndexByReference.clear();
    }
    const references = [
      ...(this._options.pinning?.rows?.top || []),
      ...(this._options.pinning?.rows?.bottom || []),
      ...(this._options.stickyRows?.top || []),
      ...(this._options.stickyRows?.bottom || []),
      ...(this._options.stickyRows?.both || []),
    ];
    const rows = Array.from(new Set(references.map((reference) => this.resolveDockingRowIndex(reference)).filter(isDefinedNumber))).map(
      (index) => ({
        height: this.getRowHeight(index),
        id: this.getRowIdentity(index),
        index,
        top: this.getRowPosition(index),
      })
    );
    const previousRevision = this.rowDockingLayout.revision;
    this.rowDockingLayout = this.dockingController.resolveRows(
      rows,
      scrollTop + this.offset,
      this._viewportScrollContainerY?.clientHeight || this.viewportH,
      this._options.pinning?.rows,
      this._options.stickyRows
    );
    this.dockingByRow.clear();
    for (const entry of [...this.rowDockingLayout.top, ...this.rowDockingLayout.center, ...this.rowDockingLayout.bottom]) {
      this.dockingByRow.set(entry.index, entry);
    }
    const hasConfiguredRowDocking = this.hasConfiguredRowDocking();
    if (hasConfiguredRowDocking) {
      this.ensureDockingOverlay();
    }
    this.syncDockedRowContainers();
    if (!hasConfiguredRowDocking && this._dockingOverlay) {
      // Return any previously docked rows to the normal canvas first, then
      // remove the now-unused implementation layer. A grid without a row
      // docking feature should not expose a dormant overlay in its DOM.
      this._bindingEventService.unbindAll('docking-overlay');
      this._dockingOverlay.remove();
      this._dockingOverlay = undefined;
    }
    return this.rowDockingLayout.revision !== previousRevision;
  }

  /** Keep permanent/active docked rows outside the native scrolling canvas. */
  protected syncDockedRowContainers(): void {
    if (!this._dockingOverlay || !this._canvasNode) {
      return;
    }
    Object.entries(this.rowsCache).forEach(([rowId, cacheEntry]) => {
      const row = Number(rowId);
      const rowNode = cacheEntry.rowNode?.[0];
      if (!rowNode) {
        return;
      }
      const dockingBand = this.dockingByRow.get(row)?.band;
      const target = dockingBand && dockingBand !== 'center' ? this._dockingOverlay! : this._canvasNode;
      if (rowNode.parentElement !== target) {
        target.appendChild(rowNode);
      }
      this.applyRowTopOffset(rowNode, row);
      this.applyDockingScrollOffsetToRow(rowNode, cacheEntry);
    });
  }

  protected updateColumnProps(): void {
    this.columnsById = Object.create(null);
    this.visibleColumnsById = Object.create(null);

    for (let i = 0; i < this.columns.length; i++) {
      let m: C = this.columns[i] || {};
      if (m.width) {
        m.widthRequest = m.width;
      }

      if (this._options.mixinDefaults) {
        Utils.applyDefaults(m, this._columnDefaults);
      } else {
        m = this.columns[i] = extend({}, this._columnDefaults, m);
      }

      this.columnsById[m.id] = i;
      if (m.minWidth && (m.width || 0) < m.minWidth) {
        m.width = m.minWidth;
      }
      if (m.maxWidth && (m.width || 0) > m.maxWidth) {
        m.width = m.maxWidth;
      }
    }
    // also update visible columns
    this.getVisibleColumns().forEach((col, idx) => {
      this.visibleColumnsById[col.id] = idx;
    });
    this.refreshDockingLayout();
  }

  /**
   * Sets grid columns. Column headers will be recreated and all rendered rows will be removed. To rerender the grid (if necessary), call render().
   * @param {Column[]} newColumns An array of column definitions.
   * @param {boolean} [waitNextCycle=false] - should we wait for a microtask cycle before updating column headers
   */
  setColumns(newColumns: C[], waitNextCycle = false): void {
    this.applyColumnPinningOptions(newColumns);
    this.triggerEvent(this.onBeforeSetColumns, { previousColumns: this.columns, newColumns, grid: this });
    if (!this.validateColumnPinning(undefined, true)) {
      return; // exit early if pinning is invalid
    }
    this.dockingController.reset();
    this.columns = newColumns;
    this._container.setAttribute('aria-colcount', this.columns.length.toString());
    const updateCols = () => {
      this.updateColumns();
      this.triggerEvent(this.onAfterSetColumns, { newColumns, grid: this });
    };
    waitNextCycle ? queueMicrotaskPolyfill(() => updateCols()) : updateCols();
  }

  /** Update columns for when a hidden property has changed but the column list itself has not changed. */
  updateColumns(): void {
    this.triggerEvent(this.onBeforeUpdateColumns, { columns: this.columns, grid: this });
    this.updateColumnsInternal();
    this.triggerEvent(this.onAfterUpdateColumns, { columns: this.columns, grid: this });
  }

  protected updateColumnsInternal(): void {
    this.updateColumnProps();
    // Column visibility changes (for example from the Column Picker) call
    // updateColumns() directly rather than setColumns(). Re-apply the
    // declarative pinning option here as well so rebuilding the headers cannot
    // silently drop the pinned flags from the column definitions.
    this.applyColumnPinningOptions(this.columns);
    this.updateColumnCaches();

    if (this.initialized) {
      // Materialize the docking scrollbar lazily when pinning/sticky state is
      // introduced after initialization, while preserving the legacy
      // viewport scroll owner for ordinary grids.
      if (this.hasConfiguredDocking() && !this.hasDockingHorizontalScroller()) {
        this.activateSingleViewportLayout();
        this.setScroller();
        this._bindingEventService.bind(this._dockingHorizontalScroller!, 'scroll', this.handleScroll.bind(this));
      }
      this.setOverflow();
      this.invalidateAllRows();
      this.createColumnHeaders();
      this.createColumnFooter();
      this.removeCssRules();
      this.createCssRules();
      this.resizeCanvas();
      this.updateCanvasWidth();
      this.applyColumnWidths();
      if (this._options.autoHeaderHeight) {
        this.recalculateHeaderHeight();
      }
      this.handleScroll();
      this.getSelectionModel()?.refreshSelections();
    }
  }

  /** Returns an object containing all of the Grid options set on the grid. See a list of Grid Options here.  */
  getOptions(): O {
    return this._options;
  }

  /** Return visible columns currently docked at an edge, including active sticky columns. */
  getPinnedColumns(side?: DockingSide): C[] {
    const entries = side ? this.dockingLayout[side] : [...this.dockingLayout.left, ...this.dockingLayout.right];
    return entries.map((entry) => this.columns[entry.index]).filter(Boolean);
  }

  /** Permanently pin/unpin a column and rebuild the three-region row layout. */
  setColumnPinning(columnId: number | string, pinned: DockingSide | null): void {
    const column = this.getColumnById(columnId);
    if (!column || column.pinned === pinned) {
      return;
    }
    const columnIndex = this.getColumnIndex(column.id);
    if (!isDefinedNumber(columnIndex)) {
      return;
    }

    this._invalidPinningAlerted = false;
    const prospectivePinnedIndexes = this.getPinnedColumnIndexes();
    if (pinned) {
      prospectivePinnedIndexes.set(columnIndex, pinned);
    } else {
      prospectivePinnedIndexes.delete(columnIndex);
    }
    if (!this.validatePinnedColumnIndexes(prospectivePinnedIndexes, true)) {
      return;
    }
    column.pinned = pinned;

    // Keep the unified option authoritative when callers change a column
    // interactively (for example through the Header Menu).
    if (this._options.pinning?.columns !== undefined) {
      const removeReference = (reference: number | string) => reference !== column.id && reference !== columnIndex;
      const left = this.normalizeColumnPinningReferences(this._options.pinning.columns.left, 'left', this.columns.length).filter(
        removeReference
      );
      const right = this.normalizeColumnPinningReferences(this._options.pinning.columns.right, 'right', this.columns.length).filter(
        removeReference
      );
      if (pinned === 'left') {
        left.push(column.id);
      } else if (pinned === 'right') {
        right.push(column.id);
      }
      this._options.pinning.columns = { left, right };
    }

    this.dockingController.reset();
    this.updateColumns();
  }

  /** Make a center column sticky at one or both edges, or disable its sticky policy. */
  setColumnStickiness(columnId: number | string, sticky: DockingSide | 'both' | boolean): void {
    const column = this.getColumnById(columnId);
    if (!column || column.sticky === sticky) {
      return;
    }
    column.sticky = sticky;
    this.dockingController.reset();
    this.updateColumns();
  }

  /**
   * Extends grid options with a given hash. If an there is an active edit, the grid will attempt to commit the changes and only continue if the attempt succeeds.
   * @param {Object} options - an object with configuration options.
   * @param {Boolean} [suppressRender] - do we want to supress the grid re-rendering? (defaults to false)
   * @param {Boolean} [suppressColumnSet] - do we want to supress the columns set, via "setColumns()" method? (defaults to false)
   * @param {Boolean} [suppressSetOverflow] - do we want to suppress the call to `setOverflow`
   */
  setOptions(newOptions: Partial<O>, suppressRender?: boolean, suppressColumnSet?: boolean, suppressSetOverflow?: boolean): void {
    this.prepareForOptionsChange();

    // Validate the prospective declarative column state before deep-merging it
    // into the live options. A rejected request leaves the current pinning in
    // place but still permits a sibling row-pinning update in the same call.
    if (newOptions.pinning?.columns !== undefined) {
      if (!suppressColumnSet) {
        this._invalidPinningAlerted = false;
      }
      if (!this.validatePinnedColumnIndexes(this.getProspectivePinnedColumnIndexes(newOptions.pinning.columns), true)) {
        const pinningWithoutColumns = { ...newOptions.pinning };
        delete pinningWithoutColumns.columns;
        const optionsWithoutPinning = { ...newOptions };
        delete optionsWithoutPinning.pinning;
        newOptions = {
          ...optionsWithoutPinning,
          ...(Object.keys(pinningWithoutColumns).length ? { pinning: pinningWithoutColumns } : {}),
        } as Partial<O>;
      }
    }

    if (this._options.enableAddRow !== newOptions.enableAddRow) {
      this.invalidateRow(this.getDataLength());
    }

    const originalOptions = extend(true, {}, this._options);
    this._options = extend(true, this._options, newOptions);
    // Sticky and permanent row lists represent the complete docking state for each edge.
    // The generic deep merge helper merges non-empty arrays by index, which
    // leaves stale row references when a list is shortened (for example
    // changing 4 pinned rows back to 3). Replace both lists atomically.
    if (newOptions.stickyRows !== undefined) {
      this._options.stickyRows = {
        top: newOptions.stickyRows.top ? [...newOptions.stickyRows.top] : [],
        bottom: newOptions.stickyRows.bottom ? [...newOptions.stickyRows.bottom] : [],
        both: newOptions.stickyRows.both ? [...newOptions.stickyRows.both] : [],
      };
    }
    if (newOptions.pinning !== undefined) {
      const incomingPinning = newOptions.pinning;
      const currentPinning = this._options.pinning ?? {};
      const cloneColumnReferences = (references: ColumnPinningReferences | undefined): ColumnPinningReferences =>
        typeof references === 'number' ? references : references ? [...references] : [];
      this._options.pinning = {
        ...currentPinning,
        ...(incomingPinning?.columns !== undefined
          ? {
              columns: {
                left:
                  incomingPinning.columns.left !== undefined
                    ? cloneColumnReferences(incomingPinning.columns.left)
                    : cloneColumnReferences(currentPinning.columns?.left),
                right:
                  incomingPinning.columns.right !== undefined
                    ? cloneColumnReferences(incomingPinning.columns.right)
                    : cloneColumnReferences(currentPinning.columns?.right),
              },
            }
          : {}),
        ...(incomingPinning?.rows !== undefined
          ? {
              rows: {
                top: incomingPinning.rows.top !== undefined ? [...incomingPinning.rows.top] : [...(currentPinning.rows?.top ?? [])],
                bottom:
                  incomingPinning.rows.bottom !== undefined ? [...incomingPinning.rows.bottom] : [...(currentPinning.rows?.bottom ?? [])],
              },
            }
          : {}),
      };
    }
    this.triggerEvent(this.onSetOptions, { optionsBefore: originalOptions, optionsAfter: this._options });
    if (this.shouldRefreshFormattedCachePlanner(newOptions)) {
      this.syncDataViewFormattedCachePlanner(true);
    }

    // any option affecting row heights requires a rebuild of the row position index
    if (
      newOptions.rowHeight !== undefined ||
      newOptions.rowHeightProvider !== undefined ||
      newOptions.enableVariableRowHeight !== undefined
    ) {
      this.rowHeightsDirty = true;
    }

    this.internal_setOptions(suppressRender, suppressColumnSet, suppressSetOverflow);
  }

  /**
   * If option.mixinDefaults is true then external code maintains a reference to the options object. In this case there is no need
   * to call setOptions() - changes can be made directly to the object. However setOptions() also performs some recalibration of the
   * grid in reaction to changed options. activateChangedOptions call the same recalibration routines as setOptions() would have.
   * @param {Boolean} [suppressRender] - do we want to supress the grid re-rendering? (defaults to false)
   * @param {Boolean} [suppressColumnSet] - do we want to supress the columns set, via "setColumns()" method? (defaults to false)
   * @param {Boolean} [suppressSetOverflow] - do we want to suppress the call to `setOverflow`
   */
  activateChangedOptions(suppressRender?: boolean, suppressColumnSet?: boolean, suppressSetOverflow?: boolean): void {
    this.prepareForOptionsChange();
    this.invalidateRow(this.getDataLength());
    this.triggerEvent(this.onActivateChangedOptions, { options: this._options });
    this.syncDataViewFormattedCachePlanner(true);
    this.internal_setOptions(suppressRender, suppressColumnSet, suppressSetOverflow);
  }

  protected prepareForOptionsChange(): void {
    if (!this.getEditorLock()?.commitCurrentEdit()) {
      return;
    }
    this.makeActiveCellNormal();
  }

  protected internal_setOptions(suppressRender?: boolean, suppressColumnSet?: boolean, suppressSetOverflow?: boolean): void {
    if (this._options.showColumnHeader !== undefined) {
      this.setColumnHeaderVisibility(this._options.showColumnHeader);
    }
    this.validateAndEnforceOptions();
    this.applyColumnPinningOptions(this.columns);
    this.refreshDockingLayout();
    this.refreshRowDockingLayout(this.scrollTop, true);

    if (this._options.createFooterRow && !this._footerRow) {
      this.materializeFooterRow();
    } else if (!this._options.createFooterRow && this._footerRow) {
      this._footerRowScroller.forEach((scroller) => {
        Utils.hide(scroller);
      });
    }

    this._viewport.forEach((view) => {
      view.style.overflowY = this._options.autoHeight ? 'hidden' : 'auto';
    });

    this.setScroller();
    if (!suppressSetOverflow) {
      this.setOverflow();
    }

    if (!suppressColumnSet) {
      this.setColumns(this.columns);
    }

    // setColumns() invalidates and removes cached rows. Render only after that
    // phase, otherwise option changes such as pinned-row count are painted and
    // then immediately cleared by the column refresh.
    if (!suppressRender) {
      this.render();
    }

    if (
      this._options.enableMouseWheelScrollHandler &&
      this._viewport &&
      (!this.slickMouseWheelInstances || this.slickMouseWheelInstances.length === 0)
    ) {
      this._viewport.forEach((view) => {
        this.slickMouseWheelInstances.push(
          MouseWheel({
            element: view,
            onMouseWheel: this.handleMouseWheel.bind(this),
          })
        );
      });
    } else if (this._options.enableMouseWheelScrollHandler === false) {
      this.destroyAllInstances(this.slickMouseWheelInstances); // remove scroll handler when option is disable
    }

    // Keep header classes and styles synchronized when column rebuilding is suppressed.
    this.handleAutoHeaderHeightChange();
  }

  protected validateAndEnforceOptions(): void {
    if (this._options.autoHeight) {
      this._options.leaveSpaceForNewRows = false;
    }

    // @deprecated v11: remove this Row Detail fallback when inline rendering is removed.
    // The legacy inline Row Detail renderer relies on absolute top-based row positioning;
    // an omitted renderMode automatically uses overlay rendering with transform-based row positioning.
    if (
      this._options.rowTopOffsetRenderType === 'transform' &&
      this._options.enableRowDetailView &&
      this._options.rowDetailView?.renderMode === 'inline'
    ) {
      this._options.rowTopOffsetRenderType = 'top';
    }

    if (this._options.pinning?.columns) {
      this.validatePinnedColumnIndexes(this.getPinnedColumnIndexes(), false);
    }
  }

  /**
   * Sets a new source for databinding and removes all rendered rows. Note that this doesn't render the new rows - you can follow it with a call to render() to do that.
   * @param {CustomDataView|Array<*>} newData New databinding source using a regular JavaScript array.. or a custom object exposing getItem(index) and getLength() functions.
   * @param {Number} [scrollToTop] If true, the grid will reset the vertical scroll position to the top of the grid.
   */
  setData(newData: CustomDataView<TData> | TData[], scrollToTop?: boolean): void {
    this.data = newData;
    this.syncDataViewFormattedCachePlanner();
    this.invalidateAllRows();
    this.updateRowCount();
    if (scrollToTop) {
      this.scrollTo(0);
    }
  }

  /** Returns an array of every data object, unless you're using DataView in which case it returns a DataView object. */
  getData<U extends CustomDataView<TData> | U[] = SlickDataView<TData>>(): U {
    return this.data as U;
  }

  /** Returns the size of the databinding source. */
  getDataLength(): number {
    if ((this.data as CustomDataView<TData>).getLength) {
      return (this.data as CustomDataView<TData>).getLength();
    }
    return (this.data as TData[])?.length || 0;
  }

  protected getDataLengthIncludingAddNew(): number {
    return this.getDataLength() + (!this._options.enableAddRow ? 0 : !this.pagingActive || this.pagingIsLastPage ? 1 : 0);
  }

  /**
   * Returns the databinding item at a given position.
   * @param {Number} index Item row index.
   */
  getDataItem(i: number): TData {
    if ((this.data as CustomDataView).getItem) {
      return (this.data as CustomDataView<TData>).getItem(i) as TData;
    }
    return (this.data as TData[])[i] as TData;
  }

  /**
   * Returns item metadata by a row index when it exists
   * @param {Number} row
   * @returns {ItemMetadata | null}
   */
  getItemMetadaWhenExists(row: number): ItemMetadata | null {
    return 'getItemMetadata' in this.data ? (this.data as SlickDataView<TData>).getItemMetadata(row) : null;
  }

  /** Get Top Panel DOM element */
  getTopPanel(): HTMLDivElement {
    return this._topPanels[0];
  }

  /** Get Top Panels (left/right) DOM element */
  getTopPanels(): HTMLDivElement[] {
    return this._topPanels;
  }

  /** Are we using a DataView? */
  hasDataView(): boolean {
    return !Array.isArray(this.data);
  }

  protected readonly formattedDataCachePlanner: FormattedDataCachePlanner = (column, gridOptions) => {
    const optionCandidates = [gridOptions.excelExportOptions, gridOptions.textExportOptions, gridOptions.pdfExportOptions];
    const hasExportCustomFormatter = typeof column.exportCustomFormatter === 'function';
    const hasColumnExportWithFormatter = !!column.exportWithFormatter;

    // Column-level flags should work even when no global export options object is provided.
    let shouldCacheExport = hasColumnExportWithFormatter || hasExportCustomFormatter;
    let useCellFormatterForExport = hasColumnExportWithFormatter;
    let sanitizeDataExport = !!column.sanitizeDataExport;

    for (let i = 0; i < optionCandidates.length; i++) {
      const exportOptions = optionCandidates[i];
      if (!exportOptions) {
        continue;
      }

      const hasExportWithFormatter =
        column.exportWithFormatter !== undefined ? !!column.exportWithFormatter : !!exportOptions.exportWithFormatter;

      if (!hasExportWithFormatter && !hasExportCustomFormatter) {
        continue;
      }

      shouldCacheExport = true;
      useCellFormatterForExport = useCellFormatterForExport || hasExportWithFormatter;
      sanitizeDataExport = sanitizeDataExport || !!column.sanitizeDataExport || !!exportOptions.sanitizeDataExport;
    }

    if (!shouldCacheExport) {
      return undefined;
    }

    return {
      shouldCacheExport,
      useCellFormatterForExport,
      sanitizeDataExport,
      exportOptions: {
        exportWithFormatter: useCellFormatterForExport,
        sanitizeDataExport,
      },
    };
  };

  protected shouldRefreshFormattedCachePlanner(newOptions: Partial<O>): boolean {
    return (
      'enableFormattedDataCache' in newOptions ||
      'excelExportOptions' in newOptions ||
      'textExportOptions' in newOptions ||
      'pdfExportOptions' in newOptions
    );
  }

  protected syncDataViewFormattedCachePlanner(forceRefresh = false): void {
    if (!this.hasDataView() || !this._options.enableFormattedDataCache) {
      return;
    }

    const dataView = this.getData<SlickDataView<TData>>();
    if (typeof dataView.setFormattedDataCachePlanner === 'function') {
      dataView.setFormattedDataCachePlanner(this.formattedDataCachePlanner, forceRefresh);
    }
  }

  protected togglePanelVisibility(
    option: 'showTopPanel' | 'showHeaderRow' | 'showColumnHeader' | 'showFooterRow' | 'showPreHeaderPanel' | 'showTopHeaderPanel',
    container: HTMLElement | HTMLElement[],
    visible?: boolean
  ): void {
    if (this._options[option] !== visible) {
      this._options[option] = visible as boolean;
      if (visible) {
        Utils.show(container);
      } else {
        Utils.hide(container);
      }
      this.resizeCanvas();
    }
  }

  /**
   * Set the Top Panel Visibility
   * @param {Boolean} [visible] - optionally set if top panel is visible or not
   */
  setTopPanelVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showTopPanel', this._topPanelScrollers, visible);
  }

  /**
   * Set the Header Row Visibility
   * @param {Boolean} [visible] - optionally set if header row panel is visible or not
   */
  setHeaderRowVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showHeaderRow', this._headerRowScroller, visible);
  }

  /**
   * Set the Column Header Visibility
   * @param {Boolean} [visible] - optionally set if column header is visible or not
   */
  setColumnHeaderVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showColumnHeader', this._headerScroller, visible);
  }

  /**
   * Set the Footer Visibility
   * @param {Boolean} [visible] - optionally set if footer row panel is visible or not
   */
  setFooterRowVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showFooterRow', this._footerRowScroller, visible);
  }

  /**
   * Set the Pre-Header Visibility
   * @param {Boolean} [visible] - optionally set if pre-header panel is visible or not
   */
  setPreHeaderPanelVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showPreHeaderPanel', [this._preHeaderPanelScroller, this._preHeaderPanelScrollerR], visible);
  }

  /**
   * Set the Top-Header Visibility
   * @param {Boolean} [visible] - optionally set if top-header panel is visible or not
   */
  setTopHeaderPanelVisibility(visible?: boolean): void {
    this.togglePanelVisibility('showTopHeaderPanel', this._topHeaderPanelScroller, visible);
  }

  /** Get Grid Canvas Node DOM Element */
  getContainerNode(): HTMLElement {
    return this._container;
  }

  // Rendering / Scrolling

  /**
   * Retrieves the height of a row.
   * In variable row height mode (i.e. when `enableVariableRowHeight` is true) and with a row
   * index provided, returns that row's individual height; otherwise returns the default row
   * height defined in the grid options.
   *
   * @param {number} [row] - The row index. When omitted the default row height is returned.
   * @returns {number} The row height in pixels.
   */
  getRowHeight(row?: number): number {
    if (row !== undefined && this._options.enableVariableRowHeight && this.rowPositionIndexer) {
      return this.rowPositionIndexer.height(row);
    }
    return this._options.rowHeight!;
  }

  /**
   * Returns the virtual top pixel position of a row within the full grid content,
   * i.e. without the virtual-scrolling page offset applied. Since a row's top position equals
   * the combined height of all rows before it, this also serves as "the combined pixel height
   * of the first N rows" when called with a row count.
   *
   * @param {number} row - The row index (or a row count when summing row heights).
   * @returns {number} The virtual pixel position of the top of the row.
   */
  protected getRowPosition(row: number): number {
    if (this._options.enableVariableRowHeight && this.rowPositionIndexer) {
      return this.rowPositionIndexer.top(row);
    }
    return this._options.rowHeight! * row;
  }

  /**
   * Computes the row index at a virtual vertical pixel position within the full grid content,
   * i.e. without the virtual-scrolling page offset applied.
   *
   * @param {number} y - The virtual vertical position in pixels.
   * @returns {number} The calculated row index.
   */
  protected getRowIndexFromPosition(y: number): number {
    if (this._options.enableVariableRowHeight && this.rowPositionIndexer) {
      return this.rowPositionIndexer.rowAt(y);
    }
    return Math.floor(y / this._options.rowHeight!);
  }

  /** Get the rendered top offset of a row, including virtual-scroll page positioning. */
  getRowTop(row: number): number {
    return Math.round(this.getRowPosition(row) - this.offset);
  }

  protected getRowBottom(row: number): number {
    return this.getRowTop(row) + this.getRowHeight(row);
  }

  /** Height occupied by permanent top-pinned rows. */
  protected getTopPinnedRowsHeight(): number {
    return this.rowDockingLayout.top.filter((entry) => !entry.sticky).reduce((height, entry) => height + entry.height, 0);
  }

  protected getRowFromPosition(y: number): number {
    return this.getRowIndexFromPosition(y + this.offset);
  }

  /**
   * Map a virtual page index to its render offset in scroll-container space.
   * First and last pages are pinned to container edges; interior pages are spread
   * evenly between them to avoid browser edge clamping/jank near boundaries.
   */
  protected getPageOffset(page: number): number {
    if (this.n <= 1 || page <= 0) {
      return 0;
    }

    const lastOffset = Math.max(0, this.th - this.h);
    if (page >= this.n - 1) {
      return lastOffset;
    }

    // With no interior pages, keep legacy linear mapping.
    if (this.n <= 3 || lastOffset <= 0) {
      return Math.round(page * (this.cj || 0));
    }

    return Math.round(((page - 1) * lastOffset) / (this.n - 3));
  }

  /**
   * Infer page index from large-scale scroll movement in container space.
   * This mirrors page pinning logic used by getPageOffset().
   */
  protected getPageFromLargeScrollDelta(scrollTop: number): number {
    if (this.n <= 1 || this.ph <= 0 || this.h <= this.viewportH || scrollTop < this.ph) {
      return 0;
    }

    if (scrollTop >= this.h - this.ph) {
      return this.n - 1;
    }

    // With no interior pages, keep legacy page selection behavior.
    if (this.n <= 3 || this.h <= this.ph * 2) {
      return Math.min(this.n - 1, Math.floor(scrollTop / this.ph));
    }

    const scaleFactor = (this.th - this.ph * 2) / (this.h - this.ph * 2);
    return Math.min(this.n - 3, Math.floor(((scrollTop - this.ph) * scaleFactor) / this.ph)) + 1;
  }

  /**
   * Scroll to an Y coordinate position in the grid
   * @param {Number} y
   */
  scrollTo(y: number): void {
    y = Math.max(y, 0);
    y = Math.min(
      y,
      (this.th || 0) -
        (Utils.height(this._viewportScrollContainerY) as number) +
        (this.viewportHasHScroll ? this.scrollbarDimensions?.height || 0 : 0)
    );

    const oldOffset = this.offset;
    // determine the page for the target position first, then derive the offset from that page
    // (computing the offset from the previous page would lag one scroll event behind on jumps)
    this.page = this.ph ? Math.min((this.n || 0) - 1, Math.floor(y / this.ph)) : 0;
    this.offset = this.getPageOffset(this.page);
    const newScrollTop = (y - this.offset) as number;

    if (this.offset !== oldOffset) {
      const range = this.getVisibleRange(newScrollTop);
      this.cleanupRows(range);
    }

    if (this.prevScrollTop !== newScrollTop) {
      this.vScrollDir = this.prevScrollTop + oldOffset < newScrollTop + this.offset ? 1 : -1;
      this.scrollTop = this.prevScrollTop = newScrollTop;

      if (this.hasDockedColumns() || this.rowDockingLayout.bottom.length > 0) {
        this._viewportNode.scrollTop = newScrollTop;
      }

      if (this._viewportScrollContainerY) {
        this._viewportScrollContainerY.scrollTop = newScrollTop;
      }

      this.triggerEvent(this.onViewportChanged, {});
    }

    // Apply row positions only after both the page offset and the physical
    // scroll position have been committed. Updating rows between those two
    // assignments briefly mixes coordinate spaces and makes docked rows flash
    // by a few pixels at virtual-page boundaries.
    if (this.offset !== oldOffset) {
      this.updateRowPositions();
    }
  }

  /**
   * Scroll to an X coordinate position in the grid
   * @param {Number} x
   */
  scrollToX(x: number): void {
    if (this._viewportScrollContainerX.scrollLeft !== x) {
      this._viewportScrollContainerX.scrollLeft = x;
    }

    if (this.hasDockingHorizontalScroller()) {
      const translateX = `translate3d(${-x}px, 0, 0)`;
      this._canvasNode.style.transform = translateX;
      if (this._dockingOverlay) {
        this._dockingOverlay.style.transform = translateX;
      }
      this._headerL.style.transform = translateX;
      this._headerRowL.style.transform = translateX;
      if (this._footerRowL) {
        this._footerRowL.style.transform = translateX;
      }
      if (this._options.createPreHeaderPanel) {
        this._preHeaderPanel.style.transform = this._preHeaderPanel.classList.contains('slick-dropzone') ? '' : translateX;
      }
      if (this._options.createTopHeaderPanel) {
        this._topHeaderPanel.style.transform = this._topHeaderPanel.classList.contains('slick-dropzone') ? '' : translateX;
      }
      this._container.style.setProperty('--slick-docking-scroll-left', `${x}px`);
      return;
    }

    // In the single-viewport layout the body is moved by the native scroll
    // compositor. Keep header/filter/footer content in that same coordinate
    // system with compositor transforms instead of assigning scrollLeft on
    // several independent containers (which paints one or more frames late).
    const translateX = `translate3d(${-x}px, 0, 0)`;
    this._headerL.style.transform = translateX;
    this._headerRowL.style.transform = translateX;
    if (this._footerRowL) {
      this._footerRowL.style.transform = translateX;
    }
    if (this._options.createPreHeaderPanel) {
      this._preHeaderPanel.style.transform = this._preHeaderPanel.classList.contains('slick-dropzone') ? '' : translateX;
    }
    if (this._options.createTopHeaderPanel) {
      this._topHeaderPanel.style.transform = this._topHeaderPanel.classList.contains('slick-dropzone') ? '' : translateX;
    }
  }

  protected defaultFormatter(_row: number, _cell: number, value: any): string {
    if (!isDefined(value)) {
      return '';
    }
    return (value + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  protected getFormatter(row: number, column: C): Formatter {
    const rowMetadata = (this.data as CustomDataView<TData>)?.getItemMetadata?.(row);

    // look up by id, then index
    const columnOverrides = rowMetadata?.columns && (rowMetadata.columns[column.id] || rowMetadata.columns[this.getColumnIndex(column.id)]);

    const formatter = (columnOverrides?.formatter ||
      rowMetadata?.formatter ||
      column.formatter ||
      this._options.formatterFactory?.getFormatter(column) ||
      this._options.defaultFormatter) as Formatter;

    // Metadata formatters are row-specific and are not cached, so they must bypass the cache wrapper.
    const canUseDisplayCache =
      this._options.enableFormattedDataCache && !rowMetadata?.formatter && !columnOverrides?.formatter && this.hasDataView();
    const dataView = canUseDisplayCache ? this.getData<SlickDataView>() : undefined;

    let resolvedFormatter = formatter;
    if (typeof dataView?.getCellDisplayValue === 'function') {
      resolvedFormatter = (rowIdx, cell, value, columnDef, dataContext, grid) => {
        const cached = dataView.getCellDisplayValue(rowIdx, String(columnDef.id), dataContext as any);
        const resolvedValue = cached !== undefined ? (cached as any) : formatter(rowIdx, cell, value, columnDef, dataContext, grid);
        return resolvedValue;
      };
    }

    return resolvedFormatter;
  }

  protected getEditor(row: number, cell: number): Editor | EditorConstructor | null | undefined {
    const column = this.columns[cell];
    const rowMetadata = this.getItemMetadaWhenExists(row);
    const columnMetadata = rowMetadata?.columns;

    if (columnMetadata?.[column.id]?.editorClass !== undefined) {
      return columnMetadata[column.id].editorClass;
    }
    if (columnMetadata?.[cell]?.editorClass !== undefined) {
      return columnMetadata[cell].editorClass;
    }

    return column.editorClass || this._options?.editorFactory?.getEditor(column);
  }

  protected getDataItemValueForColumn(item: TData, columnDef: C): TData | TData[keyof TData] {
    if (this._options.dataItemColumnValueExtractor) {
      return this._options.dataItemColumnValueExtractor(item, columnDef) as TData;
    }
    return item[columnDef.field as keyof TData];
  }

  protected appendRowHtml(divArray: HTMLElement[], row: number, range: CellViewportRange, dataLength: number): void {
    const d = this.getDataItem(row);
    const dataLoading = row < dataLength && !d;
    let rowCss =
      'slick-row' +
      (this.isPinnedRowIdx(row) ? ' pinned' : '') +
      (dataLoading ? ' loading' : '') +
      (row === this.activeRow && this._options.showCellSelection ? ' active' : '') +
      (row % 2 === 1 ? ' odd' : ' even');

    if (!d) {
      rowCss += ` ${this._options.addNewRowCssClass}`;
    }

    const metadata = this.getItemMetadaWhenExists(row);

    if (metadata?.cssClasses) {
      rowCss += ` ${metadata.cssClasses}`;
    }

    const rowDiv = createDomElement('div', {
      className: `ui-widget-content ${rowCss}`,
      role: 'row',
      dataset: { row: `${row}` },
    });
    const rowDocking = this.dockingByRow.get(row);
    if (rowDocking && rowDocking.band !== 'center') {
      rowDiv.classList.add(`slick-row-pinned-${rowDocking.band}`);
      rowDiv.classList.toggle('slick-row-sticky', !!rowDocking?.sticky);
    }
    let rowRegionLeft: HTMLElement | undefined;
    let rowRegionCenter: HTMLElement = rowDiv;
    let rowRegionRight: HTMLElement | undefined;
    if (this.usesDockingRowRegions()) {
      rowDiv.classList.add('slick-row-docked');
      const renderedWidth = this.getDockingRenderedWidth();
      const renderedCenterWidth = this.getDockingRenderedCenterWidth(renderedWidth);
      rowDiv.style.width = `${renderedWidth}px`;
      rowDiv.style.gridTemplateColumns = `${this.dockingLayout.leftWidth}px ${renderedCenterWidth}px ${this.dockingLayout.rightWidth}px`;
      rowRegionLeft = createDomElement(
        'div',
        {
          className: `slick-pinned-left-cells${this.dockingLayout.leftWidth > 0 ? ' slick-pinned-left-cells-active' : ''}`,
          role: 'presentation',
          style: { width: `${this.dockingLayout.leftWidth}px` },
        },
        rowDiv
      );
      rowRegionCenter = createDomElement(
        'div',
        {
          className: 'slick-scrolling-cells',
          role: 'presentation',
          style: { width: `${renderedCenterWidth}px` },
        },
        rowDiv
      );
      rowRegionRight = createDomElement(
        'div',
        {
          className: `slick-pinned-right-cells${this.dockingLayout.rightWidth > 0 ? ' slick-pinned-right-cells-active' : ''}`,
          role: 'presentation',
          style: { width: `${this.dockingLayout.rightWidth}px` },
        },
        rowDiv
      );
      this.rowsCache[row].cellRegions = { center: rowRegionCenter, left: rowRegionLeft, right: rowRegionRight };
      this.applyDockingScrollOffsetToRow(rowDiv, this.rowsCache[row]);
    }
    if (this.usesDockingRowRegions() || this._options.enableVariableRowHeight) {
      // Docked rows have their own grid regions and pinned-row box model. Keep
      // the resolved rowHeight explicit so active/editor styles cannot make the
      // row fall back to content height (for example 35px instead of 45px).
      const rowHeight = this.getRowHeight(row);
      if (this.usesDockingRowRegions() || rowHeight !== this._options.rowHeight) {
        rowDiv.style.height = `${rowHeight}px`;
      }
    }

    divArray.push(rowDiv);

    const columnCount = this.columns.length;
    let columnData: ColumnMetadata | null;
    let colspan: number | string;
    let rowspan: number;
    let m: C;
    let isRenderCell = true;
    let isFullColspan = false;

    for (let i = 0, ii = columnCount; i < ii; i++) {
      isRenderCell = true;
      m = this.columns[i];
      if (m && (!m.hidden || metadata?.isGroup)) {
        colspan = 1;
        rowspan = 1;
        columnData = null;
        if (metadata?.columns) {
          columnData = metadata.columns[m.id] || metadata.columns[i];
          colspan = columnData?.colspan || 1;
          rowspan = columnData?.rowspan || 1;
          if (colspan === '*') {
            isFullColspan = true;
            colspan = ii - i;
          }
          if (rowspan > dataLength - row) {
            rowspan = dataLength - row;
          }
        }

        if (!this._options.enableCellRowSpan && rowspan > 1) {
          console.warn(
            '[SlickGrid] Cell "rowspan" is an opt-in grid option because of its small perf hit, you must enable it via the "enableCellRowSpan" grid option.'
          );
        }

        let ncolspan = colspan as number; // at this point colspan is for sure a number
        const isFullWidthGroup = this.usesDockingRowRegions() && this.isFullWidthGroupCell(metadata, columnData, i, ncolspan);
        if (isFullWidthGroup) {
          rowDiv.classList.add('slick-row-full-width-group');
        }

        // don't render child cell of a rowspan cell
        if (this.getParentRowSpanByCell(row, i)) {
          continue;
        }

        // Do not render cells outside of the viewport.
        if (this.getColumnRangeRight(Math.min(ii - 1, i + ncolspan - 1), i) > range.leftPx) {
          if (!m.alwaysRenderColumn && this.columnPosLeft[i] > range.rightPx) {
            isRenderCell = false; // render as false but keep looping to correctly save cellspan pointers
          }

          // when dealing with colspan, we'll count hidden columns and increase colspan when that happens
          if (!isFullColspan && this._options.spreadHiddenColspan) {
            ncolspan = this.increaseHiddenColspan(ncolspan, i);
          }

          // All columns to the right are outside the range, so no need to render them
          if (isRenderCell) {
            const targetedRowDiv = isFullWidthGroup ? rowDiv : this.getRowDockingRegion(rowDiv, i);
            this.appendCellHtml(targetedRowDiv, row, i, ncolspan, rowspan, columnData, d, isFullWidthGroup);
          }
        } else if (m.alwaysRenderColumn || this.getColumnDockingBand(i) !== 'center') {
          const targetedRowDiv = isFullWidthGroup ? rowDiv : this.getRowDockingRegion(rowDiv, i);
          this.appendCellHtml(targetedRowDiv, row, i, ncolspan, rowspan, columnData, d, isFullWidthGroup);
        }

        if (ncolspan > 1) {
          i += ncolspan - 1;
        }
      }
    }

    this.applyRowTopOffset(rowDiv, row);
  }

  /** Keep RowSpan host rows top-positioned so their cells escape transformed sibling stacking contexts. */
  protected applyRowTopOffset(rowNode: HTMLElement, row: number): void {
    const rowDocking = this.dockingByRow.get(row);
    let top = this.getRowTop(row);
    if (rowDocking?.band === 'top') {
      top = rowDocking.offset;
    } else if (rowDocking?.band === 'bottom') {
      const viewportHeight = this._dockingOverlay?.clientHeight || this._viewportScrollContainerY?.clientHeight || this.viewportH;
      top = viewportHeight - this.rowDockingLayout.bottomHeight + rowDocking.offset;
    }
    rowNode.classList.toggle('slick-row-pinned-top', rowDocking?.band === 'top');
    rowNode.classList.toggle('slick-row-pinned-bottom', rowDocking?.band === 'bottom');
    rowNode.classList.toggle(
      'slick-row-pinned-top-edge',
      rowDocking?.band === 'top' && this.rowDockingLayout.top[this.rowDockingLayout.top.length - 1]?.index === row
    );
    rowNode.classList.toggle(
      'slick-row-pinned-bottom-edge',
      rowDocking?.band === 'bottom' && this.rowDockingLayout.bottom[0]?.index === row
    );
    rowNode.classList.toggle('slick-row-sticky', !!rowDocking?.sticky);
    const isTransform = this._options.rowTopOffsetRenderType === 'transform';
    // A spanning cell may be outside the current horizontal render range and
    // therefore not be present in the row DOM yet. Detect the span from row
    // metadata as well; otherwise the row can keep a translateY stacking
    // context and a later-rendered span cell will paint underneath hovered or
    // odd rows. Only the host row needs this treatment (not rows covered by a
    // span), so inspect the metadata for a rowspan that starts on this row.
    const hasRenderedRowSpan = !!rowNode.querySelector('.slick-cell.rowspan');
    const rowMetadata = !hasRenderedRowSpan ? this.getItemMetadaWhenExists(row) : null;
    const hasMetadataRowSpan =
      !hasRenderedRowSpan &&
      this._options.enableCellRowSpan &&
      !!rowMetadata?.columns &&
      this.columns.some((column, index) => {
        const columnMetadata = rowMetadata.columns?.[column.id] || (rowMetadata.columns as any)?.[index];
        return Number(columnMetadata?.rowspan || 1) > 1;
      });
    const hasRowSpan = this._options.enableCellRowSpan && (hasMetadataRowSpan || hasRenderedRowSpan);
    // Docked rows live in the non-scrolling overlay, so their vertical
    // coordinate is constant for the duration of a scroll. The transform
    // preference remains available for normal rows and row-detail rendering.
    const useTransform = isTransform && !hasRowSpan;

    // Mark every RowSpan host row, regardless of whether its vertical
    // coordinate uses `top` or `transform`. Docked rows need this marker so
    // their region wrappers can let the spanning cell extend over following
    // rows and remain hit-testable.
    rowNode.classList.toggle('slick-rowspan', hasRowSpan);
    if (useTransform) {
      rowNode.style.top = '';
      // Keep the established 2D transform syntax for row positioning. It still
      // uses the compositor-friendly CSS transform path, while preserving the
      // DOM contract used by integrations (and avoiding a needless change to
      // selectors that inspect `translateY(...)`). The 3D form remains used by
      // the horizontal docking conveyor where it is needed for scroll offsets.
      rowNode.style.transform = `translateY(${Math.round(top)}px)`;
    } else {
      rowNode.style.top = `${Math.round(top)}px`;
      rowNode.style.transform = '';
    }
  }

  protected appendCellHtml(
    divRow: HTMLElement,
    row: number,
    cell: number,
    colspan: number,
    rowspan: number,
    columnMetadata: ColumnMetadata | null,
    item: TData,
    isFullWidthGroup = false,
    deferFragments = false
  ): void {
    // divRow: the html element to append items too
    // row, cell: row and column index
    // colspan: HTML colspan
    // item: grid data for row

    const segments = colspan > 1 && !isFullWidthGroup && this.usesDockingRowRegions() ? this.getColspanSegments(cell, colspan) : [];
    // Keep the host's full colspan so its formatter content can flow through
    // the docking bands; fragments only provide the clipped region geometry.
    const renderedColspan = colspan;
    const m = this.columns[cell];
    let cellCss =
      `slick-cell l${cell} r${Math.min(this.columns.length - 1, cell + renderedColspan - 1)}` +
      (m.cssClass ? ` ${m.cssClass}` : '') +
      (rowspan > 1 ? ' rowspan' : '') +
      (columnMetadata?.cssClass ? ` ${columnMetadata.cssClass}` : '');

    if (isFullWidthGroup) {
      cellCss += ' slick-cell-full-width-group';
    }
    const docking = this.dockingByColumn.get(cell);
    if (!isFullWidthGroup && docking && docking.band !== 'center') {
      cellCss += ` slick-cell-pinned-${docking.band}`;
      if (docking?.sticky) {
        cellCss += ' slick-cell-sticky';
      }
    }

    if (row === this.activeRow && cell === this.activeCell && this._options.showCellSelection) {
      cellCss += ' active';
    }

    const cellCssClasses = this.cellCssClassesByCell[row]?.[m.id];
    if (cellCssClasses) {
      cellCss += ` ${cellCssClasses}`;
    }
    if (this.isCellSelected(row, cell) && !cellCssClasses?.includes(this._options.selectedCellCssClass || '')) {
      cellCss += ` ${this._options.selectedCellCssClass}`;
    }

    let value: any = null;
    let formatterResult: FormatterResultWithHtml | FormatterResultWithText | HTMLElement | DocumentFragment | string = '';
    if (item) {
      value = this.getDataItemValueForColumn(item, m);
      formatterResult = this.getFormatter(row, m)(row, cell, value, m, item, this as unknown as SlickGrid);
      if (formatterResult === null || formatterResult === undefined) {
        formatterResult = '';
      }
    }

    // get addl css class names from object type formatter return and from string type return of onBeforeAppendCell
    // we will only use the event result as CSS classes when it is a string type (undefined event always return a true boolean which is not a valid css class)
    const evt = this.triggerEvent(this.onBeforeAppendCell, { row, cell, value, dataContext: item });
    const appendCellResult = evt.getReturnValue();
    let addlCssClasses = typeof appendCellResult === 'string' ? appendCellResult : '';
    if ((formatterResult as FormatterResultObject)?.addClasses) {
      addlCssClasses += classNameToList((addlCssClasses ? ' ' : '') + (formatterResult as FormatterResultObject).addClasses).join(' ');
    }

    const toolTipText = (formatterResult as FormatterResultObject)?.toolTip ? `${(formatterResult as FormatterResultObject).toolTip}` : '';
    const cellDiv = createDomElement('div', {
      className: classNameToList(`${cellCss} ${addlCssClasses || ''}`).join(' '),
      role: 'gridcell',
      tabIndex: -1,
    });
    cellDiv.setAttribute('aria-describedby', this.uid + m.id);
    if (toolTipText) {
      cellDiv.setAttribute('title', toolTipText);
    }

    // update cell rowspan height when spanning more than 1 row
    const cellHeight = this.getCellHeight(row, rowspan);
    if (rowspan > 1 && cellHeight !== this.getRowHeight(row) - this.cellHeightDiff) {
      cellDiv.style.height = `${cellHeight || 0}px`;
    }

    if (m.hasOwnProperty('cellAttrs') && m.cellAttrs instanceof Object) {
      Object.keys(m.cellAttrs).forEach((key) => {
        if (m.cellAttrs.hasOwnProperty(key)) {
          cellDiv.setAttribute(key, m.cellAttrs[key]);
        }
      });
    }

    // if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
    if (item) {
      const cellResult = isPrimitiveOrHTML(formatterResult)
        ? formatterResult
        : (formatterResult as FormatterResultWithHtml).html || (formatterResult as FormatterResultWithText).text;
      applyHtmlToElement(cellDiv, cellResult as string | HTMLElement, this._options);

      // add drag-to-replace handle
      const selectionType = this.getSelectionModel()?.getOptions()?.selectionType;
      const showDragHandle = this.getDragHandleVisibility();
      const addDragHandle = selectionType === 'cell' || selectionType === 'mixed';
      if (
        row === this.selectionBottomRow &&
        cell === this.selectionRightCell &&
        this._options.showCellSelection &&
        addDragHandle &&
        showDragHandle !== false
      ) {
        this.dragReplaceEl.createEl(cellDiv, showDragHandle);
      }
    }
    divRow.appendChild(cellDiv);

    // Formatter can optional add an "insertElementAfterTarget" option but it must be inserted only after the `.slick-row` div exists
    if ((formatterResult as FormatterResultObject).insertElementAfterTarget) {
      insertAfterElement(cellDiv, (formatterResult as FormatterResultObject).insertElementAfterTarget as HTMLElement);
    }

    this.rowsCache[row].cellRenderQueue.push(cell);
    this.rowsCache[row].cellColSpans[cell] = colspan;
    if (segments.length > 1) {
      this.appendColspanFragments(row, cell, cellDiv, segments, deferFragments);
    }
  }

  protected cleanupRows(rangeToKeep: { bottom: number; top: number }): void {
    // when using rowspan, we might have mandatory rows that cannot be cleaned up
    // that is basically the starting row that holds the rowspan, that row cannot be cleaned up because it would break the UI
    const mandatoryRows = new Set<number>();
    if (this._options.enableCellRowSpan) {
      for (let i = rangeToKeep.top, ln = rangeToKeep.bottom; i <= ln; i++) {
        const parentRowSpan = this.getRowSpanIntersect(i);
        if (parentRowSpan !== null) {
          mandatoryRows.add(parentRowSpan); // add to Set which will take care of duplicate rows
        }
      }
    }

    Object.keys(this.rowsCache).forEach((rowId) => {
      if (this.rowsCache) {
        let i = +rowId;
        let removePinnedRow = true;

        const dockingBand = this.dockingByRow.get(i)?.band;
        if (this.isPinnedRowIdx(i) || (dockingBand !== undefined && dockingBand !== 'center')) {
          removePinnedRow = false;
        }

        if (
          (i = parseInt(rowId, 10)) !== this.activeRow &&
          (i < rangeToKeep.top || i > rangeToKeep.bottom) &&
          removePinnedRow &&
          !mandatoryRows.has(i)
        ) {
          this.removeRowFromCache(i);
        }
      }
    });
    if (this._options.enableAsyncPostRenderCleanup) {
      this.startPostProcessingCleanup();
    }
  }

  /**
   * from a row number, return any column indexes that intersected with the grid row including the cell
   * @param {Number} row - grid row index
   */
  getRowSpanColumnIntersects(row: number): number[] {
    return this.getRowSpanIntersection<number[]>(row, 'columns');
  }

  /**
   * from a row number, check if the rowspan is intersecting with any rowspan and return it when found,
   * otherwise return `null` when nothing is found or when the rowspan feature is disabled.
   * @param {Number} row - grid row index
   */
  getRowSpanIntersect(row: number): number | null {
    return this.getRowSpanIntersection<number | null>(row);
  }

  protected getRowSpanIntersection<R>(row: number, outputType?: 'columns' | 'start'): R {
    const columnIntersects: number[] = [];
    let rowStartIntersect = null;

    for (let col = 0, cln = this.columns.length; col < cln; col++) {
      const rmeta = this._colsWithRowSpanCache[col];
      if (rmeta) {
        for (const range of Array.from(rmeta)) {
          const [start, end] = range.split(':').map(Number);
          if (row >= start && row <= end) {
            if (outputType === 'columns') {
              columnIntersects.push(col);
            } else {
              rowStartIntersect = start;
              break;
            }
          }
        }
      }
    }
    return (outputType === 'columns' ? columnIntersects : rowStartIntersect) as R;
  }

  /**
   * Returns the parent rowspan details when child cell are spanned from a rowspan or `null` when it's not spanned.
   * By default it will exclude the parent cell that holds the rowspan, and return `null`, that initiated the rowspan unless the 3rd argument is disabled.
   * The exclusion is helpful to find out when we're dealing with a child cell of a rowspan
   * @param {Number} row - grid row index
   * @param {Number} cell - grid cell/column index
   * @param {Boolean} [excludeParentRow] - should we exclude the parent who initiated the rowspan in the search (defaults to true)?
   */
  getParentRowSpanByCell(row: number, cell: number, excludeParentRow = true): { start: number; end: number; range: string } | null {
    let spanDetail = null;
    const rowspanRange = this._colsWithRowSpanCache[cell] || new Set<string>();

    for (const range of Array.from(rowspanRange)) {
      const [start, end] = range.split(':').map(Number);
      const startCondition = excludeParentRow ? row > start : row >= start;
      if (startCondition && row <= end) {
        spanDetail = { start, end, range };
        break;
      }
    }

    return spanDetail;
  }

  /**
   * Remap all the rowspan metadata by looping through all dataset rows and keep a cache of rowspan by column indexes
   * For example:
   *  1- if 2nd row of the 1st column has a metadata.rowspan of 3 then the cache will be: `{ 0: '1:4' }`
   *  2- if 2nd row if the 1st column has a metadata.rowspan of 3 AND a colspan of 2 then the cache will be: `{ 0: '1:4', 1: '1:4' }`
   */
  remapAllColumnsRowSpan(): void {
    const ln = this.getDataLength();
    if (ln > 0) {
      this._colsWithRowSpanCache = {};
      for (let row = 0; row < ln; row++) {
        this.remapRowSpanMetadataByRow(row);
      }

      this._rowSpanIsCached = true;
    }
  }

  protected remapRowSpanMetadataByRow(row: number): void {
    const colMeta = this.getItemMetadaWhenExists(row);
    if (colMeta?.columns) {
      Object.keys(colMeta.columns).forEach((col) => {
        const colIdx = +col;
        if (this.columns[colIdx] && !this.columns[colIdx].hidden) {
          const columnMeta = colMeta.columns![colIdx];
          const colspan = +(columnMeta?.colspan || 1);
          const rowspan = +(columnMeta?.rowspan || 1);
          this.remapRowSpanMetadata(row, colIdx, colspan, rowspan);
        }
      });
    }
  }

  protected remapRowSpanMetadata(row: number, cell: number, colspan: number, rowspan: number): void {
    if (rowspan > 1) {
      const rspan = `${row}:${row + rowspan - 1}`;
      this._colsWithRowSpanCache[cell] ??= new Set();
      this._colsWithRowSpanCache[cell].add(rspan);
      if (colspan > 1) {
        for (let i = 1; i < colspan; i++) {
          this._colsWithRowSpanCache[cell + i] ??= new Set();
          this._colsWithRowSpanCache[cell + i].add(rspan);
        }
      }
    }
  }

  /** Invalidate all grid rows and re-render the visible grid rows */
  invalidate(): void {
    if (!this.initialized || !this._container) {
      return;
    }
    this.updateRowCount();
    this.invalidateAllRows();
    this.render();
  }

  /** Invalidate all grid rows */
  invalidateAllRows(): void {
    // invalidated row content may resize the rows, so conservatively mark dirty for rebuild
    this.rowHeightsDirty = true;
    if (this.currentEditor) {
      this.makeActiveCellNormal();
    }

    if (typeof this.rowsCache === 'object') {
      Object.keys(this.rowsCache).forEach((row) => {
        if (this.rowsCache) {
          this.removeRowFromCache(+row);
        }
      });
    }

    if (this._options.enableAsyncPostRenderCleanup) {
      this.startPostProcessingCleanup();
    }
  }

  /**
   * Invalidate a specific set of row numbers
   * @param {Number[]} rows
   */
  invalidateRows(rows: number[]): void {
    if (!rows || !rows.length) {
      return;
    }

    let row;
    this.vScrollDir = 0;
    this.rowHeightsDirty = true;
    const rl = rows.length;

    // use Set to avoid duplicates
    const invalidatedRows = new Set<number>();
    const requiredRemapRows = new Set<number>();

    // only do a partial rowspan remapping when the number of rows is limited and the rows aren't the full dataset
    // otherwise a full rowspan remap of the cache is much quicker and cheaper to perform
    const isRowSpanFullRemap =
      rows.length > this._options.maxPartialRowSpanRemap! ||
      rows.length === this.getDataLength() ||
      this._prevInvalidatedRowsCount + rows.length === this.getDataLength();

    for (let i = 0; i < rl; i++) {
      row = rows[i];
      if (this.currentEditor && this.activeRow === row) {
        this.makeActiveCellNormal();
      }
      if (this.rowsCache[row]) {
        this.removeRowFromCache(row);
      }

      // add any rows that have rowspan intersects if it's not already in the list
      if (this._options.enableCellRowSpan && !isRowSpanFullRemap) {
        invalidatedRows.add(row);
        const parentRowSpan = this.getRowSpanIntersect(row);
        if (parentRowSpan !== null) {
          invalidatedRows.add(parentRowSpan);
        }
      }
    }

    // when a partial rowspan remapping is necessary
    if (this._options.enableCellRowSpan && !isRowSpanFullRemap) {
      for (const ir of Array.from(invalidatedRows)) {
        const colIdxs = this.getRowSpanColumnIntersects(ir);
        for (const cidx of colIdxs) {
          const prs = this.getParentRowSpanByCell(ir, cidx);
          if (prs && this._colsWithRowSpanCache[cidx]) {
            this._colsWithRowSpanCache[cidx].delete(prs.range);
            requiredRemapRows.add(prs.range.split(':').map(Number)[0]);
          }
        }
      }

      // now that we know all the rows that need remapping, let's start remapping
      for (const row of Array.from(requiredRemapRows)) {
        this.remapRowSpanMetadataByRow(row);
      }
    }

    if (this._options.enableAsyncPostRenderCleanup) {
      this.startPostProcessingCleanup();
    }
    this._prevInvalidatedRowsCount = rows.length;
  }

  /**
   * Invalidate a specific row number
   * @param {Number} row
   */
  invalidateRow(row: number): void {
    if (row >= 0) {
      const rows = [row];
      if (this._options.enableCellRowSpan) {
        const intersectedRow = this.getRowSpanIntersect(row);
        if (intersectedRow !== null) {
          rows.push(intersectedRow);
        }
      }
      this.invalidateRows(rows);
    }
  }

  protected queuePostProcessedRowForCleanup(cacheEntry: RowCaching, postProcessedRow: any, rowIdx: number): void {
    this.postProcessgroupId++;

    // store and detach node for later async cleanup
    if (typeof postProcessedRow === 'object') {
      Object.keys(postProcessedRow).forEach((columnIdx) => {
        if (postProcessedRow.hasOwnProperty(columnIdx)) {
          this.postProcessedCleanupQueue.push({
            actionType: 'C',
            groupId: this.postProcessgroupId,
            node: cacheEntry.cellNodesByColumnIdx[+columnIdx],
            columnIdx: +columnIdx,
            rowIdx,
          });
        }
      });
    }

    /* v8 ignore if */
    if (!cacheEntry.rowNode) {
      cacheEntry.rowNode = [];
    }
    this.postProcessedCleanupQueue.push({
      actionType: 'R',
      groupId: this.postProcessgroupId,
      node: cacheEntry.rowNode as HTMLElement[],
    });
    cacheEntry.rowNode?.forEach((node) => node.remove());
  }

  /* v8 ignore next */
  protected queuePostProcessedCellForCleanup(cellnode: HTMLElement, columnIdx: number, rowIdx: number): void {
    this.postProcessedCleanupQueue.push({
      actionType: 'C',
      groupId: this.postProcessgroupId,
      node: cellnode,
      columnIdx,
      rowIdx,
    });
    cellnode.remove();
  }

  protected removeRowFromCache(row: number): void {
    const cacheEntry = this.rowsCache[row];
    if (cacheEntry?.rowNode) {
      this.triggerEvent(this.onBeforeRemoveCachedRow, { row });
      if (this._options.enableAsyncPostRenderCleanup && this.postProcessedRows[row]) {
        this.queuePostProcessedRowForCleanup(cacheEntry, this.postProcessedRows[row], row);
      } else {
        cacheEntry.rowNode?.forEach((node: HTMLElement) => node.parentElement?.removeChild(node));
      }

      delete this.rowsCache[row];
      delete this.postProcessedRows[row];
      this.renderedRows--;
      this.counter_rows_removed++;
    }
  }

  /** Apply a Formatter Result to a Cell DOM Node */
  applyFormatResultToCellNode(
    formatterResult: FormatterResultWithHtml | FormatterResultWithText | string | HTMLElement | DocumentFragment,
    cellNode: HTMLElement,
    suppressRemove?: boolean
  ): void {
    if (formatterResult === null || formatterResult === undefined) {
      formatterResult = '';
    }
    if (isPrimitiveOrHTML(formatterResult)) {
      applyHtmlToElement(cellNode, formatterResult as string | HTMLElement, this._options);
      return;
    }

    const formatterVal: HTMLElement | DocumentFragment | string =
      (formatterResult as FormatterResultWithHtml).html || (formatterResult as FormatterResultWithText).text;
    applyHtmlToElement(cellNode, formatterVal, this._options);

    if ((formatterResult as FormatterResultObject).removeClasses && !suppressRemove) {
      cellNode.classList.remove(...classNameToList((formatterResult as FormatterResultObject).removeClasses));
    }
    if ((formatterResult as FormatterResultObject).addClasses) {
      cellNode.classList.add(...classNameToList((formatterResult as FormatterResultObject).addClasses));
    }
    if ((formatterResult as FormatterResultObject).toolTip) {
      cellNode.setAttribute('title', (formatterResult as FormatterResultObject).toolTip!);
    }
  }

  /**
   * Update a specific cell by its row and column index
   * @param {Number} row - grid row number
   * @param {Number} cell - grid cell column number
   */
  updateCell(row: number, cell: number): void {
    const cellNode = this.getCellNode(row, cell);
    if (cellNode) {
      const m = this.columns[cell];
      const d = this.getDataItem(row);
      if (this.currentEditor && this.activeRow === row && this.activeCell === cell) {
        this.currentEditor.loadValue(d);
      } else {
        // if the cell has other coordinates because of row/cell span, update that cell (which will invalidate this cellNode)
        // const spans = this.getSpans(row, cell);
        // if (spans[0] !== row || spans[1] !== cell) {
        //   this.updateCell(spans[0], spans[1]);
        //   return;
        // }
        const formatterResult = d
          ? this.getFormatter(row, m)(row, cell, this.getDataItemValueForColumn(d, m), m, d, this as unknown as SlickGrid)
          : '';
        this.applyFormatResultToCellNode(formatterResult, cellNode);
        this.invalidatePostProcessingResults(row);
      }
    }
  }

  /**
   * Update a specific row by its row index
   * @param {Number} row - grid row number
   */
  updateRow(row: number): void {
    const cacheEntry = this.rowsCache[row];
    if (!cacheEntry) {
      return;
    }

    this.ensureCellNodesInRowsCache(row);

    let formatterResult;
    const d = this.getDataItem(row);

    Object.keys(cacheEntry.cellNodesByColumnIdx).forEach((colIdx) => {
      if (cacheEntry.cellNodesByColumnIdx.hasOwnProperty(colIdx)) {
        const columnIdx = +colIdx;
        const m = this.columns[columnIdx];
        const node = cacheEntry.cellNodesByColumnIdx[columnIdx];

        if (this.currentEditor && row === this.activeRow && columnIdx === this.activeCell) {
          this.currentEditor.loadValue(d);
        } else if (d) {
          formatterResult = this.getFormatter(row, m)(
            row,
            columnIdx,
            this.getDataItemValueForColumn(d, m),
            m,
            d,
            this as unknown as SlickGrid
          );
          this.applyFormatResultToCellNode(formatterResult, node as HTMLDivElement);
        } else {
          emptyElement(node);
        }
      }
    });

    this.invalidatePostProcessingResults(row);
  }

  getCellHeight(row: number, rowspan: number): number {
    let cellHeight = this._options.rowHeight || 0;
    if (rowspan > 1) {
      const rowSpanBottomIdx = row + rowspan - 1;
      cellHeight = this.getRowBottom(rowSpanBottomIdx) - this.getRowTop(row);
    } else {
      const rowHeight = this.getRowHeight(row);
      if (rowHeight !== cellHeight - this.cellHeightDiff) {
        cellHeight = rowHeight;
      }
    }

    cellHeight -= this.cellHeightDiff;
    return Math.ceil(cellHeight);
  }

  /**
   * Get the number of rows displayed in the viewport
   * Note that the row count is an approximation because it is a calculated value using this formula (viewport / rowHeight = rowCount),
   * the viewport must also be displayed for this calculation to work.
   * @return {Number} rowCount
   */
  getViewportRowCount(): number {
    const vh = this.getViewportHeight();
    const scrollbarHeight = this.getScrollbarDimensions()?.height || 0;
    return Math.floor((vh - scrollbarHeight) / this._options.rowHeight!);
  }

  getViewportHeight(): number {
    if (!this._options.autoHeight) {
      this.topPanelH = this._options.showTopPanel ? this._options.topPanelHeight! + this.getVBoxDelta(this._topPanelScrollers[0]) : 0;
      this.headerRowH = this._options.showHeaderRow ? this._options.headerRowHeight! + this.getVBoxDelta(this._headerRowScroller[0]) : 0;
      this.footerRowH =
        this._options.createFooterRow && this._options.showFooterRow
          ? this._options.footerRowHeight! + this.getVBoxDelta(this._footerRowScroller[0])
          : 0;
    }

    if (this._options.autoHeight) {
      let fullHeight = this._headerRoot.offsetHeight;
      fullHeight += this._options.showPreHeaderPanel
        ? this._options.preHeaderPanelHeight! + this.getVBoxDelta(this._preHeaderPanelScroller)
        : 0;
      fullHeight += this._options.showHeaderRow ? this._options.headerRowHeight! + this.getVBoxDelta(this._headerRowScroller[0]) : 0;
      fullHeight +=
        this._options.createFooterRow && this._options.showFooterRow
          ? this._options.footerRowHeight! + this.getVBoxDelta(this._footerRowScroller[0])
          : 0;
      fullHeight += this.getCanvasWidth() > this.viewportW ? this.scrollbarDimensions?.height || 0 : 0;

      this.viewportH = this.getRowPosition(this.getDataLengthIncludingAddNew()) + fullHeight;
    } else {
      const style = getComputedStyle(this._container);
      const containerBoxH = style.boxSizing !== 'content-box' ? this.getVBoxDelta(this._container) : 0;
      const topHeaderH =
        this._options.createTopHeaderPanel && this._options.showTopHeaderPanel
          ? this._options.topHeaderPanelHeight! + this.getVBoxDelta(this._topHeaderPanelScroller)
          : 0;
      const preHeaderH =
        this._options.createPreHeaderPanel && this._options.showPreHeaderPanel
          ? this._options.preHeaderPanelHeight! + this.getVBoxDelta(this._preHeaderPanelScroller)
          : 0;
      const columnNamesH = this._options.showColumnHeader ? Utils.toFloat(Utils.height(this._headerScroller[0]) as number) : 0;
      this.viewportH =
        Utils.toFloat(style.height) -
        Utils.toFloat(style.paddingTop) -
        Utils.toFloat(style.paddingBottom) -
        this.topPanelH -
        topHeaderH -
        preHeaderH -
        this.headerRowH -
        columnNamesH -
        this.footerRowH -
        containerBoxH;
    }

    this.numVisibleRows = Math.ceil(this.viewportH / this._options.rowHeight!);
    return this.viewportH;
  }

  /** returns the available viewport inner width, that is the viewport width minus the scrollbar when shown */
  protected getViewportInnerWidth(): number {
    return this.viewportHasVScroll ? this.viewportW - (this.scrollbarDimensions?.width || 0) : this.viewportW;
  }

  getViewportWidth(): number {
    this.viewportW =
      parseFloat(getInnerSize(this._container, 'width') as unknown as string) ||
      (this._options.devMode && this._options.devMode.containerClientWidth) ||
      0;
    return this.viewportW;
  }

  /** Execute a Resize of the Grid Canvas */
  resizeCanvas(): void {
    if (this.initialized) {
      this.paneTopH = 0;
      this.paneBottomH = 0;
      this.viewportTopH = 0;
      this.viewportBottomH = 0;

      this.getViewportWidth();
      this.getViewportHeight();
      let dockingChanged = this.refreshDockingLayout();
      // The docking POC's one horizontal scrollbar is an absolutely positioned
      // sibling of the body viewport. Unlike a native viewport scrollbar it
      // does not reduce `clientHeight` on its own, so reserve its measured
      // height before calculating virtual rows and the body viewport.
      const dockingViewportWidth = this._viewportNode?.clientWidth || this.viewportW;
      const dockingContentWidth = this.dockingLayout.contentWidth || this.canvasWidth;
      const hasDockingHorizontalOverflow = dockingContentWidth > dockingViewportWidth;
      const dockingHorizontalScrollbarHeight =
        !this._options.autoHeight && this.hasDockingHorizontalScroller() && hasDockingHorizontalOverflow
          ? this.scrollbarDimensions?.height || this.measureScrollbar().height
          : 0;
      if (dockingHorizontalScrollbarHeight) {
        this.viewportH = Math.max(0, this.viewportH - dockingHorizontalScrollbarHeight);
      }

      this.paneTopH = this.viewportH + dockingHorizontalScrollbarHeight;

      // The top pane includes the top panel and the header row
      this.paneTopH += this.topPanelH + this.headerRowH + this.footerRowH;

      // The top viewport does not contain the top panel or header row
      this.viewportTopH = this.paneTopH - this.topPanelH - this.headerRowH - this.footerRowH - dockingHorizontalScrollbarHeight;

      if (this._options.autoHeight) {
        let fullHeight = this.paneTopH + this._headerScrollerL.offsetHeight;
        fullHeight += this.getVBoxDelta(this._container);
        if (this._options.showPreHeaderPanel) {
          fullHeight += this._options.preHeaderPanelHeight!;
        }
        Utils.height(this._container, fullHeight);
        this._contentRoot.style.position = 'relative';
      }

      let topHeightOffset = Utils.height(this._headerRoot);
      if (topHeightOffset) {
        topHeightOffset += this._options.showTopHeaderPanel ? this._options.topHeaderPanelHeight! : 0;
      } else {
        topHeightOffset =
          (this._options.showHeaderRow ? this._options.headerRowHeight! : 0) +
          (this._options.showPreHeaderPanel ? this._options.preHeaderPanelHeight! : 0);
      }
      Utils.setStyleSize(this._contentRoot, 'top', topHeightOffset);
      Utils.height(this._contentRoot, this.paneTopH);

      if (!this._options.autoHeight) {
        Utils.height(this._viewportNode, this.viewportTopH);
      }
      this.updateDockingOverlayDimensions();
      this.updateDockingHorizontalScrollerDimensions();

      // The proxy scrollbar is created and sized during this resize pass. A
      // first docking resolution can therefore run before its final client
      // width is available (especially on initial load or after a route
      // transition). Resolve once more against the actual scroll owner so
      // two-sided sticky columns start on the correct nearest edge instead of
      // requiring a scroll-away-and-back interaction to settle.
      this.scrollLeft = this._viewportScrollContainerX?.scrollLeft ?? this.scrollLeft;
      dockingChanged = this.refreshDockingLayout(this.scrollLeft) || dockingChanged;

      Utils.height(this._viewportNode, this.viewportTopH);

      if (!this.scrollbarDimensions || !this.scrollbarDimensions.width) {
        this.scrollbarDimensions = this.measureScrollbar();
      }

      if (this._options.forceFitColumns) {
        this.legacyAutosizeColumns();
      }

      if (dockingChanged) {
        this.updateColumnCaches();
        this.applyColumnWidths();
        this.applyDockingToColumnChrome();
        this.invalidateAllRows();
      }

      // Keep compositor transforms in sync even when the numeric scroll offset
      // itself did not change during resize.
      this.scrollToX(this.scrollLeft);

      this.updateRowCount();
      this.handleScroll();
      // Since the width has changed, force the render() to reevaluate virtually rendered cells.
      this.lastRenderedScrollLeft = -1;
      this.render();
    }
  }

  /**
   * Size the non-scrolling docked-row layer to the full canvas width.
   *
   * The layer itself receives the horizontal `-scrollLeft` transform used by
   * the dedicated scrollbar, so a viewport-width clipping box would expose a
   * blank strip at the trailing edge. Its viewport is the clipping boundary.
   */
  protected updateDockingOverlayDimensions(): void {
    if (!this._dockingOverlay || !this._viewportNode) {
      return;
    }
    this._dockingOverlay.style.top = `${this._viewportNode.offsetTop}px`;
    this._dockingOverlay.style.left = `${this._viewportNode.offsetLeft}px`;
    const overlayWidth = Math.max(this.canvasWidth, this.dockingLayout.contentWidth, this._viewportNode.clientWidth);
    this._dockingOverlay.style.width = `${overlayWidth}px`;
    this._dockingOverlay.style.height = `${this._viewportNode.clientHeight}px`;
  }

  /** Keep the single horizontal scrollbar aligned with the vertical body viewport. */
  protected updateDockingHorizontalScrollerDimensions(): void {
    if (!this._dockingHorizontalScroller || !this._dockingHorizontalSpacer || !this._viewportNode) {
      return;
    }
    const scrollbarHeight = this.scrollbarDimensions?.height || 0;
    const viewportWidth = this._viewportNode.clientWidth;
    const contentWidth = this.dockingLayout.contentWidth || this.canvasWidth;
    const hasHorizontalOverflow = contentWidth > viewportWidth;
    this._dockingHorizontalScroller.style.width = `${viewportWidth}px`;
    this._dockingHorizontalScroller.style.height = hasHorizontalOverflow ? `${scrollbarHeight}px` : '0px';
    this._dockingHorizontalSpacer.style.width = `${Math.max(contentWidth, viewportWidth)}px`;
    this._container.style.setProperty('--slick-docking-viewport-width', `${this._viewportNode.clientWidth}px`);
    this._container.style.setProperty('--slick-docking-scroll-left', `${this.scrollLeft}px`);
    this._container.style.setProperty(
      '--slick-docking-right-offset',
      `${this._dockingHorizontalScroller.clientWidth - this.dockingLayout.contentWidth}px`
    );
    this._container.style.setProperty(
      '--slick-docking-row-right-offset',
      `${this._dockingHorizontalScroller.clientWidth - this.getDockingRenderedWidth()}px`
    );
  }

  /**
   * Update paging information status from the View
   * @param {PagingInfo} pagingInfo
   */
  updatePagingStatusFromView(pagingInfo: Pick<PagingInfo, 'pageSize' | 'pageNum' | 'totalPages'>): void {
    this.pagingActive = pagingInfo.pageSize !== 0;
    this.pagingIsLastPage = pagingInfo.pageNum === pagingInfo.totalPages - 1;
  }

  /**
   * (re)Builds the row position index used in variable row height mode when needed, i.e. when it is
   * marked dirty (see invalidateRowHeights) or when the indexed row count no longer matches the
   * dataset length. The row position index is rebuilt whenever row heights are invalidated or the
   * dataset length changes. Does nothing (and drops the index) when variable row height is disabled.
   *
   * @param {number} rowCount - The number of rows to index (including the Add-New row when enabled).
   */
  protected ensureRowPositionIndexer(rowCount: number): void {
    if (!this._options.enableVariableRowHeight) {
      this.rowPositionIndexer = undefined;
      return;
    }
    if (!this.rowPositionIndexer) {
      this.rowPositionIndexer = new RowPositionIndexer();
      this.rowHeightsDirty = true;
    }
    if (this.rowHeightsDirty || this.rowPositionIndexer.count !== rowCount) {
      const provider = this._options.rowHeightProvider;
      this.rowPositionIndexer.rebuild(rowCount, this._options.rowHeight!, (row: number) =>
        provider?.(this as unknown as SlickGrid, row, this.getDataItem(row))
      );
      this.rowHeightsDirty = false;
    }
  }

  /**
   * Invalidate all row heights (variable row height mode) and fully re-render the grid.
   * Call this after the values driving `rowHeightProvider` have changed without a change in row
   * count; the row position index is then rebuilt with the new heights.
   */
  invalidateRowHeights(): void {
    if (this._options.enableVariableRowHeight) {
      this.rowHeightsDirty = true;
      this.invalidate();
    }
  }

  /** Update the dataset row count */
  updateRowCount(): void {
    if (this.initialized && this._container) {
      const dataLength = this.getDataLength();
      this._container.setAttribute('aria-rowcount', dataLength.toString());

      // remap all rowspan cache when necessary
      if (dataLength > 0 && dataLength !== this._prevDataLength) {
        this._rowSpanIsCached = false; // will force a full remap
      }
      if (this._options.enableCellRowSpan && !this._rowSpanIsCached) {
        this.remapAllColumnsRowSpan();
      }

      this._prevDataLength = dataLength;

      const dataLengthIncludingAddNew = this.getDataLengthIncludingAddNew();
      let numberOfRows = 0;
      let oldH = Utils.height(this._canvasNode) as number;
      numberOfRows = dataLengthIncludingAddNew + (this._options.leaveSpaceForNewRows ? this.numVisibleRows - 1 : 0);

      // (re)build the row position index (variable row height mode) before any height computations
      this.ensureRowPositionIndexer(dataLengthIncludingAddNew);

      const scrollableRowsHeight = this.getRowPosition(numberOfRows);

      const tempViewportH = Utils.height(this._viewportScrollContainerY) as number;
      const oldViewportHasVScroll = this.viewportHasVScroll;
      // with autoHeight, we do not need to accommodate the vertical scroll bar
      this.viewportHasVScroll =
        this._options.alwaysShowVerticalScroll || (!this._options.autoHeight && scrollableRowsHeight > tempViewportH);

      this.makeActiveCellNormal();

      // remove the rows that are now outside of the data range
      // this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
      const r1 = dataLength - 1;
      if (typeof this.rowsCache === 'object') {
        Object.keys(this.rowsCache).forEach((row) => {
          const cachedRow = +row;
          if (cachedRow > r1) {
            this.removeRowFromCache(cachedRow);
          }
        });
      }

      if (this._options.enableAsyncPostRenderCleanup) {
        this.startPostProcessingCleanup();
      }

      if (this.activeCellNode && this.activeRow > r1) {
        this.resetActiveCell();
      }

      oldH = this.h;
      if (this._options.autoHeight) {
        this.h = scrollableRowsHeight;
      } else {
        this.th = Math.max(scrollableRowsHeight, tempViewportH - (this.scrollbarDimensions?.height || 0));
        if (this.th < this.maxSupportedCssHeight) {
          // just one page
          this.h = this.ph = this.th;
          this.n = 1;
          this.cj = 0;
        } else {
          // break into pages
          this.h = this.maxSupportedCssHeight;
          this.ph = this.h / 100;
          this.n = Math.floor(this.th / this.ph);
          this.cj = (this.th - this.h) / (this.n - 1);
        }
      }

      if (this.h !== oldH) {
        Utils.height(this._canvasNode, this.h);

        this.scrollTop = this._viewportScrollContainerY.scrollTop;
        this.scrollHeight = this._viewportScrollContainerY.scrollHeight;
      }

      const oldScrollTopInRange = this.scrollTop + this.offset <= this.th - tempViewportH;

      /* v8 ignore else */
      if (this.th === 0 || this.scrollTop === 0) {
        this.page = this.offset = 0;
      } else if (oldScrollTopInRange) {
        // maintain virtual position
        this.scrollTo(this.scrollTop + this.offset);
      } else {
        // scroll to bottom
        this.scrollTo(this.th - tempViewportH + (this.scrollbarDimensions?.height || 0));
      }

      if (this.h !== oldH && this._options.autoHeight) {
        this.resizeCanvas();
      }

      if (this._options.forceFitColumns && oldViewportHasVScroll !== this.viewportHasVScroll) {
        this.legacyAutosizeColumns();
      }
      this.refreshRowDockingLayout(this.scrollTop, true);
      this.updateCanvasWidth(false);
    }
  }

  /** @alias `getVisibleRange` */
  getViewport(viewportTop?: number, viewportLeft?: number): CellViewportRange {
    return this.getVisibleRange(viewportTop, viewportLeft);
  }

  /**
   * Returns an object with the top and bottom row indices that are visible in the viewport, as well
   * as the left and right pixel boundaries.
   * It uses the current (or provided) scroll positions and viewport dimensions.
   *
   * @param {number} [viewportTop] - The top scroll position.
   * @param {number} [viewportLeft] - The left scroll position.
   * @returns {{ top: number; bottom: number; leftPx: number; rightPx: number }} The visible range.
   */
  getVisibleRange(viewportTop?: number, viewportLeft?: number): CellViewportRange {
    viewportTop ??= this.scrollTop;
    viewportLeft ??= this.scrollLeft;

    let leftPx = viewportLeft;
    let rightPx = viewportLeft + Math.max(0, this.viewportW - this.dockingLayout.leftBaseWidth - this.dockingLayout.rightBaseWidth);

    if (this._options.rtl) {
      // In RTL mode, scrollLeft is the offset from the right edge.
      const maxScroll = this.canvasWidth - this.viewportW;
      leftPx = maxScroll - viewportLeft - this.viewportW;
      rightPx = maxScroll - viewportLeft;
    }

    return {
      top: this.getRowFromPosition(viewportTop),
      bottom: this.getRowFromPosition(viewportTop + this.viewportH) + 1,
      leftPx,
      rightPx,
    };
  }

  /**
   * Computes the range of rows (and horizontal pixel boundaries) that should be rendered,
   * including an additional buffer (based on row height and a minimum buffer) determined by
   * the current vertical scroll direction.
   * This range is used to decide which rows and cells to render.
   *
   * @param {number} [viewportTop] - The top scroll position.
   * @param {number} [viewportLeft] - The left scroll position.
   * @returns {{ top: number; bottom: number; leftPx: number; rightPx: number }} The rendered range.
   */
  getRenderedRange(viewportTop?: number, viewportLeft?: number): CellViewportRange {
    const range = this.getVisibleRange(viewportTop, viewportLeft);
    const buffer = Math.round(this.viewportH / this.getRowHeight());
    const minBuffer = this._options.minRowBuffer as number;

    if (this.vScrollDir === -1) {
      range.top -= buffer;
      range.bottom += minBuffer;
    } else if (this.vScrollDir === 1) {
      range.top -= minBuffer;
      range.bottom += buffer;
    } else {
      range.top -= minBuffer;
      range.bottom += minBuffer;
    }

    range.top = Math.max(0, range.top);
    range.bottom = Math.min(this.getDataLengthIncludingAddNew() - 1, range.bottom);

    range.leftPx -= this.viewportW;
    range.rightPx += this.viewportW;

    range.leftPx = Math.max(0, range.leftPx);
    range.rightPx = Math.min(this.canvasWidth, range.rightPx);

    return range;
  }

  /**
   * Returns the rows cache that are currently rendered in the DOM,
   * the cache includes certain properties like the row div element, cell rendered queue and the row colspan when defined.
   */
  getRowCache(): Record<number, RowCaching> {
    return this.rowsCache;
  }

  protected ensureCellNodesInRowsCache(row: number): void {
    const cacheEntry = this.rowsCache[row];
    if (cacheEntry?.cellRenderQueue.length && cacheEntry.rowNode?.length) {
      const rowNode = cacheEntry.rowNode as HTMLElement[];
      const children = this.getRowCellChildren(rowNode[0]);
      children.forEach((node) => (cacheEntry.cellNodesByColumnIdx[this.getCellFromNode(node)] = node));
      cacheEntry.cellRenderQueue.length = 0;
    }
  }

  protected getRowCellChildren(rowNode: HTMLElement): HTMLElement[] {
    const children = Array.from(rowNode.children) as HTMLElement[];
    // Row detail formatters can insert a non-cell sibling after the detail-toggle cell.
    // Only actual cells belong in cellNodesByColumnIdx; otherwise cache rebuilding tries
    // to parse a column index from classes such as `dynamic-cell-detail`.
    const cellChildren = (nodes: HTMLElement[]) =>
      nodes.filter((node) => node.classList.contains('slick-cell') && !node.classList.contains('slick-cell-colspan-part'));
    if (!rowNode.classList.contains('slick-row-docked')) {
      return cellChildren(children);
    }
    const regions = children.filter(
      (node) =>
        node.classList.contains('slick-pinned-left-cells') ||
        node.classList.contains('slick-scrolling-cells') ||
        node.classList.contains('slick-pinned-right-cells')
    );
    return [...cellChildren(children), ...cellChildren(regions.flatMap((region) => Array.from(region.children) as HTMLElement[]))];
  }

  protected isFullWidthGroupCell(
    metadata: ItemMetadata | null | undefined,
    columnMetadata: ColumnMetadata | null,
    columnIdx: number,
    colspan: number
  ): boolean {
    const configuredColspan = columnMetadata?.colspan;
    return (
      !!metadata?.isGroup &&
      configuredColspan !== undefined &&
      (configuredColspan === '*' || Number(configuredColspan) >= this.columns.length - columnIdx) &&
      colspan >= this.columns.length - columnIdx
    );
  }

  protected getRowDockingRegion(rowNode: HTMLElement, columnIdx: number): HTMLElement {
    if (rowNode.classList.contains('slick-row-full-width-group')) {
      return rowNode;
    }
    const band = this.getColumnDockingBand(columnIdx);
    const selector =
      band === 'left' ? '.slick-pinned-left-cells' : band === 'right' ? '.slick-pinned-right-cells' : '.slick-scrolling-cells';
    return (rowNode.querySelector(`:scope > ${selector}`) as HTMLElement) || rowNode;
  }

  protected toggleCellSpanFragmentsActive(row: number, cell: number, active: boolean): void {
    this.rowsCache[row]?.cellSpanFragments?.[cell]?.forEach((fragment) => fragment.classList.toggle('active', active));
  }

  protected getColspanSegments(cell: number, colspan: number): Array<{ start: number; end: number; band: ColumnDockingBand }> {
    const segments: Array<{ start: number; end: number; band: ColumnDockingBand }> = [];
    const end = Math.min(this.columns.length - 1, cell + colspan - 1);

    for (let index = cell; index <= end; index++) {
      if (this.columns[index]?.hidden) {
        continue;
      }
      const band = this.getColumnDockingBand(index);
      const previous = segments[segments.length - 1];
      if (previous?.band === band) {
        previous.end = index;
      } else {
        segments.push({ start: index, end: index, band });
      }
    }
    return segments;
  }

  protected appendColspanFragments(
    row: number,
    cell: number,
    host: HTMLElement,
    segments: Array<{ start: number; end: number; band: ColumnDockingBand }>,
    deferToRow: boolean
  ): void {
    host.classList.add('slick-cell-colspan-crossing-docking');
    const spanWidth = segments.reduce(
      (width, segment) => width + (this.columnPosRight[segment.end] ?? 0) - (this.columnPosLeft[segment.start] ?? 0),
      0
    );
    host.style.width = `${spanWidth}px`;
    host.style[this._options.rtl ? 'left' : 'right'] = 'auto';
    (this.rowsCache[row].rowNode?.[0] || host.closest('.slick-row'))?.classList.add('slick-row-colspan-crossing-docking');
    const fragments = segments.slice(1).map((segment, index, allFragments) => {
      const fragment = host.cloneNode(false) as HTMLElement;
      fragment.style.width = '';
      fragment.classList.add('slick-cell-colspan-part');
      fragment.classList.toggle('slick-cell-colspan-end', index === allFragments.length - 1);
      fragment.classList.remove('slick-cell-pinned-left', 'slick-cell-pinned-right', 'slick-cell-sticky');
      if (segment.band !== 'center') {
        fragment.classList.add(`slick-cell-pinned-${segment.band}`);
        if (this.dockingByColumn.get(segment.start)?.sticky) {
          fragment.classList.add('slick-cell-sticky');
        }
      }
      fragment.setAttribute('aria-hidden', 'true');
      fragment.setAttribute('role', 'presentation');
      fragment.removeAttribute('aria-describedby');
      fragment.removeAttribute('tabindex');

      const bandWidth =
        segment.band === 'left'
          ? this.dockingLayout.leftWidth
          : segment.band === 'right'
            ? this.dockingLayout.rightWidth
            : this.getDockingRenderedCenterWidth();
      const left = this.columnPosLeft[segment.start] ?? 0;
      const right = this.columnPosRight[segment.end] ?? left;
      if (this._options.rtl) {
        fragment.style.right = `${left}px`;
        fragment.style.left = `${Math.max(0, bandWidth - right)}px`;
      } else {
        fragment.style.left = `${left}px`;
        fragment.style.right = `${Math.max(0, bandWidth - right)}px`;
      }
      return fragment;
    });

    this.rowsCache[row].cellSpanFragments[cell] = fragments;
    this.rowsCache[row].cellSpanSegments[cell] = segments;
    fragments.forEach((fragment, index) => {
      if (deferToRow) {
        host.parentElement?.insertBefore(fragment, host);
      } else {
        this.getRowDockingRegion(host.closest('.slick-row') as HTMLElement, segments[index + 1].start).appendChild(fragment);
      }
    });
  }

  protected cleanUpCells(range: CellViewportRange, row: number): void {
    if (this.isPinnedRowIdx(row)) {
      return;
    }

    const cacheEntry = this.rowsCache[row];

    // Remove cells outside the range.
    const cellsToRemove: number[] = [];
    Object.keys(cacheEntry.cellNodesByColumnIdx).forEach((cellNodeIdx) => {
      // I really hate it when people mess with Array.prototype.
      /* v8 ignore if */
      if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(cellNodeIdx)) {
        return;
      }

      // This is a string, so it needs to be cast back to a number.
      const i = +cellNodeIdx;

      // Docked columns are always materialized; only the center band is horizontally virtualized.
      if (this.getColumnDockingBand(i) !== 'center') {
        return;
      }

      // Ignore alwaysRenderedColumns
      if (Array.isArray(this.columns) && this.columns[i]?.alwaysRenderColumn) {
        return;
      }

      const colspan = cacheEntry.cellColSpans[i];
      if (
        this.columnPosLeft[i] > range.rightPx ||
        this.getColumnRangeRight(Math.min(this.columns.length - 1, (i || 0) + (colspan as number) - 1), i) < range.leftPx
      ) {
        if (!(row === this.activeRow && Number(i) === this.activeCell)) {
          cellsToRemove.push(i as unknown as number);
        }
      }
    });

    let cellToRemove;
    let cellNode;
    while (isDefined((cellToRemove = cellsToRemove.pop()))) {
      cellNode = cacheEntry.cellNodesByColumnIdx[cellToRemove];

      /* v8 ignore if */
      if (this._options.enableAsyncPostRenderCleanup && this.postProcessedRows[row]?.[cellToRemove]) {
        this.queuePostProcessedCellForCleanup(cellNode, cellToRemove, row);
      } else {
        cellNode.parentElement?.removeChild(cellNode);
      }

      cacheEntry.cellSpanFragments?.[cellToRemove]?.forEach((fragment) => fragment.remove());

      delete cacheEntry.cellColSpans[cellToRemove];
      delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
      delete cacheEntry.cellSpanFragments?.[cellToRemove];
      delete cacheEntry.cellSpanSegments?.[cellToRemove];
      /* v8 ignore if */
      if (this.postProcessedRows[row]) {
        delete this.postProcessedRows[row][cellToRemove];
      }
    }
  }

  protected cleanUpAndRenderCells(range: CellViewportRange): void {
    let cacheEntry: RowCaching;
    const divRow: HTMLElement = document.createElement('div');
    const processedRows: number[] = [];
    let cellsAdded: number;
    let colspan: number | string;
    let columnData: ColumnMetadata | null;
    const columnCount = this.columns.length;
    const hasAlwaysRenderColumn = this.columns.some((column) => column?.alwaysRenderColumn);
    let firstColumnIndex = 0;

    // Column positions are monotonic when there are no pinned columns, so use a lower-bound lookup
    // to avoid scanning columns that are entirely left of the rendered range in the common case.
    if (!this.hasDockedColumns() && !hasAlwaysRenderColumn) {
      firstColumnIndex = this.getFirstColumnIndexAtOrAfter(range.leftPx);
    }

    for (let row = range.top as number, btm = range.bottom as number; row <= btm; row++) {
      cacheEntry = this.rowsCache[row];
      if (cacheEntry) {
        // cellRenderQueue populated in renderRows() needs to be cleared first
        this.ensureCellNodesInRowsCache(row);

        if (!this._options.enableCellRowSpan || this.getRowSpanIntersect(row) === null) {
          this.cleanUpCells(range, row);
        }

        // Render missing cells.
        cellsAdded = 0;

        const metadata = this.getItemMetadaWhenExists(row);
        const metadataCol = metadata?.columns;

        const d = this.getDataItem(row);
        let isFullColspan = false;
        const startColumnIndex = metadataCol || metadata?.isGroup ? 0 : firstColumnIndex;

        for (let i = startColumnIndex, ii = columnCount; i < ii; i++) {
          if (this.columns[i] && (!this.columns[i].hidden || metadata?.isGroup)) {
            // Cells to the right are outside the range.
            if (this.getColumnDockingBand(i) === 'center' && this.columnPosLeft[i] > range.rightPx) {
              if (!this.hasDockedColumns()) {
                break;
              }
              continue;
            }

            // Already rendered.
            if (isDefined((colspan = cacheEntry.cellColSpans[i] as number))) {
              i += colspan > 1 ? colspan - 1 : 0;
              continue;
            }

            colspan = 1;
            columnData = null;
            if (metadataCol) {
              columnData = metadataCol[this.columns[i].id as keyof ItemMetadata] || (metadataCol as any)[i];
              colspan = columnData?.colspan ?? 1;
              if (colspan === '*') {
                colspan = ii - i;
                isFullColspan = true;
              }
            }

            let ncolspan = colspan as number; // at this point colspan is for sure a number

            if (!isFullColspan && this._options.spreadHiddenColspan) {
              ncolspan = this.increaseHiddenColspan(ncolspan, i);
            }

            // don't render child cell of a rowspan cell
            if (this.getParentRowSpanByCell(row, i)) {
              continue;
            }

            if (
              this.getColumnDockingBand(i) !== 'center' ||
              this.getColumnRangeRight(Math.min(ii - 1, i + ncolspan - 1), i) > range.leftPx
            ) {
              const rowspan = this.getRowspan(row, i);
              const isFullWidthGroup = this.usesDockingRowRegions() && this.isFullWidthGroupCell(metadata, columnData, i, ncolspan);
              cacheEntry.rowNode?.[0].classList.toggle('slick-row-full-width-group', isFullWidthGroup);
              this.appendCellHtml(divRow, row, i, ncolspan, rowspan, columnData, d, isFullWidthGroup, true);
              cellsAdded++;
            }

            i += ncolspan > 1 ? ncolspan - 1 : 0;
          }
        }

        if (cellsAdded) {
          processedRows.push(row);
        }
      }
    }
    if (!divRow.children.length) {
      return;
    }

    let processedRow: number | null | undefined;
    let node: HTMLElement;
    while (isDefined((processedRow = processedRows.pop()))) {
      cacheEntry = this.rowsCache[processedRow];
      let columnIdx;
      while (isDefined((columnIdx = cacheEntry.cellRenderQueue.pop()))) {
        node = divRow.lastChild as HTMLElement;

        // no idea why node would be null here but apparently it could be..
        if (node) {
          /* v8 ignore if */
          if (this.usesDockingRowRegions()) {
            this.getRowDockingRegion(cacheEntry.rowNode![0], columnIdx).appendChild(node);
          } else {
            cacheEntry.rowNode![0].appendChild(node);
          }
          cacheEntry.cellNodesByColumnIdx![columnIdx] = node;

          const fragments = cacheEntry.cellSpanFragments?.[columnIdx];
          const segments = cacheEntry.cellSpanSegments?.[columnIdx];
          fragments?.forEach((fragment, index) => {
            this.getRowDockingRegion(cacheEntry.rowNode![0], segments[index + 1].start).appendChild(fragment);
          });
        }
      }
      cacheEntry.rowNode?.forEach((rowNode) => this.applyRowTopOffset(rowNode, processedRow!));
    }
  }

  protected getFirstColumnIndexAtOrAfter(leftPx: number): number {
    let low = 0;
    let high = this.columnPosRight.length;
    while (low < high) {
      const mid = low + Math.floor((high - low) / 2);
      if (this.columnPosRight[mid] <= leftPx) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }

  protected createEmptyCachingRow(): RowCaching {
    return {
      rowNode: null,

      // ColSpans of rendered cells (by column idx).
      // Can also be used for checking whether a cell has been rendered.
      cellColSpans: [],

      // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
      cellNodesByColumnIdx: [],

      // Column indices of cell nodes that have been rendered, but not yet indexed in
      // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
      // end of the row.
      cellRenderQueue: [],

      // Continuation fragments for colspans crossing docking bands, keyed by host cell.
      cellSpanFragments: {},
      cellSpanSegments: {},
    };
  }

  protected renderRows(range: { top: number; bottom: number; leftPx: number; rightPx: number }): void {
    const divArray: HTMLElement[] = [];
    const rows: number[] = [];
    let needToReselectCell = false;
    const dataLength = this.getDataLength();
    const mustRenderRows = new Set<number>();
    const renderingRows = new Set<number>();

    for (let i = range.top as number, ii = range.bottom as number; i <= ii; i++) {
      if (this.rowsCache[i]) {
        continue;
      }
      this.renderedRows++;
      rows.push(i);
      renderingRows.add(i);

      // Create an entry right away so that appendRowHtml() can start populating it.
      this.rowsCache[i] = this.createEmptyCachingRow();

      // add any rows that have rowspan intersects if it's not already in the list
      if (this._options.enableCellRowSpan) {
        const parentRowSpan = this.getRowSpanIntersect(i);
        if (parentRowSpan !== null) {
          renderingRows.add(parentRowSpan); // add to Set which will take care of duplicate rows
        }
      }

      this.appendRowHtml(divArray, i, range, dataLength);
      mustRenderRows.add(i);
      if (this.activeCellNode && this.activeRow === i) {
        needToReselectCell = true;
      }
      this.counter_rows_rendered++;
    }

    // check if there's any col/row span intersecting and if so add them to the renderingRows
    const mandatorySpanRows = this.setDifference(renderingRows, mustRenderRows);
    if (mandatorySpanRows.size > 0) {
      mandatorySpanRows.forEach((r) => {
        this.removeRowFromCache(r); // remove any previous element to avoid duplicates in DOM
        rows.push(r);
        this.rowsCache[r] = this.createEmptyCachingRow();
        this.appendRowHtml(divArray, r, range, dataLength);
      });
    }

    if (rows.length) {
      const x = document.createElement('div');
      divArray.forEach((elm) => x.appendChild(elm as HTMLElement));

      for (let i = 0, ii = rows.length; i < ii; i++) {
        if (this.rowsCache?.hasOwnProperty(rows[i]) && x.firstChild) {
          const row = rows[i];
          const rowNode = x.firstChild as HTMLElement;
          this.rowsCache[row].rowNode = [rowNode];
          const dockingBand = this.dockingByRow.get(row)?.band;
          (dockingBand && dockingBand !== 'center' ? this.ensureDockingOverlay() : this._canvasNode).appendChild(rowNode);
        }
      }

      if (needToReselectCell) {
        this.activeCellNode = this.getCellNode(this.activeRow, this.activeCell);
      }
    }
  }

  /** polyfill if the new Set.difference() added in ES2024 */
  protected setDifference(a: Set<number>, b: Set<number>): Set<number> {
    return new Set(Array.from(a).filter((item) => !b.has(item)));
  }

  protected startPostProcessing(): void {
    if (this._options.enableAsyncPostRender) {
      clearTimeout(this.h_postrender);
      this.h_postrender = setTimeout(this.asyncPostProcessRows.bind(this), this._options.asyncPostRenderDelay);
    }
  }

  protected startPostProcessingCleanup(): void {
    if (this._options.enableAsyncPostRenderCleanup) {
      clearTimeout(this.h_postrenderCleanup);
      this.h_postrenderCleanup = setTimeout(this.asyncPostProcessCleanupRows.bind(this), this._options.asyncPostRenderCleanupDelay);
    }
  }

  protected invalidatePostProcessingResults(row: number): void {
    // change status of columns to be re-rendered
    if (typeof this.postProcessedRows[row] === 'object') {
      Object.keys(this.postProcessedRows[row]).forEach((columnIdx) => {
        if (this.postProcessedRows[row].hasOwnProperty(columnIdx)) {
          this.postProcessedRows[row][columnIdx] = 'C';
        }
      });
    }
    this.postProcessFromRow = Math.min(this.postProcessFromRow as number, row);
    this.postProcessToRow = Math.max(this.postProcessToRow as number, row);
    this.startPostProcessing();
  }

  protected updateRowPositions(dockedOnly = false): void {
    if (this.rowsCache && typeof this.rowsCache === 'object') {
      Object.keys(this.rowsCache).forEach((row) => {
        const rowNumber = row ? parseInt(row, 10) : 0;
        if (dockedOnly && !this.dockingByRow.has(rowNumber)) {
          return;
        }
        this.rowsCache[rowNumber].rowNode!.forEach((rowNode) => {
          this.applyRowTopOffset(rowNode, rowNumber);
        });
      });
    }
  }

  /** (re)Render the grid */
  render(): void {
    if (this.initialized) {
      this.scrollThrottle.dequeue();

      const visible = this.getVisibleRange();
      const rendered = this.getRenderedRange();

      // remove rows no longer in the viewport
      this.cleanupRows(rendered);

      // add new rows & missing cells in existing rows
      if (this.lastRenderedScrollLeft !== this.scrollLeft) {
        this.cleanUpAndRenderCells(rendered);
      }

      // render missing rows
      this.renderRows(rendered);

      for (const row of [...this.rowDockingLayout.top, ...this.rowDockingLayout.bottom]) {
        this.renderRows({ top: row.index, bottom: row.index, leftPx: rendered.leftPx, rightPx: rendered.rightPx });
      }

      this.postProcessFromRow = visible.top;
      this.postProcessToRow = Math.min(this.getDataLengthIncludingAddNew() - 1, visible.bottom);
      this.startPostProcessing();

      this.lastRenderedScrollTop = this.scrollTop;
      this.lastRenderedScrollLeft = this.scrollLeft;
      this.triggerEvent(this.onRendered, { startRow: visible.top, endRow: visible.bottom, grid: this });
    }
  }

  protected handleHeaderRowScroll(e?: Event): void {
    this.handleElementScroll((e?.currentTarget || e?.target || this._headerRowScrollContainer) as HTMLElement);
  }

  protected handleFooterRowScroll(e?: Event): void {
    this.handleElementScroll((e?.currentTarget || e?.target || this._footerRowScrollContainer) as HTMLElement);
  }

  protected handlePreHeaderPanelScroll(e?: Event): void {
    this.handleElementScroll((e?.currentTarget || e?.target || this._preHeaderPanelScroller) as HTMLElement);
  }

  protected handleTopHeaderPanelScroll(e?: Event): void {
    this.handleElementScroll((e?.currentTarget || e?.target || this._topHeaderPanelScroller) as HTMLElement);
  }

  protected handleElementScroll(element: HTMLElement): void {
    if (this.forwardDockingHorizontalScroll(element)) {
      return;
    }
    const scrollLeft = element.scrollLeft;
    if (scrollLeft !== this._viewportScrollContainerX.scrollLeft) {
      this._viewportScrollContainerX.scrollLeft = scrollLeft;
    }
  }

  /** Forward legacy chrome/body scroll offsets to the single docking scrollbar. */
  protected forwardDockingHorizontalScroll(source: HTMLElement | null | undefined): boolean {
    if (!this.hasDockingHorizontalScroller() || !source || source === this._viewportScrollContainerX) {
      return false;
    }

    const scrollLeft = source.scrollLeft;
    // RTL browsers represent horizontal offsets as negative values. Only an
    // actual origin offset should be ignored; rejecting all values <= 0
    // prevents RTL scrolling from reaching the single proxy scroll owner.
    if (scrollLeft === 0) {
      return false;
    }

    this.clearDockingNativeHorizontalScrollOffsets();
    this._viewportScrollContainerX.scrollLeft = scrollLeft;
    return true;
  }

  /** Reset inactive horizontal scroll containers in proxy mode. */
  protected clearDockingNativeHorizontalScrollOffsets(): void {
    if (!this.hasDockingHorizontalScroller()) {
      return;
    }

    const scrollOwner = this._viewportScrollContainerX;
    const sources = new Set<HTMLElement>([
      this._viewportNode,
      this._headerScrollerL,
      this._headerRowScrollerL,
      this._footerRowScrollerL,
      this._preHeaderPanelScroller,
      this._topHeaderPanelScroller,
    ]);
    sources.forEach((element) => {
      if (element && element !== scrollOwner && element.scrollLeft !== 0) {
        element.scrollLeft = 0;
      }
    });
  }

  protected handleScroll(e?: Event): boolean {
    const scrollSource = e?.target instanceof HTMLElement ? e.target : null;
    if (this.hasDockingHorizontalScroller()) {
      this.forwardDockingHorizontalScroll(scrollSource);
      this.clearDockingNativeHorizontalScrollOffsets();
    }
    this.scrollHeight = this._viewportScrollContainerY.scrollHeight;
    this.scrollTop = this._viewportScrollContainerY.scrollTop;
    this.scrollLeft = this._viewportScrollContainerX.scrollLeft;
    const handled = this._handleScroll(e ? 'scroll' : 'system');
    // Reapply transforms even when the numeric offset is unchanged after a
    // route transition or explicit reset.
    if (this.hasDockingHorizontalScroller() && !handled) {
      this.scrollToX(this.scrollLeft);
    }
    return handled;
  }

  protected _handleScroll(eventType: 'mousewheel' | 'scroll' | 'system' = 'system'): boolean {
    let maxScrollDistanceY = this._viewportScrollContainerY.scrollHeight - this._viewportScrollContainerY.clientHeight;
    let maxScrollDistanceX = this._viewportScrollContainerX.scrollWidth - this._viewportScrollContainerX.clientWidth;

    // Protect against erroneous clientHeight/Width greater than scrollHeight/Width.
    // Sometimes seen in Chrome.
    maxScrollDistanceY = Math.max(0, maxScrollDistanceY);
    maxScrollDistanceX = Math.max(0, maxScrollDistanceX);

    // Ceiling the max scroll values
    if (this.scrollTop > maxScrollDistanceY) {
      this.scrollTop = maxScrollDistanceY;
      this.scrollHeight = maxScrollDistanceY;
    }
    if (this.scrollLeft > maxScrollDistanceX) {
      this.scrollLeft = maxScrollDistanceX;
    }
    // A horizontal-wheel mouse (or a fast tilt-wheel burst) can push scrollLeft
    // past either bound; floor it so docking offsets never go negative.
    if (this.scrollTop < 0) {
      this.scrollTop = 0;
    }
    if (this.scrollLeft < 0) {
      this.scrollLeft = 0;
    }

    const vScrollDist = Math.abs(this.scrollTop - this.prevScrollTop);
    const hScrollDist = Math.abs(this.scrollLeft - this.prevScrollLeft);
    let columnDockingChanged = false;

    if (hScrollDist) {
      this.prevScrollLeft = this.scrollLeft;

      if (this.hasStickyColumns()) {
        // Keep the compositor path synchronous and defer sticky-band
        // membership changes so rapid horizontal scrolling is not blocked by
        // repeated resolver/render work.
        this.enqueueStickyColumnLayout();
      } else {
        columnDockingChanged = this.refreshDockingLayout(this.scrollLeft);
        if (columnDockingChanged) {
          this.updateColumnCaches();
          this.applyColumnWidths();
          // Right chrome is measured relative to the translated header
          // container. Commit the current compositor transform first so a
          // docking transition cannot measure the previous scroll position.
          this.scrollToX(this.scrollLeft);
          this.applyDockingToColumnChrome();
          this.invalidateAllRows();
        }
      }

      // adjust scroll position of all div containers when scrolling the grid
      this.scrollToX(this.scrollLeft);
      this.applyDockingScrollOffsets();
      if (columnDockingChanged) {
        this.render();
      }
    }

    // autoheight suppresses vertical scrolling, but editors can create a div larger than
    // the row vertical size, which can lead to a vertical scroll bar appearing temporarily
    // while the editor is displayed. this is not part of the grid scrolling, so we should ignore it
    if (vScrollDist && !this._options.autoHeight) {
      this.vScrollDir = this.prevScrollTop < this.scrollTop ? 1 : -1;
      this.prevScrollTop = this.scrollTop;

      if (eventType === 'mousewheel') {
        this._viewportScrollContainerY.scrollTop = this.scrollTop;
      }

      this._viewportScrollContainerY.scrollTop = this.scrollTop;

      // switch virtual pages if needed
      if (vScrollDist < this.viewportH) {
        this.scrollTo(this.scrollTop + this.offset);
      } else {
        this.page = this.getPageFromLargeScrollDelta(this.scrollTop);
        this.offset = this.getPageOffset(this.page);
      }
    }

    if (vScrollDist) {
      this.refreshRowDockingLayout(this.scrollTop);
    }

    if (hScrollDist || vScrollDist) {
      const dx = Math.abs(this.lastRenderedScrollLeft - this.scrollLeft);
      const dy = Math.abs(this.lastRenderedScrollTop - this.scrollTop);
      if (dx > 20 || dy > 20) {
        if (this._isResizingColumn && hScrollDist && !vScrollDist) {
          this.lastRenderedScrollLeft = this.scrollLeft;
          this.triggerEvent(this.onViewportChanged, {});
          return true;
        }

        // Keep the horizontal compositor transform ahead of expensive virtual
        // cell work in the single-viewport layout. A synchronous render here
        // can block the next paint while the native body scroll has already
        // advanced, making headers visibly trail the cells during fast scrolls.
        if (this._viewport.length === 1 && hScrollDist) {
          this.enqueueSingleViewportRender();
        } else if (this._options.forceSyncScrolling || (dy < this.viewportH && dx < this.viewportW)) {
          this.render();
        } else {
          // otherwise, perform "difficult" renders at a capped frequency
          this.scrollThrottle.enqueue();
        }

        this.triggerEvent(this.onViewportChanged, {});
      }
    }

    this.triggerEvent(this.onScroll, {
      triggeredBy: eventType,
      scrollHeight: this.scrollHeight,
      scrollLeft: this.scrollLeft,
      scrollTop: this.scrollTop,
    });

    if (hScrollDist || vScrollDist) {
      return true;
    }
    return false;
  }

  protected handleActiveCellPositionChange(): void {
    if (this.activeCellNode) {
      this.triggerEvent(this.onActiveCellPositionChanged, {});

      if (this.currentEditor) {
        const cellBox = this.getActiveCellPosition();
        if (this.currentEditor.show && this.currentEditor.hide) {
          if (!cellBox.visible) {
            this.currentEditor.hide();
          } else {
            this.currentEditor.show();
          }
        }

        if (this.currentEditor.position) {
          this.currentEditor.position(cellBox);
        }
      }
    }
  }

  /**
   * limits the frequency at which the provided action is executed.
   * call enqueue to execute the action - it will execute either immediately or, if it was executed less than minPeriod_ms in the past, as soon as minPeriod_ms has expired.
   * call dequeue to cancel any pending action.
   */
  protected actionThrottle(action: () => void, minPeriod_ms: number): { enqueue: () => void; dequeue: () => void } {
    let blocked = false;
    let queued = false;

    const enqueue = () => {
      if (!blocked) {
        blockAndExecute();
      } else {
        queued = true;
      }
    };

    const dequeue = () => (queued = false);

    const blockAndExecute = () => {
      blocked = true;
      clearTimeout(this._executionBlockTimer);
      this._executionBlockTimer = setTimeout(unblock, minPeriod_ms);
      action.call(this);
    };

    const unblock = () => {
      /* v8 ignore if */
      if (queued) {
        dequeue();
        blockAndExecute();
      } else {
        blocked = false;
      }
    };

    return {
      enqueue: enqueue.bind(this),
      dequeue: dequeue.bind(this),
    };
  }

  /**
   * Queue a render for the next paint in the single-viewport POC.
   *
   * Native body scrolling is compositor-driven, while rendering missing center
   * cells is main-thread work. Running that work synchronously from the scroll
   * handler can prevent the already-updated header transform from painting in
   * the same frame, especially during fast trackpad/wheel scrolling. Sticky
   * layout resolution is also queued on animation frames, so both operations
   * resolve in the same paint cycle.
   */
  protected enqueueSingleViewportRender(): void {
    if (this.singleViewportRenderTimer !== undefined) {
      return;
    }

    const render = () => {
      this.singleViewportRenderTimer = undefined;
      this.render();
    };
    this.singleViewportRenderTimer = this.scheduleAnimationFrame(render);
  }

  protected cancelSingleViewportRender(): void {
    this.cancelScheduledAnimationFrame(this.singleViewportRenderTimer);
    this.singleViewportRenderTimer = undefined;
  }

  protected scheduleAnimationFrame(callback: FrameRequestCallback): number {
    return typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : (setTimeout(callback, 16) as unknown as number);
  }

  protected cancelScheduledAnimationFrame(frame?: number): void {
    if (frame !== undefined) {
      globalThis.cancelAnimationFrame?.(frame);
      clearTimeout(frame);
    }
  }

  /** Whether the current column definitions contain scroll-activated sticky candidates. */
  protected hasStickyColumns(): boolean {
    return this.columns.some((column) => !column.hidden && !!column.sticky);
  }

  /**
   * Resolve sticky columns at most once per animation frame. The horizontal
   * scrollbar and compositor transforms remain immediate; only the relatively
   * expensive band transition is deferred.
   */
  protected enqueueStickyColumnLayout(): void {
    if (this.stickyColumnLayoutFrame !== undefined) {
      return;
    }

    const update = () => {
      this.stickyColumnLayoutFrame = undefined;
      if (!this.initialized) {
        return;
      }

      const dockingChanged = this.refreshDockingLayout(this.scrollLeft, true);
      if (!dockingChanged) {
        return;
      }

      // The layout was just resolved above; only its virtual-cell coordinate
      // cache needs rebuilding. Calling updateColumnCaches() here would run a
      // second sticky resolver pass in the same animation frame.
      this.updateColumnPositionCaches();
      this.applyColumnWidths();
      this.applyDockingToColumnChrome();

      // A sticky transition normally only moves a few columns between the
      // center and an edge. Re-home the already-rendered cell nodes instead of
      // discarding/reformatting every visible row. Fall back to the normal
      // rebuild only when docking has just introduced row regions that do not
      // exist in the current DOM yet.
      if (this.updateRenderedCellDocking()) {
        // Region widths and the right-edge compensation change with the
        // active sticky band. Update only the existing row wrappers; the
        // normal deferred virtual-cell pass will fill any missing center cell
        // without forcing another full render in this animation frame.
        this.applyDockingDimensionsToRows();
        this.enqueueSingleViewportRender();
        return;
      }

      // A transition from no docked columns to a docked layout has no row
      // regions to reuse. Keep the conservative full render for that uncommon
      // structural change.
      this.invalidateAllRows();
      this.cancelSingleViewportRender();
      this.lastRenderedScrollLeft = Number.NaN;
      this.render();
    };

    this.stickyColumnLayoutFrame = this.scheduleAnimationFrame(update);
  }

  protected asyncPostProcessRows(): void {
    const dataLength = this.getDataLength();
    while (this.postProcessFromRow <= this.postProcessToRow) {
      const row = this.vScrollDir >= 0 ? this.postProcessFromRow++ : this.postProcessToRow--;
      const cacheEntry = this.rowsCache[row];
      if (!cacheEntry || row >= dataLength) {
        continue;
      }

      if (!this.postProcessedRows[row]) {
        this.postProcessedRows[row] = {};
      }

      this.ensureCellNodesInRowsCache(row);
      Object.keys(cacheEntry.cellNodesByColumnIdx).forEach((colIdx) => {
        if (cacheEntry.cellNodesByColumnIdx.hasOwnProperty(colIdx)) {
          const columnIdx = +colIdx;
          const m = this.columns[columnIdx];
          const processedStatus = this.postProcessedRows[row][columnIdx]; // C=cleanup and re-render, R=rendered
          if (m.asyncPostRender && processedStatus !== 'R') {
            const node = cacheEntry.cellNodesByColumnIdx[columnIdx];
            if (node) {
              m.asyncPostRender(node, row, this.getDataItem(row), m, processedStatus === 'C');
            }
            this.postProcessedRows[row][columnIdx] = 'R';
          }
        }
      });

      this.h_postrender = setTimeout(this.asyncPostProcessRows.bind(this), this._options.asyncPostRenderDelay);
      return;
    }
  }

  protected asyncPostProcessCleanupRows(): void {
    if (this.postProcessedCleanupQueue.length > 0) {
      const groupId = this.postProcessedCleanupQueue[0].groupId;

      // loop through all queue members with this groupID
      while (this.postProcessedCleanupQueue.length > 0 && this.postProcessedCleanupQueue[0].groupId === groupId) {
        const entry = this.postProcessedCleanupQueue.shift();
        if (entry?.actionType === 'R') {
          (entry.node as HTMLElement[]).forEach((node) => {
            node.remove();
          });
        }
        if (entry?.actionType === 'C') {
          const column = this.columns[entry.columnIdx as number];
          if (column.asyncPostRenderCleanup && entry.node) {
            // cleanup must also remove element
            column.asyncPostRenderCleanup(entry.node as HTMLDivElement, entry.rowIdx as number, column);
          }
        }
      }

      // call this function again after the specified delay
      this.h_postrenderCleanup = setTimeout(this.asyncPostProcessCleanupRows.bind(this), this._options.asyncPostRenderCleanupDelay);
    }
  }

  protected updateCellCssStylesOnRenderedRows(addedHash?: CssStyleHash | null, removedHash?: CssStyleHash | null): void {
    let node: HTMLElement | null;
    let addedRowHash: any;
    let removedRowHash: any;
    if (typeof this.rowsCache === 'object') {
      Object.keys(this.rowsCache).forEach((row) => {
        if (this.rowsCache) {
          removedRowHash = removedHash?.[row];
          addedRowHash = addedHash?.[row];

          if (removedRowHash) {
            Object.keys(removedRowHash).forEach((columnId) => {
              if (!addedRowHash || removedRowHash![columnId] !== addedRowHash[columnId]) {
                node = this.getCellNode(+row, this.getColumnIndex(columnId));
                if (node) {
                  node.classList.remove(removedRowHash[columnId]);
                }
              }
            });
          }

          if (addedRowHash) {
            Object.keys(addedRowHash).forEach((columnId) => {
              if (!removedRowHash || removedRowHash[columnId] !== addedRowHash[columnId]) {
                node = this.getCellNode(+row, this.getColumnIndex(columnId));
                if (node) {
                  node.classList.add(addedRowHash[columnId]);
                }
              }
            });
          }
        }
      });
    }
  }

  /** Merges the keyed CSS overlays once on update, rather than for every rendered cell. */
  protected updateCellCssClassesByCell(): void {
    this.cellCssClassesByCell = Object.create(null);

    Object.values(this.cellCssClasses).forEach((hash) => {
      Object.entries(hash).forEach(([row, cellClasses]) => {
        const mergedRowClasses = (this.cellCssClassesByCell[row] ??= Object.create(null));
        Object.entries(cellClasses).forEach(([columnId, cssClasses]) => {
          if (cssClasses) {
            mergedRowClasses[columnId] = mergedRowClasses[columnId] ? `${mergedRowClasses[columnId]} ${cssClasses}` : cssClasses;
          }
        });
      });
    });
  }

  /**
   * Adds an "overlay" of CSS classes to cell DOM elements. SlickGrid can have many such overlays associated with different keys and they are frequently used by plugins. For example, SlickGrid uses this method internally to decorate selected cells with selectedCellCssClass (see options).
   * @param {String} key A unique key you can use in calls to setCellCssStyles and removeCellCssStyles. If a hash with that key has already been set, an exception will be thrown.
   * @param {CssStyleHash} hash A hash of additional cell CSS classes keyed by row number and then by column id. Multiple CSS classes can be specified and separated by space.
   * @example
   * `{
   * 	 0: { number_column: SlickEvent; title_column: SlickEvent;	},
   * 	 4: { percent_column: SlickEvent; }
   * }`
   */
  addCellCssStyles(key: string, hash: CssStyleHash): void {
    if (this.cellCssClasses[key]) {
      throw new Error(`SlickGrid addCellCssStyles: cell CSS hash with key "${key}" already exists.`);
    }

    this.cellCssClasses[key] = hash;
    this.updateCellCssClassesByCell();
    this.updateCellCssStylesOnRenderedRows(hash, null);
    this.triggerEvent(this.onCellCssStylesChanged, { key, hash, grid: this });
  }

  /**
   * Removes an "overlay" of CSS classes from cell DOM elements. See setCellCssStyles for more.
   * @param {String} key A string key.
   */
  removeCellCssStyles(key: string): void {
    if (this.cellCssClasses[key]) {
      this.updateCellCssStylesOnRenderedRows(null, this.cellCssClasses[key]);
      delete this.cellCssClasses[key];
      this.updateCellCssClassesByCell();
      this.triggerEvent(this.onCellCssStylesChanged, { key, hash: null, grid: this });
    }
  }

  /**
   * Removes an "overlay" of CSS classes from cell DOM elements matching predicated entries.
   * Useful when you have multiple keys and want to remove them based on a certain criteria.
   * @param {Function} predicate A callback function that receives the key and hash as arguments and should return true if the entry should be removed.
   * @example
   * grid.removeCellCssStylesBatch((key, hash) => key.startsWith('unsaved-changes') && hash[0].includes('highlight'));
   */
  removeCellCssStylesBatch(predicate: (key: string, hash: CssStyleHash) => boolean): void {
    Object.entries(this.cellCssClasses).forEach(([k, v]) => predicate(k, v) && this.removeCellCssStyles(k));
  }

  /**
   * Sets CSS classes to specific grid cells by calling removeCellCssStyles(key) followed by addCellCssStyles(key, hash). key is name for this set of styles so you can reference it later - to modify it or remove it, for example. hash is a per-row-index, per-column-name nested hash of CSS classes to apply.
   * Suppose you have a grid with columns:
   * ["login", "name", "birthday", "age", "likes_icecream", "favorite_cake"]
   * ...and you'd like to highlight the "birthday" and "age" columns for people whose birthday is today, in this case, rows at index 0 and 9. (The first and tenth row in the grid).
   * @param {String} key A string key. Will overwrite any data already associated with this key.
   * @param {Object} hash A hash of additional cell CSS classes keyed by row number and then by column id. Multiple CSS classes can be specified and separated by space.
   */
  setCellCssStyles(key: string, hash: CssStyleHash): void {
    const prevHash = this.cellCssClasses[key];
    this.cellCssClasses[key] = hash;
    this.updateCellCssClassesByCell();
    this.updateCellCssStylesOnRenderedRows(hash, prevHash);
    this.triggerEvent(this.onCellCssStylesChanged, { key, hash, grid: this });
  }

  /**
   * Accepts a key name, returns the group of CSS styles defined under that name. See setCellCssStyles for more info.
   * @param {String} key A string.
   */
  getCellCssStyles(key: string): CssStyleHash {
    return this.cellCssClasses[key];
  }

  protected isCellSelected(row: number, cell: number): boolean {
    return (
      !!this._options.selectedCellCssClass &&
      this.selectedRanges.some((range) => range.contains(row, cell)) &&
      this.canCellBeSelected(row, cell)
    );
  }

  /**
   * Flashes the cell twice by toggling the CSS class 4 times.
   * @param {Number} row A row index.
   * @param {Number} cell A column index.
   * @param {Number} [speed] (optional) - The milliseconds delay between the toggling calls. Defaults to 250 ms.
   */
  flashCell(row: number, cell: number, speed = 250): void {
    const toggleCellClass = (cellNode: HTMLElement, times: number) => {
      if (times > 0) {
        clearTimeout(this._flashCellTimer);
        this._flashCellTimer = setTimeout(() => {
          cellNode.classList.toggle(this._options.cellFlashingCssClass || '', times % 2 === 0);
          toggleCellClass(cellNode, times - 1);
        }, speed);
      }
    };

    if (this.rowsCache[row]) {
      const cellNode = this.getCellNode(row, cell);
      if (cellNode) {
        toggleCellClass(cellNode, 5);
      }
    }
  }

  /**
   * Highlight a row for a certain duration (ms) of time.
   * @param {Number} row - grid row number
   * @param {Number} [duration] - duration (ms), defaults to 400ms
   */
  highlightRow(row: number, duration?: number): void {
    const rowCache = this.rowsCache[row];
    duration ||= this._options.rowHighlightDuration;

    if (Array.isArray(rowCache?.rowNode) && this._options.rowHighlightCssClass) {
      rowCache.rowNode.forEach((node) => node.classList.add(...classNameToList(this._options.rowHighlightCssClass)));
      clearTimeout(this._highlightRowTimer);
      this._highlightRowTimer = setTimeout(() => {
        rowCache.rowNode?.forEach((node) => node.classList.remove(...classNameToList(this._options.rowHighlightCssClass)));
      }, duration);
    }
  }

  /**
   * Programmatically focus a header column by index (default: first visible column).
   * @param index - Column index to focus (defaults to 0)
   */
  focusHeaderColumn(index = 0): void {
    this.getHeaderColumn(index)?.focus();
  }

  /**
   * Programmatically focus a header menu (when found) or fallback to header column if menu is not found or not visible.
   * @param index - Column index to focus (defaults to 0)
   */
  focusHeaderMenuOrColumn(index = 0): void {
    const [headerMenuElm] = this.getVisibleElements(this.getHeaderColumn(index), '.slick-header-menu-button[tabIndex="0"]');
    if (headerMenuElm) {
      headerMenuElm.focus();
    } else {
      this.focusHeaderColumn(index);
    }
  }

  /**
   * Focus on first header row filter element it finds, unless focusOnLast is set to true in which case it will start backward and focus on the last one.
   * If header row filter isn't shown, it will focus on the first grid cell (or grid menu/header menu if focusOnLast is true) instead.
   * @param focusOnLast
   * @returns true when a header row filter element was found and focused otherwise false
   */
  focusHeaderRowFilter(focusOnLast = false): boolean {
    const headerRow = this.getHeaderRow();
    if (this._options.showHeaderRow && headerRow) {
      const headerRows = headerRow instanceof HTMLElement ? [headerRow] : [...headerRow];
      const allFilterElms = headerRows.flatMap((row) =>
        Array.from(row.querySelectorAll<HTMLElement>('.slick-headerrow-column *[tabIndex="0"]'))
      );
      const filterLn = allFilterElms.length;
      let closestVisibleFilter: HTMLElement | null = null;
      if (filterLn > 0) {
        const start = focusOnLast ? filterLn - 1 : 0;
        const end = focusOnLast ? -1 : filterLn;
        const step = focusOnLast ? -1 : 1;
        for (let i = start; i !== end; i += step) {
          const elm = allFilterElms[i];
          if (elm && elm.offsetParent !== null) {
            closestVisibleFilter = elm;
            break;
          }
        }
      }
      if (closestVisibleFilter) {
        (closestVisibleFilter as HTMLElement).focus();
        return true;
      }
    }

    // when header row isn't visible or shown, fallback to focusing on grid cell or grid menu/header menu if focusOnLast is true
    !focusOnLast ? this.focusGridCell() : this.focusGridMenu();
    return false;
  }

  /** focus on the active cell when it exists, otherwise focus on first cell */
  focusGridCell(): void {
    this.setFocus();
    if (!this.getActiveCell()) {
      this.setActiveCell(0, 0);
    }
  }

  /** focus on grid menu button when enabled or fallback to last header menu or column */
  focusGridMenu(): void {
    const gridMenuBtn = this._container?.querySelector<HTMLElement>('.slick-grid-menu-button[tabIndex="0"]');
    if (gridMenuBtn) {
      gridMenuBtn.focus();
    } else {
      this.focusHeaderMenuOrColumn(this.getVisibleColumns().length - 1);
    }
  }

  // Interactivity

  /** focus element and stop event bubbling (for keyboard events) */
  protected focusElementWithoutBubbling(e: KeyboardEvent, target: Element | null): void {
    if (target) {
      (target as HTMLElement).focus();
      this.stopFullBubbling(e);
    }
  }

  /** get only visible elemnts from a container and a query selector, e.g. elements with `display: none` will be excluded. */
  protected getVisibleElements(container: HTMLElement, selector: string): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => el.offsetParent !== null);
  }

  protected handleMouseWheel(e: MouseEvent, _delta: number, deltaX: number, deltaY: number): void {
    this.scrollHeight = this._viewportScrollContainerY.scrollHeight;
    const wheelEvent = e as WheelEvent;
    const lineSize = Math.max(40, this._options.rowHeight!);
    const nativeDelta = wheelEvent.deltaX || (e.shiftKey ? wheelEvent.deltaY : 0);
    const deltaModeFactor = wheelEvent.deltaMode === 1 ? lineSize : wheelEvent.deltaMode === 2 ? this.viewportW : 1;
    const horizontalDelta = nativeDelta ? nativeDelta * deltaModeFactor : (deltaX || (e.shiftKey ? -deltaY : 0)) * lineSize;
    if (!e.shiftKey) {
      this.scrollTop = Math.max(0, this._viewportScrollContainerY.scrollTop - deltaY * this._options.rowHeight!);
    }
    this.scrollLeft = Math.max(0, this._viewportScrollContainerX.scrollLeft + horizontalDelta);
    const handled = this._handleScroll('mousewheel');
    if (handled) {
      e.stopPropagation();
      // The handler owns the wheel event after translating it into grid scroll coordinates.
      e.preventDefault();
    }
  }

  protected handleDragInit(e: DragEvent, dd: DragPosition): boolean {
    const cell = this.getCellFromEvent(e);
    if (!cell || !this.cellExists(cell.row, cell.cell)) {
      return false;
    }

    const retval = this.triggerEvent(this.onDragInit, dd, e);
    if (retval.isImmediatePropagationStopped()) {
      return retval.getReturnValue();
    }

    // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
    // cancel out of it
    return false;
  }

  protected handleDragStart(e: DragEvent, dd: DragPosition): boolean {
    const cell = this.getCellFromEvent(e);
    if (!cell || !this.cellExists(cell.row, cell.cell)) {
      return false;
    }

    if (this.currentEditor && !this.getEditorLock().commitCurrentEdit()) {
      return false;
    }

    const retval = this.triggerEvent(this.onDragStart, dd, e);
    if (retval.isImmediatePropagationStopped()) {
      return retval.getReturnValue();
    }

    return false;
  }

  protected handleDrag(e: DragEvent, dd: DragPosition): void {
    return this.triggerEvent(this.onDrag, dd, e).getReturnValue();
  }

  protected handleDragEnd(e: DragEvent, dd: DragPosition): void {
    this.triggerEvent(this.onDragEnd, dd, e);
  }

  protected handleContainerKeyDown(e: KeyboardEvent & { originalEvent: Event }): void {
    if (e.target instanceof HTMLElement && e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
      const isInHeaderRow = e.target.closest('.slick-headerrow-columns');
      const headerSelector = `.slick-${isInHeaderRow ? 'headerrow-column' : 'header-columns'} *[tabIndex="0"]`;
      const allFilterElms = this.getVisibleElements(this._container, headerSelector);
      const ancestorHeaderRow = e.target instanceof HTMLElement ? e.target.closest(headerSelector) : null;

      if (allFilterElms.length > 0) {
        const targetFilterElm = e.shiftKey ? allFilterElms[0] : allFilterElms[allFilterElms.length - 1];

        if (targetFilterElm === ancestorHeaderRow && isInHeaderRow) {
          // focus grid menu when Shift+Tab OR focus on first cell when using Tab
          this.stopFullBubbling(e);
          e.shiftKey ? this.focusGridMenu() : this.focusGridCell();
        }
      }
    }
  }

  protected handleGridKeyDown(e: KeyboardEvent & { originalEvent: Event; target: HTMLElement }): void {
    const retval = this.triggerEvent(this.onKeyDown, { row: this.activeRow, cell: this.activeCell }, e);
    let handled: boolean | undefined | void = retval.isImmediatePropagationStopped();

    const isGridFocusSinkTarget = e.target === this._focusSink || e.target === this._focusSink2;
    const isPlainTab = e.key === 'Tab' && !e.ctrlKey && !e.altKey;
    const isActiveCellZeroZero = this.activeRow === 0 && this.activeCell === 0;
    const hasGridCellFocus = this.getActiveCell() !== null;

    // Focus sinks are keyboard sentinels around the grid.
    // Intercept only known sink Tab/Shift+Tab edge cases and route focus to header entry points.
    // Otherwise, intentionally fall through to regular keyboard navigation below.
    if (!handled && isGridFocusSinkTarget && isPlainTab) {
      if (e.target === this._focusSink && !e.shiftKey && !hasGridCellFocus) {
        this.focusHeaderMenuOrColumn(0);
        handled = true;
      } else if (e.target === this._focusSink2 && e.shiftKey && isActiveCellZeroZero) {
        this.stopFullBubbling(e);
        if (this._options.showHeaderRow && this.getHeaderRow()) {
          this.focusHeaderRowFilter(true);
        } else {
          this.focusGridMenu();
        }
        handled = true;
      }
    }

    if (!handled) {
      if (this._options.enableCellNavigation && e.ctrlKey && e.key.toLowerCase() === 'c' && !this._options.enableExcelCopyBuffer) {
        // Ctrl+C (copy cell to clipboard, unless Excel Copy Buffer is enabled)
        copyCellToClipboard({
          grid: this as unknown as SlickGrid,
          cell: this.activeCell,
          row: this.activeRow,
          column: this.columns[this.activeCell],
          dataContext: this.getDataItem(this.activeRow),
        });
      } else if (!e.shiftKey && !e.altKey) {
        // editor may specify an array of keys to bubble
        if (this._options.editable && this.currentEditor?.keyCaptureList) {
          if (this.currentEditor.keyCaptureList.indexOf(e.which) > -1) {
            return;
          }
        }
        if (e.ctrlKey && e.key === 'Home') {
          this.navigateTopStart();
        } else if (e.ctrlKey && e.key === 'End') {
          this.navigateBottomEnd();
        } else if (e.ctrlKey && e.key === 'ArrowUp') {
          this.navigateTop();
        } else if (e.ctrlKey && e.key === 'ArrowDown') {
          this.navigateBottom();
        } else if ((e.ctrlKey && e.key === 'ArrowLeft') || (!e.ctrlKey && e.key === 'Home')) {
          this.navigateRowStart();
        } else if ((e.ctrlKey && e.key === 'ArrowRight') || (!e.ctrlKey && e.key === 'End')) {
          this.navigateRowEnd();
        }
      }
    }

    if (!handled) {
      // if Shift+Tab is pressed from the first cell, move focus to the Grid Menu button if present, otherwise last column header menu
      if (e.key === 'Tab' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (this.activeRow === 0 && this.activeCell === 0) {
          this.focusHeaderRowFilter(true);
          handled = true;
        } else {
          handled = this.navigatePrev();
        }
      }

      if (!e.shiftKey && !e.altKey && !e.ctrlKey && !handled) {
        if (e.key === 'Escape') {
          if (!this.getEditorLock()?.isActive()) {
            return; // no editing mode to cancel, allow bubbling and default processing (exit without cancelling the event)
          }
          this.cancelEditAndSetFocus();
        } else if (e.key === 'PageDown') {
          this.navigatePageDown();
          handled = true;
        } else if (e.key === 'PageUp') {
          this.navigatePageUp();
          handled = true;
        } else if (e.key === 'ArrowLeft') {
          handled = this.navigateLeft();
        } else if (e.key === 'ArrowRight') {
          handled = this.navigateRight();
        } else if (e.key === 'ArrowUp') {
          handled = this.navigateUp();
        } else if (e.key === 'ArrowDown') {
          handled = this.navigateDown();
        } else if (e.key === 'Tab') {
          handled = this.navigateNext();
        } else if (e.key === 'Enter') {
          if (this._options.editable) {
            if (this.currentEditor) {
              // adding new row
              if (this.activeRow === this.getDataLength()) {
                this.navigateDown();
              } else {
                this.commitEditAndSetFocus();
              }
            } else {
              if (this.getEditorLock()?.commitCurrentEdit()) {
                this.makeActiveCellEditable(undefined, undefined, e);
              }
            }
          }
          handled = true;
        } else if (e.key === 'F2' && this._options.editable && !this.currentEditor) {
          this.makeActiveCellEditable(undefined, undefined, e);
          handled = true;
        } else if (e.key === 'F6') {
          // F6 focuses header row (accessibility pattern)
          this.focusHeaderColumn();
          handled = true;
        }
      }
    }

    const cell = this.getActiveCell();
    const isChar = /^[\p{L}\p{N}\p{P}\p{S}\s]$/u.test(e.key); // make sure it's a character being typed
    if (!handled && this._options.autoEditByKeypress && cell && isChar && this.isCellEditable(cell.row, cell.cell) && !this.currentEditor) {
      this.makeActiveCellEditable(undefined, false, e);
    }

    if (handled) {
      // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
      this.stopFullBubbling(e);
    }
  }

  protected handleClick(evt: DOMEvent<HTMLDivElement> | SlickEventData): void {
    const e = evt instanceof SlickEventData ? evt.getNativeEvent() : evt;

    if (!this.currentEditor) {
      // if this click resulted in some cell child node getting focus,
      // don't steal it back - keyboard events will still bubble up
      // IE9+ seems to default DIVs to tabIndex=0 instead of -1, so check for cell clicks directly.
      // prettier-ignore
      if ((e as DOMEvent<HTMLDivElement>).target !== document.activeElement || (e as DOMEvent<HTMLDivElement>).target.classList.contains('slick-cell')) {
        const selection = this.getTextSelection(); // store text-selection and restore it after
        this.setFocus();
        this.setTextSelection(selection as Range);
      }
    }

    const cell = this.getCellFromEvent(e);
    if (!cell || (this.currentEditor !== null && this.activeRow === cell.row && this.activeCell === cell.cell)) {
      return;
    }

    evt = this.triggerEvent(this.onClick, { row: cell.row, cell: cell.cell }, evt || e);
    if ((evt as SlickEventData).isImmediatePropagationStopped() || e.defaultPrevented) {
      return;
    }

    // this optimisation causes trouble - MLeibman #329
    // if ((activeCell !== cell.cell || activeRow !== cell.row) && canCellBeActive(cell.row, cell.cell)) {
    if (this.canCellBeActive(cell.row, cell.cell)) {
      if (!this.getEditorLock()?.isActive() || this.getEditorLock()?.commitCurrentEdit()) {
        this.scrollRowIntoView(cell.row, false);

        const preClickModeOn = !!(e as DOMEvent<HTMLDivElement>).target?.classList?.contains(preClickClassName);
        const column = this.columns[cell.cell];
        const suppressActiveCellChangedEvent = !!(
          this._options.editable &&
          column?.editorClass &&
          this._options.suppressActiveCellChangeOnEdit
        );
        this.setActiveCellInternal(
          this.getCellNode(cell.row, cell.cell),
          null,
          preClickModeOn,
          suppressActiveCellChangedEvent,
          e as DOMEvent<HTMLDivElement>
        );
      }
    }
  }

  protected handleContextMenu(e: Event & { target: HTMLElement }): void {
    // cancel context menu if we have an inline editor opened
    const cellElm = e.target.closest('.slick-cell');
    if (this.activeCellNode === cellElm && this.currentEditor !== null) {
      return;
    }

    // get the cell position or return {-1,-1} when opening from the grid but but not over a grid cell (e.g. empty dataset)
    const cell = this.getCellFromEvent(e) ?? { cell: -1, row: -1 };
    this.triggerEvent(this.onContextMenu, { row: cell.row, cell: cell.cell }, e);
  }

  protected handleDblClick(e: MouseEvent): void {
    const cell = this.getCellFromEvent(e);
    if (!cell || (this.currentEditor !== null && this.activeRow === cell.row && this.activeCell === cell.cell)) {
      return;
    }

    this.triggerEvent(this.onDblClick, { row: cell.row, cell: cell.cell }, e);
    if (e.defaultPrevented) {
      return;
    }

    if (this._options.editable) {
      this.gotoCell(cell.row, cell.cell, true, e);
    }
  }

  protected handleHeaderMouseEnter(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-header-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderMouseEnter, { column, grid: this }, e);
    }
  }

  protected handleHeaderMouseOver(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-header-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderMouseOver, { column, grid: this }, e);
    }
  }

  protected handleHeaderMouseLeave(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-header-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderMouseLeave, { column, grid: this }, e);
    }
  }

  protected handleHeaderMouseOut(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-header-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderMouseOut, { column, grid: this }, e);
    }
  }

  protected handleHeaderRowMouseEnter(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-headerrow-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderRowMouseEnter, { column, grid: this }, e);
    }
  }

  protected handleHeaderRowMouseOver(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-headerrow-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderRowMouseOver, { column, grid: this }, e);
    }
  }

  protected handleHeaderRowMouseLeave(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-headerrow-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderRowMouseLeave, { column, grid: this }, e);
    }
  }

  protected handleHeaderRowMouseOut(e: MouseEvent & { target: HTMLElement }): void {
    const column = Utils.storage.get(e.target.closest('.slick-headerrow-column'), 'column');
    if (column) {
      this.triggerEvent(this.onHeaderRowMouseOut, { column, grid: this }, e);
    }
  }

  protected handleHeaderContextMenu(e: MouseEvent & { target: HTMLElement }): void {
    const header = e.target.closest('.slick-header-column');
    const column = header && Utils.storage.get(header, 'column');
    this.triggerEvent(this.onHeaderContextMenu, { column }, e);
  }

  protected handleHeaderClick(e: MouseEvent & { target: HTMLElement }): void {
    if (!this.columnResizeDragging) {
      const header = e.target.closest('.slick-header-column');
      const column = header && Utils.storage.get(header, 'column');
      if (column) {
        this.triggerEvent(this.onHeaderClick, { column }, e);
      }
    }
  }

  protected handlePreHeaderContextMenu(e: MouseEvent & { target: HTMLElement }): void {
    this.triggerEvent(this.onPreHeaderContextMenu, { node: e.target }, e);
  }

  protected handlePreHeaderClick(e: MouseEvent & { target: HTMLElement }): void {
    if (!this.columnResizeDragging) {
      this.triggerEvent(this.onPreHeaderClick, { node: e.target }, e);
    }
  }

  protected handleFooterContextMenu(e: MouseEvent & { target: HTMLElement }): void {
    const footer = e.target.closest('.slick-footerrow-column');
    const column = footer && Utils.storage.get(footer, 'column');
    this.triggerEvent(this.onFooterContextMenu, { column }, e);
  }

  protected handleFooterClick(e: MouseEvent & { target: HTMLElement }): void {
    const footer = e.target.closest('.slick-footerrow-column');
    const column = footer && Utils.storage.get(footer, 'column');
    this.triggerEvent(this.onFooterClick, { column }, e);
  }

  protected handleCellMouseOver(e: MouseEvent & { target: HTMLElement }): void {
    this.triggerEvent(this.onMouseEnter, {}, e);
  }

  protected handleCellMouseOut(e: MouseEvent & { target: HTMLElement }): void {
    this.triggerEvent(this.onMouseLeave, {}, e);
  }

  protected cellExists(row: number, cell: number): boolean {
    return !(row < 0 || row >= this.getDataLength() || cell < 0 || cell >= this.columns.length);
  }

  protected stopFullBubbling(e: KeyboardEvent | MouseEvent | TouchEvent): void {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Returns row and cell indexes by providing x,y coordinates.
   * Coordinates are relative to the top left corner of the grid beginning with the first row (not including the column headers).
   * @param x An x coordinate.
   * @param y A y coordinate.
   */
  getCellFromPoint(x: number, y: number): { row: number; cell: number } {
    let row = this.getRowFromPosition(y);
    let cell = 0;

    let w = 0;
    for (let i = 0; i < this.columns.length && w <= x; i++) {
      if (this.columns[i] && !this.columns[i].hidden) {
        w += this.columns[i].width as number;
        cell = i + 1;
      }
    }
    cell -= 1;

    // we'll return -1 when coordinate falls outside the grid canvas
    if (row < -1) {
      row = -1;
    }

    return { row, cell };
  }

  protected getCellFromNode(cellNode: HTMLElement): number {
    // read column number from .l<columnNumber> CSS class
    const cls = /l\d+/.exec(cellNode.className);
    if (!cls) {
      throw new Error(`SlickGrid getCellFromNode: cannot get cell - ${cellNode.className}`);
    }
    return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
  }

  protected getRowFromNode(rowNode: HTMLElement | null | undefined): number | null {
    if (!rowNode) {
      return null;
    }
    rowNode = (rowNode.closest('.slick-row') as HTMLElement) || rowNode;
    for (const row in this.rowsCache) {
      if (this.rowsCache) {
        for (const i in this.rowsCache[row].rowNode) {
          if (this.rowsCache[row].rowNode?.[+i] === rowNode) {
            return row ? parseInt(row, 10) : 0;
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns row and cell indexes by providing a standard W3C event.
   * @param {*} event A standard W3C event.
   */
  getCellFromEvent(evt: Event | SlickEventData): { row: number; cell: number } | null {
    const e = evt instanceof SlickEventData ? evt.getNativeEvent() : evt;
    if (!e) {
      return null;
    }

    const cellNode = (e as Event & { target?: HTMLElement }).target?.closest('.slick-cell');
    if (!cellNode) {
      return null;
    }

    let row = this.getRowFromNode(cellNode.closest('.slick-row') as HTMLElement);

    const cell = this.getCellFromNode(cellNode as HTMLElement);

    if (!isDefinedNumber(row) || !isDefinedNumber(cell)) {
      return null;
    }
    return { row, cell };
  }

  /**
   * Returns an object representing information about a cell's position. All coordinates are absolute and take into consideration the visibility and scrolling position of all ancestors.
   * @param {Number} row - A row number.
   * @param {Number} cell - A column number.
   */
  getCellNodeBox(row: number, cell: number): { top: number; left: number; bottom: number; right: number } | null {
    if (!this.cellExists(row, cell)) {
      return null;
    }

    const rowDocking = this.dockingByRow.get(row);
    let y1 = this.getRowTop(row);
    if (rowDocking?.band === 'top') {
      y1 = this.scrollTop + rowDocking.offset;
    } else if (rowDocking?.band === 'bottom') {
      const viewportHeight = this._viewportScrollContainerY?.clientHeight || this.viewportH;
      y1 = this.scrollTop + viewportHeight - this.rowDockingLayout.bottomHeight + rowDocking.offset;
    }
    const y2 = y1 + this.getRowHeight(row) - 1;
    const columnDocking = this.dockingByColumn.get(cell);
    let x1 = this.dockingLayout.leftBaseWidth + (columnDocking?.offset || 0);
    if (columnDocking?.band === 'left') {
      x1 = this.scrollLeft + columnDocking.offset;
    } else if (columnDocking?.band === 'right') {
      x1 = this.scrollLeft + this.getViewportInnerWidth() - this.dockingLayout.rightWidth + columnDocking.offset;
    }
    const x2 = x1 + (this.columns[cell]?.width || 0);

    return {
      top: y1,
      left: x1,
      bottom: y2,
      right: x2,
    };
  }

  // Cell switching

  /** Resets active cell by making cell normal and other internal resets. */
  resetActiveCell(): void {
    this.setActiveCellInternal(null, false);
  }

  /** Clear active cell by making cell normal & removing "active" CSS class. */
  unsetActiveCell(): void {
    if (isDefined(this.activeCellNode)) {
      const activeRow = this.activeRow;
      const activeCell = this.getCellFromNode(this.activeCellNode);
      this.makeActiveCellNormal();
      this.activeCellNode.classList.remove('active');
      if (isDefinedNumber(activeRow)) {
        this.toggleCellSpanFragmentsActive(activeRow, activeCell, false);
      }
      this.rowsCache[this.activeRow]?.rowNode?.forEach((node) => node.classList.remove('active'));
    }
  }

  /**
   * Focus the grid.
   * Defaults to `cell`, which focuses the active cell (or first cell when no active cell exists).
   * @param mode - `cell` focuses active/first grid cell, `header` focuses first header menu/column entry point,
   * `internal` keeps legacy focus-sink behavior (primarily for internal/editor flows).
   */
  focus(mode: 'cell' | 'header' | 'internal' = 'cell'): void {
    if (mode === 'header') {
      this.focusHeaderMenuOrColumn(0);
      return;
    } else if (mode === 'cell') {
      this.focusGridCell();
      return;
    }
    this.setFocus();
  }

  protected setFocus(): void {
    if (this.tabbingDirection === -1) {
      this._focusSink.focus();
    } else {
      this._focusSink2.focus();
    }
  }

  /** Scroll to a specific cell and make it into the view */
  scrollCellIntoView(row: number, cell: number, doPaging?: boolean): void {
    this.scrollRowIntoView(row, doPaging);

    const docking = this.dockingByColumn.get(cell);
    const isPermanentPinnedColumn = docking && docking.band !== 'center' && !docking.sticky;
    // Permanent pins are already visible; sticky columns must reveal their
    // natural position before keyboard navigation activates them, regardless
    // of which edge currently owns the sticky column. Center columns retain
    // the existing scroll-into-view behavior.
    if (!isPermanentPinnedColumn && (docking?.sticky || docking?.band === 'center')) {
      const colspan = this.getColspan(row, cell);
      const lastCell = cell + (colspan > 1 ? colspan - 1 : 0);
      const { left, right } = this.getNaturalColumnRange(cell, lastCell);
      this.internalScrollColumnIntoView(left, right);
    }
  }

  /** Return natural column coordinates for keyboard scrolling. */
  protected getNaturalColumnRange(firstCell: number, lastCell: number = firstCell): { left: number; right: number } {
    const first = this.dockingByColumn.get(firstCell);
    const last = this.dockingByColumn.get(lastCell);
    // Docking offsets for center columns are relative to the center band,
    // whereas internalScrollColumnIntoView() compares full-grid coordinates
    // that include the permanent left-pinned band.
    const leftBaseWidth = this.dockingLayout.leftBaseWidth;
    return {
      left: leftBaseWidth + (first?.naturalOffset ?? this.columnPosLeft[firstCell] ?? 0),
      right: leftBaseWidth + (last ? last.naturalOffset + last.width : (this.columnPosRight[lastCell] ?? 0)),
    };
  }

  protected internalScrollColumnIntoView(left: number, right: number): void {
    const usesDynamicDockingBounds = this.hasDockedColumns();
    const leftDockedWidth = usesDynamicDockingBounds ? this.dockingLayout.leftWidth : this.dockingLayout.leftBaseWidth;
    const rightDockedWidth = usesDynamicDockingBounds ? this.dockingLayout.rightWidth : this.dockingLayout.rightBaseWidth;
    const viewportWidth = Utils.width(this._viewportScrollContainerX) as number;
    const availableWidth = Math.max(
      0,
      viewportWidth - leftDockedWidth - rightDockedWidth - (this.viewportHasVScroll ? this.scrollbarDimensions?.width || 0 : 0)
    );
    const visibleStart = this.scrollLeft + leftDockedWidth;
    const scrollRight = this.scrollLeft + leftDockedWidth + availableWidth;

    if (left < visibleStart) {
      this._viewportScrollContainerX.scrollLeft = Math.max(0, left - leftDockedWidth);
      this.handleScroll();
      this.render();
    } else if (right > scrollRight) {
      this._viewportScrollContainerX.scrollLeft = Math.max(0, Math.min(left, right - availableWidth - leftDockedWidth));
      this.handleScroll();
      this.render();
    }
  }

  /**
   * Scroll to a specific column and show it into the viewport
   * @param {Number} cell - cell column number
   */
  scrollColumnIntoView(cell: number): void {
    if (this.getColumnDockingBand(cell) === 'center') {
      const { left, right } = this.getNaturalColumnRange(cell);
      this.internalScrollColumnIntoView(left, right);
    }
  }

  protected setActiveCellInternal(
    newCell: HTMLDivElement | null,
    opt_editMode?: boolean | null,
    preClickModeOn?: boolean | null,
    suppressActiveCellChangedEvent?: boolean,
    e?: Event | SlickEvent
  ): void {
    // make current active cell as normal cell & remove "active" CSS classes
    this.unsetActiveCell();

    // let activeCellChanged = (this.activeCellNode !== newCell);
    this.activeCellNode = newCell;

    if (isDefined(this.activeCellNode)) {
      const rowNode = this.activeCellNode.closest('.slick-row') as HTMLElement | null;
      const rowFromDockedNode = rowNode?.dataset.row !== undefined ? Number(rowNode.dataset.row) : NaN;
      const isDockedRow = Number.isInteger(rowFromDockedNode) && this.dockingByRow.has(rowFromDockedNode);

      if (isDockedRow) {
        // Pinned rows live in the docking overlay rather than a grid-canvas.
        // Resolve their coordinates from the row's data attribute instead of
        // measuring a missing canvas ancestor (which made their editors fail).
        this.activeRow = this.activePosY = rowFromDockedNode;
        this.activeCell = this.activePosX = this.getCellFromNode(this.activeCellNode);
      } else {
        const activeCellOffset = getOffset(this.activeCellNode);
        let rowOffset = Math.floor(getOffset(Utils.parents(this.activeCellNode, '.grid-canvas')[0] as HTMLElement).top);
        const cell = this.getCellFromPoint(activeCellOffset.left, Math.ceil(activeCellOffset.top) - rowOffset);
        this.activeRow = this.activePosY = cell.row;
        this.activeCell = this.activePosX = this.getCellFromNode(this.activeCellNode);
      }

      if (!isDefined(opt_editMode) && this._options.autoEditNewRow) {
        opt_editMode = this.activeRow === this.getDataLength() || this._options.autoEdit;
      }

      if (this._options.showCellSelection) {
        // make sure to never activate more than 1 cell at a time
        // v8 ignore next
        document.querySelectorAll('.slick-cell.active').forEach((node) => node.classList.remove('active'));
        this.activeCellNode.classList.add('active');
        if (isDefinedNumber(this.activeRow) && isDefinedNumber(this.activeCell)) {
          this.toggleCellSpanFragmentsActive(this.activeRow, this.activeCell, true);
        }
        this.rowsCache[this.activeRow]?.rowNode?.forEach((node) => node.classList.add('active'));
      }

      if (opt_editMode && this.isCellEditable(this.activeRow, this.activeCell)) {
        if (this._options.asyncEditorLoading) {
          clearTimeout(this.h_editorLoader);
          this.h_editorLoader = setTimeout(() => {
            this.makeActiveCellEditable(undefined, preClickModeOn, e);
          }, this._options.asyncEditorLoadDelay);
        } else {
          this.makeActiveCellEditable(undefined, preClickModeOn, e);
        }
      }
    } else {
      this.activeRow = this.activeCell = null as any;
    }

    // this optimisation causes trouble - MLeibman #329
    // if (activeCellChanged) {
    if (!suppressActiveCellChangedEvent) {
      this.triggerEvent<OnActiveCellChangedEventArgs | null>(
        this.onActiveCellChanged,
        this.getActiveCell() as OnActiveCellChangedEventArgs
      );
    }
    // }
  }

  /** Check if cell is editable and check if grid is also editable */
  protected isCellEditable(row: number, cell: number): boolean {
    return !!(this._options.editable && this.isCellPotentiallyEditable(row, cell));
  }

  /** Check if cell is potentially editable but without validating that the grid is editable */
  protected isCellPotentiallyEditable(row: number, cell: number): boolean {
    const dataLength = this.getDataLength();
    // is the data for this row actually loaded?
    if (row < dataLength && !this.getDataItem(row)) {
      return false;
    }

    // are we in the Add New row? Can we actually and allowed to create new one from this cell?
    if (this.columns[cell].cannotTriggerInsert && row >= dataLength) {
      return false;
    }

    // does this cell have an editor?
    if (!this.columns[cell] || this.columns[cell].hidden || !this.getEditor(row, cell)) {
      return false;
    }

    return true;
  }

  /**
   * Make the cell normal again (for example after destroying cell editor),
   * we can also optionally refocus on the current active cell (again possibly after closing cell editor)
   * @param {Boolean} [refocusActiveCell]
   */
  protected makeActiveCellNormal(refocusActiveCell = false): void {
    if (this.currentEditor) {
      this.triggerEvent(this.onBeforeCellEditorDestroy, { editor: this.currentEditor });
      this.currentEditor.destroy();
      this.currentEditor = null;

      if (this.activeCellNode) {
        const d = this.getDataItem(this.activeRow);
        this.activeCellNode.classList.remove('editable', 'invalid');
        if (d) {
          const column = this.columns[this.activeCell];
          const formatter = this.getFormatter(this.activeRow, column);
          const formatterResult = formatter(
            this.activeRow,
            this.activeCell,
            this.getDataItemValueForColumn(d, column),
            column,
            d,
            this as unknown as SlickGrid
          );
          this.applyFormatResultToCellNode(formatterResult, this.activeCellNode);
          this.invalidatePostProcessingResults(this.activeRow);
        }
        if (refocusActiveCell) {
          this.setFocus();
        }
      }

      this.getEditorLock()?.deactivate(this.editController as EditController);
    }
  }

  editActiveCell(editor?: Editor | EditorConstructor, preClickModeOn?: boolean | null, e?: Event): void {
    this.makeActiveCellEditable(editor, preClickModeOn, e);
  }

  protected makeActiveCellEditable(editor?: Editor | EditorConstructor, preClickModeOn?: boolean | null, e?: Event | SlickEvent): void {
    if (!this.activeCellNode) {
      return;
    }
    if (!this._options.editable) {
      throw new Error('SlickGrid makeActiveCellEditable : should never get called when grid options.editable is false');
    }

    // cancel pending async call if there is one
    clearTimeout(this.h_editorLoader);

    if (!this.isCellPotentiallyEditable(this.activeRow, this.activeCell)) {
      return;
    }

    const columnDef = this.columns[this.activeCell];
    const item = this.getDataItem(this.activeRow);

    if (
      this.triggerEvent(this.onBeforeEditCell, {
        row: this.activeRow,
        cell: this.activeCell,
        item,
        column: columnDef,
        target: 'grid',
      }).getReturnValue() === false
    ) {
      this.setFocus();
      return;
    }

    this.getEditorLock()?.activate(this.editController as EditController);
    this.activeCellNode.classList.add('editable');

    const useEditor = editor || this.getEditor(this.activeRow, this.activeCell);

    // editor was null and columnMetadata and editorFactory returned null or undefined
    // the editor must be constructable. Also makes sure that useEditor is of type EditorConstructor
    if (typeof useEditor === 'function') {
      // don't clear the cell if a custom editor is passed through
      if (!editor && !useEditor.suppressClearOnEdit) {
        emptyElement(this.activeCellNode);
      }

      let metadata = this.getItemMetadaWhenExists(this.activeRow);
      metadata = metadata?.columns as any;
      const columnMetaData = metadata && (metadata[columnDef.id as keyof ItemMetadata] || (metadata as any)[this.activeCell]);

      const editorArgs: EditorArguments = {
        grid: this as any,
        gridPosition: this.absBox(this._container),
        position: this.absBox(this.activeCellNode),
        container: this.activeCellNode,
        column: columnDef,
        columnMetaData,
        item: item || {},
        isCompositeEditor: false,
        event: e as Event,
        commitChanges: this.commitEditAndSetFocus.bind(this),
        cancelChanges: this.cancelEditAndSetFocus.bind(this),
      };
      this.currentEditor = new useEditor(editorArgs);

      if (item && this.currentEditor) {
        this.currentEditor.loadValue(item);
        if (preClickModeOn && typeof this.currentEditor?.preClick === 'function') {
          this.currentEditor.preClick();
        }
      }

      this.serializedEditorValue = this.currentEditor?.serializeValue();

      if (this.currentEditor?.position) {
        this.handleActiveCellPositionChange();
      }
    }
  }

  protected commitEditAndSetFocus(navigateCellDown = true): void {
    // if the commit fails, it would do so due to a validation error
    // if so, do not steal the focus from the editor
    if (this.getEditorLock()?.commitCurrentEdit()) {
      this.setFocus();
      if (this._options.autoEdit && !this._options.autoCommitEdit && navigateCellDown) {
        this.navigateDown();
      }
    }
  }

  protected cancelEditAndSetFocus(): void {
    if (this.getEditorLock()?.cancelCurrentEdit()) {
      this.setFocus();
    }
  }

  /**
   * Computes the absolute position of an element relative to the document,
   * taking into account offsets, scrolling, and visibility within scrollable containers.
   */
  protected absBox(elem: HTMLElement): ElementPosition {
    const rect = elem.getBoundingClientRect();
    const box = {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      visible: true,
    };
    if (rect.bottom === 0 && rect.top === 0) {
      return box; // assume element is visible when we can't determine it's position & size
    }

    // then calculation position relative to the grid container (assume container exists and is the grid root)
    const gridRect = this._container?.getBoundingClientRect() || { top: 0, left: 0, bottom: 0, right: 0 };
    box.top = rect.top - gridRect.top;
    box.left = rect.left - gridRect.left;
    box.bottom = rect.bottom - gridRect.top;
    box.right = rect.right - gridRect.left;

    // Check if the element is visible within the grid viewport
    if (
      box.bottom < 0 ||
      box.top > (this._container?.clientHeight ?? window.innerHeight) ||
      box.right < 0 ||
      box.left > (this._container?.clientWidth ?? window.innerWidth)
    ) {
      box.visible = false;
    }
    return box;
  }

  /** Returns an object representing information about the active cell's position. All coordinates are absolute and take into consideration the visibility and scrolling position of all ancestors. */
  getActiveCellPosition(): ElementPosition {
    return this.absBox(this.activeCellNode as HTMLElement);
  }

  /** Get the Grid Position */
  getGridPosition(): ElementPosition {
    return this.absBox(this._container);
  }

  /** Returns the active cell editor. If there is no actively edited cell, null is returned.   */
  getCellEditor(): Editor | null {
    return this.currentEditor;
  }

  /**
   * Returns an object representing the coordinates of the currently active cell:
   * @example	`{ row: activeRow, cell: activeCell }`
   */
  getActiveCell(): { row: number; cell: number } | null {
    if (this.activeCellNode) {
      return { row: this.activeRow, cell: this.activeCell };
    }
    return null;
  }

  /** Returns the DOM element containing the currently active cell. If no cell is active, null is returned. */
  getActiveCellNode(): HTMLDivElement | null {
    return this.activeCellNode;
  }

  // This get/set methods are used for keeping text-selection. These don't consider IE because they don't loose text-selection.
  // Fix for firefox selection. See https://github.com/mleibman/SlickGrid/pull/746/files
  protected getTextSelection(): Range | null {
    let textSelection: Range | null = null;
    if (window.getSelection) {
      const selection = window.getSelection();
      if ((selection?.rangeCount || 0) > 0) {
        textSelection = selection!.getRangeAt(0);
      }
    }
    return textSelection;
  }

  protected setTextSelection(selection: Range): void {
    if (window.getSelection && selection) {
      const target = window.getSelection();
      if (target) {
        target.removeAllRanges();
        target.addRange(selection);
      }
    }
  }

  /**
   * Scroll to a specific row and make it into the view
   * @param {Number} row - grid row number
   * @param {Boolean} doPaging - scroll when pagination is enabled
   */
  scrollRowIntoView(row: number, doPaging?: boolean): void {
    const dockingBand = this.dockingByRow.get(row)?.band;
    if (!this.isPinnedRowIdx(row) && (dockingBand === undefined || dockingBand === 'center')) {
      // Use the remaining center-band height so top-pinned rows do not make
      // range-selector auto-scroll stall at scrollTop 0.
      const viewportScrollH = Math.max(
        0,
        (Utils.height(this._viewportScrollContainerY) as number) - this.rowDockingLayout.topHeight - this.rowDockingLayout.bottomHeight
      );

      const rowAtTop = this.getRowPosition(row) - this.rowDockingLayout.topHeight;
      const rowBottomPosition = rowAtTop + this.getRowHeight(row);
      const rowAtBottom = rowBottomPosition - viewportScrollH + (this.viewportHasHScroll ? this.scrollbarDimensions?.height || 0 : 0);

      // need to page down?
      if (rowBottomPosition > this.scrollTop + viewportScrollH + this.offset) {
        this.scrollTo(doPaging ? rowAtTop : rowAtBottom);
        this.render();
      }
      // or page up?
      else if (rowAtTop < this.scrollTop + this.offset) {
        this.scrollTo(doPaging ? rowAtBottom : rowAtTop);
        this.render();
      }
    }
  }

  /**
   * Scroll to the top row and make it into the view
   * @param {Number} row - grid row number
   */
  scrollRowToTop(row: number): void {
    const rowAtTop = this.getRowPosition(row) - this.getTopPinnedRowsHeight();
    this.scrollTo(rowAtTop);
    this.render();
  }

  protected scrollPage(dir: number): void {
    const deltaRows = dir * this.numVisibleRows;
    /// First fully visible row crosses the line with
    /// y === bottomOfTopmostFullyVisibleRow
    const bottomOfTopmostFullyVisibleRow = this.scrollTop + this.getRowHeight() - 1;
    this.scrollTo(this.getRowPosition(this.getRowFromPosition(bottomOfTopmostFullyVisibleRow) + deltaRows));
    this.render();

    if (this._options.enableCellNavigation && isDefined(this.activeRow)) {
      let row = this.activeRow + deltaRows;
      const dataLengthIncludingAddNew = this.getDataLengthIncludingAddNew();
      if (row >= dataLengthIncludingAddNew) {
        row = dataLengthIncludingAddNew - 1;
      }
      if (row < 0) {
        row = 0;
      }

      // use the gotoDown/Up but cancel its row move to activate same row
      // (i.e.: gotoDown(row - 1) will go to same row if it can be activated or next one down).
      // We do this in order to find the next cell that can be activated which can be much further away (i.e. rowspan)
      const pos =
        dir === 1
          ? this.gotoDown(row - 1 || 0, this.activeCell, this.activePosY, this.activePosX)
          : this.gotoUp(row + 1, this.activeCell, this.activePosY, this.activePosX);
      this.navigateToPos(pos);
    }
  }

  /** Navigate (scroll) by a page down */
  navigatePageDown(): void {
    this.unsetActiveCell();
    this.scrollPage(1);
  }

  /** Navigate (scroll) by a page up */
  navigatePageUp(): void {
    this.unsetActiveCell();
    this.scrollPage(-1);
  }

  /** Navigate to the top of the grid */
  navigateTop(): void {
    this.unsetActiveCell();
    this.navigateToRow(0);
  }

  /** Navigate to the bottom of the grid */
  navigateBottom(): void {
    const row = this.getDataLength() - 1;
    let tmpRow = this.getParentRowSpanByCell(row, this.activeCell)?.start ?? row;

    do {
      if (this._options.enableCellRowSpan) {
        this.setActiveRow(tmpRow);
      }
      const isValidMode = this.navigateToRow(tmpRow);
      if ((isValidMode && this.activeCell === this.activePosX) || !isDefined(this.activeCell)) {
        break;
      }
    } while (--tmpRow > 0);
  }

  navigateToRow(row: number): boolean {
    const num_rows = this.getDataLength();
    if (!num_rows) {
      return false;
    }

    /* v8 ignore next */
    if (row < 0) {
      row = 0;
    } else if (row >= num_rows) {
      row = num_rows - 1;
    }

    this.scrollCellIntoView(row, 0, true);
    let isValidMove = !isDefined(this.activeCell) || !isDefined(this.activeRow);

    if (this._options.enableCellNavigation && isDefined(this.activeRow)) {
      let cell = 0;
      let prevCell: number | null = null;
      const prevActivePosX = this.activePosX;
      while (cell <= this.activePosX) {
        if (this.canCellBeActive(row, cell)) {
          prevCell = cell;
          if (!isDefined(this.activeCell) || cell === this.activeCell) {
            isValidMove = true;
          }
        }
        cell += this.getColspan(row, cell);
      }

      if (prevCell !== null) {
        this.setActiveCellInternal(this.getCellNode(row, prevCell));
        this.activePosX = prevActivePosX;
      } else {
        this.resetActiveCell();
      }
    }
    return isValidMove;
  }

  protected getColspan(row: number, cell: number): number {
    const metadata = this.getItemMetadaWhenExists(row);
    if (!metadata || !metadata.columns || this.columns[cell]?.hidden) {
      return 1;
    }

    if (cell >= this.columns.length) {
      cell = this.columns.length - 1;
    }
    let isFullColspan = false;
    const columnData = metadata.columns[this.columns[cell].id] || metadata.columns[cell];
    let colspan = columnData?.colspan;
    if (colspan === '*') {
      isFullColspan = true;
      colspan = this.columns.length - cell;
    } else {
      colspan = colspan || 1;
    }

    if (!isFullColspan && this._options.spreadHiddenColspan) {
      return this.increaseHiddenColspan(colspan as number, cell);
    }

    return colspan as number;
  }

  protected getRowspan(row: number, cell: number): number {
    let rowspan = 1;
    const metadata = this.getItemMetadaWhenExists(row);
    if (metadata?.columns) {
      Object.keys(metadata.columns).forEach((col) => {
        const colIdx = Number(col);
        if (colIdx === cell) {
          const columnMeta = metadata.columns![colIdx];
          rowspan = Number(columnMeta?.rowspan || 1);
        }
      });
    }
    return rowspan;
  }

  protected findFocusableRow(row: number, cell: number, dir: 'up' | 'down'): number {
    let r = row;
    const rowRange = this._colsWithRowSpanCache[cell] || new Set<string>();
    let found = false;

    Array.from(rowRange).forEach((rrange) => {
      const [start, end] = rrange.split(':').map(Number);
      if (!found && row >= start && row <= end) {
        r = dir === 'up' ? start : end;
        if (this.canCellBeActive(r, cell)) {
          found = true;
        }
      }
    });

    return r;
  }

  protected findFirstFocusableCell(row: number): { cell: number; row: number } {
    let cell = 0;
    let focusableRow = row;
    let ff = -1;

    while (cell < this.columns.length) {
      const prs = this.getParentRowSpanByCell(row, cell);
      focusableRow = prs !== null && prs.start !== row ? prs.start : row;
      if (this.canCellBeActive(focusableRow, cell)) {
        ff = cell;
        break;
      }
      cell += this.getColspan(focusableRow, cell);
    }
    return { cell: ff, row: focusableRow };
  }

  protected findLastFocusableCell(row: number): { cell: number; row: number } {
    let cell = 0;
    let focusableRow = row;
    let lf = -1;

    while (cell < this.columns.length) {
      const prs = this.getParentRowSpanByCell(row, cell);
      focusableRow = prs !== null && prs.start !== row ? prs.start : row;
      if (this.canCellBeActive(focusableRow, cell)) {
        lf = cell;
      }
      cell += this.getColspan(focusableRow, cell);
    }

    return { cell: lf, row: focusableRow };
  }

  /**
   * From any row/cell indexes that might have colspan/rowspan, find its starting indexes
   * For example, if we start at 0,0 and we have colspan/rowspan of 4 for both and our indexes is row:2,cell:3
   * then our starting row/cell is 0,0. If a cell has no spanning at all then row/cell output is same as input
   */
  findSpanStartingCell(
    row: number,
    cell: number
  ): {
    cell: number;
    row: number;
  } {
    cell = this.findNextAvailableColumnCell(cell);
    const prs = this.getParentRowSpanByCell(row, cell);
    const focusableRow = prs !== null && prs.start !== row ? prs.start : row;
    let fc = 0;
    let prevCell = 0;

    while (fc < this.columns.length) {
      fc += this.getColspan(focusableRow, fc);
      if (fc > cell) {
        fc = prevCell;
        return { cell: fc, row: focusableRow };
      }
      prevCell = fc;
    }

    return { cell: fc, row: focusableRow };
  }

  protected gotoRight(
    _row: number,
    cell: number,
    posY: number,
    _posX?: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    if (cell < this.columns.length) {
      let fc = cell + 1;
      let fr = posY;

      do {
        const sc = this.findSpanStartingCell(posY, fc);
        fr = sc.row;
        fc = this.findNextAvailableColumnCell(sc.cell);
        if (this.canCellBeActive(fr, fc) && fc > cell) {
          break;
        }
        fc += this.getColspan(fr, sc.cell);
      } while (fc < this.columns.length);

      if (fc < this.columns.length) {
        return {
          row: fr,
          cell: fc,
          posX: fc,
          posY,
        };
      }
    }
    return null;
  }

  protected gotoLeft(
    row: number,
    cell: number,
    posY: number,
    _posX?: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    const ff = this.findFirstFocusableCell(row);
    if (cell <= 0 || ff.cell >= cell) {
      return null;
    }

    let pos: CellPosition | null;
    let prev = {
      row,
      cell: ff.cell,
      posX: ff.cell,
      posY,
    };

    while (true) {
      pos = this.gotoRight(prev.row, prev.cell, prev.posY, prev.posX);
      if (!pos) {
        return null;
      }
      if (pos.cell >= cell) {
        // when right cell is within a rowspan, we need to use original row (posY)
        const nextRow = this.findFocusableRow(posY, prev.cell, 'up');
        /* v8 ignore if */
        if (nextRow !== prev.row) {
          prev.row = nextRow;
        }
        return prev;
      }
      prev = pos;
    }
  }

  protected gotoDown(
    row: number,
    cell: number,
    _posY: number,
    posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    let prevCell;
    const ub = this.getDataLengthIncludingAddNew();
    do {
      row += this.getRowspan(row, posX);
      prevCell = cell = 0;
      while (cell <= posX) {
        prevCell = this.findNextAvailableColumnCell(cell);
        cell += this.getColspan(row, cell);
      }
    } while (row <= ub && !this.canCellBeActive(row, prevCell));

    if (row <= ub) {
      return {
        row,
        cell: prevCell,
        posX,
        posY: row,
      };
    }
    return null;
  }

  protected gotoUp(
    row: number,
    cell: number,
    _posY: number,
    posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    let prevCell;
    if (row > 0) {
      do {
        row = this.findFocusableRow(row - 1, posX, 'up');
        prevCell = cell = 0;
        while (cell <= posX) {
          prevCell = this.findNextAvailableColumnCell(cell);
          cell += this.getColspan(row, cell);
        }
      } while (row >= 0 && !this.canCellBeActive(row, prevCell));

      if (cell <= this.columns.length) {
        return {
          row,
          cell: prevCell,
          posX,
          posY: row,
        };
      }
    }
    return null;
  }

  protected gotoNext(
    row: number,
    cell: number,
    posY: number,
    posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    if (!isDefinedNumber(row) && !isDefinedNumber(cell)) {
      row = cell = posY = posX = 0;
      if (this.canCellBeActive(row, cell)) {
        return {
          row,
          cell,
          posX: cell,
          posY,
        };
      }
    }

    let pos = this.gotoRight(row, cell, posY, posX);
    if (!pos) {
      let ff;
      while (!pos && ++posY < this.getDataLength() + (this._options.enableAddRow ? 1 : 0)) {
        ff = this.findFirstFocusableCell(posY);
        row = this.getParentRowSpanByCell(posY, ff.cell)?.start ?? posY;
        pos = {
          row,
          cell: ff.cell,
          posX: ff.cell,
          posY,
        };
      }
    }
    return pos;
  }

  protected gotoPrev(
    row: number,
    cell: number,
    posY: number,
    posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    if (!isDefinedNumber(row) && !isDefinedNumber(cell)) {
      row = posY = this.getDataLengthIncludingAddNew() - 1;
      cell = posX = this.columns.length - 1;
      if (this.canCellBeActive(row, cell)) {
        return {
          row,
          cell,
          posX: cell,
          posY,
        };
      }
    }

    let pos = this.gotoLeft(row, cell, posY, posX);
    if (!pos) {
      let lf;
      while (!pos && --posY >= 0) {
        lf = this.findLastFocusableCell(posY);
        if (lf.cell > -1) {
          row = this.getParentRowSpanByCell(posY, lf.cell)?.start ?? posY;
          pos = {
            row,
            cell: lf.cell,
            posX: lf.cell,
            posY,
          };
        }
      }
    }
    return pos;
  }

  protected gotoRowStart(
    row: number,
    _cell: number,
    _posY: number,
    _posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    const ff = this.findFirstFocusableCell(row);
    return {
      row: ff.row,
      cell: ff.cell,
      posX: ff.cell,
      posY: row,
    };
  }

  protected gotoRowEnd(
    row: number,
    _cell: number,
    _posY: number,
    _posX: number
  ): { row: number; cell: number; posX: number; posY: number } | null {
    const lf = this.findLastFocusableCell(row);
    if (lf.cell === -1) {
      return null;
    }

    return {
      row: lf.row,
      cell: lf.cell,
      posX: lf.cell,
      posY: row,
    };
  }

  /** find the next available column to the right */
  protected findNextAvailableColumnCell(cell: number): number {
    let availableCell = cell;
    if (this.columns[availableCell]) {
      while (this.columns[availableCell].hidden || availableCell > this.columns.length) {
        availableCell++;
      }
    }
    return availableCell;
  }

  // when dealing with colspan, we'll count hidden columns and increase colspan when that happens
  protected increaseHiddenColspan(colspan: number, cell: number): number {
    if (colspan > 1) {
      let hiddenCount = 0;
      for (let k = cell; k < cell + colspan; k++) {
        if (this.columns[k]?.hidden) {
          hiddenCount++;
        }
      }
      // increase colspan when hidden column(s) found
      if (hiddenCount > 0) {
        colspan = colspan + hiddenCount;
      }
    }
    return colspan;
  }

  /** Switches the active cell one cell right skipping unselectable cells. Unline navigateNext, navigateRight stops at the last cell of the row. Returns a boolean saying whether it was able to complete or not. */
  navigateRight(): boolean | undefined {
    return this.navigate('right');
  }

  /** Switches the active cell one cell left skipping unselectable cells. Unline navigatePrev, navigateLeft stops at the first cell of the row. Returns a boolean saying whether it was able to complete or not. */
  navigateLeft(): boolean | undefined {
    return this.navigate('left');
  }

  /** Switches the active cell one row down skipping unselectable cells. Returns a boolean saying whether it was able to complete or not. */
  navigateDown(): boolean | undefined {
    return this.navigate('down');
  }

  /** Switches the active cell one row up skipping unselectable cells. Returns a boolean saying whether it was able to complete or not. */
  navigateUp(): boolean | undefined {
    return this.navigate('up');
  }

  /** Tabs over active cell to the next selectable cell. Returns a boolean saying whether it was able to complete or not. */
  navigateNext(): boolean | undefined {
    return this.navigate('next');
  }

  /** Tabs over active cell to the previous selectable cell. Returns a boolean saying whether it was able to complete or not. */
  navigatePrev(): boolean | undefined {
    return this.navigate('prev');
  }

  /** Navigate to the start row in the grid */
  navigateRowStart(): boolean | undefined {
    return this.navigate('home');
  }

  /** Navigate to the end row in the grid */
  navigateRowEnd(): boolean | undefined {
    return this.navigate('end');
  }

  /** Navigate to coordinate 0,0 (top left home) */
  navigateTopStart(): boolean | undefined {
    this.unsetActiveCell();
    this.navigateToRow(0);
    return this.navigate('home');
  }

  /** Navigate to bottom row end (bottom right end) */
  navigateBottomEnd(): boolean | undefined {
    this.navigateBottom();
    return this.navigate('end');
  }

  /**
   * @param {string} dir Navigation direction.
   * @return {boolean} Whether navigation resulted in a change of active cell.
   */
  protected navigate(dir: 'up' | 'down' | 'left' | 'right' | 'prev' | 'next' | 'home' | 'end'): boolean | undefined {
    if (!this._options.enableCellNavigation) {
      return false;
    }

    if (!this.activeCellNode && dir !== 'prev' && dir !== 'next') {
      return false;
    }

    if (!this.getEditorLock()?.commitCurrentEdit()) {
      return true;
    }
    this.setFocus();
    this.unsetActiveCell();

    const tabbingDirections = {
      up: -1,
      down: 1,
      left: -1,
      right: 1,
      prev: -1,
      next: 1,
      home: -1,
      end: 1,
    };
    this.tabbingDirection = tabbingDirections[dir];

    const stepFunctions = {
      up: this.gotoUp,
      down: this.gotoDown,
      left: this.gotoLeft,
      right: this.gotoRight,
      prev: this.gotoPrev,
      next: this.gotoNext,
      home: this.gotoRowStart,
      end: this.gotoRowEnd,
    };
    const stepFn = stepFunctions[dir];
    const pos = stepFn.call(this, this.activeRow, this.activeCell, this.activePosY, this.activePosX);
    return this.navigateToPos(pos);
  }

  protected navigateToPos(pos: CellPosition | null): boolean | undefined {
    if (pos) {
      const isAddNewRow = pos.row === this.getDataLength();

      if (!this.isPinnedRowIdx(pos.row)) {
        this.scrollCellIntoView(pos.row, pos.cell, !isAddNewRow && this._options.emulatePagingWhenScrolling);
      }
      this.setActiveCellInternal(this.getCellNode(pos.row, pos.cell));
      this.activePosX = pos.posX;
      this.activePosY = pos.posY;
      return true;
    } else {
      this.setActiveCellInternal(this.getCellNode(this.activeRow, this.activeCell));
      return false;
    }
  }

  /**
   * Returns a DOM element containing a cell at a given row and cell.
   * @param row A row index.
   * @param cell A column index.
   */
  getCellNode(row: number, cell: number): HTMLDivElement | null {
    if (this.rowsCache[row]) {
      this.ensureCellNodesInRowsCache(row);
      try {
        if (this.rowsCache[row].cellNodesByColumnIdx.length > cell) {
          return this.rowsCache[row].cellNodesByColumnIdx[cell] as HTMLDivElement | null;
        }
        return null;
      } /* v8 ignore next */ catch {
        return this.rowsCache[row].cellNodesByColumnIdx[cell] as HTMLDivElement | null;
      }
    }
    return null;
  }

  /**
   * Sets an active cell.
   * @param {number} row - A row index.
   * @param {number} cell - A column index.
   * @param {boolean} [optionEditMode] Option Edit Mode is Auto-Edit?
   * @param {boolean} [preClickModeOn] Pre-Click Mode is Enabled?
   * @param {boolean} [suppressActiveCellChangedEvent] Are we suppressing Active Cell Changed Event (defaults to false)
   */
  setActiveCell(
    row: number,
    cell: number,
    opt_editMode?: boolean,
    preClickModeOn?: boolean,
    suppressActiveCellChangedEvent?: boolean
  ): void {
    if (
      !this.initialized ||
      !this._options.enableCellNavigation ||
      row > this.getDataLength() ||
      row < 0 ||
      cell >= this.columns.length ||
      cell < 0
    ) {
      return;
    }

    this.scrollCellIntoView(row, cell, false);
    this.setActiveCellInternal(this.getCellNode(row, cell), opt_editMode, preClickModeOn, suppressActiveCellChangedEvent);
  }

  /**
   * Sets an active cell.
   * @param {number} row - A row index.
   * @param {number} cell - A column index.
   * @param {boolean} [suppressScrollIntoView] - optionally suppress the ScrollIntoView that happens by default (defaults to false)
   */
  setActiveRow(row: number, cell?: number, suppressScrollIntoView?: boolean): void {
    cell ??= 0;

    if (!this.initialized || row > this.getDataLength() || row < 0 || cell >= this.columns.length || cell < 0) {
      return;
    }

    this.activeRow = row;
    if (!suppressScrollIntoView) {
      this.scrollCellIntoView(row, cell, false);
    }
  }

  /**
   * Returns true if you can click on a given cell and make it the active focus.
   * @param {number} row A row index.
   * @param {number} col A column index.
   */
  canCellBeActive(row: number, cell: number): boolean {
    if (
      !this._options.enableCellNavigation ||
      row >= this.getDataLengthIncludingAddNew() ||
      row < 0 ||
      cell >= this.columns.length ||
      cell < 0
    ) {
      return false;
    }

    if (!this.columns[cell] || this.columns[cell].hidden) {
      return false;
    }

    // cell not found in rows that are spanned (rowspan of 1 or more) are invalid
    // i.e.: if the 5th cell has rowspan that reaches the end of the grid, then the last cell that can be active is 5 (anything above 5 on same column is invalid)
    const spanRow = this.getParentRowSpanByCell(row, cell)?.start ?? row;
    if (spanRow !== row) {
      return false;
    }

    const rowMetadata = this.getItemMetadaWhenExists(row);
    if (rowMetadata?.focusable !== undefined) {
      return !!rowMetadata.focusable;
    }

    const columnMetadata = rowMetadata?.columns;
    if (columnMetadata?.[this.columns[cell].id]?.focusable !== undefined) {
      return !!columnMetadata[this.columns[cell].id].focusable;
    }
    if (columnMetadata?.[cell]?.focusable !== undefined) {
      return !!columnMetadata[cell].focusable;
    }

    return !!this.columns[cell].focusable;
  }

  /**
   * Returns true if selecting the row causes this particular cell to have the selectedCellCssClass applied to it. A cell can be selected if it exists and if it isn't on an empty / "Add New" row and if it is not marked as "unselectable" in the column definition.
   * @param {number} row A row index.
   * @param {number} col A column index.
   */
  canCellBeSelected(row: number, cell: number): boolean {
    if (row >= this.getDataLength() || row < 0 || cell >= this.columns.length || cell < 0) {
      return false;
    }

    if (!this.columns[cell] || this.columns[cell].hidden) {
      return false;
    }

    const rowMetadata = this.getItemMetadaWhenExists(row);
    if (rowMetadata?.selectable !== undefined) {
      return !!rowMetadata.selectable;
    }

    const columnMetadata = rowMetadata?.columns && (rowMetadata.columns[this.columns[cell].id] || rowMetadata.columns[cell]);
    if (columnMetadata?.selectable !== undefined) {
      return !!columnMetadata.selectable;
    }

    return !!this.columns[cell].selectable;
  }

  /**
   * Accepts a row integer and a cell integer, scrolling the view to the row where row is its row index, and cell is its cell index. Optionally accepts a forceEdit boolean which, if true, will attempt to initiate the edit dialogue for the field in the specified cell.
   * Unlike setActiveCell, this scrolls the row into the viewport and sets the keyboard focus.
   * @param {Number} row A row index.
   * @param {Number} cell A column index.
   * @param {Boolean} [forceEdit] If true, will attempt to initiate the edit dialogue for the field in the specified cell.
   */
  gotoCell(row: number, cell: number, forceEdit?: boolean, e?: Event | SlickEvent): void {
    if (this.initialized && this.canCellBeActive(row, cell) && this.getEditorLock()?.commitCurrentEdit()) {
      this.scrollCellIntoView(row, cell, false);

      const newCell = this.getCellNode(row, cell);

      // if selecting the 'add new' row, start editing right away
      const column = this.columns[cell];
      const suppressActiveCellChangedEvent = !!(
        this._options.editable &&
        column?.editorClass &&
        this._options.suppressActiveCellChangeOnEdit
      );
      this.setActiveCellInternal(
        newCell,
        forceEdit || row === this.getDataLength() || this._options.autoEdit,
        null,
        suppressActiveCellChangedEvent,
        e
      );

      // if no editor was created, set the focus back on the grid
      if (!this.currentEditor) {
        this.setFocus();
      }
    }
  }

  // IEditor implementation for the editor lock

  protected commitCurrentEdit(): boolean {
    const self = this as SlickGrid<TData, C, O>;
    const item = self.getDataItem(self.activeRow);
    const column = self.columns[self.activeCell];

    if (self.currentEditor) {
      if (self.currentEditor.isValueChanged()) {
        const validationResults = self.currentEditor.validate(undefined, {
          rowIndex: self.activeRow,
          cellIndex: self.activeCell,
        });

        if (validationResults.valid) {
          const row = self.activeRow;
          const cell = self.activeCell;
          const editor = self.currentEditor;
          const serializedValue = self.currentEditor.serializeValue();
          const prevSerializedValue = self.serializedEditorValue;

          if (self.activeRow < self.getDataLength()) {
            // editing existing item found
            const editCommand = {
              row,
              cell,
              editor,
              serializedValue,
              prevSerializedValue,
              execute: () => {
                editor.applyValue(item, serializedValue);
                self.updateRow(row);
                self.triggerEvent(self.onCellChange, { command: 'execute', row, cell, item, column });
              },
              undo: () => {
                editor.applyValue(item, prevSerializedValue);
                self.updateRow(row);
                self.triggerEvent(self.onCellChange, { command: 'undo', row, cell, item, column });
              },
            };

            if (self._options.editCommandHandler) {
              self.makeActiveCellNormal(true);
              self._options.editCommandHandler(item, column, editCommand);
            } else {
              editCommand.execute();
              self.makeActiveCellNormal(true);
            }
          } else {
            // editing new item to add to dataset
            const newItem = {};
            self.currentEditor.applyValue(newItem, self.currentEditor.serializeValue());
            self.makeActiveCellNormal(true);
            self.triggerEvent(self.onAddNewRow, { item: newItem, column });
          }

          // check whether the lock has been re-acquired by event handlers
          return !self.getEditorLock()?.isActive();
        } else {
          // invalid editing: Re-add the CSS class to trigger transitions, if any.
          if (self.activeCellNode) {
            self.activeCellNode.classList.remove('invalid');
            Utils.width(self.activeCellNode); // force layout
            self.activeCellNode.classList.add('invalid');
          }

          self.triggerEvent(self.onValidationError, {
            editor: self.currentEditor,
            cellNode: self.activeCellNode,
            validationResults,
            row: self.activeRow,
            cell: self.activeCell,
            column,
          });

          self.currentEditor.focus();
          return false;
        }
      }

      self.makeActiveCellNormal(true);
    }
    return true;
  }

  protected cancelCurrentEdit(): boolean {
    this.makeActiveCellNormal();
    return true;
  }

  protected rowsToRanges(rows: number[], compactRows = false): SlickRange[] {
    const columns = this.getVisibleColumns();
    const lastCell = this.getColumnIndex(columns[columns.length - 1].id);
    const ranges: SlickRange[] = [];
    if (!compactRows) {
      rows.forEach((row) => ranges.push(new SlickRange(row, 0, row, lastCell)));
      return ranges;
    }

    let rangeStart = rows[0];
    let previousRow = rangeStart;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row <= previousRow) {
        return rows.map((row) => new SlickRange(row, 0, row, lastCell));
      }
      if (row !== previousRow + 1) {
        ranges.push(new SlickRange(rangeStart, 0, previousRow, lastCell));
        rangeStart = row;
      }
      previousRow = row;
    }
    if (rangeStart !== undefined) {
      ranges.push(new SlickRange(rangeStart, 0, previousRow, lastCell));
    }
    return ranges;
  }

  /** Returns an array of row indices corresponding to the currently selected rows. */
  getSelectedRows(): number[] {
    if (!this.selectionModel) {
      throw new Error('SlickGrid Selection model is not set');
    }
    return this.selectedRows.slice(0);
  }

  /**
   * Accepts an array of row indices and applies the current selectedCellCssClass to the cells in the row, respecting whether cells have been flagged as selectable.
   * @param {Array<number>} rowsArray - an array of row numbers.
   * @param {String} [caller] - an optional string to identify who called the method
   */
  setSelectedRows(rows: number[], caller?: string): void {
    if (!this.selectionModel) {
      throw new Error('SlickGrid Selection model is not set');
    }

    const elock = this.getEditorLock();
    if (typeof elock?.isActive === 'function' && !elock.isActive()) {
      this.selectionModel.setSelectedRanges(this.rowsToRanges(rows, caller === 'click.selectAll'), caller || 'SlickGrid.setSelectedRows');
    }
  }

  /**
   * Sanitize possible dirty html string (remove any potential XSS code like scripts and others) when a `sanitizer` is provided via grid options.
   * The logic will only call the sanitizer if it exists and the value is a defined string, anything else will be skipped (number, boolean, TrustedHTML will all be skipped)
   * @param {*} dirtyHtml: dirty html string
   */
  sanitizeHtmlString<T extends string | TrustedHTML>(dirtyHtml: unknown): T {
    return runOptionalHtmlSanitizer<T>(dirtyHtml, this._options?.sanitizer);
  }

  /** Applies/removes RTL state directly on the grid container. */
  private applyRTL(enabled: boolean): void {
    if (enabled) {
      this._container.classList.add('slick-rtl');
      this._container.setAttribute('dir', 'rtl');
    } else {
      this._container.classList.remove('slick-rtl');
      this._container.removeAttribute('dir');
    }
  }
}
