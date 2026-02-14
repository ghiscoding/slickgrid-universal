import { GlobalGridOptions as UniversalGridOptions } from '@slickgrid-universal/common';
import type { GridOption, RowDetailView } from './models/index';

/** Global Grid Options Defaults */
export const GlobalGridOptions: Partial<GridOption> = {
  ...UniversalGridOptions,
  eventNamingStyle: 'camelCase',
  // technically speaking the Row Detail requires the process & viewComponent but we'll ignore it just to set certain options
  rowDetailView: {
    collapseAllOnSort: true,
    cssClass: 'detail-view-toggle',
    panelRows: 1,
    keyPrefix: '__',
    useRowClick: false,
    saveDetailViewOnScroll: false,
  } as RowDetailView,
};
