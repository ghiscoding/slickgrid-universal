import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import type { Column, GroupTotalsFormatter } from './../interfaces/index';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';
import { type SlickGrid } from '../core/index';
import { formatNumber } from '../services/index';

export const sumTotalsDollarColoredFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
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
  } = retrieveFormatterOptions(columnDef, grid, 'currency', 'group');

  if (isNumber(val)) {
    const colorStyle = (val >= 0) ? 'green' : 'red';
    const formattedNumber = formatNumber(val, minDecimal, maxDecimal, wrapNegativeNumber, '$', '', decimalSeparator, thousandSeparator);
    return createDomElement('span', { style: { color: colorStyle }, textContent: `${prefix}${formattedNumber}${suffix}` });
  }
  return '';
};
