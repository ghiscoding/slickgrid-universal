import type { MenuCommandItem, MenuDivider } from '../interfaces/menuCommandItem.interface.js';

export function commandMatcher<T extends Pick<MenuCommandItem, 'command'> = MenuCommandItem>(
  commands: string | readonly string[]
): (item: T | MenuDivider<any>) => item is T {
  return (item): item is T =>
    item !== 'divider' &&
    item.command !== undefined &&
    (typeof commands === 'string' ? item.command === commands : commands.includes(item.command));
}

/** Preserve the command list builder's existing input contract for object dividers. */
export function normalizeMenuCommandItems<T extends MenuCommandItem<any, any>>(items: Array<T | MenuDivider<any>>): Array<T | 'divider'> {
  return items.map((item) => (item !== 'divider' && item.command === undefined ? { ...item, command: '' } : item)) as Array<T | 'divider'>;
}
