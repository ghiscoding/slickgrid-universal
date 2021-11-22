import { MenuCommandItem } from './menuCommandItem.interface';

export interface HeaderMenuItems {
  items: Array<MenuCommandItem | 'divider'>;
}