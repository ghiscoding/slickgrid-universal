import { isNumber } from '@slickgrid-universal/utils';

import type { Column, GroupTotalsFormatter } from './../interfaces/index';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';
import { formatNumber } from './../services/utilities';
import { type SlickGrid } from '../core/index';

export const avgTotalsDollarFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const field = columnDef.field ?? '';
  const val = totals.avg?.[field];
  const params = columnDef?.params;
  const prefix = params?.groupFormatterPrefix || '';
  const suffix = params?.groupFormatterSuffix || '';
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber
  } = retrieveFormatterOptions(columnDef, grid, 'currency', 'group');

  if (isNumber(val)) {
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
    return `${prefix}${formattedNumber}${suffix}`;
  }
  return '';
};
