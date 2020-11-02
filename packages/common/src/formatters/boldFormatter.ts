import { Formatter } from './../interfaces/index';

export const boldFormatter: Formatter = (_row: number, _cell: number, value: any) => {
  return value ? `<b>${value}</b>` : '';
};
