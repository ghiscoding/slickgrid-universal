import type { Column, GroupTotalsFormatter, SlickGridUniversal } from '../interfaces/index';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';
import { formatNumber } from '../services/utilities';

export const avgTotalsCurrencyFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGridUniversal) => {
  const field = columnDef.field ?? '';
  const val = totals.avg?.[field];
  const params = columnDef?.params;
  const prefix = params?.groupFormatterPrefix || '';
  const suffix = params?.groupFormatterSuffix || '';
  const currencyPrefix = params?.groupFormatterCurrencyPrefix || '';
  const currencySuffix = params?.groupFormatterCurrencySuffix || '';
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber
  } = retrieveFormatterOptions(columnDef, grid, 'currency', 'group');

  if (val !== null && !isNaN(+val)) {
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, currencyPrefix, currencySuffix, decimalSeparator, thousandSeparator);
    return `${prefix}${formattedNumber}${suffix}`;
  }
  return '';
};
