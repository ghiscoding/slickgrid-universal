import { Constants } from '../constants';
import type { Column, GridMenuItem, GridOption, Locale, MenuCommandItem, MenuOptionItem, } from '../interfaces/index';
import type { BackendUtilityService } from '../services/backendUtility.service';
import type { SharedService } from '../services/shared.service';
import type { TranslaterService } from '../services/translater.service';
import { getTranslationPrefix } from '../services/utilities';

export class ExtensionUtility {
  constructor(
    private readonly sharedService: SharedService,
    private readonly backendUtilities?: BackendUtilityService,
    public readonly translaterService?: TranslaterService
  ) { }

  /**
   * From a Grid Menu object property name, we will return the correct title output string following this order
   * 1- if user provided a title, use it as the output title
   * 2- else if user provided a title key, use it to translate the output title
   * 3- else if nothing is provided use text defined as constants
   */
  getPickerTitleOutputString(propName: string, pickerName: 'gridMenu' | 'columnPicker') {
    if (this.sharedService.gridOptions?.enableTranslate && (!this.translaterService?.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    let output = '';
    const picker = this.sharedService.gridOptions?.[pickerName] ?? {};
    const enableTranslate = this.sharedService.gridOptions?.enableTranslate ?? false;

    // get locales provided by user in forRoot or else use default English locales via the Constants
    const locales = this.sharedService.gridOptions?.locales ?? Constants.locales;

    const title = (picker as any)?.[propName];
    const titleKey = (picker as any)?.[`${propName}Key`];
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);

    if (titleKey && this.translaterService?.translate) {
      output = this.translaterService.translate(titleKey || ' ');
    } else {
      switch (propName) {
        case 'commandTitle':
          output = title || enableTranslate && this.translaterService?.getCurrentLanguage && this.translaterService?.translate(`${translationPrefix}COMMANDS` || ' ') || locales?.TEXT_COMMANDS;
          break;
        case 'columnTitle':
          output = title || enableTranslate && this.translaterService?.getCurrentLanguage && this.translaterService?.translate(`${translationPrefix}COLUMNS` || ' ') || locales?.TEXT_COLUMNS;
          break;
        case 'forceFitTitle':
          output = title || enableTranslate && this.translaterService?.getCurrentLanguage && this.translaterService?.translate(`${translationPrefix}FORCE_FIT_COLUMNS` || ' ') || locales?.TEXT_FORCE_FIT_COLUMNS;
          break;
        case 'syncResizeTitle':
          output = title || enableTranslate && this.translaterService?.getCurrentLanguage && this.translaterService?.translate(`${translationPrefix}SYNCHRONOUS_RESIZE` || ' ') || locales?.TEXT_SYNCHRONOUS_RESIZE;
          break;
        default:
          output = title;
          break;
      }
    }
    return output;
  }

  /**
   * When using ColumnPicker/GridMenu to show/hide a column, we potentially need to readjust the grid option "frozenColumn" index.
   * That is because SlickGrid freezes by column index and it has no knowledge of the columns themselves and won't change the index, we need to do that ourselves whenever necessary.
   * Note: we call this method right after the visibleColumns array got updated, it won't work properly if we call it before the setting the visibleColumns.
   * @param {Number} frozenColumnIndex - current frozenColumn index
   * @param {Array<Object>} allColumns - all columns (including hidden ones)
   * @param {Array<Object>} visibleColumns - only visible columns (excluding hidden ones)
   */
  readjustFrozenColumnIndexWhenNeeded(frozenColumnIndex: number, allColumns: Column[], visibleColumns: Column[]) {
    if (frozenColumnIndex >= 0) {
      const recalculatedFrozenColumnIndex = visibleColumns.findIndex(col => col.id === this.sharedService.frozenVisibleColumnId);
      if (recalculatedFrozenColumnIndex >= 0 && recalculatedFrozenColumnIndex !== frozenColumnIndex) {
        this.sharedService.gridOptions.frozenColumn = recalculatedFrozenColumnIndex;
        this.sharedService.slickGrid.setOptions({ frozenColumn: recalculatedFrozenColumnIndex });
      }

      // to freeze columns, we need to take only the visible columns and we also need to use setColumns() when some of them are hidden
      // to make sure that we only use the visible columns, not doing this would show back some of the hidden columns
      if (Array.isArray(visibleColumns) && Array.isArray(allColumns) && visibleColumns.length !== allColumns.length) {
        this.sharedService.slickGrid.setColumns(visibleColumns);
      }
    }
  }

  /** Refresh the dataset through the Backend Service */
  refreshBackendDataset(inputGridOptions?: GridOption) {
    // user can pass new set of grid options which will override current ones
    let gridOptions = this.sharedService.gridOptions;
    if (inputGridOptions) {
      gridOptions = { ...this.sharedService.gridOptions, ...inputGridOptions };
      this.sharedService.gridOptions = gridOptions;
    }
    this.backendUtilities?.refreshBackendDataset(gridOptions);
  }

  /** Run the Override function when it exists, if it returns True then it is usable/visible */
  runOverrideFunctionWhenExists<T = any>(overrideFn: ((args: any) => boolean) | undefined, args: T): boolean {
    if (typeof overrideFn === 'function') {
      return !!(overrideFn.call(this, args));
    }
    return true;
  }

  /**
   * Sort items (by pointers) in an array by a property name
   * @param {Array<Object>} items array
   * @param {String} property name to sort with
   */
  sortItems(items: any[], propertyName: string) {
    // sort the command items by their position in the list
    if (Array.isArray(items)) {
      items.sort((itemA: any, itemB: any) => {
        if (itemA && itemB && itemA.hasOwnProperty(propertyName) && itemB.hasOwnProperty(propertyName)) {
          return itemA[propertyName] - itemB[propertyName];
        }
        return 0;
      });
    }
  }

  /** Translate the array of items from an input key and assign them to their output key */
  translateItems<T = any>(items: T[], inputKey: string, outputKey: string) {
    if (Array.isArray(items)) {
      for (const item of items) {
        if ((item as any).hasOwnProperty(inputKey)) {
          (item as any)[outputKey] = this.translaterService?.translate?.((item as any)[inputKey]);
        }
      }
    }
  }

  /**
   * Loop through all Menu Command Items and use `titleKey`, `subMenuTitleKey` properties to translate (or use Locale) appropriate `title` property
   * @param {Array<MenuCommandItem | String>} items - Menu Command Items array
   * @param {Object} gridOptions - Grid Options
   */
  translateMenuItemsFromTitleKey(items: Array<MenuCommandItem | MenuOptionItem | GridMenuItem | 'divider'>, subMenuItemsKey = 'commandItems') {
    for (const item of items) {
      // translate `titleKey` and also `subMenuTitleKey` if exists
      if (typeof item === 'object') {
        if (item.titleKey) {
          item.title = this.translateWhenEnabledAndServiceExist(`${item.titleKey}`, `TEXT_${item.titleKey}`);
        }
        if (item.subMenuTitleKey) {
          item.subMenuTitle = this.translateWhenEnabledAndServiceExist(`${item.subMenuTitleKey}`, `TEXT_${item.subMenuTitleKey}`);
        }
      }
      // an item can also have nested sub-menu items, we can use recursion to translate them as well
      if (Array.isArray((item as any)?.[subMenuItemsKey])) {
        this.translateMenuItemsFromTitleKey((item as any)?.[subMenuItemsKey]);
      }
    }
  }

  /**
   * When "enabledTranslate" is set to True, we will try to translate if the Translate Service exist or use the Locales when not
   * @param {String} translationKey
   * @param {String} localeKey
   * @param {String} textToUse - optionally provide a static text to use (that will completely override the other arguments of the method)
   */
  translateWhenEnabledAndServiceExist(translationKey: string, localeKey: string, textToUse?: string): string {
    let text = '';
    const gridOptions = this.sharedService?.gridOptions;

    // get locales provided by user in main file or else use default English locales via the Constants
    const locales = gridOptions?.locales ?? Constants.locales;

    if (textToUse) {
      text = textToUse;
    } else if (gridOptions.enableTranslate && this.translaterService?.translate) {
      text = this.translaterService.translate(translationKey || ' ');
    } else if (localeKey in locales) {
      text = locales[localeKey as keyof Locale] as string;
    } else {
      text = localeKey;
    }
    return text;
  }
}
