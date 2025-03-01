import type { SlickEventData, SlickGrid } from '../core/index.js';
import type { RowDetailViewOption, SlickRowDetailView } from './index.js';

export interface RowDetailView extends RowDetailViewOption {
  // --
  // Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowDetailView) => void;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse?: (e: SlickEventData, args: OnRowDetailAsyncResponseArgs) => void;

  /** Fired when the async response finished */
  onAsyncEndUpdate?: (e: SlickEventData, args: OnRowDetailAsyncEndUpdateArgs) => void;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle?: (e: SlickEventData, args: OnAfterRowDetailToggleArgs) => void;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle?: (e: SlickEventData, args: OnBeforeRowDetailToggleArgs) => void;

  /** Fired just before a row becomes out of viewport range (you can use this event to save inner Grid State before it gets destroyed) */
  onBeforeRowOutOfViewportRange?: (e: SlickEventData, args: OnRowOutOfViewportRangeArgs) => void;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange?: (e: SlickEventData, args: OnRowBackToViewportRangeArgs) => void;

  /** Fired after a row becomes out of viewport range (user can't see the row anymore) */
  onRowOutOfViewportRange?: (e: SlickEventData, args: OnRowOutOfViewportRangeArgs) => void;
}

/** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
export interface OnRowDetailAsyncResponseArgs {
  /** Item data context object */
  item: any;

  /** @alias `item` */
  itemDetail: any;

  /** An explicit view to use instead of template (Optional) */
  detailView?: any;

  /** SlickGrid instance */
  grid?: SlickGrid;

  /** provide any generic params */
  params?: any;
}

/** Fired when the async response finished */
export interface OnRowDetailAsyncEndUpdateArgs {
  /** Item data context object */
  item: any;

  /** @deprecated @alias `item` */
  itemDetail: any;

  /** Reference to the Slick grid object */
  grid: SlickGrid;

  /** provide any generic params */
  params?: any;
}

/** Fired after the row detail gets toggled */
export interface OnAfterRowDetailToggleArgs {
  /** Item data context object */
  item: any;

  /** Array of the Expanded Row Ids */
  expandedRows: Array<number | string>;

  /** Reference to the Slick grid object */
  grid: SlickGrid;

  /** provide any generic params */
  params?: any;
}

/** Fired before the row detail gets toggled */
export interface OnBeforeRowDetailToggleArgs {
  /** Item data context object */
  item: any;

  /** Reference to the Slick grid object */
  grid: SlickGrid;

  /** provide any generic params */
  params?: any;
}

/** Fired after the row detail gets toggled */
export interface OnRowBackToViewportRangeArgs {
  /** Item data context object */
  item: any;

  /** Id of the Row object (datacontext) in the Grid */
  rowId: string | number;

  /** Index of the Row in the Grid */
  rowIndex: number;

  /** Array of the Expanded Row Ids */
  expandedRows: Array<number | string>;

  /** Array of the Out of viewport Range Rows */
  rowIdsOutOfViewport: Array<number | string>;

  /** Reference to the Slick grid object */
  grid: SlickGrid;

  /** provide any generic params */
  params?: any;
}

/**
 * @deprecated We should eventually merge out/back to viewport into a single interface.
 * Fired after a row becomes out of viewport range (user can't see the row anymore)
 */
export interface OnRowOutOfViewportRangeArgs {
  /** Item data context object */
  item: any;

  /** Id of the Row object (datacontext) in the Grid */
  rowId: string | number;

  /** Index of the Row in the Grid */
  rowIndex: number;

  /** Array of the Expanded Row Ids */
  expandedRows: Array<number | string>;

  /** Array of the Out of viewport Range Rows */
  rowIdsOutOfViewport: Array<number | string>;

  /** Reference to the Slick grid object */
  grid: SlickGrid;

  /** provide any generic params */
  params?: any;
}
