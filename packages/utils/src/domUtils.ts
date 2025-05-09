import type { HtmlElementPosition } from './models/interfaces.js';
import type { InferDOMType } from './models/types.js';

/** Calculate available space for each side of the DOM element */
export function calculateAvailableSpace(element: HTMLElement): { top: number; bottom: number; left: number; right: number } {
  const vh = window.innerHeight || 0;
  const vw = window.innerWidth || 0;
  const { top: pageScrollTop, left: pageScrollLeft } = windowScrollPosition();
  const { top: elementOffsetTop, left: elementOffsetLeft } = getOffset(element) || {};

  const top = elementOffsetTop - pageScrollTop;
  const left = elementOffsetLeft - pageScrollLeft;
  const bottom = vh - (elementOffsetTop - pageScrollTop + element.clientHeight);
  const right = vw - (elementOffsetLeft - pageScrollLeft + element.clientWidth);

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
        console.warn(
          `[Slickgrid-Universal] For better CSP (Content Security Policy) support, do not use "innerHTML" directly in "createDomElement('${tagName}', { innerHTML: 'some html'})", ` +
            `it is better as separate assignment: "const elm = createDomElement('span'); elm.innerHTML = 'some html';"`
        );
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
 * Accepts string containing the class or space-separated list of classes, and
 * returns list of individual classes.
 * Method properly takes into account extra whitespaces in the `className`
 * e.g.: " class1    class2   " => will result in `['class1', 'class2']`.
 * @param {String} className - space separated list of class names
 */
export function classNameToList(className = ''): string[] {
  return className.split(' ').filter((cls) => cls); // filter will remove whitespace entries
}

/**
 * Loop through all properties of an object and nullify any properties that are instanceof HTMLElement,
 * if we detect an array then use recursion to go inside it and apply same logic
 * @param obj - object containing 1 or more properties with DOM Elements
 */
export function destroyAllElementProps(obj: any): void {
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (Array.isArray(obj[key])) {
        destroyAllElementProps(obj[key]);
      }
      if (obj[key] instanceof HTMLElement) {
        obj[key] = null;
      }
    });
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
 * From any input provided, return the HTML string (when a string is provided, it will be returned "as is" but when it's a number it will be converted to string)
 * When detecting HTMLElement/DocumentFragment, we can also specify which HTML type to retrieve innerHTML or outerHTML.
 * We can get the HTML by looping through all fragment `childNodes`
 * @param {DocumentFragment | HTMLElement | string | number} input
 * @param {'innerHTML' | 'outerHTML'} [type] - when the input is a DocumentFragment or HTMLElement, which type of HTML do you want to return? 'innerHTML' or 'outerHTML'
 * @returns {String}
 */
export function getHtmlStringOutput(
  input: DocumentFragment | HTMLElement | string | number,
  type: 'innerHTML' | 'outerHTML' = 'innerHTML'
): string {
  if (input instanceof DocumentFragment) {
    // a DocumentFragment doesn't have innerHTML/outerHTML, but we can loop through all children and concatenate them all to an HTML string
    return [].map.call(input.childNodes, (x: HTMLElement) => x[type]).join('') || input.textContent || '';
  } else if (input instanceof HTMLElement) {
    return input[type];
  }
  return String(input ?? ''); // reaching this line means it's already a string (or number) so just return it as string
}

/** Get offset of HTML element relative to a parent element */
export function getOffsetRelativeToParent(
  parentElm: HTMLElement | null,
  childElm: HTMLElement | null
):
  | {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }
  | undefined {
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
export function getOffset(element?: HTMLElement | null): HtmlElementPosition {
  const { top, left, bottom, right } = element?.getBoundingClientRect() || { top: 0, left: 0, bottom: 0, right: 0 };
  return {
    top: top + (window.pageYOffset || 0),
    left: left + (window.pageXOffset || 0),
    bottom,
    right,
  };
}

export function getInnerSize(elm: HTMLElement, type: 'height' | 'width'): number {
  let size = 0;

  if (elm) {
    const clientSize = type === 'height' ? 'clientHeight' : 'clientWidth';
    const sides = type === 'height' ? ['top', 'bottom'] : ['left', 'right'];
    size = elm[clientSize];
    for (const side of sides) {
      const sideSize = parseFloat(getStyleProp(elm, `padding-${side}`) || '') || 0;
      size -= sideSize;
    }
  }
  return size;
}

/** Get a DOM element style property value by calling getComputedStyle() on the element */
export function getStyleProp(elm: HTMLElement, property: string): string | null {
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
export function findWidthOrDefault(inputWidth?: number | string | null, defaultValue = 'auto'): string {
  return (/^[0-9]+$/i.test(`${inputWidth}`) ? `${+(inputWidth as number)}px` : (inputWidth as string)) || defaultValue;
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
  const entityMap: { [char: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return (val || '').toString().replace(/[&<>"']/g, (s) => entityMap[s as keyof { [char: string]: string }]);
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

/** insert an HTML Element after a target Element in the DOM */
export function insertAfterElement(referenceNode: HTMLElement, newNode: HTMLElement): void {
  referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Get the Window Scroll top/left Position
 * @returns
 */
export function windowScrollPosition(): { left: number; top: number } {
  return {
    left: window.pageXOffset || document.documentElement.scrollLeft || 0,
    top: window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}
