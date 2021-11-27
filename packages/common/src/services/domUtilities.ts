import * as DOMPurify_ from 'dompurify';
const DOMPurify = (DOMPurify_ as any)['default'] || DOMPurify_; // patch to fix rollup to work

import { InferDOMType, SearchTerm } from '../enums/index';
import { Column, GridOption, HtmlElementPosition, SelectOption, SlickGrid, } from '../interfaces/index';
import { TranslaterService } from './translater.service';
import { deepMerge } from './utilities';

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
export function buildSelectEditorOrFilterDomElement(type: 'editor' | 'filter', collection: any[], columnDef: Column, grid: SlickGrid, isMultiSelect = false, translaterService?: TranslaterService, searchTerms?: SearchTerm[]): { selectElement: HTMLSelectElement; hasFoundSearchTerm: boolean; } {
  const columnId = columnDef?.id ?? '';
  const gridOptions = grid.getOptions();
  const columnFilterOrEditor = (type === 'editor' ? columnDef?.internalColumnEditor : columnDef?.filter) ?? {};
  const collectionOptions = columnFilterOrEditor?.collectionOptions ?? {};
  const separatorBetweenLabels = collectionOptions?.separatorBetweenTextLabels ?? '';
  const enableTranslateLabel = columnFilterOrEditor?.enableTranslateLabel ?? false;
  const isTranslateEnabled = gridOptions?.enableTranslate ?? false;
  const isRenderHtmlEnabled = columnFilterOrEditor?.enableRenderHtml ?? false;
  const sanitizedOptions = gridOptions?.sanitizeHtmlOptions ?? {};
  const labelName = columnFilterOrEditor?.customStructure?.label ?? 'label';
  const labelPrefixName = columnFilterOrEditor?.customStructure?.labelPrefix ?? 'labelPrefix';
  const labelSuffixName = columnFilterOrEditor?.customStructure?.labelSuffix ?? 'labelSuffix';
  const optionLabel = columnFilterOrEditor?.customStructure?.optionLabel ?? 'value';
  const valueName = columnFilterOrEditor?.customStructure?.value ?? 'value';

  const selectElement = createDomElement('select', { className: 'ms-filter search-filter' });
  const extraCssClasses = type === 'filter' ? ['search-filter', `filter-${columnId}`] : ['select-editor', `editor-${columnId}`];
  selectElement.classList.add(...extraCssClasses);

  selectElement.multiple = isMultiSelect;

  // use an HTML Fragment for performance reason, MDN explains it well as shown below::
  // The key difference is that because the document fragment isn't part of the actual DOM's structure, changes made to the fragment don't affect the document, cause reflow, or incur any performance impact that can occur when changes are made.
  const selectOptionsFragment = document.createDocumentFragment();

  let hasFoundSearchTerm = false;

  // collection could be an Array of Strings OR Objects
  if (Array.isArray(collection)) {
    if (collection.every((x: any) => typeof x === 'string')) {
      for (const option of collection) {
        const selectOptionElm = createDomElement('option', {
          label: option, value: option, textContent: option,
        });
        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOptionElm.selected = (searchTerms.findIndex(term => term === option) >= 0); // when filter search term is found then select it in dropdown
        }
        selectOptionsFragment.appendChild(selectOptionElm);

        // if there's at least 1 Filter search term found, we will add the "filled" class for styling purposes
        // on a single select, we'll also make sure the single value is not an empty string to consider this being filled
        if ((selectOptionElm.selected && isMultiSelect) || (selectOptionElm.selected && !isMultiSelect && option !== '')) {
          hasFoundSearchTerm = true;
        }
      }
    } else {
      // array of objects will require a label/value pair unless a customStructure is passed
      collection.forEach((option: SelectOption) => {
        if (!option || (option[labelName] === undefined && option.labelKey === undefined)) {
          throw new Error(`[Slickgrid-Universal] Select Filter/Editor collection with value/label (or value/labelKey when using Locale) is required to populate the Select list, for example:: { filter: model: Filters.multipleSelect, collection: [ { value: '1', label: 'One' } ]')`);
        }
        const selectOptionElm = document.createElement('option');
        const labelKey = (option.labelKey || option[labelName]) as string;
        const labelText = ((option.labelKey || (enableTranslateLabel && translaterService)) && labelKey && isTranslateEnabled) ? translaterService?.translate(labelKey || ' ') : labelKey;
        let prefixText = option[labelPrefixName] || '';
        let suffixText = option[labelSuffixName] || '';
        let selectOptionLabel = option.hasOwnProperty(optionLabel) ? option[optionLabel] : '';
        if (selectOptionLabel?.toString) {
          selectOptionLabel = selectOptionLabel.toString().replace(/\"/g, '\''); // replace double quotes by single quotes to avoid interfering with regular html
        }

        // also translate prefix/suffix if enableTranslateLabel is true and text is a string
        prefixText = (enableTranslateLabel && translaterService && prefixText && typeof prefixText === 'string') ? translaterService.translate(prefixText || ' ') : prefixText;
        suffixText = (enableTranslateLabel && translaterService && suffixText && typeof suffixText === 'string') ? translaterService.translate(suffixText || ' ') : suffixText;
        selectOptionLabel = (enableTranslateLabel && translaterService && selectOptionLabel && typeof selectOptionLabel === 'string') ? translaterService.translate(selectOptionLabel || ' ') : selectOptionLabel;

        // add to a temp array for joining purpose and filter out empty text
        const tmpOptionArray = [prefixText, (typeof labelText === 'string' || typeof labelText === 'number') ? labelText.toString() : labelText, suffixText].filter((text) => text);
        let optionText = tmpOptionArray.join(separatorBetweenLabels);

        // if user specifically wants to render html text, he needs to opt-in else it will stripped out by default
        // also, the 3rd party lib will saninitze any html code unless it's encoded, so we'll do that
        if (isRenderHtmlEnabled) {
          // sanitize any unauthorized html tags like script and others
          // for the remaining allowed tags we'll permit all attributes
          const sanitizedText = sanitizeTextByAvailableSanitizer(gridOptions, optionText, sanitizedOptions);
          optionText = htmlEncode(sanitizedText);
          selectOptionElm.innerHTML = optionText;
        } else {
          selectOptionElm.textContent = optionText;
        }

        // html text of each select option
        let selectOptionValue = option[valueName];
        if (selectOptionValue === undefined || selectOptionValue === null) {
          selectOptionValue = '';
        }

        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOptionElm.selected = (searchTerms.findIndex(term => `${term}` === `${option[valueName]}`) >= 0); // when filter search term is found then select it in dropdown
        }
        selectOptionElm.value = `${selectOptionValue}`;
        selectOptionElm.label = `${selectOptionLabel ?? ''}`;
        selectOptionsFragment.appendChild(selectOptionElm);

        // if there's a search term, we will add the "filled" class for styling purposes
        // on a single select, we'll also make sure the single value is not an empty string to consider this being filled
        if ((selectOptionElm.selected && isMultiSelect) || (selectOptionElm.selected && !isMultiSelect && option[valueName] !== '')) {
          hasFoundSearchTerm = true;
        }
      });
    }
  }

  // last step append the HTML fragment to the final select DOM element
  selectElement.appendChild(selectOptionsFragment);

  return { selectElement, hasFoundSearchTerm };
}

/** calculate available space for each side of the DOM element */
export function calculateAvailableSpace(element: HTMLElement): { top: number; bottom: number; left: number; right: number; } {
  let bottom = 0;
  let top = 0;
  let left = 0;
  let right = 0;

  const windowHeight = window.innerHeight ?? 0;
  const windowWidth = window.innerWidth ?? 0;
  const scrollPosition = windowScrollPosition();
  const pageScrollTop = scrollPosition.top;
  const pageScrollLeft = scrollPosition.left;
  const elmOffset = getHtmlElementOffset(element);

  if (elmOffset) {
    const elementOffsetTop = elmOffset.top ?? 0;
    const elementOffsetLeft = elmOffset.left ?? 0;
    top = elementOffsetTop - pageScrollTop;
    bottom = windowHeight - (elementOffsetTop - pageScrollTop);
    left = elementOffsetLeft - pageScrollLeft;
    right = windowWidth - (elementOffsetLeft - pageScrollLeft);
  }

  return { top, bottom, left, right };
}

/** Create a DOM Element with any optional attributes or properties */
export function createDomElement<T extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[T]>(tagName: T, elementOptions?: { [P in K]: InferDOMType<HTMLElementTagNameMap[T][P]> }): HTMLElementTagNameMap[T] {
  const elm = document.createElement<T>(tagName);

  if (elementOptions) {
    Object.keys(elementOptions).forEach((elmOptionKey) => {
      const elmValue = elementOptions[elmOptionKey as keyof typeof elementOptions];
      if (typeof elmValue === 'object') {
        deepMerge(elm[elmOptionKey as K], elmValue);
      } else {
        elm[elmOptionKey as K] = (elementOptions as any)[elmOptionKey as keyof typeof elementOptions];
      }
    });
  }
  return elm;
}

/**
 * Loop through all properties of an object and nullify any properties that are instanceof HTMLElement,
 * if we detect an array then use recursion to go inside it and apply same logic
 * @param obj - object containing 1 or more properties with DOM Elements
 */
export function destroyObjectDomElementProps(obj: any) {
  if (obj) {
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        destroyObjectDomElementProps(obj[key]);
      }
      if (obj[key] instanceof HTMLElement) {
        obj[key] = null;
      }
    }
  }
}

/**
 * Empty a DOM element by removing all of its DOM element children leaving with an empty element (basically an empty shell)
 * @return {object} element - updated element
 */
export function emptyElement<T extends Element = Element>(element?: T | null): T | undefined | null {
  if (element?.firstChild) {
    while (element.firstChild) {
      if (element.lastChild) {
        element.removeChild(element.lastChild);
      }
    }
  }
  return element;
}

/** Get offset of HTML element relative to a parent element */
export function getElementOffsetRelativeToParent(parentElm: HTMLElement | null, childElm: HTMLElement | null) {
  if (!parentElm || !childElm) {
    return undefined;
  }
  const parentPos = parentElm.getBoundingClientRect();
  const childPos = childElm.getBoundingClientRect();
  return {
    top: childPos.top - parentPos.top,
    right: childPos.right - parentPos.right,
    bottom: childPos.bottom - parentPos.bottom,
    left: childPos.left - parentPos.left,
  };
}

/** Get HTML element offset with pure JS */
export function getHtmlElementOffset(element?: HTMLElement): HtmlElementPosition | undefined {
  if (!element) {
    return undefined;
  }
  const rect = element?.getBoundingClientRect?.();
  let top = 0;
  let left = 0;
  let bottom = 0;
  let right = 0;

  if (rect?.top !== undefined && rect.left !== undefined) {
    top = rect.top + window.pageYOffset;
    left = rect.left + window.pageXOffset;
    right = rect.right;
    bottom = rect.bottom;
  }
  return { top, left, bottom, right };
}

export function findFirstElementAttribute(inputElm: Element | null | undefined, attributes: string[]): string | null {
  if (inputElm) {
    for (const attribute of attributes) {
      const attrData = inputElm.getAttribute(attribute);
      if (attrData) {
        return attrData;
      }
    }
  }
  return null;
}

/**
 * Provide a width as a number or a string and find associated value in valid css style format or use default value when provided (or "auto" otherwise).
 * @param {Number|String} inputWidth - input width, could be a string or number
 * @param {Number | String} defaultValue [defaultValue=auto] - optional default value or use "auto" when nothing is provided
 * @returns {String} string output
 */
export function findWidthOrDefault(inputWidth?: number | string, defaultValue = 'auto'): string {
  return (/^[0-9]+$/i.test(`${inputWidth}`) ? `${+(inputWidth as number)}px` : inputWidth as string) || defaultValue;
}

/**
 * HTML encode using jQuery with a <div>
 * Create a in-memory div, set it's inner text(which jQuery automatically encodes)
 * then grab the encoded contents back out.  The div never exists on the page.
 */
export function htmlEncode(inputValue: string): string {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  };
  return (inputValue || '').toString().replace(/[&<>"']/g, (s) => (entityMap as any)[s]);
}

/**
 * Decode text into html entity
 * @param string text: input text
 * @param string text: output text
 */
export function htmlEntityDecode(input: string): string {
  return input.replace(/&#(\d+);/g, (_match, dec) => {
    return String.fromCharCode(dec);
  });
}

/**
 * Encode string to html special char and add html space padding defined
 * @param {string} inputStr - input string
 * @param {number} paddingLength - padding to add
 */
export function htmlEncodedStringWithPadding(inputStr: string, paddingLength: number): string {
  const inputStrLn = inputStr.length;
  let outputStr = htmlEncode(inputStr);

  if (inputStrLn < paddingLength) {
    for (let i = inputStrLn; i < paddingLength; i++) {
      outputStr += `&nbsp;`;
    }
  }
  return outputStr;
}

/**
 * Sanitize, return only the text without HTML tags
 * @input htmlString
 * @return text
 */
export function sanitizeHtmlToText(htmlString: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = htmlString;
  return temp.textContent || temp.innerText || '';
}

/**
 * Sanitize possible dirty html string (remove any potential XSS code like scripts and others), we will use 2 possible sanitizer
 * 1. optional sanitizer method defined in the grid options
 * 2. DOMPurify sanitizer (defaults)
 * @param gridOptions: grid options
 * @param dirtyHtml: dirty html string
 * @param domPurifyOptions: optional DOMPurify options when using that sanitizer
 */
export function sanitizeTextByAvailableSanitizer(gridOptions: GridOption, dirtyHtml: string, domPurifyOptions?: DOMPurify.Config): string {
  let sanitizedText = dirtyHtml;
  if (typeof gridOptions?.sanitizer === 'function') {
    sanitizedText = gridOptions.sanitizer(dirtyHtml || '');
  } else if (typeof DOMPurify?.sanitize === 'function') {
    sanitizedText = (DOMPurify.sanitize(dirtyHtml || '', domPurifyOptions || {}) || '').toString();
  }

  return sanitizedText;
}

/**
 * Get the Window Scroll top/left Position
 * @returns
 */
export function windowScrollPosition(): { left: number; top: number; } {
  return {
    left: window.pageXOffset || document.documentElement.scrollLeft || 0,
    top: window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}