import {
  AutoTooltipOption,
  CellMenuOption,
  CheckboxSelectorOption,
  Column,
  CompositeEditorOption,
  ContextMenuOption,
  DataViewOption,
  DraggableGroupingOption,
  ExcelCopyBufferOption,
  GridOption,
  GridSize,
  HeaderButtonOption,
  HeaderMenuOption,
  ResizerOption,
  RowDetailViewOption,
  RowMoveManagerOption,
  RowSelectionModelOption,
  SlickCompositeEditor,
  SlickDataView,
  SlickEditorLock,
  SlickEvent,
  SlickEventData,
  SlickEventHandler,
  SlickGrid,
  SlickGroup,
  SlickRange,
  SlickRemoteModel,
  SlickResizer,
  SlickRowDetailView,
} from './index';
import {
  SlickAutoTooltip,
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickCheckboxSelectColumn,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../extensions/index';

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
    DataView: new (options?: DataViewOption) => SlickDataView;

    /** Slick AJAX Remote Data store implementation. */
    RemoteModel?: new () => SlickRemoteModel;

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
  Grid: new (gridContainer: HTMLElement | string, data: SlickDataView | Array<any>, columnDefinitions: Column[], gridOptions: GridOption) => SlickGrid;

  /** Information about a group of rows. */
  Group: new () => SlickGroup;

  // --
  // Slick Core
  // --------------------------

  /** A composite SlickGrid editor factory. Generates an editor that is composed of multiple editors for given columns. */
  CompositeEditor: new (modalColumns: Column[], containers: Array<HTMLElement | JQuery<HTMLElement> | null>, options?: CompositeEditorOption) => SlickCompositeEditor;

  /** Event is a Pub/Sub SlickGrid Event */
  Event: new <T = any> () => SlickEvent<T>;

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
  Range: new (fromRow?: number, fromCell?: number, toRow?: number, toCell?: number) => SlickRange;


  // --
  // Slick Controls/Plugins (addons)
  // -------------------------------

  /** AutoTooltips is a 3rd party plugin (addon) to show/hide tooltips when columns are too narrow to fit content. */
  AutoTooltips: new (options?: AutoTooltipOption) => SlickAutoTooltip;

  /** Cell External Copy Manager is a 3rd party plugin (addon) which is an Excel like copy cell range addon */
  CellExternalCopyManager: new (options?: ExcelCopyBufferOption) => SlickCellExternalCopyManager;

  /** Displays an overlay on top of a given cell range. */
  CellRangeDecorator: new () => SlickCellRangeDecorator;

  /** CellRangeSelector is a utility to select a range of cells, this is useful with for example when we use the cell external copy manager (excel like) */
  CellRangeSelector: new () => SlickCellRangeSelector;

  /** CellSelectionModel is a utility to select a range of cells, this is useful with for example when we use the cell external copy manager (excel like) */
  CellSelectionModel: new () => SlickCellSelectionModel;

  /** A plugin to select row(s) via checkboxes typically shown as the 1st column in the grid. */
  CheckboxSelectColumn: new (options?: CheckboxSelectorOption) => SlickCheckboxSelectColumn;

  /** This plugin provides the Draggable Grouping feature */
  DraggableGrouping: new (options?: DraggableGroupingOption) => SlickDraggableGrouping;

  /** RowSelectionModel is a utility to select a range of rows, this is used by at least the CheckboxSelectColumn plugin */
  RowSelectionModel: new (options?: RowSelectionModelOption) => SlickRowSelectionModel;

  /** A plugin that allows to move/reorganize some rows with drag & drop */
  RowMoveManager: new (options?: RowMoveManagerOption) => SlickRowMoveManager;

  // all of the controls are under the Controls namespace
  Controls: {
    /** A control to add a Grid Menu (hambuger menu on top-right of the grid) */
    GridMenu: new (columns: Column[], grid: SlickGrid, options?: GridOption) => SlickGridMenu;
  },

  // some of the plugins are under the Plugins namespace
  Plugins: {
    /** A plugin to add Menu on a Cell click (click on the cell that has the cellMenu object defined) */
    CellMenu: new (options?: CellMenuOption) => SlickCellMenu;

    /** A plugin to add Context Menu (mouse right+click), it subscribes to the slickgrid cell "onContextMenu" event. */
    ContextMenu: new (options?: ContextMenuOption) => SlickContextMenu;

    /** A plugin to add custom buttons to column headers. */
    HeaderButtons: new (options?: HeaderButtonOption) => SlickHeaderButtons;

    /** A plugin to add drop-down menus to column headers. */
    HeaderMenu: new (options?: HeaderMenuOption) => SlickHeaderMenu;

    /** A plugin to add row detail panel */
    RowDetailView: new (options?: RowDetailViewOption) => SlickRowDetailView;

    /** Resizer is a 3rd party plugin (addon) that can be used to auto-resize a grid and/or resize it with fixed dimensions. */
    Resizer: new (options?: ResizerOption, fixedGridDimensions?: GridSize) => SlickResizer;
  };
}
