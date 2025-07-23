import type { SlickGrid } from '../core/index.js';
import type { Column, FormatterResultWithHtml, FormatterResultWithText } from './index.js';

export declare type Formatter<T = any> = (
  row: number,
  cell: number,
  value: any,
  columnDef: Column<T>,
  dataContext: T,
  grid: SlickGrid
) => string | HTMLElement | DocumentFragment | FormatterResultWithHtml | FormatterResultWithText;

/**
 * All built-in Formatters, including static and date formatters.
 */
export interface IFormatters {
  /**
   * Takes an array of complex objects converts it to a comma delimited string.
   * Requires to pass an array of "propertyNames" in the column definition the generic "params" property
   * For example, if we have an array of user objects that have the property of firstName & lastName then we need to pass in your column definition::
   * params: { propertyNames: ['firtName', 'lastName'] } => 'John Doe, Jane Doe'
   */
  arrayObjectToCsv: Formatter;

  /** Takes an array of string and converts it to a comma delimited string */
  arrayToCsv: Formatter;

  /** Displays a Material Design check icon for truthy values */
  checkmarkMaterial: Formatter;

  /**
   * Takes a complex data object and return the data under that property (for example: "user.firstName" will return the first name "John")
   * You can pass the complex structure in the "field" (field: "user.firstName") or in the "params" (labelKey: "firstName", params: { complexField: "user" }) properties.
   * For example::
   * this.columnDefs = [{ id: 'username', field: 'user.firstName', ... }]
   * OR this.columnDefs = [{ id: 'username', field: 'user', labelKey: 'firstName', params: { complexField: 'user' }, ... }]
   * OR this.columnDefs = [{ id: 'username', field: 'user', params: { complexField: 'user.firstName' }, ... }]
   */
  complex: Formatter;
  complexObject: Formatter;

  /**
   * Looks up values from the columnDefinition.params.collection property and displays the label in CSV or string format
   * @example
   * // the grid will display 'foo' and 'bar' and not 1 and 2 from your dataset
   * { params: { collection: [{ value: 1, label: 'foo'}, {value: 2, label: 'bar' }] }}
   * const dataset = [1, 2];
   */
  collection: Formatter;

  /**
   * Roughly the same as the "collectionFormatter" except that it
   * looks up values from the columnDefinition.editor.collection (instead of params) property and displays the label in CSV or string format
   * @example
   * // the grid will display 'foo' and 'bar' and not 1 and 2 from your dataset
   * { editor: { collection: [{ value: 1, label: 'foo'}, {value: 2, label: 'bar' }] }}
   * const dataset = [1, 2];
   */
  collectionEditor: Formatter;

  /**
   * Similar to "Formatters.decimal", but it allows you to provide prefixes and suffixes (currencyPrefix, currencySuffix, numberPrefix, numberSuffix)
   * So with this, it allows the user to provide dual prefixes/suffixes via the following params
   * You can pass "minDecimal", "maxDecimal", "decimalSeparator", "thousandSeparator", "numberPrefix", "currencyPrefix", "currencySuffix", and "numberSuffix" to the "params" property.
   * For example:: `{ formatter: Formatters.decimal, params: { minDecimal: 2, maxDecimal: 4, prefix: 'Price ', currencyPrefix: '€', currencySuffix: ' EUR' }}`
   * with value of 33.45 would result into: "Price €33.45 EUR"
   */
  currency: Formatter;

  /** Base Date formatter which requires the user to provide a Date Format via column `params.dateFormat` */
  date: Formatter;

  /** Takes a Date object and displays it as an ISO Date format (YYYY-MM-DD) */
  dateIso: Formatter;

  /** Takes a Date object and displays it as an ISO Date+Time format (YYYY-MM-DD HH:mm:ss) */
  dateTimeIso: Formatter;

  /** Takes a Date object and displays it as an ISO Date+Time (without seconds) format (YYYY-MM-DD HH:mm) */
  dateTimeShortIso: Formatter;

  /** Takes a Date object and displays it as an ISO Date+Time+(am/pm) format (YYYY-MM-DD h:mm:ss a) */
  dateTimeIsoAmPm: Formatter;

  /** Takes a Date object and displays it as an ISO Date+Time+(AM/PM) format (YYYY-MM-DD hh:mm:ss A) */
  dateTimeIsoAM_PM: Formatter;

  /** Takes a Date object and displays it as an Euro Date format (DD/MM/YYYY) */
  dateEuro: Formatter;

  /** Takes a Date object and displays it as an Euro Date format (D/M/YY) */
  dateEuroShort: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time format (DD/MM/YYYY HH:mm:ss) */
  dateTimeEuro: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time format (D/M/YY H:m:s) */
  dateTimeEuroShort: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time (without seconds) format (DD/MM/YYYY HH:mm) */
  dateTimeShortEuro: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time+(am/pm) format (DD/MM/YYYY hh:mm:ss a) */
  dateTimeEuroAmPm: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time+(AM/PM) format (DD/MM/YYYY hh:mm:ss A) */
  dateTimeEuroAM_PM: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time+(am/pm) format (D/M/YY h:m:s a) */
  dateTimeEuroShortAmPm: Formatter;

  /** Takes a Date object and displays it as an Euro Date+Time+(am/pm) format (D/M/YY h:m:s A) */
  dateTimeEuroShortAM_PM: Formatter;

  /** Takes a Date object and displays it as an US Date format (MM/DD/YYYY) */
  dateUs: Formatter;

  /** Takes a Date object and displays it as an US Date+Time format (MM/DD/YYYY HH:mm:ss) */
  dateTimeUs: Formatter;

  /** Takes a Date object and displays it as an US Date+Time (without seconds) format (MM/DD/YYYY HH:mm:ss) */
  dateTimeShortUs: Formatter;

  /** Takes a Date object and displays it as an US Date+Time+(am/pm) format (MM/DD/YYYY hh:mm:ss a) */
  dateTimeUsAmPm: Formatter;

  /** Takes a Date object and displays it as an US Date+Time+(AM/PM) format (MM/DD/YYYY hh:mm:ss A) */
  dateTimeUsAM_PM: Formatter;

  /** Takes a Date object and displays it as an US Date+Time format (M/D/YY H:m:s) */
  dateTimeUsShort: Formatter;

  /** Takes a Date object and displays it as an US Date+Time+(am/pm) format (M/D/YY h:m:s a) */
  dateTimeUsShortAmPm: Formatter;

  /** Takes a Date object and displays it as an US Date+Time+(AM/PM) format (M/D/YY h:m:s A) */
  dateTimeUsShortAM_PM: Formatter;

  /** Takes a Date object and displays it as an US Date format (M/D/YY) */
  dateUsShort: Formatter;

  /** Takes a Date object and displays it as a regular TZ timestamp format (YYYY-MM-DDTHH:mm:ss.SSSZ) */
  dateUtc: Formatter;

  /**
   * Display the value as x decimals formatted, defaults to 2 decimals.
   * You can pass "minDecimal" and/or "maxDecimal" to the "params" property.
   * For example:: `{ formatter: Formatters.decimal, params: { minDecimal: 2, maxDecimal: 4 }}`
   */
  decimal: Formatter;

  /** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value */
  dollar: Formatter;

  /** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value */
  dollarColored: Formatter;

  /** Display the value as 2 decimals formatted with dollar sign '$' at the end of of the value, change color of text to red/green on negative/positive value, show it in bold font weight as well */
  dollarColoredBold: Formatter;

  /**
   * Takes an hyperlink cell value and transforms it into a real hyperlink, given that the value starts with 1 of these (http|ftp|https).
   * The structure will be "<a href="hyperlink">hyperlink</a>"
   *
   * You can optionally change the hyperlink text displayed by using the generic params "hyperlinkText" in the column definition
   * For example: { id: 'link', field: 'link', params: { hyperlinkText: 'Company Website' } } will display "<a href="link">Company Website</a>"
   *
   * You can also optionally provide the hyperlink URL by using the generic params "hyperlinkUrl" in the column definition
   * For example: { id: 'link', field: 'link', params: {  hyperlinkText: 'Company Website', hyperlinkUrl: 'http://www.somewhere.com' } } will display "<a href="http://www.somewhere.com">Company Website</a>"
   */
  hyperlink: Formatter;

  /** Display a decoded HTML string (e.g. "&lt;div&gt;Hello&lt;/div&gt;" => "<div>Hello</div>") */
  htmlDecode: Formatter;

  /** Display whichever icon you want (library agnostic, it could be Font-Awesome, Material or any other icons set) */
  icon: Formatter;

  /**
   * Display whichever icon but only for boolean truthy values (library agnostic, it could be Font-Awesome, Material or any other icons set)
   * Note: a value of "false", null, undefined, "1" or any number below 0 are all considered falsy and will not display the icon
   */
  iconBoolean: Formatter;

  /**
   * Takes a value display it according to a mask provided
   * e.: 1234567890 with mask "(000) 000-0000" will display "(123) 456-7890"
   */
  mask: Formatter;

  /**
   * You can pipe multiple formatters (executed in sequence), use params to pass the list of formatters.
   * Requires to pass an array of "formatters" in the column definition the generic "params" property
   * For example::
   * { field: 'title', formatter: Formatters.multiple, params: { formatters: [ Formatters.dollar, myCustomFormatter ] }
   */
  multiple: Formatter;

  /** Takes a cell value number (between 0.0-1.0) and displays a red (<50) or green (>=50) bar */
  percent: Formatter;

  /** Takes a cell value number (between 0.0-100) and displays a red (<50) or green (>=50) bar */
  percentComplete: Formatter;

  /** Takes a cell value number (between 0-100) and displays a SlickGrid custom "percent-complete-bar" a red (<30), silver (>30 & <70) or green (>=70) bar */
  percentCompleteBar: Formatter;

  /** Takes a cell value number (between 0-100) and displays SlickGrid custom "percent-complete-bar" with Text a red (<30), silver (>30 & <70) or green (>=70) bar */
  percentCompleteBarWithText: Formatter;

  /** Takes a cell value number (between 0-100) and add the "%" after the number */
  percentSymbol: Formatter;

  /** Takes a cell value number (between 0-100) and displays Bootstrap "progress-bar" a red (<30), silver (>30 & <70) or green (>=70) bar */
  progressBar: Formatter;

  /** Takes a cell value and translates it. Requires an instance of the Translate Service:: `translater: this.translate */
  translate: Formatter;

  /** Takes a translation key string and tries to translate it. Requires an instance of the Translate Service:: `translater: this.translate */
  translateBoolean: Formatter;

  /** Formatter that must be used with a Tree Data column */
  tree: Formatter;

  /**
   * Formatter that can be use to parse Tree Data totals and display totals using GroupTotalFormatters.
   * This formatter works with both regular `Formatters` or `GroupTotalFormatters`,
   * it will auto-detect if the current data context has a `__treeTotals` prop,
   * then it will use the `GroupTotalFormatters`, if not then it will try to use regular `Formatters`.
   *
   * This mean that you can provide an array of `Formatters` & `GroupTotalFormatters` and it will use the correct formatter
   * by detecting if the current data context has a `__treeTotals` prop (`GroupTotalFormatters`) or not (regular `Formatter`)
   */
  treeParseTotals: Formatter;

  /** Formatter that must be use with a Tree Data column for Exporting the data */
  treeExport: Formatter;
}
