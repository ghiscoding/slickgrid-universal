import { uniqueArray } from '@slickgrid-universal/utils';
import type { SlickGrid } from '../core/slickGrid.js';
import { sortByFieldType } from '../sortComparers/sortUtilities.js';
import { SortDirectionNumber, type FilterMultiplePassType } from './../enums/index.js';
import type { CollectionFilterBy, CollectionSortBy, Column } from './../interfaces/index.js';
import { mapTempoDateFormatWithFieldType, tryParseDate } from './dateUtils.js';
import type { TranslaterService } from './translater.service.js';
import { getDescendantProperty, isColumnDateType } from './utilities.js';

interface ParsingDateDetails {
  columnId: number | string;
  dateFormat: string;
  queryFieldName: string;
  sourceField?: string;
  sourceFieldGetter?: Column['queryFieldNameGetterFn'];
}

export class CollectionService<T = any> {
  constructor(protected readonly translaterService?: TranslaterService | undefined) {}

  /**
   * Filter 1 or more items from a collection
   * @param collection
   * @param filterByOptions
   */
  filterCollection(
    collection: T[],
    filterByOptions: CollectionFilterBy | CollectionFilterBy[],
    filterResultBy: FilterMultiplePassType | null = 'chain'
  ): T[] {
    let filteredCollection: T[] = [];

    // when it's array, we will use the new filtered collection after every pass
    // basically if input collection has 10 items on 1st pass and 1 item is filtered out, then on 2nd pass the input collection will be 9 items
    if (Array.isArray(filterByOptions)) {
      filteredCollection = filterResultBy === 'merge' ? [] : [...collection];

      filterByOptions.forEach((filter) => {
        if (filterResultBy === 'merge') {
          const filteredPass = this.singleFilterCollection(collection, filter);
          filteredCollection = uniqueArray([...filteredCollection, ...filteredPass]);
        } else {
          filteredCollection = this.singleFilterCollection(filteredCollection, filter);
        }
      });
    } else {
      filteredCollection = this.singleFilterCollection(collection, filterByOptions);
    }

    return filteredCollection;
  }

  /** Pre-parse date items as `Date` object to improve Date Sort considerably */
  preParseByMutationDateItems(items: any[], grid: SlickGrid, preParseDateColumns: boolean | string): void {
    const parsingProps: ParsingDateDetails[] = [];
    grid.getColumns().forEach((col) => {
      // loop through all date columns only once and keep parsing info
      const parseInfo = this.getParseDateInfo(col, preParseDateColumns);
      if (parseInfo) {
        parsingProps.push(parseInfo);
      }
    });

    items.forEach((item) => {
      parsingProps.forEach(({ columnId, dateFormat, queryFieldName, sourceField, sourceFieldGetter }) => {
        this.reassignDateWhenValid(item, columnId, dateFormat, queryFieldName, sourceFieldGetter?.(item) ?? sourceField);
      });
    });
  }

  parseSingleDateItem(item: any, grid: SlickGrid, preParseDateColumns: boolean | string): void {
    if (preParseDateColumns) {
      grid.getColumns().forEach((col) => {
        // loop through all date columns only once and keep parsing info
        const parseInfo = this.getParseDateInfo(col, preParseDateColumns);
        if (parseInfo) {
          this.reassignDateWhenValid(
            item,
            col.id,
            parseInfo.dateFormat,
            parseInfo.queryFieldName,
            parseInfo.sourceFieldGetter?.(item) ?? parseInfo.sourceField
          );
        }
      });
    }
  }

  /**
   * Filter an item from a collection
   * @param collection
   * @param filterBy
   */
  singleFilterCollection(collection: T[], filterBy: CollectionFilterBy): T[] {
    let filteredCollection: T[] = [];

    if (filterBy) {
      const objectProperty = filterBy.property;
      const operator = filterBy.operator || 'EQ';
      // just check for undefined since the filter value could be null, 0, '', false etc
      const value = typeof filterBy.value === 'undefined' ? '' : filterBy.value;

      switch (operator) {
        case '=':
        case 'EQ':
          if (objectProperty) {
            filteredCollection = collection.filter((item) => item[objectProperty as keyof T] === value);
          } else {
            filteredCollection = collection.filter((item) => item === value);
          }
          break;
        case 'Contains':
        case 'CONTAINS':
          if (objectProperty) {
            filteredCollection = collection.filter((item) => item[objectProperty as keyof T]?.toString().indexOf(value.toString()) !== -1);
          } else {
            filteredCollection = collection.filter(
              (item: any) => item !== null && item !== undefined && item.toString().indexOf(value.toString()) !== -1
            );
          }
          break;
        case 'Not_Contains':
        case 'NOT_CONTAINS':
          if (objectProperty) {
            filteredCollection = collection.filter((item) => item[objectProperty as keyof T]?.toString().indexOf(value.toString()) === -1);
          } else {
            filteredCollection = collection.filter(
              (item: any) => item !== null && item !== undefined && item.toString().indexOf(value.toString()) === -1
            );
          }
          break;
        default:
          if (objectProperty) {
            filteredCollection = collection.filter((item) => item[objectProperty as keyof T] !== value);
          } else {
            filteredCollection = collection.filter((item) => item !== value);
          }
      }
    }
    return filteredCollection;
  }

  /**
   * Sort 1 or more items in a collection
   * @param column definition
   * @param collection
   * @param sortByOptions
   * @param enableTranslateLabel
   */
  sortCollection(
    columnDef: Column,
    collection: T[],
    sortByOptions: CollectionSortBy | CollectionSortBy[],
    enableTranslateLabel?: boolean
  ): T[] {
    if (enableTranslateLabel && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }

    if (!sortByOptions) {
      return [];
    }
    const isMultiSort = Array.isArray(sortByOptions);
    const sorters = isMultiSort ? sortByOptions : [sortByOptions];
    const comparers = sorters
      .filter((sortBy) => sortBy && (!isMultiSort || sortBy.property))
      .map((sortBy) => {
        const property = sortBy.property as keyof T | undefined;
        const direction = sortBy.sortDesc ? SortDirectionNumber.desc : SortDirectionNumber.asc;
        const fieldType = sortBy.fieldType ?? columnDef?.type ?? 'string';
        return (row1: T, row2: T): number => {
          const value1 = property ? row1[property] : row1;
          const value2 = property ? row2[property] : row2;
          const sortValue1 = enableTranslateLabel ? this.translaterService?.translate?.((value1 || ' ') as string) : value1;
          const sortValue2 = enableTranslateLabel ? this.translaterService?.translate?.((value2 || ' ') as string) : value2;
          return sortByFieldType(fieldType, sortValue1, sortValue2, direction, columnDef);
        };
      });
    if (comparers.length === 1) {
      return collection.sort(comparers[0]);
    }
    return collection.sort((row1: T, row2: T) => {
      for (const compare of comparers) {
        const result = compare(row1, row2);
        if (result !== SortDirectionNumber.neutral) {
          return result;
        }
      }
      return SortDirectionNumber.neutral;
    });
  }

  // --
  // protected functions
  // -------------------

  protected getParseDateInfo(col: Column, preParseDateColumns: boolean | string): ParsingDateDetails | void {
    const fieldType = col.type || 'string';
    const dateFormat = mapTempoDateFormatWithFieldType(fieldType);

    if (isColumnDateType(fieldType) && preParseDateColumns) {
      // preparsing could be a boolean (reassign and overwrite same property)
      // OR a prefix string to assign it into a new item property
      const queryFieldName = typeof preParseDateColumns === 'string' ? `${preParseDateColumns}${col.id}` : `${col.id}`;

      const sourceField = col.queryFieldSorter || col.queryField || col.field || `${col.id}`;
      return { columnId: col.id, dateFormat, queryFieldName, sourceField, sourceFieldGetter: col.queryFieldNameGetterFn };
    }
  }

  protected reassignDateWhenValid(
    item: any,
    columnId: number | string,
    dateFormat: string,
    queryFieldName: string,
    sourceField = `${columnId}`
  ): void {
    const value = sourceField.includes('.') ? getDescendantProperty(item, sourceField) : item[sourceField];
    const date = tryParseDate(value, dateFormat, false);
    if (date) {
      item[queryFieldName] = date;
    }
  }
}
