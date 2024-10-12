import { avgTotalsPercentageFormatter } from './avgTotalsPercentageFormatter.js';
import { avgTotalsDollarFormatter } from './avgTotalsDollarFormatter.js';
import { avgTotalsCurrencyFormatter } from './avgTotalsCurrencyFormatter.js';
import { avgTotalsFormatter } from './avgTotalsFormatter.js';
import { minTotalsFormatter } from './minTotalsFormatter.js';
import { maxTotalsFormatter } from './maxTotalsFormatter.js';
import { sumTotalsColoredFormatter } from './sumTotalsColoredFormatter.js';
import { sumTotalsCurrencyFormatter } from './sumTotalsCurrencyFormatter.js';
import { sumTotalsCurrencyColoredFormatter } from './sumTotalsCurrencyColoredFormatter.js';
import { sumTotalsDollarColoredBoldFormatter } from './sumTotalsDollarColoredBoldFormatter.js';
import { sumTotalsDollarColoredFormatter } from './sumTotalsDollarColoredFormatter.js';
import { sumTotalsDollarBoldFormatter } from './sumTotalsDollarBoldFormatter.js';
import { sumTotalsDollarFormatter } from './sumTotalsDollarFormatter.js';
import { sumTotalsFormatter } from './sumTotalsFormatter.js';
import { sumTotalsBoldFormatter } from './sumTotalsBoldFormatter.js';
import type { GroupTotalsFormatter } from '../interfaces/groupTotalsFormatter.interface.js';

/** Provides a list of different Formatters that will change the cell value displayed in the UI */
export const GroupTotalFormatters: Record<string, GroupTotalsFormatter> = {
  /**
   * Average all the column totals
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  avgTotals: avgTotalsFormatter,

  /**
   * Average all the column totals and display currency prefix/suffix via "groupFormatterCurrencyPrefix" and/or "groupFormatterCurrencySuffix"
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  avgTotalsCurrency: avgTotalsCurrencyFormatter,

  /**
   * Average all the column totals and display '$' at the end of the value
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  avgTotalsDollar: avgTotalsDollarFormatter,

  /**
   * Average all the column totals and display '%' at the end of the value
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  avgTotalsPercentage: avgTotalsPercentageFormatter,

  /**
   * Show max value of all the column totals
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  maxTotals: maxTotalsFormatter,

  /**
   * Show min value of all the column totals
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  minTotals: minTotalsFormatter,

  /**
   * Sums up all the column totals
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g.: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotals: sumTotalsFormatter,

  /**
   * Sums up all the column totals and display it in bold font weight
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsBold: sumTotalsBoldFormatter,

  /**
   * Sums up all the column totals, change color of text to red/green on negative/positive value
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsColored: sumTotalsColoredFormatter,

  /**
   * Sums up all the column totals and display currency
   * Extra options available in "params":: "groupFormatterPrefix", "groupFormatterSuffix", "groupFormatterCurrencyPrefix" and/or "groupFormatterCurrencySuffix"
   * e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsCurrency: sumTotalsCurrencyFormatter,

  /**
   * Sums up all the column totals and display currency with color of red/green text on negative/positive values
   * Extra options available in "params":: "groupFormatterPrefix", "groupFormatterSuffix", "groupFormatterCurrencyPrefix" and/or "groupFormatterCurrencySuffix"
   * e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsCurrencyColored: sumTotalsCurrencyColoredFormatter,

  /**
   * Sums up all the column totals and display dollar sign
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsDollar: sumTotalsDollarFormatter,

  /**
   * Sums up all the column totals and display dollar sign and show it in bold font weight
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsDollarBold: sumTotalsDollarBoldFormatter,

  /**
   * Sums up all the column totals, change color of text to red/green on negative/positive value
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsDollarColored: sumTotalsDollarColoredFormatter,

  /**
   * Sums up all the column totals, change color of text to red/green on negative/positive value, show it in bold font weight as well
   * Extra options available in "params":: "groupFormatterPrefix" and "groupFormatterSuffix", e.g: params: { groupFormatterPrefix: '<i>Total</i>: ', groupFormatterSuffix: '$' }
   */
  sumTotalsDollarColoredBold: sumTotalsDollarColoredBoldFormatter,
};
