import { Column, Formatter, SlickGrid } from './../interfaces/index';
import { formatNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

export const percentFormatter: Formatter = (_row: number, _cell: number, value: any, columnDef: Column, _dataContext: any, grid: SlickGrid): string => {
  const isNumber = (value === null || value === undefined || value === '') ? false : !isNaN(+value);
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber) {
    const percentValue = value * 100;
    return formatNumber(percentValue, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, '', '%', decimalSeparator, thousandSeparator);
  }
  return value;
};
