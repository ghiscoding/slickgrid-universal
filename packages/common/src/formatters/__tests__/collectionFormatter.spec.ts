import { describe, expect, it } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { collectionFormatter } from '../collectionFormatter.js';

describe('the Collection Formatter', () => {
  it('should return same output when no value is passed', () => {
    const valueArray = null;
    const result = collectionFormatter(0, 0, valueArray, {} as Column, {}, {} as any);
    expect(result).toBe(null);
  });

  it('should return an empty array when value passed is an empty array', () => {
    const valueArray: any[] = [];
    const result = collectionFormatter(0, 0, valueArray, {} as Column, {}, {} as any);
    expect(result).toEqual([]);
  });

  it('should return original value when input is not an array', () => {
    const inputValue = 'anything';
    const result = collectionFormatter(0, 0, inputValue, {} as Column, {}, {} as any);
    expect(result).toBe(inputValue);
  });

  it('should return a CSV string when value passed is an array of objects', () => {
    const valueArray = [1, 2];
    const columnDef = {
      params: {
        collection: [
          { value: 1, label: 'foo' },
          { value: 2, label: 'bar' },
        ],
      },
    } as Column;
    const result = collectionFormatter(0, 0, valueArray, columnDef, {}, {} as any);
    const outputCsv = 'foo, bar';
    expect((result as HTMLElement).outerHTML).toBe(`<span title="${outputCsv}">${outputCsv}</span>`);
  });

  it('should return a CSV string when value passed is an array of objects', () => {
    const valueArray = [1, 2];
    const columnDef = {
      params: {
        collection: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Bob' },
        ],
        customStructure: { label: 'name', value: 'id' },
      },
    } as Column;
    const result = collectionFormatter(0, 0, valueArray, columnDef, {}, {} as any);
    const outputCsv = 'John, Bob';
    expect((result as HTMLElement).outerHTML).toBe(`<span title="${outputCsv}">${outputCsv}</span>`);
  });

  it('should return a string when value passed is an object', () => {
    const inputValue = 2;
    const columnDef = {
      params: {
        collection: [
          { value: 1, label: 'foo' },
          { value: 2, label: 'bar' },
        ],
      },
    } as Column;
    const result = collectionFormatter(0, 0, inputValue, columnDef, {}, {} as any);
    expect(result).toBe('bar');
  });

  it('should return an empty string when value passed is an object that is not part of the collection', () => {
    const inputValue = 4;
    const columnDef = {
      params: {
        collection: [
          { value: 1, label: 'foo' },
          { value: 2, label: 'bar' },
        ],
      },
    } as Column;
    const result = collectionFormatter(0, 0, inputValue, columnDef, {}, {} as any);
    expect(result).toBe('');
  });
});
