import { Formatter } from './../interfaces/index';

/** show value in bold font weight */
export const boldFormatter: Formatter = (_row, _cell, value) => {
  return value ? `<b>${value}</b>` : '';
};
