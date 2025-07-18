import {
  type Column,
  DelimiterType,
  EventNamingStyle,
  Filters,
  type GridOption as GridOptionUniversal,
  type TreeDataOption,
} from '@slickgrid-universal/common';
import type { GridOption, RowDetailView } from './models/index';

/** Global Grid Options Defaults */
export const GlobalGridOptions: Partial<GridOption> = {
  alwaysShowVerticalScroll: true,
  autoEdit: false,
  asyncEditorLoading: false,
  autoFitColumnsOnFirstLoad: true,
  autoResize: {
    applyResizeToContainer: true,
    autoHeight: true,
    autoHeightRecalcRow: 100,
    calculateAvailableSizeBy: 'window',
    bottomPadding: 20,
    minHeight: 250,
    minWidth: 300,
    rightPadding: 0,
  },
  cellHighlightCssClass: 'slick-cell-modified',
  checkboxSelector: {
    cssClass: 'slick-cell-checkboxsel',
  },
  columnPicker: {
    hideForceFitButton: false,
    hideSyncResizeButton: true,
    headerColumnValueExtractor: pickerHeaderColumnValueExtractor,
  },
  cellMenu: {
    autoAdjustDrop: true,
    autoAlignSide: true,
    hideCloseButton: true,
    hideCommandSection: false,
    hideOptionSection: false,
  },
  contextMenu: {
    autoAdjustDrop: true,
    autoAlignSide: true,
    hideCloseButton: true,
    hideClearAllGrouping: false,
    hideCollapseAllGroups: false,
    hideCommandSection: false,
    hideCopyCellValueCommand: false,
    hideExpandAllGroups: false,
    hideExportCsvCommand: false,
    hideExportExcelCommand: false,
    hideExportTextDelimitedCommand: true,
    hideMenuOnScroll: true,
    hideOptionSection: false,
    iconCollapseAllGroupsCommand: 'mdi mdi-arrow-collapse',
    iconExpandAllGroupsCommand: 'mdi mdi-arrow-expand',
    iconClearGroupingCommand: 'mdi mdi-close',
    iconCopyCellValueCommand: 'mdi mdi-content-copy',
    iconExportCsvCommand: 'mdi mdi-download',
    iconExportExcelCommand: 'mdi mdi-file-excel-outline',
    iconExportTextDelimitedCommand: 'mdi mdi-download',
    showBulletWhenIconMissing: true,
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
  customFooterOptions: {
    dateFormat: 'YYYY-MM-DD, hh:mm a',
    hideRowSelectionCount: false,
    hideTotalItemCount: false,
    hideLastUpdateTimestamp: true,
    footerHeight: 25,
    leftContainerClass: 'col-xs-12 col-sm-5',
    rightContainerClass: 'col-xs-6 col-sm-7',
    metricSeparator: '|',
    metricTexts: {
      items: 'items',
      itemsKey: 'ITEMS',
      itemsSelected: 'items selected',
      itemsSelectedKey: 'ITEMS_SELECTED',
      of: 'of',
      ofKey: 'OF',
    },
  },
  dataView: {
    // when enabled, this will preserve the row selection even after filtering/sorting/grouping
    syncGridSelection: {
      preserveHidden: false,
      preserveHiddenOnSelectionChange: true,
    },
    syncGridSelectionWithBackendService: false, // but disable it when using backend services
  },
  datasetIdPropertyName: 'id',
  defaultFilter: Filters.input,
  defaultBackendServiceFilterTypingDebounce: 500,
  defaultColumnSortFieldId: 'id',
  defaultFilterPlaceholder: '🔎︎',
  defaultFilterRangeOperator: 'RangeInclusive',
  editable: false,
  enableAutoResize: true,
  enableAutoSizeColumns: true,
  enableCellNavigation: false,
  enableColumnPicker: true,
  enableColumnReorder: true,
  enableColumnResizeOnDoubleClick: true,
  enableContextMenu: true,
  enableExcelExport: false,
  enableTextExport: false, // CSV/Text with Tab Delimited
  enableFilterTrimWhiteSpace: false, // do we want to trim white spaces on all Filters?
  enableGridMenu: true,
  enableHeaderMenu: true,
  enableEmptyDataWarningMessage: true,
  emptyDataWarning: {
    className: 'slick-empty-data-warning',
    message: 'No data to display.',
    messageKey: 'EMPTY_DATA_WARNING_MESSAGE',
    hideFrozenLeftWarning: false,
    hideFrozenRightWarning: false,
    leftViewportMarginLeft: '40%',
    rightViewportMarginLeft: '40%',
    frozenLeftViewportMarginLeft: '0px',
    frozenRightViewportMarginLeft: '40%',
  },
  enableMouseHoverHighlightRow: true,
  enableSorting: true,
  enableTextSelectionOnCells: true,
  eventNamingStyle: EventNamingStyle.camelCase,
  explicitInitialization: true,
  excelExportOptions: {
    addGroupIndentation: true,
    exportWithFormatter: false,
    filename: 'export',
    format: 'xlsx',
    groupingColumnHeaderTitle: 'Group By',
    groupCollapsedSymbol: '⮞',
    groupExpandedSymbol: '⮟',
    groupingAggregatorRowText: '',
    sanitizeDataExport: false,
  },
  textExportOptions: {
    delimiter: DelimiterType.comma,
    exportWithFormatter: false,
    filename: 'export',
    format: 'csv',
    groupingColumnHeaderTitle: 'Group By',
    groupingAggregatorRowText: '',
    sanitizeDataExport: false,
    useUtf8WithBom: true,
  },
  filterTypingDebounce: 0,
  forceFitColumns: false,
  frozenHeaderWidthCalcDifferential: 0,
  gridMenu: {
    dropSide: 'left',
    commandLabels: {
      clearAllFiltersCommandKey: 'CLEAR_ALL_FILTERS',
      clearAllSortingCommandKey: 'CLEAR_ALL_SORTING',
      clearFrozenColumnsCommandKey: 'CLEAR_PINNING',
      exportCsvCommandKey: 'EXPORT_TO_CSV',
      exportExcelCommandKey: 'EXPORT_TO_EXCEL',
      exportTextDelimitedCommandKey: 'EXPORT_TO_TAB_DELIMITED',
      refreshDatasetCommandKey: 'REFRESH_DATASET',
      toggleDarkModeCommandKey: 'TOGGLE_DARK_MODE',
      toggleFilterCommandKey: 'TOGGLE_FILTER_ROW',
      togglePreHeaderCommandKey: 'TOGGLE_PRE_HEADER_ROW',
    },
    hideClearAllFiltersCommand: false,
    hideClearAllSortingCommand: false,
    hideClearFrozenColumnsCommand: true, // opt-in command
    hideExportCsvCommand: false,
    hideExportExcelCommand: false,
    hideExportTextDelimitedCommand: true,
    hideForceFitButton: false,
    hideRefreshDatasetCommand: false,
    hideSyncResizeButton: true,
    hideToggleDarkModeCommand: true,
    hideToggleFilterCommand: false,
    hideTogglePreHeaderCommand: false,
    iconCssClass: 'mdi mdi-menu',
    iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
    iconClearAllSortingCommand: 'mdi mdi-sort-variant-off',
    iconClearFrozenColumnsCommand: 'mdi mdi-pin-off-outline',
    iconExportCsvCommand: 'mdi mdi-download',
    iconExportExcelCommand: 'mdi mdi-file-excel-outline',
    iconExportTextDelimitedCommand: 'mdi mdi-download',
    iconRefreshDatasetCommand: 'mdi mdi-sync',
    iconToggleDarkModeCommand: 'mdi mdi-brightness-4',
    iconToggleFilterCommand: 'mdi mdi-flip-vertical',
    iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
    menuWidth: 16,
    resizeOnShowHeaderRow: true,
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
    headerColumnValueExtractor: pickerHeaderColumnValueExtractor,
  },
  headerMenu: {
    autoAlign: true,
    autoAlignOffset: 12,
    minWidth: 140,
    iconClearFilterCommand: 'mdi mdi-filter-remove-outline',
    iconClearSortCommand: 'mdi mdi-sort-variant-off',
    iconFreezeColumns: 'mdi mdi-pin-outline',
    iconUnfreezeColumns: 'mdi mdi-pin-off-outline',
    iconSortAscCommand: 'mdi mdi-sort-ascending',
    iconSortDescCommand: 'mdi mdi-sort-descending',
    iconColumnHideCommand: 'mdi mdi-close',
    iconColumnResizeByContentCommand: 'mdi mdi-arrow-expand-horizontal',
    hideColumnResizeByContentCommand: false,
    hideColumnHideCommand: false,
    hideClearFilterCommand: false,
    hideClearSortCommand: false,
    hideFreezeColumnsCommand: true, // opt-in command
    hideSortCommands: false,
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
  headerRowHeight: 35,
  multiColumnSort: true,
  numberedMultiColumnSort: true,
  tristateMultiColumnSort: false,
  sortColNumberInSeparateSpan: true,
  suppressActiveCellChangeOnEdit: false,
  pagination: {
    pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
    pageSize: 25,
    totalItems: 0,
  },
  // technically speaking the Row Detail requires the process & viewComponent but we'll ignore it just to set certain options
  rowDetailView: {
    collapseAllOnSort: true,
    cssClass: 'detail-view-toggle',
    panelRows: 1,
    keyPrefix: '__',
    useRowClick: false,
    saveDetailViewOnScroll: false,
  } as RowDetailView,
  rowHeight: 35,
  topPanelHeight: 35,
  preHeaderPanelWidth: '100%', // mostly useful for Draggable Grouping dropzone to take full width
  translationNamespaceSeparator: ':',
  resetFilterSearchValueAfterOnBeforeCancellation: true,
  resizeByContentOnlyOnFirstLoad: true,
  resizeByContentOptions: {
    alwaysRecalculateColumnWidth: false,
    cellCharWidthInPx: 7.8,
    cellPaddingWidthInPx: 14,
    defaultRatioForStringType: 0.88,
    formatterPaddingWidthInPx: 0,
    maxItemToInspectCellContentWidth: 1000,
    maxItemToInspectSingleColumnWidthByContent: 5000,
    widthToRemoveFromExceededWidthReadjustment: 50,
  },
  rowTopOffsetRenderType: 'transform',
  treeDataOptions: {
    exportIndentMarginLeft: 5,
    exportIndentationLeadingChar: '͏͏͏͏͏͏͏͏͏·',
  } as unknown as TreeDataOption,
};

/**
 * Value Extractor for both ColumnPicker & GridMenu Picker
 * when using Column Header Grouping, we'll prefix the column group title
 * else we'll simply return the column name title
 */
function pickerHeaderColumnValueExtractor(column: Column, gridOptions?: GridOptionUniversal) {
  let colName = column?.columnPickerLabel ?? column?.name ?? '';
  if (colName instanceof HTMLElement || colName instanceof DocumentFragment) {
    colName = colName.textContent || '';
  }
  const headerGroup = column?.columnGroup || '';
  const columnGroupSeparator = gridOptions?.columnGroupSeparator ?? ' - ';
  if (headerGroup) {
    return headerGroup + columnGroupSeparator + colName;
  }
  return colName;
}
