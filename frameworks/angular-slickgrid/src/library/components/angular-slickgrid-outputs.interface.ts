import {
  type Column,
  type DragRowMove,
  type GridStateChange,
  type OnActiveCellChangedEventArgs,
  type OnAddNewRowEventArgs,
  type OnAutosizeColumnsEventArgs,
  type OnBeforeAppendCellEventArgs,
  type OnBeforeCellEditorDestroyEventArgs,
  type OnBeforeColumnsResizeEventArgs,
  type OnBeforeEditCellEventArgs,
  type OnBeforeFooterRowCellDestroyEventArgs,
  type OnBeforeHeaderCellDestroyEventArgs,
  type OnBeforeHeaderRowCellDestroyEventArgs,
  type OnBeforeSetColumnsEventArgs,
  type OnCellChangeEventArgs,
  type OnCellCssStylesChangedEventArgs,
  type OnClickEventArgs,
  type OnColumnsDragEventArgs,
  type OnColumnsReorderedEventArgs,
  type OnColumnsResizeDblClickEventArgs,
  type OnColumnsResizedEventArgs,
  type OnCompositeEditorChangeEventArgs,
  type OnDblClickEventArgs,
  type OnDragReplaceCellsEventArgs,
  type OnFooterClickEventArgs,
  type OnFooterContextMenuEventArgs,
  type OnFooterRowCellRenderedEventArgs,
  type OnGroupCollapsedEventArgs,
  type OnGroupExpandedEventArgs,
  type OnHeaderCellRenderedEventArgs,
  type OnHeaderClickEventArgs,
  type OnHeaderContextMenuEventArgs,
  type OnHeaderMouseEventArgs,
  type OnHeaderRowCellRenderedEventArgs,
  type OnKeyDownEventArgs,
  type OnRenderedEventArgs,
  type OnRowCountChangedEventArgs,
  type OnRowsChangedEventArgs,
  type OnRowsOrCountChangedEventArgs,
  type OnScrollEventArgs,
  type OnSelectedRowsChangedEventArgs,
  type OnSetItemsCalledEventArgs,
  type OnSetOptionsEventArgs,
  type OnValidationErrorEventArgs,
  type PagingInfo,
  type SingleColumnSort,
  type SlickDataView,
  type SlickGrid,
} from '@slickgrid-universal/common';
import type { AngularGridInstance } from '../models/index';

/**
 * Generic type for wrapping event output with detail property
 * Used for typed Angular output() signals that need both eventData and args
 *
 * @template T - The event function type from AngularSlickgridOutputs interface
 */
export type SlickEventOutput<T extends (...args: any) => any> = {
  detail: {
    eventData: any;
    args: Parameters<T>[0];
  };
};
export type RegularEventOutput<T extends (...args: any) => any> = {
  detail: Parameters<T>[0];
};

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
  onBeforeSearchChange: (e: OnCellChangeEventArgs) => void;
  onBeforeCellEditorDestroy: (e: OnBeforeCellEditorDestroyEventArgs) => void;
  onBeforeColumnsResize: (e: OnBeforeColumnsResizeEventArgs) => void;
  onBeforeDestroy: (e: { grid: SlickGrid }) => void;
  onBeforeEditCell: (e: OnBeforeEditCellEventArgs) => void;
  onBeforeHeaderCellDestroy: (e: OnBeforeHeaderCellDestroyEventArgs) => void;
  onBeforeHeaderRowCellDestroy: (e: OnBeforeHeaderRowCellDestroyEventArgs) => void;
  onBeforeFooterRowCellDestroy: (e: OnBeforeFooterRowCellDestroyEventArgs) => void;
  onBeforeSetColumns: (e: OnBeforeSetColumnsEventArgs) => void;
  onBeforeSort: (e: SingleColumnSort) => void;
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

  // Slickgrid-Universal Events
  onAfterExportToExcel: (e: any) => void;
  onBeforeExportToExcel: (e: any) => void;
  onBeforeFilterChange: (e: any) => void;
  onBeforeFilterClear: (e: any) => void;
  onBeforeSortChange: (e: any) => void;
  onBeforeToggleTreeCollapse: (e: any) => void;
  onContextMenuClearGrouping: (e: any) => void;
  onContextMenuCollapseAllGroups: (e: any) => void;
  onContextMenuExpandAllGroups: (e: any) => void;
  onAfterMenuShow: (e: any) => void;
  onBeforeMenuShow: (e: any) => void;
  onBeforeMenuClose: (e: any) => void;
  onCommand: (e: any) => void;
  onOptionSelected: (e: any) => void;
  onColumnPickerColumnsChanged: (e: any) => void;
  onColumnsChanged: (e: {
    columnId: string;
    showing: boolean;
    allColumns: Column[];
    visibleColumns: Column[];
    columns: Column[];
    grid: SlickGrid;
  }) => void;
  onGridMenuMenuClose: (e: any) => void;
  onGridMenuBeforeMenuShow: (e: any) => void;
  onGridMenuAfterMenuShow: (e: any) => void;
  onGridMenuClearAllPinning: (e: any) => void;
  onGridMenuClearAllFilters: (e: any) => void;
  onGridMenuClearAllSorting: (e: any) => void;
  onGridMenuColumnsChanged: (e: any) => void;
  onGridMenuCommand: (e: any) => void;
  onHeaderButtonCommand: (e: any) => void;
  onCopyCells: (e: any) => void;
  onCopyCancelled: (e: any) => void;
  onPasteCells: (e: any) => void;
  onBeforePasteCell: (e: { cell: number; row: number; item: any; columnDef: Column; value: any }) => void;
  onHeaderMenuCommand: (e: any) => void;
  onHeaderMenuColumnResizeByContent: (e: { columnId: string }) => void;
  onHeaderMenuBeforeMenuShow: (e: any) => void;
  onHeaderMenuAfterMenuShow: (e: any) => void;
  onHideColumns: (e: { columns: Column[]; hiddenColumn: Column[] }) => void;
  onItemsAdded: (e: any) => void;
  onItemsDeleted: (e: any[]) => void;
  onItemsUpdated: (e: any) => void;
  onItemsUpserted: (e: any) => void;
  onFullResizeByContentRequested: (e: any) => void;
  onGridStateChanged: (e: GridStateChange) => void;
  onBeforePaginationChange: (e: any) => void;
  onPaginationChanged: (e: any) => void;
  onPaginationRefreshed: (e: any) => void;
  onPaginationVisibilityChanged: (e: any) => void;
  onPaginationSetCursorBased: (e: any) => void;
  onGridBeforeResize: (e: any) => void;
  onGridAfterResize: (e: any) => void;
  onBeforeResizeByContent: (e: any) => void;
  onAfterResizeByContent: (e: any) => void;
  onSelectedRowIdsChanged: (e: any) => void;
  onSortCleared: (e: any) => void;
  onFilterChanged: (e: any) => void;
  onFilterCleared: (e: any) => void;
  onSortChanged: (e: any) => void;
  onToggleTreeCollapsed: (e: any) => void;
  onTreeItemToggled: (e: any) => void;
  onTreeFullToggleEnd: (e: any) => void;
  onTreeFullToggleStart: (e: any) => void;

  // Angular-Slickgrid specific events
  onBeforeGridCreate: (e: boolean) => void;
  onGridCreated: (e: SlickGrid) => void;
  onDataviewCreated: (e: SlickDataView) => void;
  onAngularGridCreated: (e: AngularGridInstance) => void;
  onBeforeGridDestroy: (e: SlickGrid) => void;
  onAfterGridDestroyed: (e: boolean) => void;
  onLanguageChange: (e: void) => void;
}
