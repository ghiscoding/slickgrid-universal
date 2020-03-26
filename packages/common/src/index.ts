import 'multiple-select-adapted/src/multiple-select.js';

// Public classes.
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
export * from './sorters/index';

import * as Enums from './enums/index';
import * as ServiceUtilities from './services/utilities';
import * as SorterUtilities from './sorters/sorterUtilities';

const Utilities = { ...ServiceUtilities, ...SorterUtilities };
export { Enums };
export { Utilities };
export { SlickgridConfig } from './slickgrid-config';
