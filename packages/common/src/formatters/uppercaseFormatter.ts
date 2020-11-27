import { Formatter } from './../interfaces/index';

/** Takes a value and displays it all uppercase */
export const uppercaseFormatter: Formatter = (_row, _cell, value) => {
  // make sure the value is a string
  if (value !== undefined && typeof value !== 'string') {
    value = value + '';
  }
  return value ? value.toUpperCase() : '';
};
