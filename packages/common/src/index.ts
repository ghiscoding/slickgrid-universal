import 'multiple-select-modified';

// Public classes.
export * from './constants';
export * from './global-grid-options';
export * from './enums/index';
export * from './interfaces/index';
export * from './services/index';
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

import * as Enums from './enums/index';
import * as Interfaces from './interfaces/index';
import * as BackendUtilities from './services/backend-utilities';
import * as ServiceUtilities from './services/utilities';
import * as SortUtilities from './sortComparers/sortUtilities';

const Utilities = { ...BackendUtilities, ...ServiceUtilities, ...SortUtilities };
export { Enums, Interfaces };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config';
