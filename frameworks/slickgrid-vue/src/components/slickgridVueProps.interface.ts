import type {
  Column,
  DragRowMove,
  ExtensionList,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
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
  OnColumnsDragEventArgs,
  OnColumnsReorderedEventArgs,
  OnColumnsResizeDblClickEventArgs,
  OnColumnsResizedEventArgs,
  OnCompositeEditorChangeEventArgs,
  OnDblClickEventArgs,
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
  OnSelectedRowsChangedEventArgs,
  OnSetItemsCalledEventArgs,
  OnSetOptionsEventArgs,
  OnValidationErrorEventArgs,
  PaginationChangedArgs,
  PagingInfo,
  SingleColumnSort,
  SlickControlList,
  SlickGrid,
  SlickPluginList,
  SlickRange,
} from '@slickgrid-universal/common';
import type { Slot } from 'vue';
import type { SlickgridVueInstance } from '../models/index.js';

export interface SlickgridVueProps {
  header?: Slot;
  footer?: Slot;
  extensions?: ExtensionList<SlickControlList | SlickPluginList>;
  gridId: string;
  instances?: SlickgridVueInstance;

  // Custom Events list
  // ---------------------
  // NOTE: we need to add an extra "onOn" prefix to all events because of how VueJS handles events
  // for example onOnClick can actually be used as "@onClick" event

  // Slick Grid events
  onOnActiveCellChanged?: (e: CustomEvent<{ eventData: any; args: OnActiveCellChangedEventArgs }>) => void;
  onOnActiveCellPositionChanged?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnAddNewRow?: (e: CustomEvent<{ eventData: any; args: OnAddNewRowEventArgs }>) => void;
  onOnAutosizeColumns?: (e: CustomEvent<{ eventData: any; args: OnAutosizeColumnsEventArgs }>) => void;
  onOnBeforeAppendCell?: (e: CustomEvent<{ eventData: any; args: OnBeforeAppendCellEventArgs }>) => void;
  onOnBeforeSearchChange?: (e: CustomEvent<{ eventData: any; args: OnCellChangeEventArgs }>) => void;
  onOnBeforeCellEditorDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeCellEditorDestroyEventArgs }>) => void;
  onOnBeforeColumnsResize?: (e: CustomEvent<{ eventData: any; args: OnBeforeColumnsResizeEventArgs }>) => void;
  onOnBeforeDestroy?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnBeforeEditCell?: (e: CustomEvent<{ eventData: any; args: OnBeforeEditCellEventArgs }>) => void;
  onOnBeforeHeaderCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeHeaderCellDestroyEventArgs }>) => void;
  onOnBeforeHeaderRowCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeHeaderRowCellDestroyEventArgs }>) => void;
  onOnBeforeFooterRowCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeFooterRowCellDestroyEventArgs }>) => void;
  onOnBeforeSetColumns?: (e: CustomEvent<{ eventData: any; args: OnBeforeSetColumnsEventArgs }>) => void;
  onOnBeforeSort?: (e: CustomEvent<{ eventData: any; args: SingleColumnSort }>) => void;
  onOnCellChange?: (e: CustomEvent<{ eventData: any; args: OnCellChangeEventArgs }>) => void;
  onOnCellCssStylesChanged?: (e: CustomEvent<{ eventData: any; args: OnCellCssStylesChangedEventArgs }>) => void;
  onOnClick?: (e: CustomEvent<{ eventData: any; args: OnClickEventArgs }>) => void;
  onOnColumnsDrag?: (e: CustomEvent<{ eventData: any; args: OnColumnsDragEventArgs }>) => void;
  onOnColumnsReordered?: (e: CustomEvent<{ eventData: any; args: OnColumnsReorderedEventArgs }>) => void;
  onOnColumnsResized?: (e: CustomEvent<{ eventData: any; args: OnColumnsResizedEventArgs }>) => void;
  onOnColumnsResizeDblClick?: (e: CustomEvent<{ eventData: any; args: OnColumnsResizeDblClickEventArgs }>) => void;
  onOnCompositeEditorChange?: (e: CustomEvent<{ eventData: any; args: OnCompositeEditorChangeEventArgs }>) => void;
  onOnContextMenu?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnDrag?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onOnDragEnd?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onOnDragInit?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onOnDragStart?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onOnDblClick?: (e: CustomEvent<{ eventData: any; args: OnDblClickEventArgs }>) => void;
  onOnFooterContextMenu?: (e: CustomEvent<{ eventData: any; args: OnFooterContextMenuEventArgs }>) => void;
  onOnFooterRowCellRendered?: (e: CustomEvent<{ eventData: any; args: OnFooterRowCellRenderedEventArgs }>) => void;
  onOnHeaderCellRendered?: (e: CustomEvent<{ eventData: any; args: OnHeaderCellRenderedEventArgs }>) => void;
  onOnFooterClick?: (e: CustomEvent<{ eventData: any; args: OnFooterClickEventArgs }>) => void;
  onOnHeaderClick?: (e: CustomEvent<{ eventData: any; args: OnHeaderClickEventArgs }>) => void;
  onOnHeaderContextMenu?: (e: CustomEvent<{ eventData: any; args: OnHeaderContextMenuEventArgs }>) => void;
  onOnHeaderMouseEnter?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onOnHeaderMouseLeave?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onOnHeaderRowCellRendered?: (e: CustomEvent<{ eventData: any; args: OnHeaderRowCellRenderedEventArgs }>) => void;
  onOnHeaderRowMouseEnter?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onOnHeaderRowMouseLeave?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onOnKeyDown?: (e: CustomEvent<{ eventData: any; args: OnKeyDownEventArgs }>) => void;
  onOnMouseEnter?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnMouseLeave?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnValidationError?: (e: CustomEvent<{ eventData: any; args: OnValidationErrorEventArgs }>) => void;
  onOnViewportChanged?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onOnRendered?: (e: CustomEvent<{ eventData: any; args: OnRenderedEventArgs }>) => void;
  onOnSelectedRowsChanged?: (e: CustomEvent<{ eventData: any; args: OnSelectedRowsChangedEventArgs }>) => void;
  onOnSetOptions?: (e: CustomEvent<{ eventData: any; args: OnSetOptionsEventArgs }>) => void;
  onOnScroll?: (e: CustomEvent<{ eventData: any; args: OnScrollEventArgs }>) => void;
  onOnSort?: (e: CustomEvent<{ eventData: any; args: SingleColumnSort }>) => void;

  // Slick DataView events
  onOnBeforePagingInfoChanged?: (e: CustomEvent<{ eventData: any; args: PagingInfo }>) => void;
  onOnGroupExpanded?: (e: CustomEvent<{ eventData: any; args: OnGroupExpandedEventArgs }>) => void;
  onOnGroupCollapsed?: (e: CustomEvent<{ eventData: any; args: OnGroupCollapsedEventArgs }>) => void;
  onOnPagingInfoChanged?: (e: CustomEvent<{ eventData: any; args: PagingInfo }>) => void;
  onOnRowCountChanged?: (e: CustomEvent<{ eventData: any; args: OnRowCountChangedEventArgs }>) => void;
  onOnRowsChanged?: (e: CustomEvent<{ eventData: any; args: OnRowsChangedEventArgs }>) => void;
  onOnRowsOrCountChanged?: (e: CustomEvent<{ eventData: any; args: OnRowsOrCountChangedEventArgs }>) => void;
  onOnSetItemsCalled?: (e: CustomEvent<{ eventData: any; args: OnSetItemsCalledEventArgs }>) => void;

  // Slickgrid-Vue events
  onOnAfterExportToExcel?: (e: CustomEvent<any>) => void;
  onOnBeforeExportToExcel?: (e: CustomEvent<any>) => void;
  onOnBeforeFilterChange?: (e: CustomEvent<any>) => void;
  onOnBeforeFilterClear?: (e: CustomEvent<any>) => void;
  onOnBeforeSortChange?: (e: CustomEvent<any>) => void;
  onOnBeforeToggleTreeCollapse?: (e: CustomEvent<any>) => void;
  onOnContextMenuClearGrouping?: (e: CustomEvent<any>) => void;
  onOnContextMenuCollapseAllGroups?: (e: CustomEvent<any>) => void;
  onOnContextMenuExpandAllGroups?: (e: CustomEvent<any>) => void;
  onOnAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onOnBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onOnBeforeMenuClose?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onOnCommand?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs }>) => void;
  onOnOptionSelected?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs }>) => void;
  onOnColumnPickerColumnsChanged?: (
    e: CustomEvent<{
      eventData: any;
      args: {
        columnId: string;
        showing: boolean;
        allColumns: Column[];
        visibleColumns: Column[];
        columns: Column[];
        grid: SlickGrid;
      };
    }>
  ) => void;
  onOnColumnsChanged?: (
    e: CustomEvent<{
      eventData: any;
      args: {
        columnId: string;
        showing: boolean;
        allColumns: Column[];
        visibleColumns: Column[];
        columns: Column[];
        grid: SlickGrid;
      };
    }>
  ) => void;
  onOnGridMenuMenuClose?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onOnGridMenuBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onOnGridMenuAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onOnGridMenuClearAllPinning?: (e: CustomEvent<any>) => void;
  onOnGridMenuClearAllFilters?: (e: CustomEvent<any>) => void;
  onOnGridMenuClearAllSorting?: (e: CustomEvent<any>) => void;
  onOnGridMenuColumnsChanged?: (
    e: CustomEvent<{
      eventData: any;
      args: {
        columnId: string;
        showing: boolean;
        allColumns: Column[];
        visibleColumns: Column[];
        columns: Column[];
        grid: SlickGrid;
      };
    }>
  ) => void;
  onOnGridMenuCommand?: (e: CustomEvent<{ eventData: any; args: GridMenuCommandItemCallbackArgs }>) => void;
  onOnHeaderButtonCommand?: (e: CustomEvent<{ eventData: any; args: HeaderButtonOnCommandArgs }>) => void;
  onOnCopyCells?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onOnCopyCancelled?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onOnPasteCells?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onOnBeforePasteCell?: (
    e: CustomEvent<{ eventData: any; args: { cell: number; row: number; item: any; columnDef: Column; value: any } }>
  ) => void;
  onOnHideColumns?: (e: CustomEvent<{ eventData: any; args: { columns: Column[]; hiddenColumn: Column[] } }>) => void;
  onOnHeaderMenuCommand?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs }>) => void;
  onOnHeaderMenuColumnResizeByContent?: (e: CustomEvent<{ eventData: any; args: { columnId: string } }>) => void;
  onOnHeaderMenuBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: HeaderMenuCommandItemCallbackArgs }>) => void;
  onOnHeaderMenuAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: HeaderMenuCommandItemCallbackArgs }>) => void;
  onOnItemsAdded?: (e: CustomEvent<any>) => void;
  onOnItemsDeleted?: (e: CustomEvent<any>) => void;
  onOnItemsUpdated?: (e: CustomEvent<any>) => void;
  onOnItemsUpserted?: (e: CustomEvent<any>) => void;
  onOnFullResizeByContentRequested?: (e: CustomEvent<any>) => void;
  onOnFilterChanged?: (e: CustomEvent<any>) => void;
  onOnFilterCleared?: (e: CustomEvent<any>) => void;
  onOnGridStateChanged?: (e: CustomEvent<any>) => void;
  onOnBeforePaginationChange?: (e: CustomEvent<any>) => void;
  onOnPaginationChanged?: (e: CustomEvent<PaginationChangedArgs>) => void;
  onOnPaginationRefreshed?: (e: CustomEvent<any>) => void;
  onOnPaginationVisibilityChanged?: (e: CustomEvent<any>) => void;
  onOnPaginationSetCursorBased?: (e: CustomEvent<any>) => void;
  onOnGridBeforeResize?: (e: CustomEvent<any>) => void;
  onOnGridAfterResize?: (e: CustomEvent<any>) => void;
  onOnBeforeResizeByContent?: (e: CustomEvent<any>) => void;
  onOnAfterResizeByContent?: (e: CustomEvent<any>) => void;
  onOnSelectedRowIdsChanged?: (e: CustomEvent<any>) => void;
  onOnSortCleared?: (e: CustomEvent<any>) => void;
  onOnSortChanged?: (e: CustomEvent<any>) => void;
  onOnToggleTreeCollapsed?: (e: CustomEvent<any>) => void;
  onOnTreeItemToggled?: (e: CustomEvent<any>) => void;
  onOnTreeFullToggleEnd?: (e: CustomEvent<any>) => void;
  onOnTreeFullToggleStart?: (e: CustomEvent<any>) => void;
  onVueGridCreated?: (e: CustomEvent<SlickgridVueInstance>) => void;
}
