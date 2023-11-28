import { isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';
import { createDomElement } from '../services';

/** Takes a cell value number (between 0-100) and displays a SlickGrid custom "percent-complete-bar" a red (<30), silver (>30 & <70) or green (>=70) bar */
export const percentCompleteBarFormatter: Formatter = (_row, _cell, value) => {
  if (!isNumber(value)) {
    return '';
  }

  let color = '';
  let inputNumber = parseFloat(value);
  if (inputNumber > 100) {
    inputNumber = 100;
  }

  if (inputNumber < 30) {
    color = 'red';
  } else if (inputNumber < 70) {
    color = 'silver';
  } else {
    color = 'green';
  }

  return createDomElement('span', { className: 'percent-complete-bar', title: `${inputNumber}%`, style: { background: color, width: `${inputNumber}%` } });
};
