import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import type { Column, GroupTotalsFormatter } from '../interfaces/index.js';
import { type SlickGrid } from '../core/index.js';
import { sumTotalsCurrencyFormatter } from './sumTotalsCurrencyFormatter.js';

export const sumTotalsCurrencyColoredFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const field = columnDef.field ?? '';
  const val = totals.sum?.[field];

  if (isNumber(val)) {
    const color = val >= 0 ? 'green' : 'red';
    const textContent = sumTotalsCurrencyFormatter(totals, columnDef, grid) as string;
    return createDomElement('span', {
      style: { color },
      textContent,
    });
  }
  return '';
};
