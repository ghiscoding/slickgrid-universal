import { isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index.js';
import { formatNumber } from './../services/utilities.js';
import { retrieveFormatterOptions } from './formatterUtilities.js';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value */
export const dollarFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, gridOptions) => {
  if (isNumber(value)) {
    const { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber } = retrieveFormatterOptions(
      columnDef,
      gridOptions,
      'currency',
      'cell'
    );
    return formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
  }
  return value;
};
