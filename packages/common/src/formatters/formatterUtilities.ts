import { getHtmlStringOutput, isEmptyObject, isPrimitiveOrHTML, stripTags } from '@slickgrid-universal/utils';
import { Constants } from '../constants.js';
import { type SlickGrid } from '../core/slickGrid.js';
import { type FieldType } from '../enums/field.type.js';
import type {
  Column,
  ExcelExportOption,
  Formatter,
  FormatterResultWithHtml,
  FormatterResultWithText,
  GridOption,
  MenuCallbackArgs,
  TextExportOption,
} from '../interfaces/index.js';
import { formatDate, mapTempoDateFormatWithFieldType, toUtcDate, tryParseDate } from '../services/dateUtils.js';
import { getCellValueFromQueryFieldGetter } from '../services/utilities.js';
import { multipleFormatter } from './multipleFormatter.js';

export type FormatterType = 'group' | 'cell';
export type NumberType = 'decimal' | 'currency' | 'percent' | 'regular';
/** reads and returns the formatted export output of a cell */
export type ExportCellReader<T = any> = (row: number, col: number, dataContext: T) => string;

/**
 * Automatically add a Custom Formatter on all column definitions that have an Editor.
 * Instead of manually adding a Custom Formatter on every column definitions that are editables, let's ask the system to do it in an easier automated way.
 * It will loop through all column definitions and add an Custom Editor Formatter when necessary,
 * also note that if there's already a Formatter on the column definition it will automatically use the Formatters.multiple and add the custom formatter into the `params: formatters: {}}`
 */
export function autoAddEditorFormatterToColumnsWithEditor(columns: Column[], customEditableFormatter: Formatter): void {
  if (!Array.isArray(columns)) {
    return;
  }
  for (const columnDef of columns) {
    if (!columnDef.editor) {
      continue;
    }
    if (columnDef.formatter && columnDef.formatter !== multipleFormatter && columnDef.formatter !== customEditableFormatter) {
      const prevFormatter = columnDef.formatter;
      columnDef.formatter = multipleFormatter;
      columnDef.params = { ...columnDef.params, formatters: [prevFormatter, customEditableFormatter] };
    } else if (columnDef.formatter === multipleFormatter && columnDef.params) {
      if (!columnDef.params.formatters.includes(customEditableFormatter)) {
        columnDef.params.formatters = [...columnDef.params.formatters, customEditableFormatter];
      }
    } else {
      columnDef.formatter = customEditableFormatter;
    }
  }
}

/** Get the parsed cell value, which will use the formatter if "exportWithFormatter" is set */
export function getCopyCellValue(args: MenuCallbackArgs): string {
  const { grid, column: columnDef, dataContext } = args;
  let textToCopy: string;
  if (typeof columnDef.queryFieldNameGetterFn === 'function') {
    textToCopy = getCellValueFromQueryFieldGetter(columnDef, dataContext, '');
  } else {
    // if "exportWithFormatter" is set then we'll use the formatter output
    const gridOptions = grid.getOptions();
    const exportOptions = gridOptions && (gridOptions.excelExportOptions || gridOptions.textExportOptions);
    textToCopy = exportWithFormatterWhenDefined(args.row ?? 0, args.cell ?? 0, columnDef, dataContext, grid, exportOptions);
  }

  // when it's a string, remove any Tree Data/Grouping symbols (e.g.: "⮟  Task 21" or "·   Task 2") and the unwanted U+034F character
  return typeof textToCopy === 'string' ? textToCopy.replace(/[·⮞⮟]\s*|\u034f/g, '').trim() : textToCopy;
}

/**
 * Copy active cell content to clipboard. The command will first check if the cell has a Formatter (and exportWithFormatter)
 * @param args
 */
export async function copyCellToClipboard(args: MenuCallbackArgs): Promise<string | number> {
  let textToCopy = '';
  try {
    // get cell to copy
    textToCopy = getCopyCellValue(args);

    // copy to clipboard using native Clipboard API
    await navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    console.error(`Unable to read/write to clipboard. Please check your browser settings or permissions. Error: ${err}`);
  }
  return textToCopy;
}

const DEFAULT_DECIMALS: Partial<Record<NumberType, [min?: number, max?: number]>> = {
  currency: [Constants.DEFAULT_FORMATTER_CURRENCY_MIN_DECIMAL, Constants.DEFAULT_FORMATTER_CURRENCY_MAX_DECIMAL],
  decimal: [Constants.DEFAULT_FORMATTER_NUMBER_MIN_DECIMAL, Constants.DEFAULT_FORMATTER_NUMBER_MAX_DECIMAL],
  percent: [Constants.DEFAULT_FORMATTER_PERCENT_MIN_DECIMAL, Constants.DEFAULT_FORMATTER_PERCENT_MAX_DECIMAL],
};

export function retrieveFormatterOptions(
  columnDef: Column,
  grid: SlickGrid,
  numberType: NumberType,
  formatterType: FormatterType
): {
  minDecimal: number;
  maxDecimal: number;
  decimalSeparator: ',' | '.';
  thousandSeparator: ',' | '_' | '.' | ' ' | '';
  wrapNegativeNumber: boolean;
  currencyPrefix: string;
  currencySuffix: string;
  numberPrefix: string;
  numberSuffix: string;
} {
  // this runs for every formatted number cell, so resolve the option sources once and look them up directly
  const [defaultMinDecimal, defaultMaxDecimal] = DEFAULT_DECIMALS[numberType] ?? [];
  const params = columnDef.params;
  const formatterOptions = grid.getOptions?.()?.formatterOptions;
  const isCell = formatterType === 'cell';

  return {
    minDecimal: findOptionValue('minDecimal', params, formatterOptions, defaultMinDecimal),
    maxDecimal: findOptionValue('maxDecimal', params, formatterOptions, defaultMaxDecimal),
    decimalSeparator: findOptionValue('decimalSeparator', params, formatterOptions, Constants.DEFAULT_NUMBER_DECIMAL_SEPARATOR),
    thousandSeparator: findOptionValue('thousandSeparator', params, formatterOptions, Constants.DEFAULT_NUMBER_THOUSAND_SEPARATOR),
    wrapNegativeNumber: findOptionValue(
      'displayNegativeNumberWithParentheses',
      params,
      formatterOptions,
      Constants.DEFAULT_NEGATIVE_NUMBER_WRAPPED_IN_BRAQUET
    ),
    currencyPrefix: findOptionValue('currencyPrefix', params, formatterOptions, ''),
    currencySuffix: findOptionValue('currencySuffix', params, formatterOptions, ''),
    numberPrefix: isCell ? findOptionValue('numberPrefix', params, formatterOptions, '') : '',
    numberSuffix: isCell ? findOptionValue('numberSuffix', params, formatterOptions, '') : '',
  };
}

/**
 * Find the option value from the following (in order of execution)
 * 1- Column Definition "params"
 * 2- Grid Options "formatterOptions"
 * 3- nothing found, return default value provided
 */
export function getValueFromParamsOrFormatterOptions(
  optionName: string,
  columnDef: Column,
  gridOptions: GridOption,
  defaultValue?: any
): any {
  return findOptionValue(optionName, columnDef.params, gridOptions?.formatterOptions, defaultValue);
}

/**
 * From a FieldType, return the associated date Formatter
 * @param {FieldType} fieldType - date field type
 * @param {String} [defaultSeparator] - date separator used by the field type output format, defaults to the 1st non-alphanumeric character of the format (e.g. "-" in "YYYY-MM-DD")
 */
export function getAssociatedDateFormatter(fieldType: FieldType, defaultSeparator?: string): Formatter {
  const defaultDateFormat = mapTempoDateFormatWithFieldType(fieldType, { withZeroPadding: true });
  const separator = defaultSeparator ?? defaultDateFormat.match(/[^a-z0-9]/i)?.[0];
  const dateFormatBySeparator = new Map<string, string>();

  return (_row, _cell, value, columnDef, _dataContext, grid) => {
    // user can customize the separator through the "formatterOptions", if so we replace the default separator in the output format
    const customSeparator = grid.getOptions?.()?.formatterOptions?.dateSeparator;
    let outputDateFormat = defaultDateFormat;
    if (separator && customSeparator !== undefined && customSeparator !== separator) {
      outputDateFormat = dateFormatBySeparator.get(customSeparator) ?? '';
      if (!outputDateFormat) {
        outputDateFormat = defaultDateFormat.split(separator).join(customSeparator);
        dateFormatBySeparator.set(customSeparator, outputDateFormat);
      }
    }

    return parseDateByIOFormats(columnDef, value, getInputDateFormat(columnDef), outputDateFormat);
  };
}

/**
 * Base Date Formatter that will use the input & output date format provided in the column definition params
 * @param {Object} columnDef - column definition
 * @returns {Function} formatter function
 */
export function getBaseDateFormatter(): Formatter {
  return (_row, _cell, value, columnDef) => {
    const outpuDateFormat: string = columnDef.params?.dateFormat;
    if (!outpuDateFormat) {
      throw new Error(
        `[Slickgrid-Universal] Using the base "Formatter.date" requires "params.outputFormat" defined and was not found in your column "${columnDef.id}".`
      );
    }
    return parseDateByIOFormats(columnDef, value, getInputDateFormat(columnDef), outpuDateFormat);
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
 * @param {boolean} [skipSanitization=false] - Skip sanitization (useful when export service will handle it)
 * @returns formatted string output or empty string
 */
export function exportWithFormatterWhenDefined<T = any>(
  row: number,
  col: number,
  columnDef: Column<T>,
  dataContext: T,
  grid: SlickGrid,
  exportOptions?: TextExportOption | ExcelExportOption,
  skipSanitization = false
): string {
  // an `exportCustomFormatter` always wins, otherwise use the column `formatter` only when "exportWithFormatter" is enabled
  const formatter =
    (dataContext && columnDef.exportCustomFormatter) ||
    (isExportingWithFormatter(columnDef, exportOptions) ? columnDef.formatter : undefined);
  const output = formatCellOutput(formatter || undefined, getFieldProperty(columnDef), row, col, columnDef, dataContext, grid);
  return !skipSanitization && exportOptions?.sanitizeDataExport && typeof output === 'string' ? stripTags(output) : output;
}

/**
 * Same as `exportWithFormatterWhenDefined()` but it resolves the column formatter & field once and returns a cell reader
 * that can be reused for every row of the same column, which avoids repeating that work for every exported cell.
 * @param {Object} columnDef - column definition
 * @param {Object} grid - Slick Grid object
 * @param {Object} exportOptions - Excel or Text Export Options
 * @param {boolean} [skipSanitization=false] - Skip sanitization (useful when export service will handle it)
 * @returns a function returning the formatted string output (or empty string) of a cell
 */
export function createExportCellReader<T = any>(
  columnDef: Column<T>,
  grid: SlickGrid,
  exportOptions?: TextExportOption | ExcelExportOption,
  skipSanitization = false
): ExportCellReader<T> {
  const customFormatter = columnDef.exportCustomFormatter;
  const formatter = isExportingWithFormatter(columnDef, exportOptions) ? columnDef.formatter : undefined;
  const fieldProperty = getFieldProperty(columnDef);
  const sanitize = !skipSanitization && !!exportOptions?.sanitizeDataExport;

  return (row, col, dataContext) => {
    const output = formatCellOutput((dataContext && customFormatter) || formatter, fieldProperty, row, col, columnDef, dataContext, grid);
    return sanitize && typeof output === 'string' ? stripTags(output) : output;
  };
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
export function parseFormatterWhenExist<T = any>(
  formatter: Formatter<T> | undefined,
  row: number,
  col: number,
  columnDef: Column<T>,
  dataContext: T,
  grid: SlickGrid
): string {
  return formatCellOutput(formatter, getFieldProperty(columnDef), row, col, columnDef, dataContext, grid);
}

// --
// private functions

/** find an option from the column definition "params" first, then from the grid "formatterOptions", or else return the default value */
function findOptionValue(optionName: string, params: any, formatterOptions: any, defaultValue?: any): any {
  if (params?.hasOwnProperty(optionName)) {
    return params[optionName];
  }
  return formatterOptions?.hasOwnProperty(optionName) ? formatterOptions[optionName] : defaultValue;
}

/** "exportWithFormatter" from the column definition has precedence over the one from the export options */
function isExportingWithFormatter(columnDef: Column, exportOptions?: TextExportOption | ExcelExportOption): boolean {
  return columnDef.hasOwnProperty('exportWithFormatter')
    ? !!columnDef.exportWithFormatter
    : !!(exportOptions?.hasOwnProperty('exportWithFormatter') && exportOptions.exportWithFormatter);
}

/** Formatters receive the top-level value for dotted fields (e.g. "address.city" → "address") */
function getFieldProperty(columnDef: Column): string | number {
  const fieldId = columnDef.field || columnDef.id || '';
  const dotIdx = typeof fieldId === 'string' ? fieldId.indexOf('.') : -1;
  return dotIdx > 0 ? (fieldId as string).slice(0, dotIdx) : fieldId;
}

/** execute the formatter (when defined) and return its output as a string, or else return the raw cell value */
function formatCellOutput<T>(
  formatter: Formatter<T> | undefined,
  fieldProperty: string | number,
  row: number,
  col: number,
  columnDef: Column<T>,
  dataContext: T,
  grid: SlickGrid
): string {
  const cellValue =
    dataContext && Object.prototype.hasOwnProperty.call(dataContext, fieldProperty) ? (dataContext as any)[fieldProperty] : null;
  let output: any = cellValue;

  if (typeof formatter === 'function') {
    output = formatter(row, col, cellValue, columnDef, dataContext, grid);
    // string is the most common formatter result and needs no conversion
    if (typeof output !== 'string') {
      if (!isPrimitiveOrHTML(output)) {
        output = (output as FormatterResultWithHtml).html || (output as FormatterResultWithText).text;
      }
      if (typeof output !== 'string') {
        output = getHtmlStringOutput(output);
      }
    }
  }

  // Normalize null and undefined without changing other falsy values.
  if (output == null) {
    return '';
  }

  // Empty objects become an empty string; Date values must remain intact.
  if (typeof output === 'object' && !(output instanceof Date) && isEmptyObject(output)) {
    return '';
  }

  return output as string;
}

const inputDateFormats = new Map<string, string>();

/** get the input date format of a column, cached by its field type since it's the same for every cell */
function getInputDateFormat(columnDef: Column): string {
  const inputType = columnDef?.type ?? 'date';
  let inputDateFormat = inputDateFormats.get(inputType);
  if (inputDateFormat === undefined) {
    inputDateFormat = mapTempoDateFormatWithFieldType(inputType, { withDefaultIso8601: true });
    inputDateFormats.set(inputType, inputDateFormat);
  }
  return inputDateFormat;
}

/** private function to parse a date */
function parseDateByIOFormats(columnDef: Column, value: any, inputDateFormat: string, outputDateFormat: string): string {
  const isParsingAsUtc = columnDef.params?.parseDateAsUtc ?? false;
  const d1 = tryParseDate(value, inputDateFormat);
  let outputDate = value;
  if (d1) {
    const d2 = isParsingAsUtc ? toUtcDate(d1) : d1;
    outputDate = formatDate(d2, outputDateFormat);
  }
  return outputDate;
}
