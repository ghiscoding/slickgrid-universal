import { Column, Formatter } from './../interfaces/index';

export const iconFormatter: Formatter = (_row: number, _cell: number, _value: any, columnDef: Column) => {
  const columnParams = columnDef && columnDef.params || {};
  const icon = columnParams.icon || columnParams.formatterIcon;

  if (!icon) {
    throw new Error(`You must provide the "icon" or "formatterIcon" via the generic "params" options (e.g.: { formatter: Formatters.icon, params: { formatterIcon: 'fa fa-search' }}`);
  }
  return `<i class="${icon}" aria-hidden="true"></i>`;
};
