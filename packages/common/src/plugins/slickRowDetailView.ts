import { UsabilityOverrideFn } from '../enums/index';
import { Column, GridOption, RowDetailViewOption, SlickEvent, SlickGrid } from '../interfaces/index';

/* eslint-disable @typescript-eslint/no-unused-vars */
export class SlickRowDetailView {
  pluginName: 'RowDetailView' = 'RowDetailView';

  /** Fired when the async response finished */
  onAsyncEndUpdate?: SlickEvent<{ item: any; grid: SlickGrid; }>;

  /** This event must be used with the "notify" by the end user once the Asynchronous Server call returns the item detail */
  onAsyncResponse?: SlickEvent<{ item: any; detailView?: any }>;

  /** Fired after the row detail gets toggled */
  onAfterRowDetailToggle?: SlickEvent<{ item: any; expandedRows: Array<number | string>; grid: SlickGrid; }>;

  /** Fired before the row detail gets toggled */
  onBeforeRowDetailToggle?: SlickEvent<{ item: any; grid: SlickGrid; }>;

  /** Fired after the row detail gets toggled */
  onRowBackToViewportRange?: SlickEvent<{ item: any; rowId: number | string; rowIndex: number; expandedRows: Array<number | string>; rowIdsOutOfViewport: Array<number | string>; grid: SlickGrid; }>;

  /** Fired after a row becomes out of viewport range (when user can't see the row anymore) */
  onRowOutOfViewportRange?: SlickEvent<{ item: any; rowId: number | string; rowIndex: number; expandedRows: Array<number | string>; rowIdsOutOfViewport: Array<number | string>; grid: SlickGrid; }>;

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor() { }

  /**
   * Initialize the Export Service
   * @param _grid
   * @param _containerService
   */
  init(_grid: SlickGrid): void {
    throw new Error('SlickRowDetailView the "init" method must be implemented');
  }

  /** @deprecated use `dispose` Destroy the Slick Row Detail View */
  destroy() {
    throw new Error('SlickRowDetailView the "destroy" method must be implemented');
  }

  /** Dispose of the Slick Row Detail View */
  dispose() {
    throw new Error('SlickRowDetailView the "dispose" method must be implemented');
  }

  create(columnDefinitions: Column[], gridOptions: GridOption): SlickRowDetailView | null {
    throw new Error('SlickRowDetailView the "create" method must be implemented');
  }

  /** Collapse all of the open items */
  collapseAll() {
    throw new Error('SlickRowDetailView the "collapseAll" method must be implemented');
  }

  /** Colapse an Item so it is not longer seen */
  collapseDetailView(item: any, isMultipleCollapsing: boolean) {
    throw new Error('SlickRowDetailView the "collapseDetailView" method must be implemented');
  }

  /** Expand a row given the dataview item that is to be expanded */
  expandDetailView(item: any) {
    throw new Error('SlickRowDetailView the "expandDetailView" method must be implemented');
  }

  /** Override the logic for showing (or not) the expand icon (use case example: only every 2nd row is expandable) */
  expandableOverride(overrideFn: UsabilityOverrideFn) {
    throw new Error('SlickRowDetailView the "expandableOverride" method must be implemented');
  }

  /** Get the Column Definition of the first column dedicated to toggling the Row Detail View */
  getColumnDefinition(): Column {
    throw new Error('SlickRowDetailView the "getColumnDefinition" method must be implemented');
  }

  /** return the currently expanded rows */
  getExpandedRows(): Array<number | string> {
    throw new Error('SlickRowDetailView the "getExpandedRows" method must be implemented');
  }

  /** Takes in the item we are filtering and if it is an expanded row returns it's parents row to filter on */
  getFilterItem(item: any) {
    throw new Error('SlickRowDetailView the "getFilterItem" method must be implemented');
  }

  /** Get current plugin options */
  getOptions(): RowDetailViewOption {
    throw new Error('SlickRowDetailView the "getOptions" method must be implemented');
  }

  /** Resize the Row Detail View */
  resizeDetailView(item: any) {
    throw new Error('SlickRowDetailView the "resizeDetailView" method must be implemented');
  }

  /** Saves the current state of the detail view */
  saveDetailView(item: any) {
    throw new Error('SlickRowDetailView the "saveDetailView" method must be implemented');
  }

  /**
   * Change plugin options
   * @options An object with configuration options.
   */
  setOptions(options: RowDetailViewOption) {
    throw new Error('SlickRowDetailView the "setOptions" method must be implemented');
  }
}