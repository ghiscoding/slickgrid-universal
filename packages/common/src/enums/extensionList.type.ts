import { ExtensionName, SlickControlList, SlickPluginList } from './index';
import { Extension, ExtensionModel } from '../interfaces/index';

export type ExtensionList<P extends (SlickControlList | SlickPluginList), E extends Extension> = Record<ExtensionName, ExtensionModel<P, E>>;
