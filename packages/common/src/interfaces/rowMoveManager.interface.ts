import type { SlickEventData } from 'slickgrid';

import type { RowMoveManagerOption, SlickGridUniversal } from './index';
import type { SlickRowMoveManager } from '../extensions/slickRowMoveManager';

export interface RowMoveManager extends RowMoveManagerOption {
  //
  // SlickGrid Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowMoveManager) => void;

  /** SlickGrid Event fired before the row is moved. */
  onBeforeMoveRows?: (e: MouseEvent | TouchEvent | SlickEventData, args: { grid: SlickGridUniversal; rows: number[]; insertBefore: number; }) => boolean | void;

  /** SlickGrid Event fired while the row is moved. */
  onMoveRows?: (e: SlickEventData, args: { grid: SlickGridUniversal; rows: number[]; insertBefore: number; }) => void;
}
