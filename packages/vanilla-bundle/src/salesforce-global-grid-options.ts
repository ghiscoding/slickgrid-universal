import { GridOption, EventNamingStyle } from '@slickgrid-universal/common';

/** Global Grid Options Defaults for Salesforce */
export const SalesforceGlobalGridOptions: GridOption = {
  datasetIdPropertyName: 'Id',
  enableExport: true,
  enableDeepCopyDatasetOnPageLoad: true,
  exportOptions: {
    exportWithFormatter: true
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
  headerRowHeight: 35,
  rowHeight: 33,
  eventNamingStyle: EventNamingStyle.lowerCaseWithoutOnPrefix,
  useSalesforceDefaultGridOptions: true,
};
