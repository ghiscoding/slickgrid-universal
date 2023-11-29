import { type  Formatter } from './../interfaces/index';

/** Display whichever icon you want (library agnostic, it could be Font-Awesome or any other) */
export const iconFormatter: Formatter = (_row, _cell, _value, columnDef) => {
  const columnParams = columnDef?.params ?? {};
  const icon = columnParams.iconCssClass || columnParams.icon || columnParams.formatterIcon;
  if (columnParams.icon || columnParams.formatterIcon) {
    console.warn('[Slickgrid-Universal] deprecated params.icon or params.formatterIcon are deprecated when using `Formatters.icon` in favor of params.iconCssClass. (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "fa fa-search" }}`');
  }

  if (!icon) {
    throw new Error('[Slickgrid-Universal] When using `Formatters.icon`, you must provide the "iconCssClass" via the generic "params". (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "fa fa-search" }}`');
  }
  return `<i class="${icon}" aria-hidden="true"></i>`;
};
