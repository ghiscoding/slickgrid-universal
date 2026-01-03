import type { RowDetailView as UniversalRowDetailView } from '@slickgrid-universal/common';
import type { DefineComponent } from 'vue';

export interface RowDetailView extends UniversalRowDetailView {
  /**
   * Optionally pass your Parent Component reference to your Child Component (row detail component).
   * note:: If anyone finds a better way of passing the parent to the row detail extension, please reach out and/or create a PR
   */
  parentRef?: any;

  /** View Model of the preload template which shows after opening row detail & before row detail data shows up */
  preloadComponent?: DefineComponent<any, any, any>;

  /** View Model template that will be loaded once the async function finishes */
  viewComponent?: DefineComponent<any, any, any, any, any, any>;
}
