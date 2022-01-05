import { GridOption, EventNamingStyle } from '@slickgrid-universal/common';

/** Global Grid Options Defaults for Salesforce */
export const SalesforceGlobalGridOptions = {
  autoEdit: true, // true single click (false for double-click)
  autoCommitEdit: true,
  autoFixResizeTimeout: 5 * 60 * 60, // interval is 200ms, so 5x is 1sec, so (5 * 60 * 60 = 60min)
  autoFixResizeRequiredGoodCount: 5 * 60 * 60, // make it the same as the interval timeout, this is equivalent to say don't stop until the timeout is over
  autoFixResizeWhenBrokenStyleDetected: true,
  cellValueCouldBeUndefined: true,
  contextMenu: {
    hideCloseButton: false,
  },
  eventNamingStyle: EventNamingStyle.lowerCaseWithoutOnPrefix,
  compositeEditorOptions: {
    resetEditorButtonCssClass: 'mdi mdi-refresh mdi-15px mdi-v-align-text-top',
    resetFormButtonIconCssClass: 'mdi mdi-refresh mdi-16px mdi-flip-h mdi-v-align-text-top',
    shouldPreviewMassChangeDataset: true,
  },
  datasetIdPropertyName: 'Id',
  emptyDataWarning: {
    message: `<span class="mdi mdi-alert color-warning"></span> No data to display.`,
  },
  enableDeepCopyDatasetOnPageLoad: true,
  enableTextExport: true,
  textExportOptions: {
    exportWithFormatter: true,
    sanitizeDataExport: true,
  },
  enableCellNavigation: true,
  customTooltip: {
    tooltipTextMaxLength: 650,
  },
  filterTypingDebounce: 250,
  formatterOptions: {
    minDecimal: 0,
    maxDecimal: 2,
    thousandSeparator: ','
  },
  frozenHeaderWidthCalcDifferential: 2,
  columnPicker: {
    hideForceFitButton: true,
  },
  gridMenu: {
    commandLabels: {
      clearFrozenColumnsCommandKey: 'UNFREEZE_COLUMNS',
    },
    hideTogglePreHeaderCommand: true,
    hideRefreshDatasetCommand: true,
    hideClearFrozenColumnsCommand: false,
    hideForceFitButton: true,
  },
  headerMenu: {
    hideFreezeColumnsCommand: false,
    iconSortAscCommand: 'fa fa-sort-amount-asc mdi mdi-arrow-up',
    iconSortDescCommand: 'fa fa-sort-amount-desc mdi mdi-arrow-down',
  },
  sanitizer: (dirtyHtml: string) => typeof dirtyHtml === 'string' ? dirtyHtml.replace(/(\b)(on\S+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi, '') : dirtyHtml,
  showCustomFooter: true,
  customFooterOptions: {
    hideMetrics: false,
    hideTotalItemCount: false,
    hideLastUpdateTimestamp: true,
    metricTexts: {
      itemsSelectedKey: 'RECORDS_SELECTED',
    }
  },
  headerRowHeight: 35,
  rowHeight: 33,
  resizeByContentOnlyOnFirstLoad: false,
  resizeByContentOptions: {
    formatterPaddingWidthInPx: 8,
    maxItemToInspectCellContentWidth: 500,
  },
  rowMoveManager: {
    hideRowMoveShadow: false,
  },
  useSalesforceDefaultGridOptions: true,
} as GridOption;
