/**
 * This extend function is a reimplementation of the npm package `extend` (also named `node-extend`).
 * The reason for the reimplementation was mostly because the original project is not ESM compatible
 * and written with old ES6 IIFE syntax, the goal was to reimplement and fix these old syntax and build problems.
 * e.g. it used `var` everywhere, it used `arguments` to get function arguments, ...
 * See `jQuery.extend()` for multiple usage demos: https://api.jquery.com/jquery.extend/
 *
 * The previous lib can be found here at this Github link:
 *     https://github.com/justmoon/node-extend
 * With an MIT licence that and can be found at
 *     https://github.com/justmoon/node-extend/blob/main/LICENSE
 */

const hasOwn = Object.prototype.hasOwnProperty;
const toStr = Object.prototype.toString;
const defineProperty = Object.defineProperty;
const gOPD = Object.getOwnPropertyDescriptor;

const isArray = function isArray(arr: any) {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(arr);
  }
  /* v8 ignore next 2 */
  return toStr.call(arr) === '[object Array]';
};

const isPlainObject = function isPlainObject(obj: any) {
  if (!obj || toStr.call(obj) !== '[object Object]') {
    return false;
  }

  const hasOwnConstructor = hasOwn.call(obj, 'constructor');
  const hasIsPrototypeOf =
    obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  // Not own constructor property must be Object
  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up, if last one is own, then all properties are own.
  let key;
  for (key in obj) {
    /**/
  }

  return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
const setProperty = function setProperty(target: any, options: any) {
  if (defineProperty && options.name === '__proto__') {
    defineProperty(target, options.name, {
      enumerable: true,
      configurable: true,
      value: options.newValue,
      writable: true,
    });
  } else {
    target[options.name] = options.newValue;
  }
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
const getProperty = function getProperty(obj: any, name: string) {
  if (name === '__proto__') {
    if (!hasOwn.call(obj, name)) {
      return void 0;
    } else if (gOPD) {
      // In early versions of node, obj['__proto__'] is buggy when obj has __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
      return gOPD(obj, name)!.value;
    }
  }

  return obj[name];
};

export function extend<T = any>(...args: any[]): T {
  let options;
  let name;
  let src;
  let copy;
  let copyIsArray;
  let clone;
  let target = args[0];
  let i = 1;
  const length = args.length;
  let deep = false;

  // Handle a deep copy situation
  if (typeof target === 'boolean') {
    deep = target;
    target = args[1] || {};
    // skip the boolean and the target
    i = 2;
  }
  if (target === null || target === undefined || (typeof target !== 'object' && typeof target !== 'function')) {
    target = {};
  }

  for (; i < length; ++i) {
    options = args[i];
    // Only deal with non-null/undefined values
    if (options !== null && options !== undefined) {
      // Extend the base object
      for (name in options) {
        src = getProperty(target, name);
        copy = getProperty(options, name);

        // Prevent never-ending loop
        if (target !== copy) {
          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            setProperty(target, { name, newValue: extend(deep, clone, copy) });

            // Don't bring in undefined values
          } else if (typeof copy !== 'undefined') {
            setProperty(target, { name, newValue: copy });
          }
        }
      }
    }
  }

  // Return the modified object
  return target;
}
