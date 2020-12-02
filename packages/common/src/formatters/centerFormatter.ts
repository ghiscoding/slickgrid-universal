import { Formatter } from './../interfaces/index';

/** Align cell value to the center (alias to Formatters.center) */
export const centerFormatter: Formatter = (_row, _cell, value) => {
  let outputValue = value;

  if (value === null || value === undefined) {
    outputValue = '';
  }
  return `<center>${outputValue}</center>`;
};
