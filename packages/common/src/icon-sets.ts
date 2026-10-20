import type { GridOption } from './interfaces/index.js';

/** Default menu icons (Grid Menu, Header Menu, Context Menu, Cell Menu) when using the Material icons (default icon set) */
export const MaterialIconSetOptions: Partial<GridOption> = {
  contextMenu: {
    iconCollapseAllGroupsCommand: 'mdi mdi-arrow-collapse',
    iconExpandAllGroupsCommand: 'mdi mdi-arrow-expand',
    iconClearGroupingCommand: 'mdi mdi-close',
    iconCopyCellValueCommand: 'mdi mdi-content-copy',
    iconExportCsvCommand: 'mdi mdi-file-document-outline',
    iconExportExcelCommand: 'mdi mdi-file-excel-outline',
    iconExportPdfCommand: 'mdi mdi-file-pdf-outline text-danger',
    iconExportTextDelimitedCommand: 'mdi mdi-file-document-outline',
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
  cellMenu: {
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
  gridMenu: {
    iconCssClass: 'mdi mdi-menu',
    iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
    iconClearAllSortingCommand: 'mdi mdi-sort-variant-off',
    iconClearPinningCommand: 'mdi mdi-pin-off-outline',
    iconExportCsvCommand: 'mdi mdi-file-document-outline',
    iconExportExcelCommand: 'mdi mdi-file-excel-outline',
    iconExportPdfCommand: 'mdi mdi-file-pdf-outline text-danger',
    iconExportTextDelimitedCommand: 'mdi mdi-file-document-outline',
    iconRefreshDatasetCommand: 'mdi mdi-sync',
    iconToggleDarkModeCommand: 'mdi mdi-brightness-4',
    iconToggleFilterCommand: 'mdi mdi-flip-vertical',
    iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
  headerMenu: {
    iconClearFilterCommand: 'mdi mdi-filter-remove-outline',
    iconClearSortCommand: 'mdi mdi-sort-variant-off',
    iconFilterShortcutSubMenu: 'mdi mdi-filter-outline',
    iconPinColumn: 'mdi mdi-pin-outline',
    iconPinCommand: 'mdi mdi-pin-outline',
    iconPinningColumns: 'mdi mdi-pin-outline',
    iconUnpinColumn: 'mdi mdi-pin-off-outline',
    iconUnpinningColumns: 'mdi mdi-pin-off-outline',
    iconSortAscCommand: 'mdi mdi-arrow-up',
    iconSortDescCommand: 'mdi mdi-arrow-down',
    iconColumnHideCommand: 'mdi mdi-close',
    iconColumnResizeByContentCommand: 'mdi mdi-arrow-expand-horizontal',
    subItemChevronClass: 'mdi mdi-chevron-down mdi-rotate-270',
  },
};

/** Default menu icons (Grid Menu, Header Menu, Context Menu, Cell Menu) when using the Fluent theme */
export const FluentIconSetOptions: Partial<GridOption> = {
  contextMenu: {
    iconCollapseAllGroupsCommand: 'fi fi-arrow-minimize',
    iconExpandAllGroupsCommand: 'fi fi-arrow-maximize',
    iconClearGroupingCommand: 'fi fi-dismiss',
    iconCopyCellValueCommand: 'fi fi-copy',
    iconExportCsvCommand: 'fi fi-arrow-download',
    iconExportExcelCommand: 'fi fi-arrow-download',
    iconExportPdfCommand: 'fi fi-arrow-download',
    iconExportTextDelimitedCommand: 'fi fi-arrow-download',
    subItemChevronClass: 'fi fi-chevron-right',
  },
  cellMenu: {
    subItemChevronClass: 'fi fi-chevron-right',
  },
  gridMenu: {
    iconCssClass: 'fi fi-navigation',
    iconClearAllFiltersCommand: 'fi fi-filter-dismiss',
    iconClearAllSortingCommand: 'fi fi-arrow-sort',
    iconClearPinningCommand: 'fi fi-pin-off',
    iconExportCsvCommand: 'fi fi-arrow-download',
    iconExportExcelCommand: 'fi fi-arrow-download',
    iconExportPdfCommand: 'fi fi-arrow-download',
    iconExportTextDelimitedCommand: 'fi fi-arrow-download',
    iconRefreshDatasetCommand: 'fi fi-arrow-sync',
    iconToggleDarkModeCommand: 'fi fi-dark-theme',
    iconToggleFilterCommand: 'fi fi-split-horizontal',
    iconTogglePreHeaderCommand: 'fi fi-split-horizontal',
    subItemChevronClass: 'fi fi-chevron-right',
  },
  headerMenu: {
    iconClearFilterCommand: 'fi fi-filter-dismiss',
    iconClearSortCommand: 'fi fi-arrow-sort',
    iconFilterShortcutSubMenu: 'fi fi-filter',
    iconPinColumn: 'fi fi-pin',
    iconPinCommand: 'fi fi-pin',
    iconPinningColumns: 'fi fi-pin',
    iconUnpinColumn: 'fi fi-pin-off',
    iconUnpinningColumns: 'fi fi-pin-off',
    iconSortAscCommand: 'fi fi-sort-arrow-up',
    iconSortDescCommand: 'fi fi-sort-arrow-down',
    iconColumnHideCommand: 'fi fi-dismiss',
    iconColumnResizeByContentCommand: 'fi fi-arrow-bidirection',
    subItemChevronClass: 'fi fi-chevron-right',
  },
};

/**
 * Get the default menu icons of an icon set ("material" by default). These are meant to be used as the base layer of the grid options merge
 * (before the global grid options and the user grid options), so that any icon provided globally or by the user always wins.
 */
export function getIconSetOptions(iconSet?: GridOption['iconSet']): Partial<GridOption> {
  return iconSet === 'fluent' ? FluentIconSetOptions : MaterialIconSetOptions;
}
