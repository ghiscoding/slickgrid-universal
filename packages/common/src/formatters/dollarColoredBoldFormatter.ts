import { Formatter } from './../interfaces/index';
import { formatNumber, isNumber } from './../services/utilities';
import { getValueFromParamsOrFormatterOptions } from './formatterUtilities';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value, show it in bold font weight as well */
export const dollarColoredBoldFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid, 2);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid, 4);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);

  if (isNumber(value)) {
    const colorStyle = (value >= 0) ? 'green' : 'red';
    const formattedNumber = formatNumber(value, minDecimal, maxDecimal, displayNegativeNumberWithParentheses, '$', '', decimalSeparator, thousandSeparator);
    return `<span style="color:${colorStyle}; font-weight:bold;">${formattedNumber}</span>`;
  }
  return value;
};
