import { createDomElement, isNumber } from '@slickgrid-universal/utils';
import { type SlickGrid } from '../core/index.js';
import type { Column, GroupTotalsFormatter } from './../interfaces/index.js';
import { sumTotalsFormatter } from './sumTotalsFormatter.js';

export const sumTotalsColoredFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const field = columnDef.field ?? '';
  const val = totals.sum?.[field];

  if (isNumber(val)) {
    const color = val >= 0 ? 'green' : 'red';
    const textContent = sumTotalsFormatter(totals, columnDef, grid) as string;
    return createDomElement('span', {
      style: { color },
      textContent,
    });
  }
  return '';
};
