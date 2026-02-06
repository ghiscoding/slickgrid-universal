import type { ContextMenuLabel } from './contextMenuLabel.interface.js';
import type { MenuCallbackArgs, MenuCommandItem, MenuOptionItem } from './index.js';

export interface ContextMenuOption {
  /** Defaults to true, Auto-align dropup or dropdown menu to the left or right depending on grid viewport available space */
  autoAdjustDrop?: boolean;

  /** Defaults to 0, Optionally add an offset to the auto-align of the drop menu */
  autoAdjustDropOffset?: number;

  /** Defaults to true, Auto-align drop menu to the left or right depending on grid viewport available space */
  autoAlignSide?: boolean;

  /** Defaults to 0, Optionally add an offset to the left/right side auto-align */
  autoAlignSideOffset?: number;

  /** Array of Command Items (title, command, disabled, ...) */
  commandItems?: Array<MenuCommandItem | 'divider'>;

  /**
   * All the commands text labels
   * NOTE: some of the text have other properties outside of this option (like 'exportCsvCommand', 'exportExcelCommand', 'clearGroupingCommand', ...) and that is because they were created prior to this refactoring of labels
   */
  commandLabels?: ContextMenuLabel;

  /** Defaults to undefined, which column to show the Commands list, when not defined the context menu will be shown over all columns */
  commandShownOverColumnIds?: string[];

  /** Optional command title that shows up over the commands list, it will be hidden when nothing is provided */
  commandTitle?: string;

  /** Same as "commandTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  commandTitleKey?: string;

  /** Defaults to "bottom", user can optionally force the Cell Menu drop to be aligned to the top or bottom. */
  dropDirection?: 'top' | 'bottom';

  /** Defaults to "right", user can optionally force the Cell Menu drop to be aligned to the left or right. */
  dropSide?: 'left' | 'right';

  /** Defaults to false, hide the "Clear Grouping" command in the menu (Grid Option "enableGrouping: true" has to be enabled) */
  hideClearAllGrouping?: boolean;

  /** Defaults to false, hide the Close button on top right */
  hideCloseButton?: boolean;

  /** Defaults to false, hide the "Collapse all Groups" command in the menu (Grid Option "enableGrouping: true" has to be enabled) */
  hideCollapseAllGroups?: boolean;

  /** Defaults to false, hide the Commands section even when the commandItems array is filled */
  hideCommandSection?: boolean;

  /** Defaults to false, which will hide the "Copy Cell Value" command in the menu */
  hideCopyCellValueCommand?: boolean;

  /** Defaults to false, hide the "Expand all Groups" command in the menu (Grid Option "enableGrouping: true" has to be enabled) */
  hideExpandAllGroups?: boolean;

  /** Defaults to false, which will hide the "Export to CSV" command in the menu (Grid Option "enableTextExport: true" has to be enabled) */
  hideExportCsvCommand?: boolean;

  /** Defaults to false, which will hide the "Export to Excel" command in the menu (Grid Option "enableExcelExport: true" has to be enabled) */
  hideExportExcelCommand?: boolean;

  /** Defaults to false, which will hide the "Export to PDF" command in the menu (Grid Option "enablePdfExport: true" has to be enabled) */
  hideExportPdfCommand?: boolean;

  /** Defaults to false, which will hide the "Export to Text Delimited" command in the menu (Grid Option "enableTextExport: true" has to be enabled) */
  hideExportTextDelimitedCommand?: boolean;

  /** Defaults to true, do we want to hide the Cell Menu when a scrolling event occurs? */
  hideMenuOnScroll?: boolean;

  /** Defaults to false, Hide the Options section even when the optionItems array is filled */
  hideOptionSection?: boolean;

  /** icon for the "Clear Grouping" command (Grid Option "enableGrouping: true" has to be enabled) */
  iconClearGroupingCommand?: string;

  /** icon for the "Collapse all Groups" command (Grid Option "enableGrouping: true" has to be enabled) */
  iconCollapseAllGroupsCommand?: string;

  /** icon for the "Copy Cell Value" command */
  iconCopyCellValueCommand?: string;

  /** icon for the "Expand all Groups" command (Grid Option "enableGrouping: true" has to be enabled) */
  iconExpandAllGroupsCommand?: string;

  /** icon for the "Export to CSV" command */
  iconExportCsvCommand?: string;

  /** icon for the "Export to Excel" command */
  iconExportExcelCommand?: string;

  /** icon for the "Export to PDF" command */
  iconExportPdfCommand?: string;

  /** icon for the "Export to Text Delimited" command */
  iconExportTextDelimitedCommand?: string;

  /** Maximum height that the drop menu can have, it could be a number (250) or text ("none") */
  maxHeight?: number | string;

  /** Maximum width that the drop menu can have, it could be a number (250) or text ("none") */
  maxWidth?: number | string;

  /**
   * Width that the drop menu can have.
   * NOTE: the menu also has a "min-width" defined in CSS/SASS and setting a "width" below that threshold won't work, you change this min-width via SASS `$slick-menu-min-width`
   */
  width?: number | string;

  /** Array of Option Items (title, option, disabled, ...) */
  optionItems?: Array<MenuOptionItem | 'divider'>;

  /** Defaults to undefined, which column to show the Options list, when not defined the context menu will be shown over all columns */
  optionShownOverColumnIds?: string[];

  /** Optional Title of the Option section, it will be hidden when nothing is provided */
  optionTitle?: string;

  /** Same as "optionTitle", except that it's a translation key which can be used on page load and/or when switching locale */
  optionTitleKey?: string;

  /** Defaults to True, should we show bullets when icons are missing? */
  showBulletWhenIconMissing?: boolean;

  /** CSS class that can be added on the right side of a sub-item parent (typically a chevron-right icon) */
  subItemChevronClass?: string;

  /** Defaults to "mouseover", what event type shoud we use to open sub-menu(s), 2 options are available: "mouseover" or "click" */
  subMenuOpenByEvent?: 'mouseover' | 'click';

  // --
  // action/override callbacks

  /**
   * Default slot renderer for all menu items.
   * This will be used as the default renderer for all items unless overridden by an individual item's `slotRenderer`.
   * The renderer receives both the menu item and args for full context access.
   *
   * @param item - The menu item object (MenuCommandItem or MenuOptionItem)
   * @param args - The callback args providing access to grid, column, dataContext, etc.
   * @returns Either an HTML string or an HTMLElement
   *
   * @example
   * defaultItemRenderer: (item, args) => `<div>${item.title}</div>`
   */
  defaultItemRenderer?: (item: any, args: any) => string | HTMLElement;

  /** Callback method that user can override the default behavior of enabling/disabling an item from the list. */
  menuUsabilityOverride?: (args: MenuCallbackArgs) => boolean;
}
