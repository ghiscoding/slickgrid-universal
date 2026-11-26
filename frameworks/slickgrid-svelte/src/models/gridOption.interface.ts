import type { BasePaginationComponent, Column, GridOption as UniversalGridOption } from '@slickgrid-universal/common';
import type { Component } from 'svelte';
import type { SveltePaginationProps } from '../services/sveltePagination.js';
import type { I18Next } from './i18next.interface.js';
import type { RowDetailView } from './rowDetailView.interface.js';

export interface GridOption<C extends Column = Column> extends UniversalGridOption<C> {
  /** External Custom Pagination Component that can be provided by the user */
  customPaginationComponent?: Component<SveltePaginationProps> | (new () => BasePaginationComponent);

  /** I18N translation service instance */
  i18n?: I18Next;

  /** Row Detail View Plugin options & events (columnId, cssClass, toolTip, width) */
  rowDetailView?: RowDetailView;
}
