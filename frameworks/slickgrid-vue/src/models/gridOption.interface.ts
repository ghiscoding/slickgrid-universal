import type { BasePaginationModel, Column, GridOption as UniversalGridOption } from '@slickgrid-universal/common';
import type { DefineComponent } from 'vue';

import type { I18Next } from './i18next.interface.js';
import type { RowDetailView } from './rowDetailView.interface.js';

export interface GridOption<C extends Column = Column> extends UniversalGridOption<C> {
  /** External Custom Pagination Component that can be provided by the user */
  customPaginationComponent?: DefineComponent<any, BasePaginationModel, any>;

  /** I18N translation service instance */
  i18n?: I18Next;

  /** Row Detail View Plugin options & events (columnId, cssClass, toolTip, width) */
  rowDetailView?: RowDetailView;
}
