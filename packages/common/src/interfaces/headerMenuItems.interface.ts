import type { HeaderMenuCommandItemCallbackArgs } from './headerMenu.interface.js';
import type { MenuCommandItem, MenuDivider } from './menuCommandItem.interface.js';
import type { MenuOption } from './menuOption.interface.js';

export interface HeaderMenuItems extends Pick<MenuOption<HeaderMenuCommandItemCallbackArgs>, 'commandListBuilder'> {
  /** List of command items to show in the header menu. */
  commandItems?: Array<MenuCommandItem | MenuDivider>;
}
