import { createDomElement } from '@slickgrid-universal/utils';

import type { Column, GroupTotalsFormatter } from './../interfaces/index.js';
import { type SlickGrid } from '../core/index.js';
import { sumTotalsDollarFormatter } from './sumTotalsDollarFormatter.js';

export const sumTotalsDollarBoldFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const textContent = sumTotalsDollarFormatter(totals, columnDef, grid) as string;
  if (textContent) {
    return createDomElement('span', {
      style: { fontWeight: 'bold' },
      textContent,
    });
  }
  return '';
};
