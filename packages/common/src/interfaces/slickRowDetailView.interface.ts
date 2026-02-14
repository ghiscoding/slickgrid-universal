import type { SlickEvent, SlickGrid } from '../core/index.js';
import type { UsabilityOverrideFn } from '../enums/index.js';
import type { ContainerService } from '../services/container.service.js';
import type {
  Column,
  GridOption,
  OnAfterRowDetailToggleArgs,
  OnBeforeRowDetailToggleArgs,
  OnRowBackOrOutOfViewportRangeArgs,
  OnRowDetailAsyncEndUpdateArgs,
  OnRowDetailAsyncResponseArgs,
  RowDetailViewOption,
} from './index.js';

/** A plugin to add row detail panel. */
export interface SlickRowDetailView {
  pluginName: string;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid, containerService?: ContainerService): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  dispose(): void;

  /** Create the plugin */
  create(columns: Column[], gridOptions?: GridOption): SlickRowDetailView | null;

  /** Collapse all of the open items */
  collapseAll(): void;

  /** Collapse an Item so it is not longer seen */
  collapseDetailView(item: any, isMultipleCollapsing: boolean): void;

  /** Expand a row given the dataview item that is to be expanded */
  expandDetailView(item: any): void;

  /** Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable) */
  expandableOverride(overrideFn: UsabilityOverrideFn): void;

  /** Get the Column Definition of the first column dedicated to toggling the Row Detail View */
  getColumnDefinition(): Column;

  /** Get the row expandable Override function */
  getExpandableOverride(): UsabilityOverrideFn | null;

  /** return the currently expanded rows */
  getExpandedRowIds(): Array<number | string>;

  /** Takes in the item we are filtering and if it is an expanded row returns it's parents row to filter on */
  getFilterItem(item: any): any;

  /** Get current plugin options */
  getOptions(): RowDetailViewOption;

  /** Resize the Row Detail View */
  resizeDetailView(item: any): void;

  /** Saves the current state of the detail view */
  saveDetailView(item: any): void;

  /**
   * Change plugin options
   * @options An object with configuration options.
   */
  setOptions(options: RowDetailViewOption): void;

  // --
  // Events

  /** Fired when the async response finished */
  onAsyncEndUpdate?: SlickEvent<OnRowDetailAsyncEndUpdateArgs>;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse?: SlickEvent<OnRowDetailAsyncResponseArgs>;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle?: SlickEvent<OnAfterRowDetailToggleArgs>;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle?: SlickEvent<OnBeforeRowDetailToggleArgs>;

  /** Fired just before a row becomes out of viewport range (you can use this event to save inner Grid State before it gets destroyed) */
  onBeforeRowOutOfViewportRange: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange?: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;

  /** Fired after a row becomes out of viewport range (user can't see the row anymore) */
  onRowOutOfViewportRange?: SlickEvent<OnRowBackOrOutOfViewportRangeArgs>;
}
