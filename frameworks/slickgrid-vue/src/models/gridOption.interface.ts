import type { BasePaginationModel, Column, GridOption as UniversalGridOption } from '@slickgrid-universal/common';
import type * as i18next from 'i18next';
import type { DefineComponent } from 'vue';

import type { RowDetailView } from './rowDetailView.interface.js';

export interface GridOption<C extends Column = Column> extends UniversalGridOption<C> {
  /** External Custom Pagination Component that can be provided by the user */
  customPaginationComponent?: DefineComponent<any, BasePaginationModel, any>;

  /** I18N translation service instance */
  i18n?: i18next.i18n;

  /** Row Detail View Plugin options & events (columnId, cssClass, toolTip, width) */
  rowDetailView?: RowDetailView;
}
