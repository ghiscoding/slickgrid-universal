import type {
  Column,
  ContainerService,
  DragRowMove,
  ExtensionList,
  GridMenuCommandItemCallbackArgs,
  GridMenuEventWithElementCallbackArgs,
  GridOption,
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
  OnSelectedRowsChangedEventArgs,
  OnSetItemsCalledEventArgs,
  OnSetOptionsEventArgs,
  OnValidationErrorEventArgs,
  Pagination,
  PaginationChangedArgs,
  PagingInfo,
  SingleColumnSort,
  SlickControlList,
  SlickDataView,
  SlickGrid,
  SlickPluginList,
  SlickRange,
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
  onActiveCellChanged?: (e: CustomEvent<{ eventData: any; args: OnActiveCellChangedEventArgs }>) => void;
  onActiveCellPositionChanged?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onAddNewRow?: (e: CustomEvent<{ eventData: any; args: OnAddNewRowEventArgs }>) => void;
  onAutosizeColumns?: (e: CustomEvent<{ eventData: any; args: OnAutosizeColumnsEventArgs }>) => void;
  onBeforeAppendCell?: (e: CustomEvent<{ eventData: any; args: OnBeforeAppendCellEventArgs }>) => void;
  onBeforeSearchChange?: (e: CustomEvent<{ eventData: any; args: OnCellChangeEventArgs }>) => void;
  onBeforeCellEditorDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeCellEditorDestroyEventArgs }>) => void;
  onBeforeColumnsResize?: (e: CustomEvent<{ eventData: any; args: OnBeforeColumnsResizeEventArgs }>) => void;
  onBeforeDestroy?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onBeforeEditCell?: (e: CustomEvent<{ eventData: any; args: OnBeforeEditCellEventArgs }>) => void;
  onBeforeHeaderCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeHeaderCellDestroyEventArgs }>) => void;
  onBeforeHeaderRowCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeHeaderRowCellDestroyEventArgs }>) => void;
  onBeforeFooterRowCellDestroy?: (e: CustomEvent<{ eventData: any; args: OnBeforeFooterRowCellDestroyEventArgs }>) => void;
  onBeforeSetColumns?: (e: CustomEvent<{ eventData: any; args: OnBeforeSetColumnsEventArgs }>) => void;
  onBeforeSort?: (e: CustomEvent<{ eventData: any; args: SingleColumnSort }>) => void;
  onCellChange?: (e: CustomEvent<{ eventData: any; args: OnCellChangeEventArgs }>) => void;
  onCellCssStylesChanged?: (e: CustomEvent<{ eventData: any; args: OnCellCssStylesChangedEventArgs }>) => void;
  onClick?: (e: CustomEvent<{ eventData: any; args: OnClickEventArgs }>) => void;
  onColumnsDrag?: (e: CustomEvent<{ eventData: any; args: OnColumnsDragEventArgs }>) => void;
  onColumnsReordered?: (e: CustomEvent<{ eventData: any; args: OnColumnsReorderedEventArgs }>) => void;
  onColumnsResized?: (e: CustomEvent<{ eventData: any; args: OnColumnsResizedEventArgs }>) => void;
  onColumnsResizeDblClick?: (e: CustomEvent<{ eventData: any; args: OnColumnsResizeDblClickEventArgs }>) => void;
  onCompositeEditorChange?: (e: CustomEvent<{ eventData: any; args: OnCompositeEditorChangeEventArgs }>) => void;
  onContextMenu?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onDrag?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onDragEnd?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onDragInit?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onDragStart?: (e: CustomEvent<{ eventData: any; args: DragRowMove }>) => void;
  onDragReplaceCells?: (e: CustomEvent<{ eventData: any; args: OnDragReplaceCellsEventArgs }>) => void;
  onDblClick?: (e: CustomEvent<{ eventData: any; args: OnDblClickEventArgs }>) => void;
  onFooterContextMenu?: (e: CustomEvent<{ eventData: any; args: OnFooterContextMenuEventArgs }>) => void;
  onFooterRowCellRendered?: (e: CustomEvent<{ eventData: any; args: OnFooterRowCellRenderedEventArgs }>) => void;
  onHeaderCellRendered?: (e: CustomEvent<{ eventData: any; args: OnHeaderCellRenderedEventArgs }>) => void;
  onFooterClick?: (e: CustomEvent<{ eventData: any; args: OnFooterClickEventArgs }>) => void;
  onHeaderClick?: (e: CustomEvent<{ eventData: any; args: OnHeaderClickEventArgs }>) => void;
  onHeaderContextMenu?: (e: CustomEvent<{ eventData: any; args: OnHeaderContextMenuEventArgs }>) => void;
  onHeaderMouseEnter?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onHeaderMouseLeave?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onHeaderRowCellRendered?: (e: CustomEvent<{ eventData: any; args: OnHeaderRowCellRenderedEventArgs }>) => void;
  onHeaderRowMouseEnter?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onHeaderRowMouseLeave?: (e: CustomEvent<{ eventData: any; args: OnHeaderMouseEventArgs }>) => void;
  onKeyDown?: (e: CustomEvent<{ eventData: any; args: OnKeyDownEventArgs }>) => void;
  onMouseEnter?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onMouseLeave?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onValidationError?: (e: CustomEvent<{ eventData: any; args: OnValidationErrorEventArgs }>) => void;
  onViewportChanged?: (e: CustomEvent<{ eventData: any; args: { grid: SlickGrid } }>) => void;
  onRendered?: (e: CustomEvent<{ eventData: any; args: OnRenderedEventArgs }>) => void;
  onSelectedRowsChanged?: (e: CustomEvent<{ eventData: any; args: OnSelectedRowsChangedEventArgs }>) => void;
  onSetOptions?: (e: CustomEvent<{ eventData: any; args: OnSetOptionsEventArgs }>) => void;
  onScroll?: (e: CustomEvent<{ eventData: any; args: OnScrollEventArgs }>) => void;
  onSort?: (e: CustomEvent<{ eventData: any; args: SingleColumnSort }>) => void;

  // Slick DataView events
  onBeforePagingInfoChanged?: (e: CustomEvent<{ eventData: any; args: PagingInfo }>) => void;
  onGroupExpanded?: (e: CustomEvent<{ eventData: any; args: OnGroupExpandedEventArgs }>) => void;
  onGroupCollapsed?: (e: CustomEvent<{ eventData: any; args: OnGroupCollapsedEventArgs }>) => void;
  onPagingInfoChanged?: (e: CustomEvent<{ eventData: any; args: PagingInfo }>) => void;
  onRowCountChanged?: (e: CustomEvent<{ eventData: any; args: OnRowCountChangedEventArgs }>) => void;
  onRowsChanged?: (e: CustomEvent<{ eventData: any; args: OnRowsChangedEventArgs }>) => void;
  onRowsOrCountChanged?: (e: CustomEvent<{ eventData: any; args: OnRowsOrCountChangedEventArgs }>) => void;
  onSetItemsCalled?: (e: CustomEvent<{ eventData: any; args: OnSetItemsCalledEventArgs }>) => void;

  // Slickgrid-React events
  onAfterExportToExcel?: (e: CustomEvent<any>) => void;
  onBeforeExportToExcel?: (e: CustomEvent<any>) => void;
  onBeforeFilterChange?: (e: CustomEvent<any>) => void;
  onBeforeFilterClear?: (e: CustomEvent<any>) => void;
  onBeforeSortChange?: (e: CustomEvent<any>) => void;
  onBeforeToggleTreeCollapse?: (e: CustomEvent<any>) => void;
  onContextMenuClearGrouping?: (e: CustomEvent<any>) => void;
  onContextMenuCollapseAllGroups?: (e: CustomEvent<any>) => void;
  onContextMenuExpandAllGroups?: (e: CustomEvent<any>) => void;
  onAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onAfterGridDestroyed?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onBeforeMenuClose?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onBeforeGridDestroy?: (e: CustomEvent<{ eventData: any; args: MenuFromCellCallbackArgs }>) => void;
  onCommand?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs }>) => void;
  onOptionSelected?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs }>) => void;
  onColumnPickerColumnsChanged?: (
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
  onColumnsChanged?: (
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
  onGridMenuMenuClose?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onGridMenuBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onGridMenuAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: GridMenuEventWithElementCallbackArgs }>) => void;
  onGridMenuClearAllPinning?: (e: CustomEvent<any>) => void;
  onGridMenuClearAllFilters?: (e: CustomEvent<any>) => void;
  onGridMenuClearAllSorting?: (e: CustomEvent<any>) => void;
  onGridMenuColumnsChanged?: (
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
  onGridMenuCommand?: (e: CustomEvent<{ eventData: any; args: GridMenuCommandItemCallbackArgs }>) => void;
  onHeaderButtonCommand?: (e: CustomEvent<{ eventData: any; args: HeaderButtonOnCommandArgs }>) => void;
  onCopyCells?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onCopyCancelled?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onPasteCells?: (e: CustomEvent<{ eventData: any; args: { ranges: SlickRange[] } }>) => void;
  onBeforePasteCell?: (
    e: CustomEvent<{ eventData: any; args: { cell: number; row: number; item: any; columnDef: Column; value: any } }>
  ) => void;
  onHeaderMenuCommand?: (e: CustomEvent<{ eventData: any; args: MenuCommandItemCallbackArgs }>) => void;
  onHeaderMenuColumnResizeByContent?: (e: CustomEvent<{ eventData: any; args: { columnId: string } }>) => void;
  onHeaderMenuBeforeMenuShow?: (e: CustomEvent<{ eventData: any; args: HeaderMenuCommandItemCallbackArgs }>) => void;
  onHeaderMenuAfterMenuShow?: (e: CustomEvent<{ eventData: any; args: HeaderMenuCommandItemCallbackArgs }>) => void;
  onHideColumns?: (e: CustomEvent<{ eventData: any; args: { columns: Column[]; hiddenColumn: Column[] } }>) => void;
  onItemsAdded?: (e: CustomEvent<any>) => void;
  onItemsDeleted?: (e: CustomEvent<any>) => void;
  onItemsUpdated?: (e: CustomEvent<any>) => void;
  onItemsUpserted?: (e: CustomEvent<any>) => void;
  onFullResizeByContentRequested?: (e: CustomEvent<any>) => void;
  onGridStateChanged?: (e: CustomEvent<any>) => void;
  onBeforePaginationChange?: (e: CustomEvent<any>) => void;
  onPaginationChanged?: (e: CustomEvent<PaginationChangedArgs>) => void;
  onPaginationRefreshed?: (e: CustomEvent<any>) => void;
  onPaginationVisibilityChanged?: (e: CustomEvent<any>) => void;
  onPaginationSetCursorBased?: (e: CustomEvent<any>) => void;
  onGridBeforeResize?: (e: CustomEvent<any>) => void;
  onGridAfterResize?: (e: CustomEvent<any>) => void;
  onBeforeResizeByContent?: (e: CustomEvent<any>) => void;
  onAfterResizeByContent?: (e: CustomEvent<any>) => void;
  onSelectedRowIdsChanged?: (e: CustomEvent<any>) => void;
  onSortCleared?: (e: CustomEvent<any>) => void;
  onFilterChanged?: (e: CustomEvent<any>) => void;
  onFilterCleared?: (e: CustomEvent<any>) => void;
  onReactGridCreated?: (e: CustomEvent<any>) => void;
  onSortChanged?: (e: CustomEvent<any>) => void;
  onToggleTreeCollapsed?: (e: CustomEvent<any>) => void;
  onTreeItemToggled?: (e: CustomEvent<any>) => void;
  onTreeFullToggleEnd?: (e: CustomEvent<any>) => void;
  onTreeFullToggleStart?: (e: CustomEvent<any>) => void;
}
