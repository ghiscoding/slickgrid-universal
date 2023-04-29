import { isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';
import { formatNumber } from './../services/utilities';
import { retrieveFormatterOptions } from './formatterUtilities';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value */
export const dollarFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'currency', 'cell');

  if (isNumber(value)) {
    return formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
  }
  return value;
};
