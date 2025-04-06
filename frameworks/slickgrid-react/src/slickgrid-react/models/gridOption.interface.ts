import type { BasePaginationComponent, BasePaginationModel, GridOption as UniversalGridOption } from '@slickgrid-universal/common';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

import type { I18Next } from './i18next.interface.js';
import type { RowDetailView } from './rowDetailView.interface.js';

export interface GridOption extends UniversalGridOption {
  /** External Custom Pagination Component that can be provided by the user */
  customPaginationComponent?:
    | typeof BasePaginationComponent
    | (() => BasePaginationModel)
    | ForwardRefExoticComponent<any & RefAttributes<any>>;

  /** I18N translation service instance */
  i18n?: I18Next;

  /** Row Detail View Plugin options & events (columnId, cssClass, toolTip, width) */
  rowDetailView?: RowDetailView;
}
