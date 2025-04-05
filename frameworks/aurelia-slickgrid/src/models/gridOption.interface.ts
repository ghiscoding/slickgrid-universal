import type { I18N } from '@aurelia/i18n';
import type { BasePaginationComponent, Column, GridOption as UniversalGridOption } from '@slickgrid-universal/common';

import type { RowDetailView } from './rowDetailView.interface.js';

export interface GridOption<C extends Column = Column> extends UniversalGridOption<C> {
  /** External Custom Pagination Component that can be provided by the user */
  customPaginationComponent?: typeof BasePaginationComponent;

  /** I18N translation service instance */
  i18n?: I18N;

  /** Row Detail View Plugin options & events (columnId, cssClass, toolTip, width) */
  rowDetailView?: RowDetailView;
}
