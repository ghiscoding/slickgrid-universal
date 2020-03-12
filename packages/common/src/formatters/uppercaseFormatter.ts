import { Column, Formatter } from './../interfaces/index';

export const uppercaseFormatter: Formatter = (row: number, cell: number, value: string | any, columnDef: Column, dataContext: any): string => {
  // make sure the value is a string
  if (value !== undefined && typeof value !== 'string') {
    value = value + '';
  }
  return value ? value.toUpperCase() : '';
};
