import type { SlickEventData } from 'slickgrid';

import type { Grouping } from './index';
import type { DraggableGroupingOption } from './draggableGroupingOption.interface';
import type { SlickDraggableGrouping } from '../extensions/slickDraggableGrouping';

export interface DraggableGrouping extends DraggableGroupingOption {
  //
  // Events
  // ---------
  /** Fired when grouped columns changed */
  onGroupChanged?: (e: SlickEventData | null, args: { caller?: string; groupColumns: Grouping[] }) => void;

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickDraggableGrouping) => void;
}
