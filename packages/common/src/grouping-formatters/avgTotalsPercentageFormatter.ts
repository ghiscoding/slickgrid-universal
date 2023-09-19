import type { Column, GroupTotalsFormatter, SlickGridUniversal } from './../interfaces/index';
import { decimalFormatted, thousandSeparatorFormatted } from '../services/utilities';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities';

export const avgTotalsPercentageFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGridUniversal) => {
  const field = columnDef.field ?? '';
  let val = totals.avg?.[field];
  const params = columnDef?.params;
  let prefix = params?.groupFormatterPrefix || '';
  const suffix = params?.groupFormatterSuffix || '';
  const {
    minDecimal,
    maxDecimal,
    decimalSeparator,
    thousandSeparator,
    wrapNegativeNumber
  } = retrieveFormatterOptions(columnDef, grid, 'percent', 'group');

  if (val !== null && !isNaN(+val)) {
    if (val < 0) {
      val = Math.abs(val);
      if (!wrapNegativeNumber) {
        prefix += '-';
      } else {
        if (isNaN(minDecimal) && isNaN(maxDecimal)) {
          const outputVal = thousandSeparatorFormatted(Math.round(val), thousandSeparator);
          return `${prefix}(${outputVal}%)${suffix}`;
        }
        return `${prefix}(${decimalFormatted(val, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}%)${suffix}`;
      }
    }

    if (isNaN(minDecimal) && isNaN(maxDecimal)) {
      const outputVal = thousandSeparatorFormatted(Math.round(val), thousandSeparator);
      return `${prefix}${outputVal}%${suffix}`;
    }
    return `${prefix}${decimalFormatted(val, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}%${suffix}`;
  }
  return '';
};
