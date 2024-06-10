import * as BackendUtilities from './services/backendUtility.service';
import * as Observers from './services/observers';
import * as ServiceUtilities from './services/utilities';
import * as SortUtilities from './sortComparers/sortUtilities';

import * as Utils from '@slickgrid-universal/utils';
export * from '@slickgrid-universal/utils';
export {
  // export nearly everything except the EventPubSubService because we want to force users to import from '@slickgrid-universal/event-pub-sub
  // also export BasePubSubService as alias to avoid breaking users who might already use PubSubService from common
  type BasePubSubService as PubSubService,
  EventNamingStyle,
  type EventSubscription,
  type PubSubEvent
} from '@slickgrid-universal/event-pub-sub';

// Public classes.
export * from './constants';
export * from './global-grid-options';

export * from './core/index';
export * from './enums/index';
export * from './interfaces/index';
export * from './aggregators/index';
export * from './aggregators/aggregators.index';
export * from './editors/index';
export * from './editors/editors.index';
export * from './extensions/index';
export * from './filter-conditions/index';
export * from './filter-conditions/filterConditions.index';
export * from './filters/index';
export * from './filters/filters.index';
export * from './filters/filterFactory';
export * from './formatters/index';
export * from './formatters/formatters.index';
export * from './grouping-formatters/index';
export * from './grouping-formatters/groupingFormatters.index';
export * from './sortComparers/index';
export * from './sortComparers/sortComparers.index';
export * from './services/index';
export { Enums } from './enums/enums.index';

const Utilities: any = { ...BackendUtilities, ...Observers, ...ServiceUtilities, ...SortUtilities, ...Utils, deepAssign: Utils.deepMerge };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config';

// re-export MultipleSelectOption type for convenience
// and also to avoid asking the user to install it on their side without hoisting deps
export { type MultipleSelectOption } from 'multiple-select-vanilla';