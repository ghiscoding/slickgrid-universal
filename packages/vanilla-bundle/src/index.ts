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

// expose the bundle on the global "window" object as Slicker
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { BindingService };
export { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities };
export { SlickVanillaGridBundle }; // just to export the interface
export { Slicker };
export * from './interfaces/index';
export * from './services/index';

// re-export all Enums & Interfaces into the Vanilla Grid Bundle, so that we can import any of the models from Package/common or Vanilla Bundle
// for example, we can import Column from the Common Package OR the Vanilla-bundle Package
// import { Column } from '@slickgrid-universal/common'; OR import { Column } from '@slickgrid-universal/vanilla-bundle';
export * from '@slickgrid-universal/common/dist/commonjs/enums/index';
export * from '@slickgrid-universal/common/dist/commonjs/interfaces/index';
