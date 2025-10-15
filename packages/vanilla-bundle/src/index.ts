import { BindingService } from '@slickgrid-universal/binding';
import {
  Aggregators,
  Editors,
  Enums,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SortComparers,
  Utilities,
} from '@slickgrid-universal/common';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickPaginationComponent } from '@slickgrid-universal/pagination-component';
import { SlickVanillaGridBundle } from './components/slick-vanilla-grid-bundle.js';

const Slicker: any = {
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
export { Aggregators, Editors, Enums, EventPubSubService, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities };
export { SlickEmptyWarningComponent, SlickPaginationComponent, SlickVanillaGridBundle }; // export the custom components & interfaces
export { Slicker };
export type * from './interfaces/index.js';
export * from './services/index.js';
