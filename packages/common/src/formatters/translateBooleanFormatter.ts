import { Formatter } from './../interfaces/index';

/** Takes a boolean value, cast it to upperCase string and finally translates it (i18n). */
export const translateBooleanFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  const i18n = gridOptions.i18n || (columnDef && columnDef.params && columnDef.params.i18n);

  if (!i18n || typeof i18n.translate !== 'function') {
    throw new Error(`The translate formatter requires the Translate Service to be provided as a Grid Options or Column Definition "i18n".
    For example: this.gridOptions = { enableTranslate: true, i18n: this.translateService }`);
  }

  // make sure the value is a string (for example a boolean value would throw an error)
  if (value !== undefined && value !== null && typeof value !== 'string') {
    value = value + '';
  }
  return value ? i18n.translate(value.toUpperCase() as string) : '';
};
