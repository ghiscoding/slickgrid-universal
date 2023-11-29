import { type Formatter } from './../interfaces/index';

/**
 * You can pipe multiple formatters (executed in sequence), use params to pass the list of formatters.
 * Requires to pass an array of "formatters" in the column definition the generic "params" property
 * For example::
 * { field: 'title', formatter: Formatters.multiple, params: { formatters: [ Formatters.lowercase, Formatters.uppercase ] }
 */
export const multipleFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  const params = columnDef.params || {};
  if (!params.formatters || !Array.isArray(params.formatters)) {
    throw new Error(`[Slickgrid-Universal] The multiple formatter requires the "formatters" to be provided as a column params.
    For example: this.columnDefinitions = [{ id: title, field: title, formatter: Formatters.multiple, params: { formatters: [Formatters.lowercase, Formatters.uppercase] }`);
  }
  const formatters: Formatter[] = params.formatters;

  // loop through all Formatters, the value of 1st formatter will be used by 2nd formatter and so on.
  // they are piped and executed in sequences
  let currentValue = value;
  formatters.forEach((formatter, idx) => {
    if (typeof formatter !== 'function') {
      throw new Error(`[Slickgrid-Universal] the "params.formatters" at index(${idx}) to be used by "Formatters.multiple" is invalid, please verify all formatter functions.`);
    }
    currentValue = formatter.call(this, row, cell, currentValue, columnDef, dataContext, grid);
  });
  return currentValue;
};
