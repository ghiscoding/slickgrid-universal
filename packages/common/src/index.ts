import 'multiple-select-adapted';

// Public classes.
export * from './constants';
export * from './global-grid-options';
export * from './enums/index';
export * from './interfaces/index';
export * from './services/index';
export * from './aggregators/index';
export * from './editors/index';
export * from './extensions/index';
export * from './filter-conditions/index';
export * from './filters/index';
export * from './filters/filterFactory';
export * from './formatters/index';
export * from './grouping-formatters/index';
export * from './sortComparers/index';

import * as Enums from './enums/index';
import * as BackendUtilities from './services/backend-utilities';
import * as ServiceUtilities from './services/utilities';
import * as SortUtilities from './sortComparers/sortUtilities';

const Utilities = { ...BackendUtilities, ...ServiceUtilities, ...SortUtilities };
export { Enums };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config';
