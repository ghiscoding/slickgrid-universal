import { describe, expect, it, type Mock, vi } from 'vitest';

import type { Column, GridOption } from '../../interfaces/index.js';
import { sumTotalsCurrencyFormatter } from '../sumTotalsCurrencyFormatter.js';
import { type SlickGrid } from '../../core/index.js';

describe('sumTotalsCurrencyFormatter', () => {
  // stub some methods of the SlickGrid Grid instance
  const gridStub = {
    getOptions: vi.fn(),
  } as unknown as SlickGrid;

  it('should display an empty string when no value is provided', () => {
    const output = sumTotalsCurrencyFormatter({}, {} as Column, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the "sum" does not find the field property in its object', () => {
    const columnDef = { id: 'column3', field: 'column3' } as Column;
    const totals = { sum: { column1: 123, column2: 345 } };
    const output = sumTotalsCurrencyFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the sum property is null', () => {
    const columnDef = { id: 'column1', field: 'column1' } as Column;
    const totals = { sum: { column1: null } };
    const output = sumTotalsCurrencyFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the average input is not a number', () => {
    const columnDef = { id: 'column1', field: 'column1' } as Column;
    const totals = { sum: { column1: 'abc' } };
    const output = sumTotalsCurrencyFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display a negative sum with at least 2 decimals in red when its input is negative', () => {
    const totals = { sum: { column1: -123, column2: -34.5678, column3: -2.4 } };

    const output1 = sumTotalsCurrencyFormatter(totals, { id: 'column1', field: 'column1' } as Column, {} as SlickGrid);
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column2', field: 'column2', params: { groupFormatterCurrencyPrefix: '€', maxDecimal: 2 } } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('-123.00');
    expect(output2).toBe('-€34.57');
  });

  it('should display a negative sum with at least 2 decimals and thousand separator when its input is negative', () => {
    const totals = { sum: { column1: -12345678, column2: -345678.5678, column3: -2.4 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { groupFormatterCurrencyPrefix: '€', thousandSeparator: ',' } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column2', field: 'column2', params: { groupFormatterCurrencyPrefix: '€', maxDecimal: 2, thousandSeparator: ',' } } as Column,
      {} as SlickGrid
    );
    const output3 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column2',
        field: 'column2',
        params: { groupFormatterCurrencyPrefix: '€', maxDecimal: 2, decimalSeparator: ',', thousandSeparator: '_' },
      } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('-€12,345,678.00');
    expect(output2).toBe('-€345,678.57');
    expect(output3).toBe('-€345_678,57');
  });

  it('should display a negative sum in red with at least 2 decimals with parentheses instead of the negative sign when its input is negative', () => {
    const totals = { sum: { column1: -123, column2: -34.5678, column3: -2.4 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column2', field: 'column2', params: { groupFormatterCurrencyPrefix: '€', maxDecimal: 2, displayNegativeNumberWithParentheses: true } } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('(€123.00)');
    expect(output2).toBe('(€34.57)');
  });

  it('should display a negative sum with thousand separator and parentheses instead of the negative sign when its input is negative', () => {
    const totals = { sum: { column1: -12345678, column2: -345678.5678, column3: -2.4 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column1',
        field: 'column1',
        params: { groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
      } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column2',
        field: 'column2',
        params: { maxDecimal: 2, groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true, thousandSeparator: ',' },
      } as Column,
      {} as SlickGrid
    );
    const output3 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column2',
        field: 'column2',
        params: { maxDecimal: 2, groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true, decimalSeparator: ',', thousandSeparator: '_' },
      } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('(€12,345,678.00)');
    expect(output2).toBe('(€345,678.57)');
    expect(output3).toBe('(€345_678,57)');
  });

  it('should display a negative sum with parentheses when input is negative and "displayNegativeNumberWithParentheses" is enabled in the Formatter Options', () => {
    (gridStub.getOptions as Mock).mockReturnValue({ formatterOptions: { displayNegativeNumberWithParentheses: true } } as GridOption);
    const columnDef = { id: 'column3', field: 'column3', params: { groupFormatterCurrencyPrefix: '€' } } as Column;
    const totals = { sum: { column1: 123, column2: 345, column3: -2.4 } };
    const output = sumTotalsCurrencyFormatter(totals, columnDef, gridStub);
    expect(output).toBe('(€2.40)');
  });

  it('should display a positive sum number with at least 2 decimals, even when displayNegativeNumberWithParentheses is enabled', () => {
    const totals = { sum: { column1: 123, column2: 34.5678, column3: 2.4 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column2', field: 'column2', params: { maxDecimal: 2, displayNegativeNumberWithParentheses: true } } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('€123.00');
    expect(output2).toBe('34.57');
  });

  it('should display the same sum value in green with at least 2 decimals when a number with decimals is provided', () => {
    const totals = { sum: { column1: 123.55678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { groupFormatterCurrencyPrefix: '€' } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(totals, { id: 'column2', field: 'column2' } as Column, {} as SlickGrid);

    expect(output1).toBe('€123.5568');
    expect(output2).toBe('345.20');
  });

  it('should display an sum number with user defined minimum & maximum decimal count in his grid option', () => {
    (gridStub.getOptions as Mock).mockReturnValue({
      formatterOptions: { minDecimal: 0, maxDecimal: 3, displayNegativeNumberWithParentheses: true },
    } as GridOption);
    const totals = { sum: { column1: 123.45678, column2: 345, column3: -2.45 } };

    const output1 = sumTotalsCurrencyFormatter(totals, { id: 'column1', field: 'column1', params: { groupFormatterCurrencyPrefix: '€' } } as Column, gridStub);
    const output2 = sumTotalsCurrencyFormatter(totals, { id: 'column2', field: 'column2' } as Column, gridStub);
    const output3 = sumTotalsCurrencyFormatter(totals, { id: 'column3', field: 'column3', params: { groupFormatterCurrencyPrefix: '€' } } as Column, gridStub);

    expect(output1).toBe('€123.457');
    expect(output2).toBe('345');
    expect(output3).toBe('(€2.45)');
  });

  it('should display a sum number in correct color with at least 2 decimals when user provided minimum & maximum decimal count', () => {
    const totals = { sum: { column1: 123.45678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { maxDecimal: 2, groupFormatterCurrencyPrefix: '€' } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(totals, { id: 'column2', field: 'column2', params: { minDecimal: 0 } } as Column, {} as SlickGrid);
    const output3 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column3', field: 'column3', params: { minDecimal: 3, groupFormatterCurrencyPrefix: '€', displayNegativeNumberWithParentheses: true } } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('€123.46');
    expect(output2).toBe('345.2');
    expect(output3).toBe('(€2.450)');
  });

  it('should display a sum number with at least 2 decimals with prefix and suffix', () => {
    const totals = { sum: { column1: 123.45678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column1', field: 'column1', params: { maxDecimal: 2, groupFormatterCurrencyPrefix: '€', groupFormatterPrefix: 'sum: ' } } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      { id: 'column2', field: 'column2', params: { minDecimal: 0, groupFormatterCurrencyPrefix: '€', groupFormatterSuffix: ' (max)' } } as Column,
      {} as SlickGrid
    );
    const output3 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column3',
        field: 'column3',
        params: {
          minDecimal: 3,
          displayNegativeNumberWithParentheses: true,
          groupFormatterCurrencyPrefix: '€',
          groupFormatterPrefix: 'sum: ',
          groupFormatterSuffix: '/item',
        },
      } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('sum: €123.46');
    expect(output2).toBe('€345.2 (max)');
    expect(output3).toBe('sum: (€2.450)/item');
  });

  it('should display a sum number with prefix, suffix and thousand separator', () => {
    const totals = { sum: { column1: 12345678.45678, column2: 345678.2, column3: -345678.45 } };

    const output1 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column1',
        field: 'column1',
        params: { maxDecimal: 2, groupFormatterPrefix: 'Sum: ', groupFormatterCurrencyPrefix: '€', decimalSeparator: ',', thousandSeparator: '_' },
      } as Column,
      {} as SlickGrid
    );
    const output2 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column2',
        field: 'column2',
        params: { minDecimal: 0, groupFormatterSuffix: ' (sum)', groupFormatterCurrencyPrefix: '€', decimalSeparator: ',', thousandSeparator: '_' },
      } as Column,
      {} as SlickGrid
    );
    const output3 = sumTotalsCurrencyFormatter(
      totals,
      {
        id: 'column3',
        field: 'column3',
        params: {
          minDecimal: 3,
          displayNegativeNumberWithParentheses: true,
          groupFormatterCurrencyPrefix: '€',
          groupFormatterPrefix: 'Sum: ',
          groupFormatterSuffix: '/item',
          decimalSeparator: ',',
          thousandSeparator: '_',
        },
      } as Column,
      {} as SlickGrid
    );

    expect(output1).toBe('Sum: €12_345_678,46');
    expect(output2).toBe('€345_678,2 (sum)');
    expect(output3).toBe('Sum: (€345_678,450)/item');
  });
});
