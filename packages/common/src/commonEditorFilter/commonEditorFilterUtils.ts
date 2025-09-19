import { format } from '@formkit/tempo';
import { deepCopy, isObject } from '@slickgrid-universal/utils';
import type { AutocompleteItem } from 'autocompleter';
import { Calendar, type FormatDateString, type Options, type Range } from 'vanilla-calendar-pro';

import { FieldType } from '../enums/fieldType.enum.js';
import type {
  AutocompleterOption,
  CollectionFilterBy,
  CollectionOption,
  CollectionSortBy,
  Column,
  ColumnEditor,
  ColumnFilter,
} from '../interfaces/index.js';
import { formatDateByFieldType, mapTempoDateFormatWithFieldType, tryParseDate } from '../services/dateUtils.js';
import { getDescendantProperty } from '../services/utilities.js';
import type { CollectionService } from '../services/collection.service.js';
import { OperatorType } from '../enums/operatorType.enum.js';
import type { FilterConditionOption, GridOption, OperatorString, SearchColumnFilter, SearchTerm } from '../index.js';

type ParsedFilterCondition = Omit<FilterConditionOption, 'cellValue'> & {
  /**
   * plain and unnormalized search value which is extracted from the final searchTerm which may have an operator, e.g. `searchTerm: '>'` => { operator: '>', searchValue: undefined }`.
   * This can differ from `searchTerms` since that one will be normalized to empty string as in `searchTerms: ['']`
   */
  plainSearchValue: SearchTerm | undefined;
};

/**
 * Extract and parse an input search filter details (searchTerms, operator) and also detect which field type will be used and other relevant details
 * that we can pre-parse once (on grid load) and use these details and avoids re-evaluating these details while filtering the data itself.
 * For example a CompoundDate Filter will be parsed as a Date object and an input with the text "John*" will be analyzed as `{ operator: StartsWith, searchTerms: ['John'] }`
 * @param inputSearchTerms - filter search terms
 * @param columnFilter - column filter object (the object properties represent each column id and the value is the filter metadata)
 * @returns FilterConditionOption
 */
export function parseFormInputFilterConditions(
  inputSearchTerms: SearchTerm[] | undefined,
  columnFilter: Omit<SearchColumnFilter, 'searchTerms'>,
  gridOptions: GridOption
): ParsedFilterCondition {
  const searchValues: SearchTerm[] = deepCopy(inputSearchTerms) || [];
  let fieldSearchValue = Array.isArray(searchValues) && searchValues.length === 1 ? searchValues[0] : '';
  const columnDef = columnFilter.columnDef;
  const fieldType = columnDef.filter?.type ?? columnDef.type ?? FieldType.string;

  let matches = null;
  if (fieldType !== FieldType.object) {
    fieldSearchValue = fieldSearchValue === undefined || fieldSearchValue === null ? '' : `${fieldSearchValue}`; // make sure it's a string

    // run regex to find possible filter operators unless the user disabled the feature
    const autoParseInputFilterOperator = columnDef.autoParseInputFilterOperator ?? gridOptions.autoParseInputFilterOperator;

    // group (2): comboStartsWith, (3): comboEndsWith, (4): Operator, (1 or 5): searchValue, (6): last char is '*' (meaning starts with, ex.: abc*)
    matches =
      autoParseInputFilterOperator !== false
        ? fieldSearchValue.match(/^((.*[^\\*\r\n])[*]{1}(.*[^*\r\n]))|^([<>!=*]{0,2})(.*[^<>!=*])?([*])*$/) || []
        : [fieldSearchValue, '', '', '', '', fieldSearchValue, ''];
  }

  const comboStartsWith = matches?.[2] || '';
  const comboEndsWith = matches?.[3] || '';
  let operator = matches?.[4] || columnFilter.operator;
  let searchTerm = matches?.[1] || matches?.[5];
  const inputLastChar = matches?.[6] || (operator === '*z' ? '*' : '');

  if (typeof fieldSearchValue === 'string') {
    fieldSearchValue = fieldSearchValue.replace(`'`, `''`); // escape any single quotes by doubling them
    if (comboStartsWith && comboEndsWith) {
      searchTerm = fieldSearchValue;
      operator = OperatorType.startsWithEndsWith;
    } else if (operator === '*' || operator === '*z') {
      operator = OperatorType.endsWith;
    } else if (operator === 'a*' || inputLastChar === '*') {
      operator = OperatorType.startsWith;
    }
  }
  const realSearchTerm = searchTerm;
  searchTerm ??= '';

  // if search value has a regex match we will only keep the value without the operator
  // in this case we need to overwrite the returned search values to truncate operator from the string search
  if (Array.isArray(matches) && matches.length >= 1 && Array.isArray(searchValues) && searchValues.length === 1) {
    // string starts with a whitespace we'll trim only the first whitespace char
    // e.g. " " becomes "" and " slick grid " becomes "slick grid " (notice last whitespace is kept)
    searchValues[0] = (searchTerm.length > 0 && searchTerm.substring(0, 1) === ' ' ? searchTerm.substring(1) : searchTerm) as string;
  }

  return {
    dataKey: columnDef.dataKey,
    fieldType,
    plainSearchValue: realSearchTerm,
    searchTerms: searchValues || [],
    operator: operator as OperatorString,
    searchInputLastChar: inputLastChar,
    filterSearchType: columnDef.filterSearchType,
    defaultFilterRangeOperator: gridOptions.defaultFilterRangeOperator!,
  };
}

/**
 * add loading class ".slick-autocomplete-loading" to the Kraaden Autocomplete input element
 * by overriding the original user's fetch method.
 * We will add the loading class when the fetch starts and later remove it when the update callback is being called.
 * @param inputElm - autocomplete input element
 * @param autocompleterOptions - autocomplete settings
 */
export function addAutocompleteLoadingByOverridingFetch<T extends AutocompleteItem>(
  inputElm: HTMLInputElement,
  autocompleterOptions: Partial<AutocompleterOption<T>>
): void {
  const previousFetch = autocompleterOptions.fetch;

  if (previousFetch) {
    autocompleterOptions.fetch = (searchTerm, updateCallback, trigger, cursorPos) => {
      // add loading class
      inputElm.classList.add('slick-autocomplete-loading');

      const previousCallback = updateCallback;
      const newUpdateCallback = (items: T[] | false) => {
        previousCallback(items);
        // we're done, time to remove loading class
        inputElm.classList.remove('slick-autocomplete-loading');
      };
      // call original fetch implementation
      previousFetch!(searchTerm, newUpdateCallback, trigger, cursorPos);
    };
  }
}

/**
 * When enabled, get the collection from an object when `collectionInsideObjectProperty` is enabled
 * @param {*} collection
 * @param {ColumnFilter} columnFilterOrEditor
 * @returns {Array}
 */
export function getCollectionFromObjectWhenEnabled<T = any>(collection: T, columnFilterOrEditor?: ColumnEditor | ColumnFilter): T {
  const collectionOptions = columnFilterOrEditor?.collectionOptions ?? {};
  if (!Array.isArray(collection) && collectionOptions?.collectionInsideObjectProperty && isObject(collection)) {
    const collectionInsideObjectProperty = collectionOptions.collectionInsideObjectProperty;
    collection = getDescendantProperty(collection, collectionInsideObjectProperty || '');
  }
  return collection;
}

export function resetDatePicker(pickerInstance: Calendar): void {
  const today = new Date();
  pickerInstance.selectedDates = [];
  pickerInstance.selectedMonth = today.getMonth() as Range<12>;
  pickerInstance.selectedYear = today.getFullYear();
  const dateInputElm = pickerInstance.context.inputElement;
  if (dateInputElm) {
    dateInputElm.value = '';
  }
  pickerInstance.update();
}

/** Create a blank entry for Select Editor/Filter that can be added to the collection. It will also reuse the same collection structure provided by the user */
export function createBlankSelectEntry(labelName: string, valueName: string, labelPrefixName?: string, labelSuffixName?: string): any {
  const blankEntry = {
    [labelName]: '',
    [valueName]: '',
  };
  if (labelPrefixName) {
    blankEntry[labelPrefixName] = '';
  }
  if (labelSuffixName) {
    blankEntry[labelSuffixName] = '';
  }
  return blankEntry;
}

export function setPickerDates(
  colEditorOrFilter: ColumnEditor | ColumnFilter,
  dateInputElm: HTMLInputElement,
  pickerInstance: Options | Calendar,
  options: {
    oldVal?: Date | string | Array<Date | string> | undefined;
    newVal: Date | string | Array<Date | string> | undefined;
    columnDef: Column;
    updatePickerUI?: boolean;
    selectedSettings?: Pick<Options, 'selectedDates' | 'selectedMonth' | 'selectedTime' | 'selectedYear'>;
  }
): void {
  const { oldVal, newVal, columnDef, selectedSettings, updatePickerUI } = options;

  if (oldVal !== newVal) {
    const inputFieldType = colEditorOrFilter.type || columnDef.type;
    const outputFieldType = columnDef.outputType || colEditorOrFilter.type || columnDef.type || FieldType.dateUtc;
    const newDates = Array.isArray(newVal) ? newVal : [(newVal || '') as string];
    const pickerDates: Date[] = [];

    const isoFormat = mapTempoDateFormatWithFieldType(FieldType.dateIso) as string;
    const inputFormat = inputFieldType ? mapTempoDateFormatWithFieldType(inputFieldType) : undefined;
    for (const initialDate of newDates) {
      const date = initialDate instanceof Date ? initialDate : tryParseDate(initialDate, inputFormat);
      if (date) {
        pickerDates.push(date);
      }
    }

    const newSettingSelected = selectedSettings ?? {
      selectedDates: [pickerDates.map((p) => format(p, isoFormat)).join(':') as FormatDateString],
      selectedMonth: pickerDates[0]?.getMonth() as Range<12>,
      selectedYear: pickerDates[0]?.getFullYear(),
      selectedTime:
        inputFormat === 'ISO8601' || (inputFormat || '').toLowerCase().includes('h') ? format(pickerDates[0], 'HH:mm') : undefined,
    };

    if (updatePickerUI !== false && hasCalendarChanges(pickerInstance, newSettingSelected) && pickerInstance instanceof Calendar) {
      pickerInstance.selectedDates = newSettingSelected.selectedDates!;
      pickerInstance.selectedMonth = newSettingSelected.selectedMonth!;
      pickerInstance.selectedYear = newSettingSelected.selectedYear!;
      pickerInstance.selectedTime = newSettingSelected.selectedTime!;
      pickerInstance.update();
    }

    dateInputElm.value = newDates.length ? pickerDates.map((p) => formatDateByFieldType(p, undefined, outputFieldType)).join(' — ') : '';
  }

  function hasCalendarChanges(sourceObj: Partial<Options>, targetObj: Partial<Options>) {
    let isChanged = false;
    for (const selectType of ['selectedDates', 'selectedMonth', 'selectedYear', 'selectedTime']) {
      if (sourceObj[selectType as keyof Options] !== targetObj[selectType as keyof Options]) {
        isChanged = true;
      }
    }

    return isChanged;
  }
}

/** When user defines pre-filter on his Editor/Filter collection */
export function filterCollectionWithOptions<T = any>(
  inputCollection: T[],
  collectionService?: CollectionService,
  collectionFilterBy?: CollectionFilterBy | CollectionFilterBy[],
  collectionOptions?: CollectionOption
): T[] {
  if (collectionFilterBy) {
    const filterBy = collectionFilterBy;
    const filterCollectionBy = collectionOptions?.filterResultAfterEachPass || null;
    return collectionService?.filterCollection(inputCollection, filterBy, filterCollectionBy) || [];
  }
  return inputCollection;
}

/** When user defines pre-sort on his Editor/Filter collection */
export function sortCollectionWithOptions<T = any>(
  inputCollection: T[],
  columnDef: Column,
  collectionService?: CollectionService,
  collectionSortBy?: CollectionSortBy | CollectionSortBy[],
  enableTranslateLabel?: boolean
): T[] {
  if (collectionSortBy) {
    const sortBy = collectionSortBy;
    return collectionService?.sortCollection(columnDef, inputCollection, sortBy, enableTranslateLabel) || [];
  }
  return inputCollection;
}
