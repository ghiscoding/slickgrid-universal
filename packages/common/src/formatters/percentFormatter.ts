import { isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index.js';
import { formatNumber } from './../services/utilities.js';
import { retrieveFormatterOptions } from './formatterUtilities.js';

/** Takes a cell value number (between 0.0-1.0) and displays a red (<50) or green (>=50) bar */
export const percentFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'percent', 'cell');

  if (isNumber(value)) {
    const percentValue = value * 100;
    return formatNumber(percentValue, minDecimal, maxDecimal, wrapNegativeNumber, '', '%', decimalSeparator, thousandSeparator);
  }
  return value;
};
