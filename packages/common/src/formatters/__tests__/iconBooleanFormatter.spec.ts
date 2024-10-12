import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { iconBooleanFormatter } from '../iconBooleanFormatter.js';

describe('the Checkmark Formatter', () => {
  it('should throw an error when omitting to pass "params.cssClass"', () => {
    expect(() => iconBooleanFormatter(0, 0, 'anything', {} as Column, {}, {} as any))
      .toThrow('Slickgrid-Universal] When using `Formatters.iconBoolean`, you must provide You must provide the "cssClass"');
  });

  it('should return an empty string when no value is passed', () => {
    const value = null;
    const cssClass = 'mdi mdi-check';
    const result = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return an empty string when False is provided', () => {
    const value = false;
    const cssClass = 'mdi mdi-check';
    const result = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return an empty string when the string "FALSE" (case insensitive) is provided', () => {
    const value = 'FALSE';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value.toLowerCase(), { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value.toUpperCase(), { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return the Checkmark icon when the string "True" (case insensitive) is provided', () => {
    const value = 'True';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value.toLowerCase(), { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value.toUpperCase(), { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
    expect((result2 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });

  it('should return the Checkmark icon when input is True', () => {
    const value = true;
    const cssClass = 'mdi mdi-check';
    const result = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });

  it('should return the Checkmark icon when input is a string even if it start with 0', () => {
    const value = '005A00ABC';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });

  it('should return an empty string when the string "0" is provided', () => {
    const value = '0';
    const cssClass = 'mdi mdi-check';
    const result = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return the Checkmark icon when input is a number greater than 0', () => {
    const value = 0.000001;
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });

  it('should return the Checkmark icon when input is a number as a text greater than 0', () => {
    const value = '0.000001';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });

  it('should return an empty string when input is a number lower or equal to 0', () => {
    const value1 = 0;
    const value2 = -0.5;
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value1, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value2, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return an empty string when input is a number as a text and lower or equal to 0', () => {
    const value1 = '0';
    const value2 = '-0.5';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value1, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value2, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return an empty string when input is type null or undefined', () => {
    const value1 = null;
    const value2 = undefined;
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value1, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value2, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return the Checkmark icon when input is the "null" or "undefined"', () => {
    const value1 = 'null';
    const value2 = 'undefined';
    const cssClass = 'mdi mdi-check';
    const result1 = iconBooleanFormatter(0, 0, value1, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    const result2 = iconBooleanFormatter(0, 0, value2, { field: 'user', params: { cssClass } } as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
    expect((result2 as HTMLElement).outerHTML).toBe('<i class="mdi mdi-check" aria-hidden="true"></i>');
  });
});
