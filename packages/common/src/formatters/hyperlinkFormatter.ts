import { createDomElement } from '@slickgrid-universal/utils';

import { type Formatter } from './../interfaces/index.js';

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
export const hyperlinkFormatter: Formatter = (_row, _cell, value, columnDef, _dataContext, grid) => {
  const columnParams = columnDef?.params ?? {};
  const displayedText = grid.sanitizeHtmlString(columnParams.hyperlinkText || value) as string;
  const outputLink = grid.sanitizeHtmlString(columnParams.hyperlinkUrl || value) as string;

  const matchUrl = outputLink.match(/^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&amp;:/~+#]*[\w\-@?^=%&amp;/~+#])?/i);

  if (matchUrl && Array.isArray(matchUrl) && matchUrl.length > 0) {
    return createDomElement('a', { href: matchUrl[0], textContent: displayedText });
  }

  return value;
};
