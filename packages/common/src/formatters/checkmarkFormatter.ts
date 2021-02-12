import { Formatter } from './../interfaces/index';
import { isNumber } from '../services/utilities';

/**
 * When value is filled, or if the value is a number and is bigger than 0, it will display a Font-Awesome icon (fa-check).
 * The icon will NOT be displayed when the value is any of the following ("false", false, "0", 0, -0.5, null, undefined)
 * Anything else than the condition specified will display the icon, so a text with "00123" will display the icon but "0" will not.
 * Also note that a string ("null", "undefined") will display the icon but (null, undefined) will not, so the typeof is also important
 */
export const checkmarkFormatter: Formatter = (_row, _cell, value) => {
  let isChecked = false;
  const isValidNumber = isNumber(value);

  if (isValidNumber) {
    value = +value; // convert to number before doing next condition
  }

  if (value === true || (isValidNumber && +value > 0) || (typeof value === 'string' && value.length > 0 && value.toLowerCase() !== 'false' && value !== '0')) {
    isChecked = true;
  }

  return isChecked ? `<i class="fa fa-check checkmark-icon" aria-hidden="true"></i>` : '';
};
