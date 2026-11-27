import { describe, expect, it } from 'vitest';
import { Slicker, SlickVanillaGridBundle } from '../index.js';

describe('Vanilla bundle entry point', () => {
  it('exports Slicker without registering it on window', () => {
    expect(Slicker.GridBundle).toBe(SlickVanillaGridBundle);
    expect(window).not.toHaveProperty('Slicker');
  });
});
