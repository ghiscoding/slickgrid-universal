import { SlickVanillaGridBundle } from './components/slick-vanilla-grid-bundle';
import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities } from '@slickgrid-universal/common';
import { BindingService } from './services/index';

const Slicker = {
  GridBundle: SlickVanillaGridBundle,
  Aggregators,
  BindingService,
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

export { BindingService };
export { Slicker };
export { SlickVanillaGridBundle }; // just to export the interface
