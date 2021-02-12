import { Formatter } from './../interfaces/index';
import { formatNumber, isNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value */
export const dollarFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid, 2);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid, 4);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber(value)) {
    return formatNumber(value, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, '$', '', decimalSeparator, thousandSeparator);
  }
  return value;
};
