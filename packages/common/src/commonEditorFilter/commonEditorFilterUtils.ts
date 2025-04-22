import { format } from '@formkit/tempo';
import type { AutocompleteItem } from 'autocompleter';
import { dequal } from 'dequal/lite';
import type VanillaCalendar from 'vanilla-calendar-pro';
import type { IOptions, ISelected, FormatDateString } from 'vanilla-calendar-pro/types';

import { FieldType } from '../enums/fieldType.enum.js';
import type { AutocompleterOption, Column, ColumnEditor, ColumnFilter } from '../interfaces/index.js';
import { formatDateByFieldType, mapTempoDateFormatWithFieldType, tryParseDate } from '../services/dateUtils.js';
import { getDescendantProperty } from '../services/utilities.js';
import { isObject } from '@slickgrid-universal/utils';

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

export function resetDatePicker(pickerInstance: VanillaCalendar): void {
  const today = new Date();
  pickerInstance.settings.selected = {
    dates: [],
    month: today.getMonth(),
    year: today.getFullYear(),
  };
  const dateInputElm = pickerInstance.HTMLInputElement;
  if (dateInputElm) {
    dateInputElm.value = '';
  }
  pickerInstance.update({
    dates: true,
    month: true,
    year: true,
    time: true,
  });
}

export function setPickerDates(
  colEditorOrFilter: ColumnEditor | ColumnFilter,
  dateInputElm: HTMLInputElement,
  pickerInstance: IOptions | VanillaCalendar,
  options: {
    oldVal?: Date | string | Array<Date | string> | undefined;
    newVal: Date | string | Array<Date | string> | undefined;
    columnDef: Column;
    updatePickerUI?: boolean;
    selectedSettings?: ISelected;
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

    const newSettingSelected: ISelected = selectedSettings ?? {
      dates: [pickerDates.map((p) => format(p, isoFormat)).join(':') as FormatDateString],
      month: pickerDates[0]?.getMonth(),
      year: pickerDates[0]?.getFullYear(),
      time: inputFormat === 'ISO8601' || (inputFormat || '').toLowerCase().includes('h') ? format(pickerDates[0], 'HH:mm') : undefined,
    };

    if (!dequal(pickerInstance.settings!.selected, newSettingSelected)) {
      pickerInstance.settings!.selected = newSettingSelected;

      if (updatePickerUI && (pickerInstance as VanillaCalendar)?.update) {
        (pickerInstance as VanillaCalendar).update({
          dates: true,
          month: true,
          year: true,
          time: true,
        });
      }
    }

    dateInputElm.value = newDates.length ? pickerDates.map((p) => formatDateByFieldType(p, undefined, outputFieldType)).join(' — ') : '';
  }
}
