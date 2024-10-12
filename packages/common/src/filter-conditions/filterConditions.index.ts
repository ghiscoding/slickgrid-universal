import { executeBooleanFilterCondition } from './booleanFilterCondition.js';
import { executeFilterConditionTest } from './filterConditionProcesses.js';
import { executeCollectionSearchFilterCondition } from './collectionSearchFilterCondition.js';
import { executeNumberFilterCondition } from './numberFilterCondition.js';
import { executeStringFilterCondition } from './stringFilterCondition.js';
import type { FilterCondition } from '../interfaces/index.js';

export const FilterConditions: Record<string, FilterCondition> = {
  executeFilterConditionTest: executeFilterConditionTest as FilterCondition,
  booleanFilter: executeBooleanFilterCondition,
  collectionSearchFilter: executeCollectionSearchFilterCondition,
  numberFilter: executeNumberFilterCondition,
  stringFilter: executeStringFilterCondition,
};
