import { executeBooleanFilterCondition } from './booleanFilterCondition';
import { executeMappedCondition } from './executeMappedCondition';
import { executeCollectionSearchFilterCondition } from './collectionSearchFilterCondition';
import { executeNumberFilterCondition } from './numberFilterCondition';
import { executeStringFilterCondition } from './stringFilterCondition';
import { testFilterCondition } from './filterUtilities';

export const FilterConditions = {
  executeMappedCondition,
  booleanFilter: executeBooleanFilterCondition,
  collectionSearchFilter: executeCollectionSearchFilterCondition,
  numberFilter: executeNumberFilterCondition,
  stringFilter: executeStringFilterCondition,
  testFilter: testFilterCondition
};
