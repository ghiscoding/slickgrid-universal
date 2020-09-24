import { GridOption, EventNamingStyle } from '@slickgrid-universal/common';

/** Global Grid Options Defaults for Salesforce */
export const SalesforceGlobalGridOptions: GridOption = {
  autoEdit: true, // true single click (false for double-click)
  autoCommitEdit: true,
  datasetIdPropertyName: 'Id',
  defaultFilterPlaceholder: '',
  enableAutoTooltip: true,
  enableDeepCopyDatasetOnPageLoad: true,
  enableExport: true,
  exportOptions: {
    exportWithFormatter: true,
    sanitizeDataExport: true,
  },
  enableCellNavigation: true,
  formatterOptions: {
    minDecimal: 0,
    maxDecimal: 2,
    thousandSeparator: ','
  },
  gridMenu: {
    hideTogglePreHeaderCommand: true,
    hideRefreshDatasetCommand: true,
    hideClearFrozenColumnsCommand: false,
  },
  headerMenu: {
    hideFreezeColumnsCommand: false,
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
};
