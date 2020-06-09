import {
  DraggableGroupingOption,
  Grouping,
  SlickEvent,
  SlickGrid,
} from './index';

/** This plugin provides the Draggable Grouping feature */
export interface SlickDraggableGrouping {
  pluginName: 'DraggableGrouping';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: DraggableGroupingOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /** provide option to clear grouping */
  clearDroppedGroups?: () => void;

  /** its function to setup draggable feature agains Header Column, should be passed on grid option. Also possible to pass custom function */
  getSetupColumnReorder?: () => void;

  /** provide option to set default grouping on loading */
  setDroppedGroups?: (groupingInfo: Grouping[]) => void;

  // --
  // Events

  /** SlickGrid Event fired when a group has changed. */
  onGroupChanged: SlickEvent<{ caller?: string; groupColumns: Grouping[] }>;
}
