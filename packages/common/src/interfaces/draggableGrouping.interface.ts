import { Grouping } from './grouping.interface';
import { DraggableGroupingOption } from './draggableGroupingOption.interface';
import { SlickDraggableGrouping } from './slickDraggableGrouping.interface';

export interface DraggableGrouping extends DraggableGroupingOption {
  //
  // Events
  // ---------
  /** Fired when grouped columns changed */
  onGroupChanged?: (e: Event, args: { caller?: string; groupColumns: Grouping[] }) => void;

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: SlickDraggableGrouping) => void;
}
