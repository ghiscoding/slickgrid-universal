import { GridOption, EventNamingStyle } from '@slickgrid-universal/common';

/** Global Grid Options Defaults for Salesforce */
export const SalesforceGlobalGridOptions = {
  autoEdit: true, // true single click (false for double-click)
  autoCommitEdit: true,
  compositeEditorOptions: {
    labels: {
      massSelectionButton: 'Apply to Selected & Save',
      massUpdateButton: 'Apply to All & Save'
    }
  },
  datasetIdPropertyName: 'Id',
  defaultFilterPlaceholder: '',
  emptyDataWarning: {
    class: 'slick-empty-data-warning',
    message: `<span class="mdi mdi-alert color-warning"></span> No data to display.`,
    marginTop: 90,
    marginLeft: 10
  },
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
  frozenHeaderWidthCalcDifferential: 2,
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
} as GridOption;
