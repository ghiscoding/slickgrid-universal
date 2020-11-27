import { Formatter } from './../interfaces/index';

/** Align cell value to the right */
export const alignRightFormatter: Formatter = (_row, _cell, value) => {
  let outputValue = value;

  if (value === null || value === undefined) {
    outputValue = '';
  }
  return `<div style="float: right">${outputValue}</div>`;
};
