import { describe, expect, it } from 'vitest';

import type { Column, Formatter } from '../../interfaces/index';
import { multipleFormatter } from '../multipleFormatter';

const myBoldFormatter: Formatter = (_row, _cell, value) => value ? `<b>${value}</b>` : '';
const myItalicFormatter: Formatter = (_row, _cell, value) => value ? `<i>${value}</i>` : '';

describe('the Multiple Formatter', () => {
  it('should return text output wrapped first as bold then wrapped as italic html formatted string', () => {
    const value = 'john';
    const params = { formatters: [myBoldFormatter, myItalicFormatter] };
    const result = multipleFormatter(0, 0, value, { params } as Column, {}, {} as any);
    expect(result).toBe(`<i><b>${value}</b></i>`);
  });

  it('should expect the first formatter to be the last wrapped format and not the other way around', () => {
    const value = 'john';
    const params = { formatters: [myBoldFormatter, myItalicFormatter] };
    const result = multipleFormatter(0, 0, value, { params } as Column, {}, {} as any);
    expect(result).toBe(`<i><b>${value}</b></i>`);
    expect(result).not.toBe(`<b><i>${value}</i></b>`);
  });

  it('should throw an error when "params.formatters" is missing from the column definition', () => {
    expect(() => multipleFormatter(1, 1, null, {} as Column, {}, {} as any)).toThrow('[Slickgrid-Universal] The multiple formatter requires the "formatters" to be provided');
  });

  it('should throw an error when a formatter provided to "params.formatters" is invalid', () => {
    const value = 'john';
    const params = { formatters: [myBoldFormatter, null] };

    expect(() => multipleFormatter(0, 0, value, { params } as Column, {}, {} as any)).toThrow('[Slickgrid-Universal] the "params.formatters" at index(1) to be used by "Formatters.multiple" is invalid');
  });
});
