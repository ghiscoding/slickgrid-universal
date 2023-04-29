import type { ExtensionName, SlickControlList, SlickPluginList } from './index';
import type { ExtensionModel } from '../interfaces/index';

export type ExtensionList<P extends (SlickControlList | SlickPluginList)> = Record<ExtensionName, ExtensionModel<P>>;
