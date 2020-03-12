import { Column, Formatter } from './../interfaces/index';

export const yesNoFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any): string =>
  value ? 'Yes' : 'No';
