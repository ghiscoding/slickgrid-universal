import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import type { GroupTotalsFormatter } from './../interfaces/index.js';
import { sumTotalsDollarFormatter } from './sumTotalsDollarFormatter.js';

export const sumTotalsDollarColoredBoldFormatter: GroupTotalsFormatter = (totals, columnDef, gridOptions) => {
  const field = columnDef.field ?? '';
  const val = totals.sum?.[field];

  if (isNumber(val)) {
    const color = val >= 0 ? 'green' : 'red';
    const textContent = sumTotalsDollarFormatter(totals, columnDef, gridOptions) as string;
    return createDomElement('span', {
      style: {
        color,
        fontWeight: 'bold',
      },
      textContent,
    });
  }
  return '';
};
