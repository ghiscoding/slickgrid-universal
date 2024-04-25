import { createDomElement, type GridOption } from '@slickgrid-universal/common';
import { EventNamingStyle } from '@slickgrid-universal/event-pub-sub';

// create empty warning message as Document Fragment to be CSP safe
const emptyWarningElm = document.createElement('div');
emptyWarningElm.appendChild(createDomElement('span', { className: 'sgi sgi-alert text-color-warning' }));
emptyWarningElm.appendChild(document.createTextNode(' No data to display.'));

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
    resetEditorButtonCssClass: 'sgi sgi-refresh sgi-15px',
    resetFormButtonIconCssClass: 'sgi sgi-refresh sgi-16px sgi-flip-h',
    shouldPreviewMassChangeDataset: true,
  },
  datasetIdPropertyName: 'Id',
  emptyDataWarning: {
    message: emptyWarningElm
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
  enableExcelExport: true,
  excelExportOptions: {
    exportWithFormatter: true,
    mimeType: '', // Salesforce doesn't like Excel MIME type (not allowed), but we can bypass the problem by using no type at all
    sanitizeDataExport: true
  },
  filterTypingDebounce: 250,
  formatterOptions: {
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
    hideToggleDarkModeCommand: false,
    hideTogglePreHeaderCommand: true,
    hideRefreshDatasetCommand: true,
    hideClearFrozenColumnsCommand: false,
    hideForceFitButton: true,
  },
  headerMenu: {
    hideFreezeColumnsCommand: false,
    iconSortAscCommand: 'sgi sgi-arrow-up',
    iconSortDescCommand: 'sgi sgi-arrow-down',
  },
  preventDocumentFragmentUsage: true,
  sanitizer: (dirtyHtml: string) => typeof dirtyHtml === 'string' ? dirtyHtml.replace(/(\b)(on[a-z]+)(\s*)=|javascript:([^>]*)[^>]*|(<\s*)(\/*)script([<>]*).*(<\s*)(\/*)script(>*)|(&lt;)(\/*)(script|script defer)(.*)(&gt;|&gt;">)/gi, '') : dirtyHtml,
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
