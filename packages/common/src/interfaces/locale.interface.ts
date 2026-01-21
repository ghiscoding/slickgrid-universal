export interface Locale {
  /** Text "All Selected" displayed in the Multiple Select Editor/Filter */
  TEXT_ALL_SELECTED: string;

  /** Text "All {{x}} records selected" displayed in a Composite Editor modal of type  "mass-update". */
  TEXT_ALL_X_RECORDS_SELECTED?: string;

  /** Text "Apply Mass Update" displayed in the Composite Editor with a "mass-update" modal type. */
  TEXT_APPLY_MASS_UPDATE?: string;

  /** Text "Update Selection" used by the "Mass Selection" button label in a Composite Editor modal. */
  TEXT_APPLY_TO_SELECTION?: string;

  /** Text "Cancel" shown in the Long Text Editor dialog */
  TEXT_CANCEL: string;

  /** Text "Clear all Filters" shown in Header Menu */
  TEXT_CLEAR_ALL_FILTERS: string;

  /** Text "Clear all Grouping" displayed in the Context Menu when Grouping is enabled */
  TEXT_CLEAR_ALL_GROUPING: string;

  /** Text "Collapse all Grouping" displayed in the Context Menu when Grouping is enabled */
  TEXT_COLLAPSE_ALL_GROUPS: string;

  /** Text "Clear all Sorting" shown in Header Menu */
  TEXT_CLEAR_ALL_SORTING: string;

  /** Text "Unfreeze Columns/Rows" shown in Grid Menu */
  TEXT_CLEAR_PINNING: string;

  /** Text "Clone" displayed in the Composite Editor with a "clone" modal type. */
  TEXT_CLONE?: string;

  /** Text "Columns" title displayed in the Column Picker & Grid Menu (when enabled) */
  TEXT_COLUMNS: string;

  /** Text "Column Resize by Content" title displayed in the Header Menu */
  TEXT_COLUMN_RESIZE_BY_CONTENT?: string;

  /** Text "Commands" title displayed in the Column Picker & Grid Menu (when enabled) */
  TEXT_COMMANDS: string;

  /** Text "Contains" shown in Compound Editors/Filters as an Operator */
  TEXT_CONTAINS: string;

  /** Text "Copy" shown in Context Menu to copy a cell value */
  TEXT_COPY: string;

  /** Text "Drop a column header here to group by the column" which shows in the pre-header when using the Draggable Grouping plugin */
  TEXT_DROP_COLUMN_HEADER_TO_GROUP_BY?: string;

  /** Text "Starts With" shown in Compound Editors/Filters as an Operator */
  TEXT_ENDS_WITH: string;

  /** Text "Equals" shown in Compound Editors/Filters as an Operator */
  TEXT_EQUALS: string;

  /** Text "Equal to" shown in Compound Editors/Filters as an Operator */
  TEXT_EQUAL_TO: string;

  /** Error Text "Editable Grid Required" displayed by the Composite Editor component  */
  TEXT_ERROR_EDITABLE_GRID_REQUIRED?: string;

  /** Error Text "Cell Navigation Required when using Composite Editor modal" displayed by the Composite Editor component  */
  TEXT_ERROR_ENABLE_CELL_NAVIGATION_REQUIRED?: string;

  /** Error Text "No Changes Detected" displayed by the Composite Editor component  */
  TEXT_ERROR_NO_CHANGES_DETECTED?: string;

  /** Error Text "No Editor Found" displayed by the Composite Editor component  */
  TEXT_ERROR_NO_EDITOR_FOUND?: string;

  /** Error Text "No Record Found" displayed by the Composite Editor component  */
  TEXT_ERROR_NO_RECORD_FOUND?: string;

  /** Error Text "Current Row is not Editable" displayed by the Composite Editor component  */
  TEXT_ERROR_ROW_NOT_EDITABLE?: string;

  /** Error Text "Requires Row Selection for Mass Selection" displayed by the Composite Editor component  */
  TEXT_ERROR_ROW_SELECTION_REQUIRED?: string;

  /** Text "Expand all Grouping" displayed in the Context Menu when Grouping is enabled */
  TEXT_EXPAND_ALL_GROUPS: string;

  /** Text "Export in CSV Format" shown in Grid Menu (when enabled) */
  TEXT_EXPORT_TO_CSV: string;

  /** Text "Export in Text format (Tab delimited)" shown in Grid Menu (when enabled) */
  TEXT_EXPORT_TO_TAB_DELIMITED?: string;

  /** Text "Export in Text Format" shown in Grid Menu (when enabled) */
  TEXT_EXPORT_TO_TEXT_FORMAT?: string;

  /** Text "Export to Excel" shown in Grid Menu (when enabled) */
  TEXT_EXPORT_TO_EXCEL: string;

  /** Text "Export to PDF" shown in Grid Menu (when enabled) */
  TEXT_EXPORT_TO_PDF: string;

  /** Text "Filter Shortcuts" shown in Header Menu (when shortcuts are provided to a column filter) */
  TEXT_FILTER_SHORTCUTS?: string;

  /** Text "Force fit Columns" displayed in the Column Picker & Grid Menu (when enabled) */
  TEXT_FORCE_FIT_COLUMNS: string;

  /** Text "Freeze Columns" shown in Header Menu (when enabled) */
  TEXT_FREEZE_COLUMNS?: string;

  /** Text "Greater than" shown in Compound Editors/Filters as an Operator */
  TEXT_GREATER_THAN: string;

  /** Text "Greater than or equal to" shown in Compound Editors/Filters as an Operator */
  TEXT_GREATER_THAN_OR_EQUAL_TO: string;

  /** Text "Group by" shown in Export when using Grouping (when enabled) */
  TEXT_GROUP_BY: string;

  /** Text "Hide Column" shown in Header Menu */
  TEXT_HIDE_COLUMN: string;

  /** Text "items" displayed in the Pagination (when enabled) */
  TEXT_ITEMS?: string;

  /** Text "items per page" displayed in the Pagination (when enabled) */
  TEXT_ITEMS_PER_PAGE?: string;

  /** Text "Records Selected" displayed in the Custom Footer */
  TEXT_ITEMS_SELECTED?: string;

  /** Text "of" displayed in the Pagination (when enabled) */
  TEXT_OF?: string;

  /** Text "Last Update" displayed in the Footer (when enabled) */
  TEXT_LAST_UPDATE?: string;

  /** Text "Less than" shown in Compound Editors/Filters as an Operator */
  TEXT_LESS_THAN: string;

  /** Text "Less than or equal to" shown in Compound Editors/Filters as an Operator */
  TEXT_LESS_THAN_OR_EQUAL_TO: string;

  /** Text "Loading..." displayed in the Multiple Select Filter lazy loading */
  TEXT_LOADING: string;

  /** Text "No elements found" that could show when nothing is returned in the Autocomplete */
  TEXT_NO_ELEMENTS_FOUND?: string;

  /** Text "No matches found" that could show when nothing is returned in the multiple-select */
  TEXT_NO_MATCHES_FOUND?: string;

  /** Text "Not contains" shown in Compound Editors/Filters as an Operator */
  TEXT_NOT_CONTAINS: string;

  /** Text "Not equal to" shown in Compound Editors/Filters as an Operator */
  TEXT_NOT_EQUAL_TO: string;

  /** Text "OK" displayed in the Multiple Select Editor/Filter */
  TEXT_OK: string;

  /** Text "Options" title displayed in the Column Picker & Grid Menu (when enabled) */
  TEXT_OPTIONS: string;

  /** Text "Page" displayed in the Pagination (when enabled) */
  TEXT_PAGE?: string;

  /** Text "records selected" optionally shown in the Footer (when enabled) */
  TEXT_RECORDS_SELECTED?: string;

  /** Text "Refresh Dataset" displayed in the Grid Menu (when enabled) */
  TEXT_REFRESH_DATASET?: string;

  /** Text "Remove Filter" shown in Header Menu */
  TEXT_REMOVE_FILTER: string;

  /** Text "Remove Sort" shown in Header Menu */
  TEXT_REMOVE_SORT: string;

  /** Text "Reset Input Value" optionally shown in the Composite Editor Modal beside each editor */
  TEXT_RESET_INPUT_VALUE?: string;

  /** Text "Reset Form" optionally shown in the Composite Editor Modal */
  TEXT_RESET_FORM?: string;

  /** Text "Save" shown in the Long Text Editor dialog */
  TEXT_SAVE: string;

  /** Text "Select All" displayed in the Multiple Select Editor/Filter */
  TEXT_SELECT_ALL: string;

  /** Text "Clear Sort Ascending" shown in Header Menu */
  TEXT_SORT_ASCENDING: string;

  /** Text "Clear Sort Descending" shown in Header Menu */
  TEXT_SORT_DESCENDING: string;

  /** Text "Starts With" shown in Compound Editors/Filters as an Operator */
  TEXT_STARTS_WITH: string;

  /** Text "Synchronous Resize" displayed in the Column Picker & Grid Menu (when enabled) */
  TEXT_SYNCHRONOUS_RESIZE?: string;

  /** Text "Toggle all Groups" which can optionally show in a button inside the Draggable Grouping pre-header row */
  TEXT_TOGGLE_ALL_GROUPS?: string;

  /** Text "Toggle Dark Mode" shown in Grid Menu (when enabled) */
  TEXT_TOGGLE_DARK_MODE?: string;

  /** Text "Toggle Filter Row" shown in Grid Menu (when enabled) */
  TEXT_TOGGLE_FILTER_ROW?: string;

  /** Text "Toggle Pre-Header Row" shown in Grid Menu (when enabled) */
  TEXT_TOGGLE_PRE_HEADER_ROW?: string;

  /** Text "Unfreeze Columns" shown in Grid Menu, this is an alternative to the text (CLEAR_PINNING: Unfreeze Columns/Rows) */
  TEXT_UNFREEZE_COLUMNS?: string;

  /** Text "x of y selected" displayed in the Multiple Select Editor/Filter */
  TEXT_X_OF_Y_SELECTED: string;

  /** Text "x of y selected" status text displayed in the Composite Editor with a "mass-selection" modal type. */
  TEXT_X_OF_Y_MASS_SELECTED?: string;
}
