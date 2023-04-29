import type { SearchTerm } from '../enums/searchTerm.type';
import type { FilterConditionOption } from './filterConditionOption.interface';


export type FilterCondition = (options: FilterConditionOption, parsedSearchTerms?: SearchTerm | SearchTerm[]) => boolean;
