import { Column, ExcelExportOption, Formatter, SlickGrid, TextExportOption } from '../interfaces/index';

/**
 * Goes through every possible ways to find and apply a Formatter when found,
 * it will first check if a `exportCustomFormatter` is defined else it will check if there's a regular `formatter` and `exportWithFormatter` is enabled.
 * This function is similar to `applyFormatterWhenDefined()` except that it execute any `exportCustomFormatter` while `applyFormatterWhenDefined` does not.
 * @param {Number} row - grid row index
 * @param {Number} col - grid column index
 * @param {Object} dataContext - item data context object
 * @param {Object} columnDef - column definition
 * @param {Object} grid - Slick Grid object
 * @param {Object} exportOptions - Excel or Text Export Options
 * @returns formatted string output or empty string
 */
export function exportWithFormatterWhenDefined(row: number, col: number, dataContext: any, columnDef: Column, grid: SlickGrid, exportOptions?: TextExportOption | ExcelExportOption) {
  let isEvaluatingFormatter = false;

  // first check if there are any export options provided (as Grid Options)
  if (exportOptions && exportOptions.hasOwnProperty('exportWithFormatter')) {
    isEvaluatingFormatter = !!exportOptions.exportWithFormatter;
  }

  // second check if "exportWithFormatter" is provided in the column definition, if so it will have precendence over the Grid Options exportOptions
  if (columnDef && columnDef.hasOwnProperty('exportWithFormatter')) {
    isEvaluatingFormatter = !!columnDef.exportWithFormatter;
  }

  let formatter: Formatter | undefined;
  if (dataContext && columnDef.exportCustomFormatter) {
    // did the user provide a Custom Formatter for the export
    formatter = columnDef.exportCustomFormatter;
  } else if (isEvaluatingFormatter && columnDef.formatter) {
    // or else do we have a column Formatter AND are we evaluating it?
    formatter = columnDef.formatter;
  }

  return parseFormatterWhenExist(formatter, row, col, dataContext, columnDef, grid);
}

/**
 * Takes a Formatter function, execute and return the formatted output
 * @param {Function} formatter - formatter function
 * @param {Number} row - grid row index
 * @param {Number} col - grid column index
 * @param {Object} dataContext - item data context object
 * @param {Object} columnDef - column definition
 * @param {Object} grid - Slick Grid object
 * @returns formatted string output or empty string
 */
export function parseFormatterWhenExist(formatter: Formatter<any> | undefined, row: number, col: number, dataContext: any, columnDef: Column, grid: SlickGrid): string {
  let output = '';

  // does the field have the dot (.) notation and is a complex object? if so pull the first property name
  const fieldId = columnDef.field || columnDef.id || '';
  let fieldProperty = fieldId;
  if (typeof columnDef.field === 'string' && columnDef.field.indexOf('.') > 0) {
    const props = columnDef.field.split('.');
    fieldProperty = (props.length > 0) ? props[0] : columnDef.field;
  }

  const cellValue = dataContext.hasOwnProperty(fieldProperty) ? dataContext[fieldProperty] : null;

  if (typeof formatter === 'function') {
    const formattedData = formatter(row, col, cellValue, columnDef, dataContext, grid);
    output = formattedData as string;
    if (formattedData && typeof formattedData === 'object' && formattedData.hasOwnProperty('text')) {
      output = formattedData.text;
    }
    if (output === null || output === undefined) {
      output = '';
    }
  } else {
    output = (!dataContext.hasOwnProperty(fieldProperty)) ? '' : cellValue;
    if (output === null || output === undefined) {
      output = '';
    }
  }

  // if at the end we have an empty object, then replace it with an empty string
  if (typeof output === 'object' && Object.entries(output).length === 0) {
    output = '';
  }

  return output;
}
