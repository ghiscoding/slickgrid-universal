import { RowDetailViewOption } from './rowDetailViewOption.interface';
import { SlickGrid } from './slickGrid.interface';
import { SlickEventData } from './slickEventData.interface';
import { SlickRowDetailView } from './slickRowDetailView.interface';

export interface RowDetailView extends RowDetailViewOption {
  // --
  // Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowDetailView) => void;

  /** Fired when the async response finished */
  onAsyncEndUpdate?: (e: SlickEventData, args: { item: any; grid: SlickGrid; }) => void;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse?: (e: SlickEventData, args: { item: any; detailView?: any }) => void;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle?: (e: SlickEventData, args: { item: any; expandedRows: Array<number | string>; grid: SlickGrid; }) => void;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle?: (e: SlickEventData, args: { item: any; grid: SlickGrid; }) => void;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange?: (e: SlickEventData, args: { item: any; rowId: number | string; rowIndex: number; expandedRows: Array<number | string>; rowIdsOutOfViewport: Array<number | string>; grid: SlickGrid; }) => void;

  /** Fired after a row becomes out of viewport range (user can't see the row anymore) */
  onRowOutOfViewportRange?: (e: SlickEventData, args: { item: any; rowId: number | string; rowIndex: number; expandedRows: Array<number | string>; rowIdsOutOfViewport: Array<number | string>; grid: SlickGrid; }) => void;
}
