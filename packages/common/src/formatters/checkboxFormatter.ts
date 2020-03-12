import { Column, Formatter } from './../interfaces/index';

export const checkboxFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) =>
  value ? '&#x2611;' : '';
