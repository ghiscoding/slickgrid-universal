import { createDomElement } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index';

/** Display whichever icon you want (library agnostic, it could be Font-Awesome, Material or any other icons set) */
export const iconFormatter: Formatter = (_row, _cell, _value, columnDef) => {
  const columnParams = columnDef?.params ?? {};
  const cssClasses = columnParams.iconCssClass || columnParams.icon || columnParams.formatterIcon;
  if (!cssClasses) {
    throw new Error('[Slickgrid-Universal] When using `Formatters.icon`, you must provide the "iconCssClass" via the generic "params". (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "mdi mdi-magnify" }}`');
  }
  const title = columnParams.title || null
  return createDomElement('i', { className: cssClasses, ariaHidden: 'true', title});
};
