import { Formatter } from './../interfaces/index';

/** Takes a boolean value and display a string 'Yes' or 'No' */
export const yesNoFormatter: Formatter = (_row, _cell, value) =>
  value ? 'Yes' : 'No';
