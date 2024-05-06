import { format } from '@formkit/tempo';
import type { AutocompleteItem } from 'autocompleter';
import type { IOptions } from 'vanilla-calendar-picker';

import type { AutocompleterOption, Column, ColumnEditor, ColumnFilter } from '../interfaces/index';
import { FieldType } from '../enums';
import { formatDateByFieldType, mapTempoDateFormatWithFieldType, tryParseDate } from '../services/dateUtils';

/**
 * add loading class ".slick-autocomplete-loading" to the Kraaden Autocomplete input element
 * by overriding the original user's fetch method.
 * We will add the loading class when the fetch starts and later remove it when the update callback is being called.
 * @param inputElm - autocomplete input element
 * @param autocompleterOptions - autocomplete settings
 */
export function addAutocompleteLoadingByOverridingFetch<T extends AutocompleteItem>(inputElm: HTMLInputElement, autocompleterOptions: Partial<AutocompleterOption<T>>) {
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

export function setPickerDates(dateInputElm: HTMLInputElement, pickerOptions: IOptions, dateValues: Date | Date[] | string | string[] | undefined, columnDef: Column, colEditorOrFilter: ColumnEditor | ColumnFilter) {
  const currentDateOrDates = dateValues;
  const outputFieldType = columnDef.outputType || colEditorOrFilter.type || columnDef.type || FieldType.dateUtc;
  const inputFieldType = colEditorOrFilter.type || columnDef.type;
  const isoFormat = mapTempoDateFormatWithFieldType(FieldType.dateIso) as string;
  const inputFormat = inputFieldType ? mapTempoDateFormatWithFieldType(inputFieldType) : undefined;
  const initialDates = Array.isArray(currentDateOrDates) ? currentDateOrDates : [(currentDateOrDates || '') as string];
  if (initialDates.length && initialDates[0]) {
    const pickerDates: Date[] = [];
    for (const initialDate of initialDates) {
      const date = initialDate instanceof Date ? initialDate : tryParseDate(initialDate, inputFormat);
      if (date) {
        pickerDates.push(date);
      }
    }

    if (pickerDates.length) {
      pickerOptions.settings!.selected = {
        dates: [pickerDates.map(p => format(p, isoFormat)).join(':')],
        month: pickerDates[0].getMonth(),
        year: pickerDates[0].getFullYear(),
        time: inputFormat === 'ISO8601' || (inputFormat || '').toLowerCase().includes('h') ? format(pickerDates[0], 'HH:mm') : undefined,
      };
    }
    dateInputElm.value = initialDates.length ? pickerDates.map(p => formatDateByFieldType(p, undefined, outputFieldType)).join(' — ') : '';
  }
}