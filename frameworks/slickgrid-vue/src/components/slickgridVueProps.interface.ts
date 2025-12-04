import type {
  Column,
  ColumnSort,
  CurrentFilter,
  CurrentSorter,
  DragRowMove,
  ExportTextDownloadOption,
  ExtensionList,
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
  SlickControlList,
  SlickGrid,
  SlickPluginList,
  SlickRange,
  TreeToggleStateChange,
  VueRegularEventHandler,
  VueSlickEventHandler,
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
  onOnActiveCellChanged?: VueSlickEventHandler<OnActiveCellChangedEventArgs>;
  onOnActiveCellPositionChanged?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnAddNewRow?: VueSlickEventHandler<OnAddNewRowEventArgs>;
  onOnAutosizeColumns?: VueSlickEventHandler<OnAutosizeColumnsEventArgs>;
  onOnBeforeAppendCell?: VueSlickEventHandler<OnBeforeAppendCellEventArgs>;
  onOnBeforeCellEditorDestroy?: VueSlickEventHandler<OnBeforeCellEditorDestroyEventArgs>;
  onOnBeforeColumnsResize?: VueSlickEventHandler<OnBeforeColumnsResizeEventArgs>;
  onOnBeforeDestroy?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnBeforeEditCell?: VueSlickEventHandler<OnBeforeEditCellEventArgs>;
  onOnBeforeHeaderCellDestroy?: VueSlickEventHandler<OnBeforeHeaderCellDestroyEventArgs>;
  onOnBeforeHeaderRowCellDestroy?: VueSlickEventHandler<OnBeforeHeaderRowCellDestroyEventArgs>;
  onOnBeforeFooterRowCellDestroy?: VueSlickEventHandler<OnBeforeFooterRowCellDestroyEventArgs>;
  onOnBeforeSetColumns?: VueSlickEventHandler<OnBeforeSetColumnsEventArgs>;
  onOnBeforeSort?: VueSlickEventHandler<SingleColumnSort, boolean | void>;
  onOnCellChange?: VueSlickEventHandler<OnCellChangeEventArgs>;
  onOnCellCssStylesChanged?: VueSlickEventHandler<OnCellCssStylesChangedEventArgs>;
  onOnClick?: VueSlickEventHandler<OnClickEventArgs>;
  onOnColumnsDrag?: VueSlickEventHandler<OnColumnsDragEventArgs>;
  onOnColumnsReordered?: VueSlickEventHandler<OnColumnsReorderedEventArgs>;
  onOnColumnsResized?: VueSlickEventHandler<OnColumnsResizedEventArgs>;
  onOnColumnsResizeDblClick?: VueSlickEventHandler<OnColumnsResizeDblClickEventArgs>;
  onOnCompositeEditorChange?: VueSlickEventHandler<OnCompositeEditorChangeEventArgs>;
  onOnContextMenu?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnDrag?: VueSlickEventHandler<DragRowMove>;
  onOnDragEnd?: VueSlickEventHandler<DragRowMove>;
  onOnDragInit?: VueSlickEventHandler<DragRowMove>;
  onOnDragStart?: VueSlickEventHandler<DragRowMove>;
  onOnDragReplaceCells?: VueSlickEventHandler<OnDragReplaceCellsEventArgs>;
  onOnDblClick?: VueSlickEventHandler<OnDblClickEventArgs>;
  onOnFooterContextMenu?: VueSlickEventHandler<OnFooterContextMenuEventArgs>;
  onOnFooterRowCellRendered?: VueSlickEventHandler<OnFooterRowCellRenderedEventArgs>;
  onOnHeaderCellRendered?: VueSlickEventHandler<OnHeaderCellRenderedEventArgs>;
  onOnFooterClick?: VueSlickEventHandler<OnFooterClickEventArgs>;
  onOnHeaderClick?: VueSlickEventHandler<OnHeaderClickEventArgs>;
  onOnHeaderContextMenu?: VueSlickEventHandler<OnHeaderContextMenuEventArgs>;
  onOnHeaderMouseEnter?: VueSlickEventHandler<OnHeaderMouseEventArgs>;
  onOnHeaderMouseLeave?: VueSlickEventHandler<OnHeaderMouseEventArgs>;
  onOnHeaderRowCellRendered?: VueSlickEventHandler<OnHeaderRowCellRenderedEventArgs>;
  onOnHeaderRowMouseEnter?: VueSlickEventHandler<OnHeaderMouseEventArgs>;
  onOnHeaderRowMouseLeave?: VueSlickEventHandler<OnHeaderMouseEventArgs>;
  onOnKeyDown?: VueSlickEventHandler<OnKeyDownEventArgs>;
  onOnMouseEnter?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnMouseLeave?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnValidationError?: VueSlickEventHandler<OnValidationErrorEventArgs>;
  onOnViewportChanged?: VueSlickEventHandler<{ grid: SlickGrid }>;
  onOnRendered?: VueSlickEventHandler<OnRenderedEventArgs>;
  onOnSelectedRowsChanged?: VueSlickEventHandler<OnSelectedRowsChangedEventArgs>;
  onOnSetOptions?: VueSlickEventHandler<OnSetOptionsEventArgs>;
  onOnScroll?: VueSlickEventHandler<OnScrollEventArgs>;
  onOnSort?: VueSlickEventHandler<SingleColumnSort>;

  // Slick DataView events
  onOnBeforePagingInfoChanged?: VueSlickEventHandler<PagingInfo>;
  onOnGroupExpanded?: VueSlickEventHandler<OnGroupExpandedEventArgs>;
  onOnGroupCollapsed?: VueSlickEventHandler<OnGroupCollapsedEventArgs>;
  onOnPagingInfoChanged?: VueSlickEventHandler<PagingInfo>;
  onOnRowCountChanged?: VueSlickEventHandler<OnRowCountChangedEventArgs>;
  onOnRowsChanged?: VueSlickEventHandler<OnRowsChangedEventArgs>;
  onOnRowsOrCountChanged?: VueSlickEventHandler<OnRowsOrCountChangedEventArgs>;
  onOnSelectedRowIdsChanged?: VueSlickEventHandler<OnSelectedRowIdsChangedEventArgs>;
  onOnSetItemsCalled?: VueSlickEventHandler<OnSetItemsCalledEventArgs>;

  // other Slick Events
  onOnAfterMenuShow?: VueSlickEventHandler<MenuFromCellCallbackArgs>;
  onOnBeforeMenuClose?: VueSlickEventHandler<MenuFromCellCallbackArgs>;
  onOnBeforeMenuShow?: VueSlickEventHandler<MenuFromCellCallbackArgs>;
  onOnColumnsChanged?: VueSlickEventHandler<OnColumnsChangedArgs>;
  onOnCommand?: VueSlickEventHandler<MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>;
  onOnGridMenuColumnsChanged?: VueSlickEventHandler<OnColumnsChangedArgs>;
  onOnMenuClose?: VueSlickEventHandler<GridMenuEventWithElementCallbackArgs>;
  onOnCopyCells?: VueSlickEventHandler<{ ranges: SlickRange[] }>;
  onOnCopyCancelled?: VueSlickEventHandler<{ ranges: SlickRange[] }>;
  onOnPasteCells?: VueSlickEventHandler<{ ranges: SlickRange[] }>;
  onOnBeforePasteCell?: VueSlickEventHandler<{ cell: number; row: number; item: any; columnDef: Column; value: any }>;

  // Slickgrid-Vue events
  onOnAfterExportToExcel?: VueRegularEventHandler<{ filename: string; mimeType: string }>;
  onOnBeforeExportToExcel?: VueRegularEventHandler<boolean>;
  onOnBeforeExportToTextFile?: VueRegularEventHandler<boolean>;
  onOnAfterExportToTextFile?: VueRegularEventHandler<ExportTextDownloadOption>;
  onOnBeforeFilterChange?: VueRegularEventHandler<CurrentFilter[]>;
  onOnBeforeFilterClear?: VueRegularEventHandler<{ columnId: string } | boolean>;
  onOnBeforeSearchChange?: VueRegularEventHandler<OnSearchChangeEventArgs, boolean | void>;
  onOnBeforeSortChange?: VueRegularEventHandler<Array<ColumnSort & { clearSortTriggered?: boolean }>>;
  onOnContextMenuClearGrouping?: VueRegularEventHandler<void>;
  onOnContextMenuCollapseAllGroups?: VueRegularEventHandler<void>;
  onOnContextMenuExpandAllGroups?: VueRegularEventHandler<void>;
  onOnOptionSelected?: VueRegularEventHandler<MenuCommandItemCallbackArgs | MenuOptionItemCallbackArgs>;
  onOnColumnPickerColumnsChanged?: VueRegularEventHandler<OnColumnsChangedArgs>;
  onOnGridMenuMenuClose?: VueRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onOnGridMenuBeforeMenuShow?: VueRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onOnGridMenuAfterMenuShow?: VueRegularEventHandler<GridMenuEventWithElementCallbackArgs>;
  onOnGridMenuClearAllPinning?: VueRegularEventHandler<void>;
  onOnGridMenuClearAllFilters?: VueRegularEventHandler<void>;
  onOnGridMenuClearAllSorting?: VueRegularEventHandler<void>;
  onOnGridMenuCommand?: VueRegularEventHandler<GridMenuCommandItemCallbackArgs>;
  onOnHeaderButtonCommand?: VueRegularEventHandler<HeaderButtonOnCommandArgs>;
  onOnHideColumns?: VueRegularEventHandler<{ columns: Column[]; hiddenColumn: Column[] }>;
  onOnHeaderMenuCommand?: VueRegularEventHandler<MenuCommandItemCallbackArgs>;
  onOnHeaderMenuColumnResizeByContent?: VueRegularEventHandler<{ columnId: string }>;
  onOnHeaderMenuBeforeMenuShow?: VueRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onOnHeaderMenuAfterMenuShow?: VueRegularEventHandler<HeaderMenuCommandItemCallbackArgs>;
  onOnItemsAdded?: VueRegularEventHandler<any[]>;
  onOnItemsDeleted?: VueRegularEventHandler<any[]>;
  onOnItemsUpdated?: VueRegularEventHandler<any[]>;
  onOnItemsUpserted?: VueRegularEventHandler<any[]>;
  onOnFullResizeByContentRequested?: VueRegularEventHandler<{ caller: string }>;
  onOnFilterChanged?: VueRegularEventHandler<CurrentFilter[]>;
  onOnFilterCleared?: VueRegularEventHandler<boolean>;
  onOnGridStateChanged?: VueRegularEventHandler<GridStateChange>;
  onOnBeforePaginationChange?: VueRegularEventHandler<PaginationMetadata, boolean | void>;
  onOnPaginationChanged?: VueRegularEventHandler<PaginationMetadata>;
  onOnPaginationRefreshed?: VueRegularEventHandler<PaginationMetadata>;
  onOnPaginationVisibilityChanged?: VueRegularEventHandler<{ visible: boolean }>;
  onOnPaginationSetCursorBased?: VueRegularEventHandler<{ isCursorBased: boolean }>;
  onOnGridBeforeResize?: VueRegularEventHandler<void>;
  onOnGridAfterResize?: VueRegularEventHandler<GridSize | undefined>;
  onOnBeforeResizeByContent?: VueRegularEventHandler<void>;
  onOnAfterResizeByContent?: VueRegularEventHandler<{
    readItemCount: number;
    calculateColumnWidths: { [x: string]: number | undefined; [x: number]: number | undefined };
  }>;
  onOnSortCleared?: VueRegularEventHandler<boolean>;
  onOnSortChanged?: VueRegularEventHandler<CurrentSorter[]>;
  onOnTreeItemToggled?: VueRegularEventHandler<TreeToggleStateChange>;
  onOnTreeFullToggleEnd?: VueRegularEventHandler<TreeToggleStateChange>;
  onOnTreeFullToggleStart?: VueRegularEventHandler<TreeToggleStateChange>;
  onOnVueGridCreated?: VueRegularEventHandler<SlickgridVueInstance>;
  onOnLanguageChange?: VueRegularEventHandler<string>;
}
