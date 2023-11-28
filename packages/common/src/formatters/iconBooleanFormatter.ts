import { createDomElement } from '../services';
import { type Formatter } from './../interfaces/index';

/** Display whichever icon for a boolean value (library agnostic, it could be Font-Awesome or any other) */
export const iconBooleanFormatter: Formatter = (_row, _cell, value, columnDef) => {
  const columnParams = columnDef?.params || {};
  const cssClasses = columnParams.cssClass;

  if (!cssClasses) {
    throw new Error('[Slickgrid-Universal] When using `Formatters.iconBoolean`, you must provide You must provide the "cssClass", e.g.: { formatter: Formatters.iconBoolean, params: { cssClass: "fa fa-check" }}');
  }

  let isTruthy = false;
  const isNumber = !isNaN(value);
  if (value === true || (isNumber && parseFloat(value) > 0) || (!isNumber && typeof value === 'string' && value.toLowerCase() !== 'false' && value !== '0')) {
    isTruthy = true;
  }

  return isTruthy ? createDomElement('i', { className: cssClasses, ariaHidden: 'true' }) : '';
};
