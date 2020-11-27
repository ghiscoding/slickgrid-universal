import { Formatter } from './../interfaces/index';

/** When value is filled (true), it will display a checkbox Unicode icon */
export const checkboxFormatter: Formatter = (_row, _cell, value) =>
  value ? '&#x2611;' : '';
