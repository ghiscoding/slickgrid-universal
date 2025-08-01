import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { checkmarkMaterialFormatter } from '../checkmarkMaterialFormatter.js';

describe('the Checkmark Formatter with Material Design Icon', () => {
  it('should return an empty string when no value is passed', () => {
    const value = null;
    const result = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return an empty string when False is provided', () => {
    const value = false;
    const result = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return an empty string when the string "FALSE" (case insensitive) is provided', () => {
    const value = 'FALSE';
    const result1 = checkmarkMaterialFormatter(0, 0, value.toLowerCase(), {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value.toUpperCase(), {} as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return the Material Checkmark icon when the string "True" (case insensitive) is provided', () => {
    const value = 'True';
    const result1 = checkmarkMaterialFormatter(0, 0, value.toLowerCase(), {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value.toUpperCase(), {} as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
    expect((result2 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });

  it('should return the Material Checkmark icon when input is True', () => {
    const value = true;
    const result = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });

  it('should return the Material Checkmark icon when input is a string even if it start with 0', () => {
    const value = '005A00ABC';
    const result1 = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });

  it('should return an empty string when the string "0" is provided', () => {
    const value = '0';
    const result = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return the Material Checkmark icon when input is a number greater than 0', () => {
    const value = 0.000001;
    const result1 = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });

  it('should return the Material Checkmark icon when input is a number as a text greater than 0', () => {
    const value = '0.000001';
    const result1 = checkmarkMaterialFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });

  it('should return an empty string when input is a number lower or equal to 0', () => {
    const value1 = 0;
    const value2 = -0.5;
    const result1 = checkmarkMaterialFormatter(0, 0, value1, {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value2, {} as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return an empty string when input is a number as a text and lower or equal to 0', () => {
    const value1 = '0';
    const value2 = '-0.5';
    const result1 = checkmarkMaterialFormatter(0, 0, value1, {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value2, {} as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return an empty string when input is type null or undefined', () => {
    const value1 = null;
    const value2 = undefined;
    const result1 = checkmarkMaterialFormatter(0, 0, value1, {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value2, {} as Column, {}, {} as any);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('should return the Material Checkmark icon when input is the "null" or "undefined"', () => {
    const value1 = 'null';
    const value2 = 'undefined';
    const result1 = checkmarkMaterialFormatter(0, 0, value1, {} as Column, {}, {} as any);
    const result2 = checkmarkMaterialFormatter(0, 0, value2, {} as Column, {}, {} as any);
    expect((result1 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
    expect((result2 as HTMLElement).outerHTML).toBe('<i class="mdi font-18px mdi-check checkmark-icon" aria-hidden="true"></i>');
  });
});
