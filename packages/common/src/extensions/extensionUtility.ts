
import { Constants } from '../constants';
import { Column } from '../interfaces/column.interface';
import { SharedService } from '../services/shared.service';
import { TranslaterService } from '../services';
import { getTranslationPrefix } from '../services/utilities';

export class ExtensionUtility {
  constructor(private readonly sharedService: SharedService, private readonly translaterService?: TranslaterService) { }

  /**
   * From a Grid Menu object property name, we will return the correct title output string following this order
   * 1- if user provided a title, use it as the output title
   * 2- else if user provided a title key, use it to translate the output title
   * 3- else if nothing is provided use text defined as constants
   */
  getPickerTitleOutputString(propName: string, pickerName: 'gridMenu' | 'columnPicker') {
    if (this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }

    let output = '';
    const picker = this.sharedService.gridOptions && this.sharedService.gridOptions[pickerName] || {};
    const enableTranslate = this.sharedService.gridOptions && this.sharedService.gridOptions.enableTranslate || false;

    // get locales provided by user in forRoot or else use default English locales via the Constants
    const locales = this.sharedService && this.sharedService.gridOptions && this.sharedService.gridOptions.locales || Constants.locales;

    const title = picker && picker[propName];
    const titleKey = picker && picker[`${propName}Key`];
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);

    if (titleKey && this.translaterService?.translate) {
      output = this.translaterService.translate(titleKey || ' ');
    } else {
      switch (propName) {
        case 'customTitle':
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
   * Loop through object provided and set to null any property found starting with "onX"
   * @param {Object}: obj
   */
  nullifyFunctionNameStartingWithOn(obj?: any) {
    if (obj) {
      for (const prop of Object.keys(obj)) {
        if (prop.startsWith('on')) {
          obj[prop] = null;
        }
      }
    }
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

  /**
   * Sort items (by pointers) in an array by a property name
   * @params items array
   * @param property name to sort with
   */
  sortItems(items: any[], propertyName: string) {
    // sort the custom items by their position in the list
    if (Array.isArray(items)) {
      items.sort((itemA: any, itemB: any) => {
        if (itemA && itemB && itemA.hasOwnProperty(propertyName) && itemB.hasOwnProperty(propertyName)) {
          return itemA[propertyName] - itemB[propertyName];
        }
        return 0;
      });
    }
  }

  /** Translate the an array of items from an input key and assign to the output key */
  translateItems<T = any>(items: T[], inputKey: string, outputKey: string) {
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item[inputKey]) {
          item[outputKey] = this.translaterService && this.translaterService.getCurrentLanguage && this.translaterService.translate && this.translaterService.translate(item[inputKey]);
        }
      }
    }
  }

  /**
   * When "enabledTranslate" is set to True, we will try to translate if the Translate Service exist or use the Locales when not
   * @param translationKey
   * @param localeKey
   */
  translateWhenEnabledAndServiceExist(translationKey: string, localeKey: string): string {
    let text = '';
    const gridOptions = this.sharedService && this.sharedService.gridOptions;

    // get locales provided by user in main file or else use default English locales via the Constants
    const locales = gridOptions && gridOptions.locales || Constants.locales;

    if (gridOptions.enableTranslate && this.translaterService && this.translaterService.getCurrentLanguage && this.translaterService.translate) {
      text = this.translaterService.translate(translationKey || ' ');
    } else if (locales && locales.hasOwnProperty(localeKey)) {
      text = locales[localeKey];
    } else {
      text = localeKey;
    }
    return text;
  }
}
