import { isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';
import { formatNumber } from './../services/utilities';
import { retrieveFormatterOptions } from './formatterUtilities';
import { createDomElement } from '../services';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value */
export const dollarColoredFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'currency', 'cell');

  if (isNumber(value)) {
    const colorStyle = (value >= 0) ? 'green' : 'red';
    const formattedNumber = formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
    return createDomElement('span', { style: { color: colorStyle }, ariaHidden: 'true', textContent: formattedNumber });
  }
  return value;
};
