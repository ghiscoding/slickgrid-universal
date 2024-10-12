import * as BackendUtilities from './services/backendUtility.service.js';
import * as Observers from './services/observers.js';
import * as ServiceUtilities from './services/utilities.js';
import * as SortUtilities from './sortComparers/sortUtilities.js';

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
export * from './constants.js';
export * from './global-grid-options.js';

export * from './core/index.js';
export * from './enums/index.js';
export type * from './interfaces/index.js';
export * from './aggregators/index.js';
export * from './aggregators/aggregators.index.js';
export * from './editors/index.js';
export * from './editors/editors.index.js';
export * from './extensions/index.js';
export * from './filter-conditions/index.js';
export * from './filter-conditions/filterConditions.index.js';
export * from './filters/index.js';
export * from './filters/filters.index.js';
export * from './filters/filterFactory.js';
export * from './formatters/index.js';
export * from './formatters/formatters.index.js';
export * from './grouping-formatters/index.js';
export * from './grouping-formatters/groupingFormatters.index.js';
export * from './sortComparers/index.js';
export * from './sortComparers/sortComparers.index.js';
export * from './services/index.js';
export { Enums } from './enums/enums.index.js';

const Utilities: any = { ...BackendUtilities, ...Observers, ...ServiceUtilities, ...SortUtilities, ...Utils, deepAssign: Utils.deepMerge };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config.js';

// re-export MultipleSelectOption type for convenience
// and also to avoid asking the user to install it on their side without hoisting deps
export { type MultipleSelectOption } from 'multiple-select-vanilla';