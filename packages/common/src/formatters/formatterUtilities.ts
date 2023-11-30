import { isPrimitiveOrHTML, stripTags } from '@slickgrid-universal/utils';
import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import { FieldType } from '../enums/fieldType.enum';
import type { Column, ExcelExportOption, Formatter, FormatterResultWithHtml, FormatterResultWithText, GridOption, TextExportOption } from '../interfaces/index';
import { getHTMLFromFragment } from '../services/domUtilities';
import { mapMomentDateFormatWithFieldType } from '../services/utilities';
import { multipleFormatter } from './multipleFormatter';
import { Constants } from '../constants';
import { type SlickGrid } from '../core/index';

export type FormatterType = 'group' | 'cell';
export type NumberType = 'decimal' | 'currency' | 'percent' | 'regular';

/**
 * Automatically add a Custom Formatter on all column definitions that have an Editor.
 * Instead of manually adding a Custom Formatter on every column definitions that are editables, let's ask the system to do it in an easier automated way.
 * It will loop through all column definitions and add an Custom Editor Formatter when necessary,
 * also note that if there's already a Formatter on the column definition it will automatically use the Formatters.multiple and add the custom formatter into the `params: formatters: {}}`
 */
export function autoAddEditorFormatterToColumnsWithEditor(columnDefinitions: Column[], customEditableFormatter: Formatter) {
  if (Array.isArray(columnDefinitions)) {
    for (const columnDef of columnDefinitions) {
      if (columnDef.editor) {
        if (columnDef.formatter && columnDef.formatter !== multipleFormatter && columnDef.formatter !== customEditableFormatter) {
          const prevFormatter = columnDef.formatter;
          columnDef.formatter = multipleFormatter;
          columnDef.params = { ...columnDef.params, formatters: [prevFormatter, customEditableFormatter] };
        } else if (columnDef.formatter && columnDef.formatter === multipleFormatter && columnDef.params) {
          // before adding the formatter, make sure it's not yet in the params.formatters list, we wouldn't want to add it multiple times
          if (columnDef.params.formatters.findIndex((formatter: Formatter) => formatter === customEditableFormatter) === -1) {
            columnDef.params.formatters = [...columnDef.params.formatters, customEditableFormatter];
          }
        } else {
          columnDef.formatter = customEditableFormatter;
        }
      }
    }
  }
}

export function retrieveFormatterOptions(columnDef: Column, grid: SlickGrid, numberType: NumberType, formatterType: FormatterType) {
  let defaultMinDecimal;
  let defaultMaxDecimal;
  let numberPrefix = '';
  let numberSuffix = '';

  switch (numberType) {
    case 'currency':
      defaultMinDecimal = Constants.DEFAULT_FORMATTER_CURRENCY_MIN_DECIMAL;
      defaultMaxDecimal = Constants.DEFAULT_FORMATTER_CURRENCY_MAX_DECIMAL;
      break;
    case 'decimal':
      defaultMinDecimal = Constants.DEFAULT_FORMATTER_NUMBER_MIN_DECIMAL;
      defaultMaxDecimal = Constants.DEFAULT_FORMATTER_NUMBER_MAX_DECIMAL;
      break;
    case 'percent':
      defaultMinDecimal = Constants.DEFAULT_FORMATTER_PERCENT_MIN_DECIMAL;
      defaultMaxDecimal = Constants.DEFAULT_FORMATTER_PERCENT_MAX_DECIMAL;
      break;
    default:
      break;
  }
  const gridOptions = ((grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {}) as GridOption;
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, gridOptions, defaultMinDecimal);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, gridOptions, defaultMaxDecimal);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, gridOptions, Constants.DEFAULT_NUMBER_DECIMAL_SEPARATOR);
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, gridOptions, Constants.DEFAULT_NUMBER_THOUSAND_SEPARATOR);
  const wrapNegativeNumber = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, gridOptions, Constants.DEFAULT_NEGATIVE_NUMBER_WRAPPED_IN_BRAQUET);
  const currencyPrefix = getValueFromParamsOrFormatterOptions('currencyPrefix', columnDef, gridOptions, '');
  const currencySuffix = getValueFromParamsOrFormatterOptions('currencySuffix', columnDef, gridOptions, '');

  if (formatterType === 'cell') {
    numberPrefix = getValueFromParamsOrFormatterOptions('numberPrefix', columnDef, gridOptions, '');
    numberSuffix = getValueFromParamsOrFormatterOptions('numberSuffix', columnDef, gridOptions, '');
  }

  return { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber, currencyPrefix, currencySuffix, numberPrefix, numberSuffix };
}

/**
 * Find the option value from the following (in order of execution)
 * 1- Column Definition "params"
 * 2- Grid Options "formatterOptions"
 * 3- nothing found, return default value provided
 */
export function getValueFromParamsOrFormatterOptions(optionName: string, columnDef: Column, gridOptions: GridOption, defaultValue?: any) {
  const params = columnDef && columnDef.params;

  if (params && params.hasOwnProperty(optionName)) {
    return params[optionName];
  } else if (gridOptions?.formatterOptions?.hasOwnProperty(optionName)) {
    return (gridOptions.formatterOptions as any)[optionName];
  }
  return defaultValue;
}

/** From a FieldType, return the associated date Formatter */
export function getAssociatedDateFormatter(fieldType: typeof FieldType[keyof typeof FieldType], defaultSeparator: string): Formatter {
  const defaultDateFormat = mapMomentDateFormatWithFieldType(fieldType);

  return (_row: number, _cell: number, value: any, columnDef: Column, _dataContext: any, grid: SlickGrid) => {
    const gridOptions = ((grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {}) as GridOption;
    const customSeparator = gridOptions?.formatterOptions?.dateSeparator ?? defaultSeparator;
    const inputType = columnDef?.type ?? FieldType.date;
    const inputDateFormat = mapMomentDateFormatWithFieldType(inputType);
    const isParsingAsUtc = columnDef?.params?.parseDateAsUtc ?? false;

    const isDateValid = moment(value, inputDateFormat, false).isValid();
    let outputDate = value;
    if (value && isDateValid) {
      outputDate = isParsingAsUtc ? moment.utc(value).format(defaultDateFormat) : moment(value).format(defaultDateFormat);
    }

    // user can customize the separator through the "formatterOptions"
    // if that is the case we need to replace the default "/" to the new separator
    if (outputDate && customSeparator !== defaultSeparator) {
      const regex = new RegExp(defaultSeparator, 'ig'); // find separator globally
      outputDate = outputDate.replace(regex, customSeparator);
    }

    return outputDate;
  };
}


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
export function exportWithFormatterWhenDefined<T = any>(row: number, col: number, columnDef: Column<T>, dataContext: T, grid: SlickGrid, exportOptions?: TextExportOption | ExcelExportOption) {
  let isEvaluatingFormatter = false;

  // check if "exportWithFormatter" is provided in the column definition, if so it will have precendence over the Grid Options exportOptions
  if (columnDef?.hasOwnProperty('exportWithFormatter')) {
    isEvaluatingFormatter = !!columnDef.exportWithFormatter;
  } else if (exportOptions?.hasOwnProperty('exportWithFormatter')) {
    // last check in Grid Options export options
    isEvaluatingFormatter = !!exportOptions.exportWithFormatter;
  }

  let formatter: Formatter | undefined;
  if (dataContext && columnDef.exportCustomFormatter) {
    // did the user provide a Custom Formatter for the export
    formatter = columnDef.exportCustomFormatter;
  } else if (isEvaluatingFormatter && columnDef.formatter) {
    // or else do we have a column Formatter AND are we evaluating it?
    formatter = columnDef.formatter;
  }

  const output = parseFormatterWhenExist(formatter, row, col, columnDef, dataContext, grid);
  return (exportOptions?.sanitizeDataExport && typeof output === 'string') ? stripTags(output) : output;
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
export function parseFormatterWhenExist<T = any>(formatter: Formatter<T> | undefined, row: number, col: number, columnDef: Column<T>, dataContext: T, grid: SlickGrid): string {
  let output = '';

  // does the field have the dot (.) notation and is a complex object? if so pull the first property name
  const fieldId = columnDef.field || columnDef.id || '';
  let fieldProperty = fieldId;
  if (typeof columnDef.field === 'string' && columnDef.field.indexOf('.') > 0) {
    const props = columnDef.field.split('.');
    fieldProperty = (props.length > 0) ? props[0] : columnDef.field;
  }

  const cellValue = dataContext?.hasOwnProperty(fieldProperty as keyof T) ? dataContext[fieldProperty as keyof T] : null;

  if (typeof formatter === 'function') {
    const formattedData = formatter(row, col, cellValue, columnDef, dataContext, grid);
    const cellResult = isPrimitiveOrHTML(formattedData) ? formattedData : (formattedData as FormatterResultWithHtml).html || (formattedData as FormatterResultWithText).text;
    if (cellResult instanceof DocumentFragment) {
      output = getHTMLFromFragment(cellResult);
    } else {
      output = (cellResult instanceof HTMLElement) ? cellResult.innerHTML : cellResult as string;
    }
  } else {
    output = ((!dataContext?.hasOwnProperty(fieldProperty as keyof T)) ? '' : cellValue) as string;
  }

  if (output === null || output === undefined) {
    output = '';
  }

  // if at the end we have an empty object, then replace it with an empty string
  if (typeof output === 'object' && !((output as any) instanceof Date) && Object.entries(output).length === 0) {
    output = '';
  }

  return output;
}
