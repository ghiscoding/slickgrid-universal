import { describe, expect, it } from 'vitest';
import type { Column } from '../../interfaces/index.js';
import { Formatters } from '../formatters.index.js';

describe('the DateUs Formatter', () => {
  it('should return null when no value is provided', () => {
    const value = null;
    const result = Formatters.dateUs(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe(null);
  });

  it('should return original string when input value provided is not a valid date', () => {
    const value = 'TBD';
    const result = Formatters.dateUs(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('TBD');
  });

  it('should provide a dateIso formatted input and return a formatted date value without time when valid date value is provided', () => {
    const value = '2019-05-03';
    const result = Formatters.dateUs(0, 0, value, { type: 'dateIso' } as unknown as Column, {}, {} as any);
    expect(result).toBe('05/03/2019');
  });

  it('should return a formatted date value without time when valid date value is provided', () => {
    const value = new Date('2019-05-03T00:00:01');
    const result = Formatters.dateUs(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('05/03/2019');
  });

  it('should return a second formatted date value without time when valid date value is provided', () => {
    const value = new Date('2019-05-01T02:36:07');
    const result = Formatters.dateUs(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('05/01/2019');
  });

  it('should use the "dateSeparator" provided in the grid "formatterOptions"', () => {
    const grid = { getOptions: () => ({ formatterOptions: { dateSeparator: '-' } }) } as any;
    const result = Formatters.dateUs(0, 0, '2019-05-03', { type: 'dateIso' } as unknown as Column, {}, grid);
    expect(result).toBe('05-03-2019');
  });

  it('should keep an invalid date value untouched even when a "dateSeparator" is provided', () => {
    const grid = { getOptions: () => ({ formatterOptions: { dateSeparator: '-' } }) } as any;
    const result = Formatters.dateUs(0, 0, 'N/A', {} as Column, {}, grid);
    expect(result).toBe('N/A');
  });
});
