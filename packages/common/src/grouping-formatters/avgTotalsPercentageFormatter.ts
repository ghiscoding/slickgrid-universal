import { isNumber } from '@slickgrid-universal/utils';

import type { GroupTotalsFormatter } from './../interfaces/index.js';
import { decimalFormatted, thousandSeparatorFormatted } from '../services/utilities.js';
import { retrieveFormatterOptions } from '../formatters/formatterUtilities.js';

export const avgTotalsPercentageFormatter: GroupTotalsFormatter = (totals, columnDef, gridOptions) => {
  const field = columnDef.field ?? '';
  let val = totals.avg?.[field];
  const params = columnDef?.params ?? {};
  let prefix = params.groupFormatterPrefix || '';
  const suffix = params.groupFormatterSuffix || '';
  const { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber } = retrieveFormatterOptions(
    columnDef,
    gridOptions,
    'percent',
    'group'
  );

  if (isNumber(val)) {
    if (val < 0) {
      val = Math.abs(val);
      if (!wrapNegativeNumber) {
        prefix += '-';
      } else {
        if (isNaN(minDecimal as any) && isNaN(maxDecimal as any)) {
          const outputVal = thousandSeparatorFormatted(Math.round(val), thousandSeparator);
          return `${prefix}(${outputVal}%)${suffix}`;
        }
        return `${prefix}(${decimalFormatted(val, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}%)${suffix}`;
      }
    }

    if (isNaN(minDecimal as any) && isNaN(maxDecimal as any)) {
      const outputVal = thousandSeparatorFormatted(Math.round(val), thousandSeparator);
      return `${prefix}${outputVal}%${suffix}`;
    }
    return `${prefix}${decimalFormatted(val, minDecimal, maxDecimal, decimalSeparator, thousandSeparator)}%${suffix}`;
  }
  return '';
};
