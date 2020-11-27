import { Formatter } from './../interfaces/index';

/** Display whichever icon you want (library agnostic, it could be Font-Awesome or any other) */
export const iconFormatter: Formatter = (_row, _cell, _value, columnDef) => {
  const columnParams = columnDef && columnDef.params || {};
  const icon = columnParams.icon || columnParams.formatterIcon;

  if (!icon) {
    throw new Error(`You must provide the "icon" or "formatterIcon" via the generic "params" options (e.g.: { formatter: Formatters.icon, params: { formatterIcon: 'fa fa-search' }}`);
  }
  return `<i class="${icon}" aria-hidden="true"></i>`;
};
