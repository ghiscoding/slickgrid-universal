import { Formatter } from './../interfaces/index';

export const centerFormatter: Formatter = (row: number, cell: number, value: string | any): string => {
  // make sure the value is a string
  if (value !== undefined && typeof value !== 'string') {
    value = value + '';
  }
  return `<center>${value}</center>`;
};
