
import type { Grouping } from './index.js';
import type { DraggableGroupingOption } from './draggableGroupingOption.interface.js';
import type { SlickDraggableGrouping } from '../extensions/slickDraggableGrouping.js';
import type { SlickEventData } from '../core/index.js';

export interface DraggableGrouping extends DraggableGroupingOption {
  //
  // Events
  // ---------
  /** Fired when grouped columns changed */
  onGroupChanged?: (e: SlickEventData | null, args: { caller?: string; groupColumns: Grouping[] }) => void;

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickDraggableGrouping) => void;
}
