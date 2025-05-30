import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { Formatters } from '../index.js';

describe('the Date ISO Formatter', () => {
  it('should return null when no value is provided', () => {
    const value = null;
    const result = Formatters.dateIso(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe(null);
  });

  it('should return original string when input value provided is not a valid date', () => {
    const value = 'TBD';
    const result = Formatters.dateIso(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('TBD');
  });

  it('should provide a dateIso formatted input and return a formatted date value without time when valid date value is provided', () => {
    const value = '2019-05-03 00:00:01';
    const result = Formatters.dateIso(0, 0, value, { type: 'dateIso' } as unknown as Column, {}, {} as any);
    expect(result).toBe('2019-05-03');
  });

  it('should return a formatted date value without time when valid date value is provided', () => {
    const value = new Date('2019-05-03T00:00:01');
    const result = Formatters.dateIso(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('2019-05-03');
  });

  it('should return a formatted date value without time when valid date value is provided', () => {
    const value = new Date('2019-05-01T02:36:07');
    const result = Formatters.dateIso(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('2019-05-01');
  });

  it('should return a formatted date value without time date provided has TZ but we specifically mention to parse as UTC ', () => {
    const value = new Date('2099-12-31T00:00:00.000Z');

    const result1 = Formatters.dateIso(0, 0, value, { params: { parseDateAsUtc: true } } as Column, {}, {} as any);
    const result2 = Formatters.dateIso(0, 0, value, { params: { parseDateAsUtc: false } } as Column, {}, {} as any);
    const result3 = Formatters.dateIso(0, 0, value, {} as Column, {}, {} as any);

    expect(result1).toBe('2099-12-31');
    expect(result2).toBe('2099-12-30');
    expect(result3).toBe('2099-12-30');
  });
});
