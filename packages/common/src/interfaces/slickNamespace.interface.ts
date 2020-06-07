import {
  AutoResizeOption,
  AutoTooltips,
  AutoTooltipOption,
  CellExternalCopyManager,
  CellSelectionModel,
  Column,
  DataView,
  EditorLock,
  ExcelCopyBufferOption,
  GridOption,
  SlickEvent,
  SlickEventHandler,
  SlickGrid,
} from './index';

/**
 * Slick Grid class interface of the entire library and it's multiple controls/plugins.
 * However note that We'll only include what we really use in this lib,
 * for example, we defined our own Aggregators, Formatters, ... so we won't use the ones defined in the regular Slick class.
 */
export interface SlickNamespace {
  Data: {
    /** Slick DataView which has built-in data manipulation methods. Relies on the data item having an "id" property uniquely identifying it. */
    DataView: new (options?: { groupItemMetadataProvider?: any; inlineFilters?: any; }) => DataView;

    /** Group Item Metadata Provider used by the Grouping/DraggableGrouping features */
    GroupItemMetadataProvider: any;
  };

  /** Slick Grid is a data grid library and this class is the core of the library */
  Grid: new (gridContainer: Element, data: DataView | Array<any>, columnDefinitions: Column[], gridOptions: GridOption) => SlickGrid;

  /** CellSelectionModel is a utility to select a range of cell, this is useful with for example when we use the cell external copy manager (excel like) */
  CellSelectionModel: new () => CellSelectionModel;

  /** Event is a Pub/Sub SlickGrid Event */
  Event: new () => SlickEvent;

  /** EventHandler is a Pub/Sub SlickGrid Event Handler */
  EventHandler: new () => SlickEventHandler;

  /** Global Editor Lock */
  GlobalEditorLock: EditorLock;

  // --
  // Controls/Plugins (addons)
  // --------------------------

  Plugins: {
    /** Resizer is a 3rd party plugin (addon) that can be used to auto-resize a grid and/or resize it with fixed dimensions. */
    Resizer: new (autoResizeOptions?: AutoResizeOption, fixedGridDimensions?: { height?: number; width?: number; }) => any;
  };

  /** AutoTooltipOption is a 3rd party plugin (addon) to show/hide tooltips when columns are too narrow to fit content. */
  AutoTooltips: new (options?: AutoTooltipOption) => AutoTooltips;

  /** Cell External Copy Manager is a 3rd party plugin (addon) which is an Excel like copy cell range addon */
  CellExternalCopyManager: new (options?: ExcelCopyBufferOption) => CellExternalCopyManager;
}
