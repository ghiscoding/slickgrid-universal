import { createDomElement, isNumber } from '@slickgrid-universal/utils';
import { type Formatter } from './../interfaces/index.js';
import { dollarFormatter } from './dollarFormatter.js';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value */
export const dollarColoredFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  if (isNumber(value)) {
    const textContent = dollarFormatter(_row, _cell, value, columnDef, _dataContext, grid) as string;
    return createDomElement('span', {
      ariaHidden: 'true',
      style: {
        color: value >= 0 ? 'green' : 'red',
      },
      textContent,
    });
  }
  return value;
};
