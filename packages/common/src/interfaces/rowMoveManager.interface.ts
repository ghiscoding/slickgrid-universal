import {
  RowMoveManagerOption,
  SlickEventData,
  SlickGrid,
} from './index';
import { SlickRowMoveManager } from '../extensions/slickRowMoveManager';

export interface RowMoveManager extends RowMoveManagerOption {
  //
  // SlickGrid Events

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickRowMoveManager) => void;

  /** SlickGrid Event fired before the row is moved. */
  onBeforeMoveRows?: (e: SlickEventData, args: { grid: SlickGrid; rows: number[]; insertBefore: number; }) => boolean | void;

  /** SlickGrid Event fired while the row is moved. */
  onMoveRows?: (e: SlickEventData, args: { grid: SlickGrid; rows: number[]; insertBefore: number; }) => void;
}
