import { createDomElement } from '@slickgrid-universal/utils';

import type { GroupTotalsFormatter } from './../interfaces/index.js';
import { sumTotalsDollarFormatter } from './sumTotalsDollarFormatter.js';

export const sumTotalsDollarBoldFormatter: GroupTotalsFormatter = (totals, columnDef, gridOptions) => {
  const textContent = sumTotalsDollarFormatter(totals, columnDef, gridOptions) as string;
  if (textContent) {
    return createDomElement('span', {
      style: { fontWeight: 'bold' },
      textContent,
    });
  }
  return '';
};
