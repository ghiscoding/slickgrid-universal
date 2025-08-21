import { createDomElement } from '@slickgrid-universal/utils';

import type { GroupTotalsFormatter } from './../interfaces/index.js';
import { sumTotalsFormatter } from './sumTotalsFormatter.js';

export const sumTotalsBoldFormatter: GroupTotalsFormatter = (totals, columnDef, gridOptions) => {
  const textContent = sumTotalsFormatter(totals, columnDef, gridOptions) as string;
  if (textContent) {
    return createDomElement('span', { style: { fontWeight: 'bold' }, textContent });
  }
  return '';
};
