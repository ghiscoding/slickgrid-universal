import type { Column } from './column.interface.js';
import type { SearchTerm } from '../enums/searchTerm.type.js';
import type { FilterConditionOption } from './filterConditionOption.interface.js';

export type FilterCondition = (options: FilterConditionOption, parsedSearchTerms?: SearchTerm | SearchTerm[], column?: Column) => boolean;
