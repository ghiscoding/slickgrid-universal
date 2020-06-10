import {
  GridSize,
  ResizerOption,
  SlickEventData,
  SlickGrid,
  SlickResizer,
} from './index';

export interface Resizer extends ResizerOption {
  // --
  // Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickResizer) => void;

  /** triggered before rows are being moved */
  onGridAfterResize?: (e: SlickEventData, args: { grid: SlickGrid; dimensions: GridSize; }) => void;

  /** triggered when rows are being moved */
  onGridBeforeResize?: (e: SlickEventData, args: { grid: SlickGrid; }) => void;
}
