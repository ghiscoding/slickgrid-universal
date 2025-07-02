export interface ContextMenuLabel {
  /** Defaults to "Copy Cell Value" */
  copyCellValueCommand?: string;

  /** Defaults to "COPY" translation key */
  copyCellValueCommandKey?: string;

  /** Defaults to "Export to CSV" */
  exportCsvCommand?: string;

  /** Defaults to "EXPORT_TO_CSV" translation key */
  exportCsvCommandKey?: string;

  /** Defaults to "Export to Excel" */
  exportExcelCommand?: string;

  /** Defaults to "EXPORT_TO_EXCEL" translation key */
  exportExcelCommandKey?: string;

  /** Defaults to "Export to Text Delimited" */
  exportTextDelimitedCommand?: string;

  /** Defaults to "EXPORT_TO_TAB_DELIMITED" translation key */
  exportTextDelimitedCommandKey?: string;

  /** Defaults to "Clear Grouping" */
  clearGroupingCommand?: string;

  /** Defaults to "CLEAR_ALL_GROUPING" translation key */
  clearGroupingCommandKey?: string;

  /** Defaults to "Collapse all Groups" */
  collapseAllGroupsCommand?: string;

  /** Defaults to "COLLAPSE_ALL_GROUPS" translation key */
  collapseAllGroupsCommandKey?: string;

  /** Defaults to "Expand all Groups" */
  expandAllGroupsCommand?: string;

  /** Defaults to "EXPAND_ALL_GROUPS" translation key */
  expandAllGroupsCommandKey?: string;
}
