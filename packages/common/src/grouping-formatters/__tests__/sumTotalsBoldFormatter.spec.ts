import { Column, GridOption } from '../../interfaces/index';
import { sumTotalsBoldFormatter } from '../sumTotalsBoldFormatter';
import { type SlickGrid } from '../../core/index';

describe('sumTotalsBoldFormatter', () => {
  // stub some methods of the SlickGrid Grid instance
  const gridStub = {
    getOptions: jest.fn()
  } as unknown as SlickGrid;

  it('should display an empty string when no value is provided', () => {
    const output = sumTotalsBoldFormatter({}, {} as Column, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the "sum" does not find the field property in its object', () => {
    const columnDef = { id: 'column3', field: 'column3' } as Column;
    const totals = { sum: { column1: 123, column2: 345 } };
    const output = sumTotalsBoldFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the sum property is null', () => {
    const columnDef = { id: 'column1', field: 'column1' } as Column;
    const totals = { sum: { column1: null } };
    const output = sumTotalsBoldFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display an empty string when the average input is not a number', () => {
    const columnDef = { id: 'column1', field: 'column1' } as Column;
    const totals = { sum: { column1: 'abc' } };
    const output = sumTotalsBoldFormatter(totals, columnDef, {} as SlickGrid);
    expect(output).toBe('');
  });

  it('should display a negative sum when its input is negative', () => {
    const totals = { sum: { column1: -123, column2: -34.5678, column3: -2.4 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1' } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2 } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).style.fontWeight).toBe('bold');
    expect((output2 as HTMLElement).style.fontWeight).toBe('bold');
    expect((output1 as HTMLElement).innerHTML).toBe('-123');
    expect((output2 as HTMLElement).innerHTML).toBe('-34.57');
  });

  it('should display a negative sum with parentheses and thousand separator when its input is negative', () => {
    const totals = { sum: { column1: -12345678, column2: -345678.5678, column3: -2.4 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { thousandSeparator: ',' } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, thousandSeparator: ',' } } as Column, {} as SlickGrid);
    const output3 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, decimalSeparator: ',', thousandSeparator: '_' } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('-12,345,678');
    expect((output2 as HTMLElement).innerHTML).toBe('-345,678.57');
    expect((output3 as HTMLElement).innerHTML).toBe('-345_678,57');
  });

  it('should display a negative sum with parentheses instead of the negative sign when its input is negative', () => {
    const totals = { sum: { column1: -123, column2: -34.5678, column3: -2.4 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { displayNegativeNumberWithParentheses: true } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, displayNegativeNumberWithParentheses: true } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('(123)');
    expect((output2 as HTMLElement).innerHTML).toBe('(34.57)');
  });

  it('should display a negative sum with thousand separator and parentheses instead of the negative sign when its input is negative', () => {
    const totals = { sum: { column1: -12345678, column2: -345678.5678, column3: -2.4 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { displayNegativeNumberWithParentheses: true, thousandSeparator: ',' } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, displayNegativeNumberWithParentheses: true, thousandSeparator: ',' } } as Column, {} as SlickGrid);
    const output3 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, displayNegativeNumberWithParentheses: true, decimalSeparator: ',', thousandSeparator: '_' } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('(12,345,678)');
    expect((output2 as HTMLElement).innerHTML).toBe('(345,678.57)');
    expect((output3 as HTMLElement).innerHTML).toBe('(345_678,57)');
  });

  it('should display a negative sum with parentheses when input is negative and "displayNegativeNumberWithParentheses" is enabled in the Formatter Options', () => {
    (gridStub.getOptions as jest.Mock).mockReturnValue({ formatterOptions: { displayNegativeNumberWithParentheses: true } } as GridOption);
    const columnDef = { id: 'column3', field: 'column3' } as Column;
    const totals = { sum: { column1: 123, column2: 345, column3: -2.4 } };
    const output = sumTotalsBoldFormatter(totals, columnDef, gridStub);
    expect((output as HTMLElement).innerHTML).toBe('(2.4)');
  });

  it('should display a positive sum number even when displayNegativeNumberWithParentheses is enabled', () => {
    const totals = { sum: { column1: 123, column2: 34.5678, column3: 2.4 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { displayNegativeNumberWithParentheses: true } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { maxDecimal: 2, displayNegativeNumberWithParentheses: true } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('123');
    expect((output2 as HTMLElement).innerHTML).toBe('34.57');
  });

  it('should display the same sum value when a number with decimals is provided', () => {
    const totals = { sum: { column1: 123.55678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1' } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2' } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('123.55678');
    expect((output2 as HTMLElement).innerHTML).toBe('345.2');
  });

  it('should display an sum number with user defined minimum & maximum decimal count in his grid option', () => {
    (gridStub.getOptions as jest.Mock).mockReturnValue({ formatterOptions: { minDecimal: 0, maxDecimal: 3, displayNegativeNumberWithParentheses: true } } as GridOption);
    const totals = { sum: { column1: 123.45678, column2: 345, column3: -2.45 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1' } as Column, gridStub);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2' } as Column, gridStub);
    const output3 = sumTotalsBoldFormatter(totals, { id: 'column3', field: 'column3' } as Column, gridStub);

    expect((output1 as HTMLElement).innerHTML).toBe('123.457');
    expect((output2 as HTMLElement).innerHTML).toBe('345');
    expect((output3 as HTMLElement).innerHTML).toBe('(2.45)');
  });

  it('should display a sum number with user defined minimum & maximum decimal count', () => {
    const totals = { sum: { column1: 123.45678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { maxDecimal: 2 } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { minDecimal: 0 } } as Column, {} as SlickGrid);
    const output3 = sumTotalsBoldFormatter(totals, { id: 'column3', field: 'column3', params: { minDecimal: 3, displayNegativeNumberWithParentheses: true } } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('123.46');
    expect((output2 as HTMLElement).innerHTML).toBe('345.2');
    expect((output3 as HTMLElement).innerHTML).toBe('(2.450)');
  });

  it('should display a sum number a prefix and suffix', () => {
    const totals = { sum: { column1: 123.45678, column2: 345.2, column3: -2.45 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { maxDecimal: 2, groupFormatterPrefix: 'Sum: ' } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { minDecimal: 0, groupFormatterSuffix: ' (sum)' } } as Column, {} as SlickGrid);
    const output3 = sumTotalsBoldFormatter(
      totals, {
        id: 'column3',
        field: 'column3',
        params: { minDecimal: 3, displayNegativeNumberWithParentheses: true, groupFormatterPrefix: 'Sum: ', groupFormatterSuffix: '/item' }
      } as Column, {} as SlickGrid
    );

    expect((output1 as HTMLElement).innerHTML).toBe('Sum: 123.46');
    expect((output2 as HTMLElement).innerHTML).toBe('345.2 (sum)');
    expect((output3 as HTMLElement).innerHTML).toBe('Sum: (2.450)/item');
  });

  it('should display a sum number with prefix, suffix and thousand separator', () => {
    const totals = { sum: { column1: 12345678.45678, column2: 345678.2, column3: -345678.45 } };

    const output1 = sumTotalsBoldFormatter(totals, { id: 'column1', field: 'column1', params: { maxDecimal: 2, groupFormatterPrefix: 'Sum: ', decimalSeparator: ',', thousandSeparator: '_' } } as Column, {} as SlickGrid);
    const output2 = sumTotalsBoldFormatter(totals, { id: 'column2', field: 'column2', params: { minDecimal: 0, groupFormatterSuffix: ' (sum)', decimalSeparator: ',', thousandSeparator: '_' } } as Column, {} as SlickGrid);
    const output3 = sumTotalsBoldFormatter(
      totals, {
        id: 'column3', field: 'column3',
        params: { minDecimal: 3, displayNegativeNumberWithParentheses: true, groupFormatterPrefix: 'Sum: ', groupFormatterSuffix: '/item', decimalSeparator: ',', thousandSeparator: '_' }
      } as Column, {} as SlickGrid);

    expect((output1 as HTMLElement).innerHTML).toBe('Sum: 12_345_678,46');
    expect((output2 as HTMLElement).innerHTML).toBe('345_678,2 (sum)');
    expect((output3 as HTMLElement).innerHTML).toBe('Sum: (345_678,450)/item');
  });
});
