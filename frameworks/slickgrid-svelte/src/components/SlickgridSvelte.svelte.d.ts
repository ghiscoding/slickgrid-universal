import type { SvelteComponent } from 'svelte';
import type { SvelteGridEventHandlers } from './slickgridSvelteEvents.interface.js';
import type { SlickgridSvelteProps } from './slickgridSvelteProps.interface.js';

declare class SlickgridSvelte extends SvelteComponent<
  SlickgridSvelteProps & Omit<SvelteGridEventHandlers, 'onSvelteGridCreated'>,
  Record<string, CustomEvent<any>>,
  { header: {}; footer: {} }
> {}
export default SlickgridSvelte;
