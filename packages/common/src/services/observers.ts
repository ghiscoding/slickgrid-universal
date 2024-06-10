/**
 * Collection Observer to watch for any array changes (pop, push, reverse, shift, unshift, splice, sort)
 * and execute the callback when any of the methods are called
 * @param {any[]} inputArray - array you want to listen to
 * @param {Function} callback function that will be called on any change inside array
 */
export function collectionObserver(inputArray: any[], callback: (outputArray: any[], newValues: any[]) => void): void {
  // Add more methods here if you want to listen to them
  const mutationMethods = ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort'];

  mutationMethods.forEach((changeMethod: any) => {
    inputArray[changeMethod] = (...args: any[]) => {
      const res = Array.prototype[changeMethod].apply(inputArray, args);  // call normal behaviour
      callback.apply(inputArray, [inputArray, args]);  // finally call the callback supplied
      return res;
    };
  });
}

/**
 * Object Property Observer and execute the callback whenever any of the object property changes.
 * @param {*} obj - input object
 * @param {String} prop - object property name
 * @param {Function} callback - function that will be called on any change inside array
 */
export function propertyObserver(obj: any, prop: string, callback: (newValue: any, o?: any) => void): void {
  let innerValue = obj[prop];

  Object.defineProperty(obj, prop, {
    configurable: true,
    get() {
      return innerValue;
    },
    set(newValue: any) {
      innerValue = newValue;
      callback.apply(obj, [newValue, obj[prop]]);
    }
  });
}
