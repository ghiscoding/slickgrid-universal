import { createDomElement, isNumber } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index.js';
import { formatNumber } from './../services/utilities.js';
import { retrieveFormatterOptions } from './formatterUtilities.js';

/** Takes a cell value number (between 0.0-100) and displays a red (<50) or green (>=50) bar */
export const percentCompleteFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, gridOptions) => {
  const { minDecimal, maxDecimal, decimalSeparator, thousandSeparator, wrapNegativeNumber } = retrieveFormatterOptions(
    columnDef,
    gridOptions,
    'percent',
    'cell'
  );

  if (isNumber(value)) {
    const color = value < 50 ? 'red' : 'green';
    return createDomElement('span', {
      style: { color },
      textContent:
        value > 100
          ? '100%'
          : formatNumber(value, minDecimal, maxDecimal, wrapNegativeNumber, '', '%', decimalSeparator, thousandSeparator),
    });
  }
  return value;
};
