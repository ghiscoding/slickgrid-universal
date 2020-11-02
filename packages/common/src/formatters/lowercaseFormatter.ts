import { Formatter } from './../interfaces/index';

export const lowercaseFormatter: Formatter = (_row: number, _cell: number, value: string | any): string => {
  // make sure the value is a string
  if (value !== undefined && typeof value !== 'string') {
    value = value + '';
  }
  return value ? value.toLowerCase() : '';
};
