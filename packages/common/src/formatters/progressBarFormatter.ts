import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';

/** Takes a cell value number (between 0-100) and displays Bootstrap "progress-bar" a red (<30), silver (>30 & <70) or green (>=70) bar */
export const progressBarFormatter: Formatter = (_row, _cell, value) => {
  if (!isNumber(value)) {
    return '';
  }

  let color = '';
  let inputNumber = parseFloat(value as any);
  if (inputNumber > 100) {
    inputNumber = 100;
  }

  if (inputNumber < 30) {
    color = 'danger';
  } else if (inputNumber < 70) {
    color = 'warning';
  } else {
    color = 'success';
  }

  const container = createDomElement('div', { className: 'progress' });
  container.appendChild(createDomElement('div', {
    className: `progress-bar progress-bar-${color} bg-${color}`,
    role: 'progressbar',
    ariaValueNow: String(inputNumber), ariaValueMin: '0', ariaValueMax: '100',
    textContent: `${inputNumber}%`,
    style: { minWidth: '2em', width: `${inputNumber}%` }
  }));
  return container;
};
