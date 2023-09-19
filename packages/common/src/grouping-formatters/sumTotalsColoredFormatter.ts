import type { Column, GroupTotalsFormatter, SlickGridUniversal } from './../interfaces/index';
import { formatNumber } from '../services/utilities';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';

export const sumTotalsColoredFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGridUniversal) => {
  const field = columnDef.field ?? '';
  const val = totals.sum?.[field];
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
    const colorStyle = (val >= 0) ? 'green' : 'red';
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '', '', decimalSeparator, thousandSeparator);
    return `<span style="color:${colorStyle}">${prefix}${formattedNumber}${suffix}</span>`;
  }
  return '';
};
