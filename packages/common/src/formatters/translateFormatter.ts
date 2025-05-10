import { type Formatter } from './../interfaces/index.js';

/** Takes a cell value and translates it (translater). Requires an instance of the Translate Service:: `translater: this.translate */
export const translateFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const gridOptions = grid?.getOptions() ?? {};
  const translater = gridOptions.translater || columnDef?.params?.translater;

  if (!translater || typeof translater.translate !== 'function') {
    throw new Error(`"Formatters.translate" requires the Translate Service to be provided as a Grid Options "translater" (or "i18n" depending on which framework you use).
    For example: this.gridOptions = { enableTranslate: true, translater: this.translateService }`);
  }

  // make sure the value is a string (for example a boolean value would throw an error)
  if (value !== undefined && value !== null && typeof value !== 'string') {
    value = value + '';
  }

  return value ? translater.translate(value) : '';
};
