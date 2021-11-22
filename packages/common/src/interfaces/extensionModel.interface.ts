import { Extension } from './extension.interface';
import { ExtensionName, SlickControlList, SlickPluginList } from '../enums/index';

export interface ExtensionModel<P extends (SlickControlList | SlickPluginList), E extends Extension> {
  /** Name of the Slickgrid-Universal Extension */
  name: ExtensionName;

  /** Instance of the Addon (3rd party SlickGrid Control or Plugin) */
  instance: P;

  /**
   * @deprecated @use `instance`, the `class` is deprecated because it points to the same reference as `instance` and so will be removed in future release.
   * Class instance of Extension Service (in Slickgrid-Universal)
   */
  class: E;
}
