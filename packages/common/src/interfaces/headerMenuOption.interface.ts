import type { HeaderMenuCommandItemCallbackArgs, HeaderMenuLabel, MenuOption } from './index.js';

export interface HeaderMenuOption extends MenuOption<HeaderMenuCommandItemCallbackArgs> {
  /** Auto-align drop menu to the left when not enough viewport space to show on the right */
  autoAlign?: boolean;

  /** When drop menu is aligned to the left, it might not be perfectly aligned with the header menu icon, if that is the case you can add an offset (positive/negative number to move right/left) */
  autoAlignOffset?: number;

  /** an extra CSS class to add to the menu button */
  buttonCssClass?: string;

  /**
   * All the commands text labels
   * NOTE: some of the text have other properties outside of this option (like 'columnResizeByContentCommand', 'clearFilterCommand', 'clearSortCommand', ...) and that is because they were created prior to this refactoring of labels
   */
  commandLabels?: HeaderMenuLabel;

  /** position order index of the "Filter Shortcuts" menu */
  filterShortcutsPositionOrder?: number;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide the "Column Resize by Content" command in the Header Menu (Grid Option "enableColumnResizeOnDoubleClick" has to also be enabled) */
  hideColumnResizeByContentCommand?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide the "Remove Filter" command in the Header Menu (Grid Option "enableHeaderMenu: true" has to be enabled) */
  hideClearFilterCommand?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide the "Remove Sort" command in the Header Menu (Grid Option "enableHeaderMenu: true" has to be enabled) */
  hideClearSortCommand?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide the "Clear Filter" command in the Header Menu (Grid Option "enableHeaderMenu: true" has to be enabled) */
  hideFilterCommand?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to true (opt-in feature), which will hide the "Freeze Columns" command in the Header Menu */
  hideFreezeColumnsCommand?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide Sort (Asc/Desc & Clear Sort) commands in the Header Menu (Grid Option "enableHeaderMenu: true" has to be enabled) */
  hideSortCommands?: boolean;

  /**
   *  @deprecated @use Defaults to false, which will hide the Divider (separator) between the top sort commands and the other clear commands
   * (Grid Option "enableHeaderMenu" and "enableSorting" have to be enabled)
   */
  hideSortCommandsDivider?: boolean;

  /** @deprecated @use `hideCommands` or `commandListBuilder` Defaults to false, which will hide the "Hide Column" command in the Header Menu (Grid Option "enableHeaderMenu: true" has to be enabled) */
  hideColumnHideCommand?: boolean;

  /** A CSS class to be added to the menu item icon. */
  iconCssClass?: string;

  /** icon for the "Remove Filter" command */
  iconClearFilterCommand?: string;

  /** icon for the "Remove Sort" command */
  iconClearSortCommand?: string;

  /** icon for the "Column Resize by Content" command */
  iconColumnResizeByContentCommand?: string;

  /** icon for the "Hide Column" command */
  iconColumnHideCommand?: string;

  /** icon for the "Filter Shortcuts" menu (the shortcuts will be displayed as sub-menus of this parent menu) */
  iconFilterShortcutSubMenu?: string;

  /** icon for the "Freeze Columns" command */
  iconFreezeColumns?: string;

  /** icon for the "Unfreeze Columns" command */
  iconUnfreezeColumns?: string;

  /** icon for the "Sort Ascending" command */
  iconSortAscCommand?: string;

  /** icon for the "Sort Descending" command */
  iconSortDescCommand?: string;

  /** Header Menu dropdown offset top */
  menuOffsetTop?: number;

  /** Minimum width that the drop menu will have */
  minWidth?: number;

  /** CSS class that can be added on the right side of a sub-item parent (typically a chevron-right icon) */
  subItemChevronClass?: string;

  /** Defaults to "mouseover", what event type shoud we use to open sub-menu(s), 2 options are available: "mouseover" or "click" */
  subMenuOpenByEvent?: 'mouseover' | 'click';

  /** Menu item text. */
  title?: string;

  /** Item tooltip. */
  tooltip?: string;
}
