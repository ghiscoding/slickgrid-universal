import { EventNamingStyle, OperatorType, GridAutosizeColsMode } from './enums/index';
import { GridOption } from './interfaces/gridOption.interface';
import { Filters } from './filters';

/**
 * Options that can be passed to the Bootstrap-Datetimepicker directly
 */
export const GlobalGridOptions: GridOption = {
  alwaysShowVerticalScroll: true,
  autoEdit: false,
  asyncEditorLoading: false,
  autoFitColumnsOnFirstLoad: true,
  autoResize: {
    calculateAvailableSizeBy: 'window',
    bottomPadding: 20,
    minHeight: 180,
    minWidth: 300,
    sidePadding: 0
  },
  cellHighlightCssClass: 'slick-cell-modified',
  checkboxSelector: {
    cssClass: 'slick-cell-checkboxsel',
    width: 42
  },
  columnPicker: {
    fadeSpeed: 0,
    hideForceFitButton: false,
    hideSyncResizeButton: true
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
    iconCopyCellValueCommand: 'fa fa-clone mdi mdi-content-copy',
    iconExportCsvCommand: 'fa fa-download mdi mdi-download',
    iconExportExcelCommand: 'fa fa-file-excel-o text-success',
    iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
    width: 200,
  },
  //   customFooterOptions: {
  //     dateFormat: 'yyyy-MM-dd hh:mm aaaaa\'m\'',
  //     hideTotalItemCount: false,
  //     hideLastUpdateTimestamp: true,
  //     footerHeight: 20,
  //     leftContainerClass: 'col-xs-12 col-sm-5',
  //     rightContainerClass: 'col-xs-6 col-sm-7',
  //     metricSeparator: '|',
  //     metricTexts: {
  //       items: 'items',
  //       of: 'of',
  //       itemsKey: 'ITEMS',
  //       ofKey: 'OF',
  //     }
  //   },
  dataView: {
    syncGridSelection: true, // when enabled, this will preserve the row selection even after filtering/sorting/grouping
    syncGridSelectionWithBackendService: false, // but disable it when using backend services
  },
  datasetIdPropertyName: 'id',
  defaultFilter: Filters.input,
  enableFilterTrimWhiteSpace: false, // do we want to trim white spaces on all Filters?
  defaultFilterPlaceholder: '&#128269;',
  defaultFilterRangeOperator: OperatorType.rangeExclusive,
  defaultColumnSortFieldId: 'id',
  defaultComponentEventPrefix: '',
  defaultSlickgridEventPrefix: '',
  editable: false,
  enableAutoResize: true,
  enableAutoSizeColumns: true,
  enableCellNavigation: false,
  enableColumnPicker: true,
  enableColumnReorder: true,
  enableContextMenu: true,
  //   enableExcelExport: true, // Excel Export is the new default,
  //   enableExport: false, // CSV/Text with Tab Delimited
  enableGridMenu: true,
  enableHeaderMenu: true,
  enableMouseHoverHighlightRow: true,
  enableSorting: true,
  enableTextSelectionOnCells: true,
  explicitInitialization: true,
  // //   excelExportOptions: {
  // //     addGroupIndentation: true,
  // //     exportWithFormatter: false,
  // //     filename: 'export',
  // //     format: FileType.xlsx,
  // //     groupingColumnHeaderTitle: 'Group By',
  // //     groupCollapsedSymbol: '\u25B9',
  // //     groupExpandedSymbol: '\u25BF',
  // //     groupingAggregatorRowText: '',
  // //     sanitizeDataExport: false,
  // //   },
  // //   exportOptions: {
  // //     delimiter: DelimiterType.comma,
  // //     exportWithFormatter: false,
  // //     filename: 'export',
  // //     format: FileType.csv,
  // //     groupingColumnHeaderTitle: 'Group By',
  // //     groupingAggregatorRowText: '',
  // //     sanitizeDataExport: false,
  // //     useUtf8WithBom: true
  // //   },
  gridAutosizeColsMode: GridAutosizeColsMode.none,
  eventNamingStyle: EventNamingStyle.lowerCase,
  forceFitColumns: false,
  gridMenu: {
    hideClearAllFiltersCommand: false,
    hideClearAllSortingCommand: false,
    hideExportCsvCommand: false,
    hideExportExcelCommand: false,
    hideExportTextDelimitedCommand: true,
    hideForceFitButton: false,
    hideRefreshDatasetCommand: false,
    hideSyncResizeButton: true,
    hideToggleFilterCommand: false,
    hideTogglePreHeaderCommand: false,
    iconCssClass: 'fa fa-bars mdi mdi-menu',
    iconClearAllFiltersCommand: 'fa fa-filter text-danger mdi mdi-filter-remove-outline',
    iconClearAllSortingCommand: 'fa fa-unsorted mdi mdi-swap-vertical text-danger',
    iconExportCsvCommand: 'fa fa-download mdi mdi-download',
    iconExportExcelCommand: 'fa fa-file-excel-o text-success',
    iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
    iconRefreshDatasetCommand: 'fa fa-refresh mdi mdi-sync',
    iconToggleFilterCommand: 'fa fa-random mdi mdi-flip-vertical',
    iconTogglePreHeaderCommand: 'fa fa-random mdi mdi-flip-vertical',
    menuWidth: 16,
    resizeOnShowHeaderRow: true
  },
  headerMenu: {
    autoAlign: true,
    autoAlignOffset: 12,
    minWidth: 140,
    iconClearFilterCommand: 'fa fa-filter mdi mdi mdi-filter-remove-outline text-danger',
    iconClearSortCommand: 'fa fa-unsorted mdi mdi-swap-vertical',
    iconSortAscCommand: 'fa fa-sort-amount-asc mdi mdi-sort-ascending',
    iconSortDescCommand: 'fa fa-sort-amount-desc mdi mdi-sort-descending',
    iconColumnHideCommand: 'fa fa-times mdi mdi-close',
    hideColumnHideCommand: false,
    hideClearFilterCommand: false,
    hideClearSortCommand: false,
    hideSortCommands: false
  },
  headerRowHeight: 30,
  multiColumnSort: true,
  numberedMultiColumnSort: true,
  tristateMultiColumnSort: false,
  sortColNumberInSeparateSpan: true,
  suppressActiveCellChangeOnEdit: true,
  //   pagination: {
  //     pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
  //     pageSize: 25,
  //     totalItems: 0
  //   },
  //   // @ts-ignore
  //   // technically speaking the Row Detail requires the process & viewComponent but we'll ignore it just to set certain options
  //   rowDetailView: {
  //     cssClass: 'detail-view-toggle',
  //     panelRows: 1,
  //     keyPrefix: '__',
  //     useRowClick: true,
  //     useSimpleViewportCalc: true,
  //     saveDetailViewOnScroll: false,
  //   },
  rowHeight: 30,
  topPanelHeight: 30
};
