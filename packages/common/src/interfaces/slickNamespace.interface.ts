import {
  AutoResizeOption,
  AutoTooltipOption,
  Column,
  ExcelCopyBufferOption,
  GridOption,
  SlickAutoTooltips,
  SlickCellExternalCopyManager,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickDataView,
  SlickEditorLock,
  SlickEvent,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickGroupItemMetadataProvider,
  SlickRange,
} from './index';

/**
 * Slick Grid class interface of the entire library and it's multiple controls/plugins.
 * However note that We'll only include what we really use in this lib,
 * for example, we defined our own Aggregators, Formatters, ... so we won't use the ones defined in the regular Slick class.
 */
export interface SlickNamespace {
  // --
  // Slick Grid & DataView
  // --------------------------

  Data: {
    /** Slick DataView which has built-in data manipulation methods. Relies on the data item having an "id" property uniquely identifying it. */
    DataView: new (options?: { groupItemMetadataProvider?: SlickGroupItemMetadataProvider; inlineFilters?: boolean; }) => SlickDataView;

    /**
     * Provides item metadata for group (Slick.Group) and totals (Slick.Totals) rows produced by the DataView.
     * This metadata overrides the default behavior and formatting of those rows so that they appear and function
     * correctly when processed by the grid.
     *
     * This class also acts as a grid plugin providing event handlers to expand & collapse groups.
     * If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
     *
     */
    GroupItemMetadataProvider: new () => SlickGroupItemMetadataProvider;
  };

  /** Slick Grid is a data grid library and this class is the core of the library */
  Grid: new (gridContainer: Element, data: SlickDataView | Array<any>, columnDefinitions: Column[], gridOptions: GridOption) => SlickGrid;


  // --
  // Slick Core
  // --------------------------

  /** Event is a Pub/Sub SlickGrid Event */
  Event: new () => SlickEvent;

  /**
   * An event object for passing data to event handlers and letting them control propagation.
   * This is pretty much identical to how W3C and jQuery implement events.
   */
  EventData: new () => SlickEventData;

  /** EventHandler is a Pub/Sub SlickGrid Event Handler */
  EventHandler: new () => SlickEventHandler;

  /** Global Editor Lock */
  GlobalEditorLock: SlickEditorLock;

  /** A structure containing a range of cells. */
  Range: new () => SlickRange;


  // --
  // Slick Controls/Plugins (addons)
  // -------------------------------

  /** AutoTooltips is a 3rd party plugin (addon) to show/hide tooltips when columns are too narrow to fit content. */
  AutoTooltips: new (options?: AutoTooltipOption) => SlickAutoTooltips;

  /** Cell External Copy Manager is a 3rd party plugin (addon) which is an Excel like copy cell range addon */
  CellExternalCopyManager: new (options?: ExcelCopyBufferOption) => SlickCellExternalCopyManager;

  /** Displays an overlay on top of a given cell range. */
  CellRangeDecorator: new () => SlickCellRangeDecorator;

  /** CellRangeSelector is a utility to select a range of cell, this is useful with for example when we use the cell external copy manager (excel like) */
  CellRangeSelector: new () => SlickCellRangeSelector;

  /** CellSelectionModel is a utility to select a range of cell, this is useful with for example when we use the cell external copy manager (excel like) */
  CellSelectionModel: new () => SlickCellSelectionModel;

  // some of them are under the Plugins namespace
  Plugins: {
    /** Resizer is a 3rd party plugin (addon) that can be used to auto-resize a grid and/or resize it with fixed dimensions. */
    Resizer: new (autoResizeOptions?: AutoResizeOption, fixedGridDimensions?: { height?: number; width?: number; }) => any;
  };
}
