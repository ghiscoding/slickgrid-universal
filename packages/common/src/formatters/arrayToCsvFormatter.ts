import { Column, Formatter } from './../interfaces/index';

export const arrayToCsvFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
  if (value && Array.isArray(value) && value.length > 0) {
    const values = value.join(', ');
    return `<span title="${values}">${values}</span>`;
  }
  return value;
};
