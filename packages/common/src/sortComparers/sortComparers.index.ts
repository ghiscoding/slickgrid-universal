import { FieldType } from '../enums/fieldType.enum.js';
import type { ISortComparers, SortComparer } from '../interfaces/sorter.interface.js';
import { getAssociatedDateSortComparer } from './dateUtilities.js';
import { getAllDateFieldTypes } from '../services/utilities.js';
import { booleanSortComparer } from './booleanSortComparer.js';
import { numericSortComparer } from './numericSortComparer.js';
import { objectStringSortComparer } from './objectStringSortComparer.js';
import { stringSortComparer } from './stringSortComparer.js';

// export the Sort Utilities so they could be used by others
export * from './sortUtilities.js';

/**
 * Builds a map of all available SortComparers, including date comparers.
 * @returns {ISortComparers} All sort comparers, keyed by type.
 */
function buildAllSortComparers(): ISortComparers {
  const comparers: Record<string, SortComparer> = {
    boolean: booleanSortComparer,
    numeric: numericSortComparer,
    objectString: objectStringSortComparer,
    string: stringSortComparer,
  };

  // Dynamically add date comparers based on available FieldTypes, doing it this way to keep smaller bundle size
  getAllDateFieldTypes().forEach((dateType) => {
    const fieldType = FieldType[dateType as keyof typeof FieldType];
    if (fieldType) {
      comparers[dateType] = getAssociatedDateSortComparer(fieldType);
    }
  });
  return comparers as unknown as ISortComparers;
}

/**
 * All available SortComparers, including static and dynamically added date comparers.
 *
 * - Static: boolean, numeric, objectString, string
 * - Dynamic: all date field types (see {@link getAllDateFieldTypes})
 */
export const SortComparers: ISortComparers = buildAllSortComparers();
