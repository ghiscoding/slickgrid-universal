import type { BasePaginationComponent } from '@slickgrid-universal/common';
import type { SvelteGridCoreInstance } from './svelteGridCoreInstance.interface.js';

/** The grid and its per-instance services, available after creation. */
export interface SlickgridSvelteInstance<TData = any> extends SvelteGridCoreInstance<TData> {
  element: HTMLDivElement;
  paginationComponent?: BasePaginationComponent;
}
