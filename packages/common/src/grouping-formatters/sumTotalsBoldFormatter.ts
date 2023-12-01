import type { Column, GroupTotalsFormatter } from './../interfaces/index';
import { formatNumber } from '../services/utilities';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';
import { type SlickGrid } from '../core/index';
import { createDomElement } from '../services';

export const sumTotalsBoldFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
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
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '', '', decimalSeparator, thousandSeparator);
    return createDomElement('span', { style: { fontWeight: 'bold' }, textContent: `${prefix}${formattedNumber}${suffix}` });
  }
  return '';
};
