import { VanillaGridBundle } from './vanilla-grid-bundle';
import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, Sorters, Utilities } from '@slickgrid-universal/common';

const Slicker = {
  GridBundle: VanillaGridBundle,
  Aggregators,
  Editors,
  Enums,
  Filters,
  Formatters,
  GroupTotalFormatters,
  Sorters,
  Utilities,
};

// expose the bundle on the global "window" object
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { Slicker };
