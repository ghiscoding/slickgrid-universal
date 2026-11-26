import type { Column, CustomDataView, ExtensionList, Pagination } from '@slickgrid-universal/common';
import type { Component, Snippet } from 'svelte';
import type { GridOption, I18Next, SlickgridSvelteInstance } from '../models/index.js';
import type { SveltePaginationProps } from '../services/sveltePagination.js';
import type { SvelteGridEventHandlers } from './slickgridSvelteEvents.interface.js';

export interface SlickgridSvelteProps<TData = any> extends Omit<SvelteGridEventHandlers, 'onSvelteGridCreated'> {
  gridId: string;
  className?: string;
  columns?: Column<TData>[];
  options?: GridOption;
  dataset?: TData[];
  customDataView?: CustomDataView<TData>;
  datasetHierarchical?: TData[];
  paginationOptions?: Pagination;
  events?: SvelteGridEventHandlers;
  i18n?: I18Next;
  customPaginationComponent?: Component<SveltePaginationProps>;
  instances?: SlickgridSvelteInstance<TData>;
  extensions?: ExtensionList<any>;
  onSvelteGridCreated?: (instance: SlickgridSvelteInstance<TData>) => void;

  /** Content rendered above the grid */
  header?: Snippet;

  /** Content rendered below the grid (and above the pagination/custom footer) */
  footer?: Snippet;
}
