import SlickgridSvelte from './components/SlickgridSvelte.svelte';
import type {
  SvelteGridEventHandlers,
  SvelteRegularEventHandler,
  SvelteSlickEventHandler,
} from './components/slickgridSvelteEvents.interface.js';
import type { SlickgridSvelteProps } from './components/slickgridSvelteProps.interface.js';
import type {
  GridOption,
  RowDetailView,
  SlickgridSvelteInstance,
  ViewModelBindableData,
  ViewModelBindableInputData,
} from './models/index.js';
import { createSveltePagination, TranslaterI18NextService, type SveltePaginationProps } from './services/index.js';
import { SlickgridConfig } from './slickgrid-config.js';

export * from '@slickgrid-universal/common';

// Export the wrapper component, public wrapper types, and Svelte integrations.
export { createSveltePagination, TranslaterI18NextService };
export type {
  GridOption,
  RowDetailView,
  SlickgridSvelteInstance,
  SlickgridSvelteProps,
  SvelteGridEventHandlers,
  SveltePaginationProps,
  SvelteRegularEventHandler,
  SvelteSlickEventHandler,
  ViewModelBindableData,
  ViewModelBindableInputData,
};
export { SlickgridSvelte, SlickgridConfig };
