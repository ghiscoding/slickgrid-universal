import type { MenuCommandItem } from './menuCommandItem.interface';

export interface HeaderMenuItems {
  /** List of command items to show in the header menu. */
  commandItems?: Array<MenuCommandItem | 'divider'>;
}
