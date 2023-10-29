import type { MenuCommandItem } from './menuCommandItem.interface';

export interface HeaderMenuItems {
  items: Array<HeaderMenuCommandItem | 'divider'>;
}


export interface HeaderMenuCommandItem extends Omit<MenuCommandItem, 'commandItems'> {
  /** Array of Command Items (title, command, disabled, ...) */
  items?: Array<HeaderMenuCommandItem | 'divider'>;
}