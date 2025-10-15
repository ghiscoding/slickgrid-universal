import { isNumber } from '@slickgrid-universal/utils';
import type { Formatter } from '../interfaces/index.js';
import { formatNumber } from '../services/utilities.js';
import { retrieveFormatterOptions } from './formatterUtilities.js';

/**
 * This Formatters allow the user to provide any currency symbol (as symbol prefix/suffix) and also provide extra text prefix/suffix.
 * So with this, it allows the user to provide dual prefixes/suffixes via the following params
 * You can pass "minDecimal", "maxDecimal", "decimalSeparator", "thousandSeparator", "numberPrefix", "currencyPrefix", "currencySuffix", and "numberSuffix" to the "params" property.
 * For example:: `{ formatter: Formatters.decimal, params: { minDecimal: 2, maxDecimal: 4, prefix: 'Price ', currencyPrefix: '€', currencySuffix: ' EUR' }}`
 * with value of 33.45 would result into: "Price €33.45 EUR"
 */
export const currencyFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const {
    currencyPrefix,
    currencySuffix,
    minDecimal,
    maxDecimal,
    numberPrefix,
    numberSuffix,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber,
  } = retrieveFormatterOptions(columnDef, grid, 'decimal', 'cell');

  if (isNumber(value)) {
    const formattedNumber = formatNumber(
      value,
      minDecimal,
      maxDecimal,
      wrapNegativeNumber,
      currencyPrefix,
      currencySuffix,
      decimalSeparator,
      thousandSeparator
    );
    return `${numberPrefix}${formattedNumber}${numberSuffix}`;
  }
  return value;
};
