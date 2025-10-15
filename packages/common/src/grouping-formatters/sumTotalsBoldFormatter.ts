import { createDomElement } from '@slickgrid-universal/utils';
import { type SlickGrid } from '../core/index.js';
import type { Column, GroupTotalsFormatter } from './../interfaces/index.js';
import { sumTotalsFormatter } from './sumTotalsFormatter.js';

export const sumTotalsBoldFormatter: GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => {
  const textContent = sumTotalsFormatter(totals, columnDef, grid) as string;
  if (textContent) {
    return createDomElement('span', { style: { fontWeight: 'bold' }, textContent });
  }
  return '';
};
