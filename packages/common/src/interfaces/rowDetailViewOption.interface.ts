import type { SlickDataView, SlickGrid, SlickRowDetailView, UsabilityOverrideFn } from '../index.js';
import type { Observable, Subject } from '../services/rxjsFacade.js';

export interface RowDetailViewProps<T = any, C = any> {
  model: T;
  addon: SlickRowDetailView;
  expandedRows?: (string | number)[];
  grid: SlickGrid;
  dataView: SlickDataView;
  parent: C;
  rowId?: string | number;
  rowIndex?: number;
  rowIdsOutOfViewport?: (string | number)[];
}

export interface RowDetailViewOption {
  /** Defaults to True, do we always render/reRender the column */
  alwaysRenderColumn?: boolean;

  /** Defaults to true, which will collapse all row detail views when user calls a sort. Unless user implements a sort to deal with padding */
  collapseAllOnSort?: boolean;

  /** Extra classes to be added to the collapse Toggle */
  collapsedClass?: string;

  /** Defaults to "_detail_selector", Row Detail column Id */
  columnId?: string;

  /**
   * Defaults to 0, the column index position in the grid by default it will show as the first column (index 0).
   * Also note that the index position might vary if you use other extensions, after each extension is created,
   * it will add an offset to take into consideration (1.CheckboxSelector, 2.RowDetail, 3.RowMove)
   */
  columnIndexPosition?: number;

  /** A CSS class to be added to the row detail */
  cssClass?: string;

  /** Extra classes to be added to the expanded Toggle */
  expandedClass?: string;

  /** Defaults to '_', prefix used for all the plugin metadata added to the item object (meta e.g.: padding, collapsed, parent) */
  keyPrefix?: string;

  /** Defaults to false, when True will load the data once and then reuse it. */
  loadOnce?: boolean;

  /** Defaults to null, do we want to defined a maximum number of rows to show. */
  maxRows?: number;

  /**
   * How many grid rows do we want to use for the detail panel view
   * also note that the detail view adds an extra 1 row for padding purposes
   * so if you choose 4 panelRows, the display will in fact use 5 rows
   */
  panelRows: number;

  /** Optionally pass your Parent Component reference or exposed functions to your Child Component (row detail component). */
  parent?: any;

  /** Defaults to false, makes the column reorderable to another position in the grid. */
  reorderable?: boolean;

  /** Defaults to true, which will save the row detail view in a cache when it detects that it will become out of the viewport buffer */
  saveDetailViewOnScroll?: boolean;

  /** Defaults to false, which will limit expanded row to only 1 at a time (it will close all other rows before opening new one). */
  singleRowExpand?: boolean;

  /** Defaults to false, when True will open the row detail on a row click (from any column) */
  useRowClick?: boolean;

  /**
   * @deprecated this flag is actually no longer used internally since we now have a single way of calculating the out/in viewport range.
   * However, we will keep the flag to avoid introducing a breaking change but again it's not needed anymore and it will be removed in the next major version.
   */
  useSimpleViewportCalc?: boolean;

  /** no defaults, show a tooltip text while hovering the row detail icon */
  toolTip?: string;

  /** no defaults, width of the icon column */
  width?: number;

  // --
  // Callback Methods

  /**
   * HTML Preload Template that will be used before the async process (typically used to show a spinner/loading)
   * It's preferable to use the "preloadView" property to use a framework View instead of plain HTML.
   * If you still wish to use these methods, we strongly suggest you to sanitize your HTML, e.g. "DOMPurify.sanitize()"
   */
  preTemplate?: (item?: any) => string | HTMLElement;

  /**
   * HTML Post Template (when Row Detail data is available) that will be loaded once the async function finishes
   * It's preferable to use the "preloadView" property to use a framework View instead of plain HTML
   * If you still wish to use these methods, we strongly suggest you to sanitize your HTML, e.g. "DOMPurify.sanitize()"
   */
  postTemplate?: (item: any) => string | HTMLElement;

  /** Async server function call */
  process: (item: any) => Promise<any> | Observable<any> | Subject<any>;

  /** Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable) */
  expandableOverride?: UsabilityOverrideFn;
}
