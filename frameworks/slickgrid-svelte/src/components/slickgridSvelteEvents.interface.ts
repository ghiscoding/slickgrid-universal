import type {
  Column,
  CurrentFilter,
  CurrentSorter,
  DragRowMove,
  ExportTextDownloadOption,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridSize,
  GridStateChange,
  HeaderButtonOnCommandArgs,
  HeaderMenuCommandItemCallbackArgs,
  MenuCommandItemCallbackArgs,
  MenuFromCellCallbackArgs,
  OnActiveCellChangedEventArgs,
  OnAddNewRowEventArgs,
  OnAutosizeColumnsEventArgs,
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
  OnContextMenuArgs,
  OnDblClickEventArgs,
  OnDragReplaceCellsEventArgs,
  OnFooterClickEventArgs,
  OnFooterContextMenuEventArgs,
  OnFooterRowCellRenderedEventArgs,
  OnFormattedDataCacheCompletedEventArgs,
  OnFormattedDataCacheProgressEventArgs,
  OnGroupCollapsedEventArgs,
  OnGroupExpandedEventArgs,
  OnHeaderCellRenderedEventArgs,
  OnHeaderClickEventArgs,
  OnHeaderContextMenuEventArgs,
  OnHeaderMouseEventArgs,
  OnHeaderRowCellRenderedEventArgs,
  OnKeyDownEventArgs,
  OnLocalSortChangedArgs,
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
  PaginationMetadata,
  PagingInfo,
  SingleColumnSort,
  SlickGrid,
  SlickRange,
  TreeToggleStateChange,
} from '@slickgrid-universal/common';
import type { SlickgridSvelteInstance } from '../models/slickgridSvelteInstance.interface.js';

export type SvelteSlickEventHandler<T, R = void> = (event: CustomEvent<{ eventData: any; args: T }>) => R;
export type SvelteRegularEventHandler<T, R = void> = (event: CustomEvent<T>) => R;

/** Typed SlickGrid, DataView, extension and service event callbacks. */
export interface SvelteGridEventHandlers {
  onBeforeGridCreate?: SvelteRegularEventHandler<boolean>;
  onDataviewCreated?: SvelteRegularEventHandler<any>;
  onGridCreated?: SvelteRegularEventHandler<SlickGrid>;
  // Slick Grid events
  onActiveCellChanged?: SvelteSlickEventHandler<OnActiveCellChangedEventArgs>;
  onActiveCellPositionChanged?: SvelteSlickEventHandler<{ grid: SlickGrid }>;
  onAddNewRow?: SvelteSlickEventHandler<OnAddNewRowEventArgs>;
  onAutosizeColumns?: SvelteSlickEventHandler<OnAutosizeColumnsEventArgs>;
  onBeforeCellEditorDestroy?: SvelteSlickEventHandler<OnBeforeCellEditorDestroyEventArgs>;
  onBeforeColumnsResize?: SvelteSlickEventHandler<OnBeforeColumnsResizeEventArgs>;
  onBeforeDestroy?: SvelteSlickEventHandler<{ grid: SlickGrid }>;
  onBeforeEditCell?: SvelteSlickEventHandler<OnBeforeEditCellEventArgs>;
  onBeforeHeaderCellDestroy?: SvelteSlickEventHandler<OnBeforeHeaderCellDestroyEventArgs>;
  onBeforeHeaderRowCellDestroy?: SvelteSlickEventHandler<OnBeforeHeaderRowCellDestroyEventArgs>;
  onBeforeFooterRowCellDestroy?: SvelteSlickEventHandler<OnBeforeFooterRowCellDestroyEventArgs>;
  onBeforeSetColumns?: SvelteSlickEventHandler<OnBeforeSetColumnsEventArgs>;
  onBeforeSort?: SvelteSlickEventHandler<SingleColumnSort, boolean | void>;
  onCellChange?: SvelteSlickEventHandler<OnCellChangeEventArgs>;
  onCellCssStylesChanged?: SvelteSlickEventHandler<OnCellCssStylesChangedEventArgs>;
  onClick?: SvelteSlickEventHandler<OnClickEventArgs>;
  onColumnsDrag?: SvelteSlickEventHandler<OnColumnsDragEventArgs>;
  onColumnsReordered?: SvelteSlickEventHandler<OnColumnsReorderedEventArgs>;
  onColumnsResized?: SvelteSlickEventHandler<OnColumnsResizedEventArgs>;
  onColumnsResizeDblClick?: SvelteSlickEventHandler<OnColumnsResizeDblClickEventArgs>;
  onCompositeEditorChange?: SvelteSlickEventHandler<OnCompositeEditorChangeEventArgs>;
  onContextMenu?: SvelteSlickEventHandler<OnContextMenuArgs>;
  onDrag?: SvelteSlickEventHandler<DragRowMove>;
  onDragEnd?: SvelteSlickEventHandler<DragRowMove>;
  onDragInit?: SvelteSlickEventHandler<DragRowMove>;
  onDragStart?: SvelteSlickEventHandler<DragRowMove>;
  onDragReplaceCells?: SvelteSlickEventHandler<OnDragReplaceCellsEventArgs>;
  onDblClick?: SvelteSlickEventHandler<OnDblClickEventArgs>;
  onFooterContextMenu?: SvelteSlickEventHandler<OnFooterContextMenuEventArgs>;
  onFooterRowCellRendered?: SvelteSlickEventHandler<OnFooterRowCellRenderedEventArgs>;
  onHeaderCellRendered?: SvelteSlickEventHandler<OnHeaderCellRenderedEventArgs>;
  onFooterClick?: SvelteSlickEventHandler<OnFooterClickEventArgs>;
  onHeaderClick?: SvelteSlickEventHandler<OnHeaderClickEventArgs>;
  onHeaderContextMenu?: SvelteSlickEventHandler<OnHeaderContextMenuEventArgs>;
  onHeaderMouseEnter?: SvelteSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderMouseLeave?: SvelteSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderRowCellRendered?: SvelteSlickEventHandler<OnHeaderRowCellRenderedEventArgs>;
  onHeaderRowMouseEnter?: SvelteSlickEventHandler<OnHeaderMouseEventArgs>;
  onHeaderRowMouseLeave?: SvelteSlickEventHandler<OnHeaderMouseEventArgs>;
  onKeyDown?: SvelteSlickEventHandler<OnKeyDownEventArgs>;
  onMouseEnter?: SvelteSlickEventHandler<{ grid: SlickGrid }>;
  onMouseLeave?: SvelteSlickEventHandler<{ grid: SlickGrid }>;
  onValidationError?: SvelteSlickEventHandler<OnValidationErrorEventArgs>;
  onViewportChanged?: SvelteSlickEventHandler<{ grid: SlickGrid }>;
  onRendered?: SvelteSlickEventHandler<OnRenderedEventArgs>;
  onSelectedRowsChanged?: SvelteSlickEventHandler<OnSelectedRowsChangedEventArgs>;
  onSetOptions?: SvelteSlickEventHandler<OnSetOptionsEventArgs>;
  onScroll?: SvelteSlickEventHandler<OnScrollEventArgs>;
  onSort?: SvelteSlickEventHandler<SingleColumnSort>;

  // Slick DataView events
  onBeforePagingInfoChanged?: SvelteSlickEventHandler<PagingInfo>;
  onFormattedDataCacheProgress?: SvelteSlickEventHandler<OnFormattedDataCacheProgressEventArgs>;
  onFormattedDataCacheCompleted?: SvelteSlickEventHandler<OnFormattedDataCacheCompletedEventArgs>;
  onGroupExpanded?: SvelteSlickEventHandler<OnGroupExpandedEventArgs>;
  onGroupCollapsed?: SvelteSlickEventHandler<OnGroupCollapsedEventArgs>;
  onPagingInfoChanged?: SvelteSlickEventHandler<PagingInfo>;
  onRowCountChanged?: SvelteSlickEventHandler<OnRowCountChangedEventArgs>;
  onRowsChanged?: SvelteSlickEventHandler<OnRowsChangedEventArgs>;
  onRowsOrCountChanged?: SvelteSlickEventHandler<OnRowsOrCountChangedEventArgs>;
  onSelectedRowIdsChanged?: SvelteSlickEventHandler<OnSelectedRowIdsChangedEventArgs>;
  onSetItemsCalled?: SvelteSlickEventHandler<OnSetItemsCalledEventArgs>;

  // other Slick Events
  onAfterMenuShow?: SvelteSlickEventHandler<MenuFromCellCallbackArgs>;
  onBeforeMenuClose?: SvelteSlickEventHandler<MenuFromCellCallbackArgs>;
  onBeforeMenuShow?: SvelteSlickEventHandler<MenuFromCellCallbackArgs>;
  onColumnsChanged?: SvelteSlickEventHandler<OnColumnsChangedArgs>;
  onCommand?: SvelteSlickEventHandler<MenuCommandItemCallbackArgs>;
  onGridMenuColumnsChanged?: SvelteSlickEventHandler<OnColumnsChangedArgs>;
  onMenuClose?: SvelteSlickEventHandler<GridMenuEventWithElementCallbackArgs>;
  onCopyCells?: SvelteSlickEventHandler<{ ranges: SlickRange[] }>;
  onCopyCancelled?: SvelteSlickEventHandler<{ ranges: SlickRange[] }>;
  onPasteCells?: SvelteSlickEventHandler<{ ranges: SlickRange[] }>;
  onBeforePasteCell?: SvelteSlickEventHandler<{ cell: number; row: number; item: any; columnDef: Column; value: any }>;

  // Slickgrid-React or Slickgrid-Universal events
  onAfterExportToExcel?: SvelteRegularEventHandler<{ filename: string; mimeType: string } | { error: any }>;
  onBeforeExportToExcel?: SvelteRegularEventHandler<boolean>;
  onAfterExportToPdf?: SvelteRegularEventHandler<{ filename: string } | { error: any }>;
  onBeforeExportToPdf?: SvelteRegularEventHandler<boolean>;
  onBeforeExportToTextFile?: SvelteRegularEventHandler<boolean>;
  onAfterExportToTextFile?: SvelteRegularEventHandler<ExportTextDownloadOption>;
  onBeforeFilterChange?: SvelteRegularEventHandler<CurrentFilter[]>;
  onBeforeFilterClear?: SvelteRegularEventHandler<{ columnId: string } | boolean>;
  onBeforeSearchChange?: SvelteRegularEventHandler<OnSearchChangeEventArgs, boolean | void>;
  onBeforeSortChange?: SvelteRegularEventHandler<OnLocalSortChangedArgs>;
  onContextMenuClearGrouping?: SvelteRegularEventHandler<void>;
  onContextMenuCollapseAllGroups?: SvelteRegularEventHandler<void>;
  onContextMenuExpandAllGroups?: SvelteRegularEventHandler<void>;
  onBeforeGridDestroy?: SvelteRegularEventHandler<SlickGrid>;
  onColumnPickerColumnsChanged?: SvelteRegularEventHandler<OnColumnsChangedArgs>;
  onGridMenuMenuClose?: SvelteRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuBeforeMenuShow?: SvelteRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuAfterMenuShow?: SvelteRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onGridMenuClearAllPinning?: SvelteRegularEventHandler<void>;
  onGridMenuClearAllFilters?: SvelteRegularEventHandler<void>;
  onGridMenuClearAllSorting?: SvelteRegularEventHandler<void>;
  onGridMenuCommand?: SvelteRegularEventHandler<GridMenuCommandItemCallbackArgs>;
  onHeaderButtonCommand?: SvelteRegularEventHandler<HeaderButtonOnCommandArgs>;
  onHeaderMenuCommand?: SvelteRegularEventHandler<MenuCommandItemCallbackArgs>;
  onHeaderMenuColumnResizeByContent?: SvelteRegularEventHandler<{ columnId: string }>;
  onHeaderMenuBeforeMenuShow?: SvelteRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onHeaderMenuAfterMenuShow?: SvelteRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onHideColumns?: SvelteRegularEventHandler<{ columns: Column[]; hiddenColumn: Column[] }>;
  onItemsAdded?: SvelteRegularEventHandler<any[]>;
  onItemsDeleted?: SvelteRegularEventHandler<any[]>;
  onItemsUpdated?: SvelteRegularEventHandler<any[]>;
  onItemsUpserted?: SvelteRegularEventHandler<any[]>;
  onFullResizeByContentRequested?: SvelteRegularEventHandler<{ caller: string }>;
  onGridStateChanged?: SvelteRegularEventHandler<GridStateChange>;
  onBeforePaginationChange?: SvelteRegularEventHandler<PaginationMetadata, boolean | void>;
  onPaginationChanged?: SvelteRegularEventHandler<PaginationMetadata>;
  onPaginationRefreshed?: SvelteRegularEventHandler<PaginationMetadata>;
  onPaginationVisibilityChanged?: SvelteRegularEventHandler<{ visible: boolean }>;
  onPaginationSetCursorBased?: SvelteRegularEventHandler<{ isCursorBased: boolean }>;
  onGridBeforeResize?: SvelteRegularEventHandler<void>;
  onGridAfterResize?: SvelteRegularEventHandler<GridSize | undefined>;
  onBeforeResizeByContent?: SvelteRegularEventHandler<void>;
  onAfterResizeByContent?: SvelteRegularEventHandler<{
    readItemCount: number;
    calculateColumnWidths: { [x: string]: number | undefined; [x: number]: number | undefined };
  }>;
  onSortCleared?: SvelteRegularEventHandler<boolean>;
  onFilterChanged?: SvelteRegularEventHandler<CurrentFilter[]>;
  onFilterCleared?: SvelteRegularEventHandler<boolean>;
  onSvelteGridCreated?: SvelteRegularEventHandler<SlickgridSvelteInstance>;
  onSortChanged?: SvelteRegularEventHandler<CurrentSorter[]>;
  onTreeItemToggled?: SvelteRegularEventHandler<TreeToggleStateChange>;
  onTreeFullToggleEnd?: SvelteRegularEventHandler<TreeToggleStateChange>;
  onTreeFullToggleStart?: SvelteRegularEventHandler<TreeToggleStateChange>;
  onLanguageChange?: SvelteRegularEventHandler<string>;
}
