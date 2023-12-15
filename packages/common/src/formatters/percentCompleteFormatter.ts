import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';
import { formatNumber } from './../services/utilities';
import { retrieveFormatterOptions } from './formatterUtilities';

/** Takes a cell value number (between 0.0-100) and displays a red (<50) or green (>=50) bar */
export const percentCompleteFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'percent', 'cell');

  if (isNumber(value)) {
    const colorStyle = (value < 50) ? 'red' : 'green';
    const formattedNumber = formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, '', '%', decimalSeparator, thousandSeparator);
    const outputFormattedValue = value > 100 ? '100%' : formattedNumber;
    return createDomElement('span', { textContent: outputFormattedValue, style: { color: colorStyle } });
  }
  return value;
};
