import { describe, expect, it } from 'vitest';
import type { MenuCommandItem, MenuDivider } from '../../interfaces/index.js';
import { commandMatcher, normalizeMenuCommandItems } from '../menuUtils.js';

describe('menuUtils', () => {
  it('should normalize commandless dividers for existing command list builders without mutating the input', () => {
    const divider: MenuDivider = { divider: true, cssClass: 'custom-divider' };
    const command: MenuCommandItem = { command: 'copy', title: 'Copy' };
    const namedDivider: MenuDivider = { divider: true, command: 'custom-divider' };
    const result = normalizeMenuCommandItems([command, divider, namedDivider, 'divider']);

    expect(result).toEqual([command, { ...divider, command: '' }, namedDivider, 'divider']);
    expect(result[0]).toBe(command);
    expect(result[2]).toBe(namedDivider);
    expect(divider.command).toBeUndefined();
    expect(normalizeMenuCommandItems([])).toEqual([]);
  });

  it('should match commands while ignoring commandless dividers', () => {
    const items: Array<MenuCommandItem | MenuDivider> = [
      'divider',
      { divider: true },
      { command: 'copy' },
      { command: 'paste' },
      { divider: true, command: 'custom-divider' },
    ];

    expect(items.filter(commandMatcher('copy'))).toEqual([{ command: 'copy' }]);
    expect(items.filter(commandMatcher(['copy', 'custom-divider']))).toEqual([{ command: 'copy' }, { divider: true, command: 'custom-divider' }]);
  });
});
