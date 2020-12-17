import { GridOption, EventNamingStyle } from '@slickgrid-universal/common';

/** Global Grid Options Defaults for Salesforce */
export const SalesforceGlobalGridOptions = {
  autoEdit: true, // true single click (false for double-click)
  autoCommitEdit: true,
  cellValueCouldBeUndefined: true,
  compositeEditorOptions: {
    labels: {
      massSelectionButton: 'Apply to Selected & Save',
      massUpdateButton: 'Apply to All & Save'
    }
  },
  datasetIdPropertyName: 'Id',
  defaultFilterPlaceholder: '',
  emptyDataWarning: {
    message: `<span class="mdi mdi-alert color-warning"></span> No data to display.`,
  },
  enableAutoTooltip: true,
  enableDeepCopyDatasetOnPageLoad: true,
  enableTextExport: true,
  textExportOptions: {
    exportWithFormatter: true,
    sanitizeDataExport: true,
  },
  enableCellNavigation: true,
  formatterOptions: {
    minDecimal: 0,
    maxDecimal: 2,
    thousandSeparator: ','
  },
  frozenHeaderWidthCalcDifferential: 2,
  gridMenu: {
    hideTogglePreHeaderCommand: true,
    hideRefreshDatasetCommand: true,
    hideClearFrozenColumnsCommand: false,
  },
  headerMenu: {
    hideFreezeColumnsCommand: false,
    iconSortAscCommand: 'fa fa-sort-amount-asc mdi mdi-arrow-up',
    iconSortDescCommand: 'fa fa-sort-amount-desc mdi mdi-arrow-down',
  },
  sanitizer: (dirtyHtml) => (dirtyHtml.replace(/(\b)(on\S+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script([<>]*)/gi, '')),
  showCustomFooter: true,
  customFooterOptions: {
    hideMetrics: false,
    hideTotalItemCount: false,
    hideLastUpdateTimestamp: true,
  },
  headerRowHeight: 35,
  rowHeight: 33,
  eventNamingStyle: EventNamingStyle.lowerCaseWithoutOnPrefix,
  useSalesforceDefaultGridOptions: true,
} as GridOption;
