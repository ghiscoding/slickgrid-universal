import { Constants } from '../constants.js';
import type { GridMenuItem, GridOption, Locale, MenuCommandItem, MenuOptionItem } from '../interfaces/index.js';
import type { BackendUtilityService } from '../services/backendUtility.service.js';
import type { SharedService } from '../services/shared.service.js';
import type { TranslaterService } from '../services/translater.service.js';
import { getTranslationPrefix } from '../services/utilities.js';

export class ExtensionUtility {
  constructor(
    private readonly sharedService: SharedService,
    private readonly backendUtilities?: BackendUtilityService | undefined,
    public readonly translaterService?: TranslaterService | undefined
  ) {}

  /**
   * From a Grid Menu object property name, we will return the correct title output string following this order
   * 1- if user provided a title, use it as the output title
   * 2- else if user provided a title key, use it to translate the output title
   * 3- else if nothing is provided use text defined as constants
   */
  getPickerTitleOutputString(propName: string, pickerName: 'gridMenu' | 'columnPicker'): string {
    if (this.sharedService.gridOptions?.enableTranslate && !this.translaterService?.translate) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }

    let output = '';
    const picker = this.sharedService.gridOptions?.[pickerName] ?? {};
    const title = (picker as any)?.[propName];
    const titleKey = (picker as any)?.[`${propName}Key`];
    const gridOptions = this.sharedService.gridOptions;
    const translationPrefix = getTranslationPrefix(gridOptions);

    if (!title && titleKey && this.translaterService?.translate) {
      output = this.translaterService.translate(titleKey || ' ');
    } else {
      let transKey = '';
      switch (propName) {
        case 'commandTitle':
          transKey = 'COMMANDS';
          break;
        case 'columnTitle':
          transKey = 'COLUMNS';
          break;
        case 'forceFitTitle':
          transKey = 'FORCE_FIT_COLUMNS';
          break;
        case 'syncResizeTitle':
          transKey = 'SYNCHRONOUS_RESIZE';
          break;
      }
      output = transKey ? this.translateWhenEnabledAndServiceExist(`${translationPrefix}${transKey}`, `TEXT_${transKey}`, title) : title;
    }
    return output;
  }

  /** Refresh the dataset through the Backend Service */
  refreshBackendDataset(inputGridOptions?: GridOption): void {
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
      return !!overrideFn.call(this, args);
    }
    return true;
  }

  /**
   * Sort items (by pointers) in an array by a property name
   * @param {Array<Object>} items array
   * @param {String} property name to sort with
   */
  sortItems(items: any[], propertyName: string): void {
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
  translateItems<T = any>(items: T[], inputKey: string, outputKey: string): void {
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
  translateMenuItemsFromTitleKey(
    items: Array<MenuCommandItem | MenuOptionItem | GridMenuItem | 'divider'>,
    subMenuItemsKey = 'commandItems'
  ): void {
    for (const item of items) {
      // translate `titleKey` and also `subMenuTitleKey` if exists
      if (typeof item === 'object') {
        if (item.titleKey) {
          item.title = this.translateWhenEnabledAndServiceExist(`${item.titleKey}`, `TEXT_${item.titleKey}`, item._orgTitle);
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
