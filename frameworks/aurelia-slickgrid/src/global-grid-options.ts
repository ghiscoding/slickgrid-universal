import { GlobalGridOptions as UniversalGridOptions } from '@slickgrid-universal/common';
import type { GridOption, RowDetailView } from './models/index.js';

/** Global Grid Options Defaults */
export const GlobalGridOptions: Partial<GridOption> = {
  ...UniversalGridOptions,
  eventNamingStyle: 'kebabCase',
  rowDetailView: {
    collapseAllOnSort: true,
    cssClass: 'detail-view-toggle',
    panelRows: 1,
    keyPrefix: '__',
    useRowClick: false,
    saveDetailViewOnScroll: false,
  } as RowDetailView,
};
