import { Column, Formatter, SlickGrid } from './../interfaces/index';

/** Takes a cell value and translates it (i18n). Requires an instance of the I18N Service:: `i18n: this.i18n` */
export const translateFormatter: Formatter = (_row: number, _cell: number, value: any, columnDef: Column, _dataContext: any, grid: SlickGrid) => {
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

  return value ? i18n.translate(value) : '';
};
