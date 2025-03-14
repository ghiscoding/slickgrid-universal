import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { currencyFormatter } from '../currencyFormatter.js';
import type { SlickGrid } from '../../core/index.js';

describe('the Currency Formatter', () => {
  const gridStub = {
    getOptions: vi.fn(),
  } as unknown as SlickGrid;

  beforeEach(() => {
    vi.spyOn(global.console, 'warn').mockReturnValue();
  });

  it('should display an empty string when no value is provided', () => {
    const output = currencyFormatter(1, 1, '', {} as Column, {}, {} as any);
    expect(output).toBe('');
  });

  it('should display original string when non-numeric value is provided', () => {
    const output = currencyFormatter(1, 1, 'hello', {} as Column, {}, {} as any);
    expect(output).toBe('hello');
  });

  it('should display €0 when number 0 is provided', () => {
    const input = 0;
    const output = currencyFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect(output).toBe('0.00');
  });

  it('should display a decimal number with negative when a negative number is provided', () => {
    const input = -15;
    const output = currencyFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect(output).toBe('-15.00');
  });

  it('should display a decimal number with when a number is provided', () => {
    const input = 99;
    const output = currencyFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect(output).toBe('99.00');
  });

  it('should display a decimal number with a prefix when numberPrefix is provided', () => {
    const input = 99;
    const output = currencyFormatter(1, 1, input, { params: { numberPrefix: 'USD ' } } as Column, {}, {} as any);
    expect(output).toBe('USD 99.00');
  });

  it('should display a negative decimal number with a prefix when numberPrefix is provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { currencyPrefix: '€' } } as Column, {}, {} as any);
    expect(output).toBe('-€99.00');
  });

  it('should display a negative decimal number with a prefix when numberPrefix is provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { numberPrefix: '€' } } as Column, {}, {} as any);
    expect(output).toBe('€-99.00');
  });

  it('should display a negative decimal number with a prefix when currencyPrefix and numberPrefix are provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { currencyPrefix: '€', numberPrefix: 'Price ' } } as Column, {}, {} as any);
    expect(output).toBe('Price -€99.00');
  });

  it('should display a negative decimal number with a prefix when numberPrefix is provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { displayNegativeNumberWithParentheses: true, currencyPrefix: '€' } } as Column, {}, {} as any);
    expect(output).toBe('(€99.00)');
  });

  it('should display a negative decimal number with a prefix when numberPrefix is provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { displayNegativeNumberWithParentheses: true, numberPrefix: '€' } } as Column, {}, {} as any);
    expect(output).toBe('€(99.00)');
  });

  it('should display a decimal number with a prefix when numberSuffix is provided', () => {
    const input = 99;
    const output = currencyFormatter(1, 1, input, { params: { numberSuffix: ' USD' } } as Column, {}, {} as any);
    expect(output).toBe('99.00 USD');
  });

  it('should display a decimal number with a prefix when numberSuffix is provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { numberSuffix: ' USD' } } as Column, {}, {} as any);
    expect(output).toBe('-99.00 USD');
  });

  it('should display a negative decimal number with a suffix when currencySuffix and numberSuffix are provided', () => {
    const input = -99;
    const output = currencyFormatter(1, 1, input, { params: { currencySuffix: '€', numberSuffix: ' EUR' } } as Column, {}, {} as any);
    expect(output).toBe('-99.00€ EUR');
  });

  it('should display a decimal number with when a string number is provided', () => {
    const input = '99';
    const output = currencyFormatter(1, 1, input, {} as Column, {}, {} as any);
    expect(output).toBe('99.00');
  });

  it('should display a decimal number with and use "minDecimal" params', () => {
    const input = 99.1;
    const output = currencyFormatter(1, 1, input, { params: { minDecimal: 2 } } as Column, {}, {} as any);
    expect(output).toBe('99.10');
  });

  it('should display a decimal number with and use "minDecimal" params', () => {
    const input = 12345678.1;

    const output1 = currencyFormatter(1, 1, input, { params: { minDecimal: 2 } } as Column, {}, {} as any);
    const output2 = currencyFormatter(1, 1, input, { params: { decimalPlaces: 2 } } as Column, {}, {} as any);
    const output3 = currencyFormatter(1, 1, input, { params: { decimalPlaces: 2, thousandSeparator: ',' } } as Column, {}, {} as any);
    const output4 = currencyFormatter(1, 1, input, { params: { decimalPlaces: 2, decimalSeparator: ',', thousandSeparator: ' ' } } as Column, {}, {} as any);

    expect(output1).toBe('12345678.10');
    expect(output2).toBe('12345678.10');
    expect(output3).toBe('12,345,678.10');
    expect(output4).toBe('12 345 678,10');
  });

  it('should display a decimal number with and use "maxDecimal" params', () => {
    const input = 88.156789;
    const output = currencyFormatter(1, 1, input, { params: { maxDecimal: 3 } } as Column, {}, {} as any);
    expect(output).toBe(`88.157`);
  });

  it('should display a negative number with parentheses when "displayNegativeNumberWithParentheses" is enabled in the "params"', () => {
    const input = -2.4;
    const output = currencyFormatter(1, 1, input, { params: { displayNegativeNumberWithParentheses: true } } as Column, {}, {} as any);
    expect(output).toBe(`(2.40)`);
  });

  it('should display a negative number with parentheses when "displayNegativeNumberWithParentheses" is enabled and thousand separator in the "params"', () => {
    const input = -12345678.4;
    const output = currencyFormatter(1, 1, input, { params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' } } as Column, {}, {} as any);
    expect(output).toBe(`(12,345,678.40)`);
  });

  it('should display a negative number with parentheses when "displayNegativeNumberWithParentheses" is enabled and thousand separator in the "params"', () => {
    const input = -12345678.4;
    const output = currencyFormatter(
      1,
      1,
      input,
      {
        params: {
          currencyPrefix: '€',
          numberPrefix: 'Price ',
          currencySuffix: ' EUR',
          numberSuffix: ' /item',
          displayNegativeNumberWithParentheses: true,
          thousandSeparator: ',',
        },
      } as Column,
      {},
      {} as any
    );
    expect(output).toBe(`Price (€12,345,678.40 EUR) /item`);
  });

  it('should display a negative average with parentheses when input is negative and "displayNegativeNumberWithParentheses" is enabled in the Formatter Options', () => {
    gridStub.getOptions = () => ({ formatterOptions: { displayNegativeNumberWithParentheses: true, minDecimal: 2 } }) as GridOption;
    const input = -2.4;
    const output = currencyFormatter(1, 1, input, {} as Column, {}, gridStub);
    expect(output).toBe(`(2.40)`);
  });

  it('should display a negative average with parentheses when input is negative and "displayNegativeNumberWithParentheses" is enabled and thousand separator in the Formatter Options', () => {
    gridStub.getOptions = () =>
      ({ formatterOptions: { displayNegativeNumberWithParentheses: true, decimalSeparator: ',', thousandSeparator: ' ' } }) as GridOption;
    const input = -12345678.4;
    const output = currencyFormatter(1, 1, input, {} as Column, {}, gridStub);
    expect(output).toBe(`(12 345 678,40)`);
  });
});
