import { Formatter } from './../interfaces/index';
import { formatNumber, isNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

/**
 * Display the value as x decimals formatted, defaults to 2 decimals.
 * You can pass "minDecimal" and/or "maxDecimal" to the "params" property.
 * For example:: `{ formatter: Formatters.decimal, params: { minDecimal: 2, maxDecimal: 4 }}`
 */
export const decimalFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid, 2);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid, 2);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const numberPrefix = getValueFromParamsOrFormatterOptions('numberPrefix', columnDef, grid, '');
  const numberSuffix = getValueFromParamsOrFormatterOptions('numberSuffix', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber(value)) {
    return formatNumber(value, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, numberPrefix, numberSuffix, decimalSeparator, thousandSeparator);
  }
  return value;
};
