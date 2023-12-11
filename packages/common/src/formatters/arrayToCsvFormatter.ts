import { createDomElement } from '@slickgrid-universal/utils';

import type { Formatter } from './../interfaces/index';

/** Takes an array of string and converts it to a comma delimited string */
export const arrayToCsvFormatter: Formatter = (_row, _cell, value) => {
  if (Array.isArray(value) && value.length > 0) {
    const values = value.join(', ');
    return createDomElement('span', { title: values, textContent: values });
  }
  return value;
};
