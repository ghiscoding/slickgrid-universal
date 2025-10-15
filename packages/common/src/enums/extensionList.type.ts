import type { ExtensionModel } from '../interfaces/index.js';
import type { ExtensionName, SlickControlList, SlickPluginList } from './index.js';

export type ExtensionList<P extends SlickControlList | SlickPluginList> = Record<ExtensionName, ExtensionModel<P>>;
