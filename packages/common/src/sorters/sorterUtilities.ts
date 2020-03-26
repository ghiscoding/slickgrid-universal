import { FieldType, SortDirectionNumber, SortDirection, SortDirectionString } from '../enums/index';
import { Column } from '../interfaces/index';
import { Sorters } from './index';
import { getAssociatedDateSorter } from './dateUtilities';
import { convertArrayHierarchicalToFlat, convertArrayFlatToHierarchical } from '../services/utilities';

export function sortByFieldType(fieldType: FieldType, value1: any, value2: any, sortDirection: number | SortDirectionNumber, sortColumn?: Column) {
  let sortResult = 0;

  switch (fieldType) {
    case FieldType.float:
    case FieldType.integer:
    case FieldType.number:
      sortResult = Sorters.numeric(value1, value2, sortDirection);
      break;
    case FieldType.date:
    case FieldType.dateIso:
    case FieldType.dateUtc:
    case FieldType.dateTime:
    case FieldType.dateTimeIso:
    case FieldType.dateTimeIsoAmPm:
    case FieldType.dateTimeIsoAM_PM:
    case FieldType.dateTimeShortIso:
    case FieldType.dateEuro:
    case FieldType.dateEuroShort:
    case FieldType.dateTimeShortEuro:
    case FieldType.dateTimeEuro:
    case FieldType.dateTimeEuroAmPm:
    case FieldType.dateTimeEuroAM_PM:
    case FieldType.dateTimeEuroShort:
    case FieldType.dateTimeEuroShortAmPm:
    case FieldType.dateTimeEuroShortAM_PM:
    case FieldType.dateUs:
    case FieldType.dateUsShort:
    case FieldType.dateTimeShortUs:
    case FieldType.dateTimeUs:
    case FieldType.dateTimeUsAmPm:
    case FieldType.dateTimeUsAM_PM:
    case FieldType.dateTimeUsShort:
    case FieldType.dateTimeUsShortAmPm:
    case FieldType.dateTimeUsShortAM_PM:
      sortResult = getAssociatedDateSorter(fieldType).call(this, value1, value2, sortDirection);
      break;
    case FieldType.object:
      sortResult = Sorters.objectString(value1, value2, sortDirection, sortColumn);
      break;
    case FieldType.string:
    default:
      sortResult = Sorters.string(value1, value2, sortDirection);
      break;
  }

  return sortResult;
}

/**
 * Take a flat array (that has hierarchical data but flatten) and sort it by given parent/child properties
 * It will sort by a given "parentPropName" and "childPropName"
 * @param flatArray
 * @param options
 */
export function sortFlatArrayByHierarchy(flatArray: any[], options?: { sortPropFieldType?: FieldType; parentPropName?: string; childPropName?: string; identifierPropName?: string; direction?: SortDirection | SortDirectionString; sortByPropName?: string; }): any[] {
  const inputArray: any[] = $.extend(true, [], flatArray); // make a deep copy of the input array to avoid modifying that array

  // step 1: convert array to a hierarchical structure so that we can sort it
  const resultFlatArray = convertArrayFlatToHierarchical(inputArray, options);

  // step 2: sort the hierarchical array
  sortHierarchicalArray(resultFlatArray, options);
  const inputHierarchicalArray: any[] = $.extend(true, [], resultFlatArray); // make a deep copy of the input array to avoid modifying that array

  // step 3: re-convert the array back to a flat structure and return it
  const resultSortedFlatDataset = convertArrayHierarchicalToFlat(inputHierarchicalArray, options);

  return resultSortedFlatDataset;
}

/**
 * Sort a hierarchical array (an array that has children property, that could also have children, ...)
 * It will sort by a given "parentPropName" and "childPropName"
 * @param hierarchicalArray
 * @param options
 */
export function sortHierarchicalArray(hierarchicalArray: any[], options?: { sortPropFieldType?: FieldType; parentPropName?: string; childPropName?: string; identifierPropName?: string; direction?: SortDirection | SortDirectionString; sortByPropName?: string; }): any[] {
  const childPropName = options?.childPropName || 'children';
  const sortByPropName = options?.sortByPropName || 'id';
  const fieldType = options?.sortPropFieldType || FieldType.string;

  const sortAscending = ((options?.direction || 'ASC').toUpperCase() === SortDirection.ASC);
  const sortingDirectionNumber = sortAscending ? 1 : -1;

  hierarchicalArray.sort((a: any, b: any) => sortByFieldType(fieldType, (a && a[sortByPropName]), (b && b[sortByPropName]), sortingDirectionNumber));

  for (const item of hierarchicalArray) {
    if (item && Array.isArray(item[childPropName])) {
      sortHierarchicalArray(item[childPropName], options);
    }
  }

  return hierarchicalArray;
}
