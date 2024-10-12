import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, SlickGlobalEditorLock, SortComparers, Utilities } from '@slickgrid-universal/common';
import { BindingService } from '@slickgrid-universal/binding';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { SlickCompositeEditorComponent } from '@slickgrid-universal/composite-editor-component';
import { SlickEmptyWarningComponent } from '@slickgrid-universal/empty-warning-component';
import { SlickPaginationComponent } from '@slickgrid-universal/pagination-component';
import { VanillaForceGridBundle } from './vanilla-force-bundle.js';

const Slicker: any = {
  GridBundle: VanillaForceGridBundle,
  Aggregators,
  BindingService,
  Editors,
  Enums,
  Filters,
  Formatters,
  GroupTotalFormatters,
  SlickGlobalEditorLock,
  SortComparers,
  Utilities,
};

// expose the bundle on the global "window" object as Slicker
if (typeof window !== 'undefined') {
  (window as any).Slicker = Slicker;
}

export { BindingService };
export { Aggregators, Editors, Enums, EventPubSubService, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities };
export { SlickCompositeEditorComponent, SlickEmptyWarningComponent, SlickPaginationComponent, VanillaForceGridBundle }; // export the custom components & interfaces
export { Slicker };
