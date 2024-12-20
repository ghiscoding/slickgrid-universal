import { isNumber } from '@slickgrid-universal/utils';

import type { Column, GroupTotalsFormatter } from '../interfaces/index.js';
import { formatNumber } from '../services/utilities.js';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities.js';
import { type SlickGrid } from '../core/index.js';

export const sumTotalsCurrencyFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const field = columnDef.field ?? '';
  const val = totals.sum?.[field];
  const params = columnDef?.params;
  const prefix = params?.groupFormatterPrefix || '';
  const suffix = params?.groupFormatterSuffix || '';
  const currencyPrefix = params?.groupFormatterCurrencyPrefix || '';
  const currencySuffix = params?.groupFormatterCurrencySuffix || '';

  const { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber } = retrieveFormatterOptions(
    columnDef,
    grid,
    'currency',
    'group'
  );

  if (isNumber(val)) {
    const formattedNumber = formatNumber(
      val,
      minDecimal,
      maxDecimal,
      wrapNegativeNumber,
      currencyPrefix,
      currencySuffix,
      decimalSeparator,
      thousandSeparator
    );
    return `${prefix}${formattedNumber}${suffix}`;
  }
  return '';
};
