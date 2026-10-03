import type { MenuCommandItem } from '../interfaces/menuCommandItem.interface.js';

export function commandMatcher<T extends Pick<MenuCommandItem, 'command'> = MenuCommandItem>(
  commands: string | readonly string[]
): (item: T | 'divider') => item is T {
  return (item): item is T =>
    item !== 'divider' && (typeof commands === 'string' ? item.command === commands : commands.includes(item.command));
}
