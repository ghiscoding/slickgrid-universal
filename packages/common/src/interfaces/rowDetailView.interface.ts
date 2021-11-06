import { RowDetailViewOption, SlickEventData, SlickGrid, SlickRowDetailView } from './index';

export interface RowDetailView extends RowDetailViewOption {
  // --
  // Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowDetailView) => void;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** An explicit view to use instead of template (Optional) */
    detailView?: any;
  }) => void;

  /** Fired when the async response finished */
  onAsyncEndUpdate?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** Reference to the Slick grid object */
    grid: SlickGrid;
  }) => void;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** Array of the Expanded Row Ids */
    expandedRows: Array<number | string>;

    /** Reference to the Slick grid object */
    grid: SlickGrid;
  }) => void;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** Reference to the Slick grid object */
    grid: SlickGrid;
  }) => void;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** Id of the Row object (datacontext) in the Grid */
    rowId: string | number;

    /** Index of the Row in the Grid */
    rowIndex: number;

    /** Array of the Expanded Row Ids */
    expandedRows: Array<string | number>;

    /** Array of the Out of viewport Range Rows */
    rowIdsOutOfViewport: Array<string | number>;

    /** Reference to the Slick grid object */
    grid: SlickGrid;
  }) => void;

  /** Fired after a row becomes out of viewport range (user can't see the row anymore) */
  onRowOutOfViewportRange?: (e: SlickEventData, args: {
    /** Item data context object */
    item: any;

    /** Id of the Row object (datacontext) in the Grid */
    rowId: string | number;

    /** Index of the Row in the Grid */
    rowIndex: number;

    /** Array of the Expanded Row Ids */
    expandedRows: Array<string | number>;

    /** Array of the Out of viewport Range Rows */
    rowIdsOutOfViewport: Array<string | number>;

    /** Reference to the Slick grid object */
    grid: SlickGrid;
  }) => void;
}
