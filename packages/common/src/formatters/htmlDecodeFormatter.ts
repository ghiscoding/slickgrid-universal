import { htmlDecode } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index.js';
import { createDocumentFragmentOrElement } from '../services/utilities.js';

/** Display a decoded HTML string (e.g. "&lt;div&gt;Hello&lt;/div&gt;" => "<div>Hello</div>") */
export const htmlDecodeFormatter: Formatter = (_row, _cell, value, _col, _item, grid) => {
  const decodedVal = htmlDecode(value);
  if (decodedVal) {
    const containerElm = createDocumentFragmentOrElement(grid.getOptions());
    containerElm.textContent = decodedVal; // use textContent to avoid XSS
    return { html: containerElm };
  }
  return decodedVal;
};
