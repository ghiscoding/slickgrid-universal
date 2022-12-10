import { Column, ExcelCellFormat, ExcelStylesheet, FieldType, Formatters, getValueFromParamsOrFormatterOptions, mapMomentDateFormatWithFieldType, SlickGrid } from '@slickgrid-universal/common';
import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

/** use different Excel Stylesheet Format as per the Field Type */
export function useCellFormatByFieldType(stylesheet: ExcelStylesheet, stylesheetFormatters: any, data: string | Date | moment_.Moment, columnDef: Column, grid: SlickGrid): ExcelCellFormat | string {
  const fieldType = columnDef.outputType || columnDef.type || FieldType.string;
  let outputData: ExcelCellFormat | string | Date | moment_.Moment = data;

  switch (fieldType) {
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
    case FieldType.dateTimeShortIso:
    case FieldType.dateTimeIsoAmPm:
    case FieldType.dateTimeIsoAM_PM:
    case FieldType.dateEuro:
    case FieldType.dateEuroShort:
    case FieldType.dateTimeEuro:
    case FieldType.dateTimeShortEuro:
    case FieldType.dateTimeEuroAmPm:
    case FieldType.dateTimeEuroAM_PM:
    case FieldType.dateTimeEuroShort:
    case FieldType.dateTimeEuroShortAmPm:
    case FieldType.dateUs:
    case FieldType.dateUsShort:
    case FieldType.dateTimeUs:
    case FieldType.dateTimeShortUs:
    case FieldType.dateTimeUsAmPm:
    case FieldType.dateTimeUsAM_PM:
    case FieldType.dateTimeUsShort:
    case FieldType.dateTimeUsShortAmPm:
    case FieldType.dateUtc:
    case FieldType.date:
    case FieldType.dateIso:
      outputData = data;
      if (data) {
        const defaultDateFormat = mapMomentDateFormatWithFieldType(fieldType);
        const isDateValid = moment(data as string, defaultDateFormat, false).isValid();
        const outputDate = (data && isDateValid) ? moment(data as string).format(defaultDateFormat) : data;
        if (!stylesheetFormatters.hasOwnProperty(fieldType)) {
          stylesheetFormatters[fieldType] = stylesheet.createFormat({ format: defaultDateFormat });
        }
        outputData = { value: outputDate, metadata: { style: stylesheetFormatters[fieldType].id } };
      }
      break;
    case FieldType.number:
      const num = parseFloat(data as string);
      const val = isNaN(num) ? null : +num;
      let stylesheetFormatter: object & { id: string; };

      switch (columnDef.formatter) {
        case Formatters.decimal:
        case Formatters.dollar:
        case Formatters.dollarColored:
        case Formatters.dollarColoredBold:
          stylesheetFormatter = createOrGetStylesheetFormatter(stylesheet, stylesheetFormatters, columnDef, grid);
          break;
        default:
          stylesheetFormatter = stylesheetFormatters.numberFormatter;
          break;
      }
      outputData = { value: val, metadata: { style: stylesheetFormatter.id } };
      break;
    default:
      outputData = data;
  }
  return outputData as string;
}

function createOrGetStylesheetFormatter(stylesheet: ExcelStylesheet, stylesheetFormatters: any, columnDef: Column, grid: SlickGrid) {
  const minDecimal = getValueFromParamsOrFormatterOptions('minDecimal', columnDef, grid, 2);
  const maxDecimal = getValueFromParamsOrFormatterOptions('maxDecimal', columnDef, grid, 2);
  const decimalSeparator = getValueFromParamsOrFormatterOptions('decimalSeparator', columnDef, grid, '.');
  const thousandSeparator = getValueFromParamsOrFormatterOptions('thousandSeparator', columnDef, grid, '');
  const numberPrefix = getValueFromParamsOrFormatterOptions('numberPrefix', columnDef, grid, '');
  const numberSuffix = getValueFromParamsOrFormatterOptions('numberSuffix', columnDef, grid, '');
  const displayNegativeNumberWithParentheses = getValueFromParamsOrFormatterOptions('displayNegativeNumberWithParentheses', columnDef, grid, false);
  const numberFormat = `${numberPrefix}#${thousandSeparator}##0${decimalSeparator}${excelNumberFormatPadding(minDecimal, maxDecimal)}${numberSuffix}`;
  const format = displayNegativeNumberWithParentheses ? `${numberFormat};(${numberFormat})` : numberFormat;

  if (!stylesheetFormatters.hasOwnProperty(format)) {
    stylesheetFormatters[format] = stylesheet.createFormat({ format }); // save new formatter with its format as a prop key
  }
  return stylesheetFormatters[format];
}

/** Get number format for a number cell, for example { minDecimal: 2, maxDecimal: 5 } will return "00###" */
function excelNumberFormatPadding(minDecimal: number, maxDecimal: number) {
  return textPadding('0', minDecimal) + textPadding('#', maxDecimal - minDecimal);
}

function textPadding(numberStr: string, count: number): string {
  let output = '';
  for (let i = 0; i < count; i++) {
    output += numberStr;
  }
  return output;
}