import type {
  Column,
  ColumnSort,
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
  PaginationMetadata,
  PagingInfo,
  SingleColumnSort,
  SlickDataView,
  SlickGrid,
  SlickRange,
  TreeToggleStateChange,
} from '@slickgrid-universal/common';
import type { AngularGridInstance } from '../models/index';

/**
 * Generic type for wrapping event output with detail property
 * Used for typed Angular output() signals that need both eventData and args
 * Extends CustomEvent for compatibility with event handlers
 * @template T - The event function type from AngularSlickgridOutputs interface
 */
export type SlickEventOutput<T extends (...args: any) => any> = CustomEvent<{
  eventData: any;
  args: Parameters<T>[0];
}>;

/**
 * Generic type for wrapping simple event output with detail property
 * Extends CustomEvent for compatibility with event handlers
 * @template T - The event function type from AngularSlickgridOutputs interface
 */
export type RegularEventOutput<T extends (...args: any) => any> = CustomEvent<Parameters<T>[0]>;

/**
 * Angular-Slickgrid Output Events Interface
 * Defines all typed output signals for strict template type checking in Angular 17+
 * These are automatically managed by the AngularSlickgridComponent and should be used in templates
 *
 * @example
 * ```html
 * <angular-slickgrid
 *   (onActiveCellChanged)="handleCellChange($event)"
 *   (onAngularGridCreated)="handleGridCreated($event)"
 * ></angular-slickgrid>
 * ```
 */
export interface AngularSlickgridOutputs {
  // SlickGrid Events
  onActiveCellChanged: (e: OnActiveCellChangedEventArgs) => void;
  onActiveCellPositionChanged: (e: { grid: SlickGrid }) => void;
  onAddNewRow: (e: OnAddNewRowEventArgs) => void;
  onAutosizeColumns: (e: OnAutosizeColumnsEventArgs) => void;
  onBeforeAppendCell: (e: OnBeforeAppendCellEventArgs) => void;
  onBeforeCellEditorDestroy: (e: OnBeforeCellEditorDestroyEventArgs) => void;
  onBeforeColumnsResize: (e: OnBeforeColumnsResizeEventArgs) => void;
  onBeforeDestroy: (e: { grid: SlickGrid }) => void;
  onBeforeEditCell: (e: OnBeforeEditCellEventArgs) => void;
  onBeforeHeaderCellDestroy: (e: OnBeforeHeaderCellDestroyEventArgs) => void;
  onBeforeHeaderRowCellDestroy: (e: OnBeforeHeaderRowCellDestroyEventArgs) => void;
  onBeforeFooterRowCellDestroy: (e: OnBeforeFooterRowCellDestroyEventArgs) => void;
  onBeforeSetColumns: (e: OnBeforeSetColumnsEventArgs) => void;
  onBeforeSort: (e: SingleColumnSort) => boolean | void;
  onCellChange: (e: OnCellChangeEventArgs) => void;
  onCellCssStylesChanged: (e: OnCellCssStylesChangedEventArgs) => void;
  onClick: (e: OnClickEventArgs) => void;
  onColumnsDrag: (e: OnColumnsDragEventArgs) => void;
  onColumnsReordered: (e: OnColumnsReorderedEventArgs) => void;
  onColumnsResized: (e: OnColumnsResizedEventArgs) => void;
  onColumnsResizeDblClick: (e: OnColumnsResizeDblClickEventArgs) => void;
  onCompositeEditorChange: (e: OnCompositeEditorChangeEventArgs) => void;
  onContextMenu: (e: { grid: SlickGrid }) => void;
  onDrag: (e: DragRowMove) => void;
  onDragEnd: (e: DragRowMove) => void;
  onDragInit: (e: DragRowMove) => void;
  onDragStart: (e: DragRowMove) => void;
  onDragReplaceCells: (e: OnDragReplaceCellsEventArgs) => void;
  onDblClick: (e: OnDblClickEventArgs) => void;
  onFooterContextMenu: (e: OnFooterContextMenuEventArgs) => void;
  onFooterRowCellRendered: (e: OnFooterRowCellRenderedEventArgs) => void;
  onHeaderCellRendered: (e: OnHeaderCellRenderedEventArgs) => void;
  onFooterClick: (e: OnFooterClickEventArgs) => void;
  onHeaderClick: (e: OnHeaderClickEventArgs) => void;
  onHeaderContextMenu: (e: OnHeaderContextMenuEventArgs) => void;
  onHeaderMouseEnter: (e: OnHeaderMouseEventArgs) => void;
  onHeaderMouseLeave: (e: OnHeaderMouseEventArgs) => void;
  onHeaderRowCellRendered: (e: OnHeaderRowCellRenderedEventArgs) => void;
  onHeaderRowMouseEnter: (e: OnHeaderMouseEventArgs) => void;
  onHeaderRowMouseLeave: (e: OnHeaderMouseEventArgs) => void;
  onKeyDown: (e: OnKeyDownEventArgs) => void;
  onMouseEnter: (e: { grid: SlickGrid }) => void;
  onMouseLeave: (e: { grid: SlickGrid }) => void;
  onValidationError: (e: OnValidationErrorEventArgs) => void;
  onViewportChanged: (e: { grid: SlickGrid }) => void;
  onRendered: (e: OnRenderedEventArgs) => void;
  onSelectedRowsChanged: (e: OnSelectedRowsChangedEventArgs) => void;
  onSetOptions: (e: OnSetOptionsEventArgs) => void;
  onScroll: (e: OnScrollEventArgs) => void;
  onSort: (e: SingleColumnSort) => void;

  // SlickDataView Events
  onBeforePagingInfoChanged: (e: PagingInfo) => void;
  onGroupExpanded: (e: OnGroupExpandedEventArgs) => void;
  onGroupCollapsed: (e: OnGroupCollapsedEventArgs) => void;
  onPagingInfoChanged: (e: PagingInfo) => void;
  onRowCountChanged: (e: OnRowCountChangedEventArgs) => void;
  onRowsChanged: (e: OnRowsChangedEventArgs) => void;
  onRowsOrCountChanged: (e: OnRowsOrCountChangedEventArgs) => void;
  onSetItemsCalled: (e: OnSetItemsCalledEventArgs) => void;

  // other Slick Events
  onAfterMenuShow: (e: MenuFromCellCallbackArgs) => void;
  onBeforeMenuClose: (e: MenuFromCellCallbackArgs) => void;
  onBeforeMenuShow: (e: MenuFromCellCallbackArgs) => void;
  onColumnsChanged: (e: OnColumnsChangedArgs) => void;
  onCommand: (e: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs) => void;
  onGridMenuColumnsChanged: (e: OnColumnsChangedArgs) => void;
  onMenuClose: (e: GridMenuEventWithElementCallbackArgs) => void;
  onCopyCells: (e: { ranges: SlickRange[] }) => void;
  onCopyCancelled: (e: { ranges: SlickRange[] }) => void;
  onPasteCells: (e: { ranges: SlickRange[] }) => void;
  onBeforePasteCell: (e: { cell: number; row: number; item: any; columnDef: Column; value: any }) => void;

  // Slickgrid-Universal Events
  onAfterExportToExcel: (e: { filename: string; mimeType: string }) => void;
  onBeforeExportToExcel: (e: boolean) => void;
  onBeforeExportToTextFile?: (e: boolean) => void;
  onAfterExportToTextFile?: (e: ExportTextDownloadOption) => void;
  onBeforeFilterChange: (e: CurrentFilter[]) => void;
  onBeforeFilterClear: (e: { columnId: string } | boolean) => void;
  onBeforeSearchChange: (e: OnSearchChangeEventArgs) => boolean | void;
  onBeforeSortChange: (e: Array<ColumnSort & { clearSortTriggered?: boolean }>) => void;
  onContextMenuClearGrouping: () => void;
  onContextMenuCollapseAllGroups: () => void;
  onContextMenuExpandAllGroups: () => void;
  onOptionSelected: (e: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs) => void;
  onColumnPickerColumnsChanged: (e: OnColumnsChangedArgs) => void;
  onGridMenuMenuClose: (e: GridMenuEventWithElementCallbackArgs) => void;
  onGridMenuBeforeMenuShow: (e: GridMenuEventWithElementCallbackArgs) => void;
  onGridMenuAfterMenuShow: (e: GridMenuEventWithElementCallbackArgs) => void;
  onGridMenuClearAllPinning: () => void;
  onGridMenuClearAllFilters: () => void;
  onGridMenuClearAllSorting: () => void;
  onGridMenuCommand: (e: GridMenuCommandItemCallbackArgs) => void;
  onHeaderButtonCommand: (e: HeaderButtonOnCommandArgs) => void;
  onHeaderMenuCommand: (e: MenuCommandItemCallbackArgs) => void;
  onHeaderMenuColumnResizeByContent: (e: { columnId: string }) => void;
  onHeaderMenuBeforeMenuShow: (e: HeaderMenuCommandItemCallbackArgs) => void;
  onHeaderMenuAfterMenuShow: (e: HeaderMenuCommandItemCallbackArgs) => void;
  onHideColumns: (e: { columns: Column[]; hiddenColumn: Column[] }) => void;
  onItemsAdded: (e: any[]) => void;
  onItemsDeleted: (e: any[]) => void;
  onItemsUpdated: (e: any[]) => void;
  onItemsUpserted: (e: any[]) => void;
  onFullResizeByContentRequested: (e: { caller: string }) => void;
  onGridStateChanged: (e: GridStateChange) => void;
  onBeforePaginationChange: (e: PaginationMetadata) => boolean | void;
  onPaginationChanged: (e: PaginationMetadata) => void;
  onPaginationRefreshed: (e: PaginationMetadata) => void;
  onPaginationVisibilityChanged: (e: { visible: boolean }) => void;
  onPaginationSetCursorBased: (e: { isCursorBased: boolean }) => void;
  onGridBeforeResize: () => void;
  onGridAfterResize: (e: GridSize | undefined) => void;
  onBeforeResizeByContent: () => void;
  onAfterResizeByContent: (e: {
    readItemCount: number;
    calculateColumnWidths: { [x: string]: number | undefined; [x: number]: number | undefined };
  }) => void;
  onSelectedRowIdsChanged: (e: OnSelectedRowIdsChangedEventArgs) => void;
  onSortCleared: (e: boolean) => void;
  onFilterChanged: (e: CurrentFilter[]) => void;
  onFilterCleared: (e: boolean) => void;
  onSortChanged: (e: CurrentSorter[]) => void;
  onTreeItemToggled: (e: TreeToggleStateChange) => void;
  onTreeFullToggleEnd: (e: TreeToggleStateChange) => void;
  onTreeFullToggleStart: (e: TreeToggleStateChange) => void;

  // Angular-Slickgrid specific events
  onBeforeGridCreate: (e: boolean) => void;
  onGridCreated: (e: SlickGrid) => void;
  onDataviewCreated: (e: SlickDataView) => void;
  onAngularGridCreated: (e: AngularGridInstance) => void;
  onBeforeGridDestroy: (e: SlickGrid) => void;
  onAfterGridDestroyed: (e: boolean) => void;
  onLanguageChange: (lang: string) => void;
}
