import { VanillaGridBundle } from './vanilla-grid-bundle';
import { Editors, Filters, Formatters, Enums } from '@slickgrid-universal/common';

const Slicker = {
  GridBundle: VanillaGridBundle,
  Editors: Editors,
  Enums: Enums,
  Filters: Filters,
  Formatters: Formatters,
};

// expose the bundle on the global "window" object
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { Slicker };
