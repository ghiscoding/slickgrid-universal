import type { MenuCommandItem } from './menuCommandItem.interface';

export interface HeaderMenuItems {
  /** List of command items to show in the header menu. */
  commandItems?: Array<HeaderMenuCommandItem | 'divider'>;

  /** @deprecated use `commandItems` instead. List of commands to show in the header menu. */
  items?: Array<HeaderMenuCommandItem | 'divider'>;
}


export interface HeaderMenuCommandItem extends Omit<MenuCommandItem, 'commandItems'> {
  /** Array of Command Items (title, command, disabled, ...) */
  commandItems?: Array<HeaderMenuCommandItem | 'divider'>;

  /** @deprecated use `commandItems` instead. Array of Command Items (title, command, disabled, ...) */
  items?: Array<HeaderMenuCommandItem | 'divider'>;
}