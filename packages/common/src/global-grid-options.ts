import { DelimiterType, EventNamingStyle, FileType, GridAutosizeColsMode, OperatorType } from './enums/index';
import { Column, GridOption } from './interfaces/index';
import { Filters } from './filters';

/** Global Grid Options Defaults */
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
    rightPadding: 0
  },
  cellHighlightCssClass: 'slick-cell-modified',
  checkboxSelector: {
    cssClass: 'slick-cell-checkboxsel',
    width: 42
  },
  columnPicker: {
    fadeSpeed: 0,
    hideForceFitButton: false,
    hideSyncResizeButton: true,
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
    iconCollapseAllGroupsCommand: 'fa fa-compress mdi mdi-arrow-collapse',
    iconExpandAllGroupsCommand: 'fa fa-expand mdi mdi-arrow-expand',
    iconClearGroupingCommand: 'fa fa-times mdi mdi-close',
    iconCopyCellValueCommand: 'fa fa-clone mdi mdi-content-copy',
    iconExportCsvCommand: 'fa fa-download mdi mdi-download',
    iconExportExcelCommand: 'fa fa-file-excel-o mdi mdi-file-excel-outline text-success has-text-success',
    iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
    width: 200,
  },
  customFooterOptions: {
    dateFormat: 'YYYY-DD-MM h:mm:ss a',
    hideTotalItemCount: false,
    hideLastUpdateTimestamp: true,
    footerHeight: 20,
    leftContainerClass: 'col-xs-12 col-sm-5',
    rightContainerClass: 'col-xs-6 col-sm-7',
    metricSeparator: '|',
    metricTexts: {
      items: 'items',
      of: 'of',
      itemsKey: 'ITEMS',
      ofKey: 'OF',
    }
  },
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
  enableExcelExport: false,
  enableExport: false,
  enableGridMenu: true,
  enableHeaderMenu: true,
  enableMouseHoverHighlightRow: true,
  enableSorting: true,
  enableTextSelectionOnCells: true,
  explicitInitialization: true,
  excelExportOptions: {
    addGroupIndentation: true,
    exportWithFormatter: false,
    filename: 'export',
    format: FileType.xlsx,
    groupingColumnHeaderTitle: 'Group By',
    groupCollapsedSymbol: '\u25B9',
    groupExpandedSymbol: '\u25BF',
    groupingAggregatorRowText: '',
    sanitizeDataExport: false,
  },
  exportOptions: {
    delimiter: DelimiterType.comma,
    exportWithFormatter: false,
    filename: 'export',
    format: FileType.csv,
    groupingColumnHeaderTitle: 'Group By',
    groupingAggregatorRowText: '',
    sanitizeDataExport: false,
    useUtf8WithBom: true
  },
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
    iconExportExcelCommand: 'fa fa-file-excel-o mdi mdi-file-excel-outline text-success has-text-success',
    iconExportTextDelimitedCommand: 'fa fa-download mdi mdi-download',
    iconRefreshDatasetCommand: 'fa fa-refresh mdi mdi-sync',
    iconToggleFilterCommand: 'fa fa-random mdi mdi-flip-vertical',
    iconTogglePreHeaderCommand: 'fa fa-random mdi mdi-flip-vertical',
    menuWidth: 16,
    resizeOnShowHeaderRow: true,
    useClickToRepositionMenu: false, // use icon location to reposition instead
    headerColumnValueExtractor: (column: Column) => {
      const headerGroup = column?.columnGroup || '';
      if (headerGroup) {
        // when using Column Header Grouping, we'll prefix the column group title
        return headerGroup + ' - ' + column.name;
      }
      return column?.name ?? '';
    }
  },
  headerMenu: {
    autoAlign: true,
    autoAlignOffset: 12,
    minWidth: 140,
    iconClearFilterCommand: 'fa fa-filter mdi mdi mdi-filter-remove-outline text-danger',
    iconClearSortCommand: 'fa fa-unsorted mdi mdi-swap-vertical',
    iconSortAscCommand: 'fa fa-sort-amount-asc mdi mdi-sort-ascending',
    iconSortDescCommand: 'fa fa-sort-amount-desc mdi mdi-flip-v mdi-sort-descending',
    iconColumnHideCommand: 'fa fa-times mdi mdi-close',
    hideColumnHideCommand: false,
    hideClearFilterCommand: false,
    hideClearSortCommand: false,
    hideSortCommands: false
  },
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
  //     useRowClick: false,
  //     useSimpleViewportCalc: true,
  //     saveDetailViewOnScroll: false,
  //   },
  headerRowHeight: 35,
  rowHeight: 35,
  topPanelHeight: 30
};
