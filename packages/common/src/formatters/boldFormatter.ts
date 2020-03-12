import { Column, Formatter } from './../interfaces/index';

export const boldFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
  return value ? `<b>${value}</b>` : '';
};
