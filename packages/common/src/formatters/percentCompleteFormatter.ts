import { Formatter } from './../interfaces/index';
import { formatNumber, isNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

/** Takes a cell value number (between 0.0-100) and displays a red (<50) or green (>=50) bar */
export const percentCompleteFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber(value)) {
    const colorStyle = (value < 50) ? 'red' : 'green';
    const formattedNumber = formatNumber(value, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, '', '%', decimalSeparator, thousandSeparator);
    const outputFormattedValue = value > 100 ? '100%' : formattedNumber;
    return `<span style="color:${colorStyle}">${outputFormattedValue}</span>`;
  }
  return value;
};
