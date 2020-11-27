import { Formatter } from './../interfaces/index';

/** show input text value as italic text */
export const italicFormatter: Formatter = (_row, _cell, value) => {
  return value ? `<i>${value}</i>` : '';
};
