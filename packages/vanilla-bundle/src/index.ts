import { VanillaGridBundle } from './vanilla-grid-bundle';
import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities } from '@slickgrid-universal/common';

const Slicker = {
  GridBundle: VanillaGridBundle,
  Aggregators,
  Editors,
  Enums,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SortComparers,
  Utilities,
};

// expose the bundle on the global "window" object
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { Slicker };
