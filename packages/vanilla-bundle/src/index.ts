import { Aggregators, Editors, Enums, Filters, Formatters, GroupTotalFormatters, SortComparers, Utilities } from '@slickgrid-universal/common';
import { BindingService } from './services/index';
import { SlickEmptyWarningComponent } from './components/slick-empty-warning.component';
import { SlickCompositeEditorComponent } from './components/slick-composite-editor.component';
import { SlickVanillaGridBundle } from './components/slick-vanilla-grid-bundle';

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
export { SlickCompositeEditorComponent, SlickEmptyWarningComponent, SlickVanillaGridBundle }; // export the custom components & interfaces
export { Slicker };
export * from './interfaces/index';
export * from './services/index';
