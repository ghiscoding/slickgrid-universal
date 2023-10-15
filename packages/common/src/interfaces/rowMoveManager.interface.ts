
import type { RowMoveManagerOption, SlickGridModel } from './index';
import type { SlickRowMoveManager } from '../extensions/slickRowMoveManager';
import type { SlickEventData } from '../core/index';

export interface RowMoveManager extends RowMoveManagerOption {
  //
  // SlickGrid Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowMoveManager) => void;

  /** SlickGrid Event fired before the row is moved. */
  onBeforeMoveRows?: (e: MouseEvent | TouchEvent | SlickEventData, args: { grid: SlickGridModel; rows: number[]; insertBefore: number; }) => boolean | void;

  /** SlickGrid Event fired while the row is moved. */
  onMoveRows?: (e: SlickEventData, args: { grid: SlickGridModel; rows: number[]; insertBefore: number; }) => void;
}
