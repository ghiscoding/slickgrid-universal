import { type Formatter } from './../interfaces/index';

/**
 * Takes a value display it according to a mask provided
 * e.: 1234567890 with mask "(000) 000-0000" will display "(123) 456-7890"
 */
export const maskFormatter: Formatter = (_row, _cell, value, columnDef, data, grid) => {
  const params = columnDef.params || {};
  const mask = params.mask;

  if (!mask) {
    throw new Error(`You must provide a "mask" via the generic "params" options (e.g.: { formatter: Formatters.mask, params: { mask: '000-000' }}`);
  }

  if (value) {
    let i = 0;
    const v = value.toString();
    const gridOptions = grid.getOptions() || {};
    const containerElm = gridOptions?.preventDocumentFragmentUsage ? document.createElement('span') : new DocumentFragment();
    containerElm.textContent = mask.replace(/[09A]/gi, () => v[i++] || '');
    return containerElm;
  }
  return value;
};
