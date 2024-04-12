import type { StyleSheet } from 'excel-builder-vanilla';
import type {
  Column,
  Formatter,
  FormatterType,
  GetDataValueCallback,
  GridOption,
  SlickGrid,
} from '@slickgrid-universal/common';
import {
  Constants,
  FieldType,
  Formatters,
  getColumnFieldType,
  getValueFromParamsOrFormatterOptions,
  GroupTotalFormatters,
  retrieveFormatterOptions,
} from '@slickgrid-universal/common';
import { stripTags } from '@slickgrid-universal/utils';

export type ExcelFormatter = object & { id: number; };

// define all type of potential excel data function callbacks
export const getExcelSameInputDataCallback: GetDataValueCallback = (data) => data;
export const getExcelNumberCallback: GetDataValueCallback = (data, column, excelFormatterId, _excelSheet, gridOptions) => ({
  value: typeof data === 'string' && /\d/g.test(data) ? parseNumberWithFormatterOptions(data, column, gridOptions) : data,
  metadata: { style: excelFormatterId }
});

/** Parse a number which the user might have provided formatter options (for example a user might have provided { decimalSeparator: ',', thousandSeparator: ' '}) */
export function parseNumberWithFormatterOptions(value: any, column: Column, gridOptions: GridOption) {
  let outValue = value;
  if (typeof value === 'string' && value) {
    const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', column, gridOptions, Constants.DEFAULT_NUMBER_DECIMAL_SEPARATOR);
    const val: number | string = (decimalSeparator === ',')
      ? parseFloat(value.replace(/[^0-9,-]+/g, '').replace(',', '.'))
      : parseFloat(value.replace(/[^\d.-]/g, ''));
    outValue = isNaN(val) ? value : val;
  }
  return outValue;
}

/** use different Excel Stylesheet Format as per the Field Type */
export function useCellFormatByFieldType(stylesheet: StyleSheet, stylesheetFormatters: any, columnDef: Column, grid: SlickGrid, autoDetect = true) {
  const fieldType = getColumnFieldType(columnDef);
  let stylesheetFormatterId: number | undefined;
  let callback: GetDataValueCallback = getExcelSameInputDataCallback;

  if (fieldType === FieldType.number && autoDetect) {
    stylesheetFormatterId = getExcelFormatFromGridFormatter(stylesheet, stylesheetFormatters, columnDef, grid, 'cell').stylesheetFormatter.id;
    callback = getExcelNumberCallback;
  }
  return { stylesheetFormatterId, getDataValueParser: callback };
}

export function getGroupTotalValue(totals: any, columnDef: Column, groupType: string) {
  return totals?.[groupType]?.[columnDef.field] ?? 0;
}

/** Get numeric formatter options when defined or use default values (minDecimal, maxDecimal, thousandSeparator, decimalSeparator, wrapNegativeNumber) */
export function getNumericFormatterOptions(columnDef: Column, grid: SlickGrid, formatterType: FormatterType) {
  let dataType: 'currency' | 'decimal' | 'percent' | 'regular';

  if (formatterType === 'group') {
    switch (columnDef.groupTotalsFormatter) {
      case GroupTotalFormatters.avgTotalsCurrency:
      case GroupTotalFormatters.avgTotalsDollar:
      case GroupTotalFormatters.sumTotalsCurrency:
      case GroupTotalFormatters.sumTotalsCurrencyColored:
      case GroupTotalFormatters.sumTotalsDollar:
      case GroupTotalFormatters.sumTotalsDollarBold:
      case GroupTotalFormatters.sumTotalsDollarColored:
      case GroupTotalFormatters.sumTotalsDollarColoredBold:
        dataType = 'currency';
        break;
      case GroupTotalFormatters.avgTotalsPercentage:
        dataType = 'percent';
        break;
      case GroupTotalFormatters.avgTotals:
      case GroupTotalFormatters.minTotals:
      case GroupTotalFormatters.maxTotals:
      case GroupTotalFormatters.sumTotals:
      case GroupTotalFormatters.sumTotalsColored:
      case GroupTotalFormatters.sumTotalsBold:
      default:
        // side note, formatters are using "regular" without any decimal limits (min, max),
        // however in Excel export with custom format that doesn't work so well, we should use "decimal" to at least show optional decimals with "##"
        dataType = 'decimal';
        break;
    }
  } else {
    // when formatter is a Formatter.multiple, we need to loop through each of its formatter to find the best numeric data type
    if (columnDef.formatter === Formatters.multiple && Array.isArray(columnDef.params?.formatters)) {
      dataType = 'decimal';
      for (const formatter of columnDef.params.formatters) {
        dataType = getFormatterNumericDataType(formatter);
        if (dataType !== 'decimal') {
          break; // if we found something different than the default (decimal) then we can assume that we found our type so we can stop & return
        }
      }
    } else {
      dataType = getFormatterNumericDataType(columnDef.formatter);
    }
  }
  return retrieveFormatterOptions(columnDef, grid, dataType!, formatterType);
}

export function getFormatterNumericDataType(formatter?: Formatter) {
  let dataType: 'currency' | 'decimal' | 'percent' | 'regular';

  switch (formatter) {
    case Formatters.currency:
    case Formatters.dollar:
    case Formatters.dollarColored:
    case Formatters.dollarColoredBold:
      dataType = 'currency';
      break;
    case Formatters.percent:
    case Formatters.percentComplete:
    case Formatters.percentCompleteBar:
    case Formatters.percentCompleteBarWithText:
    case Formatters.percentSymbol:
      dataType = 'percent';
      break;
    case Formatters.decimal:
    default:
      // use "decimal" instead of "regular" to show optional decimals "##" in Excel
      dataType = 'decimal';
      break;
  }
  return dataType;
}

export function getExcelFormatFromGridFormatter(stylesheet: StyleSheet, stylesheetFormatters: any, columnDef: Column, grid: SlickGrid, formatterType: FormatterType) {
  let format = '';
  let groupType = '';
  let stylesheetFormatter: undefined | ExcelFormatter;
  const fieldType = getColumnFieldType(columnDef);

  if (formatterType === 'group') {
    switch (columnDef.groupTotalsFormatter) {
      case GroupTotalFormatters.avgTotals:
      case GroupTotalFormatters.avgTotalsCurrency:
      case GroupTotalFormatters.avgTotalsDollar:
      case GroupTotalFormatters.avgTotalsPercentage:
        groupType = 'avg';
        break;
      case GroupTotalFormatters.minTotals:
        groupType = 'min';
        break;
      case GroupTotalFormatters.maxTotals:
        groupType = 'max';
        break;
      case GroupTotalFormatters.sumTotals:
      case GroupTotalFormatters.sumTotalsBold:
      case GroupTotalFormatters.sumTotalsColored:
      case GroupTotalFormatters.sumTotalsCurrency:
      case GroupTotalFormatters.sumTotalsCurrencyColored:
      case GroupTotalFormatters.sumTotalsDollar:
      case GroupTotalFormatters.sumTotalsDollarColoredBold:
      case GroupTotalFormatters.sumTotalsDollarColored:
      case GroupTotalFormatters.sumTotalsDollarBold:
        groupType = 'sum';
        break;
      default:
        stylesheetFormatter = stylesheetFormatters.numberFormatter;
        break;
    }
  } else {
    switch (fieldType) {
      case FieldType.number:
        switch (columnDef.formatter) {
          case Formatters.multiple:
            // when formatter is a Formatter.multiple, we need to loop through each of its formatter to find the best possible Excel format
            if (Array.isArray(columnDef.params?.formatters)) {
              for (const formatter of columnDef.params.formatters) {
                const { stylesheetFormatter: stylesheetFormatterResult } = getExcelFormatFromGridFormatter(stylesheet, stylesheetFormatters, { ...columnDef, formatter } as Column, grid, formatterType);
                if (stylesheetFormatterResult !== stylesheetFormatters.numberFormatter) {
                  stylesheetFormatter = stylesheetFormatterResult;
                  break;
                }
              }
            }
            if (!stylesheetFormatter) {
              stylesheetFormatter = stylesheetFormatters.numberFormatter;
            }
            break;
          case Formatters.currency:
          case Formatters.decimal:
          case Formatters.dollar:
          case Formatters.dollarColored:
          case Formatters.dollarColoredBold:
          case Formatters.percent:
          case Formatters.percentComplete:
          case Formatters.percentCompleteBar:
          case Formatters.percentCompleteBarWithText:
          case Formatters.percentSymbol:
            format = createExcelFormatFromGridFormatter(columnDef, grid, 'cell');
            break;
          default:
            stylesheetFormatter = stylesheetFormatters.numberFormatter;
            break;
        }
        break;
    }
  }

  if (!stylesheetFormatter && (columnDef.formatter || columnDef.groupTotalsFormatter)) {
    format = createExcelFormatFromGridFormatter(columnDef, grid, formatterType, groupType);
    if (!stylesheetFormatters.hasOwnProperty(format)) {
      stylesheetFormatters[format] = stylesheet.createFormat({ format }); // save new formatter with its format as a prop key
    }
    stylesheetFormatter = stylesheetFormatters[format] as ExcelFormatter;
  }
  return { stylesheetFormatter: stylesheetFormatter as ExcelFormatter, groupType };
}

// --
// private functions
// ------------------

function createFormatFromNumber(formattedVal: string) {
  // full number syntax can have up to 7 sections, for example::
  // Total: ($10,420.55 USD) Expensed
  const [
    _,
    prefix,
    openBraquet,
    symbolPrefix,
    number,
    symbolSuffix,
    closingBraquet,
    suffix
  ] = formattedVal?.match(/^([^\d(-]*)([(]?)([^\d]*)([-]?[\w]]?[\d\s]*[.,\d]*[\d]*[^)\s%]?)([^\d.,)]*)([)]?)([^\d]*)$/i) || [];

  // we use 1 so that they won't be removed when rounding numbers, however Excel uses 0 and # symbol
  // replace 1's by 0's (required numbers) and replace 2's by "#" (optional numbers)
  const replacedNumber = (number || '').replace(/1/g, '0').replace(/[2]/g, '#');

  const format = [
    escapeQuotes(prefix ?? ''),
    openBraquet ?? '',
    escapeQuotes(symbolPrefix ?? ''),
    replacedNumber,
    escapeQuotes(symbolSuffix ?? ''),
    closingBraquet ?? '',
    escapeQuotes(suffix ?? '')
  ].join('');
  return format.replace(',', ',');
}

function createExcelFormatFromGridFormatter(columnDef: Column, grid: SlickGrid, formatterType: FormatterType, groupType = '') {
  let outputFormat = '';
  let positiveFormat = '';
  let negativeFormat = '';
  const { minDecimal, maxDecimal, thousandSeparator } = getNumericFormatterOptions(columnDef, grid, formatterType);
  const leftInteger = thousandSeparator ? '2220' : '0';
  const testingNo = parseFloat(`${leftInteger}.${excelTestingDecimalNumberPadding(minDecimal, maxDecimal)}`);

  if (formatterType === 'group' && columnDef.groupTotalsFormatter) {
    positiveFormat = stripTags(columnDef.groupTotalsFormatter({ [groupType]: { [columnDef.field]: testingNo } }, columnDef, grid));
    negativeFormat = stripTags(columnDef.groupTotalsFormatter({ [groupType]: { [columnDef.field]: -testingNo } }, columnDef, grid));
  } else if (columnDef.formatter) {
    positiveFormat = stripTags(columnDef.formatter(0, 0, testingNo, columnDef, {}, grid) as string);
    negativeFormat = stripTags(columnDef.formatter(0, 0, -testingNo, columnDef, {}, grid) as string);
  }
  if (positiveFormat && negativeFormat) {
    outputFormat = createFormatFromNumber(positiveFormat) + ';' + createFormatFromNumber(negativeFormat);
  }
  return outputFormat;
}

function escapeQuotes(val: string) {
  return val ? `"${val}"` : val;
}

/** Get number format for a number cell, for example { minDecimal: 2, maxDecimal: 5 } will return "00###" */
function excelTestingDecimalNumberPadding(minDecimal: number, maxDecimal: number) {
  return textPadding('1', minDecimal) + textPadding('2', maxDecimal - minDecimal);
}

function textPadding(numberStr: string, count: number): string {
  let output = '';
  for (let i = 0; i < count; i++) {
    output += numberStr;
  }
  return output;
}