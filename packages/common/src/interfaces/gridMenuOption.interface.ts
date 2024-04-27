import type { Column, GridMenuCallbackArgs, GridMenuCommandItemCallbackArgs, GridMenuLabel, GridOption, MenuCallbackArgs, MenuCommandItem, } from './index';

export interface GridMenuOption {
  /**
   * All the commands text labels
   * NOTE: some of the text have other properties outside of this option (like 'commandTitle', 'forceFitTitle', ...) and that is because they were created prior to this refactoring of labels
   */
  commandLabels?: GridMenuLabel;

  /** Defaults to "Commands" which is the title that shows up over the custom commands list */
  commandTitle?: string;

  /** Same as "commandTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  commandTitleKey?: string;

  /** Array of command items (title, command, disabled, ...) */
  commandItems?: Array<MenuCommandItem<GridMenuCommandItemCallbackArgs, GridMenuCallbackArgs> | 'divider'>;

  /** Defaults to 0 (auto), minimum width of grid menu content (command, column list) */
  contentMinWidth?: number;

  /** Defaults to "Columns" which is the title that shows up over the columns */
  columnTitle?: string;

  /** Same as "columnTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  columnTitleKey?: string;

  /** Defaults to "left", which side to align the grid menu dropdown? */
  dropSide?: 'left' | 'right';

  /** Defaults to "Force fit columns" which is 1 of the last 2 checkbox title shown at the end of the picker list */
  forceFitTitle?: string;

  /** Same as "forceFitTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  forceFitTitleKey?: string;

  /**
   * Defaults to undefined, fixed height of the Grid Menu content, when provided it will be used instead of the max-height.
   * Can be a number or a string, if a number is provided it will add the `px` suffix for pixels, or if a string is passed it will use it as is.
   */
  height?: number | string;

  /** Defaults to false, which will hide the "Clear all Filters" command in the Grid Menu (Grid Option "enableFiltering: true" has to be enabled) */
  hideClearAllFiltersCommand?: boolean;

  /** Defaults to false, which will hide the "Clear all Sorting" command in the Grid Menu (Grid Option "enableSorting: true" has to be enabled) */
  hideClearAllSortingCommand?: boolean;

  /** Defaults to true, which will hide the "Unfreeze Columns/Rows" command in the Grid Menu */
  hideClearFrozenColumnsCommand?: boolean;

  /** Defaults to false, hide the Close button on top right */
  hideCloseButton?: boolean;

  /** Defaults to false, which will hide the "Export to CSV" command in the Grid Menu (Grid Option "enableTextExport: true" has to be enabled) */
  hideExportCsvCommand?: boolean;

  /** Defaults to false, which will hide the "Export to Excel" command in the Grid Menu (Grid Option "enableExcelExport: true" has to be enabled) */
  hideExportExcelCommand?: boolean;

  /** Defaults to false, which will hide the "Export to Text Delimited" command in the Grid Menu (Grid Option "enableTextExport: true" has to be enabled) */
  hideExportTextDelimitedCommand?: boolean;

  /** Defaults to false, show/hide 1 of the last 2 checkbox at the end of the picker list */
  hideForceFitButton?: boolean;

  /** Defaults to false, which will hide the "Refresh Dataset" command in the Grid Menu (only works with a Backend Service API) */
  hideRefreshDatasetCommand?: boolean;

  /** Defaults to false, show/hide 1 of the last 2 checkbox at the end of the picker list */
  hideSyncResizeButton?: boolean;

  /** Defaults to true, which will hide the "Toggle Dark Mode" command in the Grid Menu. */
  hideToggleDarkModeCommand?: boolean;

  /** Defaults to false, which will hide the "Toggle Filter Row" command in the Grid Menu (Grid Option "enableFiltering: true" has to be enabled) */
  hideToggleFilterCommand?: boolean;

  /** Defaults to true, which will hide the "Toggle Pre-Header Row" (used by draggable grouping) command in the Grid Menu (Grid Option "showPreHeaderPanel: true" has to be enabled) */
  hideTogglePreHeaderCommand?: boolean;

  /** CSS class for the displaying the Grid menu icon (basically the hamburger menu) */
  iconCssClass?: string;

  /** icon for the "Clear all Filters" command */
  iconClearAllFiltersCommand?: string;

  /** icon for the "Clear all Sorting" command */
  iconClearAllSortingCommand?: string;

  /** icon for the "Unfreeze Columns/Rows" command */
  iconClearFrozenColumnsCommand?: string;

  /** icon for the "Export to CSV" command */
  iconExportCsvCommand?: string;

  /** icon for the "Export to Excel" command */
  iconExportExcelCommand?: string;

  /** icon for the "Export to Text Delimited" command */
  iconExportTextDelimitedCommand?: string;

  /** icon for the "Refresh Dataset" command */
  iconRefreshDatasetCommand?: string;

  /** icon for the "Toggle Dark Mode" command */
  iconToggleDarkModeCommand?: string;

  /** icon for the "Toggle Filter Row" command */
  iconToggleFilterCommand?: string;

  /** icon for the "Toggle Pre-Header Row" command */
  iconTogglePreHeaderCommand?: string;

  /** Defaults to False, which leads to leaving the menu open after a click */
  leaveOpen?: boolean;

  /** Defaults to 15, margin to use at the bottom of the grid menu to deduce from the max-height, only in effect when height is undefined */
  marginBottom?: number;

  /**
   * Defaults to available space at the bottom, Grid Menu minimum height.
   * Can be a number or a string, if a number is provided it will add the `px` suffix for pixels, or if a string is passed it will use it as is.
   */
  maxHeight?: number | string;

  /** Defaults to 16 pixels (only the number), which is the width in pixels of the Grid Menu icon container */
  menuWidth?: number;

  /**
   * Defaults to 200(px), Grid Menu minimum height.
   * Can be a number or a string, if a number is provided it will add the `px` suffix for pixels, or if a string is passed it will use it as is.
   */
  minHeight?: number | string;

  /** Defaults to False, which will resize the Header Row and remove the width of the Grid Menu icon from it's total width. */
  resizeOnShowHeaderRow?: boolean;

  /** Defaults to true, allows the user to control if the default gridMenu button (located on the top right corner by default CSS) should be created or omitted */
  showButton?: boolean;

  /** Defaults to True, should we show bullets when icons are missing? */
  showBulletWhenIconMissing?: boolean;

  /** CSS class that can be added on the right side of a sub-item parent (typically a chevron-right icon) */
  subItemChevronClass?: string;

  /** Defaults to "mouseover", what event type shoud we use to open sub-menu(s), 2 options are available: "mouseover" or "click" */
  subMenuOpenByEvent?: 'mouseover' | 'click';

  /** Defaults to "Synchronous resize" which is 1 of the last 2 checkbox title shown at the end of the picker list */
  syncResizeTitle?: string;

  /** Same as "syncResizeTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  syncResizeTitleKey?: string;

  /**
   * Width (alias to `menuWidth`) that the drop menu can have.
   * NOTE: the menu also has a "min-width" defined in CSS/SASS and setting a "width" below that threshold won't work, you change this min-width via SASS `$slick-menu-min-width`
   */
  width?: number | string;

  // --
  // action/override callbacks

  /** Callback method to override the column name output used by the ColumnPicker/GridMenu. */
  headerColumnValueExtractor?: (column: Column, gridOptions?: GridOption) => string | HTMLElement | DocumentFragment;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  menuUsabilityOverride?: (args: MenuCallbackArgs<any>) => boolean;
}
