import { type Formatter } from './../interfaces/index.js';
import { dollarColoredFormatter } from './dollarColoredFormatter.js';

/** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value, show it in bold font weight as well */
export const dollarColoredBoldFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  // use the dollarColoredFormatter to format the value and then apply bold styling if the value is a <span> element
  const spanOrValue = dollarColoredFormatter(_row, _cell, value, columnDef, _dataContext, grid);
  if (spanOrValue instanceof HTMLElement) {
    spanOrValue.style.fontWeight = 'bold';
  }
  return spanOrValue;
};
