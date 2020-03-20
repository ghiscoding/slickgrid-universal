import { VanillaGridBundle } from './vanilla-grid-bundle';
import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, Sorters } from '@slickgrid-universal/common';

const Slicker = {
  GridBundle: VanillaGridBundle,
  Aggregators: Aggregators,
  Editors: Editors,
  Enums: Enums,
  Filters: Filters,
  Formatters: Formatters,
  GroupTotalFormatters: GroupTotalFormatters,
  Sorters: Sorters,
};

// expose the bundle on the global "window" object
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { Slicker };
