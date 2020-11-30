import { Formatter } from './../interfaces/index';

/** Takes a cell value and translates it (translater). Requires an instance of the Translate Service:: `translater: this.translate */
export const translateFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  const translater = gridOptions.translater || (columnDef && columnDef.params && columnDef.params.translater);

  if (!translater || typeof translater.translate !== 'function') {
    throw new Error(`The translate formatter requires the Translate Service to be provided as a Grid Options or Column Definition "translater".
    For example: this.gridOptions = { enableTranslate: true, translater: this.translateService }`);
  }

  // make sure the value is a string (for example a boolean value would throw an error)
  if (value !== undefined && value !== null && typeof value !== 'string') {
    value = value + '';
  }

  return value ? translater.translate(value) : '';
};
