import { Extension } from './extension.interface';
import { ExtensionName } from '../enums/extensionName.enum';
import { SlickControlList, SlickPluginList } from '../enums';

export interface ExtensionModel {
  /** Name of the Slickgrid-Universal Extension */
  name: ExtensionName;

  /** Instance of the Addon (3rd party SlickGrid Control or Plugin) */
  instance: SlickControlList | SlickPluginList;

  /** Extension Service (in Slickgrid-Universal) */
  class: Extension | null;
}
