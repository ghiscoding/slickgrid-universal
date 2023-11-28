import { OptionRowData } from 'multiple-select-vanilla';
import * as DOMPurify_ from 'dompurify';
const DOMPurify = ((DOMPurify_ as any)?.['default'] ?? DOMPurify_); // patch for rollup

import type { InferDOMType, SearchTerm } from '../enums/index';
import type { Column, GridOption, HtmlElementPosition, SelectOption } from '../interfaces/index';
import type { SlickGrid } from '../core/index';
import type { TranslaterService } from './translater.service';

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
export function buildMsSelectCollectionList(type: 'editor' | 'filter', collection: any[], columnDef: Column, grid: SlickGrid, isMultiSelect = false, translaterService?: TranslaterService, searchTerms?: SearchTerm[]): { selectElement: HTMLSelectElement; dataCollection: OptionRowData[]; hasFoundSearchTerm: boolean; } {
  const columnId = columnDef?.id ?? '';
  const gridOptions = grid.getOptions();
  const columnFilterOrEditor = (type === 'editor' ? columnDef?.internalColumnEditor : columnDef?.filter) ?? {};
  const collectionOptions = columnFilterOrEditor?.collectionOptions ?? {};
  const separatorBetweenLabels = collectionOptions?.separatorBetweenTextLabels ?? '';
  const enableTranslateLabel = columnFilterOrEditor?.enableTranslateLabel ?? false;
  const isTranslateEnabled = gridOptions?.enableTranslate ?? false;
  const isRenderHtmlEnabled = columnFilterOrEditor?.enableRenderHtml ?? false;
  const sanitizedOptions = gridOptions?.sanitizerOptions ?? {};
  const labelName = columnFilterOrEditor?.customStructure?.label ?? 'label';
  const labelPrefixName = columnFilterOrEditor?.customStructure?.labelPrefix ?? 'labelPrefix';
  const labelSuffixName = columnFilterOrEditor?.customStructure?.labelSuffix ?? 'labelSuffix';
  const optionLabel = columnFilterOrEditor?.customStructure?.optionLabel ?? 'value';
  const valueName = columnFilterOrEditor?.customStructure?.value ?? 'value';

  const selectElement = createDomElement('select', { className: 'ms-filter search-filter' });
  const extraCssClasses = type === 'filter' ? ['search-filter', `filter-${columnId}`] : ['select-editor', `editor-${columnId}`];
  selectElement.classList.add(...extraCssClasses);

  selectElement.multiple = isMultiSelect;
  const dataCollection: OptionRowData[] = [];
  let hasFoundSearchTerm = false;

  // collection could be an Array of Strings OR Objects
  if (Array.isArray(collection)) {
    if (collection.every((x: any) => typeof x === 'number' || typeof x === 'string')) {
      for (const option of collection) {
        const selectOption: OptionRowData = { text: option, value: option };
        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOption.selected = (searchTerms.findIndex(term => term === option) >= 0); // when filter search term is found then select it in dropdown
        }
        dataCollection.push(selectOption);

        // if there's at least 1 Filter search term found, we will add the "filled" class for styling purposes
        // on a single select, we'll also make sure the single value is not an empty string to consider this being filled
        if ((selectOption.selected && isMultiSelect) || (selectOption.selected && !isMultiSelect && option !== '')) {
          hasFoundSearchTerm = true;
        }
      }
    } else {
      // array of objects will require a label/value pair unless a customStructure is passed
      collection.forEach((option: SelectOption) => {
        if (option === undefined || (typeof option === 'object' && option[labelName] === undefined && option.labelKey === undefined)) {
          throw new Error(`[Slickgrid-Universal] Select Filter/Editor collection with value/label (or value/labelKey when using Locale) is required to populate the Select list, for example:: { filter: model: Filters.multipleSelect, collection: [ { value: '1', label: 'One' } ]')`);
        }

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
        const selectOption: OptionRowData = { text: '', value: '' };

        // if user specifically wants to render html text, he needs to opt-in else it will be stripped out by default
        // also, the 3rd party lib will saninitze any html code unless it's encoded, so we'll do that
        if (isRenderHtmlEnabled) {
          // sanitize any unauthorized html tags like script and others
          // for the remaining allowed tags we'll permit all attributes
          optionText = sanitizeTextByAvailableSanitizer(gridOptions, optionText, sanitizedOptions);
        }
        selectOption.text = optionText;

        // html text of each select option
        let selectOptionValue = option[valueName];
        if (selectOptionValue === undefined || selectOptionValue === null) {
          selectOptionValue = '';
        }

        if (type === 'filter' && Array.isArray(searchTerms)) {
          selectOption.selected = (searchTerms.findIndex(term => `${term}` === `${option[valueName]}`) >= 0); // when filter search term is found then select it in dropdown
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
  const elmOffset = getOffset(element);

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

/**
 * Create a DOM Element with any optional attributes or properties.
 * It will only accept valid DOM element properties that `createElement` would accept.
 * For example: `createDomElement('div', { className: 'my-css-class' })`,
 * for style or dataset you need to use nested object `{ style: { display: 'none' }}
 * The last argument is to optionally append the created element to a parent container element.
 * @param {String} tagName - html tag
 * @param {Object} options - element properties
 * @param {[Element]} appendToParent - parent element to append to
 */
export function createDomElement<T extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[T]>(
  tagName: T,
  elementOptions?: null | { [P in K]: InferDOMType<HTMLElementTagNameMap[T][P]> },
  appendToParent?: Element
): HTMLElementTagNameMap[T] {
  const elm = document.createElement<T>(tagName);

  if (elementOptions) {
    Object.keys(elementOptions).forEach((elmOptionKey) => {
      if (elmOptionKey === 'innerHTML') {
        console.warn(`[Slickgrid-Universal] For better CSP (Content Security Policy) support, do not use "innerHTML" directly in "createDomElement('${tagName}', { innerHTML: 'some html'})", ` +
          `it is better as separate assignment: "const elm = createDomElement('span'); elm.innerHTML = 'some html';"`);
      }
      const elmValue = elementOptions[elmOptionKey as keyof typeof elementOptions];
      if (typeof elmValue === 'object') {
        Object.assign(elm[elmOptionKey as K] as object, elmValue);
      } else {
        elm[elmOptionKey as K] = (elementOptions as any)[elmOptionKey as keyof typeof elementOptions];
      }
    });
  }
  if (appendToParent?.appendChild) {
    appendToParent.appendChild(elm);
  }
  return elm;
}

/**
 * Loop through all properties of an object and nullify any properties that are instanceof HTMLElement,
 * if we detect an array then use recursion to go inside it and apply same logic
 * @param obj - object containing 1 or more properties with DOM Elements
 */
export function destroyAllElementProps(obj: any) {
  if (obj) {
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        destroyAllElementProps(obj[key]);
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
  while (element?.firstChild) {
    element.removeChild(element.firstChild);
  }
  return element;
}

/**
 * From a DocumentFragment, get the innerHTML or outerHTML of all child elements.
 * We can get the HTML by looping through all fragment `childNodes`
 */
export function getHTMLFromFragment(input: DocumentFragment, type: 'innerHTML' | 'outerHTML' = 'innerHTML') {
  if (input instanceof DocumentFragment) {
    return [].map.call(input.childNodes, (x: HTMLElement) => x[type]).join('');
  }
  return input;
}

/** Get offset of HTML element relative to a parent element */
export function getOffsetRelativeToParent(parentElm: HTMLElement | null, childElm: HTMLElement | null) {
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
export function getOffset(elm?: HTMLElement | null): HtmlElementPosition | undefined {
  if (!elm || !elm.getBoundingClientRect) {
    return undefined;
  }
  const box = elm.getBoundingClientRect();
  const docElem = document.documentElement;

  let top = 0;
  let left = 0;
  let bottom = 0;
  let right = 0;

  if (box?.top !== undefined && box.left !== undefined) {
    top = box.top + window.pageYOffset - docElem.clientTop;
    left = box.left + window.pageXOffset - docElem.clientLeft;
    right = box.right;
    bottom = box.bottom;
  }
  return { top, left, bottom, right };
}

export function getInnerSize(elm: HTMLElement, type: 'height' | 'width') {
  let size = 0;

  if (elm) {
    const clientSize = type === 'height' ? 'clientHeight' : 'clientWidth';
    const sides = type === 'height' ? ['top', 'bottom'] : ['left', 'right'];
    size = elm[clientSize];
    for (const side of sides) {
      const sideSize = (parseFloat(getStyleProp(elm, `padding-${side}`) || '') || 0);
      size -= sideSize;
    }
  }
  return size;
}

/** Get a DOM element style property value by calling getComputedStyle() on the element */
export function getStyleProp(elm: HTMLElement, property: string) {
  if (elm) {
    return window.getComputedStyle(elm).getPropertyValue(property);
  }
  return null;
}

export function findFirstAttribute(inputElm: Element | null | undefined, attributes: string[]): string | null {
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
 * HTML encode using a plain <div>
 * Create a in-memory div, set it's inner text(which a div can encode)
 * then grab the encoded contents back out.  The div never exists on the page.
 * @param {String} inputValue - input value to be encoded
 * @return {String}
 */
export function htmlEncode(inputValue: string): string {
  const val = typeof inputValue === 'string' ? inputValue : String(inputValue);
  const entityMap: { [char: string]: string; } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  };
  return (val || '').toString().replace(/[&<>"']/g, (s) => entityMap[s as keyof { [char: string]: string; }]);
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
export function htmlEncodeWithPadding(inputStr: string, paddingLength: number): string {
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
 * Sanitizes all HTML tags and returns just the text content
 * @input htmlString
 * @return text
 */
export function removeHtmlTags(htmlString: string): string {
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
 * @param sanitizerOptions: optional DOMPurify options when using that sanitizer
 */
export function sanitizeTextByAvailableSanitizer(gridOptions: GridOption, dirtyHtml: string, sanitizerOptions?: DOMPurify_.Config): string {
  let sanitizedText = dirtyHtml;
  if (typeof gridOptions?.sanitizer === 'function') {
    sanitizedText = gridOptions.sanitizer(dirtyHtml || '');
  } else if (typeof DOMPurify?.sanitize === 'function') {
    sanitizedText = (DOMPurify.sanitize(dirtyHtml || '', sanitizerOptions || { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }) || '').toString();
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