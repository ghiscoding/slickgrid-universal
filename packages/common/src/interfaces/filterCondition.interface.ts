import { SearchTerm } from '../enums/searchTerm.type';
import { FilterConditionOption } from './filterConditionOption.interface';


export type FilterCondition = (options: FilterConditionOption, parsedSearchTerms?: SearchTerm | SearchTerm[]) => boolean;
