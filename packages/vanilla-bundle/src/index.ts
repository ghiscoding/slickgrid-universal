import { VanillaGridBundle } from './vanilla-grid-bundle';
import { Editors, Formatters, Enums } from '@slickgrid-universal/common';

const Slicker = {
  GridBundle: VanillaGridBundle,
  Editors: Editors,
  Formatters: Formatters,
  Enums: Enums,
};

// expose the bundle on the global "window" object
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { Slicker };
