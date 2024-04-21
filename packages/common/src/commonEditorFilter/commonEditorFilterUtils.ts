import { getAvailablePosition } from '@slickgrid-universal/utils';
import type { AutocompleteItem } from 'autocompleter';
import type { IVanillaCalendar, IOptions } from 'vanilla-calendar-picker';
import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_;

import type { AutocompleterOption, Column, ColumnEditor, ColumnFilter } from '../interfaces/index';
import { formatDateByFieldType, mapMomentDateFormatWithFieldType } from '../services';
import { FieldType } from '../enums';

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

export function findBestPickerPosition({ HTMLElement, HTMLInputElement }: IVanillaCalendar): 'center' | 'left' | 'right' | ['bottom' | 'top', 'center' | 'left' | 'right'] {
  let position: 'center' | 'left' | 'right' | ['bottom' | 'top', 'center' | 'left' | 'right'] = 'center';
  if (HTMLElement && HTMLInputElement) {
    const { canShow, parentPositions } = getAvailablePosition(HTMLInputElement, HTMLElement);

    if (canShow.left && canShow.right) {
      if (canShow.bottom) {
        position = 'center';
      } else if (canShow.top) {
        position = ['top', 'center'];
      }
    } else {
      if (Array.isArray(parentPositions)) {
        parentPositions[0] = (parentPositions[0] === 'bottom') ? 'top' : 'bottom';
        return parentPositions;
      }
      return parentPositions;
    }
  }

  return position;
}

export function setPickerDates(dateInputElm: HTMLInputElement, pickerOptions: IOptions, dateValues: Date | Date[] | string | string[] | undefined, columnDef: Column, colEditorOrFilter: ColumnEditor | ColumnFilter) {
  const currentDateOrDates = dateValues;
  const outputFieldType = columnDef.outputType || colEditorOrFilter.type || columnDef.type || FieldType.dateUtc;
  const inputFieldType = colEditorOrFilter.type || columnDef.type;
  const isoFormat = mapMomentDateFormatWithFieldType(FieldType.dateIso);
  const inputFormat = inputFieldType ? mapMomentDateFormatWithFieldType(inputFieldType) : '';
  const initialDates = Array.isArray(currentDateOrDates) ? currentDateOrDates : [(currentDateOrDates || '') as string];
  if (initialDates.length && initialDates[0]) {
    const pickerDates = [];
    for (const initialDate of initialDates) {
      const momentDate = moment(initialDate, inputFormat);
      pickerDates.push(momentDate);
    }

    pickerOptions.settings!.selected = {
      dates: [pickerDates.map(p => p.format(isoFormat)).join(':')],
      month: pickerDates[0].month(),
      year: pickerDates[0].year(),
      time: inputFormat.toLowerCase().includes('h') ? pickerDates[0].format('HH:mm') : null,
    };
    dateInputElm.value = initialDates.length ? pickerDates.map(p => formatDateByFieldType(p, undefined, outputFieldType)).join(' — ') : '';
  }
}