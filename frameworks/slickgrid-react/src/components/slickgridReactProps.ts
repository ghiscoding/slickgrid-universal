import type {
  Column,
  ColumnSort,
  ContainerService,
  CurrentFilter,
  CurrentSorter,
  DragRowMove,
  ExportTextDownloadOption,
  ExtensionList,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridOption,
  GridSize,
  GridStateChange,
  HeaderButtonOnCommandArgs,
  HeaderMenuCommandItemCallbackArgs,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  MenuOptionItemCallbackArgs,
  OnActiveCellChangedEventArgs,
  OnAddNewRowEventArgs,
  OnAutosizeColumnsEventArgs,
  OnBeforeAppendCellEventArgs,
  OnBeforeCellEditorDestroyEventArgs,
  OnBeforeColumnsResizeEventArgs,
  OnBeforeEditCellEventArgs,
  OnBeforeFooterRowCellDestroyEventArgs,
  OnBeforeHeaderCellDestroyEventArgs,
  OnBeforeHeaderRowCellDestroyEventArgs,
  OnBeforeSetColumnsEventArgs,
  OnCellChangeEventArgs,
  OnCellCssStylesChangedEventArgs,
  OnClickEventArgs,
  OnColumnsChangedArgs,
  OnColumnsDragEventArgs,
  OnColumnsReorderedEventArgs,
  OnColumnsResizeDblClickEventArgs,
  OnColumnsResizedEventArgs,
  OnCompositeEditorChangeEventArgs,
  OnDblClickEventArgs,
  OnDragReplaceCellsEventArgs,
  OnFooterClickEventArgs,
  OnFooterContextMenuEventArgs,
  OnFooterRowCellRenderedEventArgs,
  OnGroupCollapsedEventArgs,
  OnGroupExpandedEventArgs,
  OnHeaderCellRenderedEventArgs,
  OnHeaderClickEventArgs,
  OnHeaderContextMenuEventArgs,
  OnHeaderMouseEventArgs,
  OnHeaderRowCellRenderedEventArgs,
  OnKeyDownEventArgs,
  OnRenderedEventArgs,
  OnRowCountChangedEventArgs,
  OnRowsChangedEventArgs,
  OnRowsOrCountChangedEventArgs,
  OnScrollEventArgs,
  OnSearchChangeEventArgs,
  OnSelectedRowIdsChangedEventArgs,
  OnSelectedRowsChangedEventArgs,
  OnSetItemsCalledEventArgs,
  OnSetOptionsEventArgs,
  OnValidationErrorEventArgs,
  Pagination,
  PaginationMetadata,
  PagingInfo,
  ReactRegularEventHandler,
  ReactSlickEventHandler,
  SingleColumnSort,
  SlickControlList,
  SlickDataView,
  SlickGrid,
  SlickPluginList,
  SlickRange,
  TreeToggleStateChange,
} from '@slickgrid-universal/common';
import type { SlickgridReactInstance } from '../models/index.js';
import type { TranslaterI18NextService } from '../services/translaterI18Next.service.js';

export interface SlickgridReactProps {
  header?: React.ReactElement;
  footer?: React.ReactElement;
  containerService: ContainerService;
  translaterService?: TranslaterI18NextService;
  customDataView?: SlickDataView;
  dataset: any[];
  datasetHierarchical?: any[] | null;
  extensions?: ExtensionList<SlickControlList | SlickPluginList>;
  gridId: string;
  options?: GridOption;
  columns: Column[];
  instances?: SlickgridReactInstance;
  paginationOptions?: Pagination;

  // Custom Events list
  // ---------------------

  // Slick Grid events
  onActiveCellChanged?: ReactSlickEventHandler<OnActiveCellChangedEventArgs>;
  onActiveCellPositionChanged?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onAddNewRow?: ReactSlickEventHandler<OnAddNewRowEventArgs>;
  onAutosizeColumns?: ReactSlickEventHandler<OnAutosizeColumnsEventArgs>;
  onBeforeAppendCell?: ReactSlickEventHandler<OnBeforeAppendCellEventArgs>;
  onBeforeCellEditorDestroy?: ReactSlickEventHandler<OnBeforeCellEditorDestroyEventArgs>;
  onBeforeColumnsResize?: ReactSlickEventHandler<OnBeforeColumnsResizeEventArgs>;
  onBeforeDestroy?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onBeforeEditCell?: ReactSlickEventHandler<OnBeforeEditCellEventArgs>;
  onBeforeHeaderCellDestroy?: ReactSlickEventHandler<OnBeforeHeaderCellDestroyEventArgs>;
  onBeforeHeaderRowCellDestroy?: ReactSlickEventHandler<OnBeforeHeaderRowCellDestroyEventArgs>;
  onBeforeFooterRowCellDestroy?: ReactSlickEventHandler<OnBeforeFooterRowCellDestroyEventArgs>;
  onBeforeSetColumns?: ReactSlickEventHandler<OnBeforeSetColumnsEventArgs>;
  onBeforeSort?: ReactSlickEventHandler<SingleColumnSort, boolean | void>;
  onCellChange?: ReactSlickEventHandler<OnCellChangeEventArgs>;
  onCellCssStylesChanged?: ReactSlickEventHandler<OnCellCssStylesChangedEventArgs>;
  onClick?: ReactSlickEventHandler<OnClickEventArgs>;
  onColumnsDrag?: ReactSlickEventHandler<OnColumnsDragEventArgs>;
  onColumnsReordered?: ReactSlickEventHandler<OnColumnsReorderedEventArgs>;
  onColumnsResized?: ReactSlickEventHandler<OnColumnsResizedEventArgs>;
  onColumnsResizeDblClick?: ReactSlickEventHandler<OnColumnsResizeDblClickEventArgs>;
  onCompositeEditorChange?: ReactSlickEventHandler<OnCompositeEditorChangeEventArgs>;
  onContextMenu?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onDrag?: ReactSlickEventHandler<DragRowMove>;
  onDragEnd?: ReactSlickEventHandler<DragRowMove>;
  onDragInit?: ReactSlickEventHandler<DragRowMove>;
  onDragStart?: ReactSlickEventHandler<DragRowMove>;
  onDragReplaceCells?: ReactSlickEventHandler<OnDragReplaceCellsEventArgs>;
  onDblClick?: ReactSlickEventHandler<OnDblClickEventArgs>;
  onFooterContextMenu?: ReactSlickEventHandler<OnFooterContextMenuEventArgs>;
  onFooterRowCellRendered?: ReactSlickEventHandler<OnFooterRowCellRenderedEventArgs>;
  onHeaderCellRendered?: ReactSlickEventHandler<OnHeaderCellRenderedEventArgs>;
  onFooterClick?: ReactSlickEventHandler<OnFooterClickEventArgs>;
  onHeaderClick?: ReactSlickEventHandler<OnHeaderClickEventArgs>;
  onHeaderContextMenu?: ReactSlickEventHandler<OnHeaderContextMenuEventArgs>;
  onHeaderMouseEnter?: ReactSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderMouseLeave?: ReactSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderRowCellRendered?: ReactSlickEventHandler<OnHeaderRowCellRenderedEventArgs>;
  onHeaderRowMouseEnter?: ReactSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderRowMouseLeave?: ReactSlickEventHandler<OnHeaderMouseEventArgs>;
  onKeyDown?: ReactSlickEventHandler<OnKeyDownEventArgs>;
  onMouseEnter?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onMouseLeave?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onValidationError?: ReactSlickEventHandler<OnValidationErrorEventArgs>;
  onViewportChanged?: ReactSlickEventHandler<{ grid: SlickGrid }>;
  onRendered?: ReactSlickEventHandler<OnRenderedEventArgs>;
  onSelectedRowsChanged?: ReactSlickEventHandler<OnSelectedRowsChangedEventArgs>;
  onSetOptions?: ReactSlickEventHandler<OnSetOptionsEventArgs>;
  onScroll?: ReactSlickEventHandler<OnScrollEventArgs>;
  onSort?: ReactSlickEventHandler<SingleColumnSort>;

  // Slick DataView events
  onBeforePagingInfoChanged?: ReactSlickEventHandler<PagingInfo>;
  onGroupExpanded?: ReactSlickEventHandler<OnGroupExpandedEventArgs>;
  onGroupCollapsed?: ReactSlickEventHandler<OnGroupCollapsedEventArgs>;
  onPagingInfoChanged?: ReactSlickEventHandler<PagingInfo>;
  onRowCountChanged?: ReactSlickEventHandler<OnRowCountChangedEventArgs>;
  onRowsChanged?: ReactSlickEventHandler<OnRowsChangedEventArgs>;
  onRowsOrCountChanged?: ReactSlickEventHandler<OnRowsOrCountChangedEventArgs>;
  onSelectedRowIdsChanged?: ReactSlickEventHandler<OnSelectedRowIdsChangedEventArgs>;
  onSetItemsCalled?: ReactSlickEventHandler<OnSetItemsCalledEventArgs>;

  // other Slick Events
  onAfterMenuShow?: ReactSlickEventHandler<MenuFromCellCallbackArgs>;
  onBeforeMenuClose?: ReactSlickEventHandler<MenuFromCellCallbackArgs>;
  onBeforeMenuShow?: ReactSlickEventHandler<MenuFromCellCallbackArgs>;
  onColumnsChanged?: ReactSlickEventHandler<OnColumnsChangedArgs>;
  onCommand?: ReactSlickEventHandler<MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>;
  onGridMenuColumnsChanged?: ReactSlickEventHandler<OnColumnsChangedArgs>;
  onMenuClose?: ReactSlickEventHandler<GridMenuEventWithElementCallbackArgs>;
  onCopyCells?: ReactSlickEventHandler<{ ranges: SlickRange[] }>;
  onCopyCancelled?: ReactSlickEventHandler<{ ranges: SlickRange[] }>;
  onPasteCells?: ReactSlickEventHandler<{ ranges: SlickRange[] }>;
  onBeforePasteCell?: ReactSlickEventHandler<{ cell: number; row: number; item: any; columnDef: Column; value: any }>;

  // Slickgrid-React or Slickgrid-Universal events
  onAfterExportToExcel?: ReactRegularEventHandler<{ filename: string; mimeType: string } | { error: any }>;
  onBeforeExportToExcel?: ReactRegularEventHandler<boolean>;
  onBeforeExportToTextFile?: ReactRegularEventHandler<boolean>;
  onAfterExportToTextFile?: ReactRegularEventHandler<ExportTextDownloadOption>;
  onBeforeFilterChange?: ReactRegularEventHandler<CurrentFilter[]>;
  onBeforeFilterClear?: ReactRegularEventHandler<{ columnId: string } | boolean>;
  onBeforeSearchChange?: ReactRegularEventHandler<OnSearchChangeEventArgs, boolean | void>;
  onBeforeSortChange?: ReactRegularEventHandler<Array<ColumnSort & { clearSortTriggered?: boolean }>>;
  onContextMenuClearGrouping?: ReactRegularEventHandler<void>;
  onContextMenuCollapseAllGroups?: ReactRegularEventHandler<void>;
  onContextMenuExpandAllGroups?: ReactRegularEventHandler<void>;
  onAfterGridDestroyed?: ReactRegularEventHandler<MenuFromCellCallbackArgs>;
  onBeforeGridDestroy?: ReactRegularEventHandler<MenuFromCellCallbackArgs>;
  onOptionSelected?: ReactRegularEventHandler<MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>;
  onColumnPickerColumnsChanged?: ReactRegularEventHandler<OnColumnsChangedArgs>;
  onGridMenuMenuClose?: ReactRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuBeforeMenuShow?: ReactRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuAfterMenuShow?: ReactRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuClearAllPinning?: ReactRegularEventHandler<void>;
  onGridMenuClearAllFilters?: ReactRegularEventHandler<void>;
  onGridMenuClearAllSorting?: ReactRegularEventHandler<void>;
  onGridMenuCommand?: ReactRegularEventHandler<GridMenuCommandItemCallbackArgs>;
  onHeaderButtonCommand?: ReactRegularEventHandler<HeaderButtonOnCommandArgs>;
  onHeaderMenuCommand?: ReactRegularEventHandler<MenuCommandItemCallbackArgs>;
  onHeaderMenuColumnResizeByContent?: ReactRegularEventHandler<{ columnId: string }>;
  onHeaderMenuBeforeMenuShow?: ReactRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onHeaderMenuAfterMenuShow?: ReactRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onHideColumns?: ReactRegularEventHandler<{ columns: Column[]; hiddenColumn: Column[] }>;
  onItemsAdded?: ReactRegularEventHandler<any[]>;
  onItemsDeleted?: ReactRegularEventHandler<any[]>;
  onItemsUpdated?: ReactRegularEventHandler<any[]>;
  onItemsUpserted?: ReactRegularEventHandler<any[]>;
  onFullResizeByContentRequested?: ReactRegularEventHandler<{ caller: string }>;
  onGridStateChanged?: ReactRegularEventHandler<GridStateChange>;
  onBeforePaginationChange?: ReactRegularEventHandler<PaginationMetadata, boolean | void>;
  onPaginationChanged?: ReactRegularEventHandler<PaginationMetadata>;
  onPaginationRefreshed?: ReactRegularEventHandler<PaginationMetadata>;
  onPaginationVisibilityChanged?: ReactRegularEventHandler<{ visible: boolean }>;
  onPaginationSetCursorBased?: ReactRegularEventHandler<{ isCursorBased: boolean }>;
  onGridBeforeResize?: ReactRegularEventHandler<void>;
  onGridAfterResize?: ReactRegularEventHandler<GridSize | undefined>;
  onBeforeResizeByContent?: ReactRegularEventHandler<void>;
  onAfterResizeByContent?: ReactRegularEventHandler<{
    readItemCount: number;
    calculateColumnWidths: { [x: string]: number | undefined; [x: number]: number | undefined };
  }>;
  onSortCleared?: ReactRegularEventHandler<boolean>;
  onFilterChanged?: ReactRegularEventHandler<CurrentFilter[]>;
  onFilterCleared?: ReactRegularEventHandler<boolean>;
  onReactGridCreated?: ReactRegularEventHandler<any>;
  onSortChanged?: ReactRegularEventHandler<CurrentSorter[]>;
  onTreeItemToggled?: ReactRegularEventHandler<TreeToggleStateChange>;
  onTreeFullToggleEnd?: ReactRegularEventHandler<TreeToggleStateChange>;
  onTreeFullToggleStart?: ReactRegularEventHandler<TreeToggleStateChange>;
  onLanguageChange?: ReactRegularEventHandler<string>;
}
