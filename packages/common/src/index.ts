import 'multiple-select-modified';
import * as BackendUtilities from './services/backendUtility.service';
import * as Observers from './services/observers';
import * as ServiceUtilities from './services/utilities';
import * as SortUtilities from './sortComparers/sortUtilities';
import { deepMerge as deepAssign } from './services/utilities';

// Public classes.
export * from './constants';
export * from './global-grid-options';

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

const Utilities = { ...BackendUtilities, ...Observers, ...ServiceUtilities, ...SortUtilities, deepAssign };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config';
