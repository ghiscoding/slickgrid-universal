import type { ExtensionName, SlickControlList, SlickPluginList } from '../enums/index.js';

export interface ExtensionModel<P extends SlickControlList | SlickPluginList> {
  /** Name of the Slickgrid-Universal Extension */
  name: ExtensionName;

  /** Instance of the Addon (3rd party SlickGrid Control or Plugin) */
  instance: P;

  columnIndexPosition?: number;
}
