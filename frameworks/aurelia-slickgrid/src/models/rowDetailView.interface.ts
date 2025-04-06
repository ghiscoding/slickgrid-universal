import type { RowDetailView as UniversalRowDetailView } from '@slickgrid-universal/common';
import type { Constructable } from 'aurelia';

export interface RowDetailView extends UniversalRowDetailView {
  /**
   * Optionally pass your Parent Component reference to your Child Component (row detail component).
   * note:: If anyone finds a better way of passing the parent to the row detail extension, please reach out and/or create a PR
   */
  parent?: any;

  /** View Model of the preload template which shows after opening row detail & before row detail data shows up */
  preloadViewModel?: Constructable;

  /** View Model template that will be loaded once the async function finishes */
  viewModel?: Constructable;
}
