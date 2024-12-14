import type { GridOption } from '@slickgrid-universal/common';
import DOMPurify from 'dompurify';

/** Default Grid Options */
export const ExampleGridOptions: GridOption = {
  enableSorting: true,
  headerRowHeight: 45,
  rowHeight: 45,
  topPanelHeight: 30,
  sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
};
