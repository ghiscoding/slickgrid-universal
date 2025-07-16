import type { AnyFunction } from './models/types.js';

/**
 * Add an item to an array only when the item does not exists, when the item is an object we will be using their "id" to compare
 * @param inputArray
 * @param inputItem
 * @param itemIdPropName
 */
export function addToArrayWhenNotExists<T = any>(inputArray: T[], inputItem: T, itemIdPropName = 'id'): void {
  let arrayRowIndex = -1;
  if (inputItem && typeof inputItem === 'object' && itemIdPropName in inputItem) {
    arrayRowIndex = inputArray.findIndex((item) => item[itemIdPropName as keyof T] === inputItem[itemIdPropName as keyof T]);
  } else {
    arrayRowIndex = inputArray.findIndex((item) => item === inputItem);
  }

  if (arrayRowIndex < 0) {
    inputArray.push(inputItem);
  }
}

/**
 * Simple function that will return a string with the number of whitespaces asked, mostly used by the CSV export
 * @param {Number} nbSpaces - number of white spaces to create
 * @param {String} spaceChar - optionally provide a different character to use for the whitespace (e.g. could be override to use "&nbsp;" in html)
 */
export function addWhiteSpaces(nbSpaces: number, spaceChar = ' '): string {
  let result = '';

  for (let i = 0; i < nbSpaces; i++) {
    result += spaceChar;
  }
  return result;
}

/**
 * Remove an item from the array by its index
 * @param array input
 * @param index
 */
export function arrayRemoveItemByIndex<T>(array: T[], index: number): T[] {
  return array.filter((_el: T, i: number) => index !== i);
}

/**
 * Create an immutable clone of an array or object
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Array|Object} objectOrArray - the array or object to copy
 * @return {Array|Object} - the clone of the array or object
 */
export function deepCopy(objectOrArray: any | any[]): any | any[] {
  /**
   * Create an immutable copy of an object
   * @return {Object}
   */
  const cloneObj = () => {
    // Create new object
    const clone = {};

    // Loop through each item in the original
    // Recursively copy it's value and add to the clone
    Object.keys(objectOrArray).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(objectOrArray, key)) {
        (clone as any)[key] = deepCopy(objectOrArray[key]);
      }
    });
    return clone;
  };

  /**
   * Create an immutable copy of an array
   * @return {Array}
   */
  const cloneArr = () => objectOrArray.map((item: any) => deepCopy(item));

  // -- init --//
  // Get object type
  const type = Object.prototype.toString.call(objectOrArray).slice(8, -1).toLowerCase();

  // If an object
  if (type === 'object') {
    return cloneObj();
  }
  // If an array
  if (type === 'array') {
    return cloneArr();
  }
  // Otherwise, return it as-is
  return objectOrArray;
}

/**
 * Performs a deep merge of objects and returns new object, it does not modify the source object, objects (immutable) and merges arrays via concatenation.
 * Also, if first argument is undefined/null but next argument is an object then it will proceed and output will be an object
 * @param {Object} target - the target object — what to apply the sources' properties to, which is returned after it is modified.
 * @param {Object} sources - the source object(s) — objects containing the properties you want to apply.
 * @returns {Object} The target object.
 */
export function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  // when target is not an object but source is an object, then we'll assign as object
  target = !isObject(target) && isObject(source) ? {} : target;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((prop) => {
      if (source.hasOwnProperty(prop)) {
        if (prop in target) {
          // handling merging of two properties with equal names
          if (typeof (target as any)[prop] !== 'object') {
            (target as any)[prop] = (source as any)[prop];
          } else {
            if (typeof (source as any)[prop] !== 'object') {
              (target as any)[prop] = (source as any)[prop];
            } else {
              if ((target as any)[prop].concat && (source as any)[prop].concat) {
                // two arrays get concatenated
                (target as any)[prop] = (target as any)[prop].concat((source as any)[prop]);
              } else {
                // two objects get merged recursively
                (target as any)[prop] = deepMerge((target as any)[prop], (source as any)[prop]);
              }
            }
          }
        } else {
          // new properties get added to target
          (target as any)[prop] = (source as any)[prop];
        }
      }
    });
  }
  return deepMerge(target, ...sources);
}

/**
 * Empty an object properties by looping through them all and deleting them
 * @param obj - input object
 */
export function emptyObject(obj: any): any {
  if (isObject(obj)) {
    Object.keys(obj).forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
    });
  }
  obj = null;
  obj = {};

  return obj;
}

/**
 * Get the function details (param & body) of a function.
 * It supports regular function and also ES6 arrow functions
 * @param {Function} fn - function to analyze
 * @param {Boolean} [addReturn] - when using ES6 function as single liner, we could add the missing `return ...`
 * @returns
 */
export function getFunctionDetails(
  fn: AnyFunction,
  addReturn = true
): {
  params: string[];
  body: string;
  isAsync: boolean;
} {
  let isAsyncFn = false;

  const getFunctionBody = (func: AnyFunction) => {
    const fnStr = func.toString();
    isAsyncFn = fnStr.includes('async ');

    // when fn is one liner arrow fn returning an object in brackets e.g. `() => ({ hello: 'world' })`
    if (fnStr.replaceAll(' ', '').includes('=>({')) {
      const matches = fnStr.match(/(({.*}))/g) || [];
      return matches.length >= 1 ? `return ${matches[0]!.trimStart()}` : fnStr;
    }
    const isOneLinerArrowFn = !fnStr.includes('{') && fnStr.includes('=>');
    const body = fnStr.substring(
      fnStr.indexOf('{') + 1 || fnStr.indexOf('=>') + 2,
      fnStr.includes('}') ? fnStr.lastIndexOf('}') : fnStr.length
    );
    if (addReturn && isOneLinerArrowFn && !body.startsWith('return')) {
      return 'return ' + body.trimStart(); // add the `return ...` to the body for ES6 arrow fn
    }
    return body;
  };

  const getFunctionParams = (func: AnyFunction): string[] => {
    const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/gm;
    const ARG_NAMES = /([^\s,]+)/g;
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    return fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARG_NAMES) ?? [];
  };

  return {
    params: getFunctionParams(fn),
    body: getFunctionBody(fn),
    isAsync: isAsyncFn satisfies typeof isAsyncFn as boolean,
  };
}

/**
 * Check if an object is empty
 * @param obj - input object
 * @returns - boolean
 */
export function isEmptyObject(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }
  return Object.entries(obj).length === 0;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return <T>value !== undefined && <T>value !== null && <T>value !== '';
}

export function isDefinedNumber<T>(value: T | undefined | null): value is T {
  return <T>value !== null && !isNaN(value as any) && <T>value !== '';
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date);
}

/**
 * Simple check to detect if the value is a primitive type
 * @param val
 * @returns {boolean}
 */
export function isPrimitiveValue(val: any): boolean {
  return typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string' || val === null || val === undefined;
}

export function isPrimitiveOrHTML(val: any): boolean {
  return val instanceof HTMLElement || val instanceof DocumentFragment || isPrimitiveValue(val);
}

/**
 * Check if input value is a number, by default it won't be a strict checking
 * but optionally we could check for strict equality, for example "3" in strict mode would return False but True when non-strict.
 * @param value - input value of any type
 * @param strict - when using strict it also check for strict equality, e.g "3" in strict mode would return False but True when non-strict
 */
export function isNumber(value: any, strict = false): value is number {
  if (strict) {
    return value === null || value === undefined || typeof value === 'string' ? false : !isNaN(value);
  }
  return value === null || value === undefined || value === '' ? false : !isNaN(+value);
}

/** Check if an object is empty, it will also be considered empty when the input is null, undefined or isn't an object */
export function isObjectEmpty(obj: unknown): boolean {
  return !obj || (obj && typeof obj === 'object' && Object.keys(obj).length === 0);
}

/** Parse any input (bool, number, string) and return a boolean or False when not possible */
export function parseBoolean(input: any): boolean {
  return /(true|1)/i.test(input + '');
}

/** use `queueMicrotask()` when available, otherwise fallback to `setTimeout` for Salesforce LWC locker service */
export function queueMicrotaskOrSetTimeout(callback: () => void): void {
  try {
    queueMicrotask(callback);
  } catch {
    setTimeout(callback, 0);
  }
}

/**
 * Remove any accents from a string by normalizing it
 * @param {String} text - input text
 * @param {Boolean} shouldLowerCase - should we also lowercase the string output?
 * @returns
 */
export function removeAccentFromText(text: string, shouldLowerCase = false): string {
  const normalizedText = typeof text.normalize === 'function' ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text;
  return shouldLowerCase ? normalizedText.toLowerCase() : normalizedText;
}

/** Set the object value of deeper node from a given dot (.) notation path (e.g.: "user.firstName") */
export function setDeepValue<T = unknown>(obj: T, path: string | string[], value: any): void {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  if (path.length > 1) {
    const e = path.shift() as keyof T;
    if (obj && e !== undefined) {
      setDeepValue(
        (obj[e] =
          isDefined(obj[e]) && (Array.isArray(obj[e]) || Object.prototype.toString.call(obj[e]) === '[object Object]')
            ? obj[e]
            : ({} as any)),
        path,
        value
      );
    }
  } else if (obj && path[0]) {
    obj[path[0] as keyof T] = value;
  }
}

/**
 * Title case (or capitalize) first char of a string, for example "hello world" will become "Hello world"
 * Change the string to be title case on the complete sentence (upper case first char of each word while changing everything else to lower case)
 * @param inputStr
 * @returns string
 */
export function titleCase(inputStr: string, shouldTitleCaseEveryWords = false): string {
  if (typeof inputStr === 'string') {
    if (shouldTitleCaseEveryWords) {
      return inputStr.replace(/\w\S*/g, (outputStr) => {
        return outputStr.charAt(0).toUpperCase() + outputStr.substring(1).toLowerCase();
      });
    }
    return inputStr.charAt(0).toUpperCase() + inputStr.slice(1);
  }
  return inputStr;
}

/**
 * Converts a string to camel case (camelCase), for example "hello-world" (or "hellow world") will become "helloWorld"
 * @param inputStr the string to convert
 * @return the string in camel case
 */
export function toCamelCase(inputStr: string): string {
  if (typeof inputStr === 'string') {
    return inputStr.replace(/(?:^\w|[A-Z]|\b\w|[\s+\-_/])/g, (match: string, offset: number) => {
      // remove white space or hypens or underscores
      if (/[\s+\-_/]/.test(match)) {
        return '';
      }

      return offset === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
  return inputStr;
}

/**
 * Converts a string to kebab (hypen) case, for example "helloWorld" will become "hello-world"
 * @param str the string to convert
 * @return the string in kebab case
 */
export function toKebabCase(inputStr: string): string {
  if (typeof inputStr === 'string') {
    return toCamelCase(inputStr)
      .replace(/([A-Z])|([-_])/g, '-$1')
      .toLowerCase();
  }
  return inputStr;
}

/**
 * Converts a camelCase or kebab-case string to a sentence case, for example "helloWorld" will become "Hello World" and "hello-world" will become "Hello world"
 * @param str the string to convert
 * @return the string in kebab case
 */
export function toSentenceCase(inputStr: string): string {
  if (typeof inputStr === 'string') {
    const result = inputStr
      .replace(/([A-Z])|([-_])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim();
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  return inputStr;
}

/**
 * Converts a string from camelCase to snake_case (underscore) case
 * @param str the string to convert
 * @return the string in kebab case
 */
export function toSnakeCase(inputStr: string): string {
  if (typeof inputStr === 'string') {
    return toCamelCase(inputStr)
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase();
  }
  return inputStr;
}

/**
 * Takes an input array and makes sure the array has unique values by removing duplicates
 * @param array input with possible duplicates
 * @return array output without duplicates
 */
export function uniqueArray<T = any>(arr: T[]): T[] {
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.filter((item: T, index: number) => {
      return arr.indexOf(item) >= index;
    });
  }
  return arr;
}

/**
 * Takes an input array of objects and makes sure the array has unique object values by removing duplicates
 * it will loop through the array using a property name (or "id" when is not provided) to compare uniqueness
 * @param array input with possible duplicates
 * @param propertyName defaults to "id"
 * @return array output without duplicates
 */
export function uniqueObjectArray(arr: any[], propertyName = 'id'): any[] {
  if (Array.isArray(arr) && arr.length > 0) {
    const result = [];
    const map = new Map();

    for (const item of arr) {
      if (item && !map.has(item[propertyName])) {
        map.set(item[propertyName], true); // set any value to Map
        result.push({
          id: item[propertyName],
          name: item.name,
        });
      }
    }
    return result;
  }
  return arr;
}
