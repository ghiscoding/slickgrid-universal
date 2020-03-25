import { Extension } from './extension.interface';
import { ExtensionName } from '../enums/extensionName.enum';

export interface ExtensionModel {
  /** Name of the Slickgrid-Universal Extension */
  name: ExtensionName;

  /** Instance of the Addon (3rd party SlickGrid Control or Plugin) */
  instance: any;

  /** Extension Service (in Slickgrid-Universal) */
  class: Extension | null;
}
