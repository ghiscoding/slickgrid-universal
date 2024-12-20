import type { ExtensionName, SlickControlList, SlickPluginList } from './index.js';
import type { ExtensionModel } from '../interfaces/index.js';

export type ExtensionList<P extends SlickControlList | SlickPluginList> = Record<ExtensionName, ExtensionModel<P>>;
