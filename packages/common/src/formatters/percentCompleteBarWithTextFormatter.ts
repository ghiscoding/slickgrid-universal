import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import type { Formatter } from './../interfaces/index.js';

/** Takes a cell value number (between 0-100) and displays SlickGrid custom "percent-complete-bar" with Text a red (<30), silver (>30 & <70) or green (>=70) bar */
export const percentCompleteBarWithTextFormatter: Formatter = (_row, _cell, value) => {
  if (!isNumber(value)) {
    return '';
  }

  let color = '';
  let percent = parseFloat(value as any);
  if (percent > 100) {
    percent = 100;
  }
  color = percent < 30 ? 'red' : percent < 70 ? 'silver' : 'green';

  return createDomElement('div', {
    className: 'percent-complete-bar-with-text',
    title: `${percent}%`,
    textContent: `${percent}%`,
    style: { background: color, width: `${percent}%` },
  });
};
