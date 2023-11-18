import type { Column, GroupTotalsFormatter } from './../interfaces/index';
import { formatNumber } from '../services/utilities';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';
import { type SlickGrid } from '../core/index';

export const maxTotalsFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const field = columnDef.field ?? '';
  const val = totals.max?.[field];
  const params = columnDef?.params;
  const prefix = params?.groupFormatterPrefix || '';
  const suffix = params?.groupFormatterSuffix || '';
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber
  } = retrieveFormatterOptions(columnDef, grid, 'regular', 'group');

  if (val !== null && !isNaN(+val)) {
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '', '', decimalSeparator, thousandSeparator);
    return `${prefix}${formattedNumber}${suffix}`;
  }
  return '';
};
