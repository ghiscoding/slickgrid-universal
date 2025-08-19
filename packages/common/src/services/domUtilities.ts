import { createDomElement } from '@slickgrid-universal/utils';
import type { OptionRowData } from 'multiple-select-vanilla';

import type { SearchTerm } from '../enums/index.js';
import type { Column, SelectOption } from '../interfaces/index.js';
import { runOptionalHtmlSanitizer, type SlickGrid } from '../core/index.js';
import type { TranslaterService } from './translater.service.js';

/**
 * Create the HTML DOM Element for a Select Editor or Filter, this is specific to these 2 types only and the unit tests are directly under them
 * @param {String} type - type of select DOM element to build, can be either 'editor' or 'filter'
 * @param {Array<Object>} collection - array of items to build the select html options
 * @param {Array<Object>} columnDef - column definition object
 * @param {Object} grid - Slick Grid object
 * @param {Boolean} isMultiSelect - are we building a multiple select element (false means it's a single select)
 * @param {Object} translaterService - optional Translater Service
 * @param {Array<*>} searchTerms - optional array of search term (used by the "filter" type only)
 * @returns object with 2 properties for the select element & a boolean value telling us if any of the search terms were found and selected in the dropdown
 */
export function buildMsSelectCollectionList(
  type: 'editor' | 'filter',
  collection: any[],
  columnDef: Column,
  grid: SlickGrid,
  isMultiSelect = false,
  translaterService?: TranslaterService,
  searchTerms?: SearchTerm[]
): { selectElement: HTMLSelectElement; dataCollection: OptionRowData[]; hasFoundSearchTerm: boolean } {
  const columnId = columnDef?.id ?? '';
  const gridOptions = grid.getOptions();
  const columnFilterOrEditor = (type === 'editor' ? columnDef?.editor : columnDef?.filter) ?? {};
  const collectionOptions = columnFilterOrEditor?.collectionOptions ?? {};
  const separatorBetweenLabels = collectionOptions?.separatorBetweenTextLabels ?? '';
  const enableTranslateLabel = columnFilterOrEditor?.enableTranslateLabel ?? false;
  const isTranslateEnabled = gridOptions?.enableTranslate ?? false;
  const isRenderHtmlEnabled = columnFilterOrEditor?.enableRenderHtml ?? false;
  const labelName = columnFilterOrEditor?.customStructure?.label ?? 'label';
  const labelPrefixName = columnFilterOrEditor?.customStructure?.labelPrefix ?? 'labelPrefix';
  const labelSuffixName = columnFilterOrEditor?.customStructure?.labelSuffix ?? 'labelSuffix';
  const optionLabel = columnFilterOrEditor?.customStructure?.optionLabel ?? 'value';
  const valueName = columnFilterOrEditor?.customStructure?.value ?? 'value';

  const selectElement = createDomElement('select', { className: 'ms-filter' });
  const extraCssClasses = type === 'filter' ? ['search-filter', `filter-${columnId}`] : ['select-editor', `editor-${columnId}`];
  selectElement.classList.add(...extraCssClasses);
  selectElement.multiple = isMultiSelect;

  // collection could be an Array of Strings OR Objects
  const dataCollection: OptionRowData[] = [];
  let hasFoundSearchTerm = false;
  if (Array.isArray(collection)) {
    if (collection.every((x: any) => typeof x === 'number' || typeof x === 'string')) {
      collection.forEach((option) => {
        const selectOption: OptionRowData = { text: String(option), value: option };
        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOption.selected = searchTerms.findIndex((term) => term === option) >= 0; // when filter search term is found then select it in dropdown
        }
        dataCollection.push(selectOption);

        // if there's at least 1 Filter search term found, we will add the "filled" class for styling purposes
        // on a single select, we'll also make sure the single value is not an empty string to consider this being filled
        if ((selectOption.selected && isMultiSelect) || (selectOption.selected && !isMultiSelect && option !== '')) {
          hasFoundSearchTerm = true;
        }
      });
    } else {
      // array of objects will require a label/value pair unless a customStructure is passed
      collection.forEach((option: SelectOption) => {
        if (option === undefined || (typeof option === 'object' && option[labelName] === undefined && option.labelKey === undefined)) {
          throw new Error(
            `[Slickgrid-Universal] Select Filter/Editor collection with value/label (or value/labelKey when using Locale) is required to populate the Select list, for example:: { filter: model: Filters.multipleSelect, collection: [ { value: '1', label: 'One' } ]')`
          );
        }

        const labelKey = (option.labelKey || option[labelName]) as string;
        const labelText =
          (option.labelKey || (enableTranslateLabel && translaterService)) && labelKey && isTranslateEnabled
            ? translaterService?.translate(labelKey || ' ')
            : labelKey;
        let prefixText = option[labelPrefixName] || '';
        let suffixText = option[labelSuffixName] || '';
        let selectOptionLabel = option.hasOwnProperty(optionLabel) ? option[optionLabel] : '';
        if (selectOptionLabel?.toString) {
          selectOptionLabel = selectOptionLabel.toString().replace(/"/g, "'"); // replace double quotes by single quotes to avoid interfering with regular html
        }

        // also translate prefix/suffix if enableTranslateLabel is true and text is a string
        prefixText = translateWhenEnabled(prefixText, enableTranslateLabel, translaterService);
        suffixText = translateWhenEnabled(suffixText, enableTranslateLabel, translaterService);
        selectOptionLabel = translateWhenEnabled(selectOptionLabel, enableTranslateLabel, translaterService);

        // add to a temp array for joining purpose and filter out empty text
        const tmpOptionArray = [
          prefixText,
          typeof labelText === 'string' || typeof labelText === 'number' ? labelText.toString() : labelText,
          suffixText,
        ].filter((text) => text);
        let optionText = tmpOptionArray.join(separatorBetweenLabels);
        const selectOption: OptionRowData = { text: '', value: '' };

        // if user specifically wants to render html text, he needs to opt-in else it will be stripped out by default
        // also, the 3rd party lib will saninitze any html code unless it's encoded, so we'll do that
        if (isRenderHtmlEnabled) {
          // sanitize any unauthorized html tags like script and others
          // for the remaining allowed tags we'll permit all attributes
          optionText = runOptionalHtmlSanitizer<string>(optionText, gridOptions);
        }
        selectOption.text = optionText;

        // html text of each select option
        let selectOptionValue = option[valueName];
        if (selectOptionValue === undefined || selectOptionValue === null) {
          selectOptionValue = '';
        }

        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOption.selected = searchTerms.findIndex((term) => `${term}` === `${option[valueName]}`) >= 0; // when filter search term is found then select it in dropdown
        }
        selectOption.value = `${selectOptionValue ?? ''}`; // we'll convert every value to string for better equality checks
        dataCollection.push(selectOption);

        // if there's a search term, we will add the "filled" class for styling purposes
        // on a single select, we'll also make sure the single value is not an empty string to consider this being filled
        if ((selectOption.selected && isMultiSelect) || (selectOption.selected && !isMultiSelect && option[valueName] !== '')) {
          hasFoundSearchTerm = true;
        }
      });
    }
  }

  return { selectElement, dataCollection, hasFoundSearchTerm };
}

function translateWhenEnabled(input: string | number, enableTranslateLabel: boolean, translaterService?: TranslaterService) {
  return enableTranslateLabel && translaterService && input && typeof input === 'string'
    ? translaterService.translate(input || ' ')
    : input;
}
