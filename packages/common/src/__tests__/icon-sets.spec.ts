import { describe, expect, it } from 'vitest';
import { FluentIconSetOptions, getIconSetOptions, MaterialIconSetOptions } from '../icon-sets.js';

describe('icon-sets', () => {
  it('should return the Material icons by default or when icon set is "material"', () => {
    expect(getIconSetOptions()).toBe(MaterialIconSetOptions);
    expect(getIconSetOptions('material')).toBe(MaterialIconSetOptions);
    expect(MaterialIconSetOptions.gridMenu!.iconCssClass).toBe('mdi mdi-menu');
    expect(MaterialIconSetOptions.headerMenu!.subItemChevronClass).toBe('mdi mdi-chevron-down mdi-rotate-270');
    expect(MaterialIconSetOptions.contextMenu!.iconCopyCellValueCommand).toBe('mdi mdi-content-copy');
  });

  it('should return the Fluent icons when icon set is "fluent"', () => {
    const options = getIconSetOptions('fluent');

    expect(options).toBe(FluentIconSetOptions);
    expect(options.gridMenu!.iconCssClass).toBe('fi fi-navigation');
    expect(options.headerMenu!.subItemChevronClass).toBe('fi fi-chevron-right');
    expect(options.contextMenu!.iconCopyCellValueCommand).toBe('fi fi-copy');
  });

  it('should provide the same icon keys in both icon sets with their own icon classes', () => {
    for (const menu of ['gridMenu', 'headerMenu', 'contextMenu', 'cellMenu'] as const) {
      const fluentKeys = Object.keys(FluentIconSetOptions[menu]!);
      expect(fluentKeys.sort()).toEqual(Object.keys(MaterialIconSetOptions[menu]!).sort());

      for (const [key, value] of Object.entries(FluentIconSetOptions[menu]!)) {
        expect(key).toMatch(/^icon|^subItemChevronClass$/);
        expect(value).toMatch(/^fi fi-/);
      }
      for (const value of Object.values(MaterialIconSetOptions[menu]!)) {
        expect(value).toMatch(/^mdi mdi-/);
      }
    }
  });
});
