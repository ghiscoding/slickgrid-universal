import { executeBooleanFilterCondition } from './booleanFilterCondition';
import { executeFilterConditionTest } from './filterConditionProcesses';
import { executeCollectionSearchFilterCondition } from './collectionSearchFilterCondition';
import { executeNumberFilterCondition } from './numberFilterCondition';
import { executeStringFilterCondition } from './stringFilterCondition';
import type { FilterCondition } from '../interfaces/index';

export const FilterConditions: Record<string, FilterCondition> = {
  executeFilterConditionTest: executeFilterConditionTest as FilterCondition,
  booleanFilter: executeBooleanFilterCondition,
  collectionSearchFilter: executeCollectionSearchFilterCondition,
  numberFilter: executeNumberFilterCondition,
  stringFilter: executeStringFilterCondition,
};
