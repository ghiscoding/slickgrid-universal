import { Column, Formatter } from './../interfaces/index';

export const infoIconFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) =>
  `<i class="fa fa-info-circle pointer info-icon" aria-hidden="true"></i>`;
