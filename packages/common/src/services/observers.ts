/**
 * Collection Observer to watch for any array changes (pop, push, reverse, shift, unshift, splice, sort)
 * and execute the callback when any of the methods are called
 * @param {any[]} arr - array you want to listen to
 * @param {Function} callback function that will be called on any change inside array
 */
export function collectionObserver(arr: any[], callback: (outputArray: any[], newValues: any[]) => void): null | ({ disconnect: () => void; }) {
  if (Array.isArray(arr)) {
    // Add more methods here if you want to listen to them
    const mutationMethods = ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort'];
    const originalActions: Array<{ method: string; action: () => void; }> = [];

    mutationMethods.forEach((changeMethod: any) => {
      arr[changeMethod] = (...args: any[]) => {
        const res = Array.prototype[changeMethod].apply(arr, args);  // call normal behaviour
        originalActions.push({ method: changeMethod, action: res });
        callback.apply(arr, [arr, args]);  // finally call the callback supplied
        return res;
      };
    });

    // reapply original behaviors when disconnecting
    const disconnect = () => mutationMethods.forEach((changeMethod: any) => {
      arr[changeMethod] = () => originalActions[changeMethod].action;
    });

    return { disconnect };
  }

  return null;
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
