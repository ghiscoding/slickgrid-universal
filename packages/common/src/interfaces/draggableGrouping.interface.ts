import { Grouping, SlickEventData } from './index';
import { DraggableGroupingOption } from './draggableGroupingOption.interface';
import { DraggableGroupingPlugin } from '../plugins/draggableGrouping.plugin';

export interface DraggableGrouping extends DraggableGroupingOption {
  //
  // Events
  // ---------
  /** Fired when grouped columns changed */
  onGroupChanged?: (e: SlickEventData, args: { caller?: string; groupColumns: Grouping[] }) => void;

  /** Fired after extension (plugin) is registered by SlickGrid */
  onExtensionRegistered?: (plugin: DraggableGroupingPlugin) => void;
}
