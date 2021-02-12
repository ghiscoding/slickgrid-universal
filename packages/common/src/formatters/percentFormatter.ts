import { Formatter } from './../interfaces/index';
import { formatNumber, isNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

/** Takes a cell value number (between 0.0-1.0) and displays a red (<50) or green (>=50) bar */
export const percentFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber(value)) {
    const percentValue = value * 100;
    return formatNumber(percentValue, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, '', '%', decimalSeparator, thousandSeparator);
  }
  return value;
};
