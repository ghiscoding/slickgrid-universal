import { isNumber } from '@slickgrid-universal/utils';

import type { GroupTotalsFormatter } from './../interfaces/index.js';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities.js';
import { formatNumber } from './../services/utilities.js';

export const avgTotalsDollarFormatter: GroupTotalsFormatter = (totals, columnDef, gridOptions) => {
  const field = columnDef.field ?? '';
  const val = totals.avg?.[field];
  const params = columnDef?.params ?? {};
  const prefix = params.groupFormatterPrefix || '';
  const suffix = params.groupFormatterSuffix || '';
  const { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber } = retrieveFormatterOptions(
    columnDef,
    gridOptions,
    'currency',
    'group'
  );

  if (isNumber(val)) {
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
    return `${prefix}${formattedNumber}${suffix}`;
  }
  return '';
};
