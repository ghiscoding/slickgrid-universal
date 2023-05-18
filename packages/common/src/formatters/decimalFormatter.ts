import { isNumber } from '@slickgrid-universal/utils';

import type { Formatter } from './../interfaces/index';
import { formatNumber } from './../services/utilities';
import { retrieveFormatterOptions } from './formatterUtilities';

/**
 * Display the value as x decimals formatted, defaults to 2 decimals.
 * You can pass "minDecimal" and/or "maxDecimal" to the "params" property.
 * For example:: `{ formatter: Formatters.decimal, params: { minDecimal: 2, maxDecimal: 4 }}`
 */
export const decimalFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    minDecimal,
    maxDecimal,
    numberPrefix,
    numberSuffix,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'decimal', 'cell');

  if (isNumber(value)) {
    return formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, numberPrefix, numberSuffix, decimalSeparator, thousandSeparator);
  }
  return value;
};
