import { FieldType } from '../enums/fieldType.enum.js';
import type { Formatter, IFormatters } from '../interfaces/formatter.interface.js';
import { getAssociatedDateFormatter, getBaseDateFormatter } from './formatterUtilities.js';
import { getAllDateFieldTypes } from '../services/utilities.js';
import { arrayObjectToCsvFormatter } from './arrayObjectToCsvFormatter.js';
import { arrayToCsvFormatter } from './arrayToCsvFormatter.js';
import { checkmarkMaterialFormatter } from './checkmarkMaterialFormatter.js';
import { currencyFormatter } from './currencyFormatter.js';
import { collectionFormatter } from './collectionFormatter.js';
import { collectionEditorFormatter } from './collectionEditorFormatter.js';
import { complexObjectFormatter } from './complexObjectFormatter.js';
import { decimalFormatter } from './decimalFormatter.js';
import { dollarColoredBoldFormatter } from './dollarColoredBoldFormatter.js';
import { dollarColoredFormatter } from './dollarColoredFormatter.js';
import { dollarFormatter } from './dollarFormatter.js';
import { hyperlinkFormatter } from './hyperlinkFormatter.js';
import { iconBooleanFormatter } from './iconBooleanFormatter.js';
import { iconFormatter } from './iconFormatter.js';
import { maskFormatter } from './maskFormatter.js';
import { multipleFormatter } from './multipleFormatter.js';
import { percentFormatter } from './percentFormatter.js';
import { percentCompleteBarFormatter } from './percentCompleteBarFormatter.js';
import { percentCompleteBarWithTextFormatter } from './percentCompleteBarWithTextFormatter.js';
import { percentCompleteFormatter } from './percentCompleteFormatter.js';
import { percentSymbolFormatter } from './percentSymbolFormatter.js';
import { progressBarFormatter } from './progressBarFormatter.js';
import { translateFormatter } from './translateFormatter.js';
import { treeExportFormatter } from './treeExportFormatter.js';
import { treeFormatter } from './treeFormatter.js';
import { treeParseTotalsFormatter } from './treeParseTotalsFormatter.js';
import { translateBooleanFormatter } from './translateBooleanFormatter.js';

/** Provides a list of different Formatters that will change the cell value displayed in the UI */
const allFormatters: Record<string, Formatter> = {
  arrayObjectToCsv: arrayObjectToCsvFormatter,
  arrayToCsv: arrayToCsvFormatter,
  checkmarkMaterial: checkmarkMaterialFormatter,
  complex: complexObjectFormatter,
  complexObject: complexObjectFormatter,
  collection: collectionFormatter,
  collectionEditor: collectionEditorFormatter,
  currency: currencyFormatter,
  date: getBaseDateFormatter(),

  // --
  // add all the date Formatters dynamically below

  decimal: decimalFormatter,
  dollar: dollarFormatter,
  dollarColored: dollarColoredFormatter,
  dollarColoredBold: dollarColoredBoldFormatter,
  hyperlink: hyperlinkFormatter,
  icon: iconFormatter,
  iconBoolean: iconBooleanFormatter,
  mask: maskFormatter,
  multiple: multipleFormatter,
  percent: percentFormatter,
  percentComplete: percentCompleteFormatter,
  percentCompleteBar: percentCompleteBarFormatter,
  percentCompleteBarWithText: percentCompleteBarWithTextFormatter,
  percentSymbol: percentSymbolFormatter,
  progressBar: progressBarFormatter,
  translate: translateFormatter,
  translateBoolean: translateBooleanFormatter,
  tree: treeFormatter,
  treeParseTotals: treeParseTotalsFormatter,
  treeExport: treeExportFormatter,
};

// add date Formatters dynamically but exclude "FieldType.date" since that one was created above
// and it has a different implementation
getAllDateFieldTypes().forEach((dateType) => {
  const fieldType = FieldType[dateType as keyof typeof FieldType];
  if (fieldType && fieldType !== FieldType.date) {
    allFormatters[dateType] = getAssociatedDateFormatter(fieldType, dateType);
  }
});

/**
 * All available Formatters, including static and dynamically added date formatters.
 *
 * - Static: see IFormatters interface
 * - Dynamic: all date field types (see {@link getAllDateFieldTypes})
 */
export const Formatters: IFormatters = allFormatters as unknown as IFormatters;
