import { describe, expectTypeOf, it } from 'vitest';
import type { ContextMenuOption } from '../contextMenuOption.interface.js';
import type { GridMenuItem } from '../gridMenuItem.interface.js';
import type { GridMenuOption } from '../gridMenuOption.interface.js';
import type { MenuCommandItem, MenuDivider, MenuDividerItem } from '../menuCommandItem.interface.js';
import type { MenuCommandItemCallbackArgs } from '../menuCommandItemCallbackArgs.interface.js';

interface CustomMenuCommand extends MenuCommandItem {
  customFlag?: boolean;
}

type ContextMenuEntry = NonNullable<ContextMenuOption['commandItems']>[number];
type GridMenuEntry = NonNullable<GridMenuOption['commandItems']>[number];
type Builder = NonNullable<ContextMenuOption['commandListBuilder']>;

describe('menu command item types', () => {
  it('should include string and object separators in MenuDivider', () => {
    expectTypeOf<'divider'>().toExtend<MenuDivider>();
    expectTypeOf<{ divider: true }>().toExtend<MenuDivider>();
    expectTypeOf<{ divider: true; command: '' }>().toExtend<MenuDivider>();
    expectTypeOf<{ divider: true; command: 'something' }>().toExtend<MenuDivider>();
    expectTypeOf<{ command: 'copy' }>().not.toExtend<MenuDivider>();
    expectTypeOf<'divider'>().not.toExtend<MenuDividerItem>();
  });

  it('should allow commands to be omitted only for divider inputs', () => {
    expectTypeOf<{ divider: true }>().toExtend<ContextMenuEntry>();
    expectTypeOf<{ divider: true; command: '' }>().toExtend<ContextMenuEntry>();
    expectTypeOf<{ command: 'copy' }>().toExtend<ContextMenuEntry>();
    expectTypeOf<{ divider: false; command: 'copy' }>().toExtend<ContextMenuEntry>();
    expectTypeOf<{ title: 'Copy' }>().not.toExtend<ContextMenuEntry>();
    expectTypeOf<{ divider: false }>().not.toExtend<ContextMenuEntry>();
    expectTypeOf<{ divider: string }>().not.toExtend<ContextMenuEntry>();
    expectTypeOf<{ divider: boolean }>().not.toExtend<ContextMenuEntry>();
  });

  it('should support grid menu inputs, builder results, and nested commands', () => {
    expectTypeOf<{ divider: true }>().toExtend<GridMenuEntry>();
    expectTypeOf<{ title: 'Copy' }>().not.toExtend<GridMenuEntry>();
    expectTypeOf<{ command: 'parent'; commandItems: [{ divider: true }] }>().toExtend<MenuCommandItem>();
    expectTypeOf<{ command: 'parent'; commandItems: [{ title: 'Copy' }] }>().not.toExtend<MenuCommandItem>();
    expectTypeOf<[{ divider: true }]>().toExtend<ReturnType<Builder>>();
  });

  it('should preserve required commands on existing interfaces and callbacks', () => {
    expectTypeOf<MenuCommandItem['command']>().toEqualTypeOf<string>();
    expectTypeOf<GridMenuItem['command']>().toEqualTypeOf<string>();
    expectTypeOf<CustomMenuCommand['command']>().toEqualTypeOf<string>();
    expectTypeOf<MenuCommandItemCallbackArgs['item']['command']>().toEqualTypeOf<string>();
    expectTypeOf<Exclude<Parameters<Builder>[0][number], 'divider'>['command']>().toEqualTypeOf<string>();
  });
});
